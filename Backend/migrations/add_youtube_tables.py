"""
Migration: Add YouTube tables
Creates tables for YouTube channels, videos, and analytics
"""

import logging
from sqlalchemy import inspect
from config.database import sync_engine, Base

# Import YouTube models to register them with SQLAlchemy Base
from models.youtube import (
    YouTubeChannel,
    YouTubeVideo,
    YouTubeAnalytics
)

logger = logging.getLogger(__name__)


def migrate_add_youtube_tables():
    """
    Add YouTube tables to database
    """
    try:
        logger.info("[Migration] Checking YouTube tables...")
        
        inspector = inspect(sync_engine)
        existing_tables = inspector.get_table_names()
        
        tables_to_create = [
            'youtube_channels',
            'youtube_videos',
            'youtube_analytics'
        ]
        
        missing_tables = [t for t in tables_to_create if t not in existing_tables]
        
        if missing_tables:
            logger.info(f"[Migration] Creating YouTube tables: {missing_tables}")
            Base.metadata.create_all(bind=sync_engine, checkfirst=True)
            logger.info("[Migration] ✅ YouTube tables created successfully")
        else:
            logger.info("[Migration] ✅ YouTube tables already exist")
        
        return True
        
    except Exception as e:
        logger.error(f"[Migration] ❌ Failed to create YouTube tables: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_youtube_tables()
