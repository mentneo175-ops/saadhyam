"""
Migration: Add business_profiles table
"""

import logging
from sqlalchemy import text
from config.database import sync_engine, IS_SQLITE

logger = logging.getLogger(__name__)


def migrate_add_business_profile_table():
    """Add business_profiles table if it doesn't exist"""
    try:
        with sync_engine.connect() as conn:
            # Check if table exists
            if IS_SQLITE:
                result = conn.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' AND name='business_profiles'")
                )
            else:
                result = conn.execute(
                    text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_profiles')")
                )
            
            table_exists = result.fetchone()
            
            if IS_SQLITE:
                table_exists = table_exists is not None
            else:
                table_exists = table_exists[0] if table_exists else False
            
            if not table_exists:
                logger.info("🔄 Creating business_profiles table...")
                
                # Create table
                create_table_sql = """
                CREATE TABLE business_profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    business_description TEXT,
                    pdf_file_url TEXT,
                    audio_file_url TEXT,
                    website_url TEXT,
                    pdf_extracted_text TEXT,
                    audio_extracted_text TEXT,
                    website_extracted_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """ if IS_SQLITE else """
                CREATE TABLE business_profiles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    business_description TEXT,
                    pdf_file_url TEXT,
                    audio_file_url TEXT,
                    website_url TEXT,
                    pdf_extracted_text TEXT,
                    audio_extracted_text TEXT,
                    website_extracted_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                """
                
                conn.execute(text(create_table_sql))
                
                # Create index
                conn.execute(text("CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id)"))
                
                conn.commit()
                logger.info("✅ business_profiles table created successfully")
            else:
                logger.info("✅ business_profiles table already exists")
                
    except Exception as e:
        logger.error(f"❌ Failed to create business_profiles table: {e}")
        raise


if __name__ == "__main__":
    migrate_add_business_profile_table()
