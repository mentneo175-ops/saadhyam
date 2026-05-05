"""
Theme configuration model for dynamic theming
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB

from ai_models.website_ai.app.db.session import Base


class ThemeConfig(Base):
    """Theme configuration for dynamic styling"""

    __tablename__ = "theme_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)

    config_data = Column(JSON, nullable=False)  # Using JSON for SQLite compatibility
    # Structure: {colors, typography, spacing, borders, shadows}

    is_default = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ThemeConfig {self.name}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "config_data": self.config_data,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

