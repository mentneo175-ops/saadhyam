"""
Migration: Add last_generated_website_id to users table
"""
import logging
from sqlalchemy import create_engine, text
from config.settings import settings

logger = logging.getLogger(__name__)


def run_migration():
    """Add last_generated_website_id column to users table"""
    try:
        logger.info("🔄 Running migration: add_website_id_to_user")
        
        # Use sync database URL
        database_url = settings.DATABASE_URL
        if database_url.startswith("postgresql+asyncpg://"):
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if column already exists (SQLite compatible)
            if "sqlite" in database_url:
                result = conn.execute(text("PRAGMA table_info(users);"))
                columns = [row[1] for row in result.fetchall()]
                column_exists = 'last_generated_website_id' in columns
            else:
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='last_generated_website_id';
                """))
                column_exists = result.fetchone() is not None
            
            if column_exists:
                logger.info("   ⏭️  Column 'last_generated_website_id' already exists")
                return
            
            # Add the column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN last_generated_website_id VARCHAR(36);
            """))
            
            conn.commit()
            logger.info("✅ Migration completed: last_generated_website_id column added")
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    run_migration()
