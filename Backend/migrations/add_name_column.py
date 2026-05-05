"""
Migration: Add 'name' column to users table
This script adds the missing 'name' column to the existing users table.
Handles both SQLite and PostgreSQL.
"""

import os
import logging
from sqlalchemy import text, inspect
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_name_column():
    """Add 'name' column to users table if it doesn't exist."""
    try:
        with sync_engine.connect() as connection:
            # Use SQLAlchemy inspector to check if column exists (works for both SQLite and PostgreSQL)
            inspector = inspect(sync_engine)
            columns = inspector.get_columns('users')
            column_names = [col['name'] for col in columns]
            
            if 'name' in column_names:
                logger.info("✅ 'name' column already exists in users table")
                return
            
            # Add the column (same syntax works for both SQLite and PostgreSQL)
            logger.info("🔄 Adding 'name' column to users table...")
            connection.execute(
                text("ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL")
            )
            connection.commit()
            logger.info("✅ Successfully added 'name' column to users table")
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_name_column()
