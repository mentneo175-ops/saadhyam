"""
Meta Ads Database Models
Complete schema for Meta Ads automation system
"""

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
import enum


class CampaignObjective(str, enum.Enum):
    """Campaign objectives supported by Meta"""
    OUTCOME_TRAFFIC = "OUTCOME_TRAFFIC"
    OUTCOME_ENGAGEMENT = "OUTCOME_ENGAGEMENT"
    OUTCOME_AWARENESS = "OUTCOME_AWARENESS"
    OUTCOME_LEADS = "OUTCOME_LEADS"
    OUTCOME_SALES = "OUTCOME_SALES"


class CampaignStatus(str, enum.Enum):
    """Campaign status"""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    DELETED = "DELETED"
    ARCHIVED = "ARCHIVED"


class AdSetStatus(str, enum.Enum):
    """Ad Set status"""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    DELETED = "DELETED"
    ARCHIVED = "ARCHIVED"


class AdStatus(str, enum.Enum):
    """Ad status"""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    DELETED = "DELETED"
    ARCHIVED = "ARCHIVED"


class MetaAccount(Base):
    """Meta Ad Account connection"""
    __tablename__ = "meta_accounts"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Meta Account Details
    ad_account_id = Column(String(255), nullable=False, index=True)  # act_xxxxx
    ad_account_name = Column(String(255), nullable=True)
    
    # Facebook Page
    page_id = Column(String(255), nullable=True)
    page_name = Column(String(255), nullable=True)
    page_access_token = Column(Text, nullable=True)  # Encrypted
    
    # Instagram Business Account
    instagram_business_id = Column(String(255), nullable=True)
    instagram_username = Column(String(255), nullable=True)
    
    # Access Tokens
    access_token = Column(Text, nullable=False)  # Encrypted
    refresh_token = Column(Text, nullable=True)  # Encrypted
    token_expires_at = Column(DateTime, nullable=True)
    
    # Business Portfolio
    business_id = Column(String(255), nullable=True)
    business_name = Column(String(255), nullable=True)
    
    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    connection_error = Column(Text, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="meta_accounts")
    campaigns = relationship("AdCampaign", back_populates="meta_account", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MetaAccount(id={self.id}, user_id={self.user_id}, ad_account={self.ad_account_id})>"


class AdCampaign(Base):
    """Meta Ad Campaign"""
    __tablename__ = "ad_campaigns"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meta_account_id = Column(Integer, ForeignKey("meta_accounts.id", ondelete="CASCADE"), nullable=False)
    
    # Campaign Details
    campaign_id = Column(String(255), nullable=True, index=True)  # Meta campaign ID
    campaign_name = Column(String(255), nullable=False)
    objective = Column(SQLEnum(CampaignObjective), nullable=False)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.PAUSED, nullable=False)
    
    # Budget
    daily_budget = Column(Float, nullable=True)  # In cents
    lifetime_budget = Column(Float, nullable=True)  # In cents
    
    # Source Post (if promoting existing post)
    instagram_post_id = Column(Integer, ForeignKey("scheduled_posts.id", ondelete="SET NULL"), nullable=True)
    
    # AI Generated Data
    ai_audience_suggestion = Column(JSON, nullable=True)
    ai_budget_recommendation = Column(JSON, nullable=True)
    ai_performance_prediction = Column(JSON, nullable=True)
    
    # Campaign Metadata
    special_ad_categories = Column(JSON, nullable=True)  # For compliance
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    meta_account = relationship("MetaAccount", back_populates="campaigns")
    instagram_post = relationship("ScheduledPost", foreign_keys=[instagram_post_id])
    ad_sets = relationship("AdSet", back_populates="campaign", cascade="all, delete-orphan")
    analytics = relationship("AdAnalytics", back_populates="campaign", cascade="all, delete-orphan")
    logs = relationship("CampaignLog", back_populates="campaign", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AdCampaign(id={self.id}, name='{self.campaign_name}', status={self.status})>"


class AdSet(Base):
    """Meta Ad Set"""
    __tablename__ = "ad_sets"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("ad_campaigns.id", ondelete="CASCADE"), nullable=False)
    
    # Ad Set Details
    adset_id = Column(String(255), nullable=True, index=True)  # Meta ad set ID
    adset_name = Column(String(255), nullable=False)
    status = Column(SQLEnum(AdSetStatus), default=AdSetStatus.PAUSED, nullable=False)
    
    # Budget & Schedule
    daily_budget = Column(Float, nullable=True)  # In cents
    lifetime_budget = Column(Float, nullable=True)  # In cents
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    # Targeting
    targeting = Column(JSON, nullable=False)  # Complete targeting spec
    
    # Optimization
    optimization_goal = Column(String(100), nullable=True)  # REACH, IMPRESSIONS, LINK_CLICKS, etc.
    billing_event = Column(String(100), nullable=True)  # IMPRESSIONS, LINK_CLICKS, etc.
    bid_amount = Column(Float, nullable=True)  # In cents
    bid_strategy = Column(String(100), nullable=True)  # LOWEST_COST_WITHOUT_CAP, etc.
    
    # Placement
    placements = Column(JSON, nullable=True)  # Instagram Feed, Stories, Reels, Facebook Feed, etc.
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    campaign = relationship("AdCampaign", back_populates="ad_sets")
    ads = relationship("Ad", back_populates="ad_set", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AdSet(id={self.id}, name='{self.adset_name}', status={self.status})>"


class AdCreative(Base):
    """Meta Ad Creative"""
    __tablename__ = "ad_creatives"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Creative Details
    creative_id = Column(String(255), nullable=True, index=True)  # Meta creative ID
    creative_name = Column(String(255), nullable=False)
    
    # Media
    image_url = Column(Text, nullable=True)
    image_hash = Column(String(255), nullable=True)  # Meta image hash
    video_url = Column(Text, nullable=True)
    video_id = Column(String(255), nullable=True)  # Meta video ID
    
    # Content
    caption = Column(Text, nullable=True)
    link_url = Column(Text, nullable=True)
    call_to_action = Column(String(100), nullable=True)  # LEARN_MORE, SHOP_NOW, SEND_MESSAGE, etc.
    
    # WhatsApp CTA
    whatsapp_number = Column(String(50), nullable=True)
    whatsapp_message = Column(Text, nullable=True)
    
    # AI Generated
    ai_generated = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    ads = relationship("Ad", back_populates="creative")
    
    def __repr__(self):
        return f"<AdCreative(id={self.id}, name='{self.creative_name}')>"


class Ad(Base):
    """Meta Ad"""
    __tablename__ = "ads"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    adset_id = Column(Integer, ForeignKey("ad_sets.id", ondelete="CASCADE"), nullable=False)
    creative_id = Column(Integer, ForeignKey("ad_creatives.id", ondelete="CASCADE"), nullable=False)
    
    # Ad Details
    ad_id = Column(String(255), nullable=True, index=True)  # Meta ad ID
    ad_name = Column(String(255), nullable=False)
    status = Column(SQLEnum(AdStatus), default=AdStatus.PAUSED, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    ad_set = relationship("AdSet", back_populates="ads")
    creative = relationship("AdCreative", back_populates="ads")
    
    def __repr__(self):
        return f"<Ad(id={self.id}, name='{self.ad_name}', status={self.status})>"


class AdAnalytics(Base):
    """Meta Ad Analytics (time-series data)"""
    __tablename__ = "ad_analytics"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("ad_campaigns.id", ondelete="CASCADE"), nullable=False)
    
    # Date Range
    date = Column(DateTime, nullable=False, index=True)
    
    # Performance Metrics
    impressions = Column(Integer, default=0, nullable=False)
    clicks = Column(Integer, default=0, nullable=False)
    reach = Column(Integer, default=0, nullable=False)
    
    # Engagement
    likes = Column(Integer, default=0, nullable=False)
    comments = Column(Integer, default=0, nullable=False)
    shares = Column(Integer, default=0, nullable=False)
    saves = Column(Integer, default=0, nullable=False)
    
    # Financial
    spend = Column(Float, default=0.0, nullable=False)  # In currency
    cpc = Column(Float, default=0.0, nullable=False)  # Cost per click
    cpm = Column(Float, default=0.0, nullable=False)  # Cost per 1000 impressions
    ctr = Column(Float, default=0.0, nullable=False)  # Click-through rate
    
    # Conversions
    conversions = Column(Integer, default=0, nullable=False)
    conversion_value = Column(Float, default=0.0, nullable=False)
    roas = Column(Float, default=0.0, nullable=False)  # Return on ad spend
    
    # Raw Data from Meta
    raw_insights = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    campaign = relationship("AdCampaign", back_populates="analytics")
    
    def __repr__(self):
        return f"<AdAnalytics(campaign_id={self.campaign_id}, date={self.date}, impressions={self.impressions})>"


class AudienceInsight(Base):
    """AI-generated audience insights"""
    __tablename__ = "ai_audience_insights"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Business Context
    business_category = Column(String(255), nullable=True)
    business_location = Column(String(255), nullable=True)
    
    # Post Context (if analyzing a specific post)
    post_content = Column(Text, nullable=True)
    post_caption = Column(Text, nullable=True)
    post_hashtags = Column(JSON, nullable=True)
    
    # AI Recommendations
    recommended_age_min = Column(Integer, nullable=True)
    recommended_age_max = Column(Integer, nullable=True)
    recommended_genders = Column(JSON, nullable=True)  # ["male", "female", "all"]
    recommended_locations = Column(JSON, nullable=True)
    recommended_interests = Column(JSON, nullable=True)
    recommended_radius_km = Column(Integer, nullable=True)
    
    # Predictions
    estimated_reach_min = Column(Integer, nullable=True)
    estimated_reach_max = Column(Integer, nullable=True)
    estimated_engagement_rate = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # AI Reasoning
    reasoning = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<AudienceInsight(id={self.id}, user_id={self.user_id})>"


class BudgetRecommendation(Base):
    """AI-generated budget recommendations"""
    __tablename__ = "budget_recommendations"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Campaign Context
    objective = Column(String(100), nullable=True)
    target_audience_size = Column(Integer, nullable=True)
    
    # AI Recommendations
    recommended_daily_budget = Column(Float, nullable=False)  # In currency
    recommended_duration_days = Column(Integer, nullable=False)
    recommended_total_budget = Column(Float, nullable=False)
    
    # Predictions
    estimated_impressions_min = Column(Integer, nullable=True)
    estimated_impressions_max = Column(Integer, nullable=True)
    estimated_clicks_min = Column(Integer, nullable=True)
    estimated_clicks_max = Column(Integer, nullable=True)
    estimated_reach_min = Column(Integer, nullable=True)
    estimated_reach_max = Column(Integer, nullable=True)
    estimated_cpc = Column(Float, nullable=True)
    estimated_cpm = Column(Float, nullable=True)
    
    # AI Reasoning
    reasoning = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<BudgetRecommendation(id={self.id}, daily_budget={self.recommended_daily_budget})>"


class CampaignLog(Base):
    """Campaign activity logs"""
    __tablename__ = "campaign_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("ad_campaigns.id", ondelete="CASCADE"), nullable=False)
    
    # Log Details
    action = Column(String(100), nullable=False)  # created, paused, resumed, updated, etc.
    status = Column(String(50), nullable=False)  # success, error, warning
    message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Meta API Response
    meta_response = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    campaign = relationship("AdCampaign", back_populates="logs")
    
    def __repr__(self):
        return f"<CampaignLog(campaign_id={self.campaign_id}, action='{self.action}', status='{self.status}')>"


class AIAdRecommendation(Base):
    """AI-powered ad optimization recommendations"""
    __tablename__ = "ai_ad_recommendations"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("ad_campaigns.id", ondelete="CASCADE"), nullable=False)
    
    # Recommendation Type
    recommendation_type = Column(String(100), nullable=False)  # budget_increase, audience_expansion, creative_refresh, etc.
    priority = Column(String(50), nullable=False)  # high, medium, low
    
    # Recommendation Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    expected_impact = Column(Text, nullable=True)
    
    # Action Items
    suggested_actions = Column(JSON, nullable=True)
    
    # Status
    is_applied = Column(Boolean, default=False, nullable=False)
    applied_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    campaign = relationship("AdCampaign")
    
    def __repr__(self):
        return f"<AIAdRecommendation(campaign_id={self.campaign_id}, type='{self.recommendation_type}')>"


# Update User model relationship
from models.user import User
User.meta_accounts = relationship("MetaAccount", back_populates="user", cascade="all, delete-orphan")
