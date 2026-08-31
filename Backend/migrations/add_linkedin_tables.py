"""
Migration: Add LinkedIn Store Tables
Creates database tables for LinkedInPluginConfig, LinkedInConnection, and LinkedInPostHistory.
"""

import logging
from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_linkedin_tables():
    """Create LinkedIn tables in the database if sync_engine is available."""
    logger.info("≡ƒöä Running LinkedIn tables migration...")

    if sync_engine is None:
        logger.warning("ΓÜá∩╕Å Sync database engine not available, skipping LinkedIn tables migration")
        return

    try:
        import models  # noqa: F401
        from models.linkedin import (
            LinkedInPluginConfig,
            LinkedInConnection,
            LinkedInPostHistory,
        )

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                LinkedInPluginConfig.__table__,
                LinkedInConnection.__table__,
                LinkedInPostHistory.__table__,
            ],
        )
        logger.info("Γ£à LinkedIn tables migration completed successfully")
    except Exception as e:
        logger.error(f"Γ¥î LinkedIn tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_linkedin_tables()