"""
Migration: Add Chat Tables for B2B Network
Creates tables for chat rooms, messages, and connection requests
"""

import logging
from sqlalchemy import text
from config.database import get_db_sync

logger = logging.getLogger(__name__)

def migrate_add_chat_tables():
    """
    Add chat tables for B2B network functionality
    """
    try:
        db = next(get_db_sync())
        
        logger.info("🔄 Starting chat tables migration...")
        
        # Create chat_rooms table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id VARCHAR(36) PRIMARY KEY,
                user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create unique functional index on chat_rooms
        db.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS unique_room ON chat_rooms (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
        """))
        
        # Create chat_messages table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id VARCHAR(36) PRIMARY KEY,
                room_id VARCHAR(36) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create indexes for chat_messages
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_room_created ON chat_messages (room_id, created_at)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_sender ON chat_messages (sender_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_unread ON chat_messages (room_id, is_read)"))
        
        # Create connection_requests table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS connection_requests (
                id VARCHAR(36) PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create indexes and unique constraints for connection_requests
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_receiver_status ON connection_requests (receiver_id, status)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_conn_sender ON connection_requests (sender_id)"))
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS unique_request ON connection_requests (sender_id, receiver_id)"))
        
        db.commit()
        logger.info("✅ Chat tables migration completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Chat tables migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_add_chat_tables()