"""
Task Tracking & Growth Metrics Connector Adapter for Problem Discovery Engine
Ingests DailyTask and GrowthMetric records from models/task_tracking.py
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.problem_engine.connectors.base import BaseBusinessConnector, to_naive_utc

logger = logging.getLogger(__name__)


class TaskGrowthConnector(BaseBusinessConnector):
    """Connector for internal business task tracking and growth telemetry."""

    @property
    def connector_key(self) -> str:
        return "tasks_growth"

    @property
    def source_type(self) -> str:
        return "operations_analytics"

    @property
    def display_name(self) -> str:
        return "Operations & Growth Tracking"

    @property
    def description(self) -> str:
        return "Synchronizes daily employee/team execution tasks and business performance metrics."

    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        try:
            from models.task_tracking import DailyTask
            stmt = select(DailyTask.id).where(DailyTask.user_id == user_id).limit(1)
            await db.execute(stmt)
            return True
        except Exception as e:
            logger.warning(f"TaskGrowthConnector test_connection failed: {e}")
            return False

    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.task_tracking import DailyTask, GrowthMetric

        since_dt = to_naive_utc(since)
        entities = []

        # 1. Daily Tasks
        task_stmt = select(DailyTask).where(DailyTask.user_id == user_id)
        if since_dt:
            task_stmt = task_stmt.where(DailyTask.updated_at >= since_dt)
        task_res = await db.execute(task_stmt)
        for t in task_res.scalars().all():
            status_str = "COMPLETED" if t.is_completed else "PENDING"
            entities.append({
                "entity_type": "task",
                "entity_key": f"task:{t.id}",
                "source_record_id": str(t.id),
                "display_name": f"Task: {t.title}",
                "status": status_str,
                "properties": self.sanitize({
                    "title": t.title,
                    "priority": t.priority,
                    "category": t.category,
                    "is_completed": t.is_completed,
                    "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                    "assigned_date": t.assigned_date.isoformat() if getattr(t, "assigned_date", None) else None,
                    "due_date": t.due_date.isoformat() if getattr(t, "due_date", None) else None,
                }),
                "created_at": getattr(t, "created_at", None) or datetime.utcnow(),
                "updated_at": getattr(t, "updated_at", None) or datetime.utcnow(),
            })

        # 2. Growth Metrics
        metric_stmt = select(GrowthMetric).where(GrowthMetric.user_id == user_id)
        if since_dt:
            metric_stmt = metric_stmt.where(GrowthMetric.created_at >= since_dt)
        metric_res = await db.execute(metric_stmt)
        for m in metric_res.scalars().all():
            entities.append({
                "entity_type": "metric",
                "entity_key": f"metric:{m.id}",
                "source_record_id": str(m.id),
                "display_name": f"Growth Score: {m.growth_score:.1f} ({m.completion_rate:.0f}%)",
                "status": "RECORDED",
                "properties": self.sanitize({
                    "metric_date": m.metric_date.isoformat() if getattr(m, "metric_date", None) else None,
                    "tasks_assigned": m.tasks_assigned,
                    "tasks_completed": m.tasks_completed,
                    "completion_rate": float(m.completion_rate or 0.0),
                    "growth_score": float(m.growth_score or 0.0),
                    "productivity_score": float(m.productivity_score or 0.0),
                    "consistency_score": float(m.consistency_score or 0.0),
                    "points_earned": m.points_earned,
                }),
                "created_at": getattr(m, "created_at", None) or datetime.utcnow(),
                "updated_at": getattr(m, "updated_at", None) or datetime.utcnow(),
            })

        return entities

    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.task_tracking import DailyTask, GrowthMetric

        since_dt = to_naive_utc(since)
        events = []
        task_stmt = select(DailyTask).where(DailyTask.user_id == user_id)
        if since_dt:
            task_stmt = task_stmt.where(DailyTask.updated_at >= since_dt)
        task_res = await db.execute(task_stmt)
        for t in task_res.scalars().all():
            if t.is_completed:
                events.append({
                    "event_name": "task.completed",
                    "source": "task_tracking",
                    "entity_id": str(t.id),
                    "payload": self.sanitize({"task_id": t.id, "title": t.title, "category": t.category}),
                    "occurred_at": t.completed_at or getattr(t, "updated_at", None) or datetime.utcnow(),
                })

        metric_stmt = select(GrowthMetric).where(GrowthMetric.user_id == user_id)
        if since_dt:
            metric_stmt = metric_stmt.where(GrowthMetric.created_at >= since_dt)
        metric_res = await db.execute(metric_stmt)
        for m in metric_res.scalars().all():
            rate = float(m.completion_rate or 0.0)
            if rate < 50.0 and m.tasks_assigned > 0:
                events.append({
                    "event_name": "metric.completion_rate_low",
                    "source": "growth_analytics",
                    "entity_id": str(m.id),
                    "payload": self.sanitize({
                        "completion_rate": rate,
                        "tasks_assigned": m.tasks_assigned,
                        "tasks_completed": m.tasks_completed,
                    }),
                    "occurred_at": getattr(m, "created_at", None) or datetime.utcnow(),
                })
            elif rate >= 80.0:
                events.append({
                    "event_name": "metric.target_achieved",
                    "source": "growth_analytics",
                    "entity_id": str(m.id),
                    "payload": self.sanitize({
                        "completion_rate": rate,
                        "growth_score": float(m.growth_score or 0.0),
                    }),
                    "occurred_at": getattr(m, "created_at", None) or datetime.utcnow(),
                })

        return events

    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        return []
