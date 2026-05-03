import redis.asyncio as redis
from config.settings import settings
import logging
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

# Redis connection pool (singleton)
_redis_client = None
_token_blacklist = {}  # In-memory fallback for token blacklist
_user_cache = {}  # In-memory fallback for user cache
_use_fallback = False  # Flag to indicate if we're using fallback


async def get_redis_client():
    """Get or create Redis client."""
    global _redis_client, _use_fallback

    if _redis_client is not None:
        return _redis_client

    try:
        _redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf8",
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5,
        )
        await _redis_client.ping()
        logger.info("Connected to Redis successfully")
        _use_fallback = False
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}")
        logger.info(
            "Using in-memory fallback for token blacklist (not suitable for production)"
        )
        _use_fallback = True
        _redis_client = None


async def close_redis():
    """Close Redis connection."""
    global _redis_client

    if _redis_client is not None:
        try:
            await _redis_client.close()
            _redis_client = None
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis: {e}")


async def blacklist_token(token: str, expiry_minutes: int) -> bool:
    """
    Add token to blacklist (for logout functionality).

    Args:
        token: JWT token to blacklist
        expiry_minutes: Token expiry time in minutes

    Returns:
        True if successful, False otherwise
    """
    try:
        if _use_fallback:
            # Use in-memory fallback
            expiry = datetime.utcnow() + timedelta(minutes=expiry_minutes)
            _token_blacklist[token] = expiry
            logger.debug(f"Token blacklisted (in-memory fallback)")
            return True
        else:
            await get_redis_client()
            if _redis_client:
                # Store token with TTL equal to token expiry
                await _redis_client.setex(
                    f"blacklist:{token}",
                    timedelta(minutes=expiry_minutes),
                    "true",
                )
                logger.info(f"Token blacklisted in Redis")
                return True
        return False
    except Exception as e:
        logger.error(f"Error blacklisting token: {e}")
        return False


async def is_token_blacklisted(token: str) -> bool:
    """
    Check if token is in blacklist.

    Args:
        token: JWT token to check

    Returns:
        True if token is blacklisted, False otherwise
    """
    try:
        if _use_fallback:
            # Check in-memory fallback
            if token in _token_blacklist:
                expiry = _token_blacklist[token]
                if datetime.utcnow() < expiry:
                    return True
                else:
                    # Remove expired token
                    del _token_blacklist[token]
            return False
        else:
            await get_redis_client()
            if _redis_client:
                result = await _redis_client.get(f"blacklist:{token}")
                return result is not None
        return False
    except Exception as e:
        logger.error(f"Error checking token blacklist: {e}")
        # Default to False for better UX in fallback mode
        return False


async def cache_user(user_id: int, user_data: dict, ttl: int = 3600) -> bool:
    """
    Cache user data in Redis.

    Args:
        user_id: User ID
        user_data: User data dictionary
        ttl: Time to live in seconds (default: 1 hour)

    Returns:
        True if successful, False otherwise
    """
    try:
        if _use_fallback:
            # Use in-memory fallback
            expiry = datetime.utcnow() + timedelta(seconds=ttl)
            _user_cache[user_id] = {"data": user_data, "expiry": expiry}
            logger.debug(f"User {user_id} cached (in-memory fallback)")
            return True
        else:
            await get_redis_client()
            if _redis_client:
                await _redis_client.setex(
                    f"user:{user_id}",
                    ttl,
                    json.dumps(user_data),
                )
                logger.info(f"User {user_id} cached in Redis")
                return True
        return False
    except Exception as e:
        logger.error(f"Error caching user: {e}")
        return False


async def get_cached_user(user_id: int) -> dict:
    """
    Get cached user data from Redis.

    Args:
        user_id: User ID

    Returns:
        User data dictionary or None if not found
    """
    try:
        if _use_fallback:
            # Check in-memory fallback
            if user_id in _user_cache:
                cache_entry = _user_cache[user_id]
                if datetime.utcnow() < cache_entry["expiry"]:
                    return cache_entry["data"]
                else:
                    # Remove expired entry
                    del _user_cache[user_id]
            return None
        else:
            await get_redis_client()
            if _redis_client:
                data = await _redis_client.get(f"user:{user_id}")
                if data:
                    return json.loads(data)
        return None
    except Exception as e:
        logger.error(f"Error retrieving cached user: {e}")
        return None


async def invalidate_user_cache(user_id: int) -> bool:
    """
    Invalidate cached user data.

    Args:
        user_id: User ID

    Returns:
        True if successful, False otherwise
    """
    try:
        if _use_fallback:
            # Remove from in-memory fallback
            if user_id in _user_cache:
                del _user_cache[user_id]
            logger.debug(f"User {user_id} cache invalidated (in-memory)")
            return True
        else:
            await get_redis_client()
            if _redis_client:
                await _redis_client.delete(f"user:{user_id}")
                logger.info(f"User {user_id} cache invalidated in Redis")
                return True
        return False
    except Exception as e:
        logger.error(f"Error invalidating user cache: {e}")
        return False
