"""
Meta OAuth Service
Handles Facebook/Instagram OAuth flow and token management
"""

import os
import logging
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from models.meta_ads import MetaAccount

from config.settings import settings

logger = logging.getLogger(__name__)


class MetaOAuthService:
    """Service for Meta OAuth and token management"""
    
    def __init__(self):
        self.app_id = settings.META_APP_ID or os.getenv("META_APP_ID")
        self.app_secret = settings.META_APP_SECRET or os.getenv("META_APP_SECRET")
        self.redirect_uri = settings.META_REDIRECT_URI
        self.graph_api_version = "v21.0"
        self.graph_api_base = f"https://graph.facebook.com/{self.graph_api_version}"
        
        # Encryption for tokens
        encryption_key = os.getenv("ENCRYPTION_KEY")
        is_valid_fernet = False
        if encryption_key:
            try:
                Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
                is_valid_fernet = True
            except Exception:
                is_valid_fernet = False

        if not encryption_key or not is_valid_fernet:
            # Generate a key if not exists or is invalid (for development)
            encryption_key = Fernet.generate_key().decode()
            logger.warning("⚠️  No valid ENCRYPTION_KEY found in env, using generated key (not for production!)")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
    
    def get_authorization_url(self, state: str) -> str:
        """
        Generate Meta OAuth authorization URL
        
        Scopes requested:
        - pages_show_list: Access to user's Facebook Pages
        - pages_read_engagement: Read Page engagement data
        - pages_manage_posts: Create and manage Page posts
        - instagram_basic: Access to Instagram account
        - instagram_content_publish: Publish content to Instagram
        - ads_management: Manage ad accounts
        - ads_read: Read ad account data
        - business_management: Manage business assets
        """
        scopes = [
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_posts",
            "instagram_basic",
            "instagram_content_publish",
            "ads_management",
            "ads_read",
            "business_management",
            "pages_read_user_content",
            "instagram_manage_insights",
        ]
        
        params = {
            "client_id": self.app_id,
            "redirect_uri": self.redirect_uri,
            "scope": ",".join(scopes),
            "state": state,
            "response_type": "code",
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://www.facebook.com/v21.0/dialog/oauth?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        try:
            url = f"{self.graph_api_base}/oauth/access_token"
            params = {
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "redirect_uri": self.redirect_uri,
                "code": code,
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Get long-lived token
            long_lived_token = await self.exchange_for_long_lived_token(data["access_token"])
            
            return {
                "access_token": long_lived_token["access_token"],
                "token_type": data.get("token_type", "bearer"),
                "expires_in": long_lived_token.get("expires_in", 5184000),  # 60 days default
            }
            
        except Exception as e:
            logger.error(f"Failed to exchange code for token: {e}")
            raise
    
    async def exchange_for_long_lived_token(self, short_lived_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token (60 days)"""
        try:
            url = f"{self.graph_api_base}/oauth/access_token"
            params = {
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": short_lived_token,
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Failed to exchange for long-lived token: {e}")
            raise
    
    async def get_user_pages(self, access_token: str) -> list:
        """Get user's Facebook Pages"""
        try:
            url = f"{self.graph_api_base}/me/accounts"
            params = {
                "access_token": access_token,
                "fields": "id,name,access_token,instagram_business_account",
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("data", [])
            
        except Exception as e:
            logger.error(f"Failed to get user pages: {e}")
            raise
    
    async def get_instagram_business_account(self, page_id: str, page_access_token: str) -> Optional[Dict[str, Any]]:
        """Get Instagram Business Account linked to Facebook Page"""
        try:
            url = f"{self.graph_api_base}/{page_id}"
            params = {
                "access_token": page_access_token,
                "fields": "instagram_business_account{id,username,profile_picture_url}",
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("instagram_business_account")
            
        except Exception as e:
            logger.error(f"Failed to get Instagram business account: {e}")
            return None
    
    async def get_ad_accounts(self, access_token: str) -> list:
        """Get user's Ad Accounts"""
        try:
            url = f"{self.graph_api_base}/me/adaccounts"
            params = {
                "access_token": access_token,
                "fields": "id,name,account_id,account_status,currency,timezone_name,business",
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("data", [])
            
        except Exception as e:
            logger.error(f"Failed to get ad accounts: {e}")
            raise
    
    async def get_business_info(self, business_id: str, access_token: str) -> Optional[Dict[str, Any]]:
        """Get business information"""
        try:
            url = f"{self.graph_api_base}/{business_id}"
            params = {
                "access_token": access_token,
                "fields": "id,name,verification_status",
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Failed to get business info: {e}")
            return None
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt access token for storage"""
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt access token"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()
    
    async def refresh_token(self, db: AsyncSession, meta_account: MetaAccount) -> bool:
        """Refresh access token if expired"""
        try:
            # Check if token is expired or about to expire (within 7 days)
            if meta_account.token_expires_at:
                days_until_expiry = (meta_account.token_expires_at - datetime.utcnow()).days
                if days_until_expiry > 7:
                    logger.info(f"Token still valid for {days_until_expiry} days")
                    return True
            
            # Decrypt current token
            current_token = self.decrypt_token(meta_account.access_token)
            
            # Exchange for new long-lived token
            new_token_data = await self.exchange_for_long_lived_token(current_token)
            
            # Encrypt and update
            encrypted_token = self.encrypt_token(new_token_data["access_token"])
            expires_in = new_token_data.get("expires_in", 5184000)
            
            meta_account.access_token = encrypted_token
            meta_account.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            meta_account.last_synced_at = datetime.utcnow()

            # AsyncSession commit is a coroutine
            await db.commit()

            logger.info(f"✅ Token refreshed for Meta account {meta_account.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to refresh token: {e}")
            meta_account.connection_error = str(e)
            meta_account.is_active = False
            try:
                await db.commit()
            except Exception:
                pass
            return False
    
    async def validate_token(self, access_token: str) -> bool:
        """Validate if access token is still valid"""
        try:
            url = f"{self.graph_api_base}/me"
            params = {"access_token": access_token}
            
            response = requests.get(url, params=params)
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return False
    
    async def revoke_token(self, access_token: str) -> bool:
        """Revoke access token"""
        try:
            url = f"{self.graph_api_base}/me/permissions"
            params = {"access_token": access_token}
            
            response = requests.delete(url, params=params)
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Failed to revoke token: {e}")
            return False


# Singleton instance
meta_oauth_service = MetaOAuthService()
