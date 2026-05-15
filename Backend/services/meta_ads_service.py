"""
Meta Marketing API Service
Complete integration with Meta Marketing API for campaign management
"""

import os
import logging
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.meta_ads import (
    MetaAccount, AdCampaign, AdSet, AdCreative, Ad,
    CampaignObjective, CampaignStatus, AdSetStatus, AdStatus
)

logger = logging.getLogger(__name__)


class MetaAdsService:
    """Service for Meta Marketing API operations"""
    
    def __init__(self):
        self.graph_api_version = "v21.0"
        self.graph_api_base = f"https://graph.facebook.com/{self.graph_api_version}"
    
    async def create_campaign(
        self,
        db: Session,
        meta_account: MetaAccount,
        campaign_name: str,
        objective: CampaignObjective,
        status: CampaignStatus = CampaignStatus.PAUSED,
        special_ad_categories: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new Meta Ad Campaign
        
        Args:
            meta_account: Meta account to create campaign in
            campaign_name: Name of the campaign
            objective: Campaign objective (OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, etc.)
            status: Initial status (default: PAUSED)
            special_ad_categories: For compliance (e.g., ["CREDIT", "EMPLOYMENT", "HOUSING"])
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/campaigns"
            
            # Meta API v21+ requirements
            payload = {
                "name": campaign_name,
                "objective": objective.value,
                "status": status.value,
                "special_ad_categories": [],  # Empty array for non-special ads
                "is_adset_budget_sharing_enabled": False,  # Required in v21+ when not using campaign budget
                "access_token": access_token,
            }
            
            logger.info(f"📤 Creating campaign with payload: {payload}")
            
            # Send as JSON instead of form data
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"✅ Campaign created successfully!")
            logger.info(f"   Campaign ID: {data.get('id')}")
            logger.info(f"   Campaign Name: {campaign_name}")
            logger.info(f"   Response: {data}")
            
            return data
            
        except requests.exceptions.HTTPError as e:
            # Log the full error response from Meta
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json()
                logger.error(f"Meta API Error: {error_detail}")
            except:
                error_detail = e.response.text
                logger.error(f"Meta API Error (raw): {error_detail}")
            
            logger.error(f"Failed to create campaign: {e}")
            raise Exception(f"Meta API error: {error_detail}")
            
        except Exception as e:
            logger.error(f"Failed to create campaign: {e}")
            raise
    
    async def create_ad_set(
        self,
        db: Session,
        meta_account: MetaAccount,
        campaign_id: str,
        adset_name: str,
        targeting: Dict[str, Any],
        daily_budget: Optional[int] = None,
        lifetime_budget: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        optimization_goal: str = "REACH",
        billing_event: str = "IMPRESSIONS",
        bid_strategy: str = "LOWEST_COST_WITHOUT_CAP",
        status: AdSetStatus = AdSetStatus.PAUSED,
    ) -> Dict[str, Any]:
        """
        Create a new Ad Set
        
        Args:
            campaign_id: Meta campaign ID
            adset_name: Name of the ad set
            targeting: Targeting specification (age, gender, location, interests, etc.)
            daily_budget: Daily budget in cents (e.g., 50000 = $500 or ₹500)
            lifetime_budget: Lifetime budget in cents
            optimization_goal: REACH, IMPRESSIONS, LINK_CLICKS, etc.
            billing_event: IMPRESSIONS, LINK_CLICKS, etc.
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/adsets"
            
            payload = {
                "name": adset_name,
                "campaign_id": campaign_id,
                "targeting": targeting,
                "optimization_goal": optimization_goal,
                "billing_event": billing_event,
                "bid_strategy": bid_strategy,
                "status": status.value,
                "access_token": access_token,
            }
            
            # Budget (must have either daily or lifetime, not both)
            # For daily budget: DO NOT include start_time or end_time
            # For lifetime budget: MUST include start_time and end_time
            if daily_budget:
                payload["daily_budget"] = daily_budget
                # Note: daily_budget campaigns run indefinitely until manually stopped
                # Do NOT add start_time or end_time for daily budget
            elif lifetime_budget:
                payload["lifetime_budget"] = lifetime_budget
                # Lifetime budget REQUIRES start_time and end_time as Unix timestamps
                if start_time:
                    payload["start_time"] = int(start_time.timestamp())
                if end_time:
                    payload["end_time"] = int(end_time.timestamp())
            
            logger.info(f"📤 Creating ad set with payload:")
            logger.info(f"   Budget: {daily_budget or lifetime_budget} cents")
            logger.info(f"   Targeting: {targeting}")
            logger.info(f"   Full payload: {payload}")
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"✅ Ad Set created successfully!")
            logger.info(f"   Ad Set ID: {data.get('id')}")
            logger.info(f"   Response: {data}")
            return data
            
        except requests.exceptions.HTTPError as e:
            # Log the full error response from Meta
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json()
                logger.error(f"Meta API Error (Ad Set): {error_detail}")
            except:
                error_detail = e.response.text
                logger.error(f"Meta API Error (Ad Set - raw): {error_detail}")
            
            logger.error(f"Failed to create ad set: {e}")
            raise Exception(f"Meta API error: {error_detail}")
            
        except Exception as e:
            logger.error(f"Failed to create ad set: {e}")
            raise
    
    async def upload_image(
        self,
        meta_account: MetaAccount,
        image_url: str,
    ) -> Dict[str, Any]:
        """
        Upload image to Meta and get image hash
        
        Args:
            image_url: URL of the image (e.g., Cloudinary URL)
        
        Returns:
            {"hash": "...", "url": "..."}
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            # Validate URL
            if not image_url or not image_url.startswith('http'):
                raise ValueError(f"Invalid image URL: {image_url}")
            
            logger.info(f"📤 Uploading image from URL: {image_url}")
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/adimages"
            
            # Use Meta's direct URL upload (not file upload)
            payload = {
                "url": image_url,
                "access_token": access_token,
            }
            
            response = requests.post(url, data=payload)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"📥 Image upload response: {result}")
            
            # Extract image hash
            images = result.get('images', {})
            if images:
                first_key = list(images.keys())[0]
                image_hash = images[first_key].get('hash')
                
                logger.info(f"✅ Image uploaded successfully!")
                logger.info(f"   Image hash: {image_hash}")
                logger.info(f"   Image URL: {images[first_key].get('url')}")
                
                return {"hash": image_hash, "url": images[first_key].get('url')}
            
            raise Exception("No image hash returned from Meta API")
            
        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json()
                logger.error(f"Meta API Error (Image Upload): {error_detail}")
            except:
                error_detail = e.response.text
                logger.error(f"Meta API Error (Image Upload - raw): {error_detail}")
            
            logger.error(f"Failed to upload image: {e}")
            raise Exception(f"Meta API error: {error_detail}")
            
        except Exception as e:
            logger.error(f"Failed to upload image: {e}")
            raise
    
    async def upload_video(
        self,
        meta_account: MetaAccount,
        video_url: str,
    ) -> Dict[str, Any]:
        """
        Upload video to Meta and get video ID
        
        Args:
            video_url: URL of the video (e.g., Cloudinary URL)
        
        Returns:
            {"id": "..."}
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            # Validate URL
            if not video_url or not video_url.startswith('http'):
                raise ValueError(f"Invalid video URL: {video_url}")
            
            logger.info(f"📤 Uploading video from URL: {video_url}")
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/advideos"
            
            # Use Meta's direct URL upload (not file upload)
            payload = {
                "file_url": video_url,
                "access_token": access_token,
            }
            
            response = requests.post(url, data=payload)
            response.raise_for_status()
            
            result = response.json()
            video_id = result.get('id')
            
            logger.info(f"✅ Video uploaded successfully!")
            logger.info(f"   Video ID: {video_id}")
            
            return {"id": video_id}
            
        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json()
                logger.error(f"Meta API Error (Video Upload): {error_detail}")
            except:
                error_detail = e.response.text
                logger.error(f"Meta API Error (Video Upload - raw): {error_detail}")
            
            logger.error(f"Failed to upload video: {e}")
            raise Exception(f"Meta API error: {error_detail}")
            
        except Exception as e:
            logger.error(f"Failed to upload video: {e}")
            raise
    
    async def create_ad_creative_from_post(
        self,
        meta_account: MetaAccount,
        creative_name: str,
        instagram_media_id: Optional[str] = None,
        facebook_post_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create Ad Creative from existing Instagram/Facebook post
        
        This is the recommended approach for MVP as it:
        - Doesn't require /adimages API permission
        - Uses existing published content
        - More stable and production-friendly
        
        Args:
            creative_name: Name of the creative
            instagram_media_id: Instagram media ID (if promoting Instagram post)
            facebook_post_id: Facebook post ID (if promoting Facebook post)
        
        Returns:
            {"id": "creative_id"}
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/adcreatives"
            
            logger.info(f"📤 Creating ad creative from existing post")
            logger.info(f"   Instagram Media ID: {instagram_media_id}")
            logger.info(f"   Facebook Post ID: {facebook_post_id}")
            
            # Build payload using existing post
            payload = {
                "name": creative_name,
                "access_token": access_token,
            }
            
            # Use Instagram media if available
            if instagram_media_id:
                # For Instagram posts, we need to use the media ID directly
                # The correct approach is to use object_story_id with the Instagram media ID
                # Format: instagram_business_account_id_media_id
                try:
                    # Try using the media ID directly as object_story_id
                    payload["object_story_id"] = f"{meta_account.instagram_business_id}_{instagram_media_id}"
                    logger.info(f"   Using Instagram media creative with object_story_id")
                except Exception as e:
                    logger.warning(f"   Failed to create with object_story_id: {e}")
                    # Fallback: use simple image-based creative
                    payload["object_story_spec"] = {
                        "page_id": meta_account.page_id,
                    }
                    logger.info(f"   Using fallback page-based creative")
                
            elif facebook_post_id:
                # For Facebook posts, use object_story_id directly
                payload["object_story_id"] = facebook_post_id
                logger.info(f"   Using Facebook post creative: {facebook_post_id}")
            
            else:
                raise ValueError("Either instagram_media_id or facebook_post_id must be provided")
            
            logger.info(f"   Creative payload: {payload}")
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"✅ Ad Creative created successfully!")
            logger.info(f"   Creative ID: {data.get('id')}")
            logger.info(f"   Response: {data}")
            
            return data
            
        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            try:
                error_detail = e.response.json()
                logger.error(f"Meta API Error (Creative): {error_detail}")
            except:
                error_detail = e.response.text
                logger.error(f"Meta API Error (Creative - raw): {error_detail}")
            
            logger.error(f"Failed to create ad creative: {e}")
            raise Exception(f"Meta API error: {error_detail}")
            
        except Exception as e:
            logger.error(f"Failed to create ad creative: {e}")
            raise
    
    async def create_ad(
        self,
        meta_account: MetaAccount,
        ad_name: str,
        adset_id: str,
        creative_id: str,
        status: AdStatus = AdStatus.PAUSED,
    ) -> Dict[str, Any]:
        """Create Ad"""
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/ads"
            
            payload = {
                "name": ad_name,
                "adset_id": adset_id,
                "creative": {"creative_id": creative_id},
                "status": status.value,
                "access_token": access_token,
            }
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"✅ Ad created: {data.get('id')}")
            return data
            
        except Exception as e:
            logger.error(f"Failed to create ad: {e}")
            raise
    
    async def update_campaign_status(
        self,
        meta_account: MetaAccount,
        campaign_id: str,
        status: CampaignStatus,
    ) -> bool:
        """Update campaign status (pause/resume/delete)"""
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{campaign_id}"
            
            payload = {
                "status": status.value,
                "access_token": access_token,
            }
            
            response = requests.post(url, data=payload)
            response.raise_for_status()
            
            logger.info(f"✅ Campaign {campaign_id} status updated to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update campaign status: {e}")
            return False
    
    async def get_campaign_insights(
        self,
        meta_account: MetaAccount,
        campaign_id: str,
        date_preset: str = "last_7d",
    ) -> Dict[str, Any]:
        """
        Get campaign analytics/insights
        
        Args:
            campaign_id: Meta campaign ID
            date_preset: last_7d, last_14d, last_30d, lifetime, etc.
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{campaign_id}/insights"
            
            params = {
                "access_token": access_token,
                "date_preset": date_preset,
                "fields": ",".join([
                    "impressions",
                    "clicks",
                    "reach",
                    "spend",
                    "cpc",
                    "cpm",
                    "ctr",
                    "actions",
                    "action_values",
                    "cost_per_action_type",
                ]),
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("data"):
                return data["data"][0]
            
            return {}
            
        except Exception as e:
            logger.error(f"Failed to get campaign insights: {e}")
            return {}
    
    async def get_audience_size_estimate(
        self,
        meta_account: MetaAccount,
        targeting: Dict[str, Any],
        optimization_goal: str = "REACH",
    ) -> Dict[str, Any]:
        """
        Get estimated audience size for targeting spec
        
        Returns:
            {
                "estimate_ready": true,
                "users": 1500000,
                "estimate_dau": 500000,
                "estimate_mau": 1500000
            }
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/{meta_account.ad_account_id}/delivery_estimate"
            
            payload = {
                "targeting_spec": targeting,
                "optimization_goal": optimization_goal,
                "access_token": access_token,
            }
            
            response = requests.get(url, params=payload)
            response.raise_for_status()
            
            data = response.json()
            return data.get("data", [{}])[0]
            
        except Exception as e:
            logger.error(f"Failed to get audience estimate: {e}")
            return {}
    
    async def search_targeting_interests(
        self,
        meta_account: MetaAccount,
        query: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search for targeting interests
        
        Example: query="fitness" returns interests like "Physical fitness", "Gym", etc.
        """
        try:
            from services.meta_oauth_service import meta_oauth_service
            access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
            
            url = f"{self.graph_api_base}/search"
            
            params = {
                "type": "adinterest",
                "q": query,
                "limit": limit,
                "access_token": access_token,
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("data", [])
            
        except Exception as e:
            logger.error(f"Failed to search interests: {e}")
            return []


# Singleton instance
meta_ads_service = MetaAdsService()
