"""
Role-Based Access Control (RBAC) Models
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base

# Association table for User-Role relationship
user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Role-Permission relationship
role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("role.id", ondelete="CASCADE")),
    Column("permission_id", Integer, ForeignKey("permission.id", ondelete="CASCADE")),
)


class Permission(Base):
    """Permission model"""
    __tablename__ = "permission"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "create_campaign"
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    roles = relationship("Role", secondary=role_permission, back_populates="permissions")
    
    def __repr__(self):
        return f"<Permission(id={self.id}, name={self.name})>"


class Role(Base):
    """Role model"""
    __tablename__ = "role"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "admin", "user", "manager"
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    permissions = relationship("Permission", secondary=role_permission, back_populates="roles")
    users = relationship("User", secondary=user_role, back_populates="roles")
    
    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"
    
    def has_permission(self, permission_name: str) -> bool:
        """Check if role has a specific permission"""
        return any(p.name == permission_name for p in self.permissions)


# Update User model to include roles
# This is added to the existing User model in models/user.py
# Add this relationship: roles = relationship("Role", secondary=user_role, back_populates="users")
