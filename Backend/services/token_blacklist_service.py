"""
Token Blacklist Service
Manages revoked JWT tokens using Redis
"""

import logging
import os
from typing import Optional
from datetime import datetime, timedelta
import redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class TokenBlacklistService:
    """Service for managing blacklisted JWT tokens"""
    
    def __init__(self):
        """Initialize Redis connection"""
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client: Optional[redis.Redis] = None
        self.enabled = False
        
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.enabled = True
            logger.info("✅ Token blacklist service initialized with Redis")
        except RedisError as e:
            logger.warning(f"⚠️ Redis not available: {e}")
            logger.warning("⚠️ Token blacklist disabled - tokens will remain valid until expiration")
            self.redis_client = None
            self.enabled = False
    
    def blacklist_token(self, token: str, expires_in_minutes: int = 10080) -> bool:
        """
        Add token to blacklist
        
        Args:
            token: JWT token to blacklist
            expires_in_minutes: Token expiration time in minutes (default: 7 days)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self.redis_client:
            logger.warning("⚠️ Token blacklist not available - token not blacklisted")
            return False
        
        try:
            key = f"blacklist:token:{token}"
            expiry_seconds = expires_in_minutes * 60
            
            # Set token in Redis with expiration
            self.redis_client.setex(
                key,
                expiry_seconds,
                datetime.utcnow().isoformat()
            )
            
            logger.info(f"✅ Token blacklisted (expires in {expires_in_minutes} minutes)")
            return True
            
        except RedisError as e:
            logger.error(f"❌ Failed to blacklist token: {e}")
            return False
    
    def is_token_blacklisted(self, token: str) -> bool:
        """
        Check if token is blacklisted
        
        Args:
            token: JWT token to check
            
        Returns:
            True if blacklisted, False otherwise
        """
        if not self.enabled or not self.redis_client:
            # If Redis is not available, assume token is not blacklisted
            # This is a security tradeoff - tokens remain valid until expiration
            return False
        
        try:
            key = f"blacklist:token:{token}"
            exists = self.redis_client.exists(key)
            
            if exists:
                logger.warning(f"⚠️ Blacklisted token attempted to be used")
            
            return bool(exists)
            
        except RedisError as e:
            logger.error(f"❌ Failed to check token blacklist: {e}")
            # On error, allow the token (fail open)
            # This prevents Redis issues from blocking all users
            return False
    
    def blacklist_user_tokens(self, user_id: int, expires_in_minutes: int = 10080) -> bool:
        """
        Blacklist all tokens for a specific user
        Useful for logout all sessions or account compromise
        
        Args:
            user_id: User ID whose tokens should be blacklisted
            expires_in_minutes: Expiration time in minutes
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self.redis_client:
            logger.warning("⚠️ Token blacklist not available - user tokens not blacklisted")
            return False
        
        try:
            key = f"blacklist:user:{user_id}"
            expiry_seconds = expires_in_minutes * 60
            
            # Set user blacklist marker
            self.redis_client.setex(
                key,
                expiry_seconds,
                datetime.utcnow().isoformat()
            )
            
            logger.info(f"✅ All tokens for user {user_id} blacklisted")
            return True
            
        except RedisError as e:
            logger.error(f"❌ Failed to blacklist user tokens: {e}")
            return False
    
    def is_user_blacklisted(self, user_id: int) -> bool:
        """
        Check if all tokens for a user are blacklisted
        
        Args:
            user_id: User ID to check
            
        Returns:
            True if user is blacklisted, False otherwise
        """
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            key = f"blacklist:user:{user_id}"
            exists = self.redis_client.exists(key)
            
            if exists:
                logger.warning(f"⚠️ Blacklisted user {user_id} attempted to use token")
            
            return bool(exists)
            
        except RedisError as e:
            logger.error(f"❌ Failed to check user blacklist: {e}")
            return False
    
    def remove_from_blacklist(self, token: str) -> bool:
        """
        Remove token from blacklist (rarely needed)
        
        Args:
            token: JWT token to remove from blacklist
            
        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            key = f"blacklist:token:{token}"
            self.redis_client.delete(key)
            logger.info("✅ Token removed from blacklist")
            return True
            
        except RedisError as e:
            logger.error(f"❌ Failed to remove token from blacklist: {e}")
            return False
    
    def get_blacklist_stats(self) -> dict:
        """
        Get statistics about blacklisted tokens
        
        Returns:
            Dictionary with blacklist statistics
        """
        if not self.enabled or not self.redis_client:
            return {
                "enabled": False,
                "total_blacklisted_tokens": 0,
                "total_blacklisted_users": 0
            }
        
        try:
            # Count blacklisted tokens
            token_keys = self.redis_client.keys("blacklist:token:*")
            user_keys = self.redis_client.keys("blacklist:user:*")
            
            return {
                "enabled": True,
                "total_blacklisted_tokens": len(token_keys),
                "total_blacklisted_users": len(user_keys),
                "redis_url": self.redis_url.split('@')[-1]  # Hide credentials
            }
            
        except RedisError as e:
            logger.error(f"❌ Failed to get blacklist stats: {e}")
            return {
                "enabled": True,
                "error": str(e)
            }


# Global instance
token_blacklist_service = TokenBlacklistService()


# Export
__all__ = ["token_blacklist_service", "TokenBlacklistService"]
