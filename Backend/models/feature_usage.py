"""
Feature Usage Tracking Model
Tracks user usage of AI/generative features with monthly limits
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
from datetime import datetime


class FeatureUsage(Base):
    """Track usage of AI/generative features per user per month"""
    
    __tablename__ = "feature_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Feature identification
    feature_name = Column(String(100), nullable=False, index=True)  # e.g., 'website_generation', 'content_creator'
    feature_endpoint = Column(String(255), nullable=False)  # e.g., '/website-ai/api/websites'
    
    # Usage tracking
    usage_count = Column(Integer, default=0, nullable=False)  # Current month usage
    limit_count = Column(Integer, default=5, nullable=False)  # Monthly limit (default 5)
    
    # Monthly tracking
    current_month = Column(String(7), nullable=False, index=True)  # Format: 'YYYY-MM' (e.g., '2026-05')
    last_used_at = Column(DateTime, nullable=True)
    
    # Admin controls
    is_unlimited = Column(Boolean, default=False, nullable=False)  # Admin can grant unlimited access
    custom_limit = Column(Integer, nullable=True)  # Admin can set custom limit (overrides default 5)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="feature_usages")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_user_feature_month', 'user_id', 'feature_name', 'current_month'),
    )
    
    def __repr__(self):
        return f"<FeatureUsage(user_id={self.user_id}, feature='{self.feature_name}', usage={self.usage_count}/{self.limit_count}, month='{self.current_month}')>"
    
    @property
    def is_limit_reached(self) -> bool:
        """Check if user has reached their limit"""
        if self.is_unlimited:
            return False
        
        effective_limit = self.custom_limit if self.custom_limit is not None else self.limit_count
        return self.usage_count >= effective_limit
    
    @property
    def remaining_uses(self) -> int:
        """Get remaining uses for this month"""
        if self.is_unlimited:
            return 999999  # Represent unlimited
        
        effective_limit = self.custom_limit if self.custom_limit is not None else self.limit_count
        remaining = effective_limit - self.usage_count
        return max(0, remaining)


class FeatureLimitNotification(Base):
    """Track notifications sent to users and admins about limit reached"""
    
    __tablename__ = "feature_limit_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    feature_name = Column(String(100), nullable=False)
    
    # Notification details
    notification_type = Column(String(50), nullable=False)  # 'user_limit_reached', 'admin_alert'
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Admin action tracking
    admin_notified = Column(Boolean, default=False, nullable=False)
    admin_action_taken = Column(Boolean, default=False, nullable=False)
    admin_action_details = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="limit_notifications")
    
    def __repr__(self):
        return f"<FeatureLimitNotification(user_id={self.user_id}, feature='{self.feature_name}', type='{self.notification_type}')>"
