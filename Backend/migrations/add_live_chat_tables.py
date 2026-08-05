"""
Migration: Add Live Chat Tables
Creates tables for the Live Chat plugin:
  - live_chat_visitors
  - live_chat_conversations
  - live_chat_messages

These tables are independent of the B2B chat tables (chat_rooms, chat_messages).
"""

import logging

from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_live_chat_tables():
    """Create all Live Chat plugin tables in the database."""
    logger.info("🔄 Running live chat tables migration...")

    if sync_engine is None:
        logger.warning(
            "⚠️ Sync database engine not available, skipping live chat tables migration"
        )
        return

    try:
        import models  # noqa: F401 — ensures all models are registered with Base
        from models.live_chat import (
            LiveChatVisitor,
            LiveChatConversation,
            LiveChatMessage,
        )

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                LiveChatVisitor.__table__,
                LiveChatConversation.__table__,
                LiveChatMessage.__table__,
            ],
        )
        logger.info("✅ Live chat tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ Live chat tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_live_chat_tables()
