"""
HR Interview Scheduler Connector Adapter for Problem Discovery Engine
Ingests Interview and InterviewSlot records from models/interview_scheduler.py
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.problem_engine.connectors.base import BaseBusinessConnector

logger = logging.getLogger(__name__)


class InterviewConnector(BaseBusinessConnector):
    """Connector for HR Interview Scheduler subsystem."""

    @property
    def connector_key(self) -> str:
        return "interview_scheduler"

    @property
    def source_type(self) -> str:
        return "hr_operations"

    @property
    def display_name(self) -> str:
        return "HR & Interview Operations"

    @property
    def description(self) -> str:
        return "Synchronizes candidate interviews, scheduling calendar invites, and recruitment pipeline events."

    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        try:
            from models.interview_scheduler import Interview
            stmt = select(Interview.id).where(Interview.user_id == user_id).limit(1)
            await db.execute(stmt)
            return True
        except Exception as e:
            logger.warning(f"InterviewConnector test_connection failed: {e}")
            return False

    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.interview_scheduler import Interview

        stmt = select(Interview).where(Interview.user_id == user_id)
        if since:
            stmt = stmt.where(Interview.updated_at >= since)
        result = await db.execute(stmt)
        interviews = result.scalars().all()

        entities = []
        for it in interviews:
            raw_status = getattr(it, "interview_status", getattr(it, "status", "SCHEDULED"))
            status_val = str(raw_status.value if hasattr(raw_status, "value") else raw_status).upper()
            entities.append({
                "entity_type": "interview",
                "entity_key": f"interview:{it.id}",
                "source_record_id": str(it.id),
                "display_name": f"Interview: {it.candidate_name} ({it.job_role})",
                "status": status_val,
                "properties": self.sanitize({
                    "candidate_name": it.candidate_name,
                    "candidate_email": it.candidate_email,
                    "job_role": it.job_role,
                    "interviewer_name": it.interviewer_name,
                    "interview_date": getattr(it, "interview_date", None),
                    "interview_time": getattr(it, "interview_time", None),
                    "meeting_link": getattr(it, "meeting_link", None),
                    "status": status_val,
                }),
                "created_at": it.created_at or datetime.utcnow(),
                "updated_at": it.updated_at or datetime.utcnow(),
            })

        return entities

    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.interview_scheduler import Interview

        stmt = select(Interview).where(Interview.user_id == user_id)
        if since:
            stmt = stmt.where(Interview.created_at >= since)
        result = await db.execute(stmt)
        interviews = result.scalars().all()

        events = []
        for it in interviews:
            raw_status = getattr(it, "interview_status", getattr(it, "status", "SCHEDULED"))
            status_val = str(raw_status.value if hasattr(raw_status, "value") else raw_status).upper()
            events.append({
                "event_name": "interview.scheduled",
                "source": "interview_scheduler",
                "entity_id": str(it.id),
                "payload": self.sanitize({
                    "interview_id": it.id,
                    "candidate": it.candidate_name,
                    "role": it.job_role,
                    "status": status_val,
                }),
                "occurred_at": it.created_at or datetime.utcnow(),
            })

            if status_val == "COMPLETED":
                events.append({
                    "event_name": "interview.completed",
                    "source": "interview_scheduler",
                    "entity_id": str(it.id),
                    "payload": self.sanitize({"interview_id": it.id, "candidate": it.candidate_name}),
                    "occurred_at": it.updated_at or datetime.utcnow(),
                })
            elif status_val == "CANCELLED":
                events.append({
                    "event_name": "interview.cancelled",
                    "source": "interview_scheduler",
                    "entity_id": str(it.id),
                    "payload": self.sanitize({"interview_id": it.id, "candidate": it.candidate_name}),
                    "occurred_at": it.updated_at or datetime.utcnow(),
                })
            elif status_val == "NO_SHOW":
                events.append({
                    "event_name": "interview.no_show",
                    "source": "interview_scheduler",
                    "entity_id": str(it.id),
                    "payload": self.sanitize({"interview_id": it.id, "candidate": it.candidate_name}),
                    "occurred_at": it.updated_at or datetime.utcnow(),
                })

        return events

    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        return []
