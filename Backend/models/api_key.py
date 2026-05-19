"""
API Key Management System
Handles API key creation, rotation, and validation
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime, timedelta
import secrets
import hashlib
from config.database import Base
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class APIKey(Base):
    """API Key model for programmatic access"""
    __tablename__ = "api_key"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False, unique=True)  # Hashed key
    key_prefix = Column(String, nullable=False)  # First 8 chars for display
    
    is_active = Column(Boolean, default=True)
    is_rotated = Column(Boolean, default=False)
    
    last_used_at = Column(DateTime, nullable=True)
    last_rotated_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    
    description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<APIKey(id={self.id}, user_id={self.user_id}, prefix={self.key_prefix})>"


class APIKeyManager:
    """Manager for API key operations"""
    
    VALID_DURATION_DAYS = 90  # Keys valid for 90 days
    KEY_LENGTH = 32  # 32 bytes = 256 bits
    
    @staticmethod
    def generate_key() -> str:
        """Generate a new API key"""
        return f"sk_{secrets.token_urlsafe(APIKeyManager.KEY_LENGTH)}"
    
    @staticmethod
    def hash_key(key: str) -> str:
        """Hash an API key"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @staticmethod
    def get_key_prefix(key: str) -> str:
        """Get the prefix (first 8 chars) of a key for display"""
        return key[:8] if len(key) >= 8 else key
    
    @staticmethod
    def create_api_key(
        db: Session,
        user_id: int,
        name: str,
        description: str = "",
    ) -> tuple[str, APIKey]:
        """
        Create a new API key
        Returns: (plain_key, api_key_object)
        """
        try:
            # Generate new key
            plain_key = APIKeyManager.generate_key()
            key_hash = APIKeyManager.hash_key(plain_key)
            key_prefix = APIKeyManager.get_key_prefix(plain_key)
            
            # Create API key record
            api_key = APIKey(
                user_id=user_id,
                name=name,
                key_hash=key_hash,
                key_prefix=key_prefix,
                expires_at=datetime.utcnow() + timedelta(days=APIKeyManager.VALID_DURATION_DAYS),
                description=description,
            )
            
            db.add(api_key)
            db.commit()
            db.refresh(api_key)
            
            logger.info(f"API key created for user {user_id}: {api_key.id}")
            
            return plain_key, api_key
            
        except Exception as e:
            logger.error(f"Failed to create API key: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def rotate_api_key(
        db: Session,
        api_key_id: int,
        user_id: int,
    ) -> tuple[str, APIKey]:
        """
        Rotate an existing API key
        Returns: (new_plain_key, new_api_key_object)
        """
        try:
            # Get existing key
            old_key = db.query(APIKey).filter(
                APIKey.id == api_key_id,
                APIKey.user_id == user_id,
            ).first()
            
            if not old_key:
                raise ValueError("API key not found")
            
            # Create new key
            new_plain_key = APIKeyManager.generate_key()
            new_key_hash = APIKeyManager.hash_key(new_plain_key)
            new_key_prefix = APIKeyManager.get_key_prefix(new_plain_key)
            
            # Update old key to mark as rotated
            old_key.is_rotated = True
            old_key.last_rotated_at = datetime.utcnow()
            old_key.is_active = False  # Deactivate old key
            
            # Create new key record
            new_key = APIKey(
                user_id=user_id,
                name=old_key.name,
                key_hash=new_key_hash,
                key_prefix=new_key_prefix,
                expires_at=datetime.utcnow() + timedelta(days=APIKeyManager.VALID_DURATION_DAYS),
                description=f"Rotated from {old_key.id}",
            )
            
            db.add(new_key)
            db.commit()
            db.refresh(new_key)
            
            logger.info(f"API key rotated for user {user_id}: old={old_key.id}, new={new_key.id}")
            
            return new_plain_key, new_key
            
        except Exception as e:
            logger.error(f"Failed to rotate API key: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def revoke_api_key(
        db: Session,
        api_key_id: int,
        user_id: int,
    ) -> APIKey:
        """Revoke an API key"""
        try:
            api_key = db.query(APIKey).filter(
                APIKey.id == api_key_id,
                APIKey.user_id == user_id,
            ).first()
            
            if not api_key:
                raise ValueError("API key not found")
            
            api_key.is_active = False
            api_key.revoked_at = datetime.utcnow()
            
            db.commit()
            db.refresh(api_key)
            
            logger.info(f"API key revoked for user {user_id}: {api_key_id}")
            
            return api_key
            
        except Exception as e:
            logger.error(f"Failed to revoke API key: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def validate_api_key(db: Session, plain_key: str) -> APIKey | None:
        """
        Validate an API key
        Returns: APIKey object if valid, None otherwise
        """
        try:
            key_hash = APIKeyManager.hash_key(plain_key)
            
            api_key = db.query(APIKey).filter(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True,
                APIKey.expires_at > datetime.utcnow(),
            ).first()
            
            if api_key:
                # Update last used time
                api_key.last_used_at = datetime.utcnow()
                db.commit()
                logger.info(f"API key validated for user {api_key.user_id}")
                return api_key
            
            return None
            
        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            return None
    
    @staticmethod
    def get_user_api_keys(db: Session, user_id: int):
        """Get all API keys for a user"""
        return db.query(APIKey).filter(
            APIKey.user_id == user_id,
        ).order_by(APIKey.created_at.desc()).all()
    
    @staticmethod
    def get_expired_keys(db: Session):
        """Get all expired API keys"""
        return db.query(APIKey).filter(
            APIKey.expires_at < datetime.utcnow(),
            APIKey.is_active == True,
        ).all()
    
    @staticmethod
    def cleanup_expired_keys(db: Session):
        """Deactivate all expired API keys"""
        try:
            expired_keys = APIKeyManager.get_expired_keys(db)
            for key in expired_keys:
                key.is_active = False
            db.commit()
            logger.info(f"Cleaned up {len(expired_keys)} expired API keys")
            return len(expired_keys)
        except Exception as e:
            logger.error(f"Error cleaning up expired keys: {e}")
            db.rollback()
            return 0
