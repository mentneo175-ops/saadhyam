"""
User API Keys Management Routes
Allows users to add, view, test, and manage their personal API keys for social media platforms
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging
from datetime import datetime
import json
import asyncio
import aiohttp

from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from models.user_api_keys import UserAPIKeys, APIKeyTemplate
from services.encryption_service import EncryptionService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user-api-keys", tags=["user-api-keys"])

# Initialize encryption service
encryption_service = EncryptionService()

# Pydantic models for API requests/responses
class APIKeyInput(BaseModel):
    platform: str = Field(..., description="Platform name (instagram, youtube, linkedin, etc.)")
    api_key: Optional[str] = Field(None, description="Main API key")
    client_id: Optional[str] = Field(None, description="Client ID")
    client_secret: Optional[str] = Field(None, description="Client Secret")
    config: Optional[Dict[str, Any]] = Field(None, description="Additional configuration")

class APIKeyResponse(BaseModel):
    id: int
    platform: str
    is_active: bool
    is_verified: bool
    last_verified_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Security: Don't expose actual credentials
    has_api_key: bool
    has_client_id: bool
    has_client_secret: bool

class PlatformTemplate(BaseModel):
    platform: str
    display_name: str
    description: Optional[str]
    required_fields: List[str]
    optional_fields: List[str]
    field_descriptions: Dict[str, str]
    setup_instructions: Optional[str]
    documentation_url: Optional[str]

class APIKeyValidationResult(BaseModel):
    is_valid: bool
    error_message: Optional[str]
    platform_info: Optional[Dict[str, Any]] = None

# Platform configurations for popular social media APIs
PLATFORM_CONFIGS = {
    "instagram": {
        "display_name": "Instagram Graph API",
        "description": "Connect your Instagram Business account for automated posting and analytics",
        "required_fields": ["client_id", "client_secret"],
        "optional_fields": ["access_token"],
        "field_descriptions": {
            "client_id": "Your Facebook App ID (Instagram uses Facebook Graph API)",
            "client_secret": "Your Facebook App Secret",
            "access_token": "Long-lived access token (will be generated during OAuth)"
        },
        "setup_instructions": """
1. Go to https://developers.facebook.com/apps/
2. Create a new app or select existing one
3. Add 'Instagram Graph API' product
4. Add 'Facebook Login' product
5. Configure OAuth redirect URIs
6. Get your App ID and App Secret
7. Ensure your Instagram account is a Business account linked to a Facebook Page
        """,
        "documentation_url": "https://developers.facebook.com/docs/instagram-api/",
        "test_endpoint": "https://graph.facebook.com/me"
    },
    "youtube": {
        "display_name": "YouTube Data API",
        "description": "Upload videos and manage your YouTube channel content",
        "required_fields": ["client_id", "client_secret"],
        "optional_fields": ["api_key"],
        "field_descriptions": {
            "client_id": "Google OAuth 2.0 Client ID",
            "client_secret": "Google OAuth 2.0 Client Secret",
            "api_key": "YouTube Data API key (optional, for read-only operations)"
        },
        "setup_instructions": """
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Optionally create API key for read-only access
        """,
        "documentation_url": "https://developers.google.com/youtube/v3",
        "test_endpoint": "https://www.googleapis.com/youtube/v3/channels"
    },
    "linkedin": {
        "display_name": "LinkedIn API",
        "description": "Share content and manage your LinkedIn company page",
        "required_fields": ["client_id", "client_secret"],
        "optional_fields": ["access_token"],
        "field_descriptions": {
            "client_id": "LinkedIn App Client ID",
            "client_secret": "LinkedIn App Client Secret",
            "access_token": "OAuth 2.0 access token (will be generated during OAuth)"
        },
        "setup_instructions": """
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Request access to required APIs (Share on LinkedIn, etc.)
4. Get your Client ID and Client Secret
5. Configure OAuth 2.0 redirect URLs
        """,
        "documentation_url": "https://docs.microsoft.com/en-us/linkedin/",
        "test_endpoint": "https://api.linkedin.com/v2/me"
    },
    "twitter": {
        "display_name": "Twitter API v2",
        "description": "Post tweets and manage your Twitter account",
        "required_fields": ["api_key", "client_id", "client_secret"],
        "optional_fields": ["access_token"],
        "field_descriptions": {
            "api_key": "Twitter API Key (Consumer Key)",
            "client_id": "Twitter OAuth 2.0 Client ID",
            "client_secret": "Twitter API Secret Key (Consumer Secret)",
            "access_token": "OAuth 2.0 Bearer token (will be generated)"
        },
        "setup_instructions": """
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or select existing one
3. Generate API Keys and tokens
4. Configure OAuth 2.0 settings
5. Set up callback URLs
        """,
        "documentation_url": "https://developer.twitter.com/en/docs/twitter-api",
        "test_endpoint": "https://api.twitter.com/2/users/me"
    },
    "facebook": {
        "display_name": "Facebook Graph API",
        "description": "Manage Facebook pages and post content",
        "required_fields": ["client_id", "client_secret"],
        "optional_fields": ["access_token"],
        "field_descriptions": {
            "client_id": "Facebook App ID",
            "client_secret": "Facebook App Secret",
            "access_token": "Page access token (will be generated during OAuth)"
        },
        "setup_instructions": """
