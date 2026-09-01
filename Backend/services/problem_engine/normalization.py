"""
Business Data Normalizer Service
Handles idempotent persistence and deduplication of normalized entities,
events, and graph relationships.
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models.problem_engine import (
    BusinessEntity,
    BusinessEvent,
    BusinessEntityRelationship,
)
from services.problem_engine.connectors.base import sanitize_sensitive_data

logger = logging.getLogger(__name__)


class BusinessDataNormalizer:
    """Service to normalize and persist business entities and events idempotently."""

    @staticmethod
    async def upsert_entity(
        db: AsyncSession,
        user_id: int,
        entity_type: str,
        entity_key: str,
        source_system: str,
        source_record_id: str,
        display_name: Optional[str],
        status: Optional[str],
        properties: Dict[str, Any],
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ) -> Tuple[BusinessEntity, bool]:
        """
        Idempotently creates or updates a normalized business entity.
        Returns tuple: (entity_instance, was_created_bool)
        """
        sanitized_props = sanitize_sensitive_data(properties or {})

        stmt = select(BusinessEntity).where(
            and_(
                BusinessEntity.user_id == user_id,
                BusinessEntity.entity_type == entity_type,
                BusinessEntity.source_system == source_system,
                BusinessEntity.source_record_id == source_record_id,
            )
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.entity_type = entity_type
            existing.entity_key = entity_key
            existing.display_name = display_name or existing.display_name
            existing.status = status or existing.status
            existing.properties = sanitized_props
            if updated_at:
                existing.updated_at = updated_at
            return existing, False
        else:
            entity = BusinessEntity(
                user_id=user_id,
                entity_type=entity_type,
                entity_key=entity_key,
                source_system=source_system,
                source_record_id=source_record_id,
                display_name=display_name,
                status=status,
                properties=sanitized_props,
                created_at=created_at or datetime.utcnow(),
                updated_at=updated_at or datetime.utcnow(),
            )
            db.add(entity)
            await db.flush()
            return entity, True

    @staticmethod
    async def record_event(
        db: AsyncSession,
        user_id: int,
        event_name: str,
        source: str,
        entity_id: Optional[str],
        payload: Dict[str, Any],
        occurred_at: Optional[datetime] = None,
    ) -> Tuple[BusinessEvent, bool]:
        """
        Records a business event idempotently to prevent duplicate triggers.
        Returns tuple: (event_instance, was_created_bool)
        """
        sanitized_payload = sanitize_sensitive_data(payload or {})
        event_time = occurred_at or datetime.utcnow()

        # Check for existing duplicate event for same tenant, source, entity, and event type
        stmt = select(BusinessEvent).where(
            and_(
                BusinessEvent.user_id == user_id,
                BusinessEvent.event_name == event_name,
                BusinessEvent.source == source,
                BusinessEvent.entity_id == entity_id,
            )
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            return existing, False

        event = BusinessEvent(
            user_id=user_id,
            event_name=event_name,
            source=source,
            entity_id=entity_id,
            payload=sanitized_payload,
            occurred_at=event_time,
        )
        db.add(event)
        await db.flush()
        return event, True

    @staticmethod
    async def record_relationship(
        db: AsyncSession,
        user_id: int,
        from_entity_id: int,
        to_entity_id: int,
        relationship_type: str,
        metadata_json: Optional[Dict[str, Any]] = None,
    ) -> Tuple[BusinessEntityRelationship, bool]:
        """
        Records a graph relationship between two entities idempotently.
        """
        stmt = select(BusinessEntityRelationship).where(
            and_(
                BusinessEntityRelationship.user_id == user_id,
                BusinessEntityRelationship.from_entity_id == from_entity_id,
                BusinessEntityRelationship.to_entity_id == to_entity_id,
                BusinessEntityRelationship.relationship_type == relationship_type,
            )
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            if metadata_json:
                existing.metadata_json = sanitize_sensitive_data(metadata_json)
            return existing, False

        rel = BusinessEntityRelationship(
            user_id=user_id,
            from_entity_id=from_entity_id,
            to_entity_id=to_entity_id,
            relationship_type=relationship_type,
            metadata_json=sanitize_sensitive_data(metadata_json or {}),
            created_at=datetime.utcnow(),
        )
        db.add(rel)
        await db.flush()
        return rel, True
