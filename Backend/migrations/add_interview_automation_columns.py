"""
Migration: Add Interview Automation Tracking Columns
Adds confirmation_sent and reminder_sent columns to the interviews table.
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_interview_automation_columns():
    """Add confirmation_sent and reminder_sent columns to interviews table if missing."""
    if sync_engine is None:
        logger.warning("⚠️ Sync database engine not available, skipping column migration")
        return

    logger.info("🔄 Running migration for interview automation columns...")
    try:
        with sync_engine.connect() as conn:
            is_sqlite = "sqlite" in str(sync_engine.url)
            
            # Check existing columns
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(interviews)")).fetchall()
                existing_cols = [row[1] for row in result]
            else:
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name='interviews'"
                )).fetchall()
                existing_cols = [row[0] for row in result]

            if "confirmation_sent" not in existing_cols:
                logger.info("Adding 'confirmation_sent' column to interviews table...")
                conn.execute(text("ALTER TABLE interviews ADD COLUMN confirmation_sent BOOLEAN DEFAULT FALSE"))
                conn.commit()

            if "reminder_sent" not in existing_cols:
                logger.info("Adding 'reminder_sent' column to interviews table...")
                conn.execute(text("ALTER TABLE interviews ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE"))
                conn.commit()

        logger.info("✅ Migration for interview automation columns completed successfully")
    except Exception as e:
        logger.error(f"❌ Migration for interview automation columns failed: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_interview_automation_columns()
