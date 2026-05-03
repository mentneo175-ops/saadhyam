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
    Store business analysis results
    """
    __tablename__ = "business_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Input data
    description = Column(Text, nullable=False)
    
    # Analysis scores
    business_score = Column(Integer, nullable=False)  # 1-10
    ai_visibility_score = Column(Integer, nullable=False)  # 0-100
    conversion_score = Column(Integer, nullable=False)  # 0-100
    
    # Analysis insights (stored as comma-separated strings)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    opportunities = Column(Text, nullable=True)
    threats = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<BusinessAnalysis(id={self.id}, user_id={self.user_id}, business_score={self.business_score}, ai_visibility_score={self.ai_visibility_score})>"
