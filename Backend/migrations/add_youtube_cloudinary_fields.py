"""
Migration: add Cloudinary reference columns to YouTube videos.
Stores Cloudinary public IDs so uploaded media can be deleted after a successful YouTube post.
"""

import logging

from sqlalchemy import inspect, text

from config.database import sync_engine, IS_SQLITE

logger = logging.getLogger(__name__)


def _column_exists(conn, table_name: str, column_name: str) -> bool:
    if IS_SQLITE:
        result = conn.execute(text(f"PRAGMA table_info({table_name});"))
        return any(row[1] == column_name for row in result.fetchall())

    result = conn.execute(text(
        """
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = :table_name AND column_name = :column_name
        );
        """,
    ), {"table_name": table_name, "column_name": column_name})
    return bool(result.scalar())


def migrate_add_youtube_cloudinary_fields():
    try:
        logger.info("[Migration] Checking Cloudinary columns on youtube_videos...")

        inspector = inspect(sync_engine)
        if "youtube_videos" not in inspector.get_table_names():
            logger.info("[Migration] youtube_videos table does not exist yet; skipping")
            return True

        with sync_engine.connect() as conn:
            columns = {
                "video_public_id": "TEXT",
                "thumbnail_public_id": "TEXT",
            }

            for column_name, column_type in columns.items():
                if _column_exists(conn, "youtube_videos", column_name):
                    logger.info(f"[Migration] Column {column_name} already exists")
                    continue

                if IS_SQLITE:
                    conn.execute(text(f"ALTER TABLE youtube_videos ADD COLUMN {column_name} {column_type};"))
                else:
                    conn.execute(text(f"ALTER TABLE youtube_videos ADD COLUMN IF NOT EXISTS {column_name} {column_type};"))
                logger.info(f"[Migration] Added column {column_name}")

            conn.commit()

        logger.info("[Migration] ✅ Cloudinary columns added successfully")
        return True
    except Exception as e:
        logger.error(f"[Migration] ❌ Failed to add Cloudinary columns: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_youtube_cloudinary_fields()
