"""
Migration: Add user API keys tables
Adds tables to store user-specific API credentials for social media platforms
"""

import logging
from sqlalchemy import text, inspect
from config.database import sync_engine

logger = logging.getLogger(__name__)

def migrate_add_user_api_keys_tables():
    """
    Add user_api_keys and api_key_templates tables for storing user API credentials
    """
    try:
        logger.info("🔄 Running migration: add_user_api_keys_tables")
        
        inspector = inspect(sync_engine)
        
        with sync_engine.begin() as connection:
            # Create user_api_keys table
            if not inspector.has_table("user_api_keys"):
                connection.execute(text("""
                CREATE TABLE user_api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    platform VARCHAR(50) NOT NULL,
                    api_key TEXT,
                    client_id TEXT,
                    client_secret TEXT,
                    access_token TEXT,
                    refresh_token TEXT,
                    config JSON,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    last_verified_at TIMESTAMP,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(user_id, platform)
                )
                """))
                logger.info("✅ Created user_api_keys table")
                
                # Create index for better performance
                connection.execute(text("""
                CREATE INDEX idx_user_api_keys_user_platform ON user_api_keys(user_id, platform)
                """))
                logger.info("✅ Created index on user_api_keys")
            else:
                logger.info("✅ user_api_keys table already exists")
            
            # Create api_key_templates table
            if not inspector.has_table("api_key_templates"):
                connection.execute(text("""
                CREATE TABLE api_key_templates (
                    id SERIAL PRIMARY KEY,
                    platform VARCHAR(50) NOT NULL UNIQUE,
                    display_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    required_fields JSON,
                    optional_fields JSON,
                    field_descriptions JSON,
                    setup_instructions TEXT,
                    documentation_url VARCHAR(500),
                    test_endpoint VARCHAR(500),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """))
                logger.info("✅ Created api_key_templates table")
                
                # Insert default platform templates
                connection.execute(text("""
                INSERT INTO api_key_templates (
                    platform, display_name, description, required_fields, optional_fields,
                    field_descriptions, setup_instructions, documentation_url, test_endpoint
                ) VALUES 
                (
                    'instagram',
                    'Instagram Graph API',
                    'Connect your Instagram Business account for automated posting and analytics',
                    '["client_id", "client_secret"]',
                    '["access_token"]',
                    '{"client_id": "Your Facebook App ID", "client_secret": "Your Facebook App Secret", "access_token": "Long-lived access token"}',
                    'Go to developers.facebook.com/apps and create a new app with Instagram Graph API product',
                    'https://developers.facebook.com/docs/instagram-api/',
                    'https://graph.facebook.com/me'
                ),
                (
                    'youtube',
                    'YouTube Data API',
                    'Upload videos and manage your YouTube channel content',
                    '["client_id", "client_secret"]',
                    '["api_key"]',
                    '{"client_id": "Google OAuth 2.0 Client ID", "client_secret": "Google OAuth 2.0 Client Secret", "api_key": "YouTube Data API key"}',
                    'Go to console.cloud.google.com and enable YouTube Data API v3',
                    'https://developers.google.com/youtube/v3',
                    'https://www.googleapis.com/youtube/v3/channels'
                ),
                (
                    'linkedin',
                    'LinkedIn API',
                    'Share content and manage your LinkedIn company page',
                    '["client_id", "client_secret"]',
                    '["access_token"]',
                    '{"client_id": "LinkedIn App Client ID", "client_secret": "LinkedIn App Client Secret", "access_token": "OAuth 2.0 access token"}',
                    'Go to linkedin.com/developers/apps and create a new app',
                    'https://docs.microsoft.com/en-us/linkedin/',
                    'https://api.linkedin.com/v2/me'
                ),
                (
                    'twitter',
                    'Twitter API v2',
                    'Post tweets and manage your Twitter account',
                    '["api_key", "client_id", "client_secret"]',
                    '["access_token"]',
                    '{"api_key": "Twitter API Key", "client_id": "Twitter OAuth 2.0 Client ID", "client_secret": "Twitter API Secret Key", "access_token": "OAuth 2.0 Bearer token"}',
                    'Go to developer.twitter.com/en/portal/dashboard and create a new app',
                    'https://developer.twitter.com/en/docs/twitter-api',
                    'https://api.twitter.com/2/users/me'
                ),
                (
                    'facebook',
                    'Facebook Graph API',
                    'Manage Facebook pages and post content',
                    '["client_id", "client_secret"]',
                    '["access_token"]',
                    '{"client_id": "Facebook App ID", "client_secret": "Facebook App Secret", "access_token": "Page access token"}',
                    'Go to developers.facebook.com/apps and create a new app with Facebook Login product',
                    'https://developers.facebook.com/docs/graph-api/',
                    'https://graph.facebook.com/me'
                ),
                (
                    'tiktok',
                    'TikTok for Business API',
                    'Manage TikTok business account and advertising',
                    '["client_id", "client_secret"]',
                    '["access_token"]',
                    '{"client_id": "TikTok App ID", "client_secret": "TikTok App Secret", "access_token": "OAuth access token"}',
                    'Go to developers.tiktok.com and create a new app',
                    'https://developers.tiktok.com/doc/',
                    'https://business-api.tiktok.com/open_api/v1.3/user/info/'
                )
                """))
                logger.info("✅ Inserted default platform templates")
            else:
                logger.info("✅ api_key_templates table already exists")
        
        logger.info("✅ Migration completed: add_user_api_keys_tables")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: add_user_api_keys_tables - {e}")
        raise

if __name__ == "__main__":
    migrate_add_user_api_keys_tables()