"""
Migration: Add Problem Discovery & Resolution Engine Phase 2 Tables
Creates database tables for:
  - business_entities
  - business_entity_relationships
  - connector_sync_states
"""

import logging
from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_problem_engine_phase2_tables():
    """Create Phase 2 tables in the database if sync_engine is available."""
    logger.info("🔄 Running Problem Engine Phase 2 tables migration...")

    if sync_engine is None:
        logger.warning(
            "⚠️ Sync database engine not available, skipping Problem Engine Phase 2 tables migration"
        )
        return

    try:
        import models  # noqa: F401 — registers all models with Base
        from models.problem_engine import (
            BusinessEntity,
            BusinessEntityRelationship,
            ConnectorSyncState,
        )

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                BusinessEntity.__table__,
                BusinessEntityRelationship.__table__,
                ConnectorSyncState.__table__,
            ],
        )
        logger.info("✅ Problem Engine Phase 2 tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ Problem Engine Phase 2 tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_problem_engine_phase2_tables()
