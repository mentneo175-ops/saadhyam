"""
Migration: Add Task Tracking Tables
Creates all tables for Task Tracking and Growth Journey system
"""

import logging
from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_task_tracking_tables():
    """Create Task Tracking tables"""
    try:
        logger.info("🔄 Running Task Tracking tables migration...")
        
        with sync_engine.connect() as conn:
            # Create daily_tasks table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS daily_tasks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) DEFAULT 'medium',
                    points INTEGER DEFAULT 10,
                    estimated_minutes INTEGER DEFAULT 15,
                    is_completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP,
                    assigned_date TIMESTAMP NOT NULL,
                    due_date TIMESTAMP,
                    is_ai_generated BOOLEAN DEFAULT FALSE,
                    ai_reasoning TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON daily_tasks(user_id);
                CREATE INDEX IF NOT EXISTS idx_tasks_assigned_date ON daily_tasks(assigned_date);
                CREATE INDEX IF NOT EXISTS idx_tasks_category ON daily_tasks(category);
                CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON daily_tasks(is_completed);
                CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON daily_tasks(user_id, assigned_date);
                CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON daily_tasks(user_id, is_completed);
                CREATE INDEX IF NOT EXISTS idx_tasks_category_date ON daily_tasks(category, assigned_date);
            """))
            
            # Create growth_metrics table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS growth_metrics (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    metric_date TIMESTAMP NOT NULL,
                    tasks_assigned INTEGER DEFAULT 0,
                    tasks_completed INTEGER DEFAULT 0,
                    completion_rate FLOAT DEFAULT 0.0,
                    points_earned INTEGER DEFAULT 0,
                    total_points INTEGER DEFAULT 0,
                    streak_days INTEGER DEFAULT 0,
                    marketing_tasks INTEGER DEFAULT 0,
                    content_tasks INTEGER DEFAULT 0,
                    engagement_tasks INTEGER DEFAULT 0,
                    analytics_tasks INTEGER DEFAULT 0,
                    growth_tasks INTEGER DEFAULT 0,
                    growth_score FLOAT DEFAULT 0.0,
                    productivity_score FLOAT DEFAULT 0.0,
                    consistency_score FLOAT DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON growth_metrics(user_id);
                CREATE INDEX IF NOT EXISTS idx_metrics_metric_date ON growth_metrics(metric_date);
                CREATE INDEX IF NOT EXISTS idx_metrics_user_metric_date ON growth_metrics(user_id, metric_date);
            """))
            
            # Create task_templates table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS task_templates (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) DEFAULT 'medium',
                    points INTEGER DEFAULT 10,
                    estimated_minutes INTEGER DEFAULT 15,
                    business_type VARCHAR(100),
                    requires_instagram BOOLEAN DEFAULT FALSE,
                    requires_whatsapp BOOLEAN DEFAULT FALSE,
                    requires_website BOOLEAN DEFAULT FALSE,
                    times_assigned INTEGER DEFAULT 0,
                    completion_rate FLOAT DEFAULT 0.0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                
                CREATE INDEX IF NOT EXISTS idx_templates_category ON task_templates(category);
                CREATE INDEX IF NOT EXISTS idx_templates_business_type ON task_templates(business_type);
                CREATE INDEX IF NOT EXISTS idx_templates_is_active ON task_templates(is_active);
            """))
            
            conn.commit()
        
        logger.info("✅ Task Tracking tables migration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Task Tracking tables migration failed: {e}")
        return False


if __name__ == "__main__":
    migrate_add_task_tracking_tables()
