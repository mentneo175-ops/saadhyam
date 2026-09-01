"""
Approval & Problem Lifecycle Workflow Service (Phase 5)
Enforces human-in-the-loop approvals, audit timestamps, and valid state machine transitions.
"""

import logging
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    SolutionExecutionPlan,
    ProblemStatus,
    ApprovalStatus,
)

logger = logging.getLogger(__name__)

# Valid lifecycle transition graph
VALID_TRANSITIONS = {
    ProblemStatus.DETECTED: [ProblemStatus.INVESTIGATING, ProblemStatus.PLANNING, ProblemStatus.FAILED],
    ProblemStatus.INVESTIGATING: [ProblemStatus.PLANNING, ProblemStatus.CONFIRMED, ProblemStatus.FAILED],
    ProblemStatus.PLANNING: [ProblemStatus.WAITING_FOR_APPROVAL, ProblemStatus.CONFIRMED, ProblemStatus.FAILED],
    ProblemStatus.WAITING_FOR_APPROVAL: [ProblemStatus.CONFIRMED, ProblemStatus.PLANNING, ProblemStatus.FAILED],
    ProblemStatus.CONFIRMED: [ProblemStatus.EXECUTING, ProblemStatus.PLANNING, ProblemStatus.FAILED],
    ProblemStatus.EXECUTING: [ProblemStatus.VERIFYING, ProblemStatus.FAILED],
    ProblemStatus.VERIFYING: [ProblemStatus.SOLVED, ProblemStatus.PARTIALLY_SOLVED, ProblemStatus.IMPROVING, ProblemStatus.FAILED, ProblemStatus.PLANNING],
    ProblemStatus.IMPROVING: [ProblemStatus.SOLVED, ProblemStatus.PARTIALLY_SOLVED, ProblemStatus.MONITORING, ProblemStatus.PLANNING],
    ProblemStatus.MONITORING: [ProblemStatus.SOLVED, ProblemStatus.PLANNING],
    ProblemStatus.SOLVED: [ProblemStatus.PLANNING],  # Reopen if problem reoccurs
    ProblemStatus.PARTIALLY_SOLVED: [ProblemStatus.PLANNING],
    ProblemStatus.FAILED: [ProblemStatus.PLANNING],
}


class ApprovalWorkflowService:
    """Service to manage execution approvals and problem lifecycle transitions."""

    @classmethod
    async def approve_plan(
        cls,
        db: AsyncSession,
        user_id: int,
        plan_id: int,
        approved_by_user_id: int,
    ) -> SolutionExecutionPlan:
        """
        Approves an execution plan and transitions problem lifecycle state.
        """
        stmt = (
            select(SolutionExecutionPlan)
            .join(Problem, SolutionExecutionPlan.problem_id == Problem.id)
            .where(
                and_(
                    SolutionExecutionPlan.id == plan_id,
                    Problem.user_id == user_id,
                )
            )
            .options(selectinload(SolutionExecutionPlan.problem))
        )
        res = await db.execute(stmt)
        plan = res.scalar_one_or_none()

        if not plan:
            raise ValueError(f"Execution plan #{plan_id} not found for user #{user_id}")

        plan.approval_status = ApprovalStatus.APPROVED
        plan.approved_by_user_id = approved_by_user_id
        plan.approved_at = datetime.utcnow()
        plan.rejection_reason = None

        if plan.problem:
            plan.problem.status = ProblemStatus.CONFIRMED
            plan.problem.updated_at = datetime.utcnow()

        await db.commit()
        return plan

    @classmethod
    async def reject_plan(
        cls,
        db: AsyncSession,
        user_id: int,
        plan_id: int,
        reason: str,
    ) -> SolutionExecutionPlan:
        """
        Rejects an execution plan with audited reason and returns problem to planning.
        """
        stmt = (
            select(SolutionExecutionPlan)
            .join(Problem, SolutionExecutionPlan.problem_id == Problem.id)
            .where(
                and_(
                    SolutionExecutionPlan.id == plan_id,
                    Problem.user_id == user_id,
                )
            )
            .options(selectinload(SolutionExecutionPlan.problem))
        )
        res = await db.execute(stmt)
        plan = res.scalar_one_or_none()

        if not plan:
            raise ValueError(f"Execution plan #{plan_id} not found for user #{user_id}")

        plan.approval_status = ApprovalStatus.REJECTED
        plan.rejection_reason = reason

        if plan.problem:
            plan.problem.status = ProblemStatus.PLANNING
            plan.problem.updated_at = datetime.utcnow()

        await db.commit()
        return plan

    @classmethod
    def validate_lifecycle_transition(
        cls, current_status: ProblemStatus, target_status: ProblemStatus
    ) -> bool:
        """Validates if a lifecycle transition follows the state machine rules."""
        valid_targets = VALID_TRANSITIONS.get(current_status, [])
        return target_status in valid_targets
