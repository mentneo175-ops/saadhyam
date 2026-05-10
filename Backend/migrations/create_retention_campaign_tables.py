"""
Migration: Create retention campaign tables
"""

import logging
from sqlalchemy import text
from config.database import SyncSessionLocal

logger = logging.getLogger(__name__)


def migrate_create_retention_campaign_tables():
    """Create retention campaign and analytics tables"""
    db = SyncSessionLocal()
    
    try:
        logger.info("🔄 Creating retention campaign tables...")
        
        # Check if tables exist
        result = db.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='retention_campaigns'"
        ))
        
        if result.fetchone():
            logger.info("✅ Retention campaign tables already exist")
            return
        
        # Create retention_campaigns table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS retention_campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                inactive_days INTEGER NOT NULL,
                visit_count INTEGER NOT NULL,
                total_spent FLOAT NOT NULL,
                campaign_type VARCHAR(50) NOT NULL,
                offer_type VARCHAR(100) NOT NULL,
                offer_value VARCHAR(50) NOT NULL,
                email_subject VARCHAR(255) NOT NULL,
                email_body TEXT,
                status VARCHAR(20) NOT NULL,
                error_message TEXT,
                email_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_at TIMESTAMP
            )
        """))
        
        # Create indexes
        db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_retention_campaigns_email ON retention_campaigns(customer_email)"
        ))
        db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_retention_campaigns_status ON retention_campaigns(status)"
        ))
        db.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_retention_campaigns_created_at ON retention_campaigns(created_at)"
        ))
        
        # Create campaign_analytics table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS campaign_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_campaigns INTEGER DEFAULT 0,
                total_emails_sent INTEGER DEFAULT 0,
                total_emails_failed INTEGER DEFAULT 0,
                total_customers_reached INTEGER DEFAULT 0,
                success_rate FLOAT DEFAULT 0.0,
                last_campaign_date TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Insert initial analytics row
        db.execute(text("""
            INSERT INTO campaign_analytics (
                total_campaigns, total_emails_sent, total_emails_failed,
                total_customers_reached, success_rate
            ) VALUES (0, 0, 0, 0, 0.0)
        """))
        
        db.commit()
        logger.info("✅ Retention campaign tables created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating retention campaign tables: {e}")
        db.rollback()
        raise
    finally:
        db.close()

