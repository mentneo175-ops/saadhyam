"""
Root Cause Analysis Engine (Phase 4)
Analyzes empirical evidence, observations, and context graph topologies
to distinguish symptoms, hypotheses, and supported root causes.
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
    ProblemRootCause,
    ProblemStatus,
    ProblemCategory,
)

logger = logging.getLogger(__name__)


class RootCauseAnalyzer:
    """Service to diagnose business problem root causes from empirical evidence."""

    @classmethod
    async def analyze_problem(
        cls, db: AsyncSession, user_id: int, problem_id: int
    ) -> List[ProblemRootCause]:
        """
        Executes root cause investigation for a problem belonging to current user.
        Grounded in actual evidence and observations; distinguishes hypothesis vs supported cause.
        """
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.id == problem_id,
                    Problem.user_id == user_id,
                )
            )
            .options(
                selectinload(Problem.observations),
                selectinload(Problem.evidence_items),
                selectinload(Problem.root_causes),
            )
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem #{problem_id} not found for user #{user_id}")

        evidence_count = len(problem.evidence_items)
        obs = problem.observations[0] if problem.observations else None

        root_causes_data: List[Dict[str, Any]] = []

        # Category-driven deterministic evidence diagnosis
        if problem.category == ProblemCategory.REVENUE_LEAKAGE:
            failed_evs = [e for e in problem.evidence_items if e.source_system == "orders"]
            has_amount = problem.estimated_impact_inr > 0
            confidence = 0.92 if (failed_evs and has_amount) else 0.75

            root_causes_data.append({
                "diagnosis": "Unrecovered checkout drop-off and payment authorization failures without automated retry or recovery messaging.",
                "confidence": confidence,
                "is_primary": True,
                "contributing_factors": {
                    "failed_transaction_count": len(failed_evs),
                    "total_leaked_inr": problem.estimated_impact_inr,
                    "missing_recovery_workflow": True,
                    "evidence_sources": [e.source_system for e in problem.evidence_items],
                },
                "alternative_causes": [
                    "Payment gateway provider outage or latency spike.",
                    "Customer deliberate cart abandonment or price sensitivity.",
                ],
            })

        elif problem.category == ProblemCategory.ANOMALY:
            telephony_evs = [e for e in problem.evidence_items if e.source_system == "voice_crm"]
            social_evs = [e for e in problem.evidence_items if e.source_system == "linkedin"]

            if telephony_evs:
                root_causes_data.append({
                    "diagnosis": "SIP trunk connection drops or telephony gateway network packet loss during active call streaming.",
                    "confidence": 0.88 if len(telephony_evs) >= 1 else 0.65,
                    "is_primary": True,
                    "contributing_factors": {
                        "telephony_errors_recorded": len(telephony_evs),
                        "affected_calls": problem.affected_customers_count,
                    },
                    "alternative_causes": [
                        "Voice synthesis (TTS/STT) WebSocket latency exceeding timeout threshold.",
                        "Customer cellular carrier disconnection.",
                    ],
                })
            elif social_evs:
                root_causes_data.append({
                    "diagnosis": "LinkedIn API authorization token expiration or media asset validation rejection.",
                    "confidence": 0.85,
                    "is_primary": True,
                    "contributing_factors": {
                        "failed_posts": len(social_evs),
                    },
                    "alternative_causes": [
                        "LinkedIn rate limit threshold exceeded.",
                    ],
                })
            else:
                root_causes_data.append({
                    "diagnosis": "Operational system anomaly detected by telemetry deviation.",
                    "confidence": 0.70,
                    "is_primary": True,
                    "contributing_factors": {"evidence_count": evidence_count},
                    "alternative_causes": ["Transient platform downtime."],
                })

        elif problem.category == ProblemCategory.CUSTOMER_CHURN:
            lost_evs = [e for e in problem.evidence_items if e.source_system == "voice_crm"]
            root_causes_data.append({
                "diagnosis": "Delayed sales follow-up and lack of multi-channel re-engagement for high-intent unconverted leads.",
                "confidence": 0.86 if lost_evs else 0.70,
                "is_primary": True,
                "contributing_factors": {
                    "lost_leads_count": problem.affected_customers_count,
                    "single_channel_dependency": True,
                },
                "alternative_causes": [
                    "Unqualified inbound lead traffic with low buying intent.",
                    "Competitor pricing pressure.",
                ],
            })

        elif problem.category == ProblemCategory.BOTTLENECK:
            interview_evs = [e for e in problem.evidence_items if e.source_system == "hr_operations"]
            root_causes_data.append({
                "diagnosis": "Absence of automated multi-channel (WhatsApp/SMS) interview appointment confirmations and reminder sequences.",
                "confidence": 0.90 if interview_evs else 0.72,
                "is_primary": True,
                "contributing_factors": {
                    "no_show_appointments": problem.affected_employees_count or len(interview_evs),
                    "manual_scheduling_gap": True,
                },
                "alternative_causes": [
                    "Candidate job offer acceptance from another employer.",
                    "Calendar invite delivered to candidate spam folder.",
                ],
            })

        elif problem.category == ProblemCategory.PRODUCTIVITY:
            task_evs = [e for e in problem.evidence_items if e.source_system == "operations_analytics"]
            root_causes_data.append({
                "diagnosis": "High volume of repetitive manual operational workflows creating team execution backlog.",
                "confidence": 0.87 if task_evs else 0.70,
                "is_primary": True,
                "contributing_factors": {
                    "backlog_task_count": problem.affected_employees_count or len(task_evs),
                    "manual_process_friction": True,
                },
                "alternative_causes": [
                    "Understaffed team capacity relative to workload.",
                    "Ambiguous task priority guidelines.",
                ],
            })

        elif problem.category == ProblemCategory.GOAL_DEVIATION:
            metric_evs = [e for e in problem.evidence_items if e.source_system == "growth_analytics"]
            root_causes_data.append({
                "diagnosis": "Systemic drop in task completion rate caused by cross-department operational roadblocks.",
                "confidence": 0.85 if metric_evs else 0.68,
                "is_primary": True,
                "contributing_factors": {
                    "performance_drop_detected": True,
                    "growth_deviation_events": len(metric_evs),
                },
                "alternative_causes": [
                    "Unrealistic daily task quota targets.",
                ],
            })

        elif problem.category == ProblemCategory.RISK:
            whatsapp_evs = [e for e in problem.evidence_items if e.source_system == "whatsapp"]
            root_causes_data.append({
                "diagnosis": "WhatsApp Business Cloud API messaging limit or template quality restriction blocking broadcast dispatch.",
                "confidence": 0.88 if whatsapp_evs else 0.70,
                "is_primary": True,
                "contributing_factors": {
                    "failed_campaign_events": len(whatsapp_evs),
                },
                "alternative_causes": [
                    "Meta webhook endpoint timeout.",
                    "Account payment method expiration.",
                ],
            })

        else:
            root_causes_data.append({
                "diagnosis": obs.hypothesis if obs else "General operational friction point requiring manual audit.",
                "confidence": 0.65,
                "is_primary": True,
                "contributing_factors": {"evidence_count": evidence_count},
                "alternative_causes": ["Unknown external factor."],
            })

        # Persist root causes idempotently
        persisted_causes = []
        for rc_item in root_causes_data:
            existing_rc = next((rc for rc in problem.root_causes if rc.diagnosis == rc_item["diagnosis"]), None)
            if existing_rc:
                existing_rc.confidence = rc_item["confidence"]
                existing_rc.contributing_factors = rc_item["contributing_factors"]
                existing_rc.alternative_causes = rc_item["alternative_causes"]
                persisted_causes.append(existing_rc)
            else:
                rc = ProblemRootCause(
                    problem_id=problem.id,
                    diagnosis=rc_item["diagnosis"],
                    confidence=rc_item["confidence"],
                    contributing_factors=rc_item["contributing_factors"],
                    is_primary=rc_item["is_primary"],
                    alternative_causes=rc_item["alternative_causes"],
                    identified_at=datetime.utcnow(),
                )
                db.add(rc)
                persisted_causes.append(rc)

        # Progress lifecycle state to INVESTIGATING if currently DETECTED
        if problem.status == ProblemStatus.DETECTED:
            problem.status = ProblemStatus.INVESTIGATING
            problem.updated_at = datetime.utcnow()

        await db.commit()
        return persisted_causes
