from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


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
    
    # Business Profile Fields
    business_name = Column(String(255), nullable=True)
    business_type = Column(String(100), nullable=True)
    business_location = Column(String(255), nullable=True)
    business_description = Column(Text, nullable=True)
    business_setup_completed = Column(Boolean, default=False, nullable=False)
    
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

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}', business='{self.business_name}', provider='{self.auth_provider}')>"
