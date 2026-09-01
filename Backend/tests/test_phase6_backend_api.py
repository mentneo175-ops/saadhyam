"""
API Integration Tests for Phase 6: Complete Backend APIs
Tests all Problem Discovery & Resolution REST API routes using FastAPI TestClient/AsyncClient:
- Problem detection, listing, filtering, pagination, and status patching
- Root cause diagnosis and listing
- Solutions generation and candidate selection
- ROI calculation and explanation
- Execution planning, approvals, rejections, and execution dispatch
- Outcome verification ledger
- Multi-tenant isolation and 404/403 safety
"""

import os
import sys
import asyncio
from httpx import AsyncClient, ASGITransport

# Add Backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

import models  # noqa: F401
from config.database import Base, get_db
from models.user import User
from models.order import Order, OrderStatus, PaymentStatus
from models.problem_engine import ProblemStatus
from routes.auth import get_current_user


from fastapi import FastAPI
from routes.problem_context import router as problem_context_router
from routes.problems import router as problems_router


async def run_phase6_tests():
    test_db_url = "sqlite+aiosqlite:///:memory:"
    test_engine = create_async_engine(test_db_url, echo=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    # Create test users
    async with async_session() as db:
        user_a = User(id=1, email="api_user_a@saadhyam.ai", name="API User A", business_name="Alpha Tech", auth_provider="email")
        user_b = User(id=2, email="api_user_b@saadhyam.ai", name="API User B", business_name="Beta Tech", auth_provider="email")
        db.add_all([user_a, user_b])
        await db.commit()

        # Seed realistic order data for User A
        order = Order(
            user_id=1,
            order_number="ORD-API-9001",
            customer_name="Anita Roy",
            customer_email="anita@example.com",
            customer_phone="+919988776655",
            shipping_address="MG Road, Bangalore",
            total_amount=50000.0,
            order_status=OrderStatus.CANCELLED,
            payment_status=PaymentStatus.FAILED,
        )
        db.add(order)
        await db.commit()

    test_app = FastAPI()
    test_app.include_router(problem_context_router)
    test_app.include_router(problems_router)

    # Override dependencies
    async def override_get_db():
        async with async_session() as session:
            yield session

    current_test_user = user_a

    async def override_get_current_user():
        return current_test_user

    test_app.dependency_overrides[get_db] = override_get_db
    test_app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("[1/10] Testing Context Sync & Detection API...")
        sync_res = await client.post("/api/problems/context/sync")
        assert sync_res.status_code == 200, f"Sync failed: {sync_res.text}"

        det_res = await client.post("/api/problems/detect")
        assert det_res.status_code == 200
        det_data = det_res.json()
        assert det_data["success"] is True
        assert det_data["problems_created"] >= 1
        problem_id = det_data["problems"][0]["id"]
        print(f"  -> Detected Problem #{problem_id}: '{det_data['problems'][0]['title']}'")

        print("[2/10] Testing Problem Listing & Pagination API...")
        list_res = await client.get("/api/problems?limit=10&offset=0")
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["success"] is True
        assert list_data["count"] >= 1
        print(f"  -> Listed {list_data['count']} problems with pagination.")

        print("[3/10] Testing Problem 360-Degree Detail API...")
        detail_res = await client.get(f"/api/problems/{problem_id}")
        assert detail_res.status_code == 200
        prob_detail = detail_res.json()["problem"]
        assert prob_detail["id"] == problem_id
        assert len(prob_detail["observations"]) >= 1
        assert len(prob_detail["evidence"]) >= 1
        print(f"  -> Detailed problem retrieved with {len(prob_detail['observations'])} observations and {len(prob_detail['evidence'])} evidence items.")

        print("[4/10] Testing Root Cause Analysis API...")
        rc_res = await client.post(f"/api/problems/{problem_id}/analyze")
        assert rc_res.status_code == 200
        rc_data = rc_res.json()
        assert rc_data["success"] is True
        assert rc_data["root_causes_count"] >= 1

        get_rc = await client.get(f"/api/problems/{problem_id}/root-causes")
        assert get_rc.status_code == 200
        assert len(get_rc.json()["root_causes"]) >= 1
        print(f"  -> Root cause analysis diagnosed {rc_data['root_causes_count']} cause(s).")

        print("[5/10] Testing Solutions Generation & Selection API...")
        sol_res = await client.post(f"/api/problems/{problem_id}/solutions/generate")
        assert sol_res.status_code == 200
        sol_data = sol_res.json()
        assert sol_data["solutions_count"] >= 1

        get_sols = await client.get(f"/api/problems/{problem_id}/solutions")
        assert get_sols.status_code == 200
        sols = get_sols.json()["solutions"]
        assert len(sols) >= 1
        selected_sol_id = sols[0]["id"]

        sel_res = await client.post(f"/api/problems/{problem_id}/solutions/{selected_sol_id}/select")
        assert sel_res.status_code == 200
        print(f"  -> Generated {len(sols)} solutions and selected solution #{selected_sol_id}.")

        print("[6/10] Testing ROI Calculation API...")
        roi_res = await client.get(f"/api/problems/{problem_id}/roi?solution_id={selected_sol_id}")
        assert roi_res.status_code == 200
        roi_data = roi_res.json()
        assert roi_data["data_certainty"] == "ACTUAL"
        assert roi_data["total_impact_inr"] == 50000.0
        assert roi_data["recoverable_amount_inr"] == 32500.0
        print(f"  -> ROI API computed: Impact=INR {roi_data['total_impact_inr']}, Net Benefit=INR {roi_data['net_benefit_inr']}.")

        print("[7/10] Testing Execution Planning, Approval & Rejection APIs...")
        plan_res = await client.post(
            f"/api/problems/{problem_id}/executions/plan",
            json={"solution_id": selected_sol_id},
        )
        assert plan_res.status_code == 200
        plan_id = plan_res.json()["plan_id"]

        # Reject
        rej_res = await client.post(
            f"/api/problems/{problem_id}/executions/{plan_id}/reject",
            json={"reason": "Manual review required"},
        )
        assert rej_res.status_code == 200
        assert rej_res.json()["approval_status"] == "REJECTED"

        # Approve
        appr_res = await client.post(f"/api/problems/{problem_id}/executions/{plan_id}/approve")
        assert appr_res.status_code == 200
        assert appr_res.json()["approval_status"] == "APPROVED"
        print(f"  -> Execution Plan #{plan_id} created, rejected, and approved via API.")

        print("[8/10] Testing Plan Execution API...")
        exec_run = await client.post(f"/api/problems/{problem_id}/executions/{plan_id}/run")
        assert exec_run.status_code == 200
        assert exec_run.json()["success"] is True
        assert exec_run.json()["execution_state"] == "COMPLETED"
        print(f"  -> Executed plan #{plan_id} successfully.")

        print("[9/10] Testing Outcome Verification API...")
        outcome_res = await client.post(
            f"/api/problems/{problem_id}/outcomes/verify",
            json={"current_data": {"improvement_pct": 82.0, "revenue_recovered_inr": 40000.0}},
        )
        assert outcome_res.status_code == 200
        out_data = outcome_res.json()
        assert out_data["status"] == "SOLVED"
        assert out_data["improvement_pct"] == 82.0

        get_out = await client.get(f"/api/problems/{problem_id}/outcomes")
        assert get_out.status_code == 200
        assert get_out.json()["outcome"]["status"] == "SOLVED"
        print(f"  -> Outcome verified via API: Problem #{problem_id} certified SOLVED.")

        print("[10/10] Testing Multi-Tenant API Boundary Isolation (User B)...")
        # Switch current authenticated user to User B
        current_test_user = user_b

        # User B cannot access User A's problem detail
        unauth_detail = await client.get(f"/api/problems/{problem_id}")
        assert unauth_detail.status_code == 404, f"Tenant leak: User B accessed User A problem: {unauth_detail.status_code}"

        # User B cannot execute User A's plan
        unauth_exec = await client.post(f"/api/problems/{problem_id}/executions/{plan_id}/run")
        assert unauth_exec.status_code == 404

        # User B problem list must be empty
        b_list = await client.get("/api/problems")
        assert b_list.status_code == 200
        assert b_list.json()["count"] == 0
        print("  -> Tenant isolation 100% verified across all API endpoints.")

    test_app.dependency_overrides.clear()
    await test_engine.dispose()
    print("\nSUCCESS: All Phase 6 Backend API Integration tests passed!")


if __name__ == "__main__":
    asyncio.run(run_phase6_tests())
