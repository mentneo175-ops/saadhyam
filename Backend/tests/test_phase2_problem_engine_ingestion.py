"""
Unit & Integration Tests for Phase 2: Core Ingestion, Connectors & Business Context Graph
Tests:
- Connector registry & dynamic discovery
- Entity normalization & idempotency
- Event normalization & deduplication
- Graph relationship modeling & traversal
- Multi-tenant isolation verification
- Sensitive data sanitization
- Context snapshot metrics
- Sync state tracking
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta

# Add Backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func

import models  # noqa: F401 - ensure all Base tables are registered
from config.database import Base
from models.user import User
from models.order import Order, OrderItem, OrderStatus, PaymentStatus
from models.voice_agent import Lead, Campaign, CallSession
from models.interview_scheduler import Interview, InterviewStatus
from models.task_tracking import DailyTask, GrowthMetric
from models.problem_engine import (
    BusinessEntity,
    BusinessEvent,
    BusinessEntityRelationship,
    ConnectorSyncState,
)
from services.problem_engine.connectors.base import sanitize_sensitive_data
from services.problem_engine.connectors.registry import connector_registry
from services.problem_engine.normalization import BusinessDataNormalizer
from services.problem_engine.sync_service import BusinessDataSyncService
from services.problem_engine.business_graph import BusinessContextGraphService
from services.problem_engine.context_snapshot import BusinessContextSnapshotService


async def run_phase2_tests():
    # In-memory async SQLite engine
    test_db_url = "sqlite+aiosqlite:///:memory:"
    engine = create_async_engine(test_db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("[1/8] Testing Sensitive Data Sanitization...")
        raw_payload = {
            "order_id": 101,
            "api_key": "sk_live_secret_12345",
            "access_token": "bearer_token_xyz",
            "customer": {
                "name": "Jane Doe",
                "password": "super_secret_password",
                "client_secret": "oauth_client_secret_999",
            },
            "items": [{"item_id": "ITM-1", "token_cost": "redact_me"}],
        }
        sanitized = sanitize_sensitive_data(raw_payload)
        assert sanitized["api_key"] == "[REDACTED]"
        assert sanitized["access_token"] == "[REDACTED]"
        assert sanitized["customer"]["password"] == "[REDACTED]"
        assert sanitized["customer"]["client_secret"] == "[REDACTED]"
        assert sanitized["customer"]["name"] == "Jane Doe"
        assert sanitized["order_id"] == 101
        print("  -> Sensitive fields sanitized successfully.")

        print("[2/8] Testing Connector Registry...")
        connectors = connector_registry.list_available()
        assert len(connectors) >= 6, "Expected at least 6 core connectors registered"
        connector_keys = {c["key"] for c in connectors}
        assert {"orders", "voice_leads", "interview_scheduler", "tasks_growth", "linkedin", "whatsapp"}.issubset(connector_keys)
        print(f"  -> Registry loaded {len(connectors)} connectors: {connector_keys}")

        print("[3/8] Creating Test Tenants (User A & User B)...")
        user_a = User(email="tenant_a@saadhyam.ai", name="Tenant A", business_name="Alpha Corp", auth_provider="email")
        user_b = User(email="tenant_b@saadhyam.ai", name="Tenant B", business_name="Beta Ltd", auth_provider="email")
        db.add_all([user_a, user_b])
        await db.commit()
        await db.refresh(user_a)
        await db.refresh(user_b)
        assert user_a.id != user_b.id

        print("[4/8] Seeding Domain Data for Tenant A...")
        # Order data
        order = Order(
            user_id=user_a.id,
            order_number="ORD-1001",
            customer_name="Alice Smith",
            customer_email="alice@example.com",
            shipping_address="123 Tech Park, Bangalore",
            total_amount=45000.0,
            order_status=OrderStatus.COMPLETED,
            payment_status=PaymentStatus.PAID,
        )
        # Lead & Call data
        camp = Campaign(user_id=user_a.id, name="Q3 Outbound Sales", status="active")
        db.add_all([order, camp])
        await db.commit()
        await db.refresh(camp)

        lead = Lead(user_id=user_a.id, name="John Doe", phone="+919876543210", campaign_id=camp.id, status="interested")
        db.add(lead)
        await db.commit()
        await db.refresh(lead)

        call = CallSession(session_id="call_sess_101", lead_id=lead.id, campaign_id=camp.id, status="completed", sentiment="positive")
        interview = Interview(
            user_id=user_a.id,
            candidate_name="Bob Kumar",
            candidate_email="bob@tech.com",
            interviewer_name="Sarah Lee",
            job_role="Senior AI Engineer",
            interview_date="2026-09-05",
            interview_time="14:00",
            interview_status=InterviewStatus.SCHEDULED,
        )
        task = DailyTask(
            user_id=user_a.id,
            title="Follow up high priority leads",
            category="sales",
            priority="high",
            is_completed=True,
            assigned_date=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        metric = GrowthMetric(
            user_id=user_a.id,
            metric_date=datetime.utcnow(),
            tasks_assigned=10,
            tasks_completed=4,
            completion_rate=40.0,
            growth_score=62.5,
        )

        db.add_all([call, interview, task, metric])
        await db.commit()
        print("  -> Domain test fixtures seeded.")

        print("[5/8] Testing Multi-Connector Ingestion & Idempotency...")
        # First sync
        sync_results_1 = await BusinessDataSyncService.sync_all_connectors(db, user_a.id, incremental=False)
        assert all(r["status"] == "SUCCESS" for r in sync_results_1), f"Sync failed: {sync_results_1}"

        # Verify entity count for User A
        ent_count_stmt = select(func.count(BusinessEntity.id)).where(BusinessEntity.user_id == user_a.id)
        ent_count_1 = (await db.execute(ent_count_stmt)).scalar()
        assert ent_count_1 >= 5, f"Expected >= 5 entities, found {ent_count_1}"

        # Verify event count for User A
        ev_count_stmt = select(func.count(BusinessEvent.id)).where(BusinessEvent.user_id == user_a.id)
        ev_count_1 = (await db.execute(ev_count_stmt)).scalar()
        assert ev_count_1 >= 4, f"Expected >= 4 events, found {ev_count_1}"

        # Second sync (Idempotency check: should NOT create duplicate entities)
        sync_results_2 = await BusinessDataSyncService.sync_all_connectors(db, user_a.id, incremental=False)
        ent_count_2 = (await db.execute(ent_count_stmt)).scalar()
        assert ent_count_1 == ent_count_2, f"Idempotency failed: entity count grew from {ent_count_1} to {ent_count_2}"
        print(f"  -> Idempotent sync verified: {ent_count_1} entities, {ev_count_1} events.")

        print("[6/8] Testing Strict Tenant Isolation...")
        # User B should have ZERO entities and ZERO events
        ent_count_b = (await db.execute(select(func.count(BusinessEntity.id)).where(BusinessEntity.user_id == user_b.id))).scalar()
        ev_count_b = (await db.execute(select(func.count(BusinessEvent.id)).where(BusinessEvent.user_id == user_b.id))).scalar()
        assert ent_count_b == 0, f"Tenant isolation breach: User B has {ent_count_b} entities"
        assert ev_count_b == 0, f"Tenant isolation breach: User B has {ev_count_b} events"

        # Context graph for User B must be empty
        graph_b = await BusinessContextGraphService.get_tenant_graph(db, user_b.id)
        assert graph_b["total_nodes"] == 0
        assert graph_b["total_edges"] == 0
        print("  -> Tenant isolation verified: User B context is 100% isolated from User A.")

        print("[7/8] Testing Business Context Graph Traversal...")
        graph_a = await BusinessContextGraphService.get_tenant_graph(db, user_a.id)
        assert graph_a["total_nodes"] >= 5
        assert graph_a["total_edges"] >= 2, f"Expected >= 2 relationships, found {graph_a['total_edges']}"

        # Find lead entity and test neighborhood
        lead_ent_stmt = select(BusinessEntity).where(
            BusinessEntity.user_id == user_a.id,
            BusinessEntity.entity_type == "lead",
        ).limit(1)
        lead_ent = (await db.execute(lead_ent_stmt)).scalar_one()
        neighborhood = await BusinessContextGraphService.get_entity_neighborhood(db, user_a.id, lead_ent.id)
        assert neighborhood["entity"]["id"] == lead_ent.id
        assert len(neighborhood["incoming_relationships"]) >= 1 or len(neighborhood["outgoing_relationships"]) >= 1
        assert len(neighborhood["recent_events"]) >= 1
        print("  -> Context graph nodes, edges, and neighborhood queried successfully.")

        print("[8/8] Testing Context Snapshot Telemetry...")
        snapshot = await BusinessContextSnapshotService.get_context_summary(db, user_a.id)
        assert snapshot["total_entities"] == ent_count_1
        assert snapshot["total_events"] == ev_count_1
        assert "orders" in snapshot["sync_states"]
        assert snapshot["sync_states"]["orders"]["status"] == "SUCCESS"
        assert snapshot["sync_states"]["voice_leads"]["status"] == "SUCCESS"
        print("  -> Context snapshot telemetry matches database state.")

    await engine.dispose()
    print("\nSUCCESS: All Phase 2 Ingestion, Connectors & Business Graph tests passed!")


if __name__ == "__main__":
    asyncio.run(run_phase2_tests())
