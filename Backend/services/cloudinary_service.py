"""
Cloudinary service for image uploads and management.
"""

import logging
from typing import Dict, Any, Optional
from config.settings import settings

logger = logging.getLogger(__name__)

# Try to import Cloudinary, handle gracefully if not installed
try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_AVAILABLE = True
except ImportError:
    logger.warning("Cloudinary package not installed. Image uploads will be disabled.")
    CLOUDINARY_AVAILABLE = False


class CloudinaryService:
    """Service for handling image uploads with Cloudinary."""

    def __init__(self):
        """Initialize Cloudinary configuration."""
        if CLOUDINARY_AVAILABLE:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )

    async def upload_video(
        self,
        file_data: bytes,
        filename: str,
        folder: str = "instagram_posts",
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Upload video to Cloudinary.
        
        Args:
            file_data: Video file bytes
            filename: Original filename
            folder: Cloudinary folder to store video
            user_id: User ID for organizing uploads
            
        Returns:
            Dict with upload result including public_id and secure_url
        """
        if not CLOUDINARY_AVAILABLE:
            return {
                "success": False,
                "error": "Cloudinary package not installed. Please install with: pip install cloudinary==1.36.0"
            }
            
        try:
            # Create unique public_id
            public_id = f"{folder}/{user_id or 'anonymous'}/{filename.split('.')[0]}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=public_id,
                folder=folder,
                resource_type="video",
                format="mp4",  # Convert to MP4 for Instagram compatibility
                quality="auto:good",  # Optimize quality
                transformation=[
                    {"width": 1080, "crop": "limit"},  # Limit width to 1080px
                    {"quality": "auto:good"}
                ]
            )
            
            logger.info(f"Successfully uploaded video: {result['public_id']}")
            
            return {
                "success": True,
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "url": result["url"],
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result["format"],
                "bytes": result["bytes"],
                "duration": result.get("duration")  # Video duration in seconds
            }
            
        except Exception as e:
            logger.error(f"Error uploading video to Cloudinary: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def upload_image(
        self,
        file_data: bytes,
        filename: str,
        folder: str = "instagram_posts",
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Upload image to Cloudinary.
        
        Args:
            file_data: Image file bytes
            filename: Original filename
            folder: Cloudinary folder to store image
            user_id: User ID for organizing uploads
            
        Returns:
            Dict with upload result including public_id and secure_url
        """
        if not CLOUDINARY_AVAILABLE:
            return {
                "success": False,
                "error": "Cloudinary package not installed. Please install with: pip install cloudinary==1.36.0"
            }
            
        try:
            # Create unique public_id
            public_id = f"{folder}/{user_id or 'anonymous'}/{filename.split('.')[0]}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_data,
                public_id=public_id,
                folder=folder,
                resource_type="image",
                format="jpg",  # Convert to JPG for Instagram compatibility
                quality="auto:good",  # Optimize quality
                fetch_format="auto",  # Auto-select best format
                transformation=[
                    {"width": 1080, "height": 1080, "crop": "fill"},  # Instagram square format
                    {"quality": "auto:good"}
                ]
            )
            
            logger.info(f"Successfully uploaded image: {result['public_id']}")
            
            return {
                "success": True,
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "url": result["url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "bytes": result["bytes"]
            }
            
        except Exception as e:
            logger.error(f"Error uploading image to Cloudinary: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def upload_image_from_url(
        self,
        image_url: str,
        folder: str = "instagram_posts",
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Upload image from URL to Cloudinary.
        
        Args:
            image_url: URL of the image to upload
            folder: Cloudinary folder to store image
            user_id: User ID for organizing uploads
            
        Returns:
            Dict with upload result
        """
        try:
            # Create unique public_id
            public_id = f"{folder}/{user_id or 'anonymous'}/url_upload_{hash(image_url)}"
            
            # Upload from URL
            result = cloudinary.uploader.upload(
                image_url,
                public_id=public_id,
                folder=folder,
                resource_type="image",
                format="jpg",
                quality="auto:good",
                transformation=[
                    {"width": 1080, "height": 1080, "crop": "fill"},
                    {"quality": "auto:good"}
                ]
            )
            
            logger.info(f"Successfully uploaded image from URL: {result['public_id']}")
            
            return {
                "success": True,
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "url": result["url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "bytes": result["bytes"]
            }
            
        except Exception as e:
            logger.error(f"Error uploading image from URL to Cloudinary: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def delete_image(self, public_id: str) -> Dict[str, Any]:
        """
        Delete image from Cloudinary.
        
        Args:
            public_id: Cloudinary public ID of the image
            
        Returns:
            Dict with deletion result
        """
        if not CLOUDINARY_AVAILABLE:
            return {
                "success": False,
                "error": "Cloudinary package not installed"
            }
            
        try:
            result = cloudinary.uploader.destroy(public_id)
            
            logger.info(f"Successfully deleted image: {public_id}")
            
            return {
                "success": True,
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Error deleting image from Cloudinary: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def get_image_info(self, public_id: str) -> Dict[str, Any]:
        """
        Get image information from Cloudinary.
        
        Args:
            public_id: Cloudinary public ID of the image
            
        Returns:
            Dict with image information
        """
        if not CLOUDINARY_AVAILABLE:
            return {
                "success": False,
                "error": "Cloudinary package not installed"
            }
            
        try:
            result = cloudinary.api.resource(public_id)
            
            return {
                "success": True,
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "url": result["url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "bytes": result["bytes"],
                "created_at": result["created_at"]
            }
            
        except Exception as e:
            logger.error(f"Error getting image info from Cloudinary: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_upload_signature(
        self,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate upload signature for client-side uploads.
        
        Args:
            params: Upload parameters
            
        Returns:
            Dict with signature and timestamp
        """
        try:
            timestamp = cloudinary.utils.now()
            signature = cloudinary.utils.api_sign_request(
                params,
                settings.CLOUDINARY_API_SECRET
            )
            
            return {
                "success": True,
                "signature": signature,
                "timestamp": timestamp,
                "api_key": settings.CLOUDINARY_API_KEY,
                "cloud_name": settings.CLOUDINARY_CLOUD_NAME
            }
            
        except Exception as e:
            logger.error(f"Error generating upload signature: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Create singleton instance
cloudinary_service = CloudinaryService()