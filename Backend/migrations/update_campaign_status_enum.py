"""
Migration: Update campaign status enum to add ACTIVE, DELETED, ARCHIVED
Adds missing values to existing campaignstatus enum
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_update_campaign_status_enum():
    """Update campaign status enum to add missing values"""
    try:
        logger.info("🔄 Running migration: update_campaign_status_enum")
        # Skip on SQLite since SQLite doesn't support custom PostgreSQL enum types
        if "sqlite" in sync_engine.dialect.name:
            logger.info("ℹ️ SQLite detected, skipping update_campaign_status_enum migration")
            return
            
        with sync_engine.begin() as conn:
            # Check current enum values
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'campaignstatus'
            """))
            
            existing_values = {row[0] for row in result.fetchall()}
            logger.info(f"Existing campaignstatus values: {existing_values}")
            
            # Add missing values
            values_to_add = ['ACTIVE', 'DELETED', 'ARCHIVED']
            
            for value in values_to_add:
                if value not in existing_values:
                    logger.info(f"Adding '{value}' to campaignstatus enum")
                    conn.execute(text(f"""
                        ALTER TYPE campaignstatus ADD VALUE IF NOT EXISTS '{value}'
                    """))
                else:
                    logger.info(f"'{value}' already exists in campaignstatus enum")
            
            # Do the same for adsetstatus
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'adsetstatus'
            """))
            
            existing_values = {row[0] for row in result.fetchall()}
            logger.info(f"Existing adsetstatus values: {existing_values}")
            
            for value in values_to_add:
                if value not in existing_values:
                    logger.info(f"Adding '{value}' to adsetstatus enum")
                    conn.execute(text(f"""
                        ALTER TYPE adsetstatus ADD VALUE IF NOT EXISTS '{value}'
                    """))
                else:
                    logger.info(f"'{value}' already exists in adsetstatus enum")
            
            # Do the same for adstatus
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'adstatus'
            """))
            
            existing_values = {row[0] for row in result.fetchall()}
            logger.info(f"Existing adstatus values: {existing_values}")
            
            for value in values_to_add:
                if value not in existing_values:
                    logger.info(f"Adding '{value}' to adstatus enum")
                    conn.execute(text(f"""
                        ALTER TYPE adstatus ADD VALUE IF NOT EXISTS '{value}'
                    """))
                else:
                    logger.info(f"'{value}' already exists in adstatus enum")
            
        logger.info("✅ Migration completed: update_campaign_status_enum")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: update_campaign_status_enum - {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_update_campaign_status_enum()
