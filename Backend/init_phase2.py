#!/usr/bin/env python
"""
Phase 2 Security Initialization Script
Run this after integration to set up Phase 2 features
"""

import os
import sys
from pathlib import Path

# Add Backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def main():
    print("=" * 80)
    print("PHASE 2 SECURITY INITIALIZATION")
    print("=" * 80)
    
    # 1. Create logs directory
    print("\n1. Creating logs directory...")
    logs_dir = backend_path / "logs"
    logs_dir.mkdir(exist_ok=True)
    print(f"   ✓ Logs directory: {logs_dir}")
    
    # 2. Create audit log file
    print("\n2. Initializing audit log...")
    audit_log = logs_dir / "audit.log"
    if not audit_log.exists():
        audit_log.touch()
        print(f"   ✓ Audit log created: {audit_log}")
    else:
        print(f"   ℹ Audit log already exists: {audit_log}")
    
    # 3. Create security log file
    print("\n3. Initializing security log...")
    security_log = logs_dir / "security.log"
    if not security_log.exists():
        security_log.touch()
        print(f"   ✓ Security log created: {security_log}")
    else:
        print(f"   ℹ Security log already exists: {security_log}")
    
    # 4. Try to initialize database and RBAC
    print("\n4. Initializing database and RBAC...")
    try:
        from config.database import sync_engine, Base, SyncSessionLocal
        from services.rbac_service import RBACService
        
        # Create all tables
        Base.metadata.create_all(bind=sync_engine)
        print("   ✓ Database tables created")
        
        # Initialize RBAC
        db = SyncSessionLocal()
        try:
            RBACService.init_default_roles(db)
            print("   ✓ RBAC roles and permissions initialized")
        finally:
            db.close()
        
    except Exception as e:
        print(f"   ℹ Database initialization (will run during startup): {e}")
    
    # 5. Verify Phase 2 modules
    print("\n5. Verifying Phase 2 modules...")
    modules = [
        "services/audit_logger.py",
        "models/rbac.py",
        "services/rbac_service.py",
        "models/api_key.py",
        "utils/password_validator.py",
        "services/security_monitor.py",
        "middleware/security_middleware.py",
    ]
    
    all_exist = True
    for module in modules:
        module_path = backend_path / module
        if module_path.exists():
            print(f"   ✓ {module}")
        else:
            print(f"   ✗ {module} - MISSING")
            all_exist = False
    
    # 6. Check configuration
    print("\n6. Checking Phase 2 configuration...")
    try:
        from config.settings import settings
        
        checks = [
            ("ENFORCE_HTTPS", settings.ENFORCE_HTTPS),
            ("AUDIT_LOGGING_ENABLED", settings.AUDIT_LOGGING_ENABLED),
            ("RBAC_ENABLED", settings.RBAC_ENABLED),
            ("API_KEY_ENABLED", settings.API_KEY_ENABLED),
            ("SECURITY_MONITORING_ENABLED", settings.SECURITY_MONITORING_ENABLED),
        ]
        
        for setting, value in checks:
            status = "✓" if value else "✗"
            print(f"   {status} {setting}: {value}")
    
    except Exception as e:
        print(f"   ✗ Configuration error: {e}")
    
    print("\n" + "=" * 80)
    print("PHASE 2 INITIALIZATION COMPLETE")
    print("=" * 80)
    
    if all_exist:
        print("\n✅ All Phase 2 components ready!")
        print("\nNext steps:")
        print("  1. Update Backend/models/user.py with roles relationship")
        print("  2. Update Backend/main.py with security middleware")
        print("  3. Update Backend/routes/auth.py with password validation")
        print("  4. Start the backend: python main.py")
    else:
        print("\n⚠️  Some Phase 2 files are missing!")
        print("Please ensure all files are in place before running the backend.")
    
    return 0 if all_exist else 1


if __name__ == "__main__":
    sys.exit(main())
