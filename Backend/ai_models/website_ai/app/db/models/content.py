"""
Content edit model for inline editing
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
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


class ContentEdit(Base):
    """Content edits for inline editing"""

    __tablename__ = "content_edits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    website_id = Column(GUID(), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)

    content_data = Column(JSON, nullable=False)  # Edited content - using JSON for SQLite compatibility
    theme = Column(String(50), nullable=True)
    version = Column(Integer, default=1)  # Version tracking

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    # Relationships
    website = relationship("Website", back_populates="content_edits")

    def __repr__(self):
        return f"<ContentEdit {self.id} - Website {self.website_id} - v{self.version}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "website_id": str(self.website_id),
            "content_data": self.content_data,
            "theme": self.theme,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

