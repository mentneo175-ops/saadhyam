"""
Migration: Add user_id column to review_history table
"""

import logging
from sqlalchemy import text
from config.database import get_db_for_migration

logger = logging.getLogger(__name__)


def migrate_add_user_id_to_review_history():
    """Add user_id column to review_history table"""
    db = get_db_for_migration()
    
    try:
        logger.info("🔄 Checking review_history table for user_id column...")
        
        # Check if column already exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='review_history' AND column_name='user_id'
        """))
        
        if result.fetchone():
            logger.info("✅ user_id column already exists in review_history table")
            return
        
        # Add user_id column
        logger.info("🔄 Adding user_id column to review_history table...")
        db.execute(text("""
            ALTER TABLE review_history 
            ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        """))
        db.commit()
        
        logger.info("✅ Successfully added user_id column to review_history table")
        
    except Exception as e:
        logger.error(f"❌ Error adding user_id column to review_history: {e}")
        db.rollback()
        # Don't raise - allow server to continue if migration fails
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_user_id_to_review_history()
