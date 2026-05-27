"""
Migration: Add AI Audience Insights Table
Creates table for AI-generated Meta Ads campaign targeting recommendations
"""

import sys
import logging
from pathlib import Path

# Ensure the package root (Backend) is on sys.path so `import config` works
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import text
from config.database import get_db_sync

logger = logging.getLogger(__name__)

def migrate_add_ai_audience_insights_table():
    """
    Add ai_audience_insights table for Meta Ads campaign targeting recommendations
    """
    try:
        db = next(get_db_sync())
        
        logger.info("🔄 Running migration: add_ai_audience_insights_table...")
        
        # Create ai_audience_insights table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_audience_insights (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                business_category VARCHAR(255),
                business_location VARCHAR(255),
                post_content TEXT,
                post_caption TEXT,
                post_hashtags JSONB,
                recommended_age_min INTEGER,
                recommended_age_max INTEGER,
                recommended_genders JSONB,
                recommended_locations JSONB,
                recommended_interests JSONB,
                recommended_radius_km INTEGER,
                estimated_reach_min INTEGER,
                estimated_reach_max INTEGER,
                estimated_engagement_rate FLOAT,
                confidence_score FLOAT,
                reasoning TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        """))
        
        # Create index for user_id
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_ai_audience_insights_user_id ON ai_audience_insights(user_id);
        """))
        
        db.commit()
        logger.info("✅ Migration completed: add_ai_audience_insights_table")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: add_ai_audience_insights_table - {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_add_ai_audience_insights_table()
