"""
Operations, Tasks & Growth Metrics Detection Rules (Phase 3)
Implements deterministic rules for team execution bottlenecks and metric deviations.
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


class TaskExecutionBottleneckRule(BaseDetectionRule):
    """Detects operational execution slowdowns and uncompleted task backlogs."""

    @property
    def rule_id(self) -> str:
        return "RULE_TASK_EXECUTION_BOTTLENECK"

    @property
    def name(self) -> str:
        return "Operational Task Execution Backlog & Bottleneck"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.PRODUCTIVITY

    @property
    def description(self) -> str:
        return "Identifies backlogs of uncompleted daily execution tasks across operations, marketing, and sales."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == "task",
            )
        )
        res = await db.execute(stmt)
        tasks = res.scalars().all()
        pending_tasks = [t for t in tasks if str(t.status).upper() in ("PENDING", "INCOMPLETE")]

        if len(pending_tasks) >= 3:
            severity = ProblemSeverity.HIGH if len(pending_tasks) >= 8 else ProblemSeverity.MEDIUM
            time_sens = TimeSensitivity.MEDIUM

            evidence_items = []
            for pt in pending_tasks[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.WORKFLOW_BOTTLENECK,
                        source_system="operations_analytics",
                        metric_name="task_status",
                        value_current="PENDING",
                        description=f"Task '{pt.properties.get('title', pt.display_name)}' (Priority: {pt.properties.get('priority', 'medium')}) is uncompleted.",
                        raw_data=pt.properties,
                        recorded_at=pt.created_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=severity,
                time_sensitivity=time_sens,
                affected_employees_count=len(pending_tasks),
                is_risk=False,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_entity_state=True,
            )

            obs = DetectionObservation(
                observation_text=f"Detected an operational backlog of {len(pending_tasks)} pending execution task(s).",
                impact_summary="Execution delays in business workflows reducing team velocity and goal delivery.",
                hypothesis="Task over-allocation, lack of execution prioritization, or missing automation for repetitive items.",
                investigation_details="Review task categories, employee assignment distribution, and identify automatable workflows.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"PRODUCTIVITY:tasks_growth:task_backlog:{user_id}",
                category=self.category,
                title=f"Operational Task Execution Backlog ({len(pending_tasks)} tasks)",
                summary=f"{len(pending_tasks)} daily task(s) remain uncompleted, causing operational throughput slowdown.",
                severity=severity,
                time_sensitivity=time_sens,
                confidence=confidence,
                priority_score=priority,
                affected_employees_count=len(pending_tasks),
                is_opportunity=False,
                is_risk=False,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals


class GrowthMetricDropRule(BaseDetectionRule):
    """Detects severe drops in business performance and target completion rates."""

    @property
    def rule_id(self) -> str:
        return "RULE_GROWTH_METRIC_DEVIATION"

    @property
    def name(self) -> str:
        return "Growth Target Deviation & Performance Drop"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.GOAL_DEVIATION

    @property
    def description(self) -> str:
        return "Identifies business performance deviations where task completion rates drop below target thresholds (<50%)."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # Fetch metric entities
        m_stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == "metric",
            )
        )
        m_res = await db.execute(m_stmt)
        metrics = m_res.scalars().all()

        low_metrics = []
        for m in metrics:
            props = m.properties or {}
            rate = float(props.get("completion_rate", 100.0))
            if rate < 50.0 and props.get("tasks_assigned", 0) > 0:
                low_metrics.append((m, rate))

        # Fetch metric events
        ev_stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.source == "growth_analytics",
                BusinessEvent.event_name.in_(["metric.completion_rate_low", "metric.dropped"]),
            )
        )
        ev_res = await db.execute(ev_stmt)
        evs = ev_res.scalars().all()

        if low_metrics or evs:
            evidence_items = []
            for lm, rate in low_metrics[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.METRIC_DELTA,
                        source_system="growth_analytics",
                        metric_name="completion_rate",
                        value_before="100.0%",
                        value_current=f"{rate:.1f}%",
                        description=f"Task completion rate dropped to {rate:.1f}% (Growth Score: {lm.properties.get('growth_score', 0)}).",
                        raw_data=lm.properties,
                        recorded_at=lm.created_at,
                    )
                )

            for ev in evs[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="growth_analytics",
                        metric_name=ev.event_name,
                        value_current=str(ev.payload.get("completion_rate", "")),
                        description=f"Growth alert event: {ev.event_name}.",
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
                has_direct_event=len(evs) > 0,
                has_entity_state=len(low_metrics) > 0,
            )

            obs = DetectionObservation(
                observation_text="Detected significant target deviation: Daily task completion rate fell below 50%.",
                impact_summary="Failure to achieve daily operational quotas directly slows company growth benchmarks.",
                hypothesis="Resource bottlenecks, employee friction, or misaligned daily task priorities.",
                investigation_details="Audit daily activity logs, evaluate department bottlenecks, and adjust workload distribution.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"GOAL_DEVIATION:growth_analytics:low_completion_rate:{user_id}",
                category=self.category,
                title="Business Execution Rate Below 50% Threshold",
                summary="Overall team task completion fell below 50%, triggering an operational goal deviation alert.",
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
