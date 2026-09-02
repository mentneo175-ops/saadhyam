"""
Voice AI & Lead CRM Detection Rules (Phase 3)
Implements deterministic rules for Voice AI call failure spikes and lead churn.
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


class VoiceCallFailureRule(BaseDetectionRule):
    """Detects unexpected voice AI call disconnections or telephony failure spikes."""

    @property
    def rule_id(self) -> str:
        return "RULE_VOICE_CALL_FAILURE_SPIKE"

    @property
    def name(self) -> str:
        return "Voice AI Telephony Call Failure Spike"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.ANOMALY

    @property
    def description(self) -> str:
        return "Monitors inbound and outbound voice agent call sessions for abnormal failure or drop rates."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # Fetch failed call events
        ev_stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.source == "voice_crm",
                BusinessEvent.event_name == "voice.call_failed",
            )
        )
        ev_res = await db.execute(ev_stmt)
        failed_events = ev_res.scalars().all()

        # Fetch call entities
        call_stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == "call",
            )
        )
        call_res = await db.execute(call_stmt)
        calls = call_res.scalars().all()
        failed_calls = [c for c in calls if str(c.status).upper() in ("FAILED", "DISCONNECTED", "NO_ANSWER")]

        total_failures = max(len(failed_events), len(failed_calls))

        if total_failures > 0:
            severity = ProblemSeverity.HIGH if total_failures >= 3 else ProblemSeverity.MEDIUM
            time_sens = TimeSensitivity.HIGH if total_failures >= 3 else TimeSensitivity.MEDIUM

            evidence_items = []
            for ev in failed_events[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="voice_crm",
                        metric_name="call_status",
                        value_current="FAILED",
                        description=f"Voice call session #{ev.entity_id} failed during connection or streaming.",
                        raw_data=ev.payload,
                        recorded_at=ev.occurred_at,
                    )
                )

            for cl in failed_calls[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.WORKFLOW_BOTTLENECK,
                        source_system="voice_crm",
                        metric_name="session_status",
                        value_current=cl.status,
                        description=f"Call entity {cl.display_name} ended in failure status.",
                        raw_data=cl.properties,
                        recorded_at=cl.created_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=severity,
                time_sensitivity=time_sens,
                affected_customers_count=total_failures,
                is_risk=True,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=len(failed_events) > 0,
                has_entity_state=len(failed_calls) > 0,
            )

            obs = DetectionObservation(
                observation_text=f"Detected {total_failures} failed Voice AI call session(s).",
                impact_summary=f"{total_failures} potential prospects or customers were disconnected or unable to reach voice assistance.",
                hypothesis="SIP trunk connection instability, SIP endpoint misconfiguration, or voice synthesis WebSocket timeouts.",
                investigation_details="Check Twilio/SIP gateway connection logs, voice synthesizer latency metrics, and agent audio session logs.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"ANOMALY:voice_leads:call_failure_spike:{user_id}",
                category=self.category,
                title=f"Voice AI Telephony Failure Spike ({total_failures} calls)",
                summary=f"{total_failures} voice AI call session(s) failed due to connection drops or telephony errors.",
                severity=severity,
                time_sensitivity=time_sens,
                confidence=confidence,
                priority_score=priority,
                affected_customers_count=total_failures,
                is_opportunity=False,
                is_risk=True,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals


class LeadLossRateRule(BaseDetectionRule):
    """Detects lost leads and sales pipeline drop-offs."""

    @property
    def rule_id(self) -> str:
        return "RULE_LEAD_LOST_RATE"

    @property
    def name(self) -> str:
        return "High Lead Drop-Off & Churn Rate"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.CUSTOMER_CHURN

    @property
    def description(self) -> str:
        return "Identifies leads that marked as lost, unreachable, or dropped out of the sales funnel."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # Fetch lead entities
        lead_stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == "lead",
            )
        )
        lead_res = await db.execute(lead_stmt)
        leads = lead_res.scalars().all()

        lost_leads = [l for l in leads if str(l.status).upper() in ("LOST", "UNREACHABLE", "REJECTED", "FAILED")]

        # Fetch lead.lost events
        ev_stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.source == "voice_crm",
                BusinessEvent.event_name == "lead.lost",
            )
        )
        ev_res = await db.execute(ev_stmt)
        lost_events = ev_res.scalars().all()

        total_lost = max(len(lost_leads), len(lost_events))

        if total_lost > 0:
            severity = ProblemSeverity.HIGH if total_lost >= 5 else ProblemSeverity.MEDIUM
            time_sens = TimeSensitivity.HIGH

            evidence_items = []
            for ll in lost_leads[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.CUSTOMER_SENTIMENT,
                        source_system="voice_crm",
                        metric_name="lead_status",
                        value_before="NEW",
                        value_current=ll.status,
                        description=f"Lead {ll.display_name} marked as {ll.status}.",
                        raw_data=ll.properties,
                        recorded_at=ll.created_at,
                    )
                )

            for le in lost_events[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="voice_crm",
                        metric_name="lead_lost_event",
                        value_current=str(le.entity_id),
                        description=f"Lead drop-off event for lead ID #{le.entity_id}.",
                        raw_data=le.payload,
                        recorded_at=le.occurred_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=severity,
                time_sensitivity=time_sens,
                affected_customers_count=total_lost,
                is_risk=True,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=len(lost_events) > 0,
                has_entity_state=len(lost_leads) > 0,
            )

            obs = DetectionObservation(
                observation_text=f"Detected {total_lost} lost lead(s) in the sales funnel.",
                impact_summary=f"Loss of {total_lost} pipeline opportunities impacting new customer acquisition.",
                hypothesis="Delayed sales outreach, uncompetitive pricing objection, or weak lead qualification criteria.",
                investigation_details="Analyze customer objections in voice call recordings, follow-up response latency, and lead source channels.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"CUSTOMER_CHURN:voice_leads:lead_lost:{user_id}",
                category=self.category,
                title=f"Sales Lead Churn & Drop-Off ({total_lost} leads)",
                summary=f"{total_lost} sales prospect(s) dropped out of the pipeline without converting.",
                severity=severity,
                time_sensitivity=time_sens,
                confidence=confidence,
                priority_score=priority,
                affected_customers_count=total_lost,
                is_opportunity=False,
                is_risk=True,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals
