"""
Phase 2 Integration Guide for main.py
Shows how to integrate all Phase 2 security features
"""

MAIN_PY_INTEGRATION_CODE = '''
"""
PHASE 2 SECURITY INTEGRATION - Add this to main.py
"""

# ============================================
# PHASE 2 SECURITY IMPORTS
# ============================================

from middleware.security_middleware import (
    HTTPSRedirectMiddleware,
    SecurityHeadersMiddleware,
    RBACMiddleware,
    APIKeyAuthMiddleware,
)
from services.audit_logger import audit_logger
from services.security_monitor import security_monitor
from services.rbac_service import RBACService


# ============================================
# ADD MIDDLEWARE (in order of priority)
# ============================================

# Add HTTPS redirect first (highest priority)
app.add_middleware(HTTPSRedirectMiddleware)

# Add security headers
app.add_middleware(SecurityHeadersMiddleware)

# Add API key authentication
app.add_middleware(APIKeyAuthMiddleware)

# Add RBAC (role-based access control)
app.add_middleware(RBACMiddleware)

# Existing middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)


# ============================================
# STARTUP EVENT - Initialize RBAC
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialize security features on startup"""
    try:
        # Initialize database
        init_db()
        logger.info("✅ Database initialized")
        
        # Initialize RBAC roles and permissions
        db = SyncSessionLocal()
        try:
            RBACService.init_default_roles(db)
            logger.info("✅ RBAC roles initialized")
        finally:
            db.close()
        
        logger.info("✅ All startup tasks completed")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")


# ============================================
# SHUTDOWN EVENT
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
# HEALTH CHECK ENDPOINT
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
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
        "alerts": security_monitor.get_metrics_summary(),
    }


# ============================================
# SECURITY MONITORING ENDPOINT (Admin only)
# ============================================

@app.get("/api/security/alerts")
async def get_security_alerts(
    current_user = Depends(get_current_user),
    severity: Optional[str] = None,
):
    """Get recent security alerts (admin only)"""
    # Check if user is admin
    from services.rbac_service import RBACService
    from config.database import SyncSessionLocal
    
    db = SyncSessionLocal()
    try:
        is_admin = RBACService.check_permission(
            db, current_user.id, "manage_settings"
        )
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
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
# INTEGRATION CHECKLIST
# ============================================

"""
After adding the above code to main.py, complete these steps:

1. Update models/user.py:
   - Add: from models.rbac import user_role, Role
   - Add to User class:
     roles = relationship("Role", secondary=user_role, back_populates="users")

2. Update routes/auth.py:
   - Import PasswordValidator
   - Add password strength validation to register and password change endpoints:
     
     is_valid, error_msg, strength = PasswordValidator.validate(password)
     if not is_valid:
         raise HTTPException(status_code=400, detail=error_msg)

3. Update routes/auth.py login endpoint:
   - Add audit logging:
     from services.audit_logger import audit_logger
     
     audit_logger.log_login(
         user_id=user.id,
         user_email=user.email,
         ip_address=request.client.host,
         success=True
     )

4. Create logs directory:
   mkdir -p logs

5. Run database migration:
   python Backend/migrations/add_rbac_and_api_keys.py

6. Create API Key endpoints in a new routes/api_keys.py:
   - POST /api/keys - Create new API key
   - GET /api/keys - List user's API keys
   - POST /api/keys/{id}/rotate - Rotate API key
   - DELETE /api/keys/{id} - Revoke API key

7. Update .env file with Phase 2 settings:
   ENVIRONMENT=production
   ENFORCE_HTTPS=true
   AUDIT_LOGGING_ENABLED=true
   RBAC_ENABLED=true
   SECURITY_MONITORING_ENABLED=true

8. Test the integration:
   - Test HTTPS redirect: curl -i http://localhost:8000/health
   - Test password validation: POST /auth/register with weak password
   - Test RBAC: Try accessing /admin endpoints as non-admin user
   - Check audit logs: tail -f logs/audit.log
   - View alerts: GET /api/security/alerts (admin only)
"""
'''

print(MAIN_PY_INTEGRATION_CODE)

# Save to file
with open("PHASE_2_MAIN_PY_INTEGRATION.md", "w") as f:
    f.write("""
# Phase 2 Integration Guide for main.py

This file shows exactly what code to add to `main.py` to integrate all Phase 2 security features.

""")
    f.write(MAIN_PY_INTEGRATION_CODE)

print("\n✅ Integration guide created: PHASE_2_MAIN_PY_INTEGRATION.md")
