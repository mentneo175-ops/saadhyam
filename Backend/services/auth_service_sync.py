"""
Synchronous Auth Service
For use with SQLite and sync database sessions
"""

from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from models.user import User
from schemas.user_schema import UserRegister, TokenData
from utils.security import hash_password, verify_password, create_access_token
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


def register_user(db: Session, user_data: UserRegister) -> User:
    """
    Register a new user (sync version).

    Args:
        db: Database session
        user_data: User registration data

    Returns:
        Created user object

    Raises:
        HTTPException: If email already exists or other error occurs
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()

        if existing_user:
            logger.warning(
                f"Registration attempt with existing email: {user_data.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user
        hashed_password = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            name=user_data.name,
            auth_provider="email",
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(f"User registered successfully: {user_data.email}")
        return new_user

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed",
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticate user with email and password (sync version).

    Args:
        db: Database session
        email: User email
        password: User password

    Returns:
        User object if authentication successful

    Raises:
        HTTPException: If credentials are invalid
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == email).first()

        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Verify password (handle merged accounts)
        if not user.hashed_password:
            # User originally signed up with Google OAuth, no password set
            logger.warning(f"Login attempt with email for Google-only user: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account was created with Google. Please use Google Sign-In or set a password.",
            )

        # Reject suspended or inactive users before password verification completes.
        if not getattr(user, 'is_active', True) or getattr(user, 'is_suspended', False):
            logger.warning(f"Login attempt for suspended/inactive user: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You have been suspended by the admin. Please contact admin.",
            )
        
        if not verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        logger.info(f"User authenticated successfully: {email}")
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


def get_user_by_id(db: Session, user_id: int) -> User:
    """
    Get user by ID (sync version).

    Args:
        db: Database session
        user_id: User ID

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        return user  # Returns None if not found; caller handles auth errors

    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return None
