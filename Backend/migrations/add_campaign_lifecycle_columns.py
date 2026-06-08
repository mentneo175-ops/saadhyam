"""
Migration: Add campaign lifecycle columns (soft-delete + archive)
Idempotent — safe to run multiple times.
"""
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)


def run_migration(db):
    """Add lifecycle columns to the campaign table if they don't exist."""
    try:
        columns_to_add = [
            ("is_archived", "BOOLEAN DEFAULT FALSE"),
            ("archived_at", "TIMESTAMP NULL"),
            ("is_deleted",  "BOOLEAN DEFAULT FALSE"),
            ("deleted_at",  "TIMESTAMP NULL"),
        ]

        for col_name, col_def in columns_to_add:
            # Check if column already exists
            check_sql = text("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_name = 'campaign' AND column_name = :col
            """)
            count = db.execute(check_sql, {"col": col_name}).scalar()
            if count == 0:
                db.execute(text(f"ALTER TABLE campaign ADD COLUMN {col_name} {col_def}"))
                logger.info(f"[Migration] ✅ Added column campaign.{col_name}")
            else:
                logger.info(f"[Migration] ✅ Column campaign.{col_name} already exists")

        # Add index on is_deleted for fast filtering
        try:
            db.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_campaign_is_deleted ON campaign (is_deleted)"
            ))
            db.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_campaign_is_archived ON campaign (is_archived)"
            ))
        except Exception:
            pass  # Indexes may already exist

        db.commit()
        logger.info("[Migration] ✅ Campaign lifecycle columns migration complete")
    except Exception as e:
        db.rollback()
        logger.error(f"[Migration] ❌ Failed: {e}", exc_info=True)
        raise
