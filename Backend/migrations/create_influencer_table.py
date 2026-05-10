"""
Migration: Create Influencer Table
Creates persistent storage for real influencer data
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_create_influencer_table():
    """Create influencer table for persistent storage"""
    try:
        logger.info("🔄 Creating influencer table...")
        
        with sync_engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='influencers'
            """))
            
            if result.fetchone():
                logger.info("✅ Influencer table already exists")
                return
            
            # Create influencers table
            conn.execute(text("""
                CREATE TABLE influencers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    display_name VARCHAR(255),
                    platform VARCHAR(50) DEFAULT 'instagram',
                    bio TEXT,
                    profile_image_url VARCHAR(500),
                    is_verified BOOLEAN DEFAULT 0,
                    followers INTEGER DEFAULT 0,
                    following INTEGER DEFAULT 0,
                    posts_count INTEGER DEFAULT 0,
                    engagement_rate FLOAT DEFAULT 0.0,
                    avg_likes INTEGER DEFAULT 0,
                    avg_comments INTEGER DEFAULT 0,
                    primary_niche VARCHAR(100) NOT NULL,
                    secondary_niches TEXT,
                    hashtags TEXT,
                    location VARCHAR(255),
                    country VARCHAR(100),
                    state VARCHAR(100),
                    city VARCHAR(100),
                    relevance_score FLOAT DEFAULT 0.0,
                    quality_score FLOAT DEFAULT 0.0,
                    authenticity_score FLOAT DEFAULT 0.0,
                    data_source VARCHAR(50) DEFAULT 'apify',
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    external_url VARCHAR(500),
                    contact_email VARCHAR(255),
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Create indexes for fast searching
            conn.execute(text("CREATE INDEX idx_username ON influencers(username)"))
            conn.execute(text("CREATE INDEX idx_primary_niche ON influencers(primary_niche)"))
            conn.execute(text("CREATE INDEX idx_followers ON influencers(followers)"))
            conn.execute(text("CREATE INDEX idx_engagement_rate ON influencers(engagement_rate)"))
            conn.execute(text("CREATE INDEX idx_relevance_score ON influencers(relevance_score)"))
            conn.execute(text("CREATE INDEX idx_quality_score ON influencers(quality_score)"))
            conn.execute(text("CREATE INDEX idx_is_verified ON influencers(is_verified)"))
            conn.execute(text("CREATE INDEX idx_location ON influencers(location)"))
            conn.execute(text("CREATE INDEX idx_country ON influencers(country)"))
            conn.execute(text("CREATE INDEX idx_state ON influencers(state)"))
            conn.execute(text("CREATE INDEX idx_platform ON influencers(platform)"))
            conn.execute(text("CREATE INDEX idx_is_active ON influencers(is_active)"))
            
            conn.commit()
            
            logger.info("✅ Influencer table created successfully")
            logger.info("✅ Indexes created for fast searching")
            
    except Exception as e:
        logger.error(f"❌ Error creating influencer table: {e}")
        raise


if __name__ == "__main__":
    migrate_create_influencer_table()
