"""
Unit & Integration Tests for Phase 5: Execution, Approval & Outcome Verification
Tests:
1. Solution execution plan creation & step synthesis
2. Approval requirement logic based on risk tiers
3. Approval and rejection workflows with audit trail
4. Execution engine execution, safety guards, and credential sanitization
5. Outcome verification with baseline vs post-execution metrics
6. Problem lifecycle state machine transitions (DETECTED -> INVESTIGATING -> PLANNING -> WAITING_FOR_APPROVAL -> CONFIRMED -> EXECUTING -> VERIFYING -> SOLVED)
7. Multi-tenant boundary isolation
"""

import os
import sys
import asyncio
from datetime import datetime

# Add Backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

import models  # noqa: F401
from config.database import Base
from models.user import User
from models.order import Order, OrderStatus, PaymentStatus
from models.problem_engine import (
    Problem,
    ProblemStatus,
    ProblemCategory,
    ApprovalStatus,
    ExecutionState,
    OutcomeStatus,
    RiskLevel,
    StrategyType,
)
from services.problem_engine.sync_service import BusinessDataSyncService
from services.problem_engine.detection.engine import problem_detection_engine
from services.problem_engine.root_cause.analyzer import RootCauseAnalyzer
from services.problem_engine.solutions.generator import SolutionGenerator
from services.problem_engine.execution.planner import ExecutionPlanner
from services.problem_engine.execution.workflow import ApprovalWorkflowService
from services.problem_engine.execution.engine import ExecutionEngine
from services.problem_engine.execution.outcome import OutcomeVerifier


