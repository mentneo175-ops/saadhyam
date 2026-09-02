"""
Problem Scoring Engine (Phase 3)
Provides deterministic, explainable calculations for Priority (0-100),
Confidence (0.0-1.0), Severity, and Time Sensitivity.
"""

import math
from typing import Optional, List
from models.problem_engine import ProblemSeverity, TimeSensitivity
from services.problem_engine.detection.base import DetectionEvidence


class ProblemScoringEngine:
    """Deterministic scoring engine for problem signals."""

    @staticmethod
    def calculate_priority_score(
        severity: ProblemSeverity,
        time_sensitivity: TimeSensitivity,
        affected_customers_count: int = 0,
        affected_employees_count: int = 0,
        estimated_impact_inr: Optional[float] = None,
        is_risk: bool = False,
        evidence_count: int = 1,
    ) -> int:
        """
        Calculates deterministic priority score between 0 and 100.
        Factors:
        - Severity Base Weight (0-40)
        - Time Sensitivity Weight (0-25)
        - Customer / Employee Impact Weight (0-15)
        - Financial Impact Magnitude (0-15)
        - Risk Multiplier / Evidence Strength (0-5)
        """
        # 1. Severity weight
        severity_weights = {
            ProblemSeverity.CRITICAL: 40,
            ProblemSeverity.HIGH: 28,
            ProblemSeverity.MEDIUM: 16,
            ProblemSeverity.LOW: 8,
        }
        score = severity_weights.get(severity, 15)

        # 2. Time sensitivity weight
        urgency_weights = {
            TimeSensitivity.URGENT: 25,
            TimeSensitivity.HIGH: 18,
            TimeSensitivity.MEDIUM: 10,
            TimeSensitivity.LOW: 4,
        }
        score += urgency_weights.get(time_sensitivity, 10)

        # 3. Affected people factor (customers + employees on log scale up to 15 points)
        total_affected = affected_customers_count + affected_employees_count
        if total_affected > 0:
            people_points = min(15, int(math.log10(total_affected + 1) * 7.5))
            score += people_points

        # 4. Financial magnitude factor (logarithmic scale up to 15 points)
        if estimated_impact_inr and estimated_impact_inr > 0:
            fin_points = min(15, max(3, int(math.log10(estimated_impact_inr) * 2.5)))
            score += fin_points

        # 5. Risk and evidence reinforcement (up to 5 points)
        if is_risk:
            score += 3
        if evidence_count > 1:
            score += min(2, evidence_count - 1)

        # Clip strictly between 0 and 100
        return max(0, min(100, int(score)))

    @staticmethod
    def calculate_confidence(
        evidence_items: List[DetectionEvidence],
        has_direct_event: bool = False,
        has_entity_state: bool = False,
    ) -> float:
        """
        Calculates confidence score between 0.0 and 1.0 based on empirical evidence strength.
        Base confidence = 0.60
        + 0.15 for verified domain events
        + 0.15 for verified entity state matches
        + 0.05 per additional evidence item (max +0.10)
        """
        base = 0.60
        if has_direct_event:
            base += 0.15
        if has_entity_state:
            base += 0.15

        if len(evidence_items) > 1:
            base += min(0.10, (len(evidence_items) - 1) * 0.05)

        return round(max(0.1, min(1.0, base)), 2)
