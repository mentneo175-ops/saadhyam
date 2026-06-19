"""
CORS Configuration
Secure CORS setup with environment-based origins
"""

import logging
import os
from typing import List

logger = logging.getLogger(__name__)

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")


def get_cors_origins() -> List[str]:
    """
    Get CORS allowed origins based on environment
    
    Returns:
        List of allowed origins
    """
    
    # Default local development origins
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ]
    
    # Always include default production/staging Vercel origins
    default_prod_origins = [
        "https://saadhyam-psi.vercel.app",
        "https://saadhyam-production.up.railway.app",
    ]
    origins.extend(default_prod_origins)
    
    if ALLOWED_ORIGINS:
        custom_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]
        origins.extend(custom_origins)

    # Remove duplicates
    origins = list(set(origins))
    
    if ENVIRONMENT == "production":
        # Validate all production origins use HTTPS (except localhost)
        for origin in origins:
            if not origin.startswith("https://") and not "localhost" in origin and not "127.0.0.1" in origin:
                logger.warning(f"⚠️ Production origin should use HTTPS: {origin}")
        
        logger.info(f"✅ Production CORS configured with {len(origins)} origins")
        return origins
        
    elif ENVIRONMENT == "staging":
        # Default staging origins
        origins.extend([
            "https://staging.saadhyam.com",
            "https://staging-app.saadhyam.com",
        ])
        origins = list(set(origins))
        logger.info(f"✅ Staging CORS configured with {len(origins)} origins")
        return origins
        
    else:
        logger.info(f"✅ Development CORS configured with {len(origins)} origins")
        return origins


def get_cors_config() -> dict:
    """
    Get complete CORS configuration
    
    Returns:
        Dictionary with CORS configuration parameters
    """
    
    origins = get_cors_origins()
    
    config = {
        "allow_origins": origins,
        "allow_origin_regex": r"https://saadhyam-.*\.vercel\.app",
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": [
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "User-Agent",
            "DNT",
            "Cache-Control",
            "X-Requested-With",
        ],
        "expose_headers": [
            "Content-Length",
            "Content-Range",
            "X-Request-ID",
        ],
        "max_age": 3600,  # Cache preflight requests for 1 hour
    }
    
    return config


def validate_origin(origin: str) -> bool:
    """
    Validate if an origin is allowed
    
    Args:
        origin: Origin to validate
        
    Returns:
        True if origin is allowed, False otherwise
    """
    allowed_origins = get_cors_origins()
    return origin in allowed_origins


# Export
__all__ = [
    "get_cors_origins",
    "get_cors_config",
    "validate_origin"
]
