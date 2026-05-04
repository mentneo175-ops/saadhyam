"""
Job tracking model for async operations
"""
import uuid
from datetime import datetime
from typing import Optional, Union

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, CHAR

from ai_models.website_ai.app.db.session import Base


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32) storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value if isinstance(value, uuid.UUID) else uuid.UUID(value)
        else:
            if isinstance(value, uuid.UUID):
                return value.hex
            else:
                return uuid.UUID(value).hex if value else None

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if isinstance(value, uuid.UUID):
                return value
            else:
                return uuid.UUID(value) if value else None


class Job(Base):
    """Job tracking for async website generation"""

    __tablename__ = "jobs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    job_type = Column(String(50), nullable=False, index=True)  # 'website_generation', 'content_update'
    status = Column(String(20), nullable=False, default="pending", index=True)
    # Status: pending, processing, completed, failed

    input_data = Column(JSON, nullable=False)  # Original request data - using JSON for SQLite compatibility
    result_data = Column(JSON, nullable=True)  # Result when completed - using JSON for SQLite compatibility
    error_message = Column(Text, nullable=True)  # Error details if failed

    website_id = Column(GUID(), ForeignKey("websites.id", ondelete="SET NULL"), nullable=True)
    progress = Column(Integer, default=0)  # 0-100

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    website = relationship("Website", back_populates="jobs")

    def __repr__(self):
        return f"<Job {self.id} - {self.job_type} - {self.status}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "job_type": self.job_type,
            "status": self.status,
            "progress": self.progress,
            "input_data": self.input_data,
            "result_data": self.result_data,
            "error_message": self.error_message,
            "website_id": str(self.website_id) if self.website_id else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

