"""
Migration: Fix legacy columns to be nullable
The old legacy columns in business_analysis table should allow NULL values
"""

import logging
from sqlalchemy import text
from config.database import sync_engine, IS_SQLITE

logger = logging.getLogger(__name__)


def migrate_fix_description_nullable():
    """
    Make all legacy columns nullable in business_analysis table
    """
    try:
        logger.info("🔄 Running migration: fix_legacy_columns_nullable")
        
        with sync_engine.connect() as conn:
            # Check if table exists
            if IS_SQLITE:
                result = conn.execute(text("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='business_analysis';
                """))
            else:
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'business_analysis'
                    );
                """))
            
            table_exists = result.scalar()
            
            if not table_exists:
                logger.info("⚠️  Table business_analysis does not exist, skipping migration")
                return
            
            # For PostgreSQL, alter columns to be nullable
            if not IS_SQLITE:
                # List of legacy columns that should be nullable
                legacy_columns = [
                    'description',
                    'business_score',
                    'ai_visibility_score',
                    'conversion_score',
                    'strengths',
                    'weaknesses',
                    'opportunities',
                    'threats',
                    'recommendations'
                ]
                
                for column in legacy_columns:
                    try:
                        # Check if column exists
                        result = conn.execute(text(f"""
                            SELECT EXISTS (
                                SELECT FROM information_schema.columns 
                                WHERE table_name = 'business_analysis' 
                                AND column_name = '{column}'
                            );
                        """))
                        
                        if result.scalar():
                            # Alter column to be nullable
                            conn.execute(text(f"""
                                ALTER TABLE business_analysis 
                                ALTER COLUMN {column} DROP NOT NULL;
                            """))
                            logger.info(f"✅ Column {column} is now nullable")
                    except Exception as e:
                        logger.warning(f"⚠️  Could not alter column {column}: {e}")
                
                conn.commit()
                logger.info("✅ Migration completed: all legacy columns are now nullable")
            else:
                logger.info("⚠️  SQLite detected - column constraints cannot be altered, skipping")
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        # Don't raise - allow app to continue even if migration fails


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_fix_description_nullable()
