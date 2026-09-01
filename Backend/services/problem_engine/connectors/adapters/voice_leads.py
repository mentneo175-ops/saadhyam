"""
Voice Agent & Lead CRM Connector Adapter for Problem Discovery Engine
Ingests Lead, CallSession/VoiceCall, and Campaign records from models/voice_agent.py
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.problem_engine.connectors.base import BaseBusinessConnector

logger = logging.getLogger(__name__)


class VoiceLeadConnector(BaseBusinessConnector):
    """Connector for Voice AI Campaigns, Leads, and Call logs."""

    @property
    def connector_key(self) -> str:
        return "voice_leads"

    @property
    def source_type(self) -> str:
        return "voice_crm"

    @property
    def display_name(self) -> str:
        return "Voice AI & Lead CRM"

    @property
    def description(self) -> str:
        return "Synchronizes inbound/outbound sales leads, voice campaigns, and call conversations."

    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        try:
            from models.voice_agent import Lead
            stmt = select(Lead.id).where(Lead.user_id == user_id).limit(1)
            await db.execute(stmt)
            return True
        except Exception as e:
            logger.warning(f"VoiceLeadConnector test_connection failed: {e}")
            return False

    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.voice_agent import Lead, Campaign, CallSession

        entities = []

        # 1. Fetch Leads
        lead_stmt = select(Lead).where(Lead.user_id == user_id)
        if since:
            lead_stmt = lead_stmt.where(Lead.created_at >= since)
        lead_res = await db.execute(lead_stmt)
        leads = lead_res.scalars().all()

        for l in leads:
            entities.append({
                "entity_type": "lead",
                "entity_key": f"lead:{l.id}",
                "source_record_id": str(l.id),
                "display_name": f"Lead: {getattr(l, 'name', None) or l.phone or 'Unknown'}",
                "status": str(l.status or "new").upper(),
                "properties": self.sanitize({
                    "name": getattr(l, "name", None),
                    "phone": l.phone,
                    "city": getattr(l, "city", None),
                    "status": l.status,
                    "campaign_id": l.campaign_id,
                    "interest_level": getattr(l, "interest_level", None),
                    "buying_intent": getattr(l, "buying_intent", 0),
                    "admission_probability": getattr(l, "admission_probability", 0),
                    "conversion_probability": getattr(l, "conversion_probability", 0),
                }),
                "created_at": getattr(l, "created_at", None) or datetime.utcnow(),
                "updated_at": getattr(l, "created_at", None) or datetime.utcnow(),
            })

        # 2. Fetch Campaigns
        camp_stmt = select(Campaign).where(Campaign.user_id == user_id)
        if since:
            camp_stmt = camp_stmt.where(Campaign.created_at >= since)
        camp_res = await db.execute(camp_stmt)
        campaigns = camp_res.scalars().all()

        for c in campaigns:
            entities.append({
                "entity_type": "campaign",
                "entity_key": f"campaign:{c.id}",
                "source_record_id": str(c.id),
                "display_name": f"Campaign: {c.name}",
                "status": str(c.status or "active").upper(),
                "properties": self.sanitize({
                    "name": c.name,
                    "objective": c.objective,
                    "agent_id": c.agent_id,
                    "status": c.status,
                }),
                "created_at": getattr(c, "created_at", None) or datetime.utcnow(),
                "updated_at": getattr(c, "created_at", None) or datetime.utcnow(),
            })

        # 3. Fetch Call Sessions for this tenant's campaigns/leads
        if campaigns or leads:
            camp_ids = [c.id for c in campaigns]
            lead_ids = [l.id for l in leads]
            call_stmt = select(CallSession).where(
                (CallSession.campaign_id.in_(camp_ids)) | (CallSession.lead_id.in_(lead_ids))
            )
            call_res = await db.execute(call_stmt)
            calls = call_res.scalars().all()

            for cl in calls:
                entities.append({
                    "entity_type": "call",
                    "entity_key": f"call:{cl.id}",
                    "source_record_id": str(cl.id),
                    "display_name": f"Call #{cl.id} ({cl.status})",
                    "status": str(cl.status or "connected").upper(),
                    "properties": self.sanitize({
                        "session_id": cl.session_id,
                        "lead_id": cl.lead_id,
                        "campaign_id": cl.campaign_id,
                        "sentiment": getattr(cl, "sentiment", "neutral"),
                        "status": cl.status,
                        "summary": cl.summary,
                    }),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                })

        return entities

    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.voice_agent import Lead, Campaign, CallSession

        events = []

        # Lead Events
        lead_stmt = select(Lead).where(Lead.user_id == user_id)
        if since:
            lead_stmt = lead_stmt.where(Lead.created_at >= since)
        lead_res = await db.execute(lead_stmt)
        leads = lead_res.scalars().all()

        for l in lead_res.scalars().all():
            events.append({
                "event_name": "lead.created",
                "source": "voice_crm",
                "entity_id": str(l.id),
                "payload": self.sanitize({
                    "lead_id": l.id,
                    "phone": l.phone,
                    "status": l.status,
                    "campaign_id": l.campaign_id,
                }),
                "occurred_at": getattr(l, "created_at", None) or datetime.utcnow(),
            })

            status_str = str(l.status).lower()
            if status_str in ("completed", "converted", "interested", "won"):
                events.append({
                    "event_name": "lead.converted",
                    "source": "voice_crm",
                    "entity_id": str(l.id),
                    "payload": self.sanitize({"lead_id": l.id, "status": l.status}),
                    "occurred_at": getattr(l, "created_at", None) or datetime.utcnow(),
                })
            elif status_str in ("failed", "unreachable", "rejected", "lost"):
                events.append({
                    "event_name": "lead.lost",
                    "source": "voice_crm",
                    "entity_id": str(l.id),
                    "payload": self.sanitize({"lead_id": l.id, "status": l.status}),
                    "occurred_at": getattr(l, "created_at", None) or datetime.utcnow(),
                })

        # Call Events
        camp_stmt = select(Campaign.id).where(Campaign.user_id == user_id)
        camp_ids = (await db.execute(camp_stmt)).scalars().all()
        lead_ids = [l.id for l in leads]

        if camp_ids or lead_ids:
            call_stmt = select(CallSession).where(
                (CallSession.campaign_id.in_(camp_ids)) | (CallSession.lead_id.in_(lead_ids))
            )
            call_res = await db.execute(call_stmt)
            for cl in call_res.scalars().all():
                status_lower = str(cl.status or "").lower()
                if status_lower in ("completed", "connected", "answered"):
                    events.append({
                        "event_name": "voice.call_completed",
                        "source": "voice_crm",
                        "entity_id": str(cl.id),
                        "payload": self.sanitize({
                            "call_id": cl.id,
                            "session_id": cl.session_id,
                            "lead_id": cl.lead_id,
                            "sentiment": cl.sentiment,
                        }),
                        "occurred_at": datetime.utcnow(),
                    })
                elif status_lower in ("failed", "no_answer", "busy", "disconnected"):
                    events.append({
                        "event_name": "voice.call_failed",
                        "source": "voice_crm",
                        "entity_id": str(cl.id),
                        "payload": self.sanitize({
                            "call_id": cl.id,
                            "session_id": cl.session_id,
                            "lead_id": cl.lead_id,
                            "status": cl.status,
                        }),
                        "occurred_at": datetime.utcnow(),
                    })

        return events

    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        from models.voice_agent import Lead, Campaign, CallSession

        rels = []
        lead_stmt = select(Lead).where(Lead.user_id == user_id)
        lead_res = await db.execute(lead_stmt)
        leads = lead_res.scalars().all()

        for l in leads:
            if l.campaign_id:
                rels.append({
                    "from_entity_key": f"campaign:{l.campaign_id}",
                    "to_entity_key": f"lead:{l.id}",
                    "relationship_type": "generated",
                    "metadata": {},
                })

        lead_ids = [l.id for l in leads]
        if lead_ids:
            call_stmt = select(CallSession).where(CallSession.lead_id.in_(lead_ids))
            call_res = await db.execute(call_stmt)
            for cl in call_res.scalars().all():
                if cl.lead_id:
                    rels.append({
                        "from_entity_key": f"lead:{cl.lead_id}",
                        "to_entity_key": f"call:{cl.id}",
                        "relationship_type": "called",
                        "metadata": {"session_id": cl.session_id},
                    })

        return rels
