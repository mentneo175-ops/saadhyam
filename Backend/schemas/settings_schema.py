from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime


class InstagramAutomationSettings(BaseModel):
    """Instagram automation settings."""

    instagram_enabled: bool
    instagram_auto_publish: bool
    instagram_auto_reply: bool
    instagram_save_drafts: bool


class PostingPreferences(BaseModel):
    """Posting preferences."""

    preferred_posting_time: Optional[str] = None
    posting_frequency: str = "daily"
    auto_generate_captions: bool = False


class NotificationSettings(BaseModel):
    """Notification preferences."""

    notify_on_post: bool = True
    notify_on_engagement: bool = True
    notify_on_error: bool = True


class UserSettingsResponse(BaseModel):
    """Complete user settings response."""

    id: int
    user_id: int
    instagram_automation: InstagramAutomationSettings
    posting_preferences: PostingPreferences
    notification_settings: NotificationSettings
    automation_rules: Optional[Dict] = None
    blocked_keywords: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateInstagramAutomationRequest(BaseModel):
    """Request to update Instagram automation settings."""

    instagram_enabled: Optional[bool] = None
    instagram_auto_publish: Optional[bool] = None
    instagram_auto_reply: Optional[bool] = None
    instagram_save_drafts: Optional[bool] = None


class UpdatePostingPreferencesRequest(BaseModel):
    """Request to update posting preferences."""

    preferred_posting_time: Optional[str] = None
    posting_frequency: Optional[str] = None
    auto_generate_captions: Optional[bool] = None


class UpdateNotificationSettingsRequest(BaseModel):
    """Request to update notification settings."""

    notify_on_post: Optional[bool] = None
    notify_on_engagement: Optional[bool] = None
    notify_on_error: Optional[bool] = None


class InstagramConnectionStatus(BaseModel):
    """Response for Instagram connection status."""

    is_connected: bool
    has_active_account: bool
    account_username: Optional[str] = None
    automation_enabled: bool
    auto_publish_enabled: bool
    last_post_time: Optional[datetime] = None
    message: str


class InstagramConnectionCheckRequest(BaseModel):
    """Request to check Instagram connection."""

    user_id: Optional[int] = None  # Optional, uses current user by default
