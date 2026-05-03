"""
Migration: Add business profile fields to users table
"""

import logging
from sqlalchemy import text, inspect
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_business_profile_fields():
    """Add business profile fields to users table"""
    
    try:
        logger.info("🔄 Running migration: Add business profile fields...")
        
        # Get inspector to check existing columns
        inspector = inspect(sync_engine)
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        # List of new columns to add
        new_columns = [
            ('business_name', 'VARCHAR(255)'),
            ('business_type', 'VARCHAR(100)'),
            ('business_location', 'VARCHAR(255)'),
            ('business_description', 'TEXT'),
            ('business_setup_completed', 'BOOLEAN DEFAULT FALSE')
        ]
        
        with sync_engine.connect() as conn:
            for column_name, column_type in new_columns:
                if column_name not in existing_columns:
                    logger.info(f"   Adding column: {column_name}")
                    
                    # Handle different database types
                    if 'sqlite' in str(sync_engine.url):
                        # SQLite syntax
                        if column_name == 'business_setup_completed':
                            sql = f"ALTER TABLE users ADD COLUMN {column_name} BOOLEAN DEFAULT 0"
                        else:
                            sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                    else:
                        # PostgreSQL syntax
                        if column_name == 'business_setup_completed':
                            sql = f"ALTER TABLE users ADD COLUMN {column_name} BOOLEAN DEFAULT FALSE"
                        else:
                            sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                    
                    conn.execute(text(sql))
                    conn.commit()
                    logger.info(f"   ✅ Added column: {column_name}")
                else:
                    logger.info(f"   ⏭️  Column already exists: {column_name}")
        
        logger.info("✅ Migration completed: Business profile fields added")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate_add_business_profile_fields()