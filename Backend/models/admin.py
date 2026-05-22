from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.sql import func
from config.database import Base


class UserFeatureAccess(Base):
    __tablename__ = "user_feature_access"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    feature_name = Column(String(100), nullable=False, index=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    usage_limit = Column(Integer, nullable=True)  # null = unlimited
    usage_count = Column(Integer, default=0, nullable=False)
    reset_period = Column(String(20), default='monthly', nullable=False)  # daily/weekly/monthly
    last_reset = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'feature_name', name='uq_user_feature'),
    )

    def __repr__(self):
        return f"<UserFeatureAccess(user_id={self.user_id}, feature='{self.feature_name}', enabled={self.is_enabled})>"


class AdminActionLogOld(Base):
    """Old admin action log - deprecated, use feature_control.AdminActionLog instead"""
    __tablename__ = "admin_action_logs_old"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    action_type = Column(String(100), nullable=False, index=True)
    target_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    def __repr__(self):
        return f"<AdminActionLogOld(id={self.id}, admin_id={self.admin_id}, action='{self.action_type}')>"
