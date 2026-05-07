"""
Database Models for Saadhyam AI - Review Reply AI
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from config.database import Base


class ReviewHistory(Base):
    """
    Store review reply history
    """
    __tablename__ = "review_history"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Input data
    review = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    business_type = Column(String(100), nullable=False)
    tone = Column(String(50), default="professional")
    
    # Generated reply
    reply = Column(Text, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Optional: User feedback
    is_helpful = Column(Boolean, nullable=True)
    feedback = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ReviewHistory(id={self.id}, user_id={self.user_id}, rating={self.rating}, business_type={self.business_type})>"


class BusinessAnalysis(Base):
    """
    Store comprehensive business analysis results from Gemini API
    ONE analysis populates ALL features (Business Analysis, Competitor Analysis, Dashboard, Daily Ask, SEO)
    """
    __tablename__ = "business_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # OLD FIELDS (kept for backward compatibility)
    description = Column(Text, nullable=True)
    business_score = Column(Integer, nullable=True)  # 1-10
    ai_visibility_score = Column(Integer, nullable=True)  # 0-100
    conversion_score = Column(Integer, nullable=True)  # 0-100
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    opportunities = Column(Text, nullable=True)
    threats = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    
    # NEW COMPREHENSIVE FIELDS
    # Business details
    business_name = Column(String(200), nullable=True)
    business_type = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    services = Column(Text, nullable=True)  # JSON array
    target_audience = Column(Text, nullable=True)
    goals = Column(Text, nullable=True)
    website_or_instagram = Column(String(500), nullable=True)
    business_summary = Column(Text, nullable=True)
    
    # Analysis results (JSON stored as TEXT)
    strengths_data = Column(Text, nullable=True)  # JSON array
    weaknesses_data = Column(Text, nullable=True)  # JSON array
    growth_opportunities_data = Column(Text, nullable=True)  # JSON array
    
    # Local market insights (JSON)
    local_market_insights = Column(Text, nullable=True)  # JSON object
    
    # Competitor analysis (JSON)
    competitor_analysis = Column(Text, nullable=True)  # JSON object
    
    # SEO & Google Maps tips (JSON)
    seo_google_maps_tips = Column(Text, nullable=True)  # JSON object
    
    # 30-day growth plan (JSON)
    thirty_day_growth_plan = Column(Text, nullable=True)  # JSON object
    
    # Daily suggestions (JSON)
    daily_suggestions = Column(Text, nullable=True)  # JSON array
    
    # Health score
    health_score = Column(Integer, default=0)
    
    # Analysis metadata
    analysis_source = Column(String(100), nullable=True)  # 'google_ai_studio_gemini_search_grounding'
    last_analyzed_at = Column(DateTime, nullable=True)
    analysis_status = Column(String(50), default='pending')  # pending, analyzing, completed, error
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<BusinessAnalysis(id={self.id}, user_id={self.user_id}, business_name={self.business_name}, health_score={self.health_score})>"


# Website AI models (optional)
try:
    from ai_models.website_ai.app.db.models.job import Job
    from ai_models.website_ai.app.db.models.website import Website
    from ai_models.website_ai.app.db.models.content import ContentEdit
    from ai_models.website_ai.app.db.models.theme_config import ThemeConfig
except Exception:
    pass
