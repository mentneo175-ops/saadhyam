"""
Opportunity Detection Rules (Phase 9)
Implements deterministic, evidence-grounded detection rules identifying positive business growth,
customer retention, sales expansion, and operational efficiency opportunities.
"""

from typing import List, Dict, Any, Set
from collections import defaultdict
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.problem_engine import (
    ProblemCategory,
    ProblemSeverity,
    TimeSensitivity,
    EvidenceType,
    BusinessEntity,
    BusinessEvent,
)
from models.order import Order, OrderStatus, PaymentStatus
from services.problem_engine.detection.base import (
    BaseDetectionRule,
    DetectionSignal,
    DetectionObservation,
    DetectionEvidence,
)
from services.problem_engine.detection.scoring import ProblemScoringEngine


class RepeatCustomerUpsellOpportunityRule(BaseDetectionRule):
    """
    Identifies high-value repeat customers with completed purchases who are eligible
    for personalized VIP upsell or loyalty cross-sell campaigns.
    """

    @property
    def rule_id(self) -> str:
        return "RULE_OPP_REPEAT_CUSTOMER_UPSELL"

    @property
    def name(self) -> str:
        return "Repeat Customer VIP Upsell & Loyalty Expansion"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.REVENUE_GROWTH

    @property
    def description(self) -> str:
        return "Detects loyal repeat buyers and computes potential revenue expansion through targeted VIP offers."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # Fetch completed orders for this tenant
        stmt = select(Order).where(
            and_(
                Order.user_id == user_id,
                Order.order_status.in_([OrderStatus.DELIVERED, OrderStatus.PROCESSING, OrderStatus.SHIPPED]),
            )
        )
        res = await db.execute(stmt)
        completed_orders = res.scalars().all()

        if not completed_orders:
            # Fallback check on BusinessEntity
            ent_stmt = select(BusinessEntity).where(
                and_(
                    BusinessEntity.user_id == user_id,
                    BusinessEntity.entity_type == "order",
                )
            )
            ent_res = await db.execute(ent_stmt)
            entities = ent_res.scalars().all()
            customer_orders: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
            for e in entities:
                props = e.properties or {}
                cust = props.get("customer_email") or props.get("customer_name")
                status = str(props.get("order_status", "")).upper()
                if cust and status in ("DELIVERED", "PROCESSING", "SHIPPED", "COMPLETED"):
                    customer_orders[cust].append(props)
        else:
            customer_orders = defaultdict(list)
            for o in completed_orders:
                cust = o.customer_email or o.customer_name or f"Cust_{o.id}"
                customer_orders[cust].append({
                    "order_number": o.order_number,
                    "amount": float(o.total_amount or 0.0),
                    "email": o.customer_email,
                    "name": o.customer_name,
                    "phone": o.customer_phone,
                    "created_at": o.created_at,
                })

        # Filter for customers with >= 2 completed purchases
        repeat_customers = {k: v for k, v in customer_orders.items() if len(v) >= 2}

        if repeat_customers:
            total_historical_spend = sum(
                sum(item.get("amount", 0.0) for item in items)
                for items in repeat_customers.values()
            )
            total_repeat_orders = sum(len(items) for items in repeat_customers.values())
            customer_count = len(repeat_customers)

            # Conservative potential upsell estimate: 20% basket expansion on repeat base
            potential_expansion_inr = round(total_historical_spend * 0.20, 2)

            evidence_items: List[DetectionEvidence] = []
            for cust_key, orders_list in list(repeat_customers.items())[:5]:
                cust_spend = sum(o.get("amount", 0.0) for o in orders_list)
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.METRIC_DELTA,
                        source_system="orders",
                        metric_name="repeat_buyer_spend",
                        value_before="SINGLE_ORDER",
                        value_current=f"{len(orders_list)} orders (INR {cust_spend:,.0f})",
                        description=f"Customer '{cust_key}' completed {len(orders_list)} purchases totaling INR {cust_spend:,.2f}.",
                        raw_data={"customer": cust_key, "order_count": len(orders_list), "total_spend": cust_spend},
                    )
                )

            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=False,
                has_entity_state=len(completed_orders) > 0,
            )

            priority = ProblemScoringEngine.calculate_opportunity_score(
                estimated_roi_inr=potential_expansion_inr,
                confidence=confidence,
                time_sensitivity=TimeSensitivity.HIGH,
                effort_level="LOW",
                affected_customers_count=customer_count,
                evidence_count=len(evidence_items),
            )

            obs = DetectionObservation(
                observation_text=f"Identified {customer_count} verified repeat customer(s) with {total_repeat_orders} lifetime orders totaling INR {total_historical_spend:,.2f}.",
                impact_summary=f"Projected revenue expansion of INR {potential_expansion_inr:,.2f} via automated VIP loyalty rewards and personalized upsell recommendations.",
                hypothesis="Existing repeat buyers have high brand trust and demonstrate 3x higher conversion rate when presented with tailored cross-sell recommendations.",
                investigation_details="Segment repeat customer purchase categories, analyze average re-order intervals, and trigger automated WhatsApp VIP exclusive catalog links.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"REVENUE_GROWTH:repeat_customers_upsell:{user_id}",
                category=self.category,
                title=f"Repeat Customer VIP Upsell Opportunity (INR {potential_expansion_inr:,.0f})",
                summary=f"{customer_count} loyal repeat customer(s) identified with potential INR {potential_expansion_inr:,.2f} in incremental sales.",
                severity=ProblemSeverity.HIGH if potential_expansion_inr > 20000 else ProblemSeverity.MEDIUM,
                time_sensitivity=TimeSensitivity.HIGH,
                confidence=confidence,
                priority_score=priority,
                estimated_impact_inr=potential_expansion_inr,
                cost_impact_inr=500.0,
                recovery_amount_inr=potential_expansion_inr,
                affected_customers_count=customer_count,
                is_opportunity=True,
                is_risk=False,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals


class AbandonedCheckoutRecoveryOpportunityRule(BaseDetectionRule):
    """
    Identifies dropped checkout orders with customer contact details
    for automated WhatsApp / Voice AI recovery outreach.
    """

    @property
    def rule_id(self) -> str:
        return "RULE_OPP_ABANDONED_CHECKOUT_RECOVERY"

    @property
    def name(self) -> str:
        return "Abandoned Checkout Win-Back Opportunity"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.CUSTOMER_RETENTION

    @property
    def description(self) -> str:
        return "Identifies abandoned checkout sessions with contact info and estimates recoverable revenue via automated win-back workflows."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        stmt = select(Order).where(
            and_(
                Order.user_id == user_id,
                Order.order_status == OrderStatus.CANCELLED,
                (Order.customer_phone.isnot(None)) | (Order.customer_email.isnot(None)),
            )
        )
        res = await db.execute(stmt)
        abandoned_orders = res.scalars().all()

        if abandoned_orders:
            total_abandoned_val = sum(float(o.total_amount or 0.0) for o in abandoned_orders)
            # Industry benchmark win-back recovery rate = 35%
            projected_recovery_inr = round(total_abandoned_val * 0.35, 2)
            customer_count = len(set(o.customer_email or o.customer_phone for o in abandoned_orders))

            evidence_items: List[DetectionEvidence] = []
            for o in abandoned_orders[:5]:
                evidence_items.append(
                    DetectionEvidence(
                        evidence_type=EvidenceType.EVENT_LOG,
                        source_system="orders",
                        metric_name="abandoned_cart_value",
                        value_before="CHECKOUT_INITIATED",
                        value_current="CANCELLED",
                        description=f"Order #{o.order_number} for customer '{o.customer_name or o.customer_email}' with value INR {o.total_amount:,.2f} is recoverable.",
                        raw_data={"order_number": o.order_number, "amount": o.total_amount, "phone": o.customer_phone},
                    )
                )

            confidence = ProblemScoringEngine.calculate_confidence(
                evidence_items=evidence_items,
                has_direct_event=True,
                has_entity_state=True,
            )

            priority = ProblemScoringEngine.calculate_opportunity_score(
                estimated_roi_inr=projected_recovery_inr,
                confidence=confidence,
                time_sensitivity=TimeSensitivity.URGENT,
                effort_level="LOW",
                affected_customers_count=customer_count,
                evidence_count=len(evidence_items),
            )

            obs = DetectionObservation(
                observation_text=f"Found {len(abandoned_orders)} abandoned orders totaling INR {total_abandoned_val:,.2f} with valid customer contact channels.",
                impact_summary=f"Projected revenue recovery of INR {projected_recovery_inr:,.2f} (35% win-back benchmark) using automated WhatsApp checkout recovery reminders.",
                hypothesis="Timely 1-click payment links delivered via WhatsApp within 30 minutes of drop-off recover over 30% of otherwise lost revenue.",
                investigation_details="Verify WhatsApp business credentials, prepare discount incentive token (5%), and schedule automated dispatch sequence.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"CUSTOMER_RETENTION:abandoned_checkout_recovery:{user_id}",
                category=self.category,
                title=f"Abandoned Cart Win-Back Opportunity (INR {projected_recovery_inr:,.0f})",
                summary=f"{len(abandoned_orders)} recoverable checkout cart(s) totaling INR {total_abandoned_val:,.2f} in recoverable value.",
                severity=ProblemSeverity.HIGH if projected_recovery_inr > 15000 else ProblemSeverity.MEDIUM,
                time_sensitivity=TimeSensitivity.URGENT,
                confidence=confidence,
                priority_score=priority,
                estimated_impact_inr=projected_recovery_inr,
                cost_impact_inr=200.0,
                recovery_amount_inr=projected_recovery_inr,
                affected_customers_count=customer_count,
                is_opportunity=True,
                is_risk=False,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals


class OperationalEfficiencyOpportunityRule(BaseDetectionRule):
    """
    Identifies manual bottlenecks and opportunities for automated workflow efficiency.
    """

    @property
    def rule_id(self) -> str:
        return "RULE_OPP_OPERATIONAL_EFFICIENCY"

    @property
    def name(self) -> str:
        return "Automated Follow-up & Workflow Optimization"

    @property
    def category(self) -> ProblemCategory:
        return ProblemCategory.OPERATIONAL_EFFICIENCY

    @property
    def description(self) -> str:
        return "Identifies recurring manual operational tasks that can be streamlined through Saadhyam AI agents."

    async def evaluate(self, db: AsyncSession, user_id: int) -> List[DetectionSignal]:
        signals = []

        # Check for uncontacted leads or voice contacts
        ev_stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.event_name.in_(["lead.captured", "lead.created", "contact.imported"]),
            )
        )
        res = await db.execute(ev_stmt)
        lead_events = res.scalars().all()

        if len(lead_events) >= 3:
            saved_hours = round(len(lead_events) * 0.5, 1)  # 30 mins saved per lead via automation
            estimated_cost_saving_inr = round(saved_hours * 500.0, 2)  # INR 500 / hr operational cost

            evidence_items = [
                DetectionEvidence(
                    evidence_type=EvidenceType.EVENT_LOG,
                    source_system="leads",
                    metric_name="pending_manual_leads",
                    value_before="MANUAL_CALL",
                    value_current=f"{len(lead_events)} leads",
                    description=f"{len(lead_events)} incoming leads currently requiring manual agent qualification.",
                    raw_data={"lead_count": len(lead_events)},
                )
            ]

            obs = DetectionObservation(
                observation_text=f"Detected {len(lead_events)} incoming leads suitable for autonomous Voice AI screening.",
                impact_summary=f"Saves ~{saved_hours} human labor hours (est. INR {estimated_cost_saving_inr:,.2f}) while reducing first-response latency to < 60 seconds.",
                hypothesis="Instant Voice AI screening increases lead qualification rate by 45% compared to delayed manual callbacks.",
                investigation_details="Deploy inbound Voice Agent campaign template with qualification script.",
            )

            signal = DetectionSignal(
                rule_id=self.rule_id,
                fingerprint=f"OPERATIONAL_EFFICIENCY:lead_automation:{user_id}",
                category=self.category,
                title="Voice AI Lead Qualification & Workflow Automation",
                summary=f"Automate outreach for {len(lead_events)} leads to save ~{saved_hours} hours of manual effort.",
                severity=ProblemSeverity.MEDIUM,
                time_sensitivity=TimeSensitivity.MEDIUM,
                confidence=0.85,
                priority_score=ProblemScoringEngine.calculate_opportunity_score(
                    estimated_roi_inr=estimated_cost_saving_inr,
                    confidence=0.85,
                    time_sensitivity=TimeSensitivity.MEDIUM,
                    effort_level="LOW",
                    affected_customers_count=len(lead_events),
                    evidence_count=len(evidence_items),
                ),
                estimated_impact_inr=estimated_cost_saving_inr,
                cost_impact_inr=150.0,
                recovery_amount_inr=estimated_cost_saving_inr,
                affected_customers_count=len(lead_events),
                is_opportunity=True,
                is_risk=False,
                observation=obs,
                evidence_items=evidence_items,
            )
            signals.append(signal)

        return signals
