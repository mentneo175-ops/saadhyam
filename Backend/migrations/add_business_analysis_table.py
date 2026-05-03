"""
Migration: Add business_analysis table
"""

import logging
from sqlalchemy import inspect, MetaData, Table, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import text
from datetime import datetime

logger = logging.getLogger(__name__)


def migrate_add_business_analysis_table():
    """
    Add business_analysis table if it doesn't exist
    """
    try:
        from config.database import sync_engine
        
        logger.info("🔄 Checking for business_analysis table...")
        
        # Get inspector
        inspector = inspect(sync_engine)
        tables = inspector.get_table_names()
        
        if "business_analysis" in tables:
            logger.info("✅ business_analysis table already exists")
            return
        
        logger.info("📝 Creating business_analysis table...")
        
        # Create table using raw SQL for compatibility
        with sync_engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE business_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    description TEXT NOT NULL,
                    business_score INTEGER NOT NULL,
                    ai_visibility_score INTEGER NOT NULL,
                    conversion_score INTEGER NOT NULL,
                    strengths TEXT,
                    weaknesses TEXT,
                    opportunities TEXT,
                    threats TEXT,
                    recommendations TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))
            conn.commit()
        
        logger.info("✅ business_analysis table created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating business_analysis table: {e}")
        # Don't raise - table might already exist
