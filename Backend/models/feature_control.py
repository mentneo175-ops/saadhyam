"""
Feature Control Models
Super Admin can control feature availability and maintenance status
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from config.database import Base
from datetime import datetime


class FeatureControl(Base):
    """Control feature availability and maintenance status"""
    
    __tablename__ = "feature_control"
    
    id = Column(Integer, primary_key=True, index=True)
    feature_key = Column(String(100), unique=True, nullable=False, index=True)
    feature_name = Column(String(255), nullable=False)
    feature_endpoint = Column(String(255), nullable=False)
    
    # Status control
    is_enabled = Column(Boolean, default=True, nullable=False)  # Feature on/off
    is_maintenance = Column(Boolean, default=False, nullable=False)  # Maintenance mode
    maintenance_message = Column(Text, nullable=True)  # Custom message for users
    
    # Admin bypass
    allow_admin_access = Column(Boolean, default=True, nullable=False)  # Admins can use during maintenance
    
    # Metadata
    disabled_by = Column(Integer, nullable=True)  # Admin user_id who disabled
    disabled_at = Column(DateTime, nullable=True)
    enabled_by = Column(Integer, nullable=True)  # Admin user_id who enabled
    enabled_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        status = "enabled" if self.is_enabled else "maintenance" if self.is_maintenance else "disabled"
        return f"<FeatureControl(feature='{self.feature_name}', status='{status}')>"


class ActivityLog(Base):
    """Track all user and admin activities"""
    
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_email = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=False)  # 'user', 'admin', 'super_admin'
    
    # Activity details
    activity_type = Column(String(100), nullable=False, index=True)  # 'feature_use', 'login', 'admin_action', etc.
    feature_key = Column(String(100), nullable=True, index=True)  # Which feature was used
    action = Column(String(255), nullable=False)  # Description of action
    
    # Request details
    endpoint = Column(String(255), nullable=True)
    method = Column(String(10), nullable=True)  # GET, POST, etc.
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    
    # Additional data
    extra_data = Column(JSON, nullable=True)  # Extra data as JSON (renamed from metadata)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<ActivityLog(user_id={self.user_id}, activity='{self.activity_type}', feature='{self.feature_key}')>"


class SystemMetrics(Base):
    """Track system performance metrics"""
    
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Metric type
    metric_type = Column(String(100), nullable=False, index=True)  # 'api_response', 'db_query', 'feature_usage'
    metric_name = Column(String(255), nullable=False)
    
    # Values
    value = Column(Integer, nullable=True)  # Numeric value (e.g., response time in ms)
    count = Column(Integer, default=1, nullable=False)  # Count of occurrences
    
    # Context
    feature_key = Column(String(100), nullable=True, index=True)
    endpoint = Column(String(255), nullable=True)
    
    # Additional data
    extra_data = Column(JSON, nullable=True)  # Renamed from metadata
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<SystemMetrics(type='{self.metric_type}', name='{self.metric_name}', value={self.value})>"


class AdminActionLog(Base):
    """Track all admin actions for Super Admin monitoring"""
    
    __tablename__ = "admin_action_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=False, index=True)
    admin_email = Column(String(255), nullable=True)
    admin_role = Column(String(50), nullable=False)  # 'admin' or 'super_admin'
    
    # Action details
    action_type = Column(String(100), nullable=False, index=True)  # 'feature_toggle', 'limit_update', 'user_suspend', etc.
    action_description = Column(Text, nullable=False)
    
    # Target
    target_type = Column(String(50), nullable=True)  # 'user', 'feature', 'system'
    target_id = Column(Integer, nullable=True)
    target_name = Column(String(255), nullable=True)
    
    # Changes
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    
    # Additional data
    extra_data = Column(JSON, nullable=True)  # Renamed from metadata
    ip_address = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<AdminActionLog(admin_id={self.admin_id}, action='{self.action_type}', target='{self.target_name}')>"
