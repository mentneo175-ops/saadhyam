"""
WhatsApp Business Account Model
Stores WhatsApp Business account connection details
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class WhatsAppAccount(Base):
    """WhatsApp Business Account model"""

    __tablename__ = "whatsapp_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Business Information
    business_name = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=False, index=True)
    phone_number_id = Column(String(255), nullable=False, unique=True, index=True)
    waba_id = Column(String(255), nullable=False, index=True)  # WhatsApp Business Account ID
    
    # Access Credentials (encrypted)
    access_token = Column(Text, nullable=False)  # Should be encrypted in production
    
    # Connection Status
    connected_at = Column(DateTime, server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_sync_at = Column(DateTime, nullable=True)
    
    # Webhook Verification
    webhook_verified = Column(Boolean, default=False, nullable=False)
    webhook_verify_token = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="whatsapp_accounts")
    messages = relationship("WhatsAppMessage", back_populates="account", cascade="all, delete-orphan")
    campaigns = relationship("WhatsAppCampaign", back_populates="account", cascade="all, delete-orphan")
    automations = relationship("WhatsAppAutomation", back_populates="account", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WhatsAppAccount(id={self.id}, user_id={self.user_id}, phone={self.phone_number}, active={self.is_active})>"
