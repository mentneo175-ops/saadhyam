"""
Audit Logging Service
Logs all critical security and business events
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.user import User
from config.database import SyncSessionLocal
import logging
import json

logger = logging.getLogger(__name__)


class AuditEventType(str, Enum):
    """Types of audit events"""
    # Authentication Events
    LOGIN = "login"
    LOGOUT = "logout"
    FAILED_LOGIN = "failed_login"
    REGISTER = "register"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    
    # Authorization Events
    ROLE_CHANGE = "role_change"
    PERMISSION_GRANT = "permission_grant"
    PERMISSION_REVOKE = "permission_revoke"
    
    # API Key Events
    API_KEY_CREATED = "api_key_created"
    API_KEY_ROTATED = "api_key_rotated"
    API_KEY_REVOKED = "api_key_revoked"
    
    # Data Access Events
    DATA_ACCESS = "data_access"
    DATA_MODIFY = "data_modify"
    DATA_DELETE = "data_delete"
    
    # Admin Actions
    USER_CREATED = "user_created"
    USER_DELETED = "user_deleted"
    USER_DISABLED = "user_disabled"
    
    # Security Events
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    SECURITY_CONFIG_CHANGE = "security_config_change"


class AuditLogger:
    """Service for logging audit events"""
    
    def __init__(self):
        self.logger = logging.getLogger("audit")
        
        # Setup audit file logging
        handler = logging.FileHandler("logs/audit.log")
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        action: str = "",
        resource: str = "",
        resource_id: Optional[str] = None,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Log an audit event
        
        Args:
            event_type: Type of event
            user_id: User ID (if applicable)
            user_email: User email (if applicable)
            action: Action description
            resource: Resource type (e.g., "user", "api_key")
            resource_id: Resource ID
            status: success, failure, warning
            details: Additional details
            ip_address: Client IP address
            user_agent: Client user agent
        """
        try:
            # Build audit log entry
            audit_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": event_type.value,
                "user_id": user_id,
                "user_email": user_email,
                "action": action,
                "resource": resource,
                "resource_id": resource_id,
                "status": status,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "details": details or {},
            }
            
            # Log as JSON for easy parsing
            log_message = json.dumps(audit_entry)
            
            if status == "failure":
                self.logger.error(log_message)
            elif status == "warning":
                self.logger.warning(log_message)
            else:
                self.logger.info(log_message)
            
            # Also log to stdout for Docker
            print(f"[AUDIT] {log_message}")
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
    
    def log_login(
        self,
        user_id: int,
        user_email: str,
        ip_address: str,
        success: bool = True,
        reason: str = "",
        user_agent: Optional[str] = None,
    ) -> None:
        """Log login event"""
        self.log_event(
            event_type=AuditEventType.LOGIN if success else AuditEventType.FAILED_LOGIN,
            user_id=user_id,
            user_email=user_email,
            action="User login",
            resource="authentication",
            status="success" if success else "failure",
            ip_address=ip_address,
            user_agent=user_agent,
            details={"reason": reason} if reason else None,
        )
    
    def log_password_change(
        self,
        user_id: int,
        user_email: str,
        ip_address: str,
    ) -> None:
        """Log password change event"""
        self.log_event(
            event_type=AuditEventType.PASSWORD_CHANGE,
            user_id=user_id,
            user_email=user_email,
            action="Password changed",
            resource="user_account",
            resource_id=str(user_id),
            ip_address=ip_address,
        )
    
    def log_api_key_created(
        self,
        user_id: int,
        user_email: str,
        api_key_id: str,
        ip_address: str,
    ) -> None:
        """Log API key creation"""
        self.log_event(
            event_type=AuditEventType.API_KEY_CREATED,
            user_id=user_id,
            user_email=user_email,
            action="API key created",
            resource="api_key",
            resource_id=api_key_id,
            ip_address=ip_address,
        )
    
    def log_api_key_rotated(
        self,
        user_id: int,
        user_email: str,
        api_key_id: str,
        ip_address: str,
    ) -> None:
        """Log API key rotation"""
        self.log_event(
            event_type=AuditEventType.API_KEY_ROTATED,
            user_id=user_id,
            user_email=user_email,
            action="API key rotated",
            resource="api_key",
            resource_id=api_key_id,
            ip_address=ip_address,
        )
    
    def log_unauthorized_access(
        self,
        user_id: Optional[int],
        user_email: Optional[str],
        resource: str,
        ip_address: str,
        reason: str = "",
    ) -> None:
        """Log unauthorized access attempt"""
        self.log_event(
            event_type=AuditEventType.UNAUTHORIZED_ACCESS,
            user_id=user_id,
            user_email=user_email,
            action="Unauthorized access attempt",
            resource=resource,
            status="failure",
            ip_address=ip_address,
            details={"reason": reason} if reason else None,
        )
    
    def log_data_access(
        self,
        user_id: int,
        user_email: str,
        resource: str,
        resource_id: str,
        ip_address: str,
    ) -> None:
        """Log data access"""
        self.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            user_id=user_id,
            user_email=user_email,
            action="Data accessed",
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
        )


# Global audit logger instance
audit_logger = AuditLogger()
