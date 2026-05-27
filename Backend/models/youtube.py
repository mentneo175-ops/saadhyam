from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    ForeignKey,
    Boolean,
    Text,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base


class YouTubeChannel(Base):
    """Store YouTube channel information linked to a social account."""

    __tablename__ = "youtube_channels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    social_account_id = Column(
        Integer, ForeignKey("social_accounts.id"), nullable=False, index=True
    )
    
    channel_id = Column(String(255), unique=True, nullable=False, index=True)
    channel_title = Column(String(255), nullable=True)
    channel_description = Column(Text, nullable=True)
    subscriber_count = Column(Integer, default=0)
    video_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    thumbnail_url = Column(Text, nullable=True)
    uploads_playlist_id = Column(String(255), nullable=True)
    
    synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")
    social_account = relationship("SocialAccount")
    videos = relationship(
        "YouTubeVideo", back_populates="channel", cascade="all, delete-orphan"
    )
    analytics = relationship(
        "YouTubeAnalytics", back_populates="channel", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<YouTubeChannel(id={self.id}, channel_title='{self.channel_title}', subscriber_count={self.subscriber_count})>"


class YouTubeVideo(Base):
    """Store videos uploaded or scheduled for upload to YouTube."""

    __tablename__ = "youtube_videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    channel_id = Column(
        Integer, ForeignKey("youtube_channels.id"), nullable=False, index=True
    )
    
    video_id = Column(String(255), unique=True, nullable=True, index=True)  # YouTube's ID (None if pending/failed)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # List of string tags
    category_id = Column(String(50), default="22")  # Default "22" is People & Blogs
    privacy_status = Column(String(50), default="public")  # public, private, unlisted
    
    video_url = Column(Text, nullable=False)  # Local file path or Cloudinary URL
    thumbnail_url = Column(Text, nullable=True)  # Thumbnail image URL
    video_public_id = Column(Text, nullable=True)
    thumbnail_public_id = Column(Text, nullable=True)
    
    # Scheduling & status tracking
    scheduled_time = Column(DateTime, nullable=True, index=True)
    posted_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, publishing, posted, failed
    error_message = Column(Text, nullable=True)
    
    # Video-specific metrics
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    ai_generated = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")
    channel = relationship("YouTubeChannel", back_populates="videos")

    def __repr__(self):
        return f"<YouTubeVideo(id={self.id}, title='{self.title[:30]}', status='{self.status}')>"


class YouTubeAnalytics(Base):
    """Store snapshot metrics for YouTube channels or videos."""

    __tablename__ = "youtube_analytics"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(
        Integer, ForeignKey("youtube_channels.id"), nullable=False, index=True
    )
    video_id = Column(
        Integer, ForeignKey("youtube_videos.id"), nullable=True, index=True
    )
    
    snapshot_date = Column(DateTime, nullable=False, index=True)
    views = Column(Integer, default=0)
    watch_time_minutes = Column(Integer, default=0)
    subscribers_gained = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    
    # Advanced metadata breakdown
    traffic_sources = Column(JSON, nullable=True)
    demographics = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    channel = relationship("YouTubeChannel", back_populates="analytics")
    video = relationship("YouTubeVideo")

    def __repr__(self):
        return f"<YouTubeAnalytics(id={self.id}, channel_id={self.channel_id}, views={self.views})>"
