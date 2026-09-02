"""
Migration: Add Problem Discovery & Resolution Engine Phase 11 Learning Tables
Creates database tables for:
  - problem_learning_records
"""

import logging
from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_problem_engine_learning_tables():
    """Create Phase 11 learning records table in the database if sync_engine is available."""
    logger.info("🔄 Running Problem Engine Phase 11 learning tables migration...")

    if sync_engine is None:
        logger.warning(
            "⚠️ Sync database engine not available, skipping Problem Engine Phase 11 learning tables migration"
        )
        return

    try:
        import models  # noqa: F401 — registers all models with Base
        from models.problem_engine import ProblemLearningRecord

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                ProblemLearningRecord.__table__,
            ],
        )
        logger.info("✅ Problem Engine Phase 11 learning tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ Problem Engine Phase 11 learning tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_problem_engine_learning_tables()
