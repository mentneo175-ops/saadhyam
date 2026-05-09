"""
WhatsApp Message Model
Stores all WhatsApp messages (incoming and outgoing)
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime
import enum


class MessageDirection(str, enum.Enum):
    """Message direction enum"""
    INCOMING = "incoming"
    OUTGOING = "outgoing"


class MessageType(str, enum.Enum):
    """Message type enum"""
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    AUDIO = "audio"
    TEMPLATE = "template"
    INTERACTIVE = "interactive"


class MessageStatus(str, enum.Enum):
    """Message status enum"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class WhatsAppMessage(Base):
    """WhatsApp Message model"""

    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("whatsapp_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Customer Information
    customer_phone = Column(String(50), nullable=False, index=True)
    customer_name = Column(String(255), nullable=True)
    customer_profile_name = Column(String(255), nullable=True)
    
    # Message Content
    message = Column(Text, nullable=True)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT, nullable=False)
    direction = Column(SQLEnum(MessageDirection), nullable=False, index=True)
    
    # WhatsApp IDs
    whatsapp_message_id = Column(String(255), unique=True, index=True, nullable=True)
    conversation_id = Column(String(255), index=True, nullable=True)
    
    # Status
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.PENDING, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    
    # Media
    media_url = Column(Text, nullable=True)
    media_id = Column(String(255), nullable=True)
    media_mime_type = Column(String(100), nullable=True)
    
    # Template Information (for template messages)
    template_name = Column(String(255), nullable=True)
    template_language = Column(String(10), nullable=True)
    
    # AI Features
    ai_generated = Column(Boolean, default=False, nullable=False)
    ai_confidence_score = Column(Integer, nullable=True)  # 0-100
    
    # Campaign/Automation Link
    campaign_id = Column(Integer, ForeignKey("whatsapp_campaigns.id", ondelete="SET NULL"), nullable=True)
    automation_id = Column(Integer, ForeignKey("whatsapp_automations.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    timestamp = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    account = relationship("WhatsAppAccount", back_populates="messages")
    user = relationship("User", backref="whatsapp_messages")
    campaign = relationship("WhatsAppCampaign", backref="messages")
    automation = relationship("WhatsAppAutomation", backref="messages")

    def __repr__(self):
        return f"<WhatsAppMessage(id={self.id}, direction={self.direction}, customer={self.customer_phone}, status={self.status})>"
