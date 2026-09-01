"""
Business Context Snapshot Service
Provides aggregated summary telemetry of ingested business entities,
events, active data sources, and connector sync states.
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models.problem_engine import (
    BusinessEntity,
    BusinessEvent,
    BusinessEntityRelationship,
    ConnectorSyncState,
)
from services.problem_engine.connectors.registry import connector_registry

logger = logging.getLogger(__name__)


class BusinessContextSnapshotService:
    """Service generating high-level business context telemetry for a tenant."""

    @staticmethod
    async def get_context_summary(
        db: AsyncSession, user_id: int
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive snapshot of currently available business context.
        """
        # 1. Count entities by type
        ent_stmt = (
            select(BusinessEntity.entity_type, func.count(BusinessEntity.id))
            .where(BusinessEntity.user_id == user_id)
            .group_by(BusinessEntity.entity_type)
        )
        ent_res = await db.execute(ent_stmt)
        entities_by_type = {row[0]: row[1] for row in ent_res.all()}
        total_entities = sum(entities_by_type.values())

        # 2. Count events by source
        ev_stmt = (
            select(BusinessEvent.source, func.count(BusinessEvent.id))
            .where(BusinessEvent.user_id == user_id)
            .group_by(BusinessEvent.source)
        )
        ev_res = await db.execute(ev_stmt)
        events_by_source = {row[0]: row[1] for row in ev_res.all()}
        total_events = sum(events_by_source.values())

        # 3. Events in last 24 hours and 7 days
        now = datetime.utcnow()
        t24h = now - timedelta(hours=24)
        t7d = now - timedelta(days=7)

        ev_24h_stmt = select(func.count(BusinessEvent.id)).where(
            and_(BusinessEvent.user_id == user_id, BusinessEvent.occurred_at >= t24h)
        )
        ev_24h = (await db.execute(ev_24h_stmt)).scalar() or 0

        ev_7d_stmt = select(func.count(BusinessEvent.id)).where(
            and_(BusinessEvent.user_id == user_id, BusinessEvent.occurred_at >= t7d)
        )
        ev_7d = (await db.execute(ev_7d_stmt)).scalar() or 0

        # 4. Total relationships
        rel_count_stmt = select(func.count(BusinessEntityRelationship.id)).where(
            BusinessEntityRelationship.user_id == user_id
        )
        total_relationships = (await db.execute(rel_count_stmt)).scalar() or 0

        # 5. Connector sync statuses
        sync_stmt = select(ConnectorSyncState).where(ConnectorSyncState.user_id == user_id)
        sync_res = await db.execute(sync_stmt)
        sync_states = sync_res.scalars().all()

        sync_status_map = {
            s.connector_key: {
                "status": s.sync_status,
                "last_sync_at": s.last_sync_at.isoformat() if s.last_sync_at else None,
                "records_processed": s.records_processed,
                "entities_created": s.entities_created,
                "events_created": s.events_created,
                "error_message": s.error_message,
            }
            for s in sync_states
        }

        # Available connectors list
        available_connectors = connector_registry.list_available()

        return {
            "user_id": user_id,
            "total_entities": total_entities,
            "entities_by_type": entities_by_type,
            "total_events": total_events,
            "events_by_source": events_by_source,
            "events_last_24h": ev_24h,
            "events_last_7d": ev_7d,
            "total_graph_relationships": total_relationships,
            "connectors": available_connectors,
            "sync_states": sync_status_map,
            "generated_at": now.isoformat(),
        }
