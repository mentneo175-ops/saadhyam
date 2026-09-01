"""
Business Context Graph Service
Provides topological relationship queries and context graph traversal
across normalized business entities.
"""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.problem_engine import (
    BusinessEntity,
    BusinessEntityRelationship,
    BusinessEvent,
)

logger = logging.getLogger(__name__)


class BusinessContextGraphService:
    """Service to query, traverse, and explore the Business Context Graph."""

    @staticmethod
    async def get_tenant_graph(
        db: AsyncSession, user_id: int, limit: int = 150
    ) -> Dict[str, Any]:
        """
        Returns full node/edge graph representation for the tenant.
        Nodes represent business entities; edges represent directional relationships.
        """
        # Fetch entities (nodes)
        ent_stmt = (
            select(BusinessEntity)
            .where(BusinessEntity.user_id == user_id)
            .order_by(BusinessEntity.updated_at.desc())
            .limit(limit)
        )
        ent_res = await db.execute(ent_stmt)
        entities = ent_res.scalars().all()

        entity_ids = {e.id for e in entities}

        nodes = [
            {
                "id": e.id,
                "key": e.entity_key,
                "type": e.entity_type,
                "label": e.display_name or e.entity_key,
                "status": e.status,
                "source": e.source_system,
                "properties": e.properties,
            }
            for e in entities
        ]

        if not entity_ids:
            return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0}

        # Fetch relationships (edges) between these entities
        rel_stmt = (
            select(BusinessEntityRelationship)
            .where(
                and_(
                    BusinessEntityRelationship.user_id == user_id,
                    or_(
                        BusinessEntityRelationship.from_entity_id.in_(entity_ids),
                        BusinessEntityRelationship.to_entity_id.in_(entity_ids),
                    ),
                )
            )
            .limit(limit * 2)
        )
        rel_res = await db.execute(rel_stmt)
        relationships = rel_res.scalars().all()

        edges = [
            {
                "id": r.id,
                "from": r.from_entity_id,
                "to": r.to_entity_id,
                "type": r.relationship_type,
                "metadata": r.metadata_json,
            }
            for r in relationships
        ]

        return {
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }

    @staticmethod
    async def get_entity_neighborhood(
        db: AsyncSession, user_id: int, entity_id: int
    ) -> Dict[str, Any]:
        """
        Returns an entity's direct neighbors (incoming + outgoing relationships) and recent events.
        """
        ent_stmt = select(BusinessEntity).where(
            and_(BusinessEntity.user_id == user_id, BusinessEntity.id == entity_id)
        )
        ent_res = await db.execute(ent_stmt)
        entity = ent_res.scalar_one_or_none()

        if not entity:
            return {"error": "Entity not found"}

        # Outgoing relationships
        out_stmt = (
            select(BusinessEntityRelationship, BusinessEntity)
            .join(BusinessEntity, BusinessEntityRelationship.to_entity_id == BusinessEntity.id)
            .where(
                and_(
                    BusinessEntityRelationship.user_id == user_id,
                    BusinessEntityRelationship.from_entity_id == entity_id,
                )
            )
        )
        out_res = await db.execute(out_stmt)
        outgoing = [
            {
                "relationship_type": rel.relationship_type,
                "metadata": rel.metadata_json,
                "target_entity": {
                    "id": target.id,
                    "key": target.entity_key,
                    "type": target.entity_type,
                    "label": target.display_name,
                    "status": target.status,
                },
            }
            for rel, target in out_res.all()
        ]

        # Incoming relationships
        in_stmt = (
            select(BusinessEntityRelationship, BusinessEntity)
            .join(BusinessEntity, BusinessEntityRelationship.from_entity_id == BusinessEntity.id)
            .where(
                and_(
                    BusinessEntityRelationship.user_id == user_id,
                    BusinessEntityRelationship.to_entity_id == entity_id,
                )
            )
        )
        in_res = await db.execute(in_stmt)
        incoming = [
            {
                "relationship_type": rel.relationship_type,
                "metadata": rel.metadata_json,
                "source_entity": {
                    "id": src.id,
                    "key": src.entity_key,
                    "type": src.entity_type,
                    "label": src.display_name,
                    "status": src.status,
                },
            }
            for rel, src in in_res.all()
        ]

        # Recent events for this entity
        ev_stmt = (
            select(BusinessEvent)
            .where(
                and_(
                    BusinessEvent.user_id == user_id,
                    BusinessEvent.entity_id == entity.source_record_id,
                )
            )
            .order_by(BusinessEvent.occurred_at.desc())
            .limit(20)
        )
        ev_res = await db.execute(ev_stmt)
        events = [
            {
                "id": ev.id,
                "event_name": ev.event_name,
                "source": ev.source,
                "payload": ev.payload,
                "occurred_at": ev.occurred_at.isoformat() if ev.occurred_at else None,
            }
            for ev in ev_res.scalars().all()
        ]

        return {
            "entity": {
                "id": entity.id,
                "key": entity.entity_key,
                "type": entity.entity_type,
                "label": entity.display_name,
                "status": entity.status,
                "source": entity.source_system,
                "properties": entity.properties,
            },
            "outgoing_relationships": outgoing,
            "incoming_relationships": incoming,
            "recent_events": events,
        }
