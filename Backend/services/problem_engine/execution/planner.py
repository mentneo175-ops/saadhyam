"""
Execution Planner Subsystem (Phase 5)
Synthesizes structured step-by-step SolutionExecutionPlan records
with permission validation and human-in-the-loop approval requirements.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    ProblemSolution,
    SolutionExecutionPlan,
    ProblemStatus,
    ApprovalStatus,
    ExecutionState,
    RiskLevel,
    StrategyType,
)

logger = logging.getLogger(__name__)


class ExecutionPlanner:
    """Service to create executable multi-step plans for approved solutions."""

    @classmethod
    async def create_plan(
        cls,
        db: AsyncSession,
        user_id: int,
        problem_id: int,
        solution_id: int,
    ) -> SolutionExecutionPlan:
        """
        Creates a structured SolutionExecutionPlan for a solution candidate.
        Determines whether human approval is required based on risk and strategy type.
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
                selectinload(Problem.solutions),
                selectinload(Problem.execution_plans),
            )
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem #{problem_id} not found for user #{user_id}")

        solution = next((s for s in problem.solutions if s.id == solution_id), None)
        if not solution:
            raise ValueError(f"Solution #{solution_id} not found for problem #{problem_id}")

        # Build step-by-step execution actions based on strategy type
        steps = []
        if solution.strategy_type == StrategyType.AUTOMATION:
            steps.append({
                "step_id": 1,
                "name": "Configure Trigger Webhooks & Payload Templates",
                "action_type": "WEBHOOK_CONFIG",
                "required_capability": solution.required_plugin_keys[0] if solution.required_plugin_keys else "system",
                "status": "PENDING",
                "parameters": {"problem_id": problem.id, "solution_id": solution.id},
            })
            steps.append({
                "step_id": 2,
                "name": "Dispatch Automated Customer Recovery Notification",
                "action_type": "MESSAGE_DISPATCH",
                "required_capability": solution.required_plugin_keys[0] if solution.required_plugin_keys else "system",
                "status": "PENDING",
                "parameters": {"notification_type": "RECOVERY_ALERT", "auto_retry": True},
            })
            steps.append({
                "step_id": 3,
                "name": "Initialize Outcome Telemetry Poller",
                "action_type": "TELEMETRY_MONITOR",
                "required_capability": "problem_engine",
                "status": "PENDING",
                "parameters": {"target_metric": "recovery_inr"},
            })

        elif solution.strategy_type == StrategyType.VOICE_AI:
            steps.append({
                "step_id": 1,
                "name": "Provision Voice AI Outbound Concierge Script",
                "action_type": "VOICE_SCRIPT_PROVISION",
                "required_capability": "voice_crm",
                "status": "PENDING",
                "parameters": {"agent_role": "payment_assistance"},
            })
            steps.append({
                "step_id": 2,
                "name": "Queue Priority Customer Outreach Sessions",
                "action_type": "VOICE_DISPATCH",
                "required_capability": "voice_crm",
                "status": "PENDING",
                "parameters": {"batch_size": min(5, problem.affected_customers_count or 1)},
            })

        else:
            steps.append({
                "step_id": 1,
                "name": "Apply Workflow Configuration Adjustments",
                "action_type": "WORKFLOW_UPDATE",
                "required_capability": "system",
                "status": "PENDING",
                "parameters": {"strategy": solution.strategy_type.value},
            })
            steps.append({
                "step_id": 2,
                "name": "Verify Execution Health",
                "action_type": "HEALTH_CHECK",
                "required_capability": "system",
                "status": "PENDING",
                "parameters": {},
            })

        # Determine approval requirement
        requires_approval = (
            solution.risk_level in (RiskLevel.HIGH, RiskLevel.MEDIUM)
            or solution.strategy_type in (StrategyType.VOICE_AI, StrategyType.WORKFLOW_CHANGE)
        )
        approval_status = ApprovalStatus.PENDING if requires_approval else ApprovalStatus.APPROVED

        plan = SolutionExecutionPlan(
            solution_id=solution.id,
            problem_id=problem.id,
            approval_status=approval_status,
            execution_state=ExecutionState.IDLE,
            execution_steps=steps,
            started_at=None,
            completed_at=None,
        )
        db.add(plan)

        # Update problem status
        if requires_approval:
            problem.status = ProblemStatus.WAITING_FOR_APPROVAL
        else:
            problem.status = ProblemStatus.CONFIRMED

        problem.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(plan)

        return plan
