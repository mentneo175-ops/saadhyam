"""
Natural-Language Investigation Service (Phase 10)
Translates user natural-language questions into evidence-grounded answers
strictly utilizing verifiable domain facts, metric deltas, root cause diagnoses,
and certified outcomes without any fabricated data.
"""

import logging
import re
from typing import Dict, Any, List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    ProblemObservation,
    ProblemEvidence,
    ProblemRootCause,
    ProblemSolution,
    SolutionExecutionPlan,
    ProblemOutcome,
    ProblemLifecycleAudit,
    ProblemCategory,
    ProblemSeverity,
    OutcomeStatus,
)

logger = logging.getLogger(__name__)


class ProblemInvestigationService:
    """
    Evidence-grounded conversational investigation engine for business problems and opportunities.
    """

    @classmethod
    async def investigate_problem(
        cls,
        db: AsyncSession,
        user_id: int,
        problem_id: int,
        question: str,
    ) -> Dict[str, Any]:
        """
        Assembles 360-degree context for the problem and evaluates the natural-language question.
        Returns structured, traceable findings strictly partitioned into:
        - direct_answer
        - observed_facts
        - calculated_metrics
        - estimates_and_hypotheses
        - recommendations
        - evidence_references
        - missing_evidence_notes
        - certainty_tier
        """
        if not question or not question.strip():
            raise ValueError("Investigation question cannot be empty.")

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
                selectinload(Problem.solutions),
                selectinload(Problem.execution_plans),
                selectinload(Problem.outcome),
                selectinload(Problem.lifecycle_audits),
            )
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem/Opportunity #{problem_id} not found for current tenant.")

        q_lower = question.lower().strip()

        # Build evidence references
        evidence_refs = [
            {
                "id": ev.id,
                "source_system": ev.source_system,
                "evidence_type": ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type),
                "metric_name": ev.metric_name,
                "value_before": ev.value_before,
                "value_current": ev.value_current,
                "description": ev.description,
                "raw_data": ev.raw_data,
            }
            for ev in problem.evidence_items
        ]

        # Extract primary root cause & observations
        primary_rc = next((rc for rc in problem.root_causes if rc.is_primary), None)
        if not primary_rc and problem.root_causes:
            primary_rc = problem.root_causes[0]
        obs = problem.observations[0] if problem.observations else None
        recommended_sol = next((s for s in problem.solutions if s.is_recommended), None)
        if not recommended_sol and problem.solutions:
            recommended_sol = problem.solutions[0]

        # -------------------------------------------------------------
        # Intent 0: "What would happen if we execute this solution?" / What-If ROI Simulation
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["what if", "would happen", "execute solution", "simulate", "what would"]):
            if recommended_sol:
                direct_answer = (
                    f"Executing '{recommended_sol.title}' is estimated to cost INR {recommended_sol.estimated_cost_inr:,.2f} "
                    f"and deliver a {recommended_sol.expected_roi_multiplier}x ROI multiplier with {recommended_sol.expected_impact} impact."
                )
                estimates = [
                    f"[Projected Gain] Estimated net benefit: INR {((problem.estimated_impact_inr or 0) * 0.7 - recommended_sol.estimated_cost_inr):,.2f}",
                    f"[Effort] Implementation takes ~{recommended_sol.implementation_time_hours} hours via {recommended_sol.strategy_type.value}.",
                    f"[Guardrail] Requires approval: {recommended_sol.risk_level.value != 'LOW'}",
                ]
            else:
                direct_answer = "No candidate solution is currently selected to simulate."
                estimates = []

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "WHAT_IF_SIMULATION",
                "certainty_tier": "ESTIMATED",
                "direct_answer": direct_answer,
                "observed_facts": [f"Problem Impact: INR {problem.estimated_impact_inr or 0:,.2f}"],
                "calculated_metrics": [f"Recommended Solution Cost: INR {recommended_sol.estimated_cost_inr if recommended_sol else 0:,.2f}"],
                "estimates_and_hypotheses": estimates,
                "recommendations": ["Approve execution plan to dispatch automated resolution steps."],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": [] if recommended_sol else ["Generate solutions to view simulated outcomes."],
            }

        # -------------------------------------------------------------
        # Intent 1: "Why did this happen?" / Root Cause Diagnosis
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["why", "cause", "reason", "diagnos", "origin", "happen"]):
            observed_facts = [
                f"Item #{problem.id} titled '{problem.title}' classified under category {problem.category.value}.",
            ]
            for ev in problem.evidence_items:
                observed_facts.append(f"[{ev.source_system.upper()}] {ev.description}")

            calculated_metrics = []
            if problem.estimated_impact_inr:
                calculated_metrics.append(f"Estimated financial impact: INR {problem.estimated_impact_inr:,.2f}")
            if problem.affected_customers_count:
                calculated_metrics.append(f"Affected customer count: {problem.affected_customers_count}")

            estimates_and_hypotheses = []
            if obs and obs.hypothesis:
                estimates_and_hypotheses.append(f"[Hypothesis] {obs.hypothesis}")

            if primary_rc:
                direct_answer = f"Root cause analysis identifies: {primary_rc.diagnosis} with {int(primary_rc.confidence * 100)}% confidence."
                if primary_rc.contributing_factors:
                    factors = primary_rc.contributing_factors
                    if isinstance(factors, list):
                        estimates_and_hypotheses.extend([f"[Contributing Factor] {f}" for f in factors])
            elif obs:
                direct_answer = f"Root cause diagnosis is currently in progress. Working hypothesis: {obs.hypothesis}"
            else:
                direct_answer = f"Initial evidence indicates {problem.summary}."

            recommendations = []
            if recommended_sol:
                recommendations.append(f"Recommended intervention: '{recommended_sol.title}' ({recommended_sol.description})")

            missing_evidence_notes = []
            if len(problem.evidence_items) == 0:
                missing_evidence_notes.append("No empirical log evidence is currently attached to this problem.")

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "ROOT_CAUSE_EXPLANATION",
                "certainty_tier": "MEASURED_FACT" if primary_rc and len(problem.evidence_items) > 0 else "HYPOTHESIS",
                "direct_answer": direct_answer,
                "observed_facts": observed_facts,
                "calculated_metrics": calculated_metrics,
                "estimates_and_hypotheses": estimates_and_hypotheses,
                "recommendations": recommendations,
                "evidence_references": evidence_refs,
                "missing_evidence_notes": missing_evidence_notes,
            }

        # -------------------------------------------------------------
        # Intent 2: "What evidence supports this?" / Evidence Ledger
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["evidence", "proof", "support", "data", "log", "metric", "signal"]):
            observed_facts = [
                f"{ev.source_system.upper()} record: {ev.description} (Value: {ev.value_before or 'N/A'} -> {ev.value_current or 'N/A'})"
                for ev in problem.evidence_items
            ]
            if not observed_facts:
                observed_facts.append("No external connector evidence records recorded yet.")

            calculated_metrics = [
                f"Confidence Score: {int(problem.confidence * 100)}%",
                f"Priority Score: {problem.priority_score}/100",
                f"Evidence Count: {len(problem.evidence_items)} verifiable item(s)",
            ]

            direct_answer = (
                f"This { 'opportunity' if problem.is_opportunity else 'problem' } is supported by {len(problem.evidence_items)} empirical evidence item(s) from {', '.join(set(ev.source_system for ev in problem.evidence_items)) if problem.evidence_items else 'the detection pipeline'}."
            )

            missing_evidence_notes = []
            if len(problem.evidence_items) == 0:
                missing_evidence_notes.append("Evidence ledger is empty. Ingest additional connector sync logs to strengthen confidence.")

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "EVIDENCE_RETRIEVAL",
                "certainty_tier": "MEASURED_FACT" if len(problem.evidence_items) > 0 else "INSUFFICIENT_DATA",
                "direct_answer": direct_answer,
                "observed_facts": observed_facts,
                "calculated_metrics": calculated_metrics,
                "estimates_and_hypotheses": [],
                "recommendations": [f"Review source records in the {ev.source_system} connector." for ev in problem.evidence_items[:2]],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": missing_evidence_notes,
            }

        # -------------------------------------------------------------
        # Intent 3: Affected Entities / Customers / Orders / "Who is affected?"
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["customer", "order", "who", "which", "affect", "people", "user", "lead", "task"]):
            observed_facts = []
            for ev in problem.evidence_items:
                if ev.raw_data:
                    cust = ev.raw_data.get("customer") or ev.raw_data.get("customer_name") or ev.raw_data.get("email")
                    ord_num = ev.raw_data.get("order_number")
                    amt = ev.raw_data.get("amount") or ev.raw_data.get("total_spend")
                    details_str = []
                    if cust:
                        details_str.append(f"Customer: {cust}")
                    if ord_num:
                        details_str.append(f"Order #{ord_num}")
                    if amt:
                        details_str.append(f"Value: INR {amt:,.2f}")
                    if details_str:
                        observed_facts.append(f"[{ev.source_system.upper()}] {', '.join(details_str)}")

            calculated_metrics = []
            if problem.affected_customers_count:
                calculated_metrics.append(f"Total affected customers count: {problem.affected_customers_count}")
            if problem.affected_employees_count:
                calculated_metrics.append(f"Total affected employees count: {problem.affected_employees_count}")
            if problem.estimated_impact_inr:
                calculated_metrics.append(f"Total financial volume affected: INR {problem.estimated_impact_inr:,.2f}")

            if not observed_facts:
                if problem.affected_customers_count:
                    direct_answer = f"The issue affects {problem.affected_customers_count} customer(s), based on aggregated detection telemetry."
                else:
                    direct_answer = "Specific entity records were not individually enumerated in the initial signal summary."
            else:
                direct_answer = f"Identified {len(observed_facts)} specific record(s) involved in this issue."

            missing_evidence_notes = []
            if not observed_facts and not problem.affected_customers_count:
                missing_evidence_notes.append("Detailed customer identifiers are not present in current evidence payload.")

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "AFFECTED_ENTITIES",
                "certainty_tier": "MEASURED_FACT" if observed_facts else "CALCULATED",
                "direct_answer": direct_answer,
                "observed_facts": observed_facts,
                "calculated_metrics": calculated_metrics,
                "estimates_and_hypotheses": [],
                "recommendations": [f"Prioritize outreach to affected customers." if problem.affected_customers_count else "Audit connector logs for itemized entities."],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": missing_evidence_notes,
            }

        # -------------------------------------------------------------
        # Intent 4: "What changed recently?" / Metric Deltas
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["change", "recent", "delta", "shift", "spike", "drop", "history", "trend"]):
            observed_facts = []
            for ev in problem.evidence_items:
                if ev.value_before or ev.value_current:
                    observed_facts.append(
                        f"{ev.metric_name or 'Metric'} transitioned from '{ev.value_before or 'BASELINE'}' to '{ev.value_current or 'CURRENT'}' in {ev.source_system}."
                    )
            for audit in problem.lifecycle_audits[:3]:
                observed_facts.append(f"Audit event '{audit.event_type.value}' recorded at {audit.created_at.isoformat()}.")

            direct_answer = (
                f"Detected {len(observed_facts)} recent state change(s) or metric deviation(s) in system telemetry."
                if observed_facts
                else "No explicit historical baseline transition delta is stored for this item."
            )

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "RECENT_CHANGES",
                "certainty_tier": "MEASURED_FACT" if observed_facts else "INSUFFICIENT_DATA",
                "direct_answer": direct_answer,
                "observed_facts": observed_facts,
                "calculated_metrics": [f"Current Status: {problem.status.value}", f"Detected At: {problem.detected_at.isoformat() if problem.detected_at else 'N/A'}"],
                "estimates_and_hypotheses": [],
                "recommendations": ["Compare current metrics against rolling 7-day average."],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": [] if observed_facts else ["Historical baseline logs prior to detection timestamp were not captured."],
            }

        # -------------------------------------------------------------
        # Intent 5: "What should we do next?" / Next Steps & Solutions
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["do", "next", "solution", "action", "fix", "resolve", "recommend", "plan"]):
            recommendations = []
            for s in problem.solutions:
                rec_label = "[RECOMMENDED] " if s.is_recommended else ""
                recommendations.append(
                    f"{rec_label}{s.title} (Strategy: {s.strategy_type.value}, Expected ROI: {s.expected_roi_multiplier}x, Cost: INR {s.estimated_cost_inr:,.0f})"
                )

            direct_answer = (
                f"Synthesized {len(problem.solutions)} candidate resolution strateg{'ies' if len(problem.solutions) != 1 else 'y'}. "
                + (f"Recommended action: '{recommended_sol.title}'." if recommended_sol else "Generate solution candidates to proceed.")
            )

            estimates_and_hypotheses = []
            if recommended_sol:
                estimates_and_hypotheses.append(
                    f"[Estimate] Implementation requires ~{recommended_sol.implementation_time_hours} hr(s) with projected {recommended_sol.expected_impact} impact."
                )

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "NEXT_STEPS_RECOMMENDATION",
                "certainty_tier": "ESTIMATED",
                "direct_answer": direct_answer,
                "observed_facts": [f"Current Problem Status: {problem.status.value}"],
                "calculated_metrics": [f"Available Solutions: {len(problem.solutions)}"],
                "estimates_and_hypotheses": estimates_and_hypotheses,
                "recommendations": recommendations,
                "evidence_references": evidence_refs,
                "missing_evidence_notes": [] if problem.solutions else ["No solution candidates generated yet. Trigger solution synthesis."],
            }

        # -------------------------------------------------------------
        # Intent 6: "How confident are we?" / Confidence & Scoring
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["confident", "certain", "confidence", "score", "priority", "reliab"]):
            conf_pct = int(problem.confidence * 100)
            direct_answer = f"Engine confidence is rated at {conf_pct}% (Priority Score: {problem.priority_score}/100)."

            observed_facts = [
                f"Confidence calculated from {len(problem.evidence_items)} empirical evidence signal(s).",
                f"Severity: {problem.severity.value}, Time Sensitivity: {problem.time_sensitivity.value}.",
            ]

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "CONFIDENCE_ASSESSMENT",
                "certainty_tier": "CALCULATED",
                "direct_answer": direct_answer,
                "observed_facts": observed_facts,
                "calculated_metrics": [
                    f"Confidence: {conf_pct}%",
                    f"Priority Score: {problem.priority_score}/100",
                ],
                "estimates_and_hypotheses": [],
                "recommendations": ["Ingest additional connector telemetry to elevate confidence to > 90%."],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": [],
            }

        # -------------------------------------------------------------
        # Intent 7: "What evidence is missing?"
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["missing", "lack", "need more", "insufficient"]):
            missing_items = []
            if len(problem.evidence_items) < 3:
                missing_items.append("Cross-channel correlation logs (currently < 3 evidence items).")
            if not problem.root_causes:
                missing_items.append("Formal root cause Bayesian diagnosis.")
            if not problem.outcome:
                missing_items.append("Post-execution verified telemetry (problem has not completed execution).")

            direct_answer = (
                f"Currently identified {len(missing_items)} missing information tier(s) to achieve definitive certainty."
                if missing_items
                else "Core empirical evidence, root cause attribution, and solution paths are all currently complete."
            )

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "MISSING_EVIDENCE_AUDIT",
                "certainty_tier": "MEASURED_FACT",
                "direct_answer": direct_answer,
                "observed_facts": [f"Current Evidence Items Count: {len(problem.evidence_items)}"],
                "calculated_metrics": [],
                "estimates_and_hypotheses": [],
                "recommendations": ["Run connector sync to ingest missing stream logs."],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": missing_items,
            }

        # -------------------------------------------------------------
        # Intent 8: "What would happen if we execute this solution?" / What-If ROI Simulation
        # -------------------------------------------------------------
        if any(w in q_lower for w in ["what if", "would happen", "execute solution", "simulate", "roi"]):
            if recommended_sol:
                direct_answer = (
                    f"Executing '{recommended_sol.title}' is estimated to cost INR {recommended_sol.estimated_cost_inr:,.2f} "
                    f"and deliver a {recommended_sol.expected_roi_multiplier}x ROI multiplier with {recommended_sol.expected_impact} impact."
                )
                estimates = [
                    f"[Projected Gain] Estimated net benefit: INR {((problem.estimated_impact_inr or 0) * 0.7 - recommended_sol.estimated_cost_inr):,.2f}",
                    f"[Effort] Implementation takes ~{recommended_sol.implementation_time_hours} hours via {recommended_sol.strategy_type.value}.",
                    f"[Guardrail] Requires approval: {recommended_sol.risk_level.value != 'LOW'}",
                ]
            else:
                direct_answer = "No candidate solution is currently selected to simulate."
                estimates = []

            return {
                "question": question,
                "problem_id": problem.id,
                "is_opportunity": problem.is_opportunity,
                "intent": "WHAT_IF_SIMULATION",
                "certainty_tier": "ESTIMATED",
                "direct_answer": direct_answer,
                "observed_facts": [f"Problem Impact: INR {problem.estimated_impact_inr or 0:,.2f}"],
                "calculated_metrics": [f"Recommended Solution Cost: INR {recommended_sol.estimated_cost_inr if recommended_sol else 0:,.2f}"],
                "estimates_and_hypotheses": estimates,
                "recommendations": ["Approve execution plan to dispatch automated resolution steps."],
                "evidence_references": evidence_refs,
                "missing_evidence_notes": [] if recommended_sol else ["Generate solutions to view simulated outcomes."],
            }

        # -------------------------------------------------------------
        # Fallback: General Investigation Query
        # -------------------------------------------------------------
        observed_facts = [
            f"Title: {problem.title}",
            f"Summary: {problem.summary}",
            f"Status: {problem.status.value}",
        ]
        if problem.observations:
            observed_facts.append(f"Observation: {problem.observations[0].observation_text}")

        direct_answer = f"Investigation findings for '{problem.title}': {problem.summary}"

        return {
            "question": question,
            "problem_id": problem.id,
            "is_opportunity": problem.is_opportunity,
            "intent": "GENERAL_INVESTIGATION",
            "certainty_tier": "MEASURED_FACT",
            "direct_answer": direct_answer,
            "observed_facts": observed_facts,
            "calculated_metrics": [f"Priority Score: {problem.priority_score}", f"Confidence: {int(problem.confidence * 100)}%"],
            "estimates_and_hypotheses": [f"[Hypothesis] {problem.observations[0].hypothesis}"] if problem.observations and problem.observations[0].hypothesis else [],
            "recommendations": [f"Action: {recommended_sol.title}"] if recommended_sol else [],
            "evidence_references": evidence_refs,
            "missing_evidence_notes": [],
        }
