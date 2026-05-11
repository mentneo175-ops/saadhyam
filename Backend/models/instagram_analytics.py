"""
Instagram Analytics Models
Complete database models for Instagram Business Analytics Dashboard
"""

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    BigInteger,
    Float,
    ForeignKey,
    Boolean,
    Text,
    JSON,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime
import enum


# ======================== Instagram Account Models ========================


class InstagramBusinessAccount(Base):
    """Store connected Instagram Business accounts with complete profile data"""
    
    __tablename__ = "instagram_business_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Instagram Account Info
    ig_account_id = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    biography = Column(Text, nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    
    # Connected Facebook Page
    facebook_page_id = Column(String(255), nullable=True, index=True)
    facebook_page_name = Column(String(255), nullable=True)
    
    # Access Tokens (encrypted)
    access_token = Column(Text, nullable=False)
    access_token_expires_at = Column(DateTime, nullable=True)
    refresh_token = Column(Text, nullable=True)
    
    # Account Status
    account_type = Column(String(50), default="BUSINESS")  # BUSINESS, CREATOR
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Sync Status
    last_synced_at = Column(DateTime, nullable=True)
    sync_status = Column(String(50), default="pending")  # pending, syncing, completed, failed
    sync_error = Column(Text, nullable=True)
    
    # Connection Timestamps
    connected_at = Column(DateTime, server_default=func.now(), nullable=False)
    disconnected_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="instagram_business_accounts")
    analytics_snapshots = relationship("AnalyticsSnapshot", back_populates="account", cascade="all, delete-orphan")
    post_analytics = relationship("models.instagram_analytics.PostAnalytics", back_populates="account", cascade="all, delete-orphan")
    reel_analytics = relationship("ReelAnalytics", back_populates="account", cascade="all, delete-orphan")
    story_analytics = relationship("StoryAnalytics", back_populates="account", cascade="all, delete-orphan")
    audience_insights = relationship("AudienceInsights", back_populates="account", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="account", cascade="all, delete-orphan")
    growth_predictions = relationship("GrowthPrediction", back_populates="account", cascade="all, delete-orphan")
    sync_history = relationship("SyncHistory", back_populates="account", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_user_active', 'user_id', 'is_active'),
        Index('idx_sync_status', 'sync_status', 'last_synced_at'),
    )
    
    def __repr__(self):
        return f"<InstagramBusinessAccount(id={self.id}, username='{self.username}', user_id={self.user_id})>"


# ======================== Analytics Snapshot Models ========================


class AnalyticsSnapshot(Base):
    """Store daily/hourly snapshots of account-level analytics"""
    
    __tablename__ = "analytics_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Snapshot Metadata
    snapshot_date = Column(DateTime, nullable=False, index=True)
    period = Column(String(20), default="day")  # day, week, month
    
    # Follower Metrics
    followers_count = Column(Integer, default=0)
    follower_growth = Column(Integer, default=0)  # Change since last snapshot
    follower_growth_rate = Column(Float, default=0.0)  # Percentage
    
    # Reach & Impressions
    impressions = Column(BigInteger, default=0)
    reach = Column(BigInteger, default=0)
    
    # Profile Activity
    profile_views = Column(Integer, default=0)
    website_clicks = Column(Integer, default=0)
    email_contacts = Column(Integer, default=0)
    phone_call_clicks = Column(Integer, default=0)
    get_directions_clicks = Column(Integer, default=0)
    
    # Engagement Metrics
    total_interactions = Column(BigInteger, default=0)
    likes = Column(BigInteger, default=0)
    comments = Column(BigInteger, default=0)
    shares = Column(BigInteger, default=0)
    saves = Column(BigInteger, default=0)
    
    # Calculated Metrics
    engagement_rate = Column(Float, default=0.0)
    avg_engagement_per_post = Column(Float, default=0.0)
    
    # Content Metrics
    posts_published = Column(Integer, default=0)
    reels_published = Column(Integer, default=0)
    stories_published = Column(Integer, default=0)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="analytics_snapshots")
    
    __table_args__ = (
        Index('idx_account_date', 'account_id', 'snapshot_date'),
        Index('idx_period_date', 'period', 'snapshot_date'),
    )
    
    def __repr__(self):
        return f"<AnalyticsSnapshot(account_id={self.account_id}, date={self.snapshot_date}, followers={self.followers_count})>"


# ======================== Post Analytics Models ========================


