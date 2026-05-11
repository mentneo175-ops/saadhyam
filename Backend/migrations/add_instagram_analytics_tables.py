"""
Migration: Add Instagram Analytics Tables
Creates all tables for Instagram Business Analytics Dashboard
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_instagram_analytics_tables():
    """Create Instagram Analytics tables"""
    try:
        logger.info("🔄 Running Instagram Analytics tables migration...")
        
        with sync_engine.connect() as conn:
            # Create instagram_business_accounts table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS instagram_business_accounts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    ig_account_id VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    biography TEXT,
                    profile_picture_url TEXT,
                    website VARCHAR(500),
                    facebook_page_id VARCHAR(255),
                    facebook_page_name VARCHAR(255),
                    access_token TEXT NOT NULL,
                    access_token_expires_at TIMESTAMP,
                    refresh_token TEXT,
                    account_type VARCHAR(50) DEFAULT 'BUSINESS',
                    is_verified BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    last_synced_at TIMESTAMP,
                    sync_status VARCHAR(50) DEFAULT 'pending',
                    sync_error TEXT,
                    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    disconnected_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_ig_accounts_user_id ON instagram_business_accounts(user_id);
                CREATE INDEX IF NOT EXISTS idx_ig_accounts_ig_account_id ON instagram_business_accounts(ig_account_id);
                CREATE INDEX IF NOT EXISTS idx_ig_accounts_user_active ON instagram_business_accounts(user_id, is_active);
                CREATE INDEX IF NOT EXISTS idx_ig_accounts_sync_status ON instagram_business_accounts(sync_status, last_synced_at);
            """))
            
            # Create analytics_snapshots table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS analytics_snapshots (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    snapshot_date TIMESTAMP NOT NULL,
                    period VARCHAR(20) DEFAULT 'day',
                    followers_count INTEGER DEFAULT 0,
                    follower_growth INTEGER DEFAULT 0,
                    follower_growth_rate FLOAT DEFAULT 0.0,
                    impressions BIGINT DEFAULT 0,
                    reach BIGINT DEFAULT 0,
                    profile_views INTEGER DEFAULT 0,
                    website_clicks INTEGER DEFAULT 0,
                    email_contacts INTEGER DEFAULT 0,
                    phone_call_clicks INTEGER DEFAULT 0,
                    get_directions_clicks INTEGER DEFAULT 0,
                    total_interactions BIGINT DEFAULT 0,
                    likes BIGINT DEFAULT 0,
                    comments BIGINT DEFAULT 0,
                    shares BIGINT DEFAULT 0,
                    saves BIGINT DEFAULT 0,
                    engagement_rate FLOAT DEFAULT 0.0,
                    avg_engagement_per_post FLOAT DEFAULT 0.0,
                    posts_published INTEGER DEFAULT 0,
                    reels_published INTEGER DEFAULT 0,
                    stories_published INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_snapshots_account_id ON analytics_snapshots(account_id);
                CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_date ON analytics_snapshots(snapshot_date);
                CREATE INDEX IF NOT EXISTS idx_snapshots_account_date ON analytics_snapshots(account_id, snapshot_date);
                CREATE INDEX IF NOT EXISTS idx_snapshots_period_date ON analytics_snapshots(period, snapshot_date);
            """))
            
            # Create instagram_post_analytics table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS instagram_post_analytics (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    media_id VARCHAR(255) UNIQUE NOT NULL,
                    media_type VARCHAR(50) NOT NULL,
                    permalink TEXT,
                    caption TEXT,
                    media_url TEXT,
                    thumbnail_url TEXT,
                    like_count INTEGER DEFAULT 0,
                    comment_count INTEGER DEFAULT 0,
                    share_count INTEGER DEFAULT 0,
                    save_count INTEGER DEFAULT 0,
                    impressions INTEGER DEFAULT 0,
                    reach INTEGER DEFAULT 0,
                    engagement_rate FLOAT DEFAULT 0.0,
                    engagement_score FLOAT DEFAULT 0.0,
                    performance_rank INTEGER,
                    is_viral BOOLEAN DEFAULT FALSE,
                    is_top_performer BOOLEAN DEFAULT FALSE,
                    published_at TIMESTAMP NOT NULL,
                    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_ig_posts_account_id ON instagram_post_analytics(account_id);
                CREATE INDEX IF NOT EXISTS idx_ig_posts_media_id ON instagram_post_analytics(media_id);
                CREATE INDEX IF NOT EXISTS idx_ig_posts_published_at ON instagram_post_analytics(published_at);
                CREATE INDEX IF NOT EXISTS idx_ig_posts_account_published ON instagram_post_analytics(account_id, published_at);
                CREATE INDEX IF NOT EXISTS idx_ig_posts_performance ON instagram_post_analytics(account_id, engagement_score);
                CREATE INDEX IF NOT EXISTS idx_ig_posts_viral ON instagram_post_analytics(is_viral, published_at);
            """))
            
            # Create reel_analytics table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS reel_analytics (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    media_id VARCHAR(255) UNIQUE NOT NULL,
                    permalink TEXT,
                    caption TEXT,
                    video_url TEXT,
                    thumbnail_url TEXT,
                    plays BIGINT DEFAULT 0,
                    watch_time_seconds BIGINT DEFAULT 0,
                    avg_watch_time FLOAT DEFAULT 0.0,
                    completion_rate FLOAT DEFAULT 0.0,
                    like_count INTEGER DEFAULT 0,
                    comment_count INTEGER DEFAULT 0,
                    share_count INTEGER DEFAULT 0,
                    save_count INTEGER DEFAULT 0,
                    impressions BIGINT DEFAULT 0,
                    reach BIGINT DEFAULT 0,
                    engagement_rate FLOAT DEFAULT 0.0,
                    viral_score FLOAT DEFAULT 0.0,
                    is_trending BOOLEAN DEFAULT FALSE,
                    published_at TIMESTAMP NOT NULL,
                    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_reels_account_id ON reel_analytics(account_id);
                CREATE INDEX IF NOT EXISTS idx_reels_media_id ON reel_analytics(media_id);
                CREATE INDEX IF NOT EXISTS idx_reels_published_at ON reel_analytics(published_at);
                CREATE INDEX IF NOT EXISTS idx_reels_account_published ON reel_analytics(account_id, published_at);
                CREATE INDEX IF NOT EXISTS idx_reels_trending ON reel_analytics(is_trending, published_at);
            """))
            
            # Create story_analytics table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS story_analytics (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    media_id VARCHAR(255) UNIQUE NOT NULL,
                    media_type VARCHAR(50) NOT NULL,
                    media_url TEXT,
                    impressions INTEGER DEFAULT 0,
                    reach INTEGER DEFAULT 0,
                    exits INTEGER DEFAULT 0,
                    taps_forward INTEGER DEFAULT 0,
                    taps_back INTEGER DEFAULT 0,
                    replies INTEGER DEFAULT 0,
                    completion_rate FLOAT DEFAULT 0.0,
                    interaction_rate FLOAT DEFAULT 0.0,
                    published_at TIMESTAMP NOT NULL,
                    expires_at TIMESTAMP,
                    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_stories_account_id ON story_analytics(account_id);
                CREATE INDEX IF NOT EXISTS idx_stories_media_id ON story_analytics(media_id);
                CREATE INDEX IF NOT EXISTS idx_stories_published_at ON story_analytics(published_at);
                CREATE INDEX IF NOT EXISTS idx_stories_account_published ON story_analytics(account_id, published_at);
            """))
            
            # Create audience_insights table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS audience_insights (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    snapshot_date TIMESTAMP NOT NULL,
                    age_gender_breakdown JSONB,
                    top_cities JSONB,
                    top_countries JSONB,
                    online_followers INTEGER DEFAULT 0,
                    follower_activity_hours JSONB,
                    follower_activity_days JSONB,
                    avg_engagement_time VARCHAR(50),
                    peak_activity_day VARCHAR(20),
                    peak_activity_hour INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_audience_account_id ON audience_insights(account_id);
                CREATE INDEX IF NOT EXISTS idx_audience_snapshot_date ON audience_insights(snapshot_date);
                CREATE INDEX IF NOT EXISTS idx_audience_account_snapshot ON audience_insights(account_id, snapshot_date);
            """))
            
            # Create ai_recommendations table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ai_recommendations (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    recommendation TEXT NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) DEFAULT 'medium',
                    confidence_score FLOAT DEFAULT 0.0,
                    data_points JSONB,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_implemented BOOLEAN DEFAULT FALSE,
                    implemented_at TIMESTAMP,
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    expires_at TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_recommendations_account_id ON ai_recommendations(account_id);
                CREATE INDEX IF NOT EXISTS idx_recommendations_category ON ai_recommendations(category);
                CREATE INDEX IF NOT EXISTS idx_recommendations_generated_at ON ai_recommendations(generated_at);
                CREATE INDEX IF NOT EXISTS idx_recommendations_account_category ON ai_recommendations(account_id, category);
                CREATE INDEX IF NOT EXISTS idx_recommendations_active_priority ON ai_recommendations(is_active, priority);
            """))
            
            # Create growth_predictions table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS growth_predictions (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    prediction_date TIMESTAMP NOT NULL,
                    prediction_period VARCHAR(20) NOT NULL,
                    predicted_followers INTEGER DEFAULT 0,
                    predicted_follower_growth INTEGER DEFAULT 0,
                    predicted_growth_rate FLOAT DEFAULT 0.0,
                    predicted_engagement_rate FLOAT DEFAULT 0.0,
                    predicted_reach BIGINT DEFAULT 0,
                    predicted_impressions BIGINT DEFAULT 0,
                    predicted_avg_likes INTEGER DEFAULT 0,
                    predicted_avg_comments INTEGER DEFAULT 0,
                    confidence_score FLOAT DEFAULT 0.0,
                    model_accuracy FLOAT DEFAULT 0.0,
                    factors JSONB,
                    actual_followers INTEGER,
                    actual_growth INTEGER,
                    prediction_accuracy FLOAT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_predictions_account_id ON growth_predictions(account_id);
                CREATE INDEX IF NOT EXISTS idx_predictions_prediction_date ON growth_predictions(prediction_date);
                CREATE INDEX IF NOT EXISTS idx_predictions_account_prediction ON growth_predictions(account_id, prediction_date);
            """))
            
            # Create sync_history table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS sync_history (
                    id SERIAL PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    sync_type VARCHAR(50) NOT NULL,
                    sync_status VARCHAR(50) NOT NULL,
                    items_synced INTEGER DEFAULT 0,
                    items_failed INTEGER DEFAULT 0,
                    duration_seconds FLOAT DEFAULT 0.0,
                    error_message TEXT,
                    error_details JSONB,
                    started_at TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_sync_account_id ON sync_history(account_id);
                CREATE INDEX IF NOT EXISTS idx_sync_sync_status ON sync_history(sync_status);
                CREATE INDEX IF NOT EXISTS idx_sync_started_at ON sync_history(started_at);
                CREATE INDEX IF NOT EXISTS idx_sync_account_status ON sync_history(account_id, sync_status);
            """))
            
            # Create notification_logs table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notification_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    account_id INTEGER REFERENCES instagram_business_accounts(id) ON DELETE CASCADE,
                    notification_type VARCHAR(100) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    priority VARCHAR(20) DEFAULT 'medium',
                    is_read BOOLEAN DEFAULT FALSE,
                    is_actionable BOOLEAN DEFAULT FALSE,
                    action_url VARCHAR(500),
                    action_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    read_at TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notification_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notification_logs(account_id);
                CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON notification_logs(notification_type);
                CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notification_logs(is_read);
                CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notification_logs(created_at);
                CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notification_logs(user_id, is_read);
                CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON notification_logs(notification_type, created_at);
            """))
            
            conn.commit()
        
        logger.info("✅ Instagram Analytics tables migration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Instagram Analytics tables migration failed: {e}")
        return False


if __name__ == "__main__":
    migrate_add_instagram_analytics_tables()
