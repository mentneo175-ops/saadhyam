"""
WhatsApp Campaign Model
Stores WhatsApp broadcast campaigns
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime
import enum


class CampaignStatus(str, enum.Enum):
    """Campaign status enum"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    PAUSED = "paused"
    FAILED = "failed"


class WhatsAppCampaign(Base):
    """WhatsApp Campaign model"""

    __tablename__ = "whatsapp_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("whatsapp_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Campaign Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Message Content
    message_content = Column(Text, nullable=False)
    template_name = Column(String(255), nullable=True)
    template_language = Column(String(10), default="en", nullable=False)
    
    # Media
    media_url = Column(Text, nullable=True)
    media_type = Column(String(50), nullable=True)  # image, video, document
    
    # Recipients
    recipient_list = Column(JSON, nullable=True)  # List of phone numbers
    total_recipients = Column(Integer, default=0, nullable=False)
    
    # Scheduling
    scheduled_time = Column(DateTime, nullable=True, index=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    # Status
    campaign_status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False, index=True)
    
    # Analytics
    sent_count = Column(Integer, default=0, nullable=False)
    delivered_count = Column(Integer, default=0, nullable=False)
    read_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    
    # Error Tracking
    error_message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    account = relationship("WhatsAppAccount", back_populates="campaigns")
    user = relationship("User", backref="whatsapp_campaigns")

    def __repr__(self):
        return f"<WhatsAppCampaign(id={self.id}, title='{self.title}', status={self.campaign_status}, recipients={self.total_recipients})>"
