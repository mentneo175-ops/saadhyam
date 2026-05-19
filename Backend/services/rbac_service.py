"""
Role-Based Access Control (RBAC) Service
"""

from sqlalchemy.orm import Session
from models.rbac import Role, Permission, user_role
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class RBACService:
    """Service for managing roles and permissions"""
    
    @staticmethod
    def create_role(
        db: Session,
        name: str,
        description: str = "",
    ) -> Role:
        """Create a new role"""
        try:
            # Check if role already exists
            existing_role = db.query(Role).filter(Role.name == name).first()
            if existing_role:
                logger.warning(f"Role '{name}' already exists")
                return existing_role
            
            role = Role(name=name, description=description)
            db.add(role)
            db.commit()
            db.refresh(role)
            
            logger.info(f"Role created: {name}")
            return role
            
        except Exception as e:
            logger.error(f"Failed to create role: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def create_permission(
        db: Session,
        name: str,
        description: str = "",
    ) -> Permission:
        """Create a new permission"""
        try:
            # Check if permission already exists
            existing_perm = db.query(Permission).filter(Permission.name == name).first()
            if existing_perm:
                logger.warning(f"Permission '{name}' already exists")
                return existing_perm
            
            permission = Permission(name=name, description=description)
            db.add(permission)
            db.commit()
            db.refresh(permission)
            
            logger.info(f"Permission created: {name}")
            return permission
            
        except Exception as e:
            logger.error(f"Failed to create permission: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def assign_permission_to_role(
        db: Session,
        role_id: int,
        permission_id: int,
    ) -> bool:
        """Assign permission to role"""
        try:
            role = db.query(Role).filter(Role.id == role_id).first()
            permission = db.query(Permission).filter(Permission.id == permission_id).first()
            
            if not role or not permission:
                raise ValueError("Role or permission not found")
            
            if permission not in role.permissions:
                role.permissions.append(permission)
                db.commit()
                logger.info(f"Permission '{permission.name}' assigned to role '{role.name}'")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to assign permission: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def assign_role_to_user(
        db: Session,
        user_id: int,
        role_id: int,
    ) -> bool:
        """Assign role to user"""
        try:
            from models.user import User
            
            user = db.query(User).filter(User.id == user_id).first()
            role = db.query(Role).filter(Role.id == role_id).first()
            
            if not user or not role:
                raise ValueError("User or role not found")
            
            if role not in user.roles:
                user.roles.append(role)
                db.commit()
                logger.info(f"Role '{role.name}' assigned to user {user.email}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to assign role: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def revoke_role_from_user(
        db: Session,
        user_id: int,
        role_id: int,
    ) -> bool:
        """Revoke role from user"""
        try:
            from models.user import User
            
            user = db.query(User).filter(User.id == user_id).first()
            role = db.query(Role).filter(Role.id == role_id).first()
            
            if not user or not role:
                raise ValueError("User or role not found")
            
            if role in user.roles:
                user.roles.remove(role)
                db.commit()
                logger.info(f"Role '{role.name}' revoked from user {user.email}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke role: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_user_roles(db: Session, user_id: int) -> List[Role]:
        """Get all roles for a user"""
        try:
            from models.user import User
            
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            return user.roles
            
        except Exception as e:
            logger.error(f"Failed to get user roles: {e}")
            return []
    
    @staticmethod
    def get_user_permissions(db: Session, user_id: int) -> List[Permission]:
        """Get all permissions for a user"""
        try:
            from models.user import User
            
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Collect all permissions from all roles
            permissions = set()
            for role in user.roles:
                permissions.update(role.permissions)
            
            return list(permissions)
            
        except Exception as e:
            logger.error(f"Failed to get user permissions: {e}")
            return []
    
    @staticmethod
    def check_permission(
        db: Session,
        user_id: int,
        permission_name: str,
    ) -> bool:
        """Check if user has specific permission"""
        try:
            from models.user import User
            
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            permissions = RBACService.get_user_permissions(db, user_id)
            return any(p.name == permission_name for p in permissions)
            
        except Exception as e:
            logger.error(f"Failed to check permission: {e}")
            return False
    
    @staticmethod
    def init_default_roles(db: Session):
        """Initialize default roles and permissions"""
        try:
            # Create default permissions
            permissions = [
                Permission(name="create_campaign", description="Create marketing campaigns"),
                Permission(name="edit_campaign", description="Edit marketing campaigns"),
                Permission(name="delete_campaign", description="Delete marketing campaigns"),
                Permission(name="view_analytics", description="View analytics"),
                Permission(name="manage_users", description="Manage users"),
                Permission(name="manage_settings", description="Manage system settings"),
                Permission(name="view_audit_logs", description="View audit logs"),
                Permission(name="export_data", description="Export business data"),
            ]
            
            for perm in permissions:
                existing = db.query(Permission).filter(Permission.name == perm.name).first()
                if not existing:
                    db.add(perm)
            
            db.commit()
            
            # Create default roles
            roles = {
                "admin": {
                    "description": "Administrator with full access",
                    "permissions": [p.name for p in permissions],  # All permissions
                },
                "manager": {
                    "description": "Manager with campaign management access",
                    "permissions": [
                        "create_campaign", "edit_campaign", "delete_campaign",
                        "view_analytics", "view_audit_logs", "export_data"
                    ],
                },
                "user": {
                    "description": "Regular user with basic access",
                    "permissions": ["create_campaign", "view_analytics", "export_data"],
                },
            }
            
            for role_name, role_config in roles.items():
                existing_role = db.query(Role).filter(Role.name == role_name).first()
                
                if not existing_role:
                    role = Role(
                        name=role_name,
                        description=role_config["description"],
                        is_active=True,
                    )
                    db.add(role)
                    db.commit()
                    db.refresh(role)
                    
                    # Assign permissions to role
                    for perm_name in role_config["permissions"]:
                        perm = db.query(Permission).filter(Permission.name == perm_name).first()
                        if perm:
                            role.permissions.append(perm)
                    
                    db.commit()
                    logger.info(f"Role '{role_name}' initialized with permissions")
            
            logger.info("✅ Default RBAC roles and permissions initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize default roles: {e}")
            db.rollback()
