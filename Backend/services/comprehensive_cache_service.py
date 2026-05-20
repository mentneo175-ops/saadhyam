"""
Comprehensive Cache Service
Centralized caching for all application features to reduce API calls and database load
"""

import logging
import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime
from functools import wraps
from services.redis_service import get_redis_client

logger = logging.getLogger(__name__)

# ============================================
# CACHE TTL CONFIGURATION (in seconds)
# ============================================
CACHE_TTL = {
    # Business Analysis & AI Features
    "business_analysis": 3600,          # 1 hour - business analysis results
    "competitor_search": 7200,          # 2 hours - competitor data
    "gemini_content": 1800,             # 30 minutes - AI-generated content
    
    # Dashboard & Analytics
    "dashboard_analytics": 300,         # 5 minutes - dashboard stats
    "instagram_analytics": 600,         # 10 minutes - Instagram insights
    "whatsapp_analytics": 600,          # 10 minutes - WhatsApp stats
    
    # Profile & User Data
    "user_profile": 1800,               # 30 minutes - user profile data
    "business_profile": 3600,           # 1 hour - business profile
    "instagram_profile": 1800,          # 30 minutes - Instagram profile data
    
    # Social Media Data
    "instagram_posts": 900,             # 15 minutes - Instagram posts list
    "instagram_media": 1800,            # 30 minutes - Instagram media details
    "whatsapp_messages": 300,           # 5 minutes - WhatsApp messages
    
    # AI Services
    "review_reply": 3600,               # 1 hour - review reply suggestions
    "content_suggestions": 1800,        # 30 minutes - content ideas
    "seo_keywords": 7200,               # 2 hours - SEO keyword analysis
    
    # External API Data
    "google_search": 3600,              # 1 hour - Google search results
    "serper_api": 3600,                 # 1 hour - Serper API results
    "tavily_search": 3600,              # 1 hour - Tavily search results
    
    # Partnership & Network
    "nearby_businesses": 1800,          # 30 minutes - B2B network data
    "partnership_suggestions": 3600,    # 1 hour - partnership recommendations
    
    # Blog & Content
    "blog_posts": 600,                  # 10 minutes - blog list
    "blog_ideas": 1800,                 # 30 minutes - blog topic ideas
    
    # Meta Ads
    "meta_campaigns": 300,              # 5 minutes - ad campaigns
    "meta_insights": 600,               # 10 minutes - ad performance
    
    # Voice Agent
    "voice_conversations": 1800,        # 30 minutes - conversation history
    
    # Website AI
    "website_generation": 3600,         # 1 hour - generated websites
}

# ============================================
# CACHE KEY PREFIXES
# ============================================
CACHE_PREFIX = {
    "business_analysis": "biz_analysis:",
    "competitor": "competitor:",
    "gemini": "gemini:",
    "dashboard": "dashboard:",
    "instagram": "instagram:",
    "whatsapp": "whatsapp:",
    "user": "user:",
    "profile": "profile:",
    "review": "review:",
    "content": "content:",
    "seo": "seo:",
    "search": "search:",
    "network": "network:",
    "blog": "blog:",
    "meta": "meta:",
    "voice": "voice:",
    "website": "website:",
}


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate a unique cache key based on prefix and parameters
    
    Args:
        prefix: Cache key prefix (from CACHE_PREFIX)
        *args: Positional arguments to include in key
        **kwargs: Keyword arguments to include in key
    
    Returns:
        Unique cache key string
    """
    # Combine all parameters
    key_data = {
        "args": args,
        "kwargs": sorted(kwargs.items())
    }
    
    # Create hash
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f"{prefix}{key_hash}"


async def get_cached(key: str) -> Optional[Any]:
    """
    Get data from cache
    
    Args:
        key: Cache key
        
    Returns:
        Cached data or None if not found
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return None
        
        cached_data = await redis_client.get(key)
        if cached_data:
            logger.debug(f"[Cache HIT] {key}")
            return json.loads(cached_data)
        
        logger.debug(f"[Cache MISS] {key}")
        return None
        
    except Exception as e:
        logger.warning(f"[Cache] Error reading: {e}")
        return None


async def set_cached(key: str, data: Any, ttl: int) -> bool:
    """
    Store data in cache
    
    Args:
        key: Cache key
        data: Data to cache
        ttl: Time to live in seconds
        
    Returns:
        True if cached successfully
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False
        
        # Add cache metadata
        cache_data = {
            "data": data,
            "cached_at": datetime.utcnow().isoformat(),
            "ttl": ttl
        }
        
        await redis_client.setex(key, ttl, json.dumps(cache_data, default=str))
        logger.debug(f"[Cache SET] {key} (TTL: {ttl}s)")
        return True
        
    except Exception as e:
        logger.warning(f"[Cache] Error writing: {e}")
        return False


async def delete_cached(key: str) -> bool:
    """
    Delete data from cache
    
    Args:
        key: Cache key
        
    Returns:
        True if deleted successfully
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return False
        
        deleted = await redis_client.delete(key)
        if deleted:
            logger.debug(f"[Cache DELETE] {key}")
        return bool(deleted)
        
    except Exception as e:
        logger.warning(f"[Cache] Error deleting: {e}")
        return False


