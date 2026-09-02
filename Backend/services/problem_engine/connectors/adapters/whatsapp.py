"""
WhatsApp Marketing & Messaging Connector Adapter for Problem Discovery Engine
Ingests WhatsApp Campaign and Message records from models/whatsapp_*.py
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.problem_engine.connectors.base import BaseBusinessConnector, to_naive_utc

logger = logging.getLogger(__name__)


class WhatsAppConnector(BaseBusinessConnector):
    """Connector for WhatsApp Marketing campaigns and messaging logs."""

    @property
    def connector_key(self) -> str:
        return "whatsapp"

    @property
    def source_type(self) -> str:
        return "messaging"

    @property
    def display_name(self) -> str:
        return "WhatsApp Marketing & Messaging"

    @property
    def description(self) -> str:
        return "Synchronizes WhatsApp outreach campaigns, delivery reports, and customer conversation events."

    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        try:
            from models.whatsapp_account import WhatsAppAccount
            from models.whatsapp_message import WhatsAppMessage  # noqa: F401
            from models.whatsapp_automation import WhatsAppAutomation  # noqa: F401
            from models.whatsapp_campaign import WhatsAppCampaign  # noqa: F401

            stmt = select(WhatsAppAccount.id).where(WhatsAppAccount.user_id == user_id).limit(1)
            await db.execute(stmt)
            return True
        except Exception as e:
            logger.warning(f"WhatsAppConnector test_connection failed: {e}")
            return False

    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.whatsapp_account import WhatsAppAccount  # noqa: F401
        from models.whatsapp_message import WhatsAppMessage  # noqa: F401
        from models.whatsapp_automation import WhatsAppAutomation  # noqa: F401
        from models.whatsapp_campaign import WhatsAppCampaign

        since_dt = to_naive_utc(since)
        stmt = select(WhatsAppCampaign).where(WhatsAppCampaign.user_id == user_id)
        if since_dt:
            stmt = stmt.where(WhatsAppCampaign.created_at >= since_dt)
        result = await db.execute(stmt)
        campaigns = result.scalars().all()

        entities = []
        for c in campaigns:
            entities.append({
                "entity_type": "campaign",
                "entity_key": f"whatsapp_campaign:{c.id}",
                "source_record_id": str(c.id),
                "display_name": f"WhatsApp: {c.name}",
                "status": str(c.status or "DRAFT").upper(),
                "properties": self.sanitize({
                    "name": c.name,
                    "status": c.status,
                    "total_recipients": getattr(c, "total_recipients", 0),
                    "sent_count": getattr(c, "sent_count", 0),
                    "delivered_count": getattr(c, "delivered_count", 0),
                    "read_count": getattr(c, "read_count", 0),
                }),
                "created_at": getattr(c, "created_at", None) or datetime.utcnow(),
                "updated_at": getattr(c, "updated_at", None) or datetime.utcnow(),
            })

        return entities

    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.whatsapp_account import WhatsAppAccount  # noqa: F401
        from models.whatsapp_message import WhatsAppMessage  # noqa: F401
        from models.whatsapp_automation import WhatsAppAutomation  # noqa: F401
        from models.whatsapp_campaign import WhatsAppCampaign

        since_dt = to_naive_utc(since)
        stmt = select(WhatsAppCampaign).where(WhatsAppCampaign.user_id == user_id)
        if since_dt:
            stmt = stmt.where(WhatsAppCampaign.created_at >= since_dt)
        result = await db.execute(stmt)
        campaigns = result.scalars().all()

        events = []
        for c in campaigns:
            status_upper = str(c.status or "").upper()
            if status_upper in ("COMPLETED", "FINISHED"):
                events.append({
                    "event_name": "whatsapp.campaign_completed",
                    "source": "whatsapp",
                    "entity_id": str(c.id),
                    "payload": self.sanitize({
                        "campaign_id": c.id,
                        "name": c.name,
                        "sent": getattr(c, "sent_count", 0),
                        "delivered": getattr(c, "delivered_count", 0),
                    }),
                    "occurred_at": getattr(c, "completed_at", None) or getattr(c, "updated_at", None) or datetime.utcnow(),
                })
            elif status_upper == "FAILED":
                events.append({
                    "event_name": "whatsapp.campaign_failed",
                    "source": "whatsapp",
                    "entity_id": str(c.id),
                    "payload": self.sanitize({
                        "campaign_id": c.id,
                        "name": c.name,
                    }),
                    "occurred_at": getattr(c, "updated_at", None) or datetime.utcnow(),
                })

        return events

    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        return []
