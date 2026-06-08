"""
Migration: Add Meta Ads tables
Creates all tables for Meta Ads automation system
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_meta_ads_tables():
    """Add Meta Ads tables to database"""
    try:
        logger.info("🔄 Running migration: add_meta_ads_tables")
        
        from sqlalchemy import inspect
        inspector = inspect(sync_engine)
        if inspector.has_table("meta_accounts"):
            logger.info("✅ Meta Ads tables already exist, skipping migration")
            return
            
        with sync_engine.begin() as conn:
            # Create meta_accounts table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS meta_accounts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    ad_account_id VARCHAR(255) NOT NULL,
                    ad_account_name VARCHAR(255),
                    page_id VARCHAR(255),
                    page_name VARCHAR(255),
                    page_access_token TEXT,
                    instagram_business_id VARCHAR(255),
                    instagram_username VARCHAR(255),
                    access_token TEXT NOT NULL,
                    refresh_token TEXT,
                    token_expires_at TIMESTAMP,
                    business_id VARCHAR(255),
                    business_name VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE NOT NULL,
                    connection_error TEXT,
                    last_synced_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_meta_accounts_user_id ON meta_accounts(user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_meta_accounts_ad_account_id ON meta_accounts(ad_account_id);
            """))
            
            # Create ad_campaigns table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ad_campaigns (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    meta_account_id INTEGER NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
                    campaign_id VARCHAR(255),
                    campaign_name VARCHAR(255) NOT NULL,
                    objective VARCHAR(100) NOT NULL,
                    status VARCHAR(50) DEFAULT 'PAUSED' NOT NULL,
                    daily_budget FLOAT,
                    lifetime_budget FLOAT,
                    instagram_post_id INTEGER REFERENCES scheduled_posts(id) ON DELETE SET NULL,
                    ai_audience_suggestion JSONB,
                    ai_budget_recommendation JSONB,
                    ai_performance_prediction JSONB,
                    special_ad_categories JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user_id ON ad_campaigns(user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_campaigns_meta_account_id ON ad_campaigns(meta_account_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_campaigns_campaign_id ON ad_campaigns(campaign_id);
            """))
            
            # Create ad_sets table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ad_sets (
                    id SERIAL PRIMARY KEY,
                    campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
                    adset_id VARCHAR(255),
                    adset_name VARCHAR(255) NOT NULL,
                    status VARCHAR(50) DEFAULT 'PAUSED' NOT NULL,
                    daily_budget FLOAT,
                    lifetime_budget FLOAT,
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    targeting JSONB NOT NULL,
                    optimization_goal VARCHAR(100),
                    billing_event VARCHAR(100),
                    bid_amount FLOAT,
                    bid_strategy VARCHAR(100),
                    placements JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign_id ON ad_sets(campaign_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_sets_adset_id ON ad_sets(adset_id);
            """))
            
            # Create ad_creatives table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ad_creatives (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    creative_id VARCHAR(255),
                    creative_name VARCHAR(255) NOT NULL,
                    image_url TEXT,
                    image_hash VARCHAR(255),
                    video_url TEXT,
                    video_id VARCHAR(255),
                    caption TEXT,
                    link_url TEXT,
                    call_to_action VARCHAR(100),
                    whatsapp_number VARCHAR(50),
                    whatsapp_message TEXT,
                    ai_generated BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_creatives_user_id ON ad_creatives(user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_creatives_creative_id ON ad_creatives(creative_id);
            """))
            
            # Create ads table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ads (
                    id SERIAL PRIMARY KEY,
                    adset_id INTEGER NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
                    creative_id INTEGER NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
                    ad_id VARCHAR(255),
                    ad_name VARCHAR(255) NOT NULL,
                    status VARCHAR(50) DEFAULT 'PAUSED' NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ads_adset_id ON ads(adset_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ads_creative_id ON ads(creative_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ads_ad_id ON ads(ad_id);
            """))
            
            # Create ad_analytics table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ad_analytics (
                    id SERIAL PRIMARY KEY,
                    campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
                    date TIMESTAMP NOT NULL,
                    impressions INTEGER DEFAULT 0 NOT NULL,
                    clicks INTEGER DEFAULT 0 NOT NULL,
                    reach INTEGER DEFAULT 0 NOT NULL,
                    likes INTEGER DEFAULT 0 NOT NULL,
                    comments INTEGER DEFAULT 0 NOT NULL,
                    shares INTEGER DEFAULT 0 NOT NULL,
                    saves INTEGER DEFAULT 0 NOT NULL,
                    spend FLOAT DEFAULT 0.0 NOT NULL,
                    cpc FLOAT DEFAULT 0.0 NOT NULL,
                    cpm FLOAT DEFAULT 0.0 NOT NULL,
                    ctr FLOAT DEFAULT 0.0 NOT NULL,
                    conversions INTEGER DEFAULT 0 NOT NULL,
                    conversion_value FLOAT DEFAULT 0.0 NOT NULL,
                    roas FLOAT DEFAULT 0.0 NOT NULL,
                    raw_insights JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_analytics_campaign_id ON ad_analytics(campaign_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ad_analytics_date ON ad_analytics(date);
            """))
            
            # Create ai_audience_insights table
            conn.execute(text("""
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
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ai_audience_insights_user_id ON ai_audience_insights(user_id);
            """))
            
            # Create budget_recommendations table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS budget_recommendations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    objective VARCHAR(100),
                    target_audience_size INTEGER,
                    recommended_daily_budget FLOAT NOT NULL,
                    recommended_duration_days INTEGER NOT NULL,
                    recommended_total_budget FLOAT NOT NULL,
                    estimated_impressions_min INTEGER,
                    estimated_impressions_max INTEGER,
                    estimated_clicks_min INTEGER,
                    estimated_clicks_max INTEGER,
                    estimated_reach_min INTEGER,
                    estimated_reach_max INTEGER,
                    estimated_cpc FLOAT,
                    estimated_cpm FLOAT,
                    reasoning TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_budget_recommendations_user_id ON budget_recommendations(user_id);
            """))
            
            # Create campaign_logs table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS campaign_logs (
                    id SERIAL PRIMARY KEY,
                    campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
                    action VARCHAR(100) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    message TEXT,
                    error_details JSONB,
                    meta_response JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON campaign_logs(campaign_id);
            """))
            
            # Create ai_ad_recommendations table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ai_ad_recommendations (
                    id SERIAL PRIMARY KEY,
                    campaign_id INTEGER NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
                    recommendation_type VARCHAR(100) NOT NULL,
                    priority VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    expected_impact TEXT,
                    suggested_actions JSONB,
                    is_applied BOOLEAN DEFAULT FALSE NOT NULL,
                    applied_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ai_ad_recommendations_campaign_id ON ai_ad_recommendations(campaign_id);
            """))
            
        logger.info("✅ Migration completed: add_meta_ads_tables")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: add_meta_ads_tables - {e}")
        raise


if __name__ == "__main__":
    migrate_add_meta_ads_tables()
