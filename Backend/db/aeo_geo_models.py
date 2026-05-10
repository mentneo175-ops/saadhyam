"""
AEO/GEO Database Models for Saadhyam AI
Answer Engine Optimization + Generative Engine Optimization
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON
from config.database import Base


class AEOQuestion(Base):
    """
    Store discovered AI-search questions
    """
    __tablename__ = "aeo_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Question details
    question = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)  # informational, transactional, local, comparison, buying_intent
    intent = Column(String(100), nullable=True)
    source = Column(String(100), nullable=True)  # google_autocomplete, people_also_ask, reddit, quora, voice_search, mock
    search_volume = Column(Integer, nullable=True)  # Estimated monthly searches
    difficulty = Column(Float, nullable=True)  # 0-100 difficulty score
    
    # Status
    status = Column(String(50), default='discovered')  # discovered, content_generated, published, optimized
    priority = Column(Integer, default=0)  # Higher = more important
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<AEOQuestion(id={self.id}, question={self.question[:50]}, category={self.category})>"


class AEOContent(Base):
    """
    Store generated AEO content
    """
    __tablename__ = "aeo_content"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("aeo_questions.id"), nullable=True, index=True)
    
    # Content details
    title = Column(String(500), nullable=False)
    question = Column(Text, nullable=False)
    direct_answer = Column(Text, nullable=False)  # 40-60 word answer
    detailed_explanation = Column(Text, nullable=False)
    bullet_points = Column(JSON, nullable=True)  # Array of bullet points
    cta = Column(Text, nullable=True)  # Call to action
    
    # SEO/AEO metadata
    keywords = Column(JSON, nullable=True)  # Array of keywords
    semantic_entities = Column(JSON, nullable=True)  # Array of entities
    readability_score = Column(Float, nullable=True)  # 0-100
    factual_density = Column(Float, nullable=True)  # 0-100
    
    # GEO optimization
    geo_score = Column(Float, default=0)  # 0-100
    aeo_score = Column(Float, default=0)  # 0-100
    topical_authority = Column(Float, default=0)  # 0-100
    
    # Publishing
    is_published = Column(Boolean, default=False)
    published_url = Column(String(500), nullable=True)
    published_at = Column(DateTime, nullable=True)
    
    # Performance tracking
    ai_mentions = Column(Integer, default=0)
    citation_count = Column(Integer, default=0)
    visibility_score = Column(Float, default=0)  # 0-100
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<AEOContent(id={self.id}, title={self.title[:50]}, aeo_score={self.aeo_score})>"


class SchemaMarkup(Base):
    """
    Store generated JSON-LD schema markup
    """
    __tablename__ = "schema_markup"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("aeo_content.id"), nullable=True, index=True)
    
    # Schema details
    schema_type = Column(String(100), nullable=False)  # FAQ, LocalBusiness, Product, Review, Article, Organization, Breadcrumb
    schema_json = Column(JSON, nullable=False)  # Full JSON-LD schema
    
    # Validation
    is_valid = Column(Boolean, default=True)
    validation_errors = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SchemaMarkup(id={self.id}, schema_type={self.schema_type}, is_valid={self.is_valid})>"


class AIVisibility(Base):
    """
    Track AI visibility and mentions
    """
    __tablename__ = "ai_visibility"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("aeo_content.id"), nullable=True, index=True)
    
    # AI Engine details
    ai_engine = Column(String(100), nullable=False)  # chatgpt, gemini, perplexity, claude, google_ai_overview
    query = Column(Text, nullable=False)
    
    # Visibility metrics
    is_mentioned = Column(Boolean, default=False)
    is_cited = Column(Boolean, default=False)
    position = Column(Integer, nullable=True)  # Position in AI response (1-10)
    snippet = Column(Text, nullable=True)  # How the AI mentioned the content
    
    # Scoring
    visibility_score = Column(Float, default=0)  # 0-100
    
    # Metadata
    checked_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AIVisibility(id={self.id}, ai_engine={self.ai_engine}, is_mentioned={self.is_mentioned})>"


class ContentDistribution(Base):
    """
    Track content distribution across platforms
    """
    __tablename__ = "content_distribution"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("aeo_content.id"), nullable=False, index=True)
    
    # Platform details
    platform = Column(String(100), nullable=False)  # linkedin, facebook, instagram, medium, wordpress, quora, reddit, youtube
    platform_url = Column(String(500), nullable=True)
    platform_id = Column(String(200), nullable=True)
    
    # Content adaptation
    adapted_content = Column(Text, nullable=True)  # Platform-specific version
    tone = Column(String(50), nullable=True)  # professional, casual, technical, friendly
    
    # Status
    status = Column(String(50), default='pending')  # pending, published, failed
    published_at = Column(DateTime, nullable=True)
    
    # Performance
    views = Column(Integer, default=0)
    engagements = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ContentDistribution(id={self.id}, platform={self.platform}, status={self.status})>"


class GEOOptimization(Base):
    """
    Store GEO optimization history and scores
    """
    __tablename__ = "geo_optimization"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(Integer, ForeignKey("aeo_content.id"), nullable=False, index=True)
    
    # Optimization details
    optimization_type = Column(String(100), nullable=False)  # semantic_entities, topical_authority, readability, factual_density
    before_score = Column(Float, nullable=True)
    after_score = Column(Float, nullable=True)
    improvement = Column(Float, nullable=True)
    
    # Changes made
    changes = Column(JSON, nullable=True)  # Array of changes
    
    # Status
    status = Column(String(50), default='completed')  # pending, completed, failed
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<GEOOptimization(id={self.id}, optimization_type={self.optimization_type}, improvement={self.improvement})>"