async def delete_pattern(pattern: str) -> int:
    """
    Delete all keys matching a pattern
    
    Args:
        pattern: Redis key pattern (e.g., "user:123:*")
        
    Returns:
        Number of keys deleted
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return 0
        
        cursor = 0
        deleted_count = 0
        
        while True:
            cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                deleted = await redis_client.delete(*keys)
                deleted_count += deleted
            
            if cursor == 0:
                break
        
        if deleted_count:
            logger.info(f"[Cache DELETE PATTERN] {pattern} - {deleted_count} keys")
        
        return deleted_count
        
    except Exception as e:
        logger.warning(f"[Cache] Error deleting pattern: {e}")
        return 0


def cache_result(cache_type: str, ttl: Optional[int] = None):
    """
    Decorator to cache function results
    
    Usage:
        @cache_result("business_analysis")
        async def get_business_analysis(business_id: str):
            # expensive operation
            return result
    
    Args:
        cache_type: Type of cache (key from CACHE_TTL)
        ttl: Optional custom TTL (overrides default)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = CACHE_PREFIX.get(cache_type.split("_")[0], "general:")
            cache_key = generate_cache_key(prefix, func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached = await get_cached(cache_key)
            if cached:
                logger.info(f"[Cache] Returning cached result for {func.__name__}")
                return cached.get("data")
            
            # Execute function
            logger.info(f"[Cache] Executing {func.__name__} (cache miss)")
            result = await func(*args, **kwargs)
            
            # Cache the result
            cache_ttl = ttl or CACHE_TTL.get(cache_type, 300)
            await set_cached(cache_key, result, cache_ttl)
            
            return result
        
        return wrapper
    return decorator


# ============================================
# CACHE INVALIDATION HELPERS
# ============================================

async def invalidate_user_cache(user_id: int) -> int:
    """Invalidate all cache for a specific user"""
    patterns = [
        f"user:{user_id}:*",
        f"profile:{user_id}:*",
        f"dashboard:user_{user_id}",
        f"instagram:user_{user_id}:*",
        f"whatsapp:user_{user_id}:*",
    ]
    
    total_deleted = 0
    for pattern in patterns:
        total_deleted += await delete_pattern(pattern)
    
    logger.info(f"[Cache] Invalidated {total_deleted} keys for user {user_id}")
    return total_deleted


async def invalidate_business_cache(user_id: int) -> int:
    """Invalidate business analysis cache for a user"""
    pattern = f"biz_analysis:*user_id*{user_id}*"
    deleted = await delete_pattern(pattern)
    logger.info(f"[Cache] Invalidated {deleted} business analysis keys")
    return deleted


async def invalidate_instagram_cache(user_id: int) -> int:
    """Invalidate Instagram-related cache"""
    pattern = f"instagram:user_{user_id}:*"
    deleted = await delete_pattern(pattern)
    logger.info(f"[Cache] Invalidated {deleted} Instagram keys")
    return deleted


async def invalidate_whatsapp_cache(user_id: int) -> int:
    """Invalidate WhatsApp-related cache"""
    pattern = f"whatsapp:user_{user_id}:*"
    deleted = await delete_pattern(pattern)
    logger.info(f"[Cache] Invalidated {deleted} WhatsApp keys")
    return deleted


# ============================================
# CACHE STATISTICS
# ============================================

async def get_cache_statistics() -> Dict[str, Any]:
    """Get comprehensive cache statistics"""
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return {"available": False, "message": "Redis not available"}
        
        info = await redis_client.info()
        
        # Count keys by prefix
        key_counts = {}
        for prefix_name, prefix in CACHE_PREFIX.items():
            cursor = 0
            count = 0
            while True:
                cursor, keys = await redis_client.scan(cursor, match=f"{prefix}*", count=100)
                count += len(keys)
                if cursor == 0:
                    break
            key_counts[prefix_name] = count
        
        return {
            "available": True,
            "connected_clients": info.get("connected_clients", 0),
            "used_memory_human": info.get("used_memory_human", "N/A"),
            "total_keys": await redis_client.dbsize(),
            "uptime_in_seconds": info.get("uptime_in_seconds", 0),
            "keys_by_type": key_counts,
            "hit_rate": info.get("keyspace_hits", 0) / max(info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1), 1) * 100
        }
        
    except Exception as e:
        logger.error(f"[Cache] Error getting statistics: {e}")
        return {"available": False, "error": str(e)}
