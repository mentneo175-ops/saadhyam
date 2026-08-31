"""
Database Models for LinkedIn Store Solution
Architecture:
1. LinkedInPluginConfig: Secure application-level OAuth configuration scoped specifically to plugin_key="marketing_linkedin" (zero .env dependency)
2. LinkedInConnection: Per-user LinkedIn connection scoped to (user_id, plugin_key="marketing_linkedin") with encrypted tokens at rest
3. LinkedInPostHistory: Per-user post publication audit trail and URN records
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class LinkedInPostStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"


class LinkedInPluginConfig(Base):
    """
    Stores LinkedIn OAuth Application credentials specifically for plugin_key='marketing_linkedin'.
    Removes any dependency on global environment variables.
    """

    __tablename__ = "linkedin_plugin_config"

    id = Column(Integer, primary_key=True, index=True)
    plugin_key = Column(String(100), default="marketing_linkedin", unique=True, nullable=False, index=True)

    # OAuth Application Credentials (Platform level for this specific plugin)
    client_id = Column(String(255), nullable=True)
    client_secret_encrypted = Column(Text, nullable=True)
    redirect_uri = Column(String(500), default="http://localhost:8000/api/linkedin/oauth/callback", nullable=False)

    # Operational status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    @property
    def encrypted_client_secret(self) -> str:
        return self.client_secret_encrypted

    @encrypted_client_secret.setter
    def encrypted_client_secret(self, value: str):
        self.client_secret_encrypted = value


class LinkedInConnection(Base):
    """Stores user's LinkedIn OAuth connection and profile details scoped per user and per store product."""

    __tablename__ = "linkedin_connections"
    __table_args__ = (
        UniqueConstraint("user_id", "plugin_key", name="uq_linkedin_connections_user_plugin"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plugin_key = Column(String(100), default="marketing_linkedin", nullable=False, index=True)

    # LinkedIn Identity
    linkedin_member_id = Column(String(100), nullable=True, index=True)  # OpenID Connect "sub"
    linkedin_name = Column(String(255), nullable=True)
    linkedin_email = Column(String(255), nullable=True)
    linkedin_profile_picture = Column(Text, nullable=True)

    # OAuth Tokens (Encrypted at rest)
    access_token_encrypted = Column(Text, nullable=True)
    refresh_token_encrypted = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    scopes = Column(String(255), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_connected_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Aliases for explicit encrypted property names
    @property
    def encrypted_access_token(self) -> str:
        return self.access_token_encrypted

    @encrypted_access_token.setter
    def encrypted_access_token(self, value: str):
        self.access_token_encrypted = value

    @property
    def encrypted_refresh_token(self) -> str:
        return self.refresh_token_encrypted

    @encrypted_refresh_token.setter
    def encrypted_refresh_token(self, value: str):
        self.refresh_token_encrypted = value

    @property
    def expires_at(self):
        return self.token_expires_at

    @expires_at.setter
    def expires_at(self, value):
        self.token_expires_at = value

    # Relationships
    user = relationship("User", back_populates="linkedin_connection")
    post_history = relationship("LinkedInPostHistory", back_populates="connection", cascade="all, delete-orphan")


class LinkedInPostHistory(Base):
    """Tracks published LinkedIn posts and drafts scoped per user and per store product."""

    __tablename__ = "linkedin_post_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plugin_key = Column(String(100), default="marketing_linkedin", nullable=False, index=True)
    linkedin_connection_id = Column(Integer, ForeignKey("linkedin_connections.id", ondelete="SET NULL"), nullable=True)

    # Post Details
    post_urn = Column(String(255), nullable=True, index=True)  # e.g., "urn:li:share:123456789"
    content = Column(Text, nullable=False)
    topic = Column(String(255), nullable=True)
    status = Column(Enum(LinkedInPostStatus), default=LinkedInPostStatus.DRAFT, nullable=False)
    error_message = Column(Text, nullable=True)

    # Timestamps
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="linkedin_posts")
    connection = relationship("LinkedInConnection", back_populates="post_history")