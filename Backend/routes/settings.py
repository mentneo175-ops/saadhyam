"""
User settings and preferences routes.
Handles Instagram automation settings, posting preferences, and notifications.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from utils.dependencies import get_current_user
from models.user import User
from services.settings_service import SettingsService
from schemas.settings_schema import (
    UserSettingsResponse,
    UpdateInstagramAutomationRequest,
    UpdatePostingPreferencesRequest,
    UpdateNotificationSettingsRequest,
    InstagramConnectionStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["Settings"])


# ======================== Instagram Connection Status ========================


@router.get(
    "/instagram/connection-status",
    response_model=InstagramConnectionStatus,
    summary="Check Instagram connection status",
)
async def check_instagram_connection(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if Instagram is connected and automation is enabled.
    Returns connection status, automation settings, and account info.
    """
    try:
        status_info = await SettingsService.check_instagram_connection_status(
            db, current_user.id
        )

        message = "Instagram not connected"
        if status_info["is_connected"]:
            message = f"Instagram connected ({status_info['account_username']})"
            if status_info["automation_enabled"]:
                message += " - Automation enabled"
            else:
                message += " - Automation disabled"

        return InstagramConnectionStatus(
            is_connected=status_info["is_connected"],
            has_active_account=status_info["is_connected"],
            account_username=status_info["account_username"],
            automation_enabled=status_info["automation_enabled"],
            auto_publish_enabled=status_info["auto_publish_enabled"],
            last_post_time=status_info["last_post_time"],
            message=message,
        )
    except Exception as e:
        logger.error(f"Error checking Instagram connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check Instagram connection status",
        )


# ======================== User Settings (Get/Update) ========================


@router.get(
    "",
    response_model=UserSettingsResponse,
    summary="Get user settings",
)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all user settings and preferences."""
    try:
        settings = await SettingsService.get_user_settings(db, current_user.id)

        return UserSettingsResponse(
            id=settings.id,
            user_id=settings.user_id,
            instagram_automation={
                "instagram_enabled": settings.instagram_enabled,
                "instagram_auto_publish": settings.instagram_auto_publish,
                "instagram_auto_reply": settings.instagram_auto_reply,
                "instagram_save_drafts": settings.instagram_save_drafts,
            },
            posting_preferences={
                "preferred_posting_time": settings.preferred_posting_time,
                "posting_frequency": settings.posting_frequency,
                "auto_generate_captions": settings.auto_generate_captions,
            },
            notification_settings={
                "notify_on_post": settings.notify_on_post,
                "notify_on_engagement": settings.notify_on_engagement,
                "notify_on_error": settings.notify_on_error,
            },
            automation_rules=settings.automation_rules,
            blocked_keywords=settings.blocked_keywords,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
        )
    except Exception as e:
        logger.error(f"Error fetching user settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch settings",
        )


# ======================== Instagram Automation Settings ========================


@router.put(
    "/instagram/automation",
    response_model=UserSettingsResponse,
    summary="Update Instagram automation settings",
)
async def update_instagram_automation(
    request: UpdateInstagramAutomationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update Instagram automation settings.
    
    - **instagram_enabled**: Enable/disable Instagram integration
    - **instagram_auto_publish**: Auto-publish scheduled posts
    - **instagram_auto_reply**: Auto-reply to DMs
    - **instagram_save_drafts**: Save posts as drafts before publishing
    """
    try:
        settings = await SettingsService.update_instagram_automation(
            db,
            current_user.id,
            instagram_enabled=request.instagram_enabled,
            instagram_auto_publish=request.instagram_auto_publish,
            instagram_auto_reply=request.instagram_auto_reply,
            instagram_save_drafts=request.instagram_save_drafts,
        )

        return UserSettingsResponse(
            id=settings.id,
            user_id=settings.user_id,
            instagram_automation={
                "instagram_enabled": settings.instagram_enabled,
                "instagram_auto_publish": settings.instagram_auto_publish,
                "instagram_auto_reply": settings.instagram_auto_reply,
                "instagram_save_drafts": settings.instagram_save_drafts,
            },
            posting_preferences={
                "preferred_posting_time": settings.preferred_posting_time,
                "posting_frequency": settings.posting_frequency,
                "auto_generate_captions": settings.auto_generate_captions,
            },
            notification_settings={
                "notify_on_post": settings.notify_on_post,
                "notify_on_engagement": settings.notify_on_engagement,
                "notify_on_error": settings.notify_on_error,
            },
            automation_rules=settings.automation_rules,
            blocked_keywords=settings.blocked_keywords,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
        )
    except Exception as e:
        logger.error(f"Error updating Instagram automation settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update Instagram automation settings",
        )