1. Go to https://developers.facebook.com/apps/
2. Create a new app
3. Add 'Facebook Login' product
4. Add 'Pages Management' permissions
5. Get your App ID and App Secret
6. Configure OAuth redirect URIs
        """,
        "documentation_url": "https://developers.facebook.com/docs/graph-api/",
        "test_endpoint": "https://graph.facebook.com/me"
    },
    "tiktok": {
        "display_name": "TikTok for Business API",
        "description": "Manage TikTok business account and advertising",
        "required_fields": ["client_id", "client_secret"],
        "optional_fields": ["access_token"],
        "field_descriptions": {
            "client_id": "TikTok App ID",
            "client_secret": "TikTok App Secret",
            "access_token": "OAuth access token (will be generated)"
        },
        "setup_instructions": """
1. Go to https://developers.tiktok.com/
2. Create a new app
3. Request necessary permissions
4. Get your App ID and App Secret
5. Configure OAuth settings
        """,
        "documentation_url": "https://developers.tiktok.com/doc/",
        "test_endpoint": "https://business-api.tiktok.com/open_api/v1.3/user/info/"
    }
}

@router.get("/platforms", response_model=List[PlatformTemplate])
async def get_supported_platforms():
    """
    Get list of supported social media platforms and their API key requirements
    """
    platforms = []
    for platform_key, config in PLATFORM_CONFIGS.items():
        platforms.append(PlatformTemplate(
            platform=platform_key,
            display_name=config["display_name"],
            description=config.get("description"),
            required_fields=config["required_fields"],
            optional_fields=config.get("optional_fields", []),
            field_descriptions=config.get("field_descriptions", {}),
            setup_instructions=config.get("setup_instructions"),
            documentation_url=config.get("documentation_url")
        ))
    
    return platforms

@router.get("/", response_model=List[APIKeyResponse])
async def get_user_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all API keys for the current user
    """
    try:
        result = await db.execute(
            select(UserAPIKeys).where(UserAPIKeys.user_id == current_user.id)
        )
        api_keys = result.scalars().all()
        
        response_data = []
        for key in api_keys:
            response_data.append(APIKeyResponse(
                id=key.id,
                platform=key.platform,
                is_active=key.is_active,
                is_verified=key.is_verified,
                last_verified_at=key.last_verified_at,
                error_message=key.error_message,
                created_at=key.created_at,
                updated_at=key.updated_at,
                has_api_key=bool(key.api_key),
                has_client_id=bool(key.client_id),
                has_client_secret=bool(key.client_secret)
            ))
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error fetching user API keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch API keys"
        )

