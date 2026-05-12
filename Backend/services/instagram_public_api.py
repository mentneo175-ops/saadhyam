"""
Instagram Public API Service
Fetches real Instagram data using public endpoints (no login required)
Works immediately without account restrictions
"""

import logging
import requests
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class InstagramPublicAPI:
    """
    Fetch real Instagram data using public endpoints
    No authentication required - works immediately!
    """
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        })
    
    def fetch_profile(self, username: str) -> Dict[str, Any]:
        """
        Fetch real Instagram profile data using public endpoint
        
        Args:
            username: Instagram username (without @)
            
        Returns:
            Dictionary with real profile data
        """
        try:
            username = username.strip().replace("@", "")
            logger.info(f"🔍 Fetching real Instagram data for @{username} using public API")
            
            # Method 1: Try Instagram's public JSON endpoint
            url = f"https://www.instagram.com/{username}/?__a=1&__d=dis"
            
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Extract user data from response
                    if 'graphql' in data and 'user' in data['graphql']:
                        user = data['graphql']['user']
                    elif 'user' in data:
                        user = data['user']
                    else:
                        logger.warning(f"⚠️ Unexpected response structure for @{username}")
                        return self._fallback_scrape(username)
                    
                    # Parse real data
                    profile_data = {
                        "username": user.get("username", username),
                        "full_name": user.get("full_name", username),
                        "biography": user.get("biography", ""),
                        "follower_count": user.get("edge_followed_by", {}).get("count", 0),
                        "following_count": user.get("edge_follow", {}).get("count", 0),
                        "media_count": user.get("edge_owner_to_timeline_media", {}).get("count", 0),
                        "is_verified": user.get("is_verified", False),
                        "is_private": user.get("is_private", False),
                        "profile_pic_url": user.get("profile_pic_url_hd") or user.get("profile_pic_url", ""),
                        "external_url": user.get("external_url", ""),
                        "is_business_account": user.get("is_business_account", False),
                        "business_category_name": user.get("business_category_name", ""),
                        "category": user.get("category_name", ""),
                        "data_source": "instagram_public_api"
                    }
                    
                    logger.info(f"✅ Successfully fetched REAL data for @{username}")
                    logger.info(f"   Followers: {profile_data['follower_count']:,}")
                    logger.info(f"   Following: {profile_data['following_count']:,}")
                    logger.info(f"   Posts: {profile_data['media_count']:,}")
                    logger.info(f"   Verified: {profile_data['is_verified']}")
                    
                    return {
                        "success": True,
                        "profile": profile_data,
                        "source": "instagram_public_api"
                    }
                    
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Failed to parse JSON for @{username}, trying fallback")
                    return self._fallback_scrape(username)
            
            else:
                logger.warning(f"⚠️ Instagram returned status {response.status_code} for @{username}")
                return self._fallback_scrape(username)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Network error fetching @{username}: {e}")
            return self._fallback_scrape(username)
        except Exception as e:
            logger.error(f"❌ Error fetching @{username}: {e}")
            return self._fallback_scrape(username)
    
    def _fallback_scrape(self, username: str) -> Dict[str, Any]:
        """
        Fallback method: Scrape from HTML page
        """
        try:
            logger.info(f"🔄 Trying HTML scraping for @{username}")
            
            url = f"https://www.instagram.com/{username}/"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                html = response.text
                
                # Try to extract JSON data from HTML
                if '"edge_followed_by":{"count":' in html:
                    # Extract follower count
                    start = html.find('"edge_followed_by":{"count":') + len('"edge_followed_by":{"count":')
                    end = html.find('}', start)
                    follower_count = int(html[start:end])
                    
                    # Extract following count
                    start = html.find('"edge_follow":{"count":') + len('"edge_follow":{"count":')
                    end = html.find('}', start)
                    following_count = int(html[start:end])
                    
                    # Extract post count
                    start = html.find('"edge_owner_to_timeline_media":{"count":') + len('"edge_owner_to_timeline_media":{"count":')
                    end = html.find(',', start)
                    media_count = int(html[start:end])
                    
                    # Extract full name
                    start = html.find('"full_name":"') + len('"full_name":"')
                    end = html.find('"', start)
                    full_name = html[start:end]
                    
                    # Extract bio
                    start = html.find('"biography":"') + len('"biography":"')
                    end = html.find('"', start)
                    biography = html[start:end]
                    
                    # Extract verified status
                    is_verified = '"is_verified":true' in html
                    
                    profile_data = {
                        "username": username,
                        "full_name": full_name,
                        "biography": biography,
                        "follower_count": follower_count,
                        "following_count": following_count,
                        "media_count": media_count,
                        "is_verified": is_verified,
                        "is_private": False,
                        "profile_pic_url": f"https://www.instagram.com/{username}/",
                        "data_source": "instagram_html_scrape"
                    }
                    
                    logger.info(f"✅ Successfully scraped REAL data for @{username}")
                    logger.info(f"   Followers: {follower_count:,}")
                    
                    return {
                        "success": True,
                        "profile": profile_data,
                        "source": "instagram_html_scrape"
                    }
        
        except Exception as e:
            logger.error(f"❌ Fallback scraping failed for @{username}: {e}")
        
        # If all methods fail, return error
        return {
            "success": False,
            "error": "Could not fetch Instagram profile data",
            "source": "failed"
        }


# Singleton instance
instagram_public_api = InstagramPublicAPI()