# ======================== Posting Preferences ========================


@router.put(
    "/posting-preferences",
    response_model=UserSettingsResponse,
    summary="Update posting preferences",
)
async def update_posting_preferences(
    request: UpdatePostingPreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update posting preferences.
    
    - **preferred_posting_time**: Time in HH:MM format (24-hour)
    - **posting_frequency**: daily, weekly, or custom
    - **auto_generate_captions**: Auto-generate captions using AI
    """
    try:
        settings = await SettingsService.update_posting_preferences(
            db,
            current_user.id,
            preferred_posting_time=request.preferred_posting_time,
            posting_frequency=request.posting_frequency,
            auto_generate_captions=request.auto_generate_captions,
        )

        return UserSettingsResponse(
            id=settings.id,
            user_id=settings.user_id,
            instagram_automation={
                "instagram_enabled": settings.instagram_enabled,
                "instagram_auto_publish": settings.instagram_auto_publish,
                "instagram_auto_reply": settings.instagram_auto_reply,
                "instagram_save_drafts": settings.instagram_save_drafts,
            },
            posting_preferences={
                "preferred_posting_time": settings.preferred_posting_time,
                "posting_frequency": settings.posting_frequency,
                "auto_generate_captions": settings.auto_generate_captions,
            },
            notification_settings={
                "notify_on_post": settings.notify_on_post,
                "notify_on_engagement": settings.notify_on_engagement,
                "notify_on_error": settings.notify_on_error,
            },
            automation_rules=settings.automation_rules,
            blocked_keywords=settings.blocked_keywords,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
        )
    except Exception as e:
        logger.error(f"Error updating posting preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update posting preferences",
        )


# ======================== Notification Settings ========================


@router.put(
    "/notifications",
    response_model=UserSettingsResponse,
    summary="Update notification settings",
)
async def update_notification_settings(
    request: UpdateNotificationSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update notification preferences.
    
    - **notify_on_post**: Notify when posts are published
    - **notify_on_engagement**: Notify on likes, comments, follows
    - **notify_on_error**: Notify when automation errors occur
    """
    try:
        settings = await SettingsService.update_notification_settings(
            db,
            current_user.id,
            notify_on_post=request.notify_on_post,
            notify_on_engagement=request.notify_on_engagement,
            notify_on_error=request.notify_on_error,
        )

        return UserSettingsResponse(
            id=settings.id,
            user_id=settings.user_id,
            instagram_automation={
                "instagram_enabled": settings.instagram_enabled,
                "instagram_auto_publish": settings.instagram_auto_publish,
                "instagram_auto_reply": settings.instagram_auto_reply,
                "instagram_save_drafts": settings.instagram_save_drafts,
            },
            posting_preferences={
                "preferred_posting_time": settings.preferred_posting_time,
                "posting_frequency": settings.posting_frequency,
                "auto_generate_captions": settings.auto_generate_captions,
            },
            notification_settings={
                "notify_on_post": settings.notify_on_post,
                "notify_on_engagement": settings.notify_on_engagement,
                "notify_on_error": settings.notify_on_error,
            },
            automation_rules=settings.automation_rules,
            blocked_keywords=settings.blocked_keywords,
            created_at=settings.created_at,
            updated_at=settings.updated_at,
        )
    except Exception as e:
        logger.error(f"Error updating notification settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification settings",
        )


# ======================== Instagram Disconnect ========================


@router.post(
    "/instagram/disconnect",
    summary="Disconnect Instagram account",
)
async def disconnect_instagram(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Disconnect Instagram account and remove all associated data.
    
    This will:
    - Remove Instagram access tokens
    - Disable Instagram automation
    - Cancel scheduled posts
    - Clear Instagram account information
    """
    try:
        # Use the settings service to disconnect Instagram
        success = await SettingsService.disconnect_instagram_account(db, current_user.id)
        
        if success:
            return {
                "success": True,
                "message": "Instagram account disconnected successfully",
                "is_connected": False,
            }
        else:
            return {
                "success": True,
                "message": "No Instagram account was connected or already disconnected",
                "is_connected": False,
            }
    except Exception as e:
        logger.error(f"Error disconnecting Instagram account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect Instagram account",
        )


@router.post(
    "/instagram/refresh-status",
    summary="Refresh Instagram connection status",
)
async def refresh_instagram_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh Instagram connection status by checking if tokens are still valid.
    
    This is useful when users disconnect from Facebook/Instagram directly
    and the app needs to detect the disconnection.
    """
    try:
        logger.info(f"Refreshing Instagram status for user {current_user.id}")
        
        # Get user's Instagram accounts
        from services.instagram_crud import InstagramCRUD
        accounts = await InstagramCRUD.get_user_social_accounts(db, current_user.id)
        instagram_accounts = [acc for acc in accounts if acc.platform == "instagram" and acc.is_active]
        
        if not instagram_accounts:
            return {
                "success": True,
                "message": "No Instagram accounts to check",
                "is_connected": False,
                "accounts_checked": 0,
                "accounts_disconnected": 0,
            }
        
        disconnected_count = 0
        
        # Check each account's token validity
        for account in instagram_accounts:
            logger.info(f"Checking token validity for @{account.ig_username}")
            
            try:
                from services.instagram_service import instagram_service
                is_valid = await instagram_service.validate_access_token(
                    account.access_token, 
                    account.ig_user_id
                )
                
                if not is_valid:
                    logger.warning(f"Token invalid for @{account.ig_username}, marking as disconnected")
                    account.is_active = False
                    account.disconnected_at = datetime.utcnow()
                    account.access_token = None
                    account.refresh_token = None
                    db.add(account)
                    disconnected_count += 1
                else:
                    logger.info(f"Token still valid for @{account.ig_username}")
                    
            except Exception as e:
                logger.error(f"Error checking token for @{account.ig_username}: {e}")
                # Assume disconnected if we can't validate
                account.is_active = False
                account.disconnected_at = datetime.utcnow()
                account.access_token = None
                account.refresh_token = None
                db.add(account)
                disconnected_count += 1
        
        # If any accounts were disconnected, also update settings
        if disconnected_count > 0:
            remaining_active = len(instagram_accounts) - disconnected_count
            if remaining_active == 0:
                # No active accounts left, disable automation
                settings = await SettingsService.get_user_settings(db, current_user.id)
                settings.instagram_enabled = False
                settings.instagram_auto_publish = False
                settings.instagram_auto_reply = False
                db.add(settings)
                logger.info(f"Disabled Instagram automation for user {current_user.id}")
        
        await db.commit()
        
        remaining_active = len(instagram_accounts) - disconnected_count
        
        return {
            "success": True,
            "message": f"Checked {len(instagram_accounts)} accounts, {disconnected_count} were disconnected",
            "is_connected": remaining_active > 0,
            "accounts_checked": len(instagram_accounts),
            "accounts_disconnected": disconnected_count,
            "accounts_remaining": remaining_active,
        }
        
    except Exception as e:
        logger.error(f"Error refreshing Instagram status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh Instagram status",
        )
