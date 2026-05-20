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
        
    Raises:
        ValueError: If production environment has no ALLOWED_ORIGINS set
    """
    
    if ENVIRONMENT == "production":
        # Production: Strict CORS with explicit origins
        if not ALLOWED_ORIGINS:
            raise ValueError(
                "ALLOWED_ORIGINS environment variable must be set in production. "
                "Example: ALLOWED_ORIGINS=https://app.saadhyam.com,https://www.saadhyam.com"
            )
        
        origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]
        
        # Validate all origins use HTTPS in production
        for origin in origins:
            if not origin.startswith("https://"):
                raise ValueError(
                    f"Production origin must use HTTPS: {origin}. "
                    f"HTTP is not allowed in production for security reasons."
                )
        
        logger.info(f"✅ Production CORS configured with {len(origins)} origins")
        logger.info(f"   Allowed origins: {', '.join(origins)}")
        return origins
        
    elif ENVIRONMENT == "staging":
        # Staging: Allow staging domains
        if ALLOWED_ORIGINS:
            origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]
        else:
            # Default staging origins
            origins = [
                "https://staging.saadhyam.com",
                "https://staging-app.saadhyam.com",
            ]
        
        logger.info(f"✅ Staging CORS configured with {len(origins)} origins")
        return origins
        
    else:
        # Development: Allow localhost with various ports
        origins = [
            # React/Vite default ports
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            
            # Vue/Nuxt default ports
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            
            # Angular default port
            "http://localhost:4200",
            "http://127.0.0.1:4200",
            
            # Alternative development ports
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            
            # Mobile development (Expo, React Native)
            "http://localhost:19006",
            "http://127.0.0.1:19006",
        ]
        
        # Add custom origins from environment if provided
        if ALLOWED_ORIGINS:
            custom_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]
            origins.extend(custom_origins)
            logger.info(f"✅ Development CORS: Added {len(custom_origins)} custom origins")
        
        logger.info(f"✅ Development CORS configured with {len(origins)} origins")
        logger.warning("⚠️  Development mode: Multiple localhost origins allowed")
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
    
    # In production, be more restrictive
    if ENVIRONMENT == "production":
        config["allow_methods"] = ["GET", "POST", "PUT", "DELETE", "PATCH"]  # No OPTIONS needed
        logger.info("✅ Production CORS: Restrictive configuration applied")
    
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
