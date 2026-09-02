"""
Messaging & Social Channel Detection Rules (Phase 3)
Implements deterministic rules for WhatsApp and LinkedIn delivery failures.
"""

from typing import List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.problem_engine import (
    ProblemCategory,
    ProblemSeverity,
    TimeSensitivity,
    EvidenceType,
    BusinessEvent,
)
from services.problem_engine.detection.base import (
    BaseDetectionRule,
    DetectionSignal,
    DetectionObservation,
    DetectionEvidence,
)
from services.problem_engine.detection.scoring import ProblemScoringEngine


class WhatsAppCampaignFailureRule(BaseDetectionRule):
    """Detects failed WhatsApp marketing broadcasts."""

    @property
    def rule_id(self) -> str:
        return "RULE_WHATSAPP_CAMPAIGN_FAILURE"

    @property
    def name(self) -> str:
        return "WhatsApp Campaign Delivery Failure"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.RISK

    @property
    def description(self) -> str:
        return "Identifies WhatsApp broadcast campaigns that failed during execution."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.source == "whatsapp",
                BusinessEvent.event_name == "whatsapp.campaign_failed",
            )
        )
        res = await db.execute(stmt)
        failed_evs = res.scalars().all()

        if failed_evs:
            evidence_items = []
            for ev in failed_evs[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="whatsapp",
                        metric_name="campaign_failed",
                        value_current=str(ev.entity_id),
                        description=f"WhatsApp broadcast campaign #{ev.entity_id} failed to dispatch.",
                        raw_data=ev.payload,
                        recorded_at=ev.occurred_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=ProblemSeverity.HIGH,
                time_sensitivity=TimeSensitivity.HIGH,
                is_risk=True,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=True,
            )

            obs = DetectionObservation(
                observation_text=f"Detected {len(failed_evs)} failed WhatsApp broadcast campaign(s).",
                impact_summary="Marketing outreach failed to reach targeted leads and customers, stalling campaign momentum.",
                hypothesis="Meta Cloud API token expiration, template rejection, or rate limiting on the WABA account.",
                investigation_details="Check Meta Developer portal for WABA phone number tier status, template status, and error payload codes.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"RISK:whatsapp:campaign_failure:{user_id}",
                category=self.category,
                title=f"WhatsApp Campaign Delivery Failure ({len(failed_evs)} campaigns)",
                summary=f"{len(failed_evs)} WhatsApp marketing campaign(s) failed during delivery.",
                severity=ProblemSeverity.HIGH,
                time_sensitivity=TimeSensitivity.HIGH,
                confidence=confidence,
                priority_score=priority,
                is_opportunity=False,
                is_risk=True,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals


class LinkedInPublishFailureRule(BaseDetectionRule):
    """Detects failed LinkedIn post publications."""

    @property
    def rule_id(self) -> str:
        return "RULE_LINKEDIN_PUBLISH_FAILURE"

    @property
    def name(self) -> str:
        return "LinkedIn Post Publication Failure"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.ANOMALY

    @property
    def description(self) -> str:
        return "Identifies social posts scheduled for LinkedIn that failed to publish."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.source == "linkedin",
                BusinessEvent.event_name == "linkedin.post_failed",
            )
        )
        res = await db.execute(stmt)
        failed_evs = res.scalars().all()

        if failed_evs:
            evidence_items = []
            for ev in failed_evs[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="linkedin",
                        metric_name="post_failed",
                        value_current=str(ev.entity_id),
                        description=f"LinkedIn post #{ev.entity_id} failed during publication.",
                        raw_data=ev.payload,
                        recorded_at=ev.occurred_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=ProblemSeverity.MEDIUM,
                time_sensitivity=TimeSensitivity.MEDIUM,
                is_risk=True,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=True,
            )

            obs = DetectionObservation(
                observation_text=f"Detected {len(failed_evs)} failed LinkedIn post publication(s).",
                impact_summary="Marketing content schedule interrupted, reducing brand visibility and organic lead generation.",
                hypothesis="LinkedIn OAuth token expired or revoked, or media asset format rejected by LinkedIn API.",
                investigation_details="Check LinkedIn OAuth credential status in third-party integrations and re-authenticate if token is expired.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"ANOMALY:linkedin:publish_failure:{user_id}",
                category=self.category,
                title=f"LinkedIn Post Publication Failure ({len(failed_evs)} posts)",
                summary=f"{len(failed_evs)} LinkedIn post(s) failed to publish.",
                severity=ProblemSeverity.MEDIUM,
                time_sensitivity=TimeSensitivity.MEDIUM,
                confidence=confidence,
                priority_score=priority,
                is_opportunity=False,
                is_risk=True,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals
