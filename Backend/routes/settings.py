"""
User settings and preferences routes.
Handles Instagram automation settings, posting preferences, and notifications.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_sync_db
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
    db: Session = Depends(get_sync_db),
):
    """
    Check if Instagram is connected and automation is enabled.
    Returns connection status, automation settings, and account info.
    """
    try:
        status_info = SettingsService.check_instagram_connection_status(
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
    db: Session = Depends(get_sync_db),
):
    """Get all user settings and preferences."""
    try:
        settings = SettingsService.get_user_settings(db, current_user.id)

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
    db: Session = Depends(get_sync_db),
):
    """
    Update Instagram automation settings.
    
    - **instagram_enabled**: Enable/disable Instagram integration
    - **instagram_auto_publish**: Auto-publish scheduled posts
    - **instagram_auto_reply**: Auto-reply to DMs
    - **instagram_save_drafts**: Save posts as drafts before publishing
    """
    try:
        settings = SettingsService.update_instagram_automation(
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
    db: Session = Depends(get_sync_db),
):
    """
    Update posting preferences.
    
    - **preferred_posting_time**: Time in HH:MM format (24-hour)
    - **posting_frequency**: daily, weekly, or custom
    - **auto_generate_captions**: Auto-generate captions using AI
    """
    try:
        settings = SettingsService.update_posting_preferences(
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
    db: Session = Depends(get_sync_db),
):
    """
    Update notification preferences.
    
    - **notify_on_post**: Notify when posts are published
    - **notify_on_engagement**: Notify on likes, comments, follows
    - **notify_on_error**: Notify when automation errors occur
    """
    try:
        settings = SettingsService.update_notification_settings(
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
