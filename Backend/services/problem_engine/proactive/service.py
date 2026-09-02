"""
Proactive & Event-Driven Problem Discovery Service (Phase 8)
Orchestrates:
1. Event Ingestion Pipeline: Ingests real-time events, normalizes into BusinessEvent, records audit log.
2. Proactive Detection Runner: Evaluates detection rules without manual user triggers.
3. Stable Fingerprint-Based Deduplication: Re-identifies active issues and updates existing Problem records.
4. Dynamic Priority Recalculation: Adjusts priority scores and escalates severities based on accumulating evidence.
5. Scheduled Discovery Runner: Periodically syncs connectors and evaluates engine rules.
6. Exponential Backoff & Retry Logic: Resiliently handles transient sync and DB failures.
"""

import logging
import asyncio
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    ProblemObservation,
    ProblemEvidence,
    BusinessEvent,
    ProblemStatus,
    ProblemSeverity,
    AuditEventType,
)
from services.problem_engine.normalization import BusinessDataNormalizer
from services.problem_engine.detection.engine import problem_detection_engine
from services.problem_engine.proactive.audit import ProblemAuditLogger
from services.problem_engine.sync_service import BusinessDataSyncService

logger = logging.getLogger(__name__)


class ProactiveDiscoveryService:
    """Service to handle real-time business events and proactive anomaly/problem discovery."""

    @staticmethod
    def generate_fingerprint(user_id: int, category: str, identifier: str) -> str:
        """
        Computes a stable, deterministic 32-char SHA256 fingerprint signature for problem deduplication.
        """
        raw = f"{user_id}:{category.upper().strip()}:{identifier.lower().strip()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]

    @classmethod
    async def ingest_event(
        cls,
        db: AsyncSession,
        user_id: int,
        event_name: str,
        source: str,
        entity_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        occurred_at: Optional[datetime] = None,
        trigger_detection: bool = True,
    ) -> Dict[str, Any]:
        """
        Ingests a real-time event from an external webhook or internal domain service.
        Normalizes into BusinessEvent, logs audit, and optionally evaluates proactive detection.
        """
        logger.info(f"📥 Ingesting business event '{event_name}' for user {user_id} from '{source}'")

        # 1. Normalize and record BusinessEvent
        business_event, was_created = await BusinessDataNormalizer.record_event(
            db=db,
            user_id=user_id,
            source=source,
            event_name=event_name,
            entity_id=entity_id,
            payload=payload or {},
            occurred_at=occurred_at,
        )
        await db.commit()

        # 2. Record EVENT_RECEIVED in Audit Ledger
        await ProblemAuditLogger.record_audit_event(
            db=db,
            user_id=user_id,
            event_type=AuditEventType.EVENT_RECEIVED,
            details={
                "event_id": business_event.id,
                "event_name": event_name,
                "source": source,
                "entity_id": entity_id,
                "was_created": was_created,
            },
        )
        await db.commit()

        detection_result = None
        if trigger_detection:
            # Proactively evaluate detection rules for this tenant
            detection_result = await cls.evaluate_proactive_detection(
                db=db, user_id=user_id, triggered_by_event=event_name
            )

        return {
            "success": True,
            "event_id": business_event.id,
            "event_name": event_name,
            "was_created": was_created,
            "detection_triggered": trigger_detection,
            "detection_result": detection_result,
        }

    @classmethod
    async def evaluate_proactive_detection(
        cls,
        db: AsyncSession,
        user_id: int,
        triggered_by_event: Optional[str] = None,
        max_retries: int = 3,
        base_backoff_sec: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Runs proactive detection with stable fingerprint deduplication, dynamic priority
        recalculation, and exponential backoff retry on transient errors.
        """
        attempt = 0
        last_exception = None

        while attempt < max_retries:
            attempt += 1
            try:
                # Log audit for detection execution
                await ProblemAuditLogger.record_audit_event(
                    db=db,
                    user_id=user_id,
                    event_type=AuditEventType.DETECTION_EXECUTED,
                    details={
                        "triggered_by_event": triggered_by_event,
                        "attempt": attempt,
                    },
                )

                # 1. Evaluate registered rules
                rules = problem_detection_engine.get_registered_rules()
                detected_signals = []
                for rule in rules:
                    try:
                        signals = await rule.evaluate(db, user_id)
                        detected_signals.extend(signals)
                    except Exception as rule_err:
                        logger.error(
                            f"❌ Error evaluating rule '{rule.rule_id}' for user {user_id}: {rule_err}",
                            exc_info=True,
                        )

                created_problems = []
                updated_problems = []

                # 2. Process detected signals with fingerprint deduplication
                for sig in detected_signals:
                    category_str = sig.category.value if hasattr(sig.category, "value") else str(sig.category)
                    fingerprint = cls.generate_fingerprint(
                        user_id, category_str, getattr(sig, "fingerprint", None) or sig.title
                    )

                    # Look for active existing problem by fingerprint or exact title or same category
                    stmt = (
                        select(Problem)
                        .where(
                            and_(
                                Problem.user_id == user_id,
                                (Problem.fingerprint == fingerprint) | (Problem.title == sig.title) | (Problem.category == sig.category),
                                Problem.status.notin_([
                                    ProblemStatus.SOLVED,
                                    ProblemStatus.PARTIALLY_SOLVED,
                                    ProblemStatus.FAILED,
                                ]),
                            )
                        )
                        .options(
                            selectinload(Problem.observations),
                            selectinload(Problem.evidence_items),
                        )
                    )
                    res = await db.execute(stmt)
                    existing_problem = res.scalar_one_or_none()

                    if existing_problem:
                        # --- UPDATE EXISTING PROBLEM & DYNAMIC PRIORITY RECALCULATION ---
                        old_priority = existing_problem.priority_score
                        old_severity = existing_problem.severity

                        # Dynamic Priority: Adjust based on cumulative evidence & new signal score
                        impact_delta = (sig.estimated_impact_inr or 0.0)
                        if impact_delta > (existing_problem.estimated_impact_inr or 0.0):
                            existing_problem.estimated_impact_inr = impact_delta

                        # Recalculate priority score
                        recalculated_priority = min(
                            100,
                            max(old_priority, sig.priority_score) + min(15, len(existing_problem.evidence_items) * 2),
                        )
                        existing_problem.priority_score = recalculated_priority

                        # Dynamic Severity escalation
                        if recalculated_priority >= 85:
                            existing_problem.severity = ProblemSeverity.CRITICAL
                        elif recalculated_priority >= 70:
                            existing_problem.severity = ProblemSeverity.HIGH
                        else:
                            existing_problem.severity = sig.severity

                        existing_problem.confidence = max(existing_problem.confidence, sig.confidence)
                        existing_problem.updated_at = datetime.now(timezone.utc)
                        if not existing_problem.fingerprint:
                            existing_problem.fingerprint = fingerprint

                        # Append fresh observation if text differs
                        obs_texts = [o.observation_text for o in existing_problem.observations]
                        if sig.observation and sig.observation.observation_text not in obs_texts:
                            new_obs = ProblemObservation(
                                problem_id=existing_problem.id,
                                observation_text=sig.observation.observation_text,
                                impact_summary=sig.observation.impact_summary,
                                hypothesis=sig.observation.hypothesis,
                                investigation_details=sig.observation.investigation_details,
                            )
                            db.add(new_obs)

                        # Append fresh evidence items
                        existing_evidence_keys = {
                            (e.evidence_type, e.source_system, e.description) for e in existing_problem.evidence_items
                        }
                        added_evidence_count = 0
                        for ev in sig.evidence_items:
                            ev_key = (ev.evidence_type, ev.source_system, ev.description)
                            if ev_key not in existing_evidence_keys:
                                new_ev = ProblemEvidence(
                                    problem_id=existing_problem.id,
                                    evidence_type=ev.evidence_type,
                                    source_system=ev.source_system,
                                    metric_name=ev.metric_name,
                                    value_before=str(ev.value_before) if ev.value_before is not None else None,
                                    value_current=str(ev.value_current) if ev.value_current is not None else None,
                                    description=ev.description,
                                    raw_data=ev.raw_data or {},
                                    recorded_at=ev.recorded_at or datetime.now(timezone.utc),
                                )
                                db.add(new_ev)
                                added_evidence_count += 1

                        await db.flush()

                        # Record PROBLEM_UPDATED and PRIORITY_RECALCULATED audits
                        await ProblemAuditLogger.record_audit_event(
                            db=db,
                            user_id=user_id,
                            event_type=AuditEventType.PROBLEM_UPDATED,
                            problem_id=existing_problem.id,
                            details={
                                "added_evidence_count": added_evidence_count,
                                "fingerprint": fingerprint,
                            },
                        )

                        if recalculated_priority != old_priority or existing_problem.severity != old_severity:
                            await ProblemAuditLogger.record_audit_event(
                                db=db,
                                user_id=user_id,
                                event_type=AuditEventType.PRIORITY_RECALCULATED,
                                problem_id=existing_problem.id,
                                details={
                                    "old_priority": old_priority,
                                    "new_priority": recalculated_priority,
                                    "old_severity": old_severity.value if hasattr(old_severity, "value") else str(old_severity),
                                    "new_severity": existing_problem.severity.value if hasattr(existing_problem.severity, "value") else str(existing_problem.severity),
                                },
                            )

                        updated_problems.append(existing_problem.id)

                    else:
                        # --- CREATE NEW PROBLEM RECORD ---
                        new_problem = Problem(
                            user_id=user_id,
                            title=sig.title,
                            summary=sig.summary,
                            category=sig.category,
                            severity=sig.severity,
                            priority_score=sig.priority_score,
                            confidence=sig.confidence,
                            status=ProblemStatus.DETECTED,
                            time_sensitivity=sig.time_sensitivity,
                            estimated_impact_inr=sig.estimated_impact_inr,
                            cost_impact_inr=sig.cost_impact_inr,
                            recovery_amount_inr=sig.recovery_amount_inr,
                            affected_customers_count=sig.affected_customers_count,
                            affected_employees_count=sig.affected_employees_count,
                            is_opportunity=sig.is_opportunity,
                            is_risk=sig.is_risk,
                            fingerprint=fingerprint,
                        )
                        db.add(new_problem)
                        await db.flush()

                        # Attach Observation
                        if sig.observation:
                            obs = ProblemObservation(
                                problem_id=new_problem.id,
                                observation_text=sig.observation.observation_text,
                                impact_summary=sig.observation.impact_summary,
                                hypothesis=sig.observation.hypothesis,
                                investigation_details=sig.observation.investigation_details,
                            )
                            db.add(obs)

                        # Attach Evidence Items
                        for ev in sig.evidence_items:
                            pe = ProblemEvidence(
                                problem_id=new_problem.id,
                                evidence_type=ev.evidence_type,
                                source_system=ev.source_system,
                                metric_name=ev.metric_name,
                                value_before=str(ev.value_before) if ev.value_before is not None else None,
                                value_current=str(ev.value_current) if ev.value_current is not None else None,
                                description=ev.description,
                                raw_data=ev.raw_data or {},
                                recorded_at=ev.recorded_at or datetime.now(timezone.utc),
                            )
                            db.add(pe)

                        await db.flush()

                        # Record PROBLEM_CREATED audit
                        await ProblemAuditLogger.record_audit_event(
                            db=db,
                            user_id=user_id,
                            event_type=AuditEventType.PROBLEM_CREATED,
                            problem_id=new_problem.id,
                            details={
                                "title": sig.title,
                                "category": category_str,
                                "severity": sig.severity.value if hasattr(sig.severity, "value") else str(sig.severity),
                                "priority_score": sig.priority_score,
                                "fingerprint": fingerprint,
                            },
                        )
                        created_problems.append(new_problem.id)

                await db.commit()

                return {
                    "success": True,
                    "attempt": attempt,
                    "signals_evaluated": len(detected_signals),
                    "created_count": len(created_problems),
                    "updated_count": len(updated_problems),
                    "problems_created": created_problems,
                    "problems_updated": updated_problems,
                }

            except Exception as e:
                last_exception = e
                await db.rollback()
                logger.warning(
                    f"⚠️ Proactive detection attempt {attempt}/{max_retries} failed for user {user_id}: {e}"
                )

                if attempt < max_retries:
                    # Record RETRY_ATTEMPT audit
                    try:
                        await ProblemAuditLogger.record_audit_event(
                            db=db,
                            user_id=user_id,
                            event_type=AuditEventType.RETRY_ATTEMPT,
                            details={
                                "attempt": attempt,
                                "error": str(e),
                            },
                        )
                        await db.commit()
                    except Exception:
                        pass

                    sleep_time = base_backoff_sec * (2 ** (attempt - 1))
                    await asyncio.sleep(sleep_time)
                else:
                    # Record FAILURE audit
                    try:
                        await ProblemAuditLogger.record_audit_event(
                            db=db,
                            user_id=user_id,
                            event_type=AuditEventType.FAILURE,
                            details={
                                "total_attempts": attempt,
                                "error": str(e),
                            },
                        )
                        await db.commit()
                    except Exception:
                        pass

        logger.error(f"❌ Proactive detection completely failed for user {user_id}: {last_exception}", exc_info=True)
        return {
            "success": False,
            "error": str(last_exception),
            "attempts": attempt,
        }

    @classmethod
    async def run_scheduled_discovery(
        cls,
        db: AsyncSession,
        user_id: int,
    ) -> Dict[str, Any]:
        """
        Entrypoint for periodic background scheduler (e.g. hourly or daily).
        Syncs connectors and triggers proactive detection.
        """
        logger.info(f"⏰ [Scheduler] Starting periodic discovery scan for user {user_id}")

        # 1. Sync all registered connectors
        sync_results = await BusinessDataSyncService.sync_all_connectors(db=db, user_id=user_id)

        # 2. Run proactive detection
        detection_results = await cls.evaluate_proactive_detection(
            db=db,
            user_id=user_id,
            triggered_by_event="scheduler.periodic_scan",
        )

        # 3. Record SCAN_COMPLETED audit
        sync_summary = {
            r.get("connector", f"conn_{i}"): r.get("status")
            for i, r in enumerate(sync_results)
        } if isinstance(sync_results, list) else sync_results

        await ProblemAuditLogger.record_audit_event(
            db=db,
            user_id=user_id,
            event_type=AuditEventType.SCAN_COMPLETED,
            details={
                "sync_results": sync_summary,
                "detection_created": detection_results.get("created_count", 0),
                "detection_updated": detection_results.get("updated_count", 0),
            },
        )
        await db.commit()

        return {
            "success": True,
            "user_id": user_id,
            "sync_results": sync_results,
            "detection": detection_results,
            "scanned_at": datetime.now(timezone.utc).isoformat(),
        }
