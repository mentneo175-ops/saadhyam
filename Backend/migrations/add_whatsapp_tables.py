"""
Migration: Add WhatsApp tables
Creates all WhatsApp-related tables for the WhatsApp Sales & Automation module
"""

import logging
from sqlalchemy import text
from config.database import sync_engine, IS_SQLITE

logger = logging.getLogger(__name__)


def migrate_add_whatsapp_tables():
    """Add WhatsApp tables to database"""
    try:
        logger.info("🔄 Running migration: add_whatsapp_tables")
        
        with sync_engine.connect() as conn:
            # Check if tables already exist
            if IS_SQLITE:
                result = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='whatsapp_accounts'"
                ))
            else:
                result = conn.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_name='whatsapp_accounts'"
                ))
            
            if result.fetchone():
                logger.info("✅ WhatsApp tables already exist, skipping migration")
                return
            
            logger.info("📝 Creating WhatsApp tables...")
            
            # Import models to create tables
            from models.whatsapp_account import WhatsAppAccount
            from models.whatsapp_message import WhatsAppMessage
            from models.whatsapp_campaign import WhatsAppCampaign
            from models.whatsapp_automation import WhatsAppAutomation
            from config.database import Base
            
            # Create all WhatsApp tables
            Base.metadata.create_all(bind=sync_engine, checkfirst=True)
            
            conn.commit()
            
            logger.info("✅ WhatsApp tables created successfully")
            logger.info("   - whatsapp_accounts")
            logger.info("   - whatsapp_messages")
            logger.info("   - whatsapp_campaigns")
            logger.info("   - whatsapp_automations")
            
    except Exception as e:
        logger.error(f"❌ Failed to create WhatsApp tables: {e}")
        raise


if __name__ == "__main__":
    migrate_add_whatsapp_tables()
