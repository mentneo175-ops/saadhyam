"""
Task Tracking Models
Track user's daily tasks and growth progress
"""

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    ForeignKey,
    Boolean,
    Text,
    Float,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class DailyTask(Base):
    """Store daily tasks for users"""
    
    __tablename__ = "daily_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Task Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)  # marketing, content, engagement, analytics, growth
    priority = Column(String(20), default="medium")  # low, medium, high
    
    # Task Metadata
    points = Column(Integer, default=10)  # Points awarded for completion
    estimated_minutes = Column(Integer, default=15)  # Estimated time to complete
    
    # Status
    is_completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Scheduling
    assigned_date = Column(DateTime, nullable=False, index=True)
    due_date = Column(DateTime, nullable=True)
    
    # AI Generated
    is_ai_generated = Column(Boolean, default=False)
    ai_reasoning = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="daily_tasks")
    
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'assigned_date'),
        Index('idx_user_completed', 'user_id', 'is_completed'),
        Index('idx_category_date', 'category', 'assigned_date'),
    )
    
    def __repr__(self):
        return f"<DailyTask(id={self.id}, title='{self.title}', completed={self.is_completed})>"


class GrowthMetric(Base):
    """Store daily growth metrics based on task completion"""
    
    __tablename__ = "growth_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Date
    metric_date = Column(DateTime, nullable=False, index=True)
    
    # Task Completion Metrics
    tasks_assigned = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)  # Percentage
    
    # Points and Streaks
    points_earned = Column(Integer, default=0)
    total_points = Column(Integer, default=0)  # Cumulative
    streak_days = Column(Integer, default=0)
    
    # Category Breakdown
    marketing_tasks = Column(Integer, default=0)
    content_tasks = Column(Integer, default=0)
    engagement_tasks = Column(Integer, default=0)
    analytics_tasks = Column(Integer, default=0)
    growth_tasks = Column(Integer, default=0)
    
    # Growth Score (0-100)
    growth_score = Column(Float, default=0.0)
    
    # Calculated Fields
    productivity_score = Column(Float, default=0.0)  # Based on completion rate and time
    consistency_score = Column(Float, default=0.0)  # Based on streaks
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="growth_metrics")
    
    __table_args__ = (
        Index('idx_user_metric_date', 'user_id', 'metric_date'),
    )
    
    def __repr__(self):
        return f"<GrowthMetric(user_id={self.user_id}, date={self.metric_date}, score={self.growth_score})>"


class TaskTemplate(Base):
    """Store task templates for AI-generated tasks"""
    
    __tablename__ = "task_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Template Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    priority = Column(String(20), default="medium")
    
    # Metadata
    points = Column(Integer, default=10)
    estimated_minutes = Column(Integer, default=15)
    
    # Conditions for assignment
    business_type = Column(String(100), nullable=True)  # restaurant, retail, service, etc.
    requires_instagram = Column(Boolean, default=False)
    requires_whatsapp = Column(Boolean, default=False)
    requires_website = Column(Boolean, default=False)
    
    # Usage tracking
    times_assigned = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<TaskTemplate(id={self.id}, title='{self.title}', category='{self.category}')>"
