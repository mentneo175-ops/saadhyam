"""
Migration: Add HR Interview Scheduler Tables
Creates tables for the HR Interview Scheduler plugin:
  - interviews
  - interview_slots
"""

import logging

from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_interview_scheduler_tables():
    """Create all Interview Scheduler plugin tables in the database."""
    logger.info("🔄 Running HR Interview Scheduler tables migration...")

    if sync_engine is None:
        logger.warning(
            "⚠️ Sync database engine not available, skipping interview scheduler tables migration"
        )
        return

    try:
        import models  # noqa: F401 — ensures all models are registered with Base
        from models.interview_scheduler import (
            Interview,
            InterviewSlot,
        )

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                Interview.__table__,
                InterviewSlot.__table__,
            ],
        )
        logger.info("✅ HR Interview Scheduler tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ HR Interview Scheduler tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_interview_scheduler_tables()
