"""
Business Data Sync Service
Orchestrates data synchronization across registered connectors for a tenant,
updating sync telemetry states and persisting normalized context.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models.problem_engine import ConnectorSyncState, BusinessEntity
from services.problem_engine.connectors.registry import connector_registry
from services.problem_engine.normalization import BusinessDataNormalizer

logger = logging.getLogger(__name__)


class BusinessDataSyncService:
    """Service orchestrating multi-connector ingestion and sync state tracking."""

    @staticmethod
    async def get_or_create_sync_state(
        db: AsyncSession, user_id: int, connector_key: str
    ) -> ConnectorSyncState:
        stmt = select(ConnectorSyncState).where(
            and_(
                ConnectorSyncState.user_id == user_id,
                ConnectorSyncState.connector_key == connector_key,
            )
        )
        result = await db.execute(stmt)
        state = result.scalar_one_or_none()
        if not state:
            state = ConnectorSyncState(
                user_id=user_id,
                connector_key=connector_key,
                sync_status="IDLE",
                records_processed=0,
                entities_created=0,
                events_created=0,
            )
            db.add(state)
            await db.flush()
        return state

    @classmethod
    async def sync_connector(
        cls,
        db: AsyncSession,
        user_id: int,
        connector_key: str,
        incremental: bool = True,
    ) -> Dict[str, Any]:
        """
        Synchronizes a single connector for a tenant.
        """
        connector = connector_registry.get(connector_key)
        if not connector:
            return {"status": "FAILED", "error": f"Connector '{connector_key}' not found"}

        state = await cls.get_or_create_sync_state(db, user_id, connector_key)
        state.sync_status = "SYNCING"
        await db.commit()

        since = state.last_sync_at if incremental else None
        entities_created_count = 0
        events_created_count = 0
        records_processed = 0

        try:
            # 1. Ingest Entities
            raw_entities = await connector.fetch_entities(db, user_id, since=since)
            records_processed += len(raw_entities)

            for ent_data in raw_entities:
                _, created = await BusinessDataNormalizer.upsert_entity(
                    db=db,
                    user_id=user_id,
                    entity_type=ent_data["entity_type"],
                    entity_key=ent_data["entity_key"],
                    source_system=connector_key,
                    source_record_id=ent_data["source_record_id"],
                    display_name=ent_data.get("display_name"),
                    status=ent_data.get("status"),
                    properties=ent_data.get("properties", {}),
                    created_at=ent_data.get("created_at"),
                    updated_at=ent_data.get("updated_at"),
                )
                if created:
                    entities_created_count += 1

            # 2. Ingest Events
            raw_events = await connector.fetch_events(db, user_id, since=since)
            records_processed += len(raw_events)

            for ev_data in raw_events:
                _, created = await BusinessDataNormalizer.record_event(
                    db=db,
                    user_id=user_id,
                    event_name=ev_data["event_name"],
                    source=ev_data.get("source", connector_key),
                    entity_id=ev_data.get("entity_id"),
                    payload=ev_data.get("payload", {}),
                    occurred_at=ev_data.get("occurred_at"),
                )
                if created:
                    events_created_count += 1

            # 3. Ingest Relationships
            await db.flush()
            raw_rels = await connector.fetch_relationships(db, user_id)
            if raw_rels:
                # Preload tenant entities map {entity_key: entity_id}
                ent_stmt = select(BusinessEntity.id, BusinessEntity.entity_key).where(
                    BusinessEntity.user_id == user_id
                )
                ent_res = await db.execute(ent_stmt)
                key_to_id = {row.entity_key: row.id for row in ent_res.all()}

                for rel_data in raw_rels:
                    from_id = key_to_id.get(rel_data.get("from_entity_key"))
                    to_id = key_to_id.get(rel_data.get("to_entity_key"))
                    if from_id and to_id:
                        await BusinessDataNormalizer.record_relationship(
                            db=db,
                            user_id=user_id,
                            from_entity_id=from_id,
                            to_entity_id=to_id,
                            relationship_type=rel_data.get("relationship_type", "related_to"),
                            metadata_json=rel_data.get("metadata"),
                        )

            state.sync_status = "SUCCESS"
            state.last_sync_at = datetime.utcnow()
            state.records_processed += records_processed
            state.entities_created += entities_created_count
            state.events_created += events_created_count
            state.error_message = None
            await db.commit()

            return {
                "connector": connector_key,
                "status": "SUCCESS",
                "records_processed": records_processed,
                "entities_created": entities_created_count,
                "events_created": events_created_count,
            }

        except Exception as e:
            logger.error(f"❌ Error syncing connector '{connector_key}' for user {user_id}: {e}", exc_info=True)
            state.sync_status = "FAILED"
            state.error_message = str(e)
            await db.commit()
            return {"connector": connector_key, "status": "FAILED", "error": str(e)}

    @classmethod
    async def sync_all_connectors(
        cls, db: AsyncSession, user_id: int, incremental: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Runs sync sequentially across all registered connectors for a tenant.
        """
        results = []
        all_connectors = connector_registry.get_all()
        for key in all_connectors.keys():
            res = await cls.sync_connector(db, user_id, key, incremental=incremental)
            results.append(res)
        return results
