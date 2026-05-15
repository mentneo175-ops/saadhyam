"""
Migration: Add Voice Agent Tables
Creates tables for AI voice calling campaigns, contacts, calls, leads, and follow-ups
"""

import logging
from sqlalchemy import inspect
from config.database import sync_engine, Base

logger = logging.getLogger(__name__)


def migrate_add_voice_agent_tables():
    """
    Add voice agent tables to database
    """
    try:
        logger.info("=" * 80)
        logger.info("🎙️  MIGRATION: Adding Voice Agent Tables")
        logger.info("=" * 80)
        
        # Import models to register them
        from models.voice_agent import (
            VoiceCampaign,
            VoiceContact,
            VoiceCall,
            VoiceLead,
            VoiceFollowUp
        )
        
        inspector = inspect(sync_engine)
        existing_tables = inspector.get_table_names()
        
        tables_to_create = [
            "voice_campaigns",
            "voice_contacts",
            "voice_calls",
            "voice_leads",
            "voice_followups"
        ]
        
        tables_needed = [t for t in tables_to_create if t not in existing_tables]
        
        if not tables_needed:
            logger.info("✅ All voice agent tables already exist")
            logger.info("=" * 80)
            return
        
        logger.info(f"📋 Tables to create: {', '.join(tables_needed)}")
        
        # Create tables
        Base.metadata.create_all(bind=sync_engine, checkfirst=True)
        
        # Verify creation
        inspector = inspect(sync_engine)
        existing_tables_after = inspector.get_table_names()
        
        created_tables = [t for t in tables_needed if t in existing_tables_after]
        
        if created_tables:
            logger.info(f"✅ Successfully created tables: {', '.join(created_tables)}")
        
        logger.info("=" * 80)
        logger.info("✅ Voice Agent Tables Migration Complete")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_voice_agent_tables()