class PostAnalytics(Base):
    """Store analytics for individual Instagram posts"""
    
    __tablename__ = "instagram_post_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Post Identification
    media_id = Column(String(255), unique=True, nullable=False, index=True)
    media_type = Column(String(50), nullable=False)  # IMAGE, VIDEO, CAROUSEL_ALBUM
    permalink = Column(Text, nullable=True)
    
    # Post Content
    caption = Column(Text, nullable=True)
    media_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    
    # Engagement Metrics
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
    
    # Reach & Impressions
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    
    # Calculated Metrics
    engagement_rate = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)  # AI-calculated quality score
    
    # Performance Ranking
    performance_rank = Column(Integer, nullable=True)  # Rank among all posts
    is_viral = Column(Boolean, default=False)
    is_top_performer = Column(Boolean, default=False)
    
    # Timestamps
    published_at = Column(DateTime, nullable=False, index=True)
    last_updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="post_analytics")
    
    __table_args__ = (
        Index('idx_account_published', 'account_id', 'published_at'),
        Index('idx_performance', 'account_id', 'engagement_score'),
        Index('idx_viral', 'is_viral', 'published_at'),
    )
    
    def __repr__(self):
        return f"<PostAnalytics(media_id='{self.media_id}', likes={self.like_count}, engagement={self.engagement_rate})>"


# ======================== Reel Analytics Models ========================


class ReelAnalytics(Base):
    """Store analytics for Instagram Reels"""
    
    __tablename__ = "reel_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Reel Identification
    media_id = Column(String(255), unique=True, nullable=False, index=True)
    permalink = Column(Text, nullable=True)
    
    # Reel Content
    caption = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    
    # Video Metrics
    plays = Column(BigInteger, default=0)
    watch_time_seconds = Column(BigInteger, default=0)
    avg_watch_time = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    
    # Engagement Metrics
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
    
    # Reach & Impressions
    impressions = Column(BigInteger, default=0)
    reach = Column(BigInteger, default=0)
    
    # Performance Metrics
    engagement_rate = Column(Float, default=0.0)
    viral_score = Column(Float, default=0.0)
    is_trending = Column(Boolean, default=False)
    
    # Timestamps
    published_at = Column(DateTime, nullable=False, index=True)
    last_updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="reel_analytics")
    
    __table_args__ = (
        Index('idx_account_published_reel', 'account_id', 'published_at'),
        Index('idx_trending', 'is_trending', 'published_at'),
    )
    
    def __repr__(self):
        return f"<ReelAnalytics(media_id='{self.media_id}', plays={self.plays}, completion={self.completion_rate})>"


# ======================== Story Analytics Models ========================


class StoryAnalytics(Base):
    """Store analytics for Instagram Stories"""
    
    __tablename__ = "story_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Story Identification
    media_id = Column(String(255), unique=True, nullable=False, index=True)
    media_type = Column(String(50), nullable=False)  # IMAGE, VIDEO
    
    # Story Content
    media_url = Column(Text, nullable=True)
    
    # View Metrics
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    
    # Interaction Metrics
    exits = Column(Integer, default=0)
    taps_forward = Column(Integer, default=0)
    taps_back = Column(Integer, default=0)
    replies = Column(Integer, default=0)
    
    # Calculated Metrics
    completion_rate = Column(Float, default=0.0)
    interaction_rate = Column(Float, default=0.0)
    
    # Timestamps
    published_at = Column(DateTime, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)
    last_updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="story_analytics")
    
    __table_args__ = (
        Index('idx_account_published_story', 'account_id', 'published_at'),
    )
    
    def __repr__(self):
        return f"<StoryAnalytics(media_id='{self.media_id}', impressions={self.impressions})>"


# ======================== Audience Insights Models ========================


class AudienceInsights(Base):
    """Store audience demographic and behavior insights"""
    
    __tablename__ = "audience_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Snapshot Metadata
    snapshot_date = Column(DateTime, nullable=False, index=True)
    
    # Demographics (stored as JSON for flexibility)
    age_gender_breakdown = Column(JSON, nullable=True)  # {"13-17": {"M": 10, "F": 15}, ...}
    top_cities = Column(JSON, nullable=True)  # [{"city": "New York", "count": 500}, ...]
    top_countries = Column(JSON, nullable=True)  # [{"country": "US", "count": 1000}, ...]
    
    # Audience Activity
    online_followers = Column(Integer, default=0)
    follower_activity_hours = Column(JSON, nullable=True)  # {"0": 100, "1": 50, ...}
    follower_activity_days = Column(JSON, nullable=True)  # {"monday": 500, ...}
    
    # Engagement Patterns
    avg_engagement_time = Column(String(50), nullable=True)  # "14:00-16:00"
    peak_activity_day = Column(String(20), nullable=True)  # "monday"
    peak_activity_hour = Column(Integer, nullable=True)  # 14
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="audience_insights")
    
    __table_args__ = (
        Index('idx_account_snapshot', 'account_id', 'snapshot_date'),
    )
    
    def __repr__(self):
        return f"<AudienceInsights(account_id={self.account_id}, date={self.snapshot_date})>"


