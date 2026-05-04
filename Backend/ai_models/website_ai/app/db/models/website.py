"""
Website model for storing generated websites
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, DateTime, Text, JSON
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


class Website(Base):
    """Website record"""

    __tablename__ = "websites"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    business_name = Column(String(120), nullable=False, index=True)
    business_type = Column(String(80), nullable=False)
    description = Column(Text, nullable=True)

    services = Column(JSON, nullable=False)  # List of services - using JSON for SQLite compatibility
    target_audience = Column(String(200), nullable=True)
    tone = Column(String(80), nullable=True)
    branding_style = Column(String(120), nullable=True)

    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    website_url = Column(String(255), nullable=True)

    theme = Column(String(50), nullable=False)
    html_file_path = Column(String(500), nullable=True)  # Local path
    s3_key = Column(String(500), nullable=True)  # S3 object key

    status = Column(String(20), default="active", index=True)  # active, archived, deleted

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    jobs = relationship("Job", back_populates="website")
    content_edits = relationship("ContentEdit", back_populates="website", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Website {self.id} - {self.business_name}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "business_name": self.business_name,
            "business_type": self.business_type,
            "description": self.description,
            "services": self.services,
            "target_audience": self.target_audience,
            "tone": self.tone,
            "branding_style": self.branding_style,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "website_url": self.website_url,
            "theme": self.theme,
            "html_file_path": self.html_file_path,
            "s3_key": self.s3_key,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

