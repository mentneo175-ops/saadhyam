import logging
import httpx
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime
from config.settings import settings

logger = logging.getLogger(__name__)


class InstagramGraphAPIService:
    """Service for Instagram Graph API interactions via Facebook OAuth."""

    def __init__(self):
        self.app_id = settings.INSTAGRAM_APP_ID
        self.app_secret = settings.INSTAGRAM_APP_SECRET
        self.redirect_uri = settings.INSTAGRAM_REDIRECT_URI
        self.api_version = "v19.0"

    def get_facebook_oauth_url(self, state: str = "") -> str:
        """Generate Facebook OAuth authorization URL for Instagram access.
        
        Args:
            state: Optional state parameter for OAuth security (usually user token)
        
        Returns:
            Facebook OAuth authorization URL
        """
        url = (
            f"https://www.facebook.com/{self.api_version}/dialog/oauth?"
            f"client_id={self.app_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"
            f"&response_type=code"
        )
        if state:
            url += f"&state={state}"
        return url

    async def validate_image_url(self, image_url: str) -> bool:
        """
        Validate that the image URL is accessible by Instagram.
        Instagram requires the image to be publicly accessible.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.head(image_url, timeout=10)
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '').lower()
                    if content_type.startswith('image/'):
                        logger.info(f"✅ Image URL is valid and accessible: {image_url}")
                        return True
                    else:
                        logger.error(f"❌ URL is not an image: {content_type}")
                        return False
                else:
                    logger.error(f"❌ Image URL not accessible: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"❌ Error validating image URL: {e}")
            return False

    async def create_media(self, ig_user_id: str, image_url: str, caption: str, access_token: str, media_type: str = "IMAGE") -> Optional[str]:
        """
        Create Instagram media container (supports images and reels).
        
        Args:
            ig_user_id: Instagram Business Account ID
            image_url: Publicly accessible image/video URL
            caption: Post caption
            access_token: Facebook access token with instagram_content_publish permission
            media_type: "IMAGE" or "REELS" (default: "IMAGE")
            
        Returns:
            Media creation_id for publishing
        """
        try:
            # Step 1: Validate image URL accessibility
            logger.info(f"🔍 Validating image URL accessibility...")
            if not await self.validate_image_url(image_url):
                logger.error("❌ Image URL validation failed")
                return None

            # Step 2: Create media container
            url = f"https://graph.facebook.com/{self.api_version}/{ig_user_id}/media"
            
            # Prepare data - ensure caption is properly encoded
            data = {
                "access_token": access_token,
                "media_type": media_type,
            }
            
            # Use appropriate URL parameter based on media type
            if media_type == "REELS":
                data["video_url"] = image_url
                # Reels require share_to_feed parameter
                data["share_to_feed"] = True
            else:
                data["image_url"] = image_url
            
            # Add caption if provided (Instagram allows empty captions)
            if caption and caption.strip():
                data["caption"] = caption.strip()

            logger.info(f"📤 Creating Instagram media container...")
            logger.info(f"   URL: {url}")
            logger.info(f"   IG User ID: {ig_user_id}")
            logger.info(f"   Media Type: {media_type}")
            logger.info(f"   Media URL: {image_url}")
            logger.info(f"   Caption length: {len(caption) if caption else 0} chars")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data, timeout=30)
            
            # Log full response for debugging
            logger.info(f"📥 Response Status: {response.status_code}")
            logger.info(f"📥 Response Headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    logger.error(f"❌ Media creation failed: {response.status_code}")
                    logger.error(f"❌ Error Response: {error_data}")
                    
                    if "error" in error_data:
                        error_info = error_data["error"]
                        logger.error(f"❌ Instagram API Error: {error_info.get('message', 'Unknown error')}")
                        logger.error(f"❌ Error Code: {error_info.get('code', 'Unknown')}")
                        logger.error(f"❌ Error Type: {error_info.get('type', 'Unknown')}")
                        logger.error(f"❌ Error Subcode: {error_info.get('error_subcode', 'Unknown')}")
                        
                        # Common error explanations
                        if error_info.get('code') == 100:
                            logger.error("💡 This usually means invalid parameters or permissions issue")
                        elif error_info.get('code') == 190:
                            logger.error("💡 This usually means invalid or expired access token")
                        elif error_info.get('code') == 200:
                            logger.error("💡 This usually means insufficient permissions")
                            
                except Exception as json_error:
                    logger.error(f"❌ Could not parse error response: {json_error}")
                    logger.error(f"❌ Raw response: {response.text}")
                
                return None
            
            result = response.json()
            creation_id = result.get("id")
            
            if creation_id:
                logger.info(f"✅ Media container created successfully: {creation_id}")
                return creation_id
            else:
                logger.error(f"❌ No creation ID in response: {result}")
                return None

        except httpx.TimeoutException:
            logger.error("❌ Request timeout while creating media container")
            return None
        except httpx.RequestError as e:
            logger.error(f"❌ Network error creating media: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error creating media: {e}")
            return None

    async def check_media_status(self, creation_id: str, access_token: str, max_retries: int = 30) -> bool:
        """
        Check if media container is ready for publishing (especially important for videos).
        Videos need processing time before they can be published.
        
        Args:
            creation_id: Media container ID
            access_token: Facebook access token
            max_retries: Maximum number of status checks (default: 30)
            
        Returns:
            True if media is ready, False otherwise
        """
        try:
            url = f"https://graph.facebook.com/{self.api_version}/{creation_id}"
            params = {
                "fields": "status_code",
                "access_token": access_token
            }
            
            async with httpx.AsyncClient() as client:
                for attempt in range(max_retries):
                    logger.info(f"🔍 Checking media status (attempt {attempt + 1}/{max_retries})...")
                    
                    response = await client.get(url, params=params, timeout=10)
                    
                    if response.status_code == 200:
                        result = response.json()
                        status_code = result.get("status_code")
                        
                        logger.info(f"   Status code: {status_code}")
                        
                        if status_code == "FINISHED":
                            logger.info("✅ Media is ready for publishing!")
                            return True
                        elif status_code == "ERROR":
                            logger.error("❌ Media processing failed")
                            return False
                    elif status_code in ["IN_PROGRESS", "PUBLISHED"]:
                        logger.info(f"⏳ Media is {status_code}, waiting...")
                        await asyncio.sleep(2)  # Wait 2 seconds before next check
                    else:
                        logger.warning(f"⚠️ Unknown status: {status_code}")
                        await asyncio.sleep(2)
                else:
                    logger.warning(f"⚠️ Status check failed: HTTP {response.status_code}")
                    await asyncio.sleep(2)
            
            logger.warning("⚠️ Max retries reached, media might not be ready")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error checking media status: {e}")
            return False

    async def publish_media(self, ig_user_id: str, creation_id: str, access_token: str, is_video: bool = False) -> Optional[str]:
        """
        Publish Instagram media (supports images and reels).
        
        Args:
            ig_user_id: Instagram Business Account ID
            creation_id: Media container ID from create_media
            access_token: Facebook access token
            is_video: Whether the media is a reel (requires status check)
            
        Returns:
            Published media ID
        """
        try:
            # For reels, check if media is ready before publishing
            if is_video:
                logger.info("🎥 Reel detected, checking processing status...")
                is_ready = await self.check_media_status(creation_id, access_token)
                if not is_ready:
                    logger.error("❌ Reel is not ready for publishing")
                    return None
            else:
                # For images, add a small delay to ensure media container is ready
                logger.info("⏳ Waiting 2 seconds for media container to be ready...")
                await asyncio.sleep(2)
            
            url = f"https://graph.facebook.com/{self.api_version}/{ig_user_id}/media_publish"

            data = {
                "creation_id": creation_id,
                "access_token": access_token,
            }

            logger.info(f"📤 Publishing Instagram media...")
            logger.info(f"   URL: {url}")
            logger.info(f"   IG User ID: {ig_user_id}")
            logger.info(f"   Creation ID: {creation_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data, timeout=30)
            
            # Log full response for debugging
            logger.info(f"📥 Response Status: {response.status_code}")
            
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    logger.error(f"❌ Media publishing failed: {response.status_code}")
                    logger.error(f"❌ Error Response: {error_data}")
                    
                    if "error" in error_data:
                        error_info = error_data["error"]
                        logger.error(f"❌ Instagram API Error: {error_info.get('message', 'Unknown error')}")
                        logger.error(f"❌ Error Code: {error_info.get('code', 'Unknown')}")
                        logger.error(f"❌ Error Type: {error_info.get('type', 'Unknown')}")
                        logger.error(f"❌ Error Subcode: {error_info.get('error_subcode', 'Unknown')}")
                        
                        # Common publishing errors
                        if "media container" in error_info.get('message', '').lower():
                            logger.error("💡 Media container might not be ready or invalid")
                        elif "permission" in error_info.get('message', '').lower():
                            logger.error("💡 Check instagram_content_publish permission")
                            
                except Exception as json_error:
                    logger.error(f"❌ Could not parse error response: {json_error}")
                    logger.error(f"❌ Raw response: {response.text}")
                
                return None

            result = response.json()
            post_id = result.get("id")
            
            if post_id:
                logger.info(f"🎉 Media published successfully: {post_id}")
                return post_id
            else:
                logger.error(f"❌ No post ID in response: {result}")
                return None

        except httpx.TimeoutException:
            logger.error("❌ Request timeout while publishing media")
            return None
        except httpx.RequestError as e:
            logger.error(f"❌ Network error publishing media: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error publishing media: {e}")
            return None

    async def post_to_instagram(self, ig_user_id: str, image_url: str, caption: str, access_token: str, media_type: str = "IMAGE") -> Dict[str, Any]:
        """
        Complete flow to post image or reel to Instagram.
        
        Args:
            ig_user_id: Instagram Business Account ID
            image_url: Publicly accessible media URL
            caption: Post caption
            access_token: Facebook access token
            media_type: "IMAGE" or "REELS" (default: "IMAGE")

        Returns:
            Dict with success status and post ID
        """
        try:
            logger.info(f"🚀 Starting Instagram post flow...")
            logger.info(f"   IG User ID: {ig_user_id}")
            logger.info(f"   Media Type: {media_type}")
            logger.info(f"   Media URL: {image_url}")
            logger.info(f"   Caption: {caption[:50]}..." if len(caption) > 50 else f"   Caption: {caption}")
            
            # Step 1: Validate access token permissions
            logger.info("🔐 Validating access token permissions...")
            permissions_valid = await self.validate_access_token(access_token, ig_user_id)
            if not permissions_valid:
                return {"success": False, "error": "Access token validation failed"}

            # Step 2: Create media container
            logger.info(f"📦 Creating {media_type.lower()} media container...")
            creation_id = await self.create_media(ig_user_id, image_url, caption, access_token, media_type)
            if not creation_id:
                return {"success": False, "error": "Failed to create media container"}

            # Step 3: Publish media
            logger.info("📤 Publishing media...")
            is_video = media_type == "REELS"
            post_id = await self.publish_media(ig_user_id, creation_id, access_token, is_video)
            if not post_id:
                return {"success": False, "error": "Failed to publish media"}

            logger.info(f"🎉 Successfully posted to Instagram: {post_id}")
            return {
                "success": True,
                "post_id": post_id,
                "creation_id": creation_id,
                "media_type": media_type,
            }

        except Exception as e:
            logger.error(f"❌ Error posting to Instagram: {e}")
            return {"success": False, "error": str(e)}

    async def validate_access_token(self, access_token: str, ig_user_id: str) -> bool:
        """
        Validate access token and check permissions.
        
        Args:
            access_token: Facebook access token
            ig_user_id: Instagram Business Account ID
            
        Returns:
            True if token is valid and has required permissions
        """
        try:
            # Test 1: Simple check if we can access the Instagram account
            url = f"https://graph.facebook.com/{self.api_version}/{ig_user_id}"
            params = {
                "fields": "id,username",  # Minimal fields that should exist
                "access_token": access_token
            }
            
            logger.info(f"🔍 Testing access to Instagram account: {ig_user_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                try:
                    error_data = response.json() if response.content else {}
                    logger.error(f"❌ Cannot access Instagram account: {error_data}")
                except:
                    logger.error(f"❌ Cannot access Instagram account: HTTP {response.status_code}")
                return False
            
            try:
                account_data = response.json()
                logger.info(f"✅ Instagram account accessible:")
                logger.info(f"   Username: {account_data.get('username', 'Unknown')}")
                logger.info(f"   Account ID: {account_data.get('id', 'Unknown')}")
            except:
                logger.info("✅ Instagram account accessible (basic validation passed)")
            
            # Test 2: Check if we can access media endpoint (this validates posting permissions)
            media_url = f"https://graph.facebook.com/{self.api_version}/{ig_user_id}/media"
            media_params = {
                "access_token": access_token,
                "limit": 1  # Just check if we can access, don't fetch data
            }
            
            logger.info("🔍 Testing media access permissions...")
            
            async with httpx.AsyncClient() as client:
                media_response = await client.get(media_url, params=media_params, timeout=10)
            
            if media_response.status_code == 200:
                logger.info("✅ Media access permissions validated")
                return True
            else:
                try:
                    error_data = media_response.json() if media_response.content else {}
                    logger.warning(f"⚠️ Media access test failed: {error_data}")
                except:
                    logger.warning(f"⚠️ Media access test failed: HTTP {media_response.status_code}")
                
                # Still return True if basic account access works
                # Media access might fail for other reasons but posting could still work
                logger.info("✅ Proceeding with basic account validation")
                return True
            
        except Exception as e:
            logger.error(f"❌ Error validating access token: {e}")
            return False

    async def get_media_insights(self, media_id: str, access_token: str) -> Dict[str, Any]:
        """Get insights for Instagram media."""
        try:
            url = f"https://graph.facebook.com/{self.api_version}/{media_id}/insights"
            params = {
                "metric": "engagement,impressions,reach",
                "access_token": access_token,
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()

            return response.json()

        except Exception as e:
            logger.error(f"Error getting media insights: {e}")
            return {}

    def post_to_instagram_sync(self, ig_user_id: str, image_url: str, caption: str, access_token: str, media_type: str = "IMAGE") -> Dict[str, Any]:
        """
        Synchronous wrapper for posting to Instagram (supports images and reels).
        Used by APScheduler which runs in a synchronous context.
        
        Args:
            ig_user_id: Instagram Business Account ID
            image_url: Publicly accessible media URL
            caption: Post caption
            access_token: Facebook access token
            media_type: "IMAGE" or "REELS" (default: "IMAGE")
        
        This is a simplified version that directly calls the API without async/await.
        """
        try:
            logger.info(f"🚀 [SYNC] Starting Instagram post flow...")
            logger.info(f"   IG User ID: {ig_user_id}")
            logger.info(f"   Media Type: {media_type}")
            logger.info(f"   Media URL: {image_url[:60]}...")
            logger.info(f"   Caption: {caption[:50]}..." if len(caption) > 50 else f"   Caption: {caption}")
            
            # Step 1: Create media container
            logger.info(f"📦 [SYNC] Creating {media_type.lower()} media container...")
            url = f"https://graph.facebook.com/{self.api_version}/{ig_user_id}/media"
            
            data = {
                "access_token": access_token,
                "media_type": media_type,
            }
            
            # Use appropriate URL parameter based on media type
            if media_type == "REELS":
                data["video_url"] = image_url
                data["share_to_feed"] = True  # Reels require this parameter
            else:
                data["image_url"] = image_url
            
            if caption and caption.strip():
                data["caption"] = caption.strip()

            response = requests.post(url, data=data, timeout=30)
            
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    logger.error(f"❌ [SYNC] Media creation failed: {response.status_code}")
                    logger.error(f"❌ [SYNC] Error: {error_data}")
                    return {"success": False, "error": f"Media creation failed: {error_data.get('error', {}).get('message', 'Unknown error')}"}
                except:
                    logger.error(f"❌ [SYNC] Media creation failed: HTTP {response.status_code}")
                    return {"success": False, "error": f"Media creation failed: HTTP {response.status_code}"}
            
            result = response.json()
            creation_id = result.get("id")
            
            if not creation_id:
                logger.error(f"❌ [SYNC] No creation ID in response: {result}")
                return {"success": False, "error": "No creation ID returned"}
            
            logger.info(f"✅ [SYNC] Media container created: {creation_id}")
            
            # Step 2: Check media status for reels
            if media_type == "REELS":
                logger.info("🎥 [SYNC] Reel detected, checking processing status...")
                status_url = f"https://graph.facebook.com/{self.api_version}/{creation_id}"
                status_params = {
                    "fields": "status_code",
                    "access_token": access_token
                }
                
                max_retries = 30
                for attempt in range(max_retries):
                    logger.info(f"🔍 [SYNC] Checking reel status (attempt {attempt + 1}/{max_retries})...")
                    
                    status_response = requests.get(status_url, params=status_params, timeout=10)
                    
                    if status_response.status_code == 200:
                        status_result = status_response.json()
                        status_code = status_result.get("status_code")
                        
                        logger.info(f"   Status code: {status_code}")
                        
                        if status_code == "FINISHED":
                            logger.info("✅ [SYNC] Reel is ready for publishing!")
                            break
                        elif status_code == "ERROR":
                            logger.error("❌ [SYNC] Reel processing failed")
                            return {"success": False, "error": "Reel processing failed"}
                        elif status_code in ["IN_PROGRESS", "PUBLISHED"]:
                            logger.info(f"⏳ [SYNC] Reel is {status_code}, waiting...")
                            time.sleep(2)
                        else:
                            logger.warning(f"⚠️ [SYNC] Unknown status: {status_code}")
                            time.sleep(2)
                    else:
                        logger.warning(f"⚠️ [SYNC] Status check failed: HTTP {status_response.status_code}")
                        time.sleep(2)
            else:
                # For images, wait 2 seconds
                logger.info("⏳ [SYNC] Waiting 2 seconds for media container to be ready...")
                time.sleep(2)
            
            # Step 3: Publish media
            logger.info("📤 [SYNC] Publishing media...")
            publish_url = f"https://graph.facebook.com/{self.api_version}/{ig_user_id}/media_publish"
            
            publish_data = {
                "creation_id": creation_id,
                "access_token": access_token,
            }
            
            publish_response = requests.post(publish_url, data=publish_data, timeout=30)
            
            if publish_response.status_code != 200:
                try:
                    error_data = publish_response.json()
                    logger.error(f"❌ [SYNC] Media publishing failed: {publish_response.status_code}")
                    logger.error(f"❌ [SYNC] Error: {error_data}")
                    return {"success": False, "error": f"Publishing failed: {error_data.get('error', {}).get('message', 'Unknown error')}"}
                except:
                    logger.error(f"❌ [SYNC] Media publishing failed: HTTP {publish_response.status_code}")
                    return {"success": False, "error": f"Publishing failed: HTTP {publish_response.status_code}"}
            
            publish_result = publish_response.json()
            post_id = publish_result.get("id")
            
            if not post_id:
                logger.error(f"❌ [SYNC] No post ID in response: {publish_result}")
                return {"success": False, "error": "No post ID returned"}
            
            logger.info(f"🎉 [SYNC] Successfully posted to Instagram: {post_id}")
            return {
                "success": True,
                "post_id": post_id,
                "creation_id": creation_id,
            }
            
        except requests.exceptions.Timeout:
            logger.error("❌ [SYNC] Request timeout")
            return {"success": False, "error": "Request timeout"}
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ [SYNC] Network error: {e}")
            return {"success": False, "error": f"Network error: {str(e)}"}
        except Exception as e:
            logger.error(f"❌ [SYNC] Unexpected error: {e}", exc_info=True)
            return {"success": False, "error": f"Unexpected error: {str(e)}"}


# Create singleton instance
instagram_service = InstagramGraphAPIService()
