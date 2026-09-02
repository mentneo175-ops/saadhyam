"""
Order & E-Commerce Detection Rules (Phase 3)
Implements deterministic rules detecting payment failures and revenue leakage.
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


class OrderPaymentFailureRule(BaseDetectionRule):
    """Detects order payment failures and unrecovered checkout revenue leakage."""

    @property
    def rule_id(self) -> str:
        return "RULE_REVENUE_PAYMENT_FAILURE"

    @property
    def name(self) -> str:
        return "Order Payment Failure & Revenue Leakage"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.REVENUE_LEAKAGE

    @property
    def description(self) -> str:
        return "Identifies transactions where payment failed or orders remain unpaid, estimating leaked INR revenue."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # 1. Fetch order entities for this tenant
        stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == "order",
            )
        )
        result = await db.execute(stmt)
        orders = result.scalars().all()

        failed_orders = []
        total_leaked_inr = 0.0
        affected_customers = set()

        for o in orders:
            props = o.properties or {}
            payment_status = str(props.get("payment_status", "")).upper()
            order_status = str(props.get("order_status", "")).upper()

            if payment_status in ("FAILED", "UNPAID") or order_status == "CANCELLED":
                failed_orders.append(o)
                amt = float(props.get("total_amount", 0.0))
                total_leaked_inr += amt
                cust = props.get("customer_email") or props.get("customer_name")
                if cust:
                    affected_customers.add(cust)

        # 2. Fetch payment.failed events
        ev_stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.event_name.in_(["payment.failed", "order.cancelled"]),
            )
        )
        ev_res = await db.execute(ev_stmt)
        failed_events = ev_res.scalars().all()

        if failed_orders or failed_events:
            cust_count = max(len(affected_customers), 1 if failed_orders or failed_events else 0)
            order_count = max(len(failed_orders), len(failed_events))

            severity = ProblemSeverity.CRITICAL if total_leaked_inr > 25000 or order_count >= 5 else ProblemSeverity.HIGH
            time_sens = TimeSensitivity.URGENT if total_leaked_inr > 10000 else TimeSensitivity.HIGH

            evidence_items = []
            for fo in failed_orders[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="orders",
                        metric_name="payment_status",
                        value_before="INITIATED",
                        value_current=fo.properties.get("payment_status", "FAILED"),
                        description=f"Order {fo.properties.get('order_number', fo.entity_key)} with value INR {fo.properties.get('total_amount', 0)} failed payment.",
                        raw_data=fo.properties,
                        recorded_at=fo.created_at,
                    )
                )

            for fe in failed_events[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.METRIC_DELTA,
                        source_system="orders",
                        metric_name="failed_transactions",
                        value_current=str(fe.payload.get("amount", "")),
                        description=f"Payment failure event recorded for order #{fe.entity_id}.",
                        raw_data=fe.payload,
                        recorded_at=fe.occurred_at,
                    )
                )

            priority = ProblemScoringEngine.calculate_priority_score(
                severity=severity,
                time_sensitivity=time_sens,
                affected_customers_count=cust_count,
                estimated_impact_inr=total_leaked_inr if total_leaked_inr > 0 else None,
                is_risk=True,
                evidence_count=len(evidence_items),
            )
            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=len(failed_events) > 0,
                has_entity_state=len(failed_orders) > 0,
            )

            obs = DetectionObservation(
                observation_text=f"Detected {order_count} failed order transactions totaling INR {total_leaked_inr:,.2f} in unrealized revenue.",
                impact_summary=f"Direct revenue loss of INR {total_leaked_inr:,.2f} affecting {cust_count} customer checkout sessions.",
                hypothesis="Payment gateway timeouts, insufficient customer funds, or checkout drop-offs prior to gateway confirmation.",
                investigation_details="Review payment gateway logs, customer checkout drop-off timestamps, and verify payment webhook delivery.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"REVENUE_LEAKAGE:orders:payment_failure:{user_id}",
                category=self.category,
                title=f"Payment Failures & Revenue Leakage (INR {total_leaked_inr:,.0f})",
                summary=f"{order_count} order(s) failed during checkout, causing an estimated INR {total_leaked_inr:,.2f} in leaked revenue.",
                severity=severity,
                time_sensitivity=time_sens,
                confidence=confidence,
                priority_score=priority,
                estimated_impact_inr=total_leaked_inr if total_leaked_inr > 0 else None,
                cost_impact_inr=total_leaked_inr if total_leaked_inr > 0 else None,
                recovery_amount_inr=total_leaked_inr if total_leaked_inr > 0 else None,
                affected_customers_count=cust_count,
                is_opportunity=False,
                is_risk=True,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals
