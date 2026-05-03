from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError
from config.database import get_sync_db
from utils.security import decode_token
from services.auth_service_sync import get_user_by_id
from models.user import User
from schemas.user_schema import TokenData
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_sync_db),
) -> User:
    """
    Dependency to get current authenticated user.
    Async wrapper around sync database operations.

    Args:
        authorization: Authorization header with Bearer token
        db: Database session

    Returns:
        Current user object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not authorization:
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
    except (ValueError, IndexError):
        logger.warning("Invalid authorization header format")
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
            logger.warning("Invalid token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(user_id=user_id, email=email)

    except JWTError as e:
        logger.warning(f"JWT validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Note: Token blacklist check skipped for now (Redis not available)
    # In production, implement proper Redis-based token blacklist

    # Get user from database (sync call, no await needed)
    user = get_user_by_id(db, token_data.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_sync_db),
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

    return await get_current_user(authorization, db)
