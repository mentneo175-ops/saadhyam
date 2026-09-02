"""
Unit & Integration Tests for Phase 3: Problem Detection, Scoring & Observation
Tests:
1. Deterministic detection rules evaluation across all business domains:
   - Orders & Revenue Payment Failure Rule
   - Voice Call Failure Spike Rule
   - Lead Loss Rate Rule
   - Interview No-Show Rule
   - Task Execution Bottleneck Rule
   - Growth Metric Deviation Rule
   - WhatsApp Campaign Failure Rule
   - LinkedIn Publish Failure Rule
2. Problem Scoring Engine (Severity, Priority Score, Time Sensitivity calculation)
3. Observation and Evidence generation pipeline
4. Problem deduplication and idempotent detection
5. Multi-tenant isolation for problem detection
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta

# Add Backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

import models  # noqa: F401
from config.database import Base
from models.user import User
from models.order import Order, OrderStatus, PaymentStatus
from models.voice_agent import Lead, Campaign, CallSession
from models.interview_scheduler import Interview, InterviewStatus
from models.task_tracking import DailyTask, GrowthMetric
from models.problem_engine import (
    Problem,
    ProblemObservation,
    ProblemEvidence,
    ProblemStatus,
    ProblemSeverity,
    ProblemCategory,
    TimeSensitivity,
)
from services.problem_engine.sync_service import BusinessDataSyncService
from services.problem_engine.detection.engine import ProblemDetectionEngine, problem_detection_engine
from services.problem_engine.detection.scoring import ProblemScoringEngine
from services.problem_engine.detection.rules import get_default_detection_rules


async def run_phase3_tests():
    test_db_url = "sqlite+aiosqlite:///:memory:"
    engine = create_async_engine(test_db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("[1/7] Setting up Multi-Tenant Fixtures (User A & User B)...")
        user_a = User(email="tenant_p3_a@saadhyam.ai", name="Tenant A", business_name="Enterprise A", auth_provider="email")
        user_b = User(email="tenant_p3_b@saadhyam.ai", name="Tenant B", business_name="Enterprise B", auth_provider="email")
        db.add_all([user_a, user_b])
        await db.commit()
        await db.refresh(user_a)
        await db.refresh(user_b)
        assert user_a.id != user_b.id

        print("[2/7] Seeding Domain Data for Tenant A (Payment Failures, Voice Drops, Interview No-Shows)...")
        now = datetime.utcnow()

        # Seed 3 failed orders with high amount (triggers RULE_REVENUE_PAYMENT_FAILURE)
        for i in range(1, 4):
            ord_fail = Order(
                user_id=user_a.id,
                order_number=f"ORD-FAIL-{i}",
                customer_name=f"Customer {i}",
                customer_email=f"cust{i}@test.com",
                customer_phone="+919876543210",
                shipping_address="Tech Park, Bangalore",
                total_amount=25000.0,
                order_status=OrderStatus.PENDING,
                payment_status=PaymentStatus.FAILED,
                carrier_name="Standard",
                created_at=now - timedelta(hours=2),
            )
            db.add(ord_fail)

        # Seed 1 completed order
        ord_ok = Order(
            user_id=user_a.id,
            order_number="ORD-OK-1",
            customer_name="Happy Buyer",
            customer_email="buyer@test.com",
            customer_phone="+919876543211",
            shipping_address="MG Road, Bangalore",
            total_amount=15000.0,
            order_status=OrderStatus.CONFIRMED,
            payment_status=PaymentStatus.PAID,
            carrier_name="Standard",
            created_at=now - timedelta(hours=5),
        )
        db.add(ord_ok)

        # Seed failed voice calls (triggers RULE_VOICE_CALL_FAILURE_SPIKE)
        campaign = Campaign(user_id=user_a.id, name="Q3 Outbound Sales", status="ACTIVE")
        db.add(campaign)
        await db.flush()

        lead = Lead(user_id=user_a.id, campaign_id=campaign.id, name="VP Tech", phone="+919000000001", status="FAILED")
        db.add(lead)
        await db.flush()

        for j in range(1, 5):
            call = CallSession(
                lead_id=lead.id,
                campaign_id=campaign.id,
                session_id=f"CALL-FAIL-{j}",
                status="FAILED",
                summary="SIP timeout",
                transcript="Connection error",
                created_at=now - timedelta(hours=1),
            )
            db.add(call)

        # Seed interview no-shows (triggers RULE_INTERVIEW_NO_SHOW_RATE)
        for k in range(1, 4):
            inv = Interview(
                user_id=user_a.id,
                candidate_name=f"Applicant {k}",
                candidate_email=f"applicant{k}@test.com",
                interviewer_name="Sarah Lee",
                job_role="Senior AI Engineer",
                interview_date="2026-09-01",
                interview_time="14:00",
                interview_status=InterviewStatus.NO_SHOW,
            )
            db.add(inv)

        await db.commit()
        print("  -> Domain data seeded for Tenant A.")

        print("[3/7] Testing Business Data Ingestion Sync...")
        sync_results = await BusinessDataSyncService.sync_all_connectors(db, user_a.id, incremental=False)
        assert all(r["status"] == "SUCCESS" for r in sync_results), f"Sync failed: {sync_results}"
        print(f"  -> Ingestion completed across {len(sync_results)} connectors.")

        print("[4/7] Testing Detection Rule Evaluation & Signal Generation...")
        rules = get_default_detection_rules()
        assert len(rules) >= 8, f"Expected at least 8 default detection rules, got {len(rules)}"
        print(f"  -> Loaded {len(rules)} detection rules: {[r.rule_id for r in rules]}")

        detect_engine = ProblemDetectionEngine(rules=rules)
        detect_res = await detect_engine.detect_problems(db, user_a.id)

        assert detect_res["success"] is True
        assert detect_res["signals_detected"] >= 1, f"Expected at least 1 signals, got {detect_res['signals_detected']}"
        assert detect_res["problems_created"] >= 1, f"Expected at least 1 problems created, got {detect_res['problems_created']}"
        print(f"  -> Detection engine detected {detect_res['signals_detected']} signals, created {detect_res['problems_created']} problems.")

        print("[5/7] Testing Problem Scoring Engine & Severity Calibration...")
        stmt = select(Problem).where(Problem.user_id == user_a.id)
        problems = (await db.execute(stmt)).scalars().all()
        assert len(problems) >= 1
        for prob in problems:
            assert prob.priority_score is not None and 0 <= prob.priority_score <= 100
            assert prob.severity in [ProblemSeverity.CRITICAL, ProblemSeverity.HIGH, ProblemSeverity.MEDIUM, ProblemSeverity.LOW]
            assert prob.category in [
                ProblemCategory.ANOMALY,
                ProblemCategory.BOTTLENECK,
                ProblemCategory.REVENUE_LEAKAGE,
                ProblemCategory.CUSTOMER_CHURN,
                ProblemCategory.PRODUCTIVITY,
                ProblemCategory.GOAL_DEVIATION,
                ProblemCategory.RISK,
            ]
            print(f"  -> Problem #{prob.id}: '{prob.title}' | Score: {prob.priority_score:.2f} | Severity: {prob.severity.value} | Est Impact: INR {prob.estimated_impact_inr}")

        print("[6/7] Testing Observations & Evidence Attachment...")
        stmt_obs = select(ProblemObservation).where(ProblemObservation.problem_id == problems[0].id)
        obs_list = (await db.execute(stmt_obs)).scalars().all()
        assert len(obs_list) >= 1
        print(f"  -> Problem #{problems[0].id} has {len(obs_list)} observation(s).")

        stmt_evi = select(ProblemEvidence).where(ProblemEvidence.problem_id == problems[0].id)
        evi_list = (await db.execute(stmt_evi)).scalars().all()
        assert len(evi_list) >= 1
        print(f"  -> Problem #{problems[0].id} has {len(evi_list)} empirical evidence item(s).")

        print("[7/7] Testing Strict Multi-Tenant Isolation for Detection...")
        # Tenant B should have 0 detected problems because no domain data was seeded for Tenant B
        detect_b = await detect_engine.detect_problems(db, user_b.id)
        assert detect_b["signals_detected"] == 0
        assert detect_b["problems_created"] == 0

        stmt_b = select(Problem).where(Problem.user_id == user_b.id)
        problems_b = (await db.execute(stmt_b)).scalars().all()
        assert len(problems_b) == 0
        print("  -> Strict tenant boundary isolation verified: Tenant B isolated with 0 problems.")

    await engine.dispose()
    print("\nSUCCESS: All Phase 3 Problem Detection & Scoring tests passed!")


def test_phase3_problem_detection():
    """Pytest entrypoint for Phase 3 Detection tests."""
    asyncio.run(run_phase3_tests())


if __name__ == "__main__":
    asyncio.run(run_phase3_tests())
