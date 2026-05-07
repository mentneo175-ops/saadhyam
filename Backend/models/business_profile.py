"""
Business Profile Model
Stores all business input data including uploaded files and extracted text
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base


class BusinessProfile(Base):
    """Business profile with all input sources"""
    
    __tablename__ = "business_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Business description text (main field)
    business_description = Column(Text, nullable=True)
    
    # File uploads
    pdf_file_url = Column(Text, nullable=True)
    audio_file_url = Column(Text, nullable=True)
    website_url = Column(Text, nullable=True)
    
    # Extracted text from various sources
    pdf_extracted_text = Column(Text, nullable=True)
    audio_extracted_text = Column(Text, nullable=True)
    website_extracted_text = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship
    user = relationship("User", backref="business_profiles")
    
    def __repr__(self):
        return f"<BusinessProfile(id={self.id}, user_id={self.user_id})>"
