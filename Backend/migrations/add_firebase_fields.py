"""
Database migration to add Firebase authentication fields
"""

import logging
from sqlalchemy import text
from config.database import get_sync_db

logger = logging.getLogger(__name__)

def migrate_add_firebase_fields():
    """Add Firebase authentication fields to users table"""
    
    db = next(get_sync_db())
    
    try:
        logger.info("🔄 Starting Firebase fields migration...")
        
        # Add Firebase UID column
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;
        """))
        
        # Add auth provider column
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'google' NOT NULL;
        """))
        
        # Add profile picture column
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
        """))
        
        # Make hashed_password nullable for Firebase users
        db.execute(text("""
            ALTER TABLE users 
            ALTER COLUMN hashed_password DROP NOT NULL;
        """))
        
        # Create index on firebase_uid
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_firebase_uid 
            ON users(firebase_uid);
        """))
        
        # Update existing users to have auth_provider = 'email'
        db.execute(text("""
            UPDATE users 
            SET auth_provider = 'email' 
            WHERE auth_provider = 'google' AND firebase_uid IS NULL;
        """))
        
        db.commit()
        logger.info("✅ Firebase fields migration completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Firebase fields migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_add_firebase_fields()