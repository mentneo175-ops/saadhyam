"""
Instagram Analytics Service
Complete service for fetching real Instagram analytics data via Graph API
"""

import logging
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from config.settings import settings

logger = logging.getLogger(__name__)


class InstagramAnalyticsService:
    """Service for fetching Instagram Business analytics from Graph API"""
    
    def __init__(self):
        self.api_version = "v19.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        self.app_id = settings.INSTAGRAM_APP_ID
        self.app_secret = settings.INSTAGRAM_APP_SECRET
        self.redirect_uri = settings.INSTAGRAM_REDIRECT_URI
    
    def get_facebook_oauth_url(self) -> str:
        """Generate Facebook OAuth authorization URL for Instagram access"""
        url = (
            f"https://www.facebook.com/{self.api_version}/dialog/oauth?"
            f"client_id={self.app_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&scope=instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement"
            f"&response_type=code"
        )
        return url
    
    # ======================== Account Analytics ========================
    
    async def get_account_insights(
        self,
        ig_account_id: str,
        access_token: str,
        period: str = "day",
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch account-level insights from Instagram Graph API
        
        Args:
            ig_account_id: Instagram Business Account ID
            access_token: Valid access token
            period: Time period (day, week, days_28)
            metrics: List of metrics to fetch
        
        Returns:
            Dictionary containing insights data
        """
        try:
            if metrics is None:
                metrics = [
                    "impressions",
                    "reach",
                    "profile_views",
                    "website_clicks",
                    "email_contacts",
                    "phone_call_clicks",
                    "get_directions_clicks",
                    "follower_count",
                ]
            
            url = f"{self.base_url}/{ig_account_id}/insights"
            params = {
                "metric": ",".join(metrics),
                "period": period,
                "access_token": access_token,
            }
            
            logger.info(f"📊 Fetching account insights for {ig_account_id}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch account insights: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            logger.info(f"✅ Account insights fetched successfully")
            
            # Parse insights into structured format
            insights = {}
            for item in data.get("data", []):
                metric_name = item.get("name")
                values = item.get("values", [])
                if values:
                    insights[metric_name] = values[0].get("value", 0)
            
            return {"success": True, "insights": insights}
            
        except Exception as e:
            logger.error(f"❌ Error fetching account insights: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_follower_count(
        self,
        ig_account_id: str,
        access_token: str
    ) -> Dict[str, Any]:
        """Get current follower count"""
        try:
            url = f"{self.base_url}/{ig_account_id}"
            params = {
                "fields": "followers_count",
                "access_token": access_token,
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch follower count: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            return {
                "success": True,
                "followers_count": data.get("followers_count", 0)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching follower count: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_account_info(
        self,
        ig_account_id: str,
        access_token: str
    ) -> Dict[str, Any]:
        """Get complete account information"""
        try:
            url = f"{self.base_url}/{ig_account_id}"
            params = {
                "fields": "id,username,name,biography,profile_picture_url,website,followers_count,follows_count,media_count",
                "access_token": access_token,
            }
            
            logger.info(f"📱 Fetching account info for {ig_account_id}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch account info: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            logger.info(f"✅ Account info fetched: @{data.get('username')}")
            
            return {"success": True, "account": data}
            
        except Exception as e:
            logger.error(f"❌ Error fetching account info: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Media Analytics ========================
    
    async def get_media_list(
        self,
        ig_account_id: str,
        access_token: str,
        limit: int = 25,
        after: str = None
    ) -> Dict[str, Any]:
        """
        Get list of media (posts, reels, stories) for an account
        
        Args:
            ig_account_id: Instagram Business Account ID
            access_token: Valid access token
            limit: Number of media items to fetch (max 100)
            after: Pagination cursor
        
        Returns:
            Dictionary containing media list and pagination info
        """
        try:
            url = f"{self.base_url}/{ig_account_id}/media"
            params = {
                "fields": "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count",
                "limit": min(limit, 100),
                "access_token": access_token,
            }
            
            if after:
                params["after"] = after
            
            logger.info(f"📸 Fetching media list for {ig_account_id}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch media list: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            media_list = data.get("data", [])
            paging = data.get("paging", {})
            
            logger.info(f"✅ Fetched {len(media_list)} media items")
            
            return {
                "success": True,
                "media": media_list,
                "paging": paging,
                "count": len(media_list)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching media list: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_media_insights(
        self,
        media_id: str,
        access_token: str,
        media_type: str = "IMAGE"
    ) -> Dict[str, Any]:
        """
        Get insights for a specific media item
        
        Args:
            media_id: Instagram Media ID
            access_token: Valid access token
            media_type: Type of media (IMAGE, VIDEO, CAROUSEL_ALBUM, REELS)
        
        Returns:
            Dictionary containing media insights
        """
        try:
            # Different metrics for different media types
            if media_type == "VIDEO" or media_type == "REELS":
                metrics = [
                    "impressions",
                    "reach",
                    "engagement",
                    "saved",
                    "video_views",
                    "plays",
                ]
            else:
                metrics = [
                    "impressions",
                    "reach",
                    "engagement",
                    "saved",
                ]
            
            url = f"{self.base_url}/{media_id}/insights"
            params = {
                "metric": ",".join(metrics),
                "access_token": access_token,
            }
            
            logger.info(f"📊 Fetching insights for media {media_id}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch media insights: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            
            # Parse insights
            insights = {}
            for item in data.get("data", []):
                metric_name = item.get("name")
                values = item.get("values", [])
                if values:
                    insights[metric_name] = values[0].get("value", 0)
            
            logger.info(f"✅ Media insights fetched successfully")
            
            return {"success": True, "insights": insights}
            
        except Exception as e:
            logger.error(f"❌ Error fetching media insights: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Story Analytics ========================
    
    async def get_stories(
        self,
        ig_account_id: str,
        access_token: str
    ) -> Dict[str, Any]:
        """Get active stories for an account"""
        try:
            url = f"{self.base_url}/{ig_account_id}/stories"
            params = {
                "fields": "id,media_type,media_url,timestamp",
                "access_token": access_token,
            }
            
            logger.info(f"📖 Fetching stories for {ig_account_id}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch stories: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            stories = data.get("data", [])
            
            logger.info(f"✅ Fetched {len(stories)} stories")
            
            return {
                "success": True,
                "stories": stories,
                "count": len(stories)
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching stories: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_story_insights(
        self,
        story_id: str,
        access_token: str
    ) -> Dict[str, Any]:
        """Get insights for a specific story"""
        try:
            metrics = [
                "impressions",
                "reach",
                "exits",
                "replies",
                "taps_forward",
                "taps_back",
            ]
            
            url = f"{self.base_url}/{story_id}/insights"
            params = {
                "metric": ",".join(metrics),
                "access_token": access_token,
            }
            
            logger.info(f"📊 Fetching story insights for {story_id}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch story insights: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            
            # Parse insights
            insights = {}
            for item in data.get("data", []):
                metric_name = item.get("name")
                values = item.get("values", [])
                if values:
                    insights[metric_name] = values[0].get("value", 0)
            
            logger.info(f"✅ Story insights fetched successfully")
            
            return {"success": True, "insights": insights}
            
        except Exception as e:
            logger.error(f"❌ Error fetching story insights: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Audience Insights ========================
    
    async def get_audience_insights(
        self,
        ig_account_id: str,
        access_token: str,
        period: str = "lifetime"
    ) -> Dict[str, Any]:
        """
        Get audience demographic and behavior insights
        
        Args:
            ig_account_id: Instagram Business Account ID
            access_token: Valid access token
            period: Time period (lifetime, day, week, days_28)
        
        Returns:
            Dictionary containing audience insights
        """
        try:
            metrics = [
                "audience_city",
                "audience_country",
                "audience_gender_age",
                "audience_locale",
                "online_followers",
            ]
            
            url = f"{self.base_url}/{ig_account_id}/insights"
            params = {
                "metric": ",".join(metrics),
                "period": period,
                "access_token": access_token,
            }
            
            logger.info(f"👥 Fetching audience insights for {ig_account_id}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to fetch audience insights: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            
            # Parse insights
            insights = {}
            for item in data.get("data", []):
                metric_name = item.get("name")
                values = item.get("values", [])
                if values:
                    insights[metric_name] = values[0].get("value", {})
            
            logger.info(f"✅ Audience insights fetched successfully")
            
            return {"success": True, "insights": insights}
            
        except Exception as e:
            logger.error(f"❌ Error fetching audience insights: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Hashtag Analytics ========================
    
    async def search_hashtags(
        self,
        ig_account_id: str,
        query: str,
        access_token: str
    ) -> Dict[str, Any]:
        """Search for hashtags"""
        try:
            url = f"{self.base_url}/ig_hashtag_search"
            params = {
                "user_id": ig_account_id,
                "q": query,
                "access_token": access_token,
            }
            
            logger.info(f"🔍 Searching hashtags: {query}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                logger.error(f"❌ Failed to search hashtags: {error_data}")
                return {"success": False, "error": error_data}
            
            data = response.json()
            hashtags = data.get("data", [])
            
            logger.info(f"✅ Found {len(hashtags)} hashtags")
            
            return {
                "success": True,
                "hashtags": hashtags,
                "count": len(hashtags)
            }
            
        except Exception as e:
            logger.error(f"❌ Error searching hashtags: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Batch Operations ========================
    
    async def fetch_complete_analytics(
        self,
        ig_account_id: str,
        access_token: str,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Fetch complete analytics package for an account
        
        This is the main method for syncing all analytics data
        
        Args:
            ig_account_id: Instagram Business Account ID
            access_token: Valid access token
            days_back: Number of days to fetch historical data
        
        Returns:
            Complete analytics package
        """
        try:
            logger.info(f"🔄 Starting complete analytics fetch for {ig_account_id}")
            
            analytics_package = {
                "success": True,
                "account_info": {},
                "account_insights": {},
                "follower_count": 0,
                "media_list": [],
                "media_insights": [],
                "stories": [],
                "story_insights": [],
                "audience_insights": {},
                "errors": []
            }
            
            # 1. Fetch account info
            logger.info("📱 Step 1/6: Fetching account info...")
            account_result = await self.get_account_info(ig_account_id, access_token)
            if account_result.get("success"):
                analytics_package["account_info"] = account_result.get("account", {})
                analytics_package["follower_count"] = account_result.get("account", {}).get("followers_count", 0)
            else:
                analytics_package["errors"].append({"step": "account_info", "error": account_result.get("error")})
            
            # 2. Fetch account insights
            logger.info("📊 Step 2/6: Fetching account insights...")
            insights_result = await self.get_account_insights(ig_account_id, access_token, period="day")
            if insights_result.get("success"):
                analytics_package["account_insights"] = insights_result.get("insights", {})
            else:
                analytics_package["errors"].append({"step": "account_insights", "error": insights_result.get("error")})
            
            # 3. Fetch media list
            logger.info("📸 Step 3/6: Fetching media list...")
            media_result = await self.get_media_list(ig_account_id, access_token, limit=50)
            if media_result.get("success"):
                analytics_package["media_list"] = media_result.get("media", [])
                
                # 4. Fetch insights for each media item
                logger.info(f"📊 Step 4/6: Fetching insights for {len(analytics_package['media_list'])} media items...")
                for media in analytics_package["media_list"]:
                    media_id = media.get("id")
                    media_type = media.get("media_type", "IMAGE")
                    
                    insights_result = await self.get_media_insights(media_id, access_token, media_type)
                    if insights_result.get("success"):
                        analytics_package["media_insights"].append({
                            "media_id": media_id,
                            "media_type": media_type,
                            "insights": insights_result.get("insights", {})
                        })
            else:
                analytics_package["errors"].append({"step": "media_list", "error": media_result.get("error")})
            
            # 5. Fetch stories
            logger.info("📖 Step 5/6: Fetching stories...")
            stories_result = await self.get_stories(ig_account_id, access_token)
            if stories_result.get("success"):
                analytics_package["stories"] = stories_result.get("stories", [])
                
                # Fetch insights for each story
                for story in analytics_package["stories"]:
                    story_id = story.get("id")
                    story_insights_result = await self.get_story_insights(story_id, access_token)
                    if story_insights_result.get("success"):
                        analytics_package["story_insights"].append({
                            "story_id": story_id,
                            "insights": story_insights_result.get("insights", {})
                        })
            else:
                analytics_package["errors"].append({"step": "stories", "error": stories_result.get("error")})
            
            # 6. Fetch audience insights
            logger.info("👥 Step 6/6: Fetching audience insights...")
            audience_result = await self.get_audience_insights(ig_account_id, access_token, period="lifetime")
            if audience_result.get("success"):
                analytics_package["audience_insights"] = audience_result.get("insights", {})
            else:
                analytics_package["errors"].append({"step": "audience_insights", "error": audience_result.get("error")})
            
            logger.info(f"✅ Complete analytics fetch finished")
            logger.info(f"   Account: @{analytics_package['account_info'].get('username', 'unknown')}")
            logger.info(f"   Followers: {analytics_package['follower_count']}")
            logger.info(f"   Media items: {len(analytics_package['media_list'])}")
            logger.info(f"   Stories: {len(analytics_package['stories'])}")
            logger.info(f"   Errors: {len(analytics_package['errors'])}")
            
            return analytics_package
            
        except Exception as e:
            logger.error(f"❌ Error in complete analytics fetch: {e}")
            return {
                "success": False,
                "error": str(e),
                "errors": [{"step": "complete_fetch", "error": str(e)}]
            }


# Create singleton instance
instagram_analytics_service = InstagramAnalyticsService()
