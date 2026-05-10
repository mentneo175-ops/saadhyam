"""
Migration: Add AEO/GEO tables
Creates tables for Answer Engine Optimization and Generative Engine Optimization
"""

import logging
from sqlalchemy import inspect
from config.database import sync_engine, Base

# Import AEO/GEO models
from db.aeo_geo_models import (
    AEOQuestion,
    AEOContent,
    SchemaMarkup,
    AIVisibility,
    ContentDistribution,
    GEOOptimization
)

logger = logging.getLogger(__name__)


def migrate_add_aeo_geo_tables():
    """
    Add AEO/GEO tables to database
    """
    try:
        logger.info("[Migration] Checking AEO/GEO tables...")
        
        inspector = inspect(sync_engine)
        existing_tables = inspector.get_table_names()
        
        tables_to_create = [
            'aeo_questions',
            'aeo_content',
            'schema_markup',
            'ai_visibility',
            'content_distribution',
            'geo_optimization'
        ]
        
        missing_tables = [t for t in tables_to_create if t not in existing_tables]
        
        if missing_tables:
            logger.info(f"[Migration] Creating AEO/GEO tables: {missing_tables}")
            Base.metadata.create_all(bind=sync_engine, checkfirst=True)
            logger.info("[Migration] ✅ AEO/GEO tables created successfully")
        else:
            logger.info("[Migration] ✅ AEO/GEO tables already exist")
        
        return True
        
    except Exception as e:
        logger.error(f"[Migration] ❌ Failed to create AEO/GEO tables: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_aeo_geo_tables()
