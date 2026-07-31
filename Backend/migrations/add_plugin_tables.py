"""
Add Plugin System Tables Migration
Creates all plugin-related database tables using SQLAlchemy Base metadata.
"""

import logging
from config.database import Base, sync_engine
import models  # Ensures all models are registered with Base

logger = logging.getLogger(__name__)

def migrate_add_plugin_tables():
    """Add plugin system tables to database"""
    logger.info("🔄 Running plugin tables migration...")
    
    if sync_engine is None:
        logger.warning("⚠️ Sync database engine not available, skipping plugin tables migration")
        return
    
    try:
        from models.plugins import Plugin, UserPlugin, PluginAnalytics
        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                Plugin.__table__,
                UserPlugin.__table__,
                PluginAnalytics.__table__,
            ]
        )
        logger.info("✅ Plugin tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ Plugin tables migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_add_plugin_tables()