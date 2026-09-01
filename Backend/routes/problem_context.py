"""
Problem Discovery Engine - Business Context API Routes (Phase 2)
Provides read-only inspection endpoints for ingested business entities,
events, connector sync states, and graph topology.
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.user import User
from models.problem_engine import BusinessEntity, BusinessEvent, ConnectorSyncState
from routes.auth import get_current_user
from services.problem_engine.context_snapshot import BusinessContextSnapshotService
from services.problem_engine.business_graph import BusinessContextGraphService
from services.problem_engine.sync_service import BusinessDataSyncService
from services.problem_engine.connectors.registry import connector_registry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/problems/context", tags=["Problem Engine Context"])


@router.get("/summary")
async def get_context_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get aggregated business context summary metrics, entity counts,
    event counts, and connector health for the current tenant.
    """
    try:
        summary = await BusinessContextSnapshotService.get_context_summary(
            db, current_user.id
        )
        return {"success": True, "data": summary}
    except Exception as e:
        logger.error(f"Error fetching context summary for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve business context summary")


@router.get("/sources")
async def get_available_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all available connectors and their synchronization status for the tenant.
    """
    try:
        connectors = connector_registry.list_available()
        sync_stmt = select(ConnectorSyncState).where(
            ConnectorSyncState.user_id == current_user.id
        )
        sync_res = await db.execute(sync_stmt)
        sync_map = {s.connector_key: s for s in sync_res.scalars().all()}

        sources = []
        for c in connectors:
            st = sync_map.get(c["key"])
            sources.append({
                **c,
                "sync_status": st.sync_status if st else "IDLE",
                "last_sync_at": st.last_sync_at.isoformat() if st and st.last_sync_at else None,
                "records_processed": st.records_processed if st else 0,
                "error_message": st.error_message if st else None,
            })

        return {"success": True, "sources": sources}
    except Exception as e:
        logger.error(f"Error fetching sources for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data sources")


@router.get("/entities")
async def get_entities(
    entity_type: Optional[str] = Query(None, description="Filter by entity type e.g. order, lead, interview"),
    source_system: Optional[str] = Query(None, description="Filter by source system e.g. orders, voice_crm"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List normalized business entities for current tenant with optional type/source filtering.
    """
    try:
        stmt = (
            select(BusinessEntity)
            .where(BusinessEntity.user_id == current_user.id)
            .order_by(desc(BusinessEntity.updated_at))
        )
        if entity_type:
            stmt = stmt.where(BusinessEntity.entity_type == entity_type)
        if source_system:
            stmt = stmt.where(BusinessEntity.source_system == source_system)

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        entities = result.scalars().all()

        return {
            "success": True,
            "count": len(entities),
            "offset": offset,
            "limit": limit,
            "entities": [
                {
                    "id": e.id,
                    "entity_type": e.entity_type,
                    "entity_key": e.entity_key,
                    "source_system": e.source_system,
                    "source_record_id": e.source_record_id,
                    "display_name": e.display_name,
                    "status": e.status,
                    "properties": e.properties,
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                    "updated_at": e.updated_at.isoformat() if e.updated_at else None,
                }
                for e in entities
            ],
        }
    except Exception as e:
        logger.error(f"Error fetching entities for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve entities")


@router.get("/events")
async def get_events(
    source: Optional[str] = Query(None, description="Filter by event source"),
    event_name: Optional[str] = Query(None, description="Filter by event name e.g. order.created"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List chronological business events stream for current tenant.
    """
    try:
        stmt = (
            select(BusinessEvent)
            .where(BusinessEvent.user_id == current_user.id)
            .order_by(desc(BusinessEvent.occurred_at))
        )
        if source:
            stmt = stmt.where(BusinessEvent.source == source)
        if event_name:
            stmt = stmt.where(BusinessEvent.event_name == event_name)

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        events = result.scalars().all()

        return {
            "success": True,
            "count": len(events),
            "offset": offset,
            "limit": limit,
            "events": [
                {
                    "id": ev.id,
                    "event_name": ev.event_name,
                    "source": ev.source,
                    "entity_id": ev.entity_id,
                    "payload": ev.payload,
                    "occurred_at": ev.occurred_at.isoformat() if ev.occurred_at else None,
                }
                for ev in events
            ],
        }
    except Exception as e:
        logger.error(f"Error fetching events for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve events")


@router.get("/graph")
async def get_context_graph(
    limit: int = Query(100, ge=10, le=300),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get topological graph representation (nodes & edges) of tenant business entities.
    """
    try:
        graph_data = await BusinessContextGraphService.get_tenant_graph(
            db, current_user.id, limit=limit
        )
        return {"success": True, "graph": graph_data}
    except Exception as e:
        logger.error(f"Error fetching graph for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve business graph")


@router.get("/entities/{entity_id}/neighborhood")
async def get_entity_neighborhood(
    entity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get localized neighborhood subgraph and recent events for a specific business entity.
    """
    try:
        neighborhood = await BusinessContextGraphService.get_entity_neighborhood(
            db, current_user.id, entity_id=entity_id
        )
        if "error" in neighborhood:
            raise HTTPException(status_code=404, detail="Business entity not found")
        return {"success": True, "data": neighborhood}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching neighborhood for entity {entity_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve entity neighborhood")


@router.post("/sync")
async def trigger_context_sync(
    connector_key: Optional[str] = Query(None, description="Specific connector to sync, or all if omitted"),
    incremental: bool = Query(True, description="Incremental sync since last run"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger read-only synchronization from connected business systems for current tenant.
    """
    try:
        if connector_key:
            res = await BusinessDataSyncService.sync_connector(
                db, current_user.id, connector_key, incremental=incremental
            )
            return {"success": True, "results": [res]}
        else:
            results = await BusinessDataSyncService.sync_all_connectors(
                db, current_user.id, incremental=incremental
            )
            return {"success": True, "results": results}
    except Exception as e:
        logger.error(f"Error running context sync for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute context synchronization")
