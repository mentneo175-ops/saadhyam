from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class UserNotification(Base):
    """Persistent inbox notification for a user."""

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info", nullable=False)
    target_type = Column(String(50), default="global", nullable=False, index=True)
    source = Column(String(50), default="admin", nullable=False)
    created_by = Column(Integer, nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    extra_data = Column(JSON, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("idx_notifications_user_read", "user_id", "is_read"),
        Index("idx_notifications_user_created", "user_id", "created_at"),
    )

    def __repr__(self):
        return f"<UserNotification(id={self.id}, user_id={self.user_id}, title='{self.title}', type='{self.type}')>"