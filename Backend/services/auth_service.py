"""
Asynchronous Auth Service
Use with `AsyncSession` from SQLAlchemy async engine.
"""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from schemas.user_schema import UserRegister
from utils.security import hash_password, verify_password
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


async def register_user(db: AsyncSession, user_data: UserRegister) -> User:
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_user = result.scalars().first()

        if existing_user:
            logger.warning(f"Registration attempt with existing email: {user_data.email}")
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
        await db.commit()
        await db.refresh(new_user)

        logger.info(f"User registered successfully: {user_data.email}")
        return new_user

    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed",
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    try:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.hashed_password:
            logger.warning(f"Login attempt with email for Google-only user: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account was created with Google. Please use Google Sign-In or set a password.",
            )

        if not verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

            # Reject suspended or inactive users
            if not getattr(user, 'is_active', True) or getattr(user, 'is_suspended', False):
                logger.warning(f"Login attempt for suspended/inactive user: {email}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Inactive or suspended user",
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


async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
