from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime


# OAuth & Social Account Schemas
class InstagramOAuthRequest(BaseModel):
    """Request body for Instagram OAuth connection."""

    code: str = Field(..., description="Authorization code from Instagram")


class SocialAccountResponse(BaseModel):
    """Response for connected social account."""

    id: int
    platform: str
    ig_user_id: Optional[str]
    ig_username: Optional[str]
    page_name: Optional[str]
    is_active: bool
    connected_at: datetime

    class Config:
        from_attributes = True


class SocialAccountListResponse(BaseModel):
    """List of connected social accounts."""

    accounts: List[SocialAccountResponse]
    total: int


# Post Schemas
class PostContent(BaseModel):
    """Post content for creation and updates."""

    image_url: str = Field(..., description="URL of the image to post")
    caption: Optional[str] = Field(None, description="Caption for the post")


class InstantPostRequest(BaseModel):
    """Request to post immediately."""

    image_url: str = Field(..., description="URL of the image")
    caption: Optional[str] = Field(None)
    social_account_id: int = Field(
        ..., description="ID of the social account to post to"
    )


class ScheduledPostRequest(BaseModel):
    """Request to schedule a post."""

    image_url: str = Field(..., description="URL of the image")
    caption: Optional[str] = Field(None)
    social_account_id: int = Field(..., description="ID of the social account")
    scheduled_time: datetime = Field(..., description="When to post (ISO format)")


class BulkScheduleRequest(BaseModel):
    """Request to schedule multiple posts."""

    social_account_id: int
    posts: List[ScheduledPostRequest]


class ScheduledPostResponse(BaseModel):
    """Response for scheduled post."""

    id: int
    user_id: int
    social_account_id: int
    image_url: str
    caption: Optional[str]
    ai_generated: bool
    scheduled_time: Optional[datetime]
    posted_time: Optional[datetime]
    status: str
    retry_count: int
    instagram_post_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdatePostCaptionRequest(BaseModel):
    """Request to update post caption."""

    caption: str = Field(..., description="New caption text")


class UpdatePostResponse(BaseModel):
    """Response for updated post."""

    id: int
    caption: str
    updated_at: datetime

    class Config:
        from_attributes = True


# AI Caption Generation
class GenerateCaptionRequest(BaseModel):
    """Request for AI caption generation."""

    topic: str = Field(..., description="Topic for the caption")
    tone: Optional[str] = Field(
        "casual", description="Tone: casual, professional, funny, inspirational"
    )


class GenerateCaptionResponse(BaseModel):
    """Response with generated caption."""

    caption: str
    topic: str
    tone: str


# Analytics Schemas
class PostAnalyticsResponse(BaseModel):
    """Analytics for a single post."""

    id: int
    scheduled_post_id: int
    instagram_post_id: Optional[str]
    likes: int
    comments: int
    shares: int
    reach: int
    impressions: int
    last_updated: datetime

    class Config:
        from_attributes = True


class AccountAnalyticsResponse(BaseModel):
    """Aggregated analytics for an account."""

    total_posts: int
    total_likes: int
    total_reach: int
    total_impressions: int
    average_engagement_rate: float
    posts: List[PostAnalyticsResponse]


# Post Status Tracking
class PostStatusResponse(BaseModel):
    """Status of a post."""

    id: int
    status: str
    error_message: Optional[str]
    retry_count: int
    last_updated: datetime

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """List of posts with pagination."""

    posts: List[ScheduledPostResponse]
    total: int
    page: int
    page_size: int
