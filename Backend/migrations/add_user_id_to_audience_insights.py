"""
Migration: Add user_id to audience_insights

This migration adds a nullable `user_id` column to the existing
`audience_insights` table, attempts to backfill it from
`instagram_business_accounts.account_id -> user_id` when possible, and then
creates an index and optional foreign key constraint.

Run this on your database before resuming campaign automation.
"""

import logging
import os
import sys
from pathlib import Path
from sqlalchemy import text

# Ensure the package root (Backend) is on sys.path so `import config` works
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.database import sync_engine

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')


def migrate_add_user_id_to_audience_insights():
    try:
        logger.info("🔄 Running migration: add_user_id_to_audience_insights")

        with sync_engine.begin() as conn:
            # Only proceed if table exists
            exists = conn.execute(text("""
                SELECT to_regclass('public.audience_insights') IS NOT NULL as exists
            """))
            row = exists.fetchone()
            if not row or not row[0]:
                logger.info("audience_insights table does not exist, skipping migration")
                return

            # Add user_id column if it doesn't exist
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='audience_insights' AND column_name='user_id'
                    ) THEN
                        ALTER TABLE audience_insights ADD COLUMN user_id INTEGER;
                    END IF;
                END$$;
            """))

            # Backfill user_id from instagram_business_accounts if account_id present
            conn.execute(text("""
                UPDATE audience_insights ai
                SET user_id = iba.user_id
                FROM instagram_business_accounts iba
                WHERE ai.account_id IS NOT NULL AND ai.account_id = iba.id AND (ai.user_id IS NULL OR ai.user_id = 0);
            """))

            # Create index for faster lookups
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_audience_insights_user_id ON audience_insights(user_id);
            """))

            # Optionally add FK if all rows have matching users — keep commented to avoid migration failures
            # conn.execute(text("""
            #     ALTER TABLE audience_insights
            #     ADD CONSTRAINT fk_audience_insights_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            # """))

        logger.info("✅ Migration completed: add_user_id_to_audience_insights")

    except Exception as e:
        logger.error(f"❌ Migration failed: add_user_id_to_audience_insights - {e}")
        raise


if __name__ == '__main__':
    migrate_add_user_id_to_audience_insights()
