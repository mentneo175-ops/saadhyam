"""
Migration: Fix campaign status enum issue
Converts status columns from VARCHAR to proper PostgreSQL enums
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_fix_campaign_status_enum():
    """Fix campaign status enum types"""
    try:
        logger.info("🔄 Running migration: fix_campaign_status_enum")
        
        with sync_engine.begin() as conn:
            # Check if enum types already exist
            result = conn.execute(text("""
                SELECT typname FROM pg_type 
                WHERE typname IN ('campaignstatus', 'adsetstatus', 'adstatus', 'campaignobjective')
            """))
            
            existing_types = {row[0] for row in result.fetchall()}
            
            # Create enum types if they don't exist
            if 'campaignobjective' not in existing_types:
                logger.info("Creating campaignobjective enum type")
                conn.execute(text("""
                    CREATE TYPE campaignobjective AS ENUM (
                        'OUTCOME_TRAFFIC',
                        'OUTCOME_ENGAGEMENT',
                        'OUTCOME_AWARENESS',
                        'OUTCOME_LEADS',
                        'OUTCOME_SALES'
                    )
                """))
            
            if 'campaignstatus' not in existing_types:
                logger.info("Creating campaignstatus enum type")
                conn.execute(text("""
                    CREATE TYPE campaignstatus AS ENUM (
                        'ACTIVE',
                        'PAUSED',
                        'DELETED',
                        'ARCHIVED'
                    )
                """))
            
            if 'adsetstatus' not in existing_types:
                logger.info("Creating adsetstatus enum type")
                conn.execute(text("""
                    CREATE TYPE adsetstatus AS ENUM (
                        'ACTIVE',
                        'PAUSED',
                        'DELETED',
                        'ARCHIVED'
                    )
                """))
            
            if 'adstatus' not in existing_types:
                logger.info("Creating adstatus enum type")
                conn.execute(text("""
                    CREATE TYPE adstatus AS ENUM (
                        'ACTIVE',
                        'PAUSED',
                        'DELETED',
                        'ARCHIVED'
                    )
                """))
            
            # Check if ad_campaigns table exists and needs conversion
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'ad_campaigns' AND column_name IN ('status', 'objective')
            """))
            
            columns = {row[0]: row[1] for row in result.fetchall()}
            
            # Convert ad_campaigns.objective from VARCHAR to enum
            if columns.get('objective') == 'character varying':
                logger.info("Converting ad_campaigns.objective to enum")
                conn.execute(text("""
                    ALTER TABLE ad_campaigns 
                    ALTER COLUMN objective TYPE campaignobjective 
                    USING objective::campaignobjective
                """))
            
            # Convert ad_campaigns.status from VARCHAR to enum
            if columns.get('status') == 'character varying':
                logger.info("Converting ad_campaigns.status to enum")
                conn.execute(text("""
                    ALTER TABLE ad_campaigns 
                    ALTER COLUMN status TYPE campaignstatus 
                    USING status::campaignstatus
                """))
            
            # Check and convert ad_sets.status
            result = conn.execute(text("""
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'ad_sets' AND column_name = 'status'
            """))
            
            row = result.fetchone()
            if row and row[0] == 'character varying':
                logger.info("Converting ad_sets.status to enum")
                conn.execute(text("""
                    ALTER TABLE ad_sets 
                    ALTER COLUMN status TYPE adsetstatus 
                    USING status::adsetstatus
                """))
            
            # Check and convert ads.status
            result = conn.execute(text("""
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'ads' AND column_name = 'status'
            """))
            
            row = result.fetchone()
            if row and row[0] == 'character varying':
                logger.info("Converting ads.status to enum")
                conn.execute(text("""
                    ALTER TABLE ads 
                    ALTER COLUMN status TYPE adstatus 
                    USING status::adstatus
                """))
            
        logger.info("✅ Migration completed: fix_campaign_status_enum")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: fix_campaign_status_enum - {e}")
        raise


if __name__ == "__main__":
    migrate_fix_campaign_status_enum()
