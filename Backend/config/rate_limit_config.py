"""
Rate Limiting Configuration
Configure rate limits for API endpoints to prevent abuse
"""

import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
# Format: "requests per time period"

RATE_LIMITS = {
    # Authentication endpoints - strict limits
    "auth_login": "5 per minute",  # Login attempts
    "auth_register": "3 per minute",  # Registration attempts
    "auth_refresh": "10 per minute",  # Token refresh
    
    # Analysis endpoints - moderate limits
    "analysis_trigger": "2 per hour",  # Trigger business analysis
    "analysis_regenerate": "1 per hour",  # Regenerate analysis
    
    # API endpoints - general limits
    "search": "30 per minute",  # Search endpoints
    "create": "20 per minute",  # Create operations
    "update": "20 per minute",  # Update operations
    "delete": "10 per minute",  # Delete operations
    
    # External API endpoints
    "instagram_sync": "5 per hour",  # Instagram sync
    "instagram_oauth": "10 per minute",  # Instagram OAuth
    
    # Public endpoints - higher limits
    "public_api": "60 per minute",  # Public API calls
    
    # Health & monitoring - no limits
    "health": "unlimited",
    "metrics": "unlimited"
}


def get_rate_limit(endpoint_type: str) -> str:
    """
    Get rate limit for an endpoint type
    
    Args:
        endpoint_type: Type of endpoint (e.g., 'auth_login', 'analysis_trigger')
    
    Returns:
        Rate limit string (e.g., '5 per minute')
    """
    return RATE_LIMITS.get(endpoint_type, "30 per minute")


def apply_rate_limit(rate_limit_key: str):
    """
    Decorator to apply rate limiting to an endpoint
    
    Usage:
        @router.post("/trigger-analysis")
        @apply_rate_limit("analysis_trigger")
        async def trigger_analysis(...):
            ...
    """
    def decorator(func):
        rate_limit = get_rate_limit(rate_limit_key)
        if rate_limit != "unlimited":
            return limiter.limit(rate_limit)(func)
        return func
    return decorator
