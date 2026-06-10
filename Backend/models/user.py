from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime

# Import for type checking - avoid circular imports by using TYPE_CHECKING
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from models.instagram_analytics import InstagramBusinessAccount


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    # Firebase Authentication Fields
    firebase_uid = Column(String(255), unique=True, index=True, nullable=True)
    auth_provider = Column(String(50), default="email", nullable=False)  # 'email', 'google', or 'both'
    profile_picture = Column(String(500), nullable=True)
    
    # Legacy password field (nullable for Firebase users)
    hashed_password = Column(String(255), nullable=True)
    
    name = Column(String(255), nullable=True)  # User's full name
    is_active = Column(Boolean, default=True, nullable=False)  # Account active status
    is_suspended = Column(Boolean, default=False, nullable=False)
    
    # Session Tracking Fields (for single-session enforcement)
    active_session_token = Column(String(500), nullable=True)  # Current active session token
    session_created_at = Column(DateTime, nullable=True)  # When session was created
    session_ip_address = Column(String(45), nullable=True)  # IP address of active session
    session_user_agent = Column(Text, nullable=True)  # Browser/device info
    
    # Business Profile Fields
    business_name = Column(String(255), nullable=True)
    business_type = Column(String(100), nullable=True)
    business_location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)  # Latitude coordinate
    longitude = Column(Float, nullable=True)  # Longitude coordinate
    business_description = Column(Text, nullable=True)
    business_services = Column(Text, nullable=True)
    business_setup_completed = Column(Boolean, default=False, nullable=False)
    
    # Business Input Sources (for edit functionality)
    pdf_file_url = Column(Text, nullable=True)  # Path to uploaded PDF
    website_url = Column(Text, nullable=True)  # Imported website URL
    
    # Selected plan / subscription fields
    selected_plan_key = Column(String(50), nullable=True)
    selected_plan_name = Column(String(255), nullable=True)
    selected_plan_price = Column(String(50), nullable=True)
    selected_plan_payment_id = Column(String(255), nullable=True)
    selected_plan_coupon_code = Column(String(50), nullable=True)
    selected_plan_amount_paid = Column(Float, nullable=True)
    selected_plan_currency = Column(String(10), nullable=True)
    selected_plan_status = Column(String(50), nullable=True)
    selected_plan_purchased_at = Column(DateTime, nullable=True)

    # Generated Website
    last_generated_website_id = Column(String(36), nullable=True)  # UUID of last generated website
    
    # Privacy & Sharing Controls
    analysis_sharing = Column(String(50), default="private", nullable=False)  # 'private' | 'anonymous' | 'public'
    share_business_data = Column(Boolean, default=False, nullable=False)  # Allow sharing with similar businesses
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    social_accounts = relationship(
        "SocialAccount", back_populates="user", cascade="all, delete-orphan"
    )
    scheduled_posts = relationship(
        "ScheduledPost", back_populates="user", cascade="all, delete-orphan"
    )
    instagram_business_accounts = relationship(
        "InstagramBusinessAccount", 
        back_populates="user", 
        cascade="all, delete-orphan",
        lazy="select"
    )
    daily_tasks = relationship(
        "DailyTask", back_populates="user", cascade="all, delete-orphan"
    )
    growth_metrics = relationship(
        "GrowthMetric", back_populates="user", cascade="all, delete-orphan"
    )
    notifications = relationship(
        "UserNotification", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}', business='{self.business_name}', provider='{self.auth_provider}')>"
