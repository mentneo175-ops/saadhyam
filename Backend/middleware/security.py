"""
Security Middleware
Implements rate limiting, request size limits, and security headers
"""

import logging
import os
from typing import Callable
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
MAX_REQUEST_SIZE_MB = int(os.getenv("MAX_REQUEST_SIZE_MB", "10"))
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors
    Provides user-friendly error messages similar to ChatGPT
    
    Args:
        request: The incoming request
        exc: The RateLimitExceeded exception
        
    Returns:
        JSONResponse with detailed rate limit information
    """
    # Extract rate limit info from exception
    retry_after = getattr(exc, 'retry_after', 60)  # Default to 60 seconds
    
    # Calculate when user can retry
    retry_time = datetime.now() + timedelta(seconds=retry_after)
    retry_time_str = retry_time.strftime("%I:%M %p")
    
    # Determine time unit for user-friendly message
    if retry_after < 60:
        wait_time = f"{int(retry_after)} seconds"
    elif retry_after < 3600:
        wait_time = f"{int(retry_after / 60)} minutes"
    else:
        wait_time = f"{int(retry_after / 3600)} hours"
    
    logger.warning(
        f"⚠️ Rate limit exceeded for {request.client.host} on {request.url.path}. "
        f"Retry after {wait_time}"
    )
    
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "too_many_requests",
            "message": "Too many requests",
            "detail": f"You're making requests too quickly. We've temporarily limited access to protect our systems.",
            "retry_after_seconds": int(retry_after),
            "retry_after_time": retry_time_str,
            "wait_time": wait_time,
            "suggestion": f"Please wait {wait_time} before trying again.",
            "timestamp": datetime.now().isoformat()
        },
        headers={
            "Retry-After": str(int(retry_after)),
            "X-RateLimit-Limit": str(getattr(exc, 'limit', 'N/A')),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(int(retry_time.timestamp()))
        }
    )


def setup_rate_limiting(app: FastAPI) -> Limiter:
    """
    Setup global rate limiting for the application
    
    Args:
        app: FastAPI application instance
        
    Returns:
        Limiter instance for use in route decorators
    """
    if not RATE_LIMIT_ENABLED:
        logger.warning("⚠️ Rate limiting is DISABLED")
        return None
    
    # Create limiter instance
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200/minute"],  # Global default
        storage_uri=os.getenv("REDIS_URL", "memory://"),
        strategy="fixed-window"
    )
    
    # Attach to app state
    app.state.limiter = limiter
    
    # Add custom exception handler
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)
    
    logger.info("✅ Rate limiting enabled with custom error handler")
    return limiter


async def add_security_headers(request: Request, call_next: Callable):
    """
    Add security headers to all responses
    
    Headers added:
    - X-Content-Type-Options: Prevent MIME sniffing
    - X-Frame-Options: Prevent clickjacking
    - X-XSS-Protection: Enable XSS filter
    - Strict-Transport-Security: Enforce HTTPS
    - Content-Security-Policy: Restrict resource loading
    - Referrer-Policy: Control referrer information
    """
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # HSTS only in production
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # CSP - Allow self and specific domains
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' https://accounts.google.com https://www.googleapis.com; "
        "frame-src 'self' https://accounts.google.com;"
    )
    response.headers["Content-Security-Policy"] = csp_policy
    
    return response


async def limit_request_size(request: Request, call_next: Callable):
    """
    Limit request body size to prevent memory exhaustion attacks
    
    Args:
        request: Incoming request
        call_next: Next middleware in chain
        
    Raises:
        HTTPException: If request body exceeds limit
    """
    # Get content length from headers
    content_length = request.headers.get("content-length")
    
    if content_length:
        content_length = int(content_length)
        max_size = MAX_REQUEST_SIZE_MB * 1024 * 1024  # Convert MB to bytes
        
        if content_length > max_size:
            received_mb = round(content_length / (1024 * 1024), 2)
            logger.warning(
                f"⚠️ Request body too large: {content_length} bytes "
                f"(max: {max_size} bytes) from {request.client.host}"
            )
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    # Friendly, actionable message for end users including received size
                    "message": (
                        f"Upload failed — the file you selected is {received_mb} MB which exceeds the maximum allowed size of {MAX_REQUEST_SIZE_MB} MB. Please choose a file smaller than {MAX_REQUEST_SIZE_MB} MB."
                    ),
                    "detail": (
                        f"The uploaded file or request exceeds the maximum allowed size of {MAX_REQUEST_SIZE_MB}MB."
                    ),
                    "max_size_mb": MAX_REQUEST_SIZE_MB,
                    "received_size_mb": received_mb,
                    "suggestion": (
                        f"Try a smaller file (under {MAX_REQUEST_SIZE_MB}MB), compress the file, or upload in smaller parts."
                    ),
                }
            )
    
    response = await call_next(request)
    return response


# Rate limit decorators for common use cases
class RateLimitDecorators:
    """Common rate limit decorators for routes"""
    
    # Authentication endpoints
    AUTH_LOGIN = "5/minute"  # 5 login attempts per minute
    AUTH_REGISTER = "3/minute"  # 3 registrations per minute
    AUTH_PASSWORD_RESET = "3/hour"  # 3 password resets per hour
    
    # API endpoints
    API_READ = "100/minute"  # 100 read requests per minute
    API_WRITE = "50/minute"  # 50 write requests per minute
    API_DELETE = "20/minute"  # 20 delete requests per minute
    
    # File operations
    FILE_UPLOAD = "10/hour"  # 10 file uploads per hour
    FILE_DOWNLOAD = "50/minute"  # 50 downloads per minute
    
    # AI/ML operations
    AI_GENERATION = "10/minute"  # 10 AI generations per minute
    AI_ANALYSIS = "20/minute"  # 20 AI analyses per minute
    
    # Public endpoints
    PUBLIC_READ = "20/minute"  # 20 public reads per minute
    
    # Admin endpoints
    ADMIN_WRITE = "100/minute"  # 100 admin writes per minute


# Export for easy import
__all__ = [
    "setup_rate_limiting",
    "add_security_headers",
    "limit_request_size",
    "RateLimitDecorators"
]

