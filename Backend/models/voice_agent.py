"""
AI Voice Agent Models
Database models for voice calling campaigns, leads, and conversations
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
from datetime import datetime
import enum


# ==================== NEW VOICE AGENT MODELS ====================

class CompanyProfile(Base):
    __tablename__ = "company_profile"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    services = Column(Text, nullable=True)
    offers = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIAgent(Base):
    __tablename__ = "ai_agent"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    voice_id = Column(String(100), nullable=True)
    languages = Column(String(255), default="te,en")
    whatsapp_threshold = Column(Integer, default=70)
    created_at = Column(DateTime, default=datetime.utcnow)


class Campaign(Base):
    __tablename__ = "campaign"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    objective = Column(Text, nullable=True)
    agent_id = Column(Integer, nullable=True)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


class Lead(Base):
    __tablename__ = "lead"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    language = Column(String(50), default="te")
    campaign_id = Column(Integer, nullable=True)
    status = Column(String(50), default="pending")
    urgency_score = Column(Integer, default=0)
    budget = Column(String(100), nullable=True)
    student_class = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    interest_level = Column(String(50), default="Cold")
    buying_intent = Column(Integer, default=0)
    admission_probability = Column(Integer, default=0)
    conversion_probability = Column(Integer, default=0)
    existing_institute = Column(String(255), nullable=True)
    callback_time = Column(String(100), nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WhatsAppLog(Base):
    __tablename__ = "whatsapp_log"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, nullable=False)
    phone = Column(String(50), nullable=False)
    message_type = Column(String(50), default="Brochure")
    content = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)


class CallSession(Base):
    __tablename__ = "call_session"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    status = Column(String(50), default="connected")
    transcript = Column(Text, default="")
    summary = Column(Text, nullable=True)
    sentiment = Column(String(50), default="neutral")
    audio_url = Column(String(255), nullable=True)
    lead_id = Column(Integer, nullable=True)
    campaign_id = Column(Integer, nullable=True)
    interest_score = Column(Integer, default=0)
    buying_intent = Column(Integer, default=0)
    admission_probability = Column(Integer, default=0)
    conversion_probability = Column(Integer, default=0)
    lead_category = Column(String(50), default="Cold")
    objections = Column(Text, nullable=True)
    callback_time = Column(String(100), nullable=True)
    whatsapp_sent = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== LEGACY VOICE AGENT MODELS ====================

class CampaignStatus(str, enum.Enum):
    """Campaign status enumeration"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CallStatus(str, enum.Enum):
    """Call status enumeration"""
    PENDING = "pending"
    CALLING = "calling"
    CONNECTED = "connected"
    COMPLETED = "completed"
    FAILED = "failed"
    BUSY = "busy"
    NO_ANSWER = "no_answer"
    INVALID = "invalid"


class LeadStatus(str, enum.Enum):
    """Lead status enumeration"""
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    FOLLOW_UP_REQUIRED = "follow_up_required"
    CALLBACK_REQUESTED = "callback_requested"
    BUSY = "busy"
    INVALID_CONTACT = "invalid_contact"
    CONVERTED = "converted"
    APPOINTMENT_SCHEDULED = "appointment_scheduled"
    PAYMENT_PENDING = "payment_pending"


class Language(str, enum.Enum):
    """Supported languages"""
    TELUGU = "telugu"
    HINGLISH = "hinglish"
    ENGLISH = "english"
    HINDI = "hindi"
    TAMIL = "tamil"


