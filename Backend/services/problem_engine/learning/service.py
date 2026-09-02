"""
Problem Learning & Closed-Loop Replanning Service (Phase 11)
Calculates prediction error variance between estimated and verified outcomes,
indexes strategy effectiveness trends, and orchestrates guarded replanning.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import defaultdict
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    ProblemOutcome,
    ProblemSolution,
    SolutionExecutionPlan,
    ProblemLearningRecord,
    ProblemStatus,
    OutcomeStatus,
    ProblemCategory,
    StrategyType,
)
from services.problem_engine.solutions.generator import SolutionGenerator

logger = logging.getLogger(__name__)


class ProblemLearningService:
    """
    Manages closed-loop learning from verified outcomes and drives safe replanning.
    """

    @classmethod
    async def record_outcome_learning(
        cls,
        db: AsyncSession,
        user_id: int,
        problem_id: int,
    ) -> ProblemLearningRecord:
        """
        Derives verifiable learning signals from a problem's certified outcome.
        Calculates prediction variance and indexes strategy performance without fabricating facts.
        """
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.id == problem_id,
                    Problem.user_id == user_id,
                )
            )
            .options(
                selectinload(Problem.outcome),
                selectinload(Problem.solutions),
                selectinload(Problem.execution_plans),
                selectinload(Problem.learning_records),
            )
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem #{problem_id} not found for user #{user_id}")

        if not problem.outcome:
            raise ValueError(f"No outcome record exists for Problem #{problem_id}. Verify outcome first.")

        outcome = problem.outcome
        plans = problem.execution_plans or []
        active_plan = next((p for p in plans if p.execution_state.value == "COMPLETED"), None)
        if not active_plan and plans:
            active_plan = plans[0]

        solution_id = active_plan.solution_id if active_plan else None
        active_sol = next((s for s in problem.solutions if s.id == solution_id), None)
        if not active_sol and problem.solutions:
            active_sol = next((s for s in problem.solutions if s.is_recommended), problem.solutions[0])
            solution_id = active_sol.id

        predicted_impact = problem.estimated_impact_inr or problem.recovery_amount_inr or 0.0
        actual_impact = outcome.revenue_recovered_inr or outcome.cost_saved_inr or 0.0

        # Calculate prediction variance (error %)
        if predicted_impact > 0:
            variance_pct = round(((actual_impact - predicted_impact) / predicted_impact) * 100.0, 1)
        else:
            variance_pct = 0.0

        is_successful = outcome.status in (OutcomeStatus.SOLVED, OutcomeStatus.IMPROVING)

        strategy_str = (
            active_sol.strategy_type.value
            if active_sol and hasattr(active_sol.strategy_type, "value")
            else "UNKNOWN"
        )

        improvement_pct = outcome.relative_improvement_pct or 0.0
        if improvement_pct >= 80.0:
            effectiveness_tier = "HIGHLY_EFFECTIVE"
            weight_bias = 1.35
            takeaway = f"Strategy '{strategy_str}' successfully cleared friction with {improvement_pct:.1f}% measured improvement."
        elif improvement_pct >= 40.0:
            effectiveness_tier = "PARTIALLY_EFFECTIVE"
            weight_bias = 1.05
            takeaway = f"Strategy '{strategy_str}' produced moderate recovery ({improvement_pct:.1f}%), but residual friction remains."
        else:
            effectiveness_tier = "INEFFECTIVE"
            weight_bias = 0.50
            takeaway = f"Strategy '{strategy_str}' yielded minimal impact ({improvement_pct:.1f}%). Recommend alternative intervention."

        learned_signals = {
            "strategy_type": strategy_str,
            "solution_title": active_sol.title if active_sol else "Unknown Solution",
            "effectiveness_tier": effectiveness_tier,
            "weight_bias": weight_bias,
            "measured_improvement_pct": improvement_pct,
            "prediction_variance_pct": variance_pct,
            "hours_saved": outcome.hours_saved,
            "key_takeaway": takeaway,
            "recorded_at": datetime.utcnow().isoformat(),
        }

        # Check existing learning record for this problem
        existing_record = problem.learning_records[0] if problem.learning_records else None
        if existing_record:
            existing_record.solution_id = solution_id
            existing_record.execution_plan_id = active_plan.id if active_plan else None
            existing_record.predicted_impact_inr = predicted_impact
            existing_record.actual_verified_impact_inr = actual_impact
            existing_record.prediction_error_pct = variance_pct
            existing_record.outcome_status = outcome.status
            existing_record.is_successful = is_successful
            existing_record.learned_signals = learned_signals
            existing_record.updated_at = datetime.utcnow()
            record = existing_record
        else:
            record = ProblemLearningRecord(
                user_id=user_id,
                problem_id=problem.id,
                solution_id=solution_id,
                execution_plan_id=active_plan.id if active_plan else None,
                predicted_impact_inr=predicted_impact,
                actual_verified_impact_inr=actual_impact,
                prediction_error_pct=variance_pct,
                outcome_status=outcome.status,
                is_successful=is_successful,
                learned_signals=learned_signals,
                replan_triggered=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(record)

        await db.commit()
        await db.refresh(record)
        return record

    @classmethod
    async def get_strategy_effectiveness(
        cls,
        db: AsyncSession,
        user_id: int,
        category: Optional[ProblemCategory] = None,
    ) -> Dict[str, Any]:
        """
        Aggregates historical learning records to compute empirical win rates and bias weights per strategy.
        """
        stmt = (
            select(ProblemLearningRecord)
            .join(Problem, ProblemLearningRecord.problem_id == Problem.id)
            .where(
                and_(
                    ProblemLearningRecord.user_id == user_id,
                    *( [Problem.category == category] if category else [] )
                )
            )
            .order_by(desc(ProblemLearningRecord.created_at))
        )
        res = await db.execute(stmt)
        records = res.scalars().all()

        stats_by_strategy: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "total_runs": 0,
            "successes": 0,
            "total_improvement": 0.0,
            "total_error": 0.0,
        })

        for r in records:
            sig = r.learned_signals or {}
            strat = sig.get("strategy_type", "UNKNOWN")
            stats_by_strategy[strat]["total_runs"] += 1
            if r.is_successful:
                stats_by_strategy[strat]["successes"] += 1
            stats_by_strategy[strat]["total_improvement"] += sig.get("measured_improvement_pct", 0.0)
            stats_by_strategy[strat]["total_error"] += abs(r.prediction_error_pct or 0.0)

        aggregated_strategies = []
        for strat, data in stats_by_strategy.items():
            runs = data["total_runs"]
            win_rate = round((data["successes"] / runs) * 100.0, 1) if runs > 0 else 0.0
            avg_imp = round(data["total_improvement"] / runs, 1) if runs > 0 else 0.0
            avg_err = round(data["total_error"] / runs, 1) if runs > 0 else 0.0

            # Deterministic empirical weight bias:
            # win_rate >= 75% -> 1.30x boost
            # win_rate 40-74% -> 1.00x neutral
            # win_rate < 40%  -> 0.60x penalty
            if win_rate >= 75.0:
                bias = 1.30
            elif win_rate >= 40.0:
                bias = 1.00
            else:
                bias = 0.60

            aggregated_strategies.append({
                "strategy_type": strat,
                "trials_count": runs,
                "successful_trials": data["successes"],
                "win_rate_pct": win_rate,
                "avg_improvement_pct": avg_imp,
                "avg_prediction_error_pct": avg_err,
                "empirical_weight_bias": bias,
            })

        return {
            "total_learning_records": len(records),
            "category_filter": category.value if category else "ALL",
            "strategies_effectiveness": aggregated_strategies,
        }

    @classmethod
    async def replan_problem(
        cls,
        db: AsyncSession,
        user_id: int,
        problem_id: int,
    ) -> Dict[str, Any]:
        """
        Executes guarded closed-loop replanning for an unresolved problem.
        Uses historical outcome learnings to adjust candidate weights and synthesize fresh alternatives.
        CRITICAL SAFETY: Generated solutions require explicit human approval and never auto-execute.
        """
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.id == problem_id,
                    Problem.user_id == user_id,
                )
            )
            .options(
                selectinload(Problem.outcome),
                selectinload(Problem.solutions),
                selectinload(Problem.execution_plans),
                selectinload(Problem.learning_records),
            )
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem #{problem_id} not found for current tenant.")

        # Ensure learning record is up to date if outcome exists
        if problem.outcome:
            await cls.record_outcome_learning(db, user_id, problem_id)

        # Get historical strategy weights for this problem category
        strat_data = await cls.get_strategy_effectiveness(db, user_id, category=problem.category)
        strategy_biases = {
            s["strategy_type"]: s["empirical_weight_bias"]
            for s in strat_data.get("strategies_effectiveness", [])
        }

        # Identify previously failed strategy
        previous_failed_strat = None
        if problem.learning_records and not problem.learning_records[0].is_successful:
            previous_failed_strat = problem.learning_records[0].learned_signals.get("strategy_type")

        # Generate fresh candidate solutions
        solutions = await SolutionGenerator.generate_solutions(db, user_id, problem_id)

        # Apply empirical learning weights to solutions
        for sol in solutions:
            strat_val = sol.strategy_type.value if hasattr(sol.strategy_type, "value") else str(sol.strategy_type)
            bias = strategy_biases.get(strat_val, 1.0)
            if strat_val == previous_failed_strat:
                bias = 0.50  # Hard penalty for strategy that just failed on this specific problem
                sol.is_recommended = False

            sol.confidence = round(max(0.50, min(0.99, sol.confidence * bias)), 2)

        # Ensure top non-penalized solution is recommended
        best_sol = max(solutions, key=lambda s: s.confidence)
        for sol in solutions:
            sol.is_recommended = (sol.id == best_sol.id)

        # Set problem status back to PLANNING
        problem.status = ProblemStatus.PLANNING
        problem.updated_at = datetime.utcnow()

        # Update learning record replan_triggered flag
        if problem.learning_records:
            problem.learning_records[0].replan_triggered = True

        await db.commit()

        return {
            "success": True,
            "problem_id": problem.id,
            "replan_status": "PLANNING",
            "previous_failed_strategy": previous_failed_strat,
            "revised_solutions_count": len(solutions),
            "recommended_solution": {
                "id": best_sol.id,
                "title": best_sol.title,
                "strategy_type": best_sol.strategy_type.value,
                "confidence": best_sol.confidence,
                "expected_roi_multiplier": best_sol.expected_roi_multiplier,
            },
            "applied_strategy_biases": strategy_biases,
            "safety_notice": "Replanned solutions synthesized in PENDING approval state. Human authorization is strictly required before execution.",
        }