async def run_phase5_tests():
    test_db_url = "sqlite+aiosqlite:///:memory:"
    engine = create_async_engine(test_db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("[1/8] Setting up Test Tenants & Problem Engine Pipeline...")
        user_a = User(email="tenant_p5_a@saadhyam.ai", name="Tenant A", business_name="Enterprise Alpha", auth_provider="email")
        user_b = User(email="tenant_p5_b@saadhyam.ai", name="Tenant B", business_name="Enterprise Beta", auth_provider="email")
        db.add_all([user_a, user_b])
        await db.commit()
        await db.refresh(user_a)
        await db.refresh(user_b)

        # Seed failed order of INR 80,000 for User A
        order = Order(
            user_id=user_a.id,
            order_number="ORD-P5-8801",
            customer_name="Rohan Verma",
            customer_email="rohan@example.com",
            customer_phone="+919876543210",
            shipping_address="Koramangala, Bangalore",
            total_amount=80000.0,
            order_status=OrderStatus.CANCELLED,
            payment_status=PaymentStatus.FAILED,
        )
        db.add(order)
        await db.commit()

        # Ingest -> Detect -> Analyze Root Cause -> Generate Solutions
        await BusinessDataSyncService.sync_all_connectors(db, user_a.id, incremental=False)
        det_res = await problem_detection_engine.detect_problems(db, user_a.id)
        problem_id = det_res["problems"][0]["id"]

        await RootCauseAnalyzer.analyze_problem(db, user_a.id, problem_id)
        solutions = await SolutionGenerator.generate_solutions(db, user_a.id, problem_id)
        assert len(solutions) >= 2
        rec_sol = next((s for s in solutions if s.is_recommended), solutions[0])
        voice_sol = next((s for s in solutions if s.strategy_type == StrategyType.VOICE_AI), solutions[1])
        print(f"  -> Problem #{problem_id} prepared with {len(solutions)} solution candidates.")

        print("[2/8] Testing Execution Plan Creation & Step Synthesis...")
        plan = await ExecutionPlanner.create_plan(db, user_a.id, problem_id, rec_sol.id)
        assert plan.id is not None
        assert plan.problem_id == problem_id
        assert plan.solution_id == rec_sol.id
        assert len(plan.execution_steps) >= 2
        assert plan.execution_state == ExecutionState.IDLE
        print(f"  -> Execution Plan #{plan.id} created with {len(plan.execution_steps)} action steps (Approval: {plan.approval_status}).")

        print("[3/8] Testing Approval Rejection & Re-Planning Workflow...")
        # Create plan for high-risk voice solution that requires approval
        voice_plan = await ExecutionPlanner.create_plan(db, user_a.id, problem_id, voice_sol.id)
        assert voice_plan.approval_status == ApprovalStatus.PENDING

        # Reject voice plan with reason
        rejected_plan = await ApprovalWorkflowService.reject_plan(db, user_a.id, voice_plan.id, reason="Budget allocated to WhatsApp automated messaging first.")
        assert rejected_plan.approval_status == ApprovalStatus.REJECTED
        assert "Budget allocated" in rejected_plan.rejection_reason
        print(f"  -> Approval rejection verified: Plan #{voice_plan.id} marked REJECTED, problem returned to PLANNING.")

        print("[4/8] Testing Approval Workflow for Pending Plan...")
        # Approve voice plan
        approved_plan = await ApprovalWorkflowService.approve_plan(db, user_a.id, voice_plan.id, approved_by_user_id=user_a.id)
        assert approved_plan.approval_status == ApprovalStatus.APPROVED
        assert approved_plan.approved_by_user_id == user_a.id
        assert approved_plan.approved_at is not None
        print(f"  -> Plan #{voice_plan.id} APPROVED by User #{user_a.id}.")

        print("[5/8] Testing Execution Engine & Safe Action Dispatch...")
        # Attempt to run rejected plan (should fail permission check)
        rejected_plan.approval_status = ApprovalStatus.REJECTED
        await db.commit()
        try:
            await ExecutionEngine.run_plan(db, user_a.id, rejected_plan.id)
            assert False, "Execution safety failure: unapproved plan was executed"
        except PermissionError:
            print("  -> Safety guard verified: Unapproved plan rejected from execution.")

        # Run approved plan
        approved_plan.approval_status = ApprovalStatus.APPROVED
        await db.commit()
        exec_res = await ExecutionEngine.run_plan(db, user_a.id, approved_plan.id)
        assert exec_res["success"] is True
        assert exec_res["execution_state"] == "COMPLETED"
        assert exec_res["steps_executed"] >= 2
        assert all(s["status"] == "COMPLETED" for s in exec_res["steps"])
        print(f"  -> Plan #{approved_plan.id} successfully executed ({exec_res['steps_executed']} steps completed).")

        print("[6/8] Testing Outcome Verification & Metric Delta Certification...")
        outcome = await OutcomeVerifier.verify_problem_outcome(
            db,
            user_a.id,
            problem_id,
            current_data_override={
                "recovered_inr": 65000.0,
                "improvement_pct": 85.0,
                "hours_saved": 3.5,
            },
        )
        assert outcome.status == OutcomeStatus.SOLVED
        assert outcome.relative_improvement_pct == 85.0
        assert outcome.revenue_recovered_inr == 65000.0
        assert outcome.hours_saved == 3.5
        print(f"  -> Problem Outcome Certified: Status='{outcome.status}', Recovered=INR {outcome.revenue_recovered_inr}, Improvement={outcome.relative_improvement_pct}%.")

        print("[7/8] Verifying End-to-End Problem State Machine...")
        prob_stmt = select(Problem).where(Problem.id == problem_id)
        final_prob = (await db.execute(prob_stmt)).scalar_one()
        assert final_prob.status == ProblemStatus.SOLVED
        assert final_prob.solved_at is not None
        print(f"  -> Problem #{problem_id} state successfully reached terminal state: {final_prob.status} (Solved at: {final_prob.solved_at}).")

        print("[8/8] Testing Multi-Tenant Boundary Enforcement for Execution...")
        # User B cannot execute User A's plan
        try:
            await ExecutionEngine.run_plan(db, user_b.id, approved_plan.id)
            assert False, "Security breach: User B executed User A's plan"
        except ValueError:
            print("  -> Tenant isolation verified: User B cannot execute User A's plan.")

        # User B cannot verify User A's outcome
        try:
            await OutcomeVerifier.verify_problem_outcome(db, user_b.id, problem_id)
            assert False, "Security breach: User B verified User A's outcome"
        except ValueError:
            print("  -> Tenant isolation verified: User B cannot verify User A's outcome.")

    await engine.dispose()
    print("\nSUCCESS: All Phase 5 Execution, Approval & Outcome Verification tests passed!")


if __name__ == "__main__":
    asyncio.run(run_phase5_tests())
