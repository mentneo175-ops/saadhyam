# This is the EXACT code to add to Backend/main.py
# Follow the sections below in order

# ============================================
# ADD THESE IMPORTS AT THE TOP
# ============================================

# Phase 2 Security Imports
from middleware.security_middleware import (
    HTTPSRedirectMiddleware,
    SecurityHeadersMiddleware,
    RBACMiddleware,
    APIKeyAuthMiddleware,
)
from services.audit_logger import audit_logger
from services.security_monitor import security_monitor
from services.rbac_service import RBACService
from config.database import SyncSessionLocal


# ============================================
# ADD MIDDLEWARE AFTER CORS MIDDLEWARE
# ============================================

# Phase 2: Add security middleware in this order (important!)
app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(APIKeyAuthMiddleware)
app.add_middleware(RBACMiddleware)

# Note: CORS middleware should already exist, keep it as is


# ============================================
# UPDATE STARTUP EVENT
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialize security features on startup"""
    try:
        # Initialize database
        init_db()
        logger.info("✅ Database initialized")
        
        # Phase 2: Initialize RBAC roles and permissions
        db = SyncSessionLocal()
        try:
            RBACService.init_default_roles(db)
            logger.info("✅ RBAC roles and permissions initialized")
        finally:
            db.close()
        
        logger.info("✅ All startup tasks completed")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise


# ============================================
# ADD SHUTDOWN EVENT
# ============================================

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        close_db()
        logger.info("✅ Database closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# ============================================
# ADD HEALTH CHECK ENDPOINT
# ============================================

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring - shows all Phase 2 security status"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "security_features": {
            "https_enforced": settings.ENFORCE_HTTPS,
            "audit_logging": settings.AUDIT_LOGGING_ENABLED,
            "rbac_enabled": settings.RBAC_ENABLED,
            "api_keys_enabled": settings.API_KEY_ENABLED,
            "monitoring_enabled": settings.SECURITY_MONITORING_ENABLED,
        },
        "alerts_summary": security_monitor.get_metrics_summary(),
    }


# ============================================
# ADD SECURITY ALERTS ENDPOINT (ADMIN ONLY)
# ============================================

@app.get("/api/security/alerts", tags=["Security"])
async def get_security_alerts(
    current_user = Depends(get_current_user),
    severity: Optional[str] = None,
):
    """
    Get recent security alerts (admin only)
    
    Query params:
    - severity: CRITICAL, WARNING, or INFO
    """
    db = SyncSessionLocal()
    try:
        # Check if user is admin
        is_admin = RBACService.check_permission(
            db, current_user.id, "manage_settings"
        )
        
        if not is_admin:
            audit_logger.log_unauthorized_access(
                user_id=current_user.id,
                user_email=current_user.email,
                resource="/api/security/alerts",
                reason="Insufficient permissions (requires admin)",
            )
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Admin access required."
            )
        
        # Log access
        audit_logger.log_event(
            event_type="data_access",
            action="accessed_security_alerts",
            user_id=current_user.id,
            user_email=current_user.email,
        )
        
        # Get alerts
        from services.security_monitor import AlertSeverity
        
        filter_severity = None
        if severity:
            filter_severity = AlertSeverity(severity)
        
        alerts = security_monitor.get_alerts(severity=filter_severity)
        
        return {
            "total": len(alerts),
            "alerts": alerts,
            "summary": security_monitor.get_metrics_summary(),
        }
        
    finally:
        db.close()


# ============================================
# ADD AUDIT LOGS EXPORT ENDPOINT (ADMIN ONLY)
# ============================================

@app.get("/api/audit/logs", tags=["Security"])
async def get_audit_logs(
    current_user = Depends(get_current_user),
    event_type: Optional[str] = None,
    user_email: Optional[str] = None,
    limit: int = 100,
):
    """
    Get audit logs (admin only)
    
    Query params:
    - event_type: Filter by event type (LOGIN, LOGOUT, FAILED_LOGIN, etc)
    - user_email: Filter by user email
    - limit: Maximum number of logs to return (default: 100)
    """
    db = SyncSessionLocal()
    try:
        # Check admin permission
        is_admin = RBACService.check_permission(
            db, current_user.id, "view_audit_logs"
        )
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        
        # Read audit logs from file
        import json
        import os
        
        audit_logs = []
        log_file = settings.AUDIT_LOG_PATH
        
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line)
                        
                        # Apply filters
                        if event_type and log_entry.get('event_type') != event_type:
                            continue
                        if user_email and log_entry.get('user_email') != user_email:
                            continue
                        
                        audit_logs.append(log_entry)
                    except json.JSONDecodeError:
                        continue
        
        # Return last N entries
        audit_logs = audit_logs[-limit:]
        
        return {
            "total": len(audit_logs),
            "logs": audit_logs,
        }
        
    finally:
        db.close()


# ============================================
# ALL INTEGRATION STEPS:
# ============================================

"""
STEP-BY-STEP INTEGRATION CHECKLIST:

1. ✅ Add all imports from "ADD THESE IMPORTS" section
2. ✅ Add middleware from "ADD MIDDLEWARE" section
3. ✅ Update @app.on_event("startup") with RBAC initialization
4. ✅ Add @app.on_event("shutdown") if not exists
5. ✅ Add /health endpoint
6. ✅ Add /api/security/alerts endpoint
7. ✅ Add /api/audit/logs endpoint

8. Update Backend/models/user.py:
   Add to User class:
   from models.rbac import user_role, Role
   roles = relationship("Role", secondary=user_role, back_populates="users")

9. Update Backend/routes/auth.py:
   - Import PasswordValidator
   - Add validation to register endpoint
   - Add validation to password change endpoint
   - Add audit logging to login endpoint

10. Create logs directory:
    mkdir -p logs

11. Run database migration:
    cd Backend && python migrations/add_rbac_and_api_keys.py

12. Update .env with Phase 2 settings (see PHASE_2_QUICK_REFERENCE.md)

13. Test all features (see PHASE_2_QUICK_REFERENCE.md)
"""


# ============================================
# QUICK VERIFICATION
# ============================================

"""
After integration, verify with:

1. curl http://localhost:8000/health
   Should show all security features

2. Check audit logs:
   tail -f logs/audit.log

3. Test with Postman:
   - POST /auth/register with weak password (should fail)
   - GET /api/security/alerts (should return alerts)
   - GET /api/audit/logs (should return audit logs)

4. Check that middleware is working:
   - HTTP requests redirect to HTTPS
   - Security headers are added to responses
   - Unauthorized access is logged

All should be working once integration is complete!
"""
