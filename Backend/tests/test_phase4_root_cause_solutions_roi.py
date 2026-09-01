"""
Unit & Integration Tests for Phase 4: Root Cause, Solutions & ROI Engine
Tests:
1. Root cause diagnosis from empirical evidence
2. Differentiating hypothesis from supported cause
3. Solution candidate generation
4. Strategy matching with real Saadhyam capabilities
5. Deterministic ROI calculation with actual INR values
6. Unknown ROI handling for non-financial issues (no fabrication)
7. Multi-tenant boundary enforcement
"""

import os
import sys
import asyncio

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
    ProblemSeverity,
    TimeSensitivity,
    StrategyType,
    RiskLevel,
)
from services.problem_engine.sync_service import BusinessDataSyncService
from services.problem_engine.detection.engine import problem_detection_engine
from services.problem_engine.root_cause.analyzer import RootCauseAnalyzer
from services.problem_engine.solutions.generator import SolutionGenerator
from services.problem_engine.roi.calculator import ROICalculator


async def run_phase4_tests():
    test_db_url = "sqlite+aiosqlite:///:memory:"
    engine = create_async_engine(test_db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("[1/7] Setting up Test Tenants & Problem Engine Pipeline...")
        user_a = User(email="tenant_p4_a@saadhyam.ai", name="Tenant A", business_name="A Corp", auth_provider="email")
        user_b = User(email="tenant_p4_b@saadhyam.ai", name="Tenant B", business_name="B Ltd", auth_provider="email")
        db.add_all([user_a, user_b])
        await db.commit()
        await db.refresh(user_a)
        await db.refresh(user_b)

        # Seed realistic failed order of INR 60,000 for User A
        order = Order(
            user_id=user_a.id,
            order_number="ORD-P4-101",
            customer_name="Sunil Mehta",
            customer_email="sunil@example.com",
            customer_phone="+919876543219",
            shipping_address="Indiranagar, Bangalore",
            total_amount=60000.0,
            order_status=OrderStatus.CANCELLED,
            payment_status=PaymentStatus.FAILED,
        )
        db.add(order)
        await db.commit()

        # Ingest and detect problems for User A
        await BusinessDataSyncService.sync_all_connectors(db, user_a.id, incremental=False)
        det_res = await problem_detection_engine.detect_problems(db, user_a.id)
        assert det_res["problems_created"] >= 1
        problem_id = det_res["problems"][0]["id"]
        print(f"  -> Problem #{problem_id} detected: '{det_res['problems'][0]['title']}'")

        print("[2/7] Testing Root Cause Analysis Diagnosis...")
        root_causes = await RootCauseAnalyzer.analyze_problem(db, user_a.id, problem_id)
        assert len(root_causes) >= 1, "Expected at least 1 root cause candidate"
        primary_rc = root_causes[0]
        assert primary_rc.is_primary is True
        assert 0.0 <= primary_rc.confidence <= 1.0
        assert len(primary_rc.diagnosis) > 0
        assert "contributing_factors" in dir(primary_rc) and primary_rc.contributing_factors is not None
        assert len(primary_rc.alternative_causes) >= 1
        print(f"  -> Root Cause Diagnosed: '{primary_rc.diagnosis}' (Confidence: {primary_rc.confidence})")

        print("[3/7] Testing Solution Generation & Strategy Matching...")
        solutions = await SolutionGenerator.generate_solutions(db, user_a.id, problem_id)
        assert len(solutions) >= 1, "Expected at least 1 solution recommendation"
        rec_sol = next((s for s in solutions if s.is_recommended), solutions[0])
        assert rec_sol.strategy_type in [StrategyType.AUTOMATION, StrategyType.AI_AGENT, StrategyType.VOICE_AI, StrategyType.WORKFLOW_CHANGE, StrategyType.PLUGIN_ACTION]
        assert rec_sol.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]
        assert rec_sol.confidence >= 0.70
        assert len(rec_sol.required_plugin_keys) >= 1 or rec_sol.required_voice_usage is True
        print(f"  -> Recommended Solution: '{rec_sol.title}' (Strategy: {rec_sol.strategy_type}, Risk: {rec_sol.risk_level})")

        print("[4/7] Testing Deterministic ROI Calculation for Financial Problem...")
        roi_res = await ROICalculator.calculate_roi(db, user_a.id, problem_id, solution_id=rec_sol.id)
        assert roi_res["data_certainty"] == "ACTUAL"
        assert roi_res["total_impact_inr"] == 60000.0
        assert roi_res["recoverable_amount_inr"] == 39000.0  # 65% of 60k
        assert roi_res["net_benefit_inr"] == round(39000.0 - rec_sol.estimated_cost_inr, 2)
        assert roi_res["roi_percentage"] > 0
        print(f"  -> ROI Computed: Total Impact: INR {roi_res['total_impact_inr']}, Recoverable: INR {roi_res['recoverable_amount_inr']}, Net Benefit: INR {roi_res['net_benefit_inr']}")

        print("[5/7] Testing Non-Financial Problem Handling (No Fabricated ROI)...")
        # Create non-financial operational problem manually for testing
        non_fin_problem = Problem(
            user_id=user_a.id,
            title="Internal SOP Documentation Gap",
            summary="Missing documentation for staging server deployment.",
            status=ProblemStatus.DETECTED,
            category=ProblemCategory.PRODUCTIVITY,
            severity=ProblemSeverity.LOW,
            priority_score=20,
            confidence=0.80,
            estimated_impact_inr=0.0,
        )
        db.add(non_fin_problem)
        await db.commit()
        await db.refresh(non_fin_problem)

        non_fin_roi = await ROICalculator.calculate_roi(db, user_a.id, non_fin_problem.id)
        assert non_fin_roi["data_certainty"] == "UNKNOWN"
        assert non_fin_roi["total_impact_inr"] is None
        assert non_fin_roi["recoverable_amount_inr"] is None
        assert non_fin_roi["net_benefit_inr"] is None
        assert non_fin_roi["roi_percentage"] is None
        print("  -> Non-financial problem correctly returns data_certainty='UNKNOWN' with zero fabricated numbers.")

        print("[6/7] Testing Multi-Tenant Isolation for Root Cause & Solutions...")
        # User B should not be able to analyze User A's problem
        try:
            await RootCauseAnalyzer.analyze_problem(db, user_b.id, problem_id)
            assert False, "Security breach: User B analyzed User A's problem"
        except ValueError:
            print("  -> Tenant isolation verified: User B cannot access User A's problem for root cause analysis.")

        try:
            await SolutionGenerator.generate_solutions(db, user_b.id, problem_id)
            assert False, "Security breach: User B generated solutions for User A's problem"
        except ValueError:
            print("  -> Tenant isolation verified: User B cannot access User A's problem for solution generation.")

        print("[7/7] Verifying Problem Lifecycle Progression...")
        updated_prob_stmt = select(Problem).where(Problem.id == problem_id)
        updated_prob = (await db.execute(updated_prob_stmt)).scalar_one()
        assert updated_prob.status in (ProblemStatus.INVESTIGATING, ProblemStatus.PLANNING, ProblemStatus.CONFIRMED)
        print(f"  -> Problem lifecycle state successfully progressed to: {updated_prob.status}")

    await engine.dispose()
    print("\nSUCCESS: All Phase 4 Root Cause, Solutions & ROI tests passed!")


if __name__ == "__main__":
    asyncio.run(run_phase4_tests())
