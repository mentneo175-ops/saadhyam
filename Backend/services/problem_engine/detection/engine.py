
"""
Problem Detection Engine (Phase 3)
Orchestrates rule evaluation, scoring, problem persistence, observation pipeline,
and empirical evidence attachment for multi-tenant businesses.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    ProblemObservation,
    ProblemEvidence,
    ProblemStatus,
)
from services.problem_engine.detection.base import BaseDetectionRule, DetectionSignal
from services.problem_engine.detection.rules import get_default_detection_rules

logger = logging.getLogger(__name__)


class ProblemDetectionEngine:
    """Orchestrator for business problem detection, scoring, observation, and evidence."""

    def __init__(self, rules: Optional[List[BaseDetectionRule]] = None):
        self.rules = rules or get_default_detection_rules()

    def register_rule(self, rule: BaseDetectionRule) -> None:
        """Register an additional detection rule."""
        self.rules.append(rule)

    async def detect_problems(
        self, db: AsyncSession, user_id: int
    ) -> Dict[str, Any]:
        """
        Executes all detection rules for a tenant, creating or updating
        structured Problem records, Observations, and Evidence items.
        """
        detected_signals: List[DetectionSignal] = []

        # 1. Evaluate all rules
        for rule in self.rules:
            try:
                signals = await rule.evaluate(db, user_id)
                detected_signals.extend(signals)
            except Exception as e:
                logger.error(f"❌ Error evaluating rule '{rule.rule_id}' for user {user_id}: {e}", exc_info=True)

        created_problems = []
        updated_problems = []

        # 2. Process each detection signal idempotently
        for sig in detected_signals:
            # Check for existing active problem for this user with same title / category
            stmt = (
                select(Problem)
                .where(
                    and_(
                        Problem.user_id == user_id,
                        Problem.title == sig.title,
                        Problem.status.notin_([ProblemStatus.SOLVED, ProblemStatus.PARTIALLY_SOLVED, ProblemStatus.FAILED]),
                    )
                )
                .options(
                    selectinload(Problem.observations),
                    selectinload(Problem.evidence_items),
                )
            )
            result = await db.execute(stmt)
            existing_problem = result.scalar_one_or_none()

            if existing_problem:
                # Update existing problem with fresh scoring
                existing_problem.priority_score = sig.priority_score
                existing_problem.severity = sig.severity
                existing_problem.confidence = sig.confidence
                existing_problem.time_sensitivity = sig.time_sensitivity
                existing_problem.summary = sig.summary
                if sig.estimated_impact_inr is not None:
                    existing_problem.estimated_impact_inr = sig.estimated_impact_inr
                if sig.cost_impact_inr is not None:
                    existing_problem.cost_impact_inr = sig.cost_impact_inr
                if sig.recovery_amount_inr is not None:
                    existing_problem.recovery_amount_inr = sig.recovery_amount_inr
                existing_problem.affected_customers_count = sig.affected_customers_count
                existing_problem.affected_employees_count = sig.affected_employees_count
                existing_problem.updated_at = datetime.utcnow()

                problem = existing_problem
                updated_problems.append(problem)
            else:
                # Create new Problem
                problem = Problem(
                    user_id=user_id,
                    title=sig.title,
                    summary=sig.summary,
                    status=ProblemStatus.DETECTED,
                    priority_score=sig.priority_score,
                    severity=sig.severity,
                    category=sig.category,
                    confidence=sig.confidence,
                    estimated_impact_inr=sig.estimated_impact_inr or 0.0,
                    cost_impact_inr=sig.cost_impact_inr or 0.0,
                    recovery_amount_inr=sig.recovery_amount_inr or 0.0,
                    affected_customers_count=sig.affected_customers_count,
                    affected_employees_count=sig.affected_employees_count,
                    time_sensitivity=sig.time_sensitivity,
                    is_opportunity=sig.is_opportunity,
                    is_risk=sig.is_risk,
                    detected_at=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(problem)
                await db.flush()
                created_problems.append(problem)

            # 3. Create ProblemObservation (if not already recorded with same text)
            obs_dict = sig.observation.to_dict()
            obs_stmt = select(ProblemObservation).where(
                and_(
                    ProblemObservation.problem_id == problem.id,
                    ProblemObservation.observation_text == obs_dict["observation_text"],
                )
            )
            obs_res = await db.execute(obs_stmt)
            existing_obs = obs_res.scalar_one_or_none()

            if not existing_obs:
                observation = ProblemObservation(
                    problem_id=problem.id,
                    observation_text=obs_dict["observation_text"],
                    impact_summary=obs_dict["impact_summary"],
                    hypothesis=obs_dict["hypothesis"],
                    investigation_details=obs_dict["investigation_details"],
                    created_at=datetime.utcnow(),
                )
                db.add(observation)

            # 4. Attach ProblemEvidence items idempotently
            for ev_item in sig.evidence_items:
                ev_dict = ev_item.to_dict()
                ev_stmt = select(ProblemEvidence).where(
                    and_(
                        ProblemEvidence.problem_id == problem.id,
                        ProblemEvidence.source_system == ev_dict["source_system"],
                        ProblemEvidence.description == ev_dict["description"],
                    )
                )
                ev_res = await db.execute(ev_stmt)
                existing_ev = ev_res.scalar_one_or_none()

                if not existing_ev:
                    evidence = ProblemEvidence(
                        problem_id=problem.id,
                        evidence_type=ev_dict["evidence_type"],
                        source_system=ev_dict["source_system"],
                        metric_name=ev_dict["metric_name"],
                        value_before=ev_dict["value_before"],
                        value_current=ev_dict["value_current"],
                        description=ev_dict["description"],
                        raw_data=ev_dict["raw_data"],
                        recorded_at=ev_dict["recorded_at"] or datetime.utcnow(),
                    )
                    db.add(evidence)

        await db.commit()

        # Build response payload
        total_active = len(created_problems) + len(updated_problems)
        return {
            "success": True,
            "user_id": user_id,
            "rules_evaluated": len(self.rules),
            "signals_detected": len(detected_signals),
            "problems_created": len(created_problems),
            "problems_updated": len(updated_problems),
            "total_active_problems": total_active,
            "problems": [
                {
                    "id": p.id,
                    "title": p.title,
                    "summary": p.summary,
                    "category": p.category.value if hasattr(p.category, "value") else str(p.category),
                    "severity": p.severity.value if hasattr(p.severity, "value") else str(p.severity),
                    "priority_score": p.priority_score,
                    "confidence": p.confidence,
                    "status": p.status.value if hasattr(p.status, "value") else str(p.status),
                    "estimated_impact_inr": p.estimated_impact_inr,
                    "affected_customers_count": p.affected_customers_count,
                    "time_sensitivity": p.time_sensitivity.value if hasattr(p.time_sensitivity, "value") else str(p.time_sensitivity),
                    "detected_at": p.detected_at.isoformat() if p.detected_at else None,
                }
                for p in (created_problems + updated_problems)
            ],
        }


# Global singleton instance of the detection engine
problem_detection_engine = ProblemDetectionEngine()
