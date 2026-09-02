"""
LinkedIn Marketing Connector Adapter for Problem Discovery Engine
Ingests LinkedIn Post History and connection status from models/linkedin.py
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.problem_engine.connectors.base import BaseBusinessConnector, to_aware_utc

logger = logging.getLogger(__name__)


class LinkedInConnector(BaseBusinessConnector):
    """Connector for LinkedIn Marketing and Social Engagement subsystem."""

    @property
    def connector_key(self) -> str:
        return "linkedin"

    @property
    def source_type(self) -> str:
        return "social_marketing"

    @property
    def display_name(self) -> str:
        return "LinkedIn Marketing"

    @property
    def description(self) -> str:
        return "Synchronizes published posts, draft content, and LinkedIn engagement activity."

    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        try:
            from models.linkedin import LinkedInConnection
            stmt = select(LinkedInConnection.id).where(LinkedInConnection.user_id == user_id).limit(1)
            await db.execute(stmt)
            return True
        except Exception as e:
            logger.warning(f"LinkedInConnector test_connection failed: {e}")
            return False

    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.linkedin import LinkedInPostHistory

        since_dt = to_aware_utc(since)
        stmt = select(LinkedInPostHistory).where(LinkedInPostHistory.user_id == user_id)
        if since_dt:
            stmt = stmt.where(LinkedInPostHistory.created_at >= since_dt)
        result = await db.execute(stmt)
        posts = result.scalars().all()

        entities = []
        for p in posts:
            status_val = str(p.status.value if hasattr(p.status, "value") else p.status).upper()
            topic_str = getattr(p, "topic", None) or "Post"
            entities.append({
                "entity_type": "social_post",
                "entity_key": f"linkedin_post:{p.id}",
                "source_record_id": str(p.id),
                "display_name": f"LinkedIn Post #{p.id} ({topic_str})",
                "status": status_val,
                "properties": self.sanitize({
                    "topic": topic_str,
                    "content_excerpt": (p.content[:120] + "...") if p.content and len(p.content) > 120 else p.content,
                    "status": status_val,
                    "error_message": getattr(p, "error_message", None),
                }),
                "created_at": p.created_at or datetime.utcnow(),
                "updated_at": p.published_at or p.created_at or datetime.utcnow(),
            })

        return entities

    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.linkedin import LinkedInPostHistory

        since_dt = to_aware_utc(since)
        stmt = select(LinkedInPostHistory).where(LinkedInPostHistory.user_id == user_id)
        if since_dt:
            stmt = stmt.where(LinkedInPostHistory.created_at >= since_dt)
        result = await db.execute(stmt)
        posts = result.scalars().all()

        events = []
        for p in posts:
            status_val = str(p.status.value if hasattr(p.status, "value") else p.status).upper()
            if status_val == "PUBLISHED":
                events.append({
                    "event_name": "linkedin.post_published",
                    "source": "linkedin",
                    "entity_id": str(p.id),
                    "payload": self.sanitize({
                        "post_id": p.id,
                        "topic": getattr(p, "topic", None),
                    }),
                    "occurred_at": p.published_at or p.created_at or datetime.utcnow(),
                })
            elif status_val == "FAILED":
                events.append({
                    "event_name": "linkedin.post_failed",
                    "source": "linkedin",
                    "entity_id": str(p.id),
                    "payload": self.sanitize({
                        "post_id": p.id,
                        "error": getattr(p, "error_message", None),
                    }),
                    "occurred_at": p.created_at or datetime.utcnow(),
                })

        return events

    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        return []
