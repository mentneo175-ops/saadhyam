"""
Database Migration: Add RBAC and API Key Management
Phase 2 Security Implementation
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text, MetaData
from config.database import sync_engine, Base
from models.rbac import Permission, Role, user_role, role_permission
from models.api_key import APIKey
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_add_rbac_and_api_keys():
    """Add RBAC and API Key tables to database"""
    
    try:
        print("=" * 80)
        print("PHASE 2 MIGRATION: RBAC & API KEY MANAGEMENT")
        print("=" * 80)
        
        # Create all new tables
        Base.metadata.create_all(sync_engine)
        
        print("✅ Created tables:")
        print("  - permission")
        print("  - role")
        print("  - user_role (junction)")
        print("  - role_permission (junction)")
        print("  - api_key")
        
        # Initialize default roles and permissions
        from services.rbac_service import RBACService
        from config.database import SyncSessionLocal
        
        db = SyncSessionLocal()
        
        try:
            logger.info("Initializing default roles and permissions...")
            RBACService.init_default_roles(db)
            print("✅ Initialized default roles: admin, manager, user")
            print("✅ Initialized default permissions: 8 permissions")
            
        finally:
            db.close()
        
        print("\n" + "=" * 80)
        print("✅ MIGRATION COMPLETE")
        print("=" * 80)
        print("\nNext steps:")
        print("1. Update models/user.py to add roles relationship")
        print("2. Update main.py to add security middleware")
        print("3. Update auth routes to use password validator")
        print("4. Add audit logging to critical endpoints")
        print("5. Test all Phase 2 features")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    migrate_add_rbac_and_api_keys()
