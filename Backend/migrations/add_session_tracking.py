"""
Migration: Add session tracking fields to users table
Adds fields to track active sessions and enforce single-session login
"""

from sqlalchemy import text
from config.database import sync_engine
import logging

logger = logging.getLogger(__name__)

def migrate_add_session_tracking():
    """Add session tracking fields to users table"""
    
    try:
        with sync_engine.connect() as conn:
            # Check if columns already exist
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('active_session_token', 'session_created_at', 'session_ip_address', 'session_user_agent')
            """)
            
            result = conn.execute(check_query)
            existing_columns = [row[0] for row in result]
            
            if len(existing_columns) == 4:
                logger.info("✅ Session tracking columns already exist")
                return
            
            logger.info("🔄 Adding session tracking columns to users table...")
            
            # Add session tracking columns
            if 'active_session_token' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN active_session_token VARCHAR(500) NULL
                """))
                logger.info("✅ Added active_session_token column")
            
            if 'session_created_at' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN session_created_at TIMESTAMP NULL
                """))
                logger.info("✅ Added session_created_at column")
            
            if 'session_ip_address' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN session_ip_address VARCHAR(45) NULL
                """))
                logger.info("✅ Added session_ip_address column")
            
            if 'session_user_agent' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN session_user_agent TEXT NULL
                """))
                logger.info("✅ Added session_user_agent column")
            
            conn.commit()
            logger.info("✅ Session tracking migration completed successfully")
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_add_session_tracking()