@router.post("/", response_model=APIKeyResponse)
async def add_or_update_api_keys(
    api_key_data: APIKeyInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add or update API keys for a platform
    """
    try:
        # Validate platform
        if api_key_data.platform not in PLATFORM_CONFIGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform: {api_key_data.platform}"
            )
        
        platform_config = PLATFORM_CONFIGS[api_key_data.platform]
        
        # Validate required fields
        for field in platform_config["required_fields"]:
            field_value = getattr(api_key_data, field, None)
            if not field_value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Required field missing: {field}"
                )
        
        # Check if user already has API keys for this platform
        result = await db.execute(
            select(UserAPIKeys).where(
                UserAPIKeys.user_id == current_user.id,
                UserAPIKeys.platform == api_key_data.platform
            )
        )
        existing_key = result.scalar_one_or_none()
        
        # Encrypt sensitive data
        encrypted_api_key = None
        encrypted_client_id = None
        encrypted_client_secret = None
        
        if api_key_data.api_key:
            encrypted_api_key = encryption_service.encrypt(api_key_data.api_key)
        if api_key_data.client_id:
            encrypted_client_id = encryption_service.encrypt(api_key_data.client_id)
        if api_key_data.client_secret:
            encrypted_client_secret = encryption_service.encrypt(api_key_data.client_secret)
        
        if existing_key:
            # Update existing keys
            if encrypted_api_key:
                existing_key.api_key = encrypted_api_key
            if encrypted_client_id:
                existing_key.client_id = encrypted_client_id
            if encrypted_client_secret:
                existing_key.client_secret = encrypted_client_secret
            if api_key_data.config:
                existing_key.config = api_key_data.config
            
            existing_key.is_verified = False  # Reset verification status
            existing_key.error_message = None
            existing_key.updated_at = datetime.utcnow()
            
            api_key_record = existing_key
        else:
            # Create new API key record
            api_key_record = UserAPIKeys(
                user_id=current_user.id,
                platform=api_key_data.platform,
                api_key=encrypted_api_key,
                client_id=encrypted_client_id,
                client_secret=encrypted_client_secret,
                config=api_key_data.config
            )
            db.add(api_key_record)
        
        await db.commit()
        await db.refresh(api_key_record)
        
        logger.info(f"API keys {'updated' if existing_key else 'added'} for user {current_user.id}, platform: {api_key_data.platform}")
        
        return APIKeyResponse(
            id=api_key_record.id,
            platform=api_key_record.platform,
            is_active=api_key_record.is_active,
            is_verified=api_key_record.is_verified,
            last_verified_at=api_key_record.last_verified_at,
            error_message=api_key_record.error_message,
            created_at=api_key_record.created_at,
            updated_at=api_key_record.updated_at,
            has_api_key=bool(api_key_record.api_key),
            has_client_id=bool(api_key_record.client_id),
            has_client_secret=bool(api_key_record.client_secret)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error adding/updating API keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save API keys"
        )

@router.post("/{platform}/validate", response_model=APIKeyValidationResult)
async def validate_api_keys(
    platform: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate API keys for a specific platform
    """
    try:
        # Get user's API keys for the platform
        result = await db.execute(
            select(UserAPIKeys).where(
                UserAPIKeys.user_id == current_user.id,
                UserAPIKeys.platform == platform,
                UserAPIKeys.is_active == True
            )
        )
        api_key_record = result.scalar_one_or_none()
        
        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No API keys found for platform: {platform}"
            )
        
        # Decrypt credentials for validation
        decrypted_credentials = {}
        if api_key_record.api_key:
            decrypted_credentials['api_key'] = encryption_service.decrypt(api_key_record.api_key)
        if api_key_record.client_id:
            decrypted_credentials['client_id'] = encryption_service.decrypt(api_key_record.client_id)
        if api_key_record.client_secret:
            decrypted_credentials['client_secret'] = encryption_service.decrypt(api_key_record.client_secret)
        
        # Platform-specific validation
        validation_result = await validate_platform_credentials(platform, decrypted_credentials)
        
        # Update verification status
        api_key_record.is_verified = validation_result.is_valid
        api_key_record.last_verified_at = datetime.utcnow()
        if not validation_result.is_valid:
            api_key_record.error_message = validation_result.error_message
        else:
            api_key_record.error_message = None
        
        await db.commit()
        
        return validation_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating API keys for {platform}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate API keys"
        )

