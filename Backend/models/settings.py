from sqlalchemy import Column, String, DateTime, Integer, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class UserSettings(Base):
    """Store user preferences and settings."""

    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)

    # Instagram Automation Settings
    instagram_enabled = Column(Boolean, default=False)
    instagram_auto_publish = Column(Boolean, default=False)
    instagram_auto_reply = Column(Boolean, default=False)
    instagram_save_drafts = Column(Boolean, default=True)

    # Posting Preferences
    preferred_posting_time = Column(String(5), nullable=True)  # HH:MM format
    posting_frequency = Column(String(50), default="daily")  # daily, weekly, custom
    auto_generate_captions = Column(Boolean, default=False)

    # Notification Settings
    notify_on_post = Column(Boolean, default=True)
    notify_on_engagement = Column(Boolean, default=True)
    notify_on_error = Column(Boolean, default=True)

    # Additional Settings (JSON for flexibility)
    automation_rules = Column(JSON, nullable=True)  # Complex automation rules
    blocked_keywords = Column(JSON, nullable=True)  # Keywords to block in captions

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id}, instagram_enabled={self.instagram_enabled})>"
