"""
Add Plugin System Tables Migration
Creates all plugin-related database tables
"""

import logging
from sqlalchemy import text
from config.database import SyncSessionLocal

logger = logging.getLogger(__name__)

def migrate_add_plugin_tables():
    """Add plugin system tables to database"""
    logger.info("🔄 Running plugin tables migration...")
    
    if SyncSessionLocal is None:
        logger.warning("⚠️ Sync database session not available, skipping plugin tables migration")
        return
    
    try:
        db = SyncSessionLocal()
        
        # Create plugins table
        plugins_table = """
        CREATE TABLE IF NOT EXISTS plugins (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            plugin_key VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            category ENUM('sales_crm', 'marketing', 'finance', 'hr', 'inventory', 'ecommerce', 'documents', 'legal', 'analytics', 'ai_agents', 'website', 'communication', 'education', 'industry_specific', 'ai_productivity') NOT NULL,
            subcategory VARCHAR(100),
            tags JSON,
            version VARCHAR(20) DEFAULT '1.0.0',
            api_endpoints JSON,
            dependencies JSON,
            permissions JSON,
            config_schema JSON,
            default_config JSON,
            status ENUM('active', 'inactive', 'development', 'deprecated') DEFAULT 'development',
            is_premium BOOLEAN DEFAULT FALSE,
            is_ai_powered BOOLEAN DEFAULT FALSE,
            pricing_tier VARCHAR(50),
            developer VARCHAR(100) DEFAULT 'Saadhyam AI',
            documentation_url VARCHAR(500),
            support_url VARCHAR(500),
            changelog JSON,
            install_count INTEGER DEFAULT 0,
            rating INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_plugin_key (plugin_key),
            INDEX idx_category (category),
            INDEX idx_status (status)
        );
        """
        
        # Create user_plugins table
        user_plugins_table = """
        CREATE TABLE IF NOT EXISTS user_plugins (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            user_id INTEGER NOT NULL,
            plugin_id INTEGER NOT NULL,
            is_enabled BOOLEAN DEFAULT TRUE,
            installed_version VARCHAR(20),
            installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP NULL,
            user_config JSON,
            api_keys JSON,
            usage_count INTEGER DEFAULT 0,
            success_rate INTEGER DEFAULT 100,
            last_error TEXT,
            error_count INTEGER DEFAULT 0,
            notifications_enabled BOOLEAN DEFAULT TRUE,
            auto_update BOOLEAN DEFAULT TRUE,
            user_rating INTEGER,
            user_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_plugin (user_id, plugin_id),
            INDEX idx_user_id (user_id),
            INDEX idx_plugin_id (plugin_id),
            INDEX idx_enabled (is_enabled)
        );
        """
        
        # Create plugin_analytics table
        plugin_analytics_table = """
        CREATE TABLE IF NOT EXISTS plugin_analytics (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            plugin_id INTEGER NOT NULL,
            user_id INTEGER NULL,
            event_type VARCHAR(50) NOT NULL,
            event_data JSON,
            execution_time INTEGER,
            memory_usage INTEGER,
            api_calls INTEGER,
            user_satisfaction INTEGER,
            error_message TEXT,
            ip_address VARCHAR(45),
            user_agent VARCHAR(500),
            session_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_plugin_id (plugin_id),
            INDEX idx_user_id (user_id),
            INDEX idx_event_type (event_type),
            INDEX idx_created_at (created_at)
        );
        """
        
        # Create plugin_store table
        plugin_store_table = """
        CREATE TABLE IF NOT EXISTS plugin_store (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            plugin_id INTEGER NOT NULL,
            featured BOOLEAN DEFAULT FALSE,
            banner_image VARCHAR(500),
            screenshots JSON,
            video_demo VARCHAR(500),
            short_description TEXT,
            detailed_description TEXT,
            use_cases JSON,
            benefits JSON,
            customer_testimonials JSON,
            case_studies JSON,
            pricing_model VARCHAR(50),
            price_amount INTEGER,
            price_currency VARCHAR(3) DEFAULT 'USD',
            trial_period INTEGER,
            available_regions JSON,
            minimum_plan VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
            INDEX idx_plugin_id (plugin_id),
            INDEX idx_featured (featured)
        );
        """
        
        # Execute table creation
        db.execute(text(plugins_table))
        db.execute(text(user_plugins_table))
        db.execute(text(plugin_analytics_table))
        db.execute(text(plugin_store_table))
        
        db.commit()
        db.close()
        
        logger.info("✅ Plugin tables migration completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Plugin tables migration failed: {e}")
        if db:
            db.rollback()
            db.close()
        raise

if __name__ == "__main__":
    migrate_add_plugin_tables()