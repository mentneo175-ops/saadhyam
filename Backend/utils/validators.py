"""
Input Validation Utilities
Sanitize and validate user inputs to prevent injection attacks
"""

import re
import logging
from typing import Optional
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def sanitize_string(value: str, max_length: int = 255, field_name: str = "input") -> str:
    """
    Sanitize string input to prevent XSS and injection attacks
    
    Args:
        value: Input string to sanitize
        max_length: Maximum allowed length
        field_name: Name of field for error messages
        
    Returns:
        Sanitized string
        
    Raises:
        HTTPException: If input contains dangerous patterns
    """
    if not value:
        return value
    
    # Remove leading/trailing whitespace
    value = value.strip()
    
    # Check length
    if len(value) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} exceeds maximum length of {max_length} characters"
        )
    
    # Remove HTML tags
    value = re.sub(r'<[^>]+>', '', value)
    
    # Check for SQL injection patterns
    sql_patterns = [
        r'(\bUNION\b.*\bSELECT\b)',
        r'(\bSELECT\b.*\bFROM\b)',
        r'(\bINSERT\b.*\bINTO\b)',
        r'(\bUPDATE\b.*\bSET\b)',
        r'(\bDELETE\b.*\bFROM\b)',
        r'(\bDROP\b.*\bTABLE\b)',
        r'(--|;|\/\*|\*\/)',
        r'(\bOR\b\s+[\d\w]+\s*=\s*[\d\w]+)',
        r'(\bAND\b\s+[\d\w]+\s*=\s*[\d\w]+)',
        r"('.*--)",
        r'(xp_cmdshell)',
        r'(exec\s*\()',
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            logger.warning(f"⚠️ SQL injection attempt detected in {field_name}: {value[:50]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {field_name}: contains prohibited characters or patterns"
            )
    
    # Check for XSS patterns
    xss_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe',
        r'<object',
        r'<embed',
    ]
    
    for pattern in xss_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            logger.warning(f"⚠️ XSS attempt detected in {field_name}: {value[:50]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {field_name}: contains prohibited characters or patterns"
            )
    
    return value


def validate_email(email: str) -> str:
    """
    Validate and normalize email address
    
    Args:
        email: Email address to validate
        
    Returns:
        Normalized email (lowercase)
        
    Raises:
        HTTPException: If email format is invalid
    """
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Check length
    if len(email) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address too long"
        )
    
    return email.lower().strip()


def validate_phone(phone: str) -> str:
    """
    Validate and normalize phone number
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Normalized phone number (digits only)
        
    Raises:
        HTTPException: If phone format is invalid
    """
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required"
        )
    
    # Remove all non-digit characters
    phone_digits = re.sub(r'\D', '', phone)
    
    # Check length (10-15 digits is standard for international numbers)
    if len(phone_digits) < 10 or len(phone_digits) > 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number must be between 10 and 15 digits"
        )
    
    return phone_digits


def validate_password_strength(password: str) -> str:
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - Not a common password
    
    Args:
        password: Password to validate
        
    Returns:
        Password if valid
        
    Raises:
        HTTPException: If password doesn't meet requirements
    """
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required"
        )
    
    # Check minimum length
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Check maximum length (prevent DoS via bcrypt)
    if len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too long (maximum 128 characters)"
        )
    
    # Check for uppercase
    if not re.search(r'[A-Z]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )
    
    # Check for lowercase
    if not re.search(r'[a-z]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )
    
    # Check for digit
    if not re.search(r'\d', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit"
        )
    
    # Check for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
        )
    
    # Check against common passwords
    common_passwords = [
        "password", "12345678", "qwerty", "admin", "letmein",
        "welcome", "monkey", "dragon", "master", "sunshine",
        "princess", "football", "password1", "password123"
    ]
    
    if password.lower() in common_passwords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too common. Please choose a stronger password"
        )
    
    return password


def validate_url(url: str, allowed_schemes: list = None) -> str:
    """
    Validate URL format and scheme
    
    Args:
        url: URL to validate
        allowed_schemes: List of allowed schemes (default: ['http', 'https'])
        
    Returns:
        Validated URL
        
    Raises:
        HTTPException: If URL is invalid
    """
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required"
        )
    
    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']
    
    # Basic URL pattern
    url_pattern = r'^(https?):\/\/([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$'
    
    if not re.match(url_pattern, url, re.IGNORECASE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL format"
        )
    
    # Check scheme
    scheme = url.split('://')[0].lower()
    if scheme not in allowed_schemes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"URL scheme must be one of: {', '.join(allowed_schemes)}"
        )
    
    # Check for suspicious patterns
    suspicious_patterns = [
        r'javascript:',
        r'data:',
        r'vbscript:',
        r'file:',
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            logger.warning(f"⚠️ Suspicious URL detected: {url[:50]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL contains prohibited scheme"
            )
    
    return url


def validate_filename(filename: str, allowed_extensions: list = None) -> str:
    """
    Validate filename for file uploads
    
    Args:
        filename: Filename to validate
        allowed_extensions: List of allowed extensions (e.g., ['.jpg', '.png'])
        
    Returns:
        Validated filename
        
    Raises:
        HTTPException: If filename is invalid
    """
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    # Remove path traversal attempts
    filename = filename.replace('../', '').replace('..\\', '')
    
    # Check for null bytes
    if '\x00' in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    # Check length
    if len(filename) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename too long (maximum 255 characters)"
        )
    
    # Check for dangerous characters
    if re.search(r'[<>:"|?*]', filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename contains invalid characters"
        )
    
    # Check extension if allowed_extensions provided
    if allowed_extensions:
        ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
    
    return filename


def validate_integer(value: any, min_value: int = None, max_value: int = None, field_name: str = "value") -> int:
    """
    Validate integer input
    
    Args:
        value: Value to validate
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        field_name: Name of field for error messages
        
    Returns:
        Validated integer
        
    Raises:
        HTTPException: If value is invalid
    """
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be an integer"
        )
    
    if min_value is not None and int_value < min_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be at least {min_value}"
        )
    
    if max_value is not None and int_value > max_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be at most {max_value}"
        )
    
    return int_value


# Export all validators
__all__ = [
    "sanitize_string",
    "validate_email",
    "validate_phone",
    "validate_password_strength",
    "validate_url",
    "validate_filename",
    "validate_integer"
]