# ======================== AI Recommendation Models ========================


class AIRecommendation(Base):
    """Store AI-generated recommendations and insights"""
    
    __tablename__ = "ai_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Recommendation Details
    title = Column(String(255), nullable=False)
    recommendation = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)  # posting_time, content, hashtags, engagement, growth
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    
    # AI Confidence
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    
    # Recommendation Data
    data_points = Column(JSON, nullable=True)  # Supporting data for the recommendation
    
    # Status
    is_active = Column(Boolean, default=True)
    is_implemented = Column(Boolean, default=False)
    implemented_at = Column(DateTime, nullable=True)
    
    # Timestamps
    generated_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="ai_recommendations")
    
    __table_args__ = (
        Index('idx_account_category', 'account_id', 'category'),
        Index('idx_active_priority', 'is_active', 'priority'),
    )
    
    def __repr__(self):
        return f"<AIRecommendation(id={self.id}, category='{self.category}', priority='{self.priority}')>"


# ======================== Growth Prediction Models ========================


class GrowthPrediction(Base):
    """Store AI-based growth predictions"""
    
    __tablename__ = "growth_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Prediction Period
    prediction_date = Column(DateTime, nullable=False, index=True)
    prediction_period = Column(String(20), nullable=False)  # week, month, quarter
    
    # Follower Predictions
    predicted_followers = Column(Integer, default=0)
    predicted_follower_growth = Column(Integer, default=0)
    predicted_growth_rate = Column(Float, default=0.0)
    
    # Engagement Predictions
    predicted_engagement_rate = Column(Float, default=0.0)
    predicted_reach = Column(BigInteger, default=0)
    predicted_impressions = Column(BigInteger, default=0)
    
    # Content Performance Predictions
    predicted_avg_likes = Column(Integer, default=0)
    predicted_avg_comments = Column(Integer, default=0)
    
    # Confidence Metrics
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    model_accuracy = Column(Float, default=0.0)  # Historical accuracy
    
    # Supporting Data
    factors = Column(JSON, nullable=True)  # Factors influencing the prediction
    
    # Actual vs Predicted (filled after period ends)
    actual_followers = Column(Integer, nullable=True)
    actual_growth = Column(Integer, nullable=True)
    prediction_accuracy = Column(Float, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="growth_predictions")
    
    __table_args__ = (
        Index('idx_account_prediction', 'account_id', 'prediction_date'),
    )
    
    def __repr__(self):
        return f"<GrowthPrediction(account_id={self.account_id}, predicted_followers={self.predicted_followers})>"


# ======================== Sync History Models ========================


class SyncHistory(Base):
    """Track analytics sync operations"""
    
    __tablename__ = "sync_history"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=False, index=True)
    
    # Sync Details
    sync_type = Column(String(50), nullable=False)  # full, incremental, manual
    sync_status = Column(String(50), nullable=False, index=True)  # started, completed, failed, partial
    
    # Sync Metrics
    items_synced = Column(Integer, default=0)
    items_failed = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    
    # Error Tracking
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    account = relationship("InstagramBusinessAccount", back_populates="sync_history")
    
    __table_args__ = (
        Index('idx_account_status', 'account_id', 'sync_status'),
        Index('idx_started', 'started_at'),
    )
    
    def __repr__(self):
        return f"<SyncHistory(account_id={self.account_id}, status='{self.sync_status}', items={self.items_synced})>"


# ======================== Notification Models ========================


class NotificationLog(Base):
    """Store system notifications and alerts"""
    
    __tablename__ = "notification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("instagram_business_accounts.id"), nullable=True, index=True)
    
    # Notification Details
    notification_type = Column(String(100), nullable=False, index=True)  # growth_spike, viral_post, engagement_drop, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Priority & Status
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    is_read = Column(Boolean, default=False, index=True)
    is_actionable = Column(Boolean, default=False)
    
    # Action Data
    action_url = Column(String(500), nullable=True)
    action_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_user_unread', 'user_id', 'is_read'),
        Index('idx_type_created', 'notification_type', 'created_at'),
    )
    
    def __repr__(self):
        return f"<NotificationLog(id={self.id}, type='{self.notification_type}', user_id={self.user_id})>"
