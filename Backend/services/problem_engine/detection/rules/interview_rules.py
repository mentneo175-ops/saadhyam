"""
HR & Recruitment Interview Detection Rules (Phase 3)
Implements deterministic rules for candidate interview no-shows and scheduling bottlenecks.
"""

from typing import List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.problem_engine import (
    ProblemCategory,
    ProblemSeverity,
    TimeSensitivity,
    EvidenceType,
    BusinessEntity,
    BusinessEvent,
)
from services.problem_engine.detection.base import (
    BaseDetectionRule,
    DetectionSignal,
    DetectionObservation,
    DetectionEvidence,
)
from services.problem_engine.detection.scoring import ProblemScoringEngine


class InterviewNoShowRule(BaseDetectionRule):
    """Detects candidate interview no-shows and recruitment bottlenecks."""

    @property
    def rule_id(self) -> str:
        return "RULE_INTERVIEW_NO_SHOW_RATE"

    @property
    def name(self) -> str:
        return "Candidate Interview No-Show & Scheduling Bottleneck"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.BOTTLENECK

    @property
    def description(self) -> str:
        return "Identifies recruitment pipeline bottlenecks caused by candidate interview no-shows and cancellations."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # Fetch interview entities
        int_stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == "interview",
            )
        )
        int_res = await db.execute(int_stmt)
        interviews = int_res.scalars().all()
        no_show_interviews = [it for it in interviews if str(it.status).upper() in ("NO_SHOW", "CANCELLED")]

        # Fetch interview events
        ev_stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.source == "interview_scheduler",
                BusinessEvent.event_name.in_(["interview.no_show", "interview.cancelled"]),
            )
        )
        ev_res = await db.execute(ev_stmt)
        no_show_events = ev_res.scalars().all()

        total_no_shows = max(len(no_show_interviews), len(no_show_events))

        if total_no_shows > 0:
            severity = ProblemSeverity.MEDIUM
            time_sens = TimeSensitivity.MEDIUM

            evidence_items = []
            for nsi in no_show_interviews[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.WORKFLOW_BOTTLENECK,
                        source_system="hr_operations",
                        metric_name="interview_status",
                        value_before="SCHEDULED",
                        value_current=nsi.status,
                        description=f"Candidate {nsi.properties.get('candidate_name', 'Unknown')} ({nsi.properties.get('job_role', 'Role')}) marked as {nsi.status}.",
                        raw_data=nsi.properties,
                        recorded_at=nsi.created_at,
                    )
                )

            for nse in no_show_events[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="hr_operations",
                        metric_name="scheduling_event",
                        value_current=nse.event_name,
                        description=f"Interview {nse.event_name} event recorded for candidate #{nse.entity_id}.",
                        raw_data=nse.payload,
                        recorded_at=nse.occurred_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=severity,
                time_sensitivity=time_sens,
                affected_employees_count=total_no_shows,
                is_risk=False,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=len(no_show_events) > 0,
                has_entity_state=len(no_show_interviews) > 0,
            )

            obs = DetectionObservation(
                observation_text=f"Detected {total_no_shows} candidate interview no-show(s) or late cancellation(s).",
                impact_summary="Wasted hiring manager time and delayed talent acquisition for open headcount positions.",
                hypothesis="Lack of automated SMS/WhatsApp interview reminders, prolonged scheduling friction, or poor candidate preparation.",
                investigation_details="Audit calendar invitation delivery status, candidate confirmation timestamps, and automated reminder sequences.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"BOTTLENECK:hr_operations:interview_no_show:{user_id}",
                category=self.category,
                title=f"Recruitment Interview No-Shows ({total_no_shows} candidates)",
                summary=f"{total_no_shows} candidate interview(s) failed to take place due to no-shows or late cancellations.",
                severity=severity,
                time_sensitivity=time_sens,
                confidence=confidence,
                priority_score=priority,
                affected_employees_count=total_no_shows,
                is_opportunity=False,
                is_risk=False,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals
