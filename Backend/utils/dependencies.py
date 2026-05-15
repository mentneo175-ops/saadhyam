from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError
from config.database import get_db_sync
from utils.security import decode_token
from services.auth_service_sync import get_user_by_id
from models.user import User
from schemas.user_schema import TokenData
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db_sync),
) -> User:
    """
    Dependency to get current authenticated user.

    Args:
        authorization: Authorization header with Bearer token
        db: Database session

    Returns:
        Current user object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    logger.info(f"🔐 Auth check - Authorization header provided: {authorization is not None}")
    
    if not authorization:
        logger.warning("❌ Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization header missing",
        )

    logger.info(f"🔐 Authorization header: {authorization[:50]}...")
    
    # Extract token from "Bearer <token>"
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Invalid authorization header")
        token = parts[1]
        logger.info(f"🔑 Token extracted successfully")
    except (ValueError, IndexError) as e:
        logger.warning(f"❌ Invalid authorization header format: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        logger.info(f"🔐 Decoding token...")
        # Decode and validate token
        payload = decode_token(token)
        logger.info(f"🔐 Token decoded successfully")
        
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        
        logger.info(f"✅ Token decoded - User ID: {user_id}, Email: {email}")

        if user_id is None or email is None:
            logger.warning("❌ Invalid token payload - missing user_id or email")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(user_id=user_id, email=email)

    except JWTError as e:
        logger.warning(f"❌ JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Note: Token blacklist check skipped for now (Redis not available)
    # In production, implement proper Redis-based token blacklist

    logger.info(f"🔐 Getting user from database...")
    # Get user from database (sync call, no await needed)
    user = get_user_by_id(db, token_data.user_id)
    logger.info(f"🔐 User retrieved from database")

    if user is None:
        logger.warning(f"❌ User not found for ID: {token_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info(f"✅ User authenticated: {user.email}")
    return user


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_sync),
) -> User | None:
    """
    Optional dependency to get current user if token provided.

    Args:
        authorization: Authorization header (optional)
        db: Database session

    Returns:
        Current user object or None if no token provided
    """
    if authorization is None:
        return None

    return get_current_user(authorization, db)
