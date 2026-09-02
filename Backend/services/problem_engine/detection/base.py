"""
Problem Detection Engine - Base Contracts & Signal Data Classes (Phase 3)
Defines the DetectionSignal structure, BaseDetectionRule contract, and rule interfaces.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from models.problem_engine import (
    ProblemCategory,
    ProblemSeverity,
    TimeSensitivity,
    EvidenceType,
)
from services.problem_engine.connectors.base import sanitize_sensitive_data


@dataclass
class DetectionEvidence:
    """Represents an empirical piece of evidence supporting a detection signal."""
    evidence_type: EvidenceType
    source_system: str
    description: str
    metric_name: Optional[str] = None
    value_before: Optional[str] = None
    value_current: Optional[str] = None
    raw_data: Dict[str, Any] = field(default_factory=dict)
    recorded_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evidence_type": self.evidence_type,
            "source_system": self.source_system,
            "metric_name": self.metric_name,
            "value_before": str(self.value_before) if self.value_before is not None else None,
            "value_current": str(self.value_current) if self.value_current is not None else None,
            "description": self.description,
            "raw_data": sanitize_sensitive_data(self.raw_data or {}),
            "recorded_at": self.recorded_at or datetime.utcnow(),
        }


@dataclass
class DetectionObservation:
    """Observation details explaining what occurred, why it matters, and what to investigate."""
    observation_text: str
    impact_summary: str
    hypothesis: str
    investigation_details: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "observation_text": self.observation_text,
            "impact_summary": self.impact_summary,
            "hypothesis": self.hypothesis,
            "investigation_details": self.investigation_details,
        }


@dataclass
class DetectionSignal:
    """Structured detection result emitted by a detection rule."""
    rule_id: str
    fingerprint: str  # Deterministic deduplication key for this issue condition
    category: ProblemCategory
    title: str
    summary: str
    severity: ProblemSeverity
    time_sensitivity: TimeSensitivity
    confidence: float  # 0.0 - 1.0
    priority_score: int  # 0 - 100
    observation: DetectionObservation
    evidence_items: List[DetectionEvidence] = field(default_factory=list)
    estimated_impact_inr: Optional[float] = None
    cost_impact_inr: Optional[float] = None
    recovery_amount_inr: Optional[float] = None
    affected_customers_count: int = 0
    affected_employees_count: int = 0
    is_opportunity: bool = False
    is_risk: bool = False


class BaseDetectionRule(ABC):
    """Abstract base class for all modular problem detection rules."""

    @property
    @abstractmethod
    def rule_id(self) -> str:
        """Unique rule identifier (e.g. RULE_REVENUE_PAYMENT_FAILURE)."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable rule name."""
        pass

    @property
    @abstractmethod
    def category(self) -> ProblemCategory:
        """Primary ProblemCategory targeted by this rule."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Explanation of what condition this rule monitors."""
        pass

    @abstractmethod
    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        """
        Evaluates normalized business context and events for the tenant,
        returning 0 or more DetectionSignals.
        """
        pass
