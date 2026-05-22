"""
Migration: Add is_suspended column to users table
"""

import logging
from sqlalchemy import text
from config.database import get_db_for_migration

logger = logging.getLogger(__name__)


def migrate_add_is_suspended_column():
    """Add is_suspended column to users table"""
    db = get_db_for_migration()
    
    try:
        logger.info("🔄 Starting migration: Add is_suspended column to users table")
        
        # Check if column already exists (PostgreSQL)
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='is_suspended'
        """))
        
        if result.fetchone():
            logger.info("✅ Column 'is_suspended' already exists in users table")
            return True
        
        # Add is_suspended column with default value False (PostgreSQL)
        logger.info("📝 Adding is_suspended column to users table...")
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE NOT NULL
        """))
        
        db.commit()
        logger.info("✅ Migration completed: is_suspended column added successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_is_suspended_column()
