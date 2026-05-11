"""
Instagram Analytics Pydantic Schemas
Request and response models for Instagram Analytics API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ======================== Account Schemas ========================


class ConnectAccountRequest(BaseModel):
    """Request to connect Instagram Business account"""
    ig_account_id: str = Field(..., description="Instagram Business Account ID")
    access_token: str = Field(..., description="Facebook access token")
    facebook_page_id: Optional[str] = Field(None, description="Connected Facebook Page ID")
    facebook_page_name: Optional[str] = Field(None, description="Connected Facebook Page name")


class InstagramAccountSchema(BaseModel):
    """Instagram Business Account schema"""
    id: int
    ig_account_id: str
    username: str
    name: Optional[str]
    biography: Optional[str]
    profile_picture_url: Optional[str]
    website: Optional[str]
    is_active: bool
    sync_status: str
    last_synced_at: Optional[datetime]
    connected_at: datetime
    
    class Config:
        from_attributes = True


class ConnectAccountResponse(BaseModel):
    """Response for account connection"""
    success: bool
    message: str
    account: InstagramAccountSchema


class AccountListResponse(BaseModel):
    """List of connected accounts"""
    accounts: List[InstagramAccountSchema]
    total: int


# ======================== Analytics Schemas ========================


class AnalyticsSnapshotSchema(BaseModel):
    """Analytics snapshot schema"""
    id: int
    snapshot_date: datetime
    period: str
    followers_count: int
    follower_growth: int
    follower_growth_rate: float
    impressions: int
    reach: int
    profile_views: int
    website_clicks: int
    engagement_rate: float
    
    class Config:
        from_attributes = True


class PostAnalyticsSchema(BaseModel):
    """Post analytics schema"""
    id: int
    media_id: str
    media_type: str
    permalink: Optional[str]
    caption: Optional[str]
    media_url: Optional[str]
    thumbnail_url: Optional[str]
    like_count: int
    comment_count: int
    share_count: int
    save_count: int
    impressions: int
    reach: int
    engagement_rate: float
    engagement_score: float
    is_viral: bool
    is_top_performer: bool
    published_at: datetime
    
    class Config:
        from_attributes = True


class ReelAnalyticsSchema(BaseModel):
    """Reel analytics schema"""
    id: int
    media_id: str
    permalink: Optional[str]
    caption: Optional[str]
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    plays: int
    watch_time_seconds: int
    avg_watch_time: float
    completion_rate: float
    like_count: int
    comment_count: int
    share_count: int
    save_count: int
    impressions: int
    reach: int
    engagement_rate: float
    viral_score: float
    is_trending: bool
    published_at: datetime
    
    class Config:
        from_attributes = True


class StoryAnalyticsSchema(BaseModel):
    """Story analytics schema"""
    id: int
    media_id: str
    media_type: str
    media_url: Optional[str]
    impressions: int
    reach: int
    exits: int
    taps_forward: int
    taps_back: int
    replies: int
    completion_rate: float
    interaction_rate: float
    published_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AudienceInsightsSchema(BaseModel):
    """Audience insights schema"""
    id: int
    snapshot_date: datetime
    age_gender_breakdown: Optional[Dict[str, Any]]
    top_cities: Optional[Dict[str, Any]]
    top_countries: Optional[Dict[str, Any]]
    follower_activity_hours: Optional[Dict[str, Any]]
    follower_activity_days: Optional[Dict[str, Any]]
    peak_activity_day: Optional[str]
    peak_activity_hour: Optional[int]
    
    class Config:
        from_attributes = True


class AIRecommendationSchema(BaseModel):
    """AI recommendation schema"""
    id: int
    title: str
    recommendation: str
    category: str
    priority: str
    confidence_score: float
    data_points: Optional[Dict[str, Any]]
    is_active: bool
    generated_at: datetime
    
    class Config:
        from_attributes = True


class GrowthPredictionSchema(BaseModel):
    """Growth prediction schema"""
    id: int
    prediction_date: datetime
    prediction_period: str
    predicted_followers: int
    predicted_follower_growth: int
    predicted_growth_rate: float
    predicted_engagement_rate: float
    confidence_score: float
    factors: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class SyncHistorySchema(BaseModel):
    """Sync history schema"""
    id: int
    sync_type: str
    sync_status: str
    items_synced: int
    items_failed: int
    duration_seconds: float
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class NotificationSchema(BaseModel):
    """Notification schema"""
    id: int
    notification_type: str
    title: str
    message: str
    priority: str
    is_read: bool
    is_actionable: bool
    action_url: Optional[str]
    action_data: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ======================== Response Schemas ========================


class DashboardOverviewResponse(BaseModel):
    """Complete dashboard overview"""
    account: InstagramAccountSchema
    overview: Dict[str, Any]
    recent_posts: List[PostAnalyticsSchema]
    recommendations: List[AIRecommendationSchema]
    prediction: Optional[GrowthPredictionSchema]
    last_synced: Optional[datetime]


class GrowthAnalyticsResponse(BaseModel):
    """Growth analytics response"""
    snapshots: List[AnalyticsSnapshotSchema]
    total_growth: int
    growth_rate: float
    days_analyzed: int


class EngagementAnalyticsResponse(BaseModel):
    """Engagement analytics response"""
    avg_engagement_rate: float
    total_likes: int
    total_comments: int
    total_shares: int
    total_saves: int
    posts_analyzed: int


class PostListResponse(BaseModel):
    """List of posts with pagination"""
    posts: List[PostAnalyticsSchema]
    total: int
    page: int
    page_size: int


class TopPostsResponse(BaseModel):
    """Top performing posts"""
    posts: List[PostAnalyticsSchema]


class ReelListResponse(BaseModel):
    """List of reels"""
    reels: List[ReelAnalyticsSchema]
    total: int


class StoryListResponse(BaseModel):
    """List of stories"""
    stories: List[StoryAnalyticsSchema]
    total: int


class AudienceInsightsResponse(BaseModel):
    """Audience insights response"""
    insights: AudienceInsightsSchema


class RecommendationsResponse(BaseModel):
    """AI recommendations response"""
    recommendations: List[AIRecommendationSchema]
    total: int


class PredictionsResponse(BaseModel):
    """Growth predictions response"""
    predictions: List[GrowthPredictionSchema]


class SyncStatusResponse(BaseModel):
    """Sync status response"""
    sync_status: str
    last_synced_at: Optional[datetime]
    sync_error: Optional[str]
    recent_syncs: List[SyncHistorySchema]


class NotificationsResponse(BaseModel):
    """Notifications response"""
    notifications: List[NotificationSchema]
    total: int
    unread_count: int
