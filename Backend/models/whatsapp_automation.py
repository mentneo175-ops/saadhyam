"""
WhatsApp Automation Model
Stores automation rules and follow-up sequences
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime
import enum


class AutomationType(str, enum.Enum):
    """Automation type enum"""
    AUTO_REPLY = "auto_reply"
    FOLLOW_UP = "follow_up"
    WELCOME_MESSAGE = "welcome_message"
    REMINDER = "reminder"
    THANK_YOU = "thank_you"
    CUSTOM = "custom"


class TriggerEvent(str, enum.Enum):
    """Trigger event enum"""
    NEW_MESSAGE = "new_message"
    NO_REPLY = "no_reply"
    KEYWORD_MATCH = "keyword_match"
    TIME_BASED = "time_based"
    AFTER_PURCHASE = "after_purchase"
    CUSTOM = "custom"


class WhatsAppAutomation(Base):
    """WhatsApp Automation model"""

    __tablename__ = "whatsapp_automations"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("whatsapp_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Automation Details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    automation_type = Column(SQLEnum(AutomationType), nullable=False, index=True)
    
    # Trigger Configuration
    trigger_event = Column(SQLEnum(TriggerEvent), nullable=False)
    trigger_keywords = Column(JSON, nullable=True)  # List of keywords for keyword_match
    
    # Message Template
    message_template = Column(Text, nullable=False)
    use_ai = Column(Boolean, default=False, nullable=False)
    
    # Timing
    delay_minutes = Column(Integer, default=0, nullable=False)  # Delay before sending
    
    # Working Hours (JSON format: {"start": "09:00", "end": "18:00", "days": ["mon", "tue", ...]})
    working_hours = Column(JSON, nullable=True)
    
    # Status
    is_enabled = Column(Boolean, default=True, nullable=False, index=True)
    
    # Analytics
    triggered_count = Column(Integer, default=0, nullable=False)
    sent_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    last_triggered_at = Column(DateTime, nullable=True)

    # Relationships
    account = relationship("WhatsAppAccount", back_populates="automations")
    user = relationship("User", backref="whatsapp_automations")

    def __repr__(self):
        return f"<WhatsAppAutomation(id={self.id}, name='{self.name}', type={self.automation_type}, enabled={self.is_enabled})>"
