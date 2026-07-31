"""
Gmail Credentials Route Handler
Allows secure configuration management of Google OAuth credentials for users
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from models.plugins import Plugin, UserPlugin
from models.user_api_keys import UserAPIKeys
from services.encryption_service import get_encryption_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/plugins/gmail/config", tags=["gmail-config"])
encryption_service = get_encryption_service()

class GmailConfigInput(BaseModel):
    client_id: str = Field(..., min_length=1, description="Google OAuth Client ID")
    client_secret: str = Field(..., min_length=1, description="Google OAuth Client Secret")
    refresh_token: str = Field(..., min_length=1, description="Google OAuth Refresh Token")

class GmailConfigResponse(BaseModel):
    configured: bool

async def check_gmail_installed(user_id: int, db: AsyncSession) -> Plugin:
    """Helper to check if Gmail plugin is installed for the user"""
    plugin_result = await db.execute(
        select(Plugin).where(Plugin.plugin_key == "gmail")
    )
    gmail_plugin = plugin_result.scalar_one_or_none()
    if not gmail_plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gmail plugin is not registered in the system."
        )
        
    up_result = await db.execute(
        select(UserPlugin).where(
            UserPlugin.user_id == user_id,
            UserPlugin.plugin_id == gmail_plugin.id
        )
    )
    user_plugin = up_result.scalar_one_or_none()
    if not user_plugin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gmail plugin is not installed for this user."
        )
        
    return gmail_plugin

@router.get("", response_model=GmailConfigResponse)
async def get_gmail_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Step 1. Check if Gmail is installed (raises 404 if not)
        await check_gmail_installed(current_user.id, db)
        
        # Step 2. Get credentials
        result = await db.execute(
            select(UserAPIKeys).where(
                UserAPIKeys.user_id == current_user.id,
                UserAPIKeys.platform == "gmail"
            )
        )
        credentials = result.scalar_one_or_none()
        
        if not credentials:
            return GmailConfigResponse(configured=False)
            
        # Return configured status only, exposing NO secrets (no client_id, secret, or refresh_token)
        return GmailConfigResponse(configured=True)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Gmail config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch Gmail configuration"
        )

@router.post("", response_model=GmailConfigResponse)
async def save_gmail_config(
    config_data: GmailConfigInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Step 1. Check if Gmail is installed (raises 404 if not)
        await check_gmail_installed(current_user.id, db)
        
        # Step 2. Encrypt credentials
        encrypted_client_id = encryption_service.encrypt(config_data.client_id)
        encrypted_client_secret = encryption_service.encrypt(config_data.client_secret)
        encrypted_refresh_token = encryption_service.encrypt(config_data.refresh_token)
        
        # Check if credential record already exists
        result = await db.execute(
            select(UserAPIKeys).where(
                UserAPIKeys.user_id == current_user.id,
                UserAPIKeys.platform == "gmail"
            )
        )
        existing_credentials = result.scalar_one_or_none()
        
        if existing_credentials:
            # Update existing
            existing_credentials.client_id = encrypted_client_id
            existing_credentials.client_secret = encrypted_client_secret
            existing_credentials.refresh_token = encrypted_refresh_token
            existing_credentials.updated_at = datetime.utcnow()
        else:
            # Create new
            new_credentials = UserAPIKeys(
                user_id=current_user.id,
                platform="gmail",
                client_id=encrypted_client_id,
                client_secret=encrypted_client_secret,
                refresh_token=encrypted_refresh_token,
                is_active=True,
                is_verified=True,
                last_verified_at=datetime.utcnow()
            )
            db.add(new_credentials)
            
        await db.commit()
        return GmailConfigResponse(configured=True)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving Gmail config: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save Gmail configuration"
        )
