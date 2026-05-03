from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    ForeignKey,
    Boolean,
    Text,
    Enum,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime
import enum


class SocialPlatform(str, enum.Enum):
    """Available social media platforms."""

    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    TWITTER = "twitter"


class PostStatus(str, enum.Enum):
    """Status of a scheduled/posted item."""

    PENDING = "pending"
    POSTED = "posted"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class SocialAccount(Base):
    """Store connected social media accounts and access tokens."""

    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    platform = Column(String(50), nullable=False)  # instagram, facebook, twitter
    access_token = Column(Text, nullable=False)  # Encrypted
    access_token_expires_at = Column(DateTime, nullable=True)
    refresh_token = Column(Text, nullable=True)  # Encrypted

    # Instagram specific
    ig_user_id = Column(String(255), unique=True, nullable=True, index=True)
    ig_username = Column(String(255), nullable=True)
    page_id = Column(String(255), nullable=True, index=True)
    page_name = Column(String(255), nullable=True)

    connected_at = Column(DateTime, server_default=func.now(), nullable=False)
    disconnected_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="social_accounts")
    scheduled_posts = relationship(
        "ScheduledPost", back_populates="social_account", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<SocialAccount(id={self.id}, user_id={self.user_id}, platform='{self.platform}', ig_username='{self.ig_username}')>"


class ScheduledPost(Base):
    """Store scheduled posts to be published to social media."""

    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    social_account_id = Column(
        Integer, ForeignKey("social_accounts.id"), nullable=False, index=True
    )

    # Post content
    image_url = Column(Text, nullable=False)
    caption = Column(Text, nullable=True)
    ai_generated = Column(Boolean, default=False)

    # Scheduling
    scheduled_time = Column(DateTime, nullable=True, index=True)
    posted_time = Column(DateTime, nullable=True)

    # Status tracking
    status = Column(String(50), default=PostStatus.PENDING.value, index=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Instagram metadata
    instagram_post_id = Column(String(255), unique=True, nullable=True)
    instagram_media_id = Column(String(255), unique=True, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="scheduled_posts")
    social_account = relationship("SocialAccount", back_populates="scheduled_posts")

    def __repr__(self):
        return f"<ScheduledPost(id={self.id}, user_id={self.user_id}, status='{self.status}', scheduled_time={self.scheduled_time})>"


class PostAnalytics(Base):
    """Store analytics data for posted content."""

    __tablename__ = "post_analytics"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_post_id = Column(
        Integer, ForeignKey("scheduled_posts.id"), nullable=False
    )
    instagram_post_id = Column(String(255), index=True)

    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)

    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<PostAnalytics(post_id={self.scheduled_post_id}, likes={self.likes}, reach={self.reach})>"
