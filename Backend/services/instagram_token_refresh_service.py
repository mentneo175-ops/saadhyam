"""
Instagram Token Refresh Service
Automatically refreshes Instagram/Facebook access tokens before they expire
"""

import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
from config.database import get_db_sync
from models.instagram import SocialAccount
from config.settings import settings

logger = logging.getLogger(__name__)


class InstagramTokenRefreshService:
    """
    Service to automatically refresh Instagram/Facebook access tokens
    
    Facebook tokens expire after 60 days. This service:
    1. Checks token expiry dates
    2. Refreshes tokens before they expire (at 50 days)
    3. Sends notifications to users when refresh fails
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.refresh_threshold_days = 50  # Refresh at 50 days (10 days before expiry)
    
    async def refresh_long_lived_token(self, access_token: str) -> Optional[Dict]:
        """
        Refresh a long-lived access token
        
        Facebook allows refreshing long-lived tokens to extend their validity
        https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
        
        Args:
            access_token: Current access token
            
        Returns:
            Dict with new token info or None if failed
        """
        try:
            url = f"https://graph.facebook.com/{settings.INSTAGRAM_GRAPH_API_VERSION}/oauth/access_token"
            
            params = {
                "grant_type": "fb_exchange_token",
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "fb_exchange_token": access_token
            }
            
            response = await self.client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Token refreshed successfully. Expires in {data.get('expires_in', 0)} seconds")
                return data
            else:
                error_data = response.json()
                logger.error(f"❌ Token refresh failed: {error_data}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error refreshing token: {e}")
            return None
    
    async def check_and_refresh_expiring_tokens(self) -> Dict[str, int]:
        """
        Check all Instagram accounts and refresh tokens that are about to expire
        
        Returns:
            Dict with counts: {refreshed, failed, skipped}
        """
        stats = {"refreshed": 0, "failed": 0, "skipped": 0, "total": 0}
        
        try:
            db = next(get_db_sync())
            
            # Get all connected Instagram accounts
            accounts = db.query(SocialAccount).filter(
                SocialAccount.platform == "instagram",
                SocialAccount.is_active == True
            ).all()
            
            stats["total"] = len(accounts)
            logger.info(f"🔍 Checking {len(accounts)} Instagram accounts for token expiry")
            
            for account in accounts:
                try:
                    # Check if token is about to expire
                    if not account.access_token_expires_at:
                        logger.warning(f"⚠️ Account {account.id} has no expiry date set")
                        stats["skipped"] += 1
                        continue
                    
                    days_until_expiry = (account.access_token_expires_at - datetime.utcnow()).days
                    
                    logger.info(f"📅 Account {account.id} ({account.ig_username}): {days_until_expiry} days until expiry")
                    
                    # Refresh if within threshold
                    if days_until_expiry <= self.refresh_threshold_days:
                        logger.info(f"🔄 Refreshing token for account {account.id} ({account.ig_username})")
                        
                        refresh_result = await self.refresh_long_lived_token(account.access_token)
                        
                        if refresh_result:
                            # Update token in database
                            account.access_token = refresh_result["access_token"]
                            
                            # Calculate new expiry (60 days from now)
                            expires_in_seconds = refresh_result.get("expires_in", 5184000)  # Default 60 days
                            account.access_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
                            
                            db.commit()
                            
                            stats["refreshed"] += 1
                            logger.info(f"✅ Token refreshed for account {account.id}. New expiry: {account.access_token_expires_at}")
                            
                            # TODO: Send success notification to user
                            await self._notify_user_token_refreshed(account.user_id, account.ig_username)
                        else:
                            stats["failed"] += 1
                            logger.error(f"❌ Failed to refresh token for account {account.id}")
                            
                            # TODO: Send failure notification to user
                            await self._notify_user_token_refresh_failed(account.user_id, account.ig_username, days_until_expiry)
                    else:
                        stats["skipped"] += 1
                        logger.info(f"✅ Account {account.id} token is still valid ({days_until_expiry} days)")
                        
                except Exception as e:
                    logger.error(f"❌ Error processing account {account.id}: {e}")
                    stats["failed"] += 1
            
            logger.info(f"📊 Token refresh complete: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error in check_and_refresh_expiring_tokens: {e}")
            return stats
    
    async def _notify_user_token_refreshed(self, user_id: int, username: str):
        """Send notification to user that token was refreshed"""
        # TODO: Implement notification (email, in-app, etc.)
        logger.info(f"📧 Notification: Token refreshed for user {user_id}, account {username}")
    
    async def _notify_user_token_refresh_failed(self, user_id: int, username: str, days_until_expiry: int):
        """Send notification to user that token refresh failed"""
        # TODO: Implement notification (email, in-app, etc.)
        logger.warning(f"📧 Notification: Token refresh failed for user {user_id}, account {username}. Expires in {days_until_expiry} days. User needs to reconnect.")
    
    async def get_token_status(self, account_id: int) -> Dict:
        """
        Get token status for a specific account
        
        Returns:
            Dict with token status info
        """
        try:
            db = next(get_db_sync())
            account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
            
            if not account:
                return {"error": "Account not found"}
            
            if not account.access_token_expires_at:
                return {
                    "status": "unknown",
                    "message": "Token expiry date not set"
                }
            
            days_until_expiry = (account.access_token_expires_at - datetime.utcnow()).days
            
            if days_until_expiry < 0:
                status = "expired"
                message = f"Token expired {abs(days_until_expiry)} days ago"
            elif days_until_expiry <= 7:
                status = "critical"
                message = f"Token expires in {days_until_expiry} days - URGENT: Reconnect now!"
            elif days_until_expiry <= 14:
                status = "warning"
                message = f"Token expires in {days_until_expiry} days - Please reconnect soon"
            else:
                status = "healthy"
                message = f"Token valid for {days_until_expiry} more days"
            
            return {
                "status": status,
                "days_until_expiry": days_until_expiry,
                "expires_at": account.access_token_expires_at.isoformat(),
                "message": message,
                "needs_refresh": days_until_expiry <= self.refresh_threshold_days
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting token status: {e}")
            return {"error": str(e)}
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Singleton instance
instagram_token_refresh_service = InstagramTokenRefreshService()
