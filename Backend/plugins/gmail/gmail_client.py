"""
Gmail API Client helper
Handles credential loading, decryption, automatic token refreshing, and client building
"""

import logging
import asyncio
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.user_api_keys import UserAPIKeys
from services.encryption_service import get_encryption_service
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
import google.auth.exceptions
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

class GmailClient:
    """
    Gmail Client Helper
    Loads credentials, handles automatic token refreshes, and returns authenticated service instance
    """
    
    @staticmethod
    async def get_service(user_id: int, db: AsyncSession):
        """
        Retrieves credentials from database, decrypts them, refreshes tokens if needed, 
        and returns an authenticated Gmail API service object.
        """
        # 1. Fetch credentials from UserAPIKeys
        logger.info(f"[GmailClient] get_service called for user_id={user_id}")
        try:
            result = await db.execute(
                select(UserAPIKeys).where(
                    UserAPIKeys.user_id == user_id,
                    UserAPIKeys.platform == "gmail"
                )
            )
            credentials = result.scalar_one_or_none()
            logger.info(f"[GmailClient] credentials row found: {credentials is not None}")
        except Exception as e:
            logger.error(f"Database error loading Gmail credentials: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"success": False, "error": "Failed to communicate with Gmail API"}
            )
            
        if not credentials:
            logger.error(
                f"[GmailClient] No UserAPIKeys row found for user_id={user_id}, platform='gmail'. "
                "The user must complete Gmail OAuth setup first (POST /api/plugins/gmail/config)."
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "error": "Gmail configuration not found"}
            )
            
        # 2. Decrypt values
        encryption_service = get_encryption_service()
        try:
            client_id = encryption_service.decrypt(credentials.client_id) if credentials.client_id else None
            client_secret = encryption_service.decrypt(credentials.client_secret) if credentials.client_secret else None
            refresh_token = encryption_service.decrypt(credentials.refresh_token) if credentials.refresh_token else None
            access_token = encryption_service.decrypt(credentials.access_token) if credentials.access_token else None
        except Exception as e:
            logger.error(f"Decryption error for Gmail credentials for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "error": "Invalid Gmail credentials"}
            )
            
        if not client_id or not client_secret or not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "error": "Invalid Gmail credentials"}
            )
            
        # 3. Create Google OAuth2 credentials object
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret
        )
        
        # 4. Refresh token if expired
        if not creds.valid:
            logger.info(f"Refreshing Gmail access token for user {user_id}")
            try:
                loop = asyncio.get_running_loop()
                with ThreadPoolExecutor() as pool:
                    await loop.run_in_executor(pool, creds.refresh, Request())
                    
                # Store refreshed credentials back to database
                credentials.access_token = encryption_service.encrypt(creds.token)
                credentials.refresh_token = encryption_service.encrypt(creds.refresh_token)
                credentials.updated_at = datetime.utcnow()
                await db.commit()
                logger.info(f"Gmail access token refreshed and saved successfully for user {user_id}")
                
            except google.auth.exceptions.RefreshError as e:
                logger.error(f"Refresh token error for user {user_id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"success": False, "error": "Refresh token expired"}
                )
            except Exception as e:
                logger.error(f"Timeout/Network error during Gmail token refresh for user {user_id}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={"success": False, "error": "Network timeout"}
                )
                
        # 5. Build and return Gmail service
        try:
            loop = asyncio.get_running_loop()
            with ThreadPoolExecutor() as pool:
                service = await loop.run_in_executor(
                    pool,
                    lambda: build("gmail", "v1", credentials=creds, static_discovery=True)
                )
            return service
        except Exception as e:
            logger.error(f"Failed to build Gmail service client: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"success": False, "error": "Failed to communicate with Gmail API"}
            )