"""
Migration: Add blogs table
Creates blogs table for blog management system
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config.settings import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_add_blogs_table():
    """Run the migration to add blogs table"""
    
    # Use sync database URL
    database_url = settings.DATABASE_URL
    if database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        try:
            logger.info("Creating blogs table...")
            
            # Create blogs table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS blogs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    
                    -- Blog content
                    title VARCHAR(500) NOT NULL,
                    slug VARCHAR(500) NOT NULL,
                    meta_description VARCHAR(500),
                    featured_image_url VARCHAR(1000),
                    featured_image_prompt TEXT,
                    
                    -- Content
                    introduction TEXT,
                    main_content JSONB,
                    conclusion TEXT,
                    
                    -- SEO
                    seo_keywords JSONB,
                    tags JSONB,
                    category VARCHAR(100),
                    
                    -- Metadata
                    reading_time INTEGER,
                    word_count INTEGER,
                    
                    -- FAQ
                    faq JSONB,
                    
                    -- Internal links
                    internal_links JSONB,
                    
                    -- CTA
                    cta JSONB,
                    
                    -- Publishing
                    status VARCHAR(50) DEFAULT 'draft',
                    is_published BOOLEAN DEFAULT FALSE,
                    published_at TIMESTAMP,
                    
                    -- Timestamps
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Source
                    source VARCHAR(100) DEFAULT 'auto_blogger'
                );
            """))
            
            # Create indexes
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at);
            """))
            
            conn.commit()
            
            logger.info("✅ Blogs table created successfully")
            logger.info("✅ Indexes created successfully")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            conn.rollback()
            raise


if __name__ == "__main__":
    migrate_add_blogs_table()
