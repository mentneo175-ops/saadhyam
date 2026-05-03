from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

# Password hashing context - using PBKDF2 to avoid bcrypt version issues
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"],
    deprecated="auto",
    pbkdf2_sha256__rounds=100000,
)


def hash_password(password: str) -> str:
    """
    Hash a password.

    Args:
        password: Plain text password (str or bytes)

    Returns:
        Hashed password
    """
    try:
        # Ensure password is a string
        if isinstance(password, bytes):
            password = password.decode("utf-8")

        # Truncate to 72 bytes for bcrypt compatibility if needed
        if len(password.encode("utf-8")) > 72:
            password = password[:72]

        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    try:
        # Ensure plain_password is a string
        if isinstance(plain_password, bytes):
            plain_password = plain_password.decode("utf-8")

        # Truncate to 72 bytes for bcrypt compatibility if needed
        if len(plain_password.encode("utf-8")) > 72:
            plain_password = plain_password[:72]

        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False


def create_access_token(user_id: int, email: str) -> str:
    """
    Create a JWT access token.

    Args:
        user_id: User ID
        email: User email

    Returns:
        JWT token string
    """
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        Token payload

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError as e:
        logger.error(f"Error decoding token: {e}")
        raise
