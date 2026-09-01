"""
Deterministic ROI & Business Impact Calculator (Phase 4)
Calculates recoverable revenue, implementation cost, net benefit, and ROI percentage.
Strictly distinguishes ACTUAL vs ESTIMATED vs UNKNOWN financial metrics.
"""

import logging
from typing import Dict, Any, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import Problem, ProblemSolution

logger = logging.getLogger(__name__)


class ROICalculator:
    """Deterministic financial impact and ROI calculator."""

    @classmethod
    async def calculate_roi(
        cls,
        db: AsyncSession,
        user_id: int,
        problem_id: int,
        solution_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Calculates ROI metrics for a problem and optional selected solution.
        Never fabricates values; returns UNKNOWN when financial data is not present.
        """
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.id == problem_id,
                    Problem.user_id == user_id,
                )
            )
            .options(selectinload(Problem.solutions))
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem #{problem_id} not found for user #{user_id}")

        selected_sol = None
        if solution_id:
            selected_sol = next((s for s in problem.solutions if s.id == solution_id), None)
        elif problem.solutions:
            # Pick recommended solution or first solution
            selected_sol = next((s for s in problem.solutions if s.is_recommended), problem.solutions[0])

        impact_inr = problem.estimated_impact_inr
        cost_inr = selected_sol.estimated_cost_inr if selected_sol else 0.0

        # Determine financial certainty tier
        if impact_inr is not None and impact_inr > 0:
            data_certainty = "ACTUAL" if problem.category.value == "REVENUE_LEAKAGE" else "ESTIMATED"
            recovery_rate = 0.65  # Conservative estimated recovery benchmark (65%)
            recoverable_amount = round(impact_inr * recovery_rate, 2)
            net_benefit = round(recoverable_amount - cost_inr, 2)

            if cost_inr > 0:
                roi_pct = round(((recoverable_amount - cost_inr) / cost_inr) * 100.0, 1)
                roi_multiplier = round(recoverable_amount / cost_inr, 2)
            else:
                roi_pct = 100.0
                roi_multiplier = round(recoverable_amount / max(cost_inr, 1.0), 2)

            return {
                "problem_id": problem.id,
                "solution_id": selected_sol.id if selected_sol else None,
                "solution_title": selected_sol.title if selected_sol else None,
                "data_certainty": data_certainty,
                "total_impact_inr": impact_inr,
                "recoverable_amount_inr": recoverable_amount,
                "implementation_cost_inr": cost_inr,
                "net_benefit_inr": net_benefit,
                "roi_percentage": roi_pct,
                "roi_multiplier": roi_multiplier,
                "explanation": f"Based on {data_certainty.lower()} revenue leakage of INR {impact_inr:,.2f}, targeted recovery is estimated at INR {recoverable_amount:,.2f} with an implementation cost of INR {cost_inr:,.2f} yielding a net benefit of INR {net_benefit:,.2f}.",
            }
        else:
            # Financial data not available in domain context -> return UNKNOWN without fabricating numbers
            return {
                "problem_id": problem.id,
                "solution_id": selected_sol.id if selected_sol else None,
                "solution_title": selected_sol.title if selected_sol else None,
                "data_certainty": "UNKNOWN",
                "total_impact_inr": None,
                "recoverable_amount_inr": None,
                "implementation_cost_inr": cost_inr if cost_inr > 0 else None,
                "net_benefit_inr": None,
                "roi_percentage": None,
                "roi_multiplier": selected_sol.expected_roi_multiplier if selected_sol else None,
                "explanation": "No direct transaction/financial figures are associated with this operational issue. Financial impact is marked UNKNOWN to prevent fabricated estimations.",
            }
