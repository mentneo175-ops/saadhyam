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


class RadarOpportunity(Base):
    """
    Store proactive growth opportunities for the user's business.
    """
    __tablename__ = "radar_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)  # 'nearby', 'seasonal', 'b2b', 'trend'
    estimated_value = Column(String(100), nullable=True)
    urgency = Column(String(50), default="medium")  # 'high', 'medium', 'low'
    distance = Column(String(100), nullable=True)
    action_label = Column(String(100), default="Action")
    action_link = Column(String(500), nullable=True)
    status = Column(String(50), default="active")  # 'active', 'contacted', 'dismissed'
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<RadarOpportunity(id={self.id}, user_id={self.user_id}, title='{self.title}', category='{self.category}', status='{self.status}')>"


class CompetitorIntelligence(Base):
    """
    Store competitor monitoring details and AI intelligence.
    """
    __tablename__ = "competitor_intelligence"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    website_or_social = Column(String(500), nullable=True)

    # Competitor Snapshot Metrics
    activity_score = Column(Integer, default=50)  # Activity level 0-100
    trending_offers = Column(Text, nullable=True)  # JSON array
    review_sentiment = Column(String(100), nullable=True)  # e.g., "75% Positive" or JSON
    pricing_trend = Column(String(255), nullable=True)  # e.g., "Stable", "Decreased recently"

    # Detailed Monitored Modules (stored as JSON string)
    ads_data = Column(Text, nullable=True)  # JSON object containing: Facebook, Instagram, Google, local promotions
    offers_data = Column(Text, nullable=True)  # JSON object containing: discount campaigns, bundle offers, deals
    reviews_data = Column(Text, nullable=True)  # JSON object containing: Google, social platforms, patterns
    social_data = Column(Text, nullable=True)  # JSON object containing: Instagram posts, updates, engagement
    pricing_data = Column(Text, nullable=True)  # JSON object containing: product pricing, price changes
    demand_data = Column(Text, nullable=True)  # JSON object comparing: search trends, buying behavior

    # Actionable AI Recommendation Cards (stored as JSON string)
    recommendations = Column(Text, nullable=True)  # JSON array of recommendation objects

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CompetitorIntelligence(id={self.id}, user_id={self.user_id}, name='{self.name}', activity_score={self.activity_score})>"



# Website AI models (optional)
try:
    from ai_models.website_ai.app.db.models.job import Job
    from ai_models.website_ai.app.db.models.website import Website
    from ai_models.website_ai.app.db.models.content import ContentEdit
    from ai_models.website_ai.app.db.models.theme_config import ThemeConfig
except Exception:
    pass

