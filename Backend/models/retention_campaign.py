"""
Retention Campaign Database Models
Store campaign history and analytics
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from config.database import Base


class RetentionCampaign(Base):
    """
    Store retention campaign history
    """
    __tablename__ = "retention_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False, index=True)
    inactive_days = Column(Integer, nullable=False)
    visit_count = Column(Integer, nullable=False)
    total_spent = Column(Float, nullable=False)
    
    # Campaign details
    campaign_type = Column(String(50), nullable=False)  # single, bulk
    offer_type = Column(String(100), nullable=False)
    offer_value = Column(String(50), nullable=False)
    email_subject = Column(String(255), nullable=False)
    email_body = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), nullable=False)  # sent, failed, pending
    error_message = Column(Text, nullable=True)
    email_id = Column(String(100), nullable=True)  # Resend email ID
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Indexes for fast queries
    __table_args__ = (
        {'extend_existing': True}
    )


class CampaignAnalytics(Base):
    """
    Store campaign analytics summary
    """
    __tablename__ = "campaign_analytics"

    id = Column(Integer, primary_key=True, index=True)
    total_campaigns = Column(Integer, default=0)
    total_emails_sent = Column(Integer, default=0)
    total_emails_failed = Column(Integer, default=0)
    total_customers_reached = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    last_campaign_date = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