class VoiceCampaign(Base):
    """Voice calling campaign"""
    __tablename__ = "voice_campaigns"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Campaign Details
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Campaign Configuration
    language = Column(SQLEnum(Language), default=Language.ENGLISH, nullable=False)
    voice_type = Column(String(50), default="female", nullable=False)  # male, female
    script_template = Column(Text, nullable=True)  # Conversation script
    
    # Campaign Status
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False, index=True)
    
    # Scheduling
    scheduled_start = Column(DateTime(timezone=True), nullable=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    
    # Statistics
    total_contacts = Column(Integer, default=0)
    calls_completed = Column(Integer, default=0)
    calls_pending = Column(Integer, default=0)
    calls_failed = Column(Integer, default=0)
    
    # Performance Metrics
    avg_call_duration = Column(Float, default=0.0)  # seconds
    conversion_rate = Column(Float, default=0.0)  # percentage
    
    # Retry Configuration
    max_retry_attempts = Column(Integer, default=3)
    retry_interval = Column(Integer, default=3600)  # seconds
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    contacts = relationship("VoiceContact", back_populates="campaign", cascade="all, delete-orphan")
    calls = relationship("VoiceCall", back_populates="campaign", cascade="all, delete-orphan")
    leads = relationship("VoiceLead", back_populates="campaign", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VoiceCampaign {self.name} - {self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "user_id": self.user_id,
            "language": self.language.value if self.language else None,
            "voice_type": self.voice_type,
            "status": self.status.value if self.status else None,
            "scheduled_start": self.scheduled_start.isoformat() if self.scheduled_start else None,
            "scheduled_end": self.scheduled_end.isoformat() if self.scheduled_end else None,
            "total_contacts": self.total_contacts,
            "calls_completed": self.calls_completed,
            "calls_pending": self.calls_pending,
            "calls_failed": self.calls_failed,
            "avg_call_duration": self.avg_call_duration,
            "conversion_rate": self.conversion_rate,
            "script_template": self.script_template,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class VoiceContact(Base):
    """Contact for voice campaign"""
    __tablename__ = "voice_contacts"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Campaign Reference
    campaign_id = Column(Integer, ForeignKey("voice_campaigns.id"), nullable=False, index=True)
    
    # Contact Information
    name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    
    # Additional Data
    custom_data = Column(JSON, nullable=True)  # Custom fields
    
    # Call Tracking
    call_attempts = Column(Integer, default=0)
    last_call_at = Column(DateTime(timezone=True), nullable=True)
    next_call_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_completed = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    campaign = relationship("VoiceCampaign", back_populates="contacts")
    calls = relationship("VoiceCall", back_populates="contact", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VoiceContact {self.name} - {self.phone_number}>"


class VoiceCall(Base):
    """Individual voice call record"""
    __tablename__ = "voice_calls"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # References
    campaign_id = Column(Integer, ForeignKey("voice_campaigns.id"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("voice_contacts.id"), nullable=False, index=True)
    
    # Call Details
    phone_number = Column(String(20), nullable=False)
    call_sid = Column(String(255), nullable=True, unique=True)  # External call ID
    
    # Call Status
    status = Column(SQLEnum(CallStatus), default=CallStatus.PENDING, nullable=False, index=True)
    
    # Call Metrics
    duration = Column(Integer, default=0)  # seconds
    recording_url = Column(String(500), nullable=True)
    
    # Conversation Data
    conversation_transcript = Column(Text, nullable=True)
    conversation_summary = Column(Text, nullable=True)
    customer_sentiment = Column(String(50), nullable=True)  # positive, neutral, negative
    
    # AI Analysis
    intent_detected = Column(String(100), nullable=True)
    keywords_extracted = Column(JSON, nullable=True)
    
    # Outcome
    call_outcome = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    key_quote = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    campaign = relationship("VoiceCampaign", back_populates="calls")
    contact = relationship("VoiceContact", back_populates="calls")

    def __repr__(self):
        return f"<VoiceCall {self.phone_number} - {self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "contact_id": self.contact_id,
            "contact_name": self.contact.name if self.contact else "Customer",
            "phone_number": self.phone_number,
            "status": self.status.value if self.status else None,
            "duration": self.duration,
            "conversation_transcript": self.conversation_transcript,
            "conversation_summary": self.conversation_summary,
            "customer_sentiment": self.customer_sentiment,
            "call_outcome": self.call_outcome,
            "notes": self.notes,
            "key_quote": self.key_quote,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


class VoiceLead(Base):
    """Lead generated from voice campaign"""
    __tablename__ = "voice_leads"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # References
    campaign_id = Column(Integer, ForeignKey("voice_campaigns.id"), nullable=False, index=True)
    contact_id = Column(Integer, ForeignKey("voice_contacts.id"), nullable=False, index=True)
    call_id = Column(Integer, ForeignKey("voice_calls.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Lead Information
    name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    
    # Lead Status
    status = Column(SQLEnum(LeadStatus), default=LeadStatus.INTERESTED, nullable=False, index=True)
    
    # Lead Score
    lead_score = Column(Integer, default=0)  # 0-100
    interest_level = Column(String(50), nullable=True)  # high, medium, low
    
    # Follow-up
    follow_up_required = Column(Boolean, default=False, index=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    callback_requested = Column(Boolean, default=False)
    callback_time = Column(DateTime(timezone=True), nullable=True)
    
    # Appointment
    appointment_scheduled = Column(Boolean, default=False)
    appointment_date = Column(DateTime(timezone=True), nullable=True)
    
    # Interaction History
    interaction_count = Column(Integer, default=1)
    last_interaction_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Notes & Tags
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    custom_fields = Column(JSON, nullable=True)
    key_quote = Column(Text, nullable=True)
    
    # Conversion
    is_converted = Column(Boolean, default=False, index=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    conversion_value = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    campaign = relationship("VoiceCampaign", back_populates="leads")

    def __repr__(self):
        return f"<VoiceLead {self.name} - {self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "name": self.name,
            "phone_number": self.phone_number,
            "email": self.email,
            "status": self.status.value if self.status else None,
            "lead_score": self.lead_score,
            "interest_level": self.interest_level,
            "follow_up_required": self.follow_up_required,
            "follow_up_date": self.follow_up_date.isoformat() if self.follow_up_date else None,
            "callback_requested": self.callback_requested,
            "appointment_scheduled": self.appointment_scheduled,
            "interaction_count": self.interaction_count,
            "is_converted": self.is_converted,
            "notes": self.notes,
            "key_quote": self.key_quote,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class VoiceFollowUp(Base):
    """Follow-up task for leads"""
    __tablename__ = "voice_followups"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # References
    lead_id = Column(Integer, ForeignKey("voice_leads.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Follow-up Details
    follow_up_type = Column(String(50), nullable=False)  # call, whatsapp, email
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Status
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    outcome = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<VoiceFollowUp {self.follow_up_type} - {self.scheduled_at}>"
