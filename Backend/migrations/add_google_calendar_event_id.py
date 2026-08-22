"""
Migration: Add google_calendar_event_id and google_calendar_event_url columns to interviews table
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_google_calendar_event_id():
    """Add google_calendar_event_id and google_calendar_event_url columns to interviews table if missing."""
    if sync_engine is None:
        logger.warning("⚠️ Sync database engine not available, skipping column migration")
        return

    logger.info("🔄 Running migration for Google Calendar event columns...")
    try:
        with sync_engine.connect() as conn:
            is_sqlite = "sqlite" in str(sync_engine.url)
            
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(interviews)")).fetchall()
                existing_cols = [row[1] for row in result]
            else:
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name='interviews'"
                )).fetchall()
                existing_cols = [row[0] for row in result]

            if "google_calendar_event_id" not in existing_cols:
                logger.info("Adding 'google_calendar_event_id' column to interviews table...")
                conn.execute(text("ALTER TABLE interviews ADD COLUMN google_calendar_event_id VARCHAR(255)"))
                conn.commit()

            if "google_calendar_event_url" not in existing_cols:
                logger.info("Adding 'google_calendar_event_url' column to interviews table...")
                conn.execute(text("ALTER TABLE interviews ADD COLUMN google_calendar_event_url VARCHAR(500)"))
                conn.commit()

        logger.info("✅ Migration for Google Calendar event columns completed successfully")
    except Exception as e:
        logger.error(f"❌ Migration for Google Calendar event columns failed: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_google_calendar_event_id()
