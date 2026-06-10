"""
Migration: Add Performance Indexes
Adds indexes on frequently-queried fields to speed up DB operations
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_performance_indexes():
    """Create indexes for performance optimization if they do not exist"""
    try:
        logger.info("🔄 Running migration: add_performance_indexes")
        
        with sync_engine.begin() as conn:
            # 1. Lead table indexes
            logger.info("Creating indexes on lead table...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_lead_campaign_id ON lead (campaign_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_lead_status ON lead (status)"))
            
            # 2. Call Session table indexes
            logger.info("Creating indexes on call_session table...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_call_session_lead_id ON call_session (lead_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_call_session_campaign_id ON call_session (campaign_id)"))
            
            # 3. WhatsApp Log table indexes
            logger.info("Creating indexes on whatsapp_log table...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_whatsapp_log_lead_id ON whatsapp_log (lead_id)"))
            
        logger.info("✅ Migration completed: add_performance_indexes")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: add_performance_indexes - {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_performance_indexes()
