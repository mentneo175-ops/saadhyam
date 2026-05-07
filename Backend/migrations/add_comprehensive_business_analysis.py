"""
Migration: Add comprehensive business analysis fields
Stores all Gemini analysis data to avoid rate limit issues
"""

import logging
from sqlalchemy import text, inspect

logger = logging.getLogger(__name__)


def migrate_add_comprehensive_business_analysis():
    """
    Add comprehensive business analysis fields to store:
    - Business details
    - Strengths, weaknesses, opportunities
    - Local market insights
    - Competitor analysis
    - SEO & Google Maps tips
    - 30-day growth plan
    - Daily suggestions
    - Health score
    
    This allows ONE Gemini API call to populate ALL features
    """
    try:
        from config.database import sync_engine
        
        logger.info("🔄 Checking for comprehensive business analysis fields...")
        
        # Get inspector
        inspector = inspect(sync_engine)
        columns = [col['name'] for col in inspector.get_columns('business_analysis')]
        
        # List of new columns to add
        new_columns = {
            'business_name': 'VARCHAR(200)',
            'business_type': 'VARCHAR(100)',
            'location': 'VARCHAR(200)',
            'services': 'TEXT',  # JSON array
            'target_audience': 'TEXT',
            'goals': 'TEXT',
            'website_or_instagram': 'VARCHAR(500)',
            'business_summary': 'TEXT',
            
            # Analysis results (JSON stored as TEXT)
            'strengths_data': 'TEXT',  # JSON array
            'weaknesses_data': 'TEXT',  # JSON array
            'growth_opportunities_data': 'TEXT',  # JSON array
            
            # Local market insights (JSON)
            'local_market_insights': 'TEXT',  # JSON object
            
            # Competitor analysis (JSON)
            'competitor_analysis': 'TEXT',  # JSON object
            
            # SEO & Google Maps tips (JSON)
            'seo_google_maps_tips': 'TEXT',  # JSON object
            
            # 30-day growth plan (JSON)
            'thirty_day_growth_plan': 'TEXT',  # JSON object
            
            # Daily suggestions (JSON)
            'daily_suggestions': 'TEXT',  # JSON array
            
            # Health score
            'health_score': 'INTEGER DEFAULT 0',
            
            # Analysis metadata
            'analysis_source': 'VARCHAR(100)',  # 'google_ai_studio_gemini_search_grounding'
            'last_analyzed_at': 'TIMESTAMP',
            'analysis_status': 'VARCHAR(50) DEFAULT \'pending\'',  # pending, analyzing, completed, error
        }
        
        # Add missing columns
        columns_added = []
        with sync_engine.connect() as conn:
            for column_name, column_type in new_columns.items():
                if column_name not in columns:
                    logger.info(f"📝 Adding column: {column_name}")
                    conn.execute(text(f"ALTER TABLE business_analysis ADD COLUMN {column_name} {column_type}"))
                    columns_added.append(column_name)
            
            if columns_added:
                conn.commit()
                logger.info(f"✅ Added {len(columns_added)} new columns to business_analysis table")
            else:
                logger.info("✅ All comprehensive business analysis fields already exist")
        
    except Exception as e:
        logger.error(f"❌ Error adding comprehensive business analysis fields: {e}")
        logger.warning("⚠️  Continuing without migration - fields might already exist")


if __name__ == "__main__":
    migrate_add_comprehensive_business_analysis()
