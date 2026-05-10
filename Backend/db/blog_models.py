"""
Blog Models
Database models for blog management
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base


class Blog(Base):
    """Blog posts table"""
    __tablename__ = "blogs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Blog content
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False, index=True)
    meta_description = Column(String(500))
    featured_image_url = Column(String(1000))
    featured_image_prompt = Column(Text)
    
    # Content
    introduction = Column(Text)
    main_content = Column(JSON)  # Array of sections with headings and content
    conclusion = Column(Text)
    
    # SEO
    seo_keywords = Column(JSON)  # Array of keywords
    tags = Column(JSON)  # Array of tags
    category = Column(String(100))
    
    # Metadata
    reading_time = Column(Integer)  # Minutes
    word_count = Column(Integer)
    
    # FAQ
    faq = Column(JSON)  # Array of {question, answer}
    
    # Internal links
    internal_links = Column(JSON)  # Array of {anchor_text, url, context}
    
    # CTA
    cta = Column(JSON)  # {text, button_text, link}
    
    # Publishing
    status = Column(String(50), default="draft")  # draft, published, archived
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Source
    source = Column(String(100), default="auto_blogger")  # auto_blogger, manual, imported
    
    # Relationships (one-way, no back_populates needed)
    # user = relationship("User")
