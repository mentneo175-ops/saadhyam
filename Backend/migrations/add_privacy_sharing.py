"""
Migration: Add Privacy & Data Sharing Controls
Adds analysis_sharing and share_business_data columns to users table
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_privacy_sharing():
    """Add privacy sharing fields to users table"""
    try:
        with sync_engine.connect() as connection:
            # Check if columns already exist
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name IN ('analysis_sharing', 'share_business_data')
            """))
            
            existing_columns = [row[0] for row in result]
            
            # Add analysis_sharing column if it doesn't exist
            if 'analysis_sharing' not in existing_columns:
                logger.info("Adding 'analysis_sharing' column to users table...")
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN analysis_sharing VARCHAR(50) DEFAULT 'private' NOT NULL
                """))
                connection.commit()
                logger.info("✅ 'analysis_sharing' column added successfully")
            else:
                logger.info("✓ 'analysis_sharing' column already exists")
            
            # Add share_business_data column if it doesn't exist
            if 'share_business_data' not in existing_columns:
                logger.info("Adding 'share_business_data' column to users table...")
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN share_business_data BOOLEAN DEFAULT false NOT NULL
                """))
                connection.commit()
                logger.info("✅ 'share_business_data' column added successfully")
            else:
                logger.info("✓ 'share_business_data' column already exists")
                
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    # Can be run directly for testing
    success = migrate_add_privacy_sharing()
    if success:
        print("✅ Migration completed successfully")
    else:
        print("❌ Migration failed")
