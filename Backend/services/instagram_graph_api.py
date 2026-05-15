"""
Instagram Graph API Service
Uses official Instagram Graph API to fetch real data
Requires: Instagram Business Account + Access Token
"""

import logging
import requests
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class InstagramGraphAPI:
    """
    Official Instagram Graph API integration
    Works with Instagram Business and Creator accounts
    """
    
    def __init__(self):
        self.app_id = os.getenv("INSTAGRAM_APP_ID")
        self.app_secret = os.getenv("INSTAGRAM_APP_SECRET")
        self.access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        self.api_version = os.getenv("INSTAGRAM_GRAPH_API_VERSION", "v19.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        
        if not self.access_token:
            logger.warning("⚠️ INSTAGRAM_ACCESS_TOKEN not configured")
            logger.info("💡 To get access token, follow: INSTAGRAM_GRAPH_API_SETUP.md")
    
    def is_configured(self) -> bool:
        """Check if Graph API is properly configured"""
        return bool(self.app_id and self.app_secret and self.access_token)
    
    def fetch_business_account(self, instagram_business_account_id: str) -> Dict[str, Any]:
        """
        Fetch Instagram Business Account data using Graph API
        
        Args:
            instagram_business_account_id: Instagram Business Account ID
            
        Returns:
            Dictionary with real profile data from official API
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "Instagram Graph API not configured",
                "needs_setup": True
            }
        
        try:
            logger.info(f"🔍 Fetching Instagram Business Account: {instagram_business_account_id}")
            
            # Fields to fetch from Graph API
            fields = [
                "id",
                "username",
                "name",
                "biography",
                "followers_count",
                "follows_count",
                "media_count",
                "profile_picture_url",
                "website"
            ]
            
            # Make API request
            url = f"{self.base_url}/{instagram_business_account_id}"
            params = {
                "fields": ",".join(fields),
                "access_token": self.access_token
            }
            
            logger.info(f"📡 Requesting: {url}")
            logger.info(f"📋 Fields: {','.join(fields)}")
            
            response = requests.get(url, params=params, timeout=10)
            
            logger.info(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                logger.info(f"✅ Got response data: {list(data.keys())}")
                
                profile_data = {
                    "username": data.get("username", ""),
                    "full_name": data.get("name", ""),
                    "biography": data.get("biography", ""),
                    "follower_count": data.get("followers_count", 0),
                    "following_count": data.get("follows_count", 0),
                    "media_count": data.get("media_count", 0),
                    "is_verified": False,  # Graph API doesn't provide this
                    "is_private": False,  # Business accounts are public
                    "profile_pic_url": data.get("profile_picture_url", ""),
                    "external_url": data.get("website", ""),
                    "is_business_account": True,
                    "data_source": "instagram_graph_api"
                }
                
                logger.info(f"✅ SUCCESS! Got REAL data from Instagram Graph API")
                logger.info(f"   Username: @{profile_data['username']}")
                logger.info(f"   Followers: {profile_data['follower_count']:,}")
                logger.info(f"   Following: {profile_data['following_count']:,}")
                logger.info(f"   Posts: {profile_data['media_count']:,}")
                
                return {
                    "success": True,
                    "profile": profile_data,
                    "source": "instagram_graph_api"
                }
            
            else:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Unknown error")
                error_code = error_data.get("error", {}).get("code", "")
                error_type = error_data.get("error", {}).get("type", "")
                
                logger.error(f"❌ Graph API error ({error_code}): {error_message}")
                logger.error(f"   Error type: {error_type}")
                logger.error(f"   Full response: {error_data}")
                
                return {
                    "success": False,
                    "error": f"{error_type}: {error_message}",
                    "error_code": error_code,
                    "needs_setup": True
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Network error: {e}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "needs_setup": False
            }
        except Exception as e:
            logger.error(f"❌ Error fetching from Graph API: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "needs_setup": False
            }
    
    def fetch_by_username(self, username: str) -> Dict[str, Any]:
        """
        Fetch profile by username (requires username to business account ID mapping)
        
        Note: Graph API doesn't support direct username lookup.
        You need to know the Instagram Business Account ID.
        """
        logger.warning("⚠️ Graph API doesn't support username lookup")
        logger.info("💡 You need the Instagram Business Account ID")
        logger.info("💡 See INSTAGRAM_GRAPH_API_SETUP.md for how to get it")
        
        return {
            "success": False,
            "error": "Graph API requires Instagram Business Account ID, not username",
            "needs_setup": True
        }
    
    def get_long_lived_token(self, short_lived_token: str) -> Optional[str]:
        """
        Exchange short-lived token for long-lived token (60 days)
        
        Args:
            short_lived_token: Short-lived access token from OAuth
            
        Returns:
            Long-lived access token or None
        """
        try:
            url = f"{self.base_url}/oauth/access_token"
            params = {
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": short_lived_token
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                long_lived_token = data.get("access_token")
                logger.info("✅ Successfully exchanged for long-lived token")
                return long_lived_token
            else:
                logger.error(f"❌ Failed to exchange token: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error exchanging token: {e}")
            return None


# Singleton instance
instagram_graph_api = InstagramGraphAPI()
