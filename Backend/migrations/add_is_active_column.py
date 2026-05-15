"""
Migration: Add is_active column to users table
"""

import logging
from sqlalchemy import text
from config.database import get_db_for_migration

logger = logging.getLogger(__name__)


def migrate_add_is_active_column():
    """Add is_active column to users table"""
    db = get_db_for_migration()
    
    try:
        logger.info("🔄 Starting migration: Add is_active column to users table")
        
        # Check if column already exists (PostgreSQL)
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='is_active'
        """))
        
        if result.fetchone():
            logger.info("✅ Column 'is_active' already exists in users table")
            return True
        
        # Add is_active column with default value True (PostgreSQL)
        logger.info("📝 Adding is_active column to users table...")
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL
        """))
        
        db.commit()
        logger.info("✅ Migration completed: is_active column added successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_is_active_column()
