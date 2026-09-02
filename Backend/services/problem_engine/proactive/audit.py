"""
Problem Engine Lifecycle Audit Logger (Phase 8)
Records structured, chronological lifecycle audit events for problems and background detection runs.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from models.problem_engine import ProblemLifecycleAudit, AuditEventType
from services.problem_engine.connectors.base import sanitize_sensitive_data

logger = logging.getLogger(__name__)


class ProblemAuditLogger:
    """Service to record immutable lifecycle audit events for full engine observability."""

    @classmethod
    async def record_audit_event(
        cls,
        db: AsyncSession,
        user_id: int,
        event_type: AuditEventType,
        problem_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> ProblemLifecycleAudit:
        """
        Records a lifecycle audit entry in the problem_lifecycle_audits table.
        """
        try:
            cleaned_details = sanitize_sensitive_data(details or {})
            audit = ProblemLifecycleAudit(
                user_id=user_id,
                problem_id=problem_id,
                event_type=event_type,
                details=cleaned_details,
            )
            db.add(audit)
            await db.flush()
            logger.info(
                f"📝 [Audit Log] user_id={user_id}, event_type={event_type.value}, problem_id={problem_id}"
            )
            return audit
        except Exception as e:
            logger.error(f"❌ Failed to record lifecycle audit log: {e}", exc_info=True)
            raise

    @classmethod
    async def get_audit_logs(
        cls,
        db: AsyncSession,
        user_id: int,
        problem_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ProblemLifecycleAudit]:
        """
        Fetches chronological audit logs for a tenant or specific problem.
        """
        stmt = (
            select(ProblemLifecycleAudit)
            .where(ProblemLifecycleAudit.user_id == user_id)
            .order_by(desc(ProblemLifecycleAudit.created_at))
        )
        if problem_id is not None:
            stmt = stmt.where(ProblemLifecycleAudit.problem_id == problem_id)

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())
