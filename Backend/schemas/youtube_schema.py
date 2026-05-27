from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class YouTubeOAuthRequest(BaseModel):
    """Request body for connecting a YouTube account."""
    code: str = Field(..., description="Authorization code from Google OAuth")
    state: Optional[str] = Field(None, description="OAuth state used to recover the PKCE code verifier")


class YouTubeChannelResponse(BaseModel):
    """Response representing a connected YouTube channel."""
    id: int
    user_id: int
    social_account_id: int
    channel_id: str
    channel_title: Optional[str] = None
    channel_description: Optional[str] = None
    subscriber_count: int
    video_count: int
    view_count: int
    thumbnail_url: Optional[str] = None
    uploads_playlist_id: Optional[str] = None
    synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class YouTubeChannelListResponse(BaseModel):
    """List of connected YouTube channels."""
    channels: List[YouTubeChannelResponse]
    total: int


class YouTubeVideoUploadRequest(BaseModel):
    """Request body to post a video immediately."""
    channel_id: int = Field(..., description="Local YouTubeChannel database ID")
    title: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=5000)
    tags: Optional[List[str]] = Field(default=None)
    category_id: Optional[str] = Field("22", description="YouTube Category ID (e.g. 22 for People & Blogs)")
    privacy_status: Optional[str] = Field("public", description="public, private, or unlisted")
    video_url: str = Field(..., description="URL or local path of the video file")
    thumbnail_url: Optional[str] = None
    video_public_id: Optional[str] = None
    thumbnail_public_id: Optional[str] = None


class YouTubeVideoScheduleRequest(BaseModel):
    """Request body to schedule a video upload."""
    channel_id: int = Field(..., description="Local YouTubeChannel database ID")
    title: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=5000)
    tags: Optional[List[str]] = Field(default=None)
    category_id: Optional[str] = Field("22")
    privacy_status: Optional[str] = Field("public")
    video_url: str = Field(..., description="URL or local path of the video file")
    thumbnail_url: Optional[str] = None
    video_public_id: Optional[str] = None
    thumbnail_public_id: Optional[str] = None
    scheduled_time: datetime = Field(..., description="Time to publish the video (ISO 8601)")


class YouTubeVideoResponse(BaseModel):
    """Response representing a YouTube video status/record."""
    id: int
    user_id: int
    channel_id: int
    video_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    category_id: str
    privacy_status: str
    video_url: str
    thumbnail_url: Optional[str] = None
    video_public_id: Optional[str] = None
    thumbnail_public_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    posted_time: Optional[datetime] = None
    status: str
    error_message: Optional[str] = None
    view_count: int
    like_count: int
    comment_count: int
    ai_generated: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class YouTubeVideoListResponse(BaseModel):
    """Paginated list of YouTube videos."""
    videos: List[YouTubeVideoResponse]
    total: int
    page: int
    page_size: int


# AI Assistant Requests
class YouTubeTitleGenerateRequest(BaseModel):
    topic: str
    description: str
    business_context: Optional[str] = ""


class YouTubeDescriptionGenerateRequest(BaseModel):
    title: str
    business_context: Optional[str] = ""
    cta_link: Optional[str] = ""


class YouTubeTagsGenerateRequest(BaseModel):
    title: str
    description: str


class YouTubeThumbnailPromptRequest(BaseModel):
    title: str
    description: str


class YouTubeAnalyticsSummaryResponse(BaseModel):
    """Aggregated YouTube channel metrics."""
    views: int
    watch_time_minutes: int
    subscribers_gained: int
    likes: int
    comments: int
    shares: int
