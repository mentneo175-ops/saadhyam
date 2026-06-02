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


class GoogleBusinessAccount(Base):
    """Store connected Google Business Profile accounts and main tokens."""

    __tablename__ = "google_business_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    social_account_id = Column(
        Integer, ForeignKey("social_accounts.id"), nullable=False, index=True
    )
    
    account_id = Column(String(255), unique=True, nullable=False, index=True)  # Google's accounts/{id}
    account_name = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")
    social_account = relationship("SocialAccount")
    locations = relationship(
        "GoogleBusinessLocation", back_populates="account", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<GoogleBusinessAccount(id={self.id}, account_name='{self.account_name}')>"


class GoogleBusinessLocation(Base):
    """Store local locations/shops connected under a Google Business account."""

    __tablename__ = "google_business_locations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(
        Integer, ForeignKey("google_business_accounts.id"), nullable=False, index=True
    )
    
    location_id = Column(String(255), unique=True, nullable=False, index=True)  # Google's locations/{id}
    location_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(Text, nullable=True)
    primary_category = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User")
    account = relationship("GoogleBusinessAccount", back_populates="locations")
    reviews = relationship(
        "GoogleBusinessReview", back_populates="location", cascade="all, delete-orphan"
    )
    posts = relationship(
        "GoogleBusinessPost", back_populates="location", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<GoogleBusinessLocation(id={self.id}, name='{self.location_name}')>"


class GoogleBusinessReview(Base):
    """Store customer reviews fetched from Google Maps Business Listing."""

    __tablename__ = "google_business_reviews"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(
        Integer, ForeignKey("google_business_locations.id"), nullable=False, index=True
    )
    
    review_id = Column(String(255), unique=True, nullable=False, index=True)  # Google review ID
    reviewer_name = Column(String(255), nullable=False)
    reviewer_photo = Column(Text, nullable=True)
    rating = Column(Integer, nullable=False)  # 1 to 5 stars
    comment = Column(Text, nullable=True)
    
    # Reply details
    reply_comment = Column(Text, nullable=True)
    reply_submitted_at = Column(DateTime, nullable=True)
    
    review_created_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    location = relationship("GoogleBusinessLocation", back_populates="reviews")

    def __repr__(self):
        return f"<GoogleBusinessReview(id={self.id}, reviewer='{self.reviewer_name}', rating={self.rating})>"


class GoogleBusinessPost(Base):
    """Store local updates / posts published on Google Maps location."""

    __tablename__ = "google_business_posts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(
        Integer, ForeignKey("google_business_locations.id"), nullable=False, index=True
    )
    
    post_id = Column(String(255), unique=True, nullable=True, index=True)  # Google localPost ID (None if pending/failed)
    summary = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    action_type = Column(String(50), default="LEARN_MORE")  # CALL, BOOK, LEARN_MORE, ORDER, SHOP
    action_url = Column(Text, nullable=True)
    
    status = Column(String(50), default="pending", index=True)  # pending, published, failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    location = relationship("GoogleBusinessLocation", back_populates="posts")

    def __repr__(self):
        return f"<GoogleBusinessPost(id={self.id}, status='{self.status}')>"
