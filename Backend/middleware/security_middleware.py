"""
Security Middleware for HTTPS, RBAC, and Security Headers
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
from typing import Optional
from config.settings import settings

logger = logging.getLogger(__name__)


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP to HTTPS in production"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        if settings.ENVIRONMENT == "production":
            # Check if request is HTTP (not HTTPS)
            if request.url.scheme == "http":
                # Redirect to HTTPS
                secure_url = request.url.replace(scheme="https")
                from fastapi.responses import RedirectResponse
                return RedirectResponse(url=str(secure_url), status_code=301)
        
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=()"
        )
        
        # Remove server header
        response.headers.pop("Server", None)
        
        return response


class RBACMiddleware(BaseHTTPMiddleware):
    """Middleware for Role-Based Access Control"""
    
    # Routes that require specific roles
    PROTECTED_ROUTES = {
        "/admin": ["admin"],
        "/api/users": ["admin", "manager"],
        "/api/audit": ["admin", "manager"],
        "/api/settings": ["admin"],
    }
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check if route requires specific roles
        for route_pattern, required_roles in self.PROTECTED_ROUTES.items():
            if request.url.path.startswith(route_pattern):
                # Extract user from request (set by authentication middleware)
                user = getattr(request.state, "user", None)
                
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Not authenticated",
                    )
                
                # Check if user has required role
                user_roles = [role.name for role in getattr(user, "roles", [])]
                
                if not any(role in user_roles for role in required_roles):
                    from services.audit_logger import audit_logger
                    audit_logger.log_unauthorized_access(
                        user_id=user.id,
                        user_email=user.email,
                        resource=request.url.path,
                        ip_address=request.client.host if request.client else "unknown",
                        reason=f"Insufficient permissions. Required: {required_roles}, Has: {user_roles}",
                    )
                    
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Insufficient permissions. Required roles: {', '.join(required_roles)}",
                    )
        
        return await call_next(request)


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for API key authentication"""
    
    # Routes that accept API key auth
    API_KEY_ROUTES = {
        "/api/v1/": "API access with key",
        "/webhooks/": "Webhook handlers",
    }
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check if route uses API key auth
        for route_pattern in self.API_KEY_ROUTES.keys():
            if request.url.path.startswith(route_pattern):
                # Check for API key in header
                api_key = request.headers.get("X-API-Key")
                
                if api_key:
                    # Validate API key
                    from config.database import SyncSessionLocal
                    from models.api_key import APIKeyManager
                    
                    db = SyncSessionLocal()
                    try:
                        valid_key = APIKeyManager.validate_api_key(db, api_key)
                        
                        if not valid_key:
                            from services.audit_logger import audit_logger
                            audit_logger.log_event(
                                event_type="unauthorized_access",
                                action="Invalid API key",
                                resource="api",
                                ip_address=request.client.host if request.client else "unknown",
                                status="failure",
                            )
                            
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Invalid or expired API key",
                            )
                        
                        # Attach user to request
                        request.state.user = valid_key.user_id
                        request.state.api_key_id = valid_key.id
                        
                    finally:
                        db.close()
        
        return await call_next(request)