@router.delete("/{platform}")
async def delete_api_keys(
    platform: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete API keys for a specific platform
    """
    try:
        result = await db.execute(
            select(UserAPIKeys).where(
                UserAPIKeys.user_id == current_user.id,
                UserAPIKeys.platform == platform
            )
        )
        api_key_record = result.scalar_one_or_none()
        
        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No API keys found for platform: {platform}"
            )
        
        await db.delete(api_key_record)
        await db.commit()
        
        logger.info(f"API keys deleted for user {current_user.id}, platform: {platform}")
        
        return {"message": f"API keys for {platform} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting API keys for {platform}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API keys"
        )

async def validate_platform_credentials(platform: str, credentials: Dict[str, str]) -> APIKeyValidationResult:
    """
    Validate API credentials for a specific platform
    """
    try:
        platform_config = PLATFORM_CONFIGS.get(platform)
        if not platform_config:
            return APIKeyValidationResult(
                is_valid=False,
                error_message=f"Unsupported platform: {platform}"
            )
        
        test_endpoint = platform_config.get("test_endpoint")
        if not test_endpoint:
            # If no test endpoint, assume valid (basic field validation passed)
            return APIKeyValidationResult(
                is_valid=True,
                platform_info={"message": "API keys saved (validation endpoint not available)"}
            )
        
        # Platform-specific validation logic
        if platform == "instagram":
            return await validate_instagram_credentials(credentials, test_endpoint)
        elif platform == "youtube":
            return await validate_youtube_credentials(credentials, test_endpoint)
        elif platform == "linkedin":
            return await validate_linkedin_credentials(credentials, test_endpoint)
        elif platform == "twitter":
            return await validate_twitter_credentials(credentials, test_endpoint)
        elif platform == "facebook":
            return await validate_facebook_credentials(credentials, test_endpoint)
        else:
            return APIKeyValidationResult(
                is_valid=True,
                platform_info={"message": f"API keys saved for {platform} (validation not implemented)"}
            )
    
    except Exception as e:
        logger.error(f"Error validating {platform} credentials: {e}")
        return APIKeyValidationResult(
            is_valid=False,
            error_message=f"Validation failed: {str(e)}"
        )

async def validate_instagram_credentials(credentials: Dict[str, str], test_endpoint: str) -> APIKeyValidationResult:
    """Validate Instagram/Facebook Graph API credentials"""
    try:
        client_id = credentials.get('client_id')
        client_secret = credentials.get('client_secret')
        
        if not client_id or not client_secret:
            return APIKeyValidationResult(
                is_valid=False,
                error_message="Client ID and Client Secret are required"
            )
        
        # Test app-level access
        async with aiohttp.ClientSession() as session:
            test_url = f"https://graph.facebook.com/oauth/access_token"
            params = {
                'client_id': client_id,
                'client_secret': client_secret,
                'grant_type': 'client_credentials'
            }
            
            async with session.get(test_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'access_token' in data:
                        return APIKeyValidationResult(
                            is_valid=True,
                            platform_info={
                                "message": "Instagram/Facebook API credentials validated successfully",
                                "app_id": client_id
                            }
                        )
                
                error_data = await response.json()
                return APIKeyValidationResult(
                    is_valid=False,
                    error_message=error_data.get('error', {}).get('message', 'Invalid credentials')
                )
    
    except Exception as e:
        return APIKeyValidationResult(
            is_valid=False,
            error_message=f"Instagram validation failed: {str(e)}"
        )

async def validate_youtube_credentials(credentials: Dict[str, str], test_endpoint: str) -> APIKeyValidationResult:
    """Validate YouTube API credentials"""
    try:
        api_key = credentials.get('api_key')
        client_id = credentials.get('client_id')
        
        if api_key:
            # Test with API key (read-only validation)
            async with aiohttp.ClientSession() as session:
                test_url = f"{test_endpoint}?part=snippet&mine=true&key={api_key}"
                async with session.get(test_url) as response:
                    if response.status == 200:
                        return APIKeyValidationResult(
                            is_valid=True,
                            platform_info={"message": "YouTube API key validated successfully"}
                        )
        
        if client_id:
            # Basic validation for OAuth credentials (can't fully test without user flow)
            return APIKeyValidationResult(
                is_valid=True,
                platform_info={
                    "message": "YouTube OAuth credentials saved (full validation requires user authorization)",
                    "client_id": client_id[:8] + "..."
                }
            )
        
        return APIKeyValidationResult(
            is_valid=False,
            error_message="Either API key or OAuth credentials are required"
        )
    
    except Exception as e:
        return APIKeyValidationResult(
            is_valid=False,
            error_message=f"YouTube validation failed: {str(e)}"
        )

async def validate_linkedin_credentials(credentials: Dict[str, str], test_endpoint: str) -> APIKeyValidationResult:
    """Validate LinkedIn API credentials"""
    # LinkedIn OAuth requires user authorization, so we can only do basic validation
    client_id = credentials.get('client_id')
    client_secret = credentials.get('client_secret')
    
    if not client_id or not client_secret:
        return APIKeyValidationResult(
            is_valid=False,
            error_message="Client ID and Client Secret are required for LinkedIn"
        )
    
    return APIKeyValidationResult(
        is_valid=True,
        platform_info={
            "message": "LinkedIn OAuth credentials saved (full validation requires user authorization)",
            "client_id": client_id[:8] + "..."
        }
    )

async def validate_twitter_credentials(credentials: Dict[str, str], test_endpoint: str) -> APIKeyValidationResult:
    """Validate Twitter API credentials"""
    # Twitter OAuth 2.0 requires user authorization, basic validation only
    api_key = credentials.get('api_key')
    client_id = credentials.get('client_id')
    client_secret = credentials.get('client_secret')
    
    if not api_key or not client_id or not client_secret:
        return APIKeyValidationResult(
            is_valid=False,
            error_message="API Key, Client ID, and Client Secret are required for Twitter"
        )
    
    return APIKeyValidationResult(
        is_valid=True,
        platform_info={
            "message": "Twitter API credentials saved (full validation requires user authorization)",
            "client_id": client_id[:8] + "..."
        }
    )

async def validate_facebook_credentials(credentials: Dict[str, str], test_endpoint: str) -> APIKeyValidationResult:
    """Validate Facebook Graph API credentials"""
    # Same as Instagram since they use the same API
    return await validate_instagram_credentials(credentials, test_endpoint)

# Helper function to get decrypted user credentials (for use in other services)
async def get_user_platform_credentials(db: AsyncSession, user_id: int, platform: str) -> Optional[Dict[str, str]]:
    """
    Get decrypted API credentials for a user and platform
    Used by other services that need to make API calls on behalf of the user
    """
    try:
        result = await db.execute(
            select(UserAPIKeys).where(
                UserAPIKeys.user_id == user_id,
                UserAPIKeys.platform == platform,
                UserAPIKeys.is_active == True,
                UserAPIKeys.is_verified == True
            )
        )
        api_key_record = result.scalar_one_or_none()
        
        if not api_key_record:
            return None
        
        credentials = {}
        if api_key_record.api_key:
            credentials['api_key'] = encryption_service.decrypt(api_key_record.api_key)
        if api_key_record.client_id:
            credentials['client_id'] = encryption_service.decrypt(api_key_record.client_id)
        if api_key_record.client_secret:
            credentials['client_secret'] = encryption_service.decrypt(api_key_record.client_secret)
        if api_key_record.access_token:
            credentials['access_token'] = encryption_service.decrypt(api_key_record.access_token)
        if api_key_record.refresh_token:
            credentials['refresh_token'] = encryption_service.decrypt(api_key_record.refresh_token)
        if api_key_record.config:
            credentials['config'] = api_key_record.config
        
        return credentials
    
    except Exception as e:
        logger.error(f"Error getting user credentials for {platform}: {e}")
        return None