"""
Cache Utility Functions
Provides helper functions for managing Redis cache
"""

import logging
from typing import Optional
from services.redis_service import get_redis_client

logger = logging.getLogger(__name__)


async def clear_user_analytics_cache(user_id: int) -> bool:
    """
    Clear cached analytics for a specific user
    Call this when user data changes (new post, message, etc.)
    
    Args:
        user_id: User ID to clear cache for
        
    Returns:
        True if cache was cleared, False otherwise
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            logger.debug("[Cache] Redis not available")
            return False
        
        cache_key = f"dashboard_analytics:user_{user_id}"
        deleted = await redis_client.delete(cache_key)
        
        if deleted:
            logger.info(f"✅ Cleared analytics cache for user {user_id}")
        else:
            logger.debug(f"No cache found for user {user_id}")
        
        return bool(deleted)
        
    except Exception as e:
        logger.warning(f"⚠️ Error clearing cache: {e}")
        return False


async def clear_business_analysis_cache(business_name: str, location: str) -> bool:
    """
    Clear cached business analysis
    Call this when user wants fresh analysis
    
    Args:
        business_name: Business name
        location: Business location
        
    Returns:
        True if cache was cleared, False otherwise
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            logger.debug("[Cache] Redis not available")
            return False
        
        # Find and delete all business analysis cache keys
        pattern = "business_analysis:*"
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
            logger.info(f"✅ Cleared {deleted_count} business analysis cache entries")
        
        return deleted_count > 0
        
    except Exception as e:
        logger.warning(f"⚠️ Error clearing business analysis cache: {e}")
        return False


async def clear_all_cache() -> bool:
    """
    Clear ALL cache entries (use with caution!)
    
    Returns:
        True if cache was cleared, False otherwise
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            logger.debug("[Cache] Redis not available")
            return False
        
        await redis_client.flushdb()
        logger.info("✅ Cleared ALL cache entries")
        return True
        
    except Exception as e:
        logger.warning(f"⚠️ Error clearing all cache: {e}")
        return False


async def get_cache_stats() -> dict:
    """
    Get cache statistics
    
    Returns:
        Dict with cache stats
    """
    try:
        redis_client = await get_redis_client()
        if not redis_client:
            return {
                "available": False,
                "message": "Redis not available"
            }
        
        info = await redis_client.info()
        
        return {
            "available": True,
            "connected_clients": info.get("connected_clients", 0),
            "used_memory_human": info.get("used_memory_human", "N/A"),
            "total_keys": await redis_client.dbsize(),
            "uptime_in_seconds": info.get("uptime_in_seconds", 0),
        }
        
    except Exception as e:
        logger.warning(f"⚠️ Error getting cache stats: {e}")
        return {
            "available": False,
            "error": str(e)
        }
