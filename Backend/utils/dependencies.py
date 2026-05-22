from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError
from config.database import get_db_sync
from utils.security import decode_token
from services.auth_service_sync import get_user_by_id
from services.token_blacklist_service import token_blacklist_service
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
    
    **Single Session Enforcement**: Validates that the token matches the user's active session.
    If user logged in from another device/browser, this token will be rejected.

    Args:
        authorization: Authorization header with Bearer token
        db: Database session

    Returns:
        Current user object

    Raises:
        HTTPException: If token is invalid, user not found, or session is invalid
    """
    # Reduced logging - only log errors and warnings, not every successful auth
    
    if not authorization:
        logger.warning("❌ Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization header missing",
        )
    
    # Extract token from "Bearer <token>"
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Invalid authorization header")
        token = parts[1]
    except (ValueError, IndexError) as e:
        logger.warning(f"❌ Invalid authorization header format: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Decode and validate token
        payload = decode_token(token)
        
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")

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

    # Check if token is blacklisted (revoked)
    if token_blacklist_service.is_token_blacklisted(token):
        logger.warning(f"❌ Blacklisted token attempted to be used")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is blacklisted (all sessions revoked)
    if token_blacklist_service.is_user_blacklisted(user_id):
        logger.warning(f"❌ Blacklisted user {user_id} attempted to use token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="All sessions have been revoked. Please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database (sync call, no await needed)
    user = get_user_by_id(db, token_data.user_id)

    if user is None:
        logger.warning(f"❌ User not found for ID: {token_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # **SINGLE SESSION ENFORCEMENT**: Check if this token matches the active session
    # CRITICAL: If active_session_token is NULL (e.g., after DB refresh), reject the request
    if not user.active_session_token:
        logger.warning(f"⚠️  No active session for user {user.email}. Session was cleared (DB refresh or logout).")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has been cleared. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject suspended or inactive users immediately so existing tokens cannot be used
    if not getattr(user, 'is_active', True) or getattr(user, 'is_suspended', False):
        logger.warning(f"❌ Suspended or inactive user attempted request: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have been suspended by the admin. Please contact admin.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.active_session_token != token:
        logger.warning(f"⚠️  Session mismatch for user {user.email}. User logged in from another device/browser.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is logged in from another device or browser. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Only log successful auth at DEBUG level (won't show in production)
    logger.debug(f"✅ User authenticated: {user.email}")
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
