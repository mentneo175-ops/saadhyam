"""
Influencer Database Model
Persistent storage for real influencer data
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from config.database import Base


class Influencer(Base):
    """
    Real influencer data storage
    Collected from Apify Instagram Scraper and Google Search
    """
    __tablename__ = "influencers"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Identity
    username = Column(String(255), unique=True, index=True, nullable=False)
    display_name = Column(String(255), nullable=True)
    platform = Column(String(50), default="instagram", index=True)
    
    # Profile Data
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False, index=True)
    
    # Metrics
    followers = Column(Integer, default=0, index=True)
    following = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0, index=True)
    avg_likes = Column(Integer, default=0)
    avg_comments = Column(Integer, default=0)
    
    # Categorization
    primary_niche = Column(String(100), index=True, nullable=False)  # food, travel, fitness, etc.
    secondary_niches = Column(JSON, nullable=True)  # ["lifestyle", "photography"]
    hashtags = Column(JSON, nullable=True)  # ["#food", "#foodie", "#chef"]
    
    # Location
    location = Column(String(255), nullable=True, index=True)
    country = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    city = Column(String(100), nullable=True, index=True)
    
    # Quality Scores
    relevance_score = Column(Float, default=0.0, index=True)  # 0-100
    quality_score = Column(Float, default=0.0, index=True)    # 0-100
    authenticity_score = Column(Float, default=0.0)           # 0-100
    
    # Data Source
    data_source = Column(String(50), default="apify")  # apify, rapidapi, manual
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Metadata
    external_url = Column(String(500), nullable=True)  # Instagram profile URL
    contact_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Influencer {self.username} - {self.primary_niche} - {self.followers} followers>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "platform": self.platform,
            "bio": self.bio,
            "profile_image_url": self.profile_image_url,
            "is_verified": self.is_verified,
            "followers": self.followers,
            "following": self.following,
            "posts_count": self.posts_count,
            "engagement_rate": self.engagement_rate,
            "avg_likes": self.avg_likes,
            "avg_comments": self.avg_comments,
            "primary_niche": self.primary_niche,
            "secondary_niches": self.secondary_niches,
            "hashtags": self.hashtags,
            "location": self.location,
            "country": self.country,
            "state": self.state,
            "city": self.city,
            "relevance_score": self.relevance_score,
            "quality_score": self.quality_score,
            "authenticity_score": self.authenticity_score,
            "data_source": self.data_source,
            "external_url": self.external_url,
            "contact_email": self.contact_email,
            "is_active": self.is_active,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
