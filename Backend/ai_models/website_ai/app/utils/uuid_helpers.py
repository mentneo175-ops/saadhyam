"""
UUID handling utilities for consistent UUID management across the system
"""
import uuid
from typing import Union, Optional
from fastapi import HTTPException, status


def validate_and_convert_uuid(uuid_string: str) -> uuid.UUID:
    """
    Validate and convert string to UUID object
    
    Args:
        uuid_string: String representation of UUID (with or without hyphens)
        
    Returns:
        uuid.UUID object
        
    Raises:
        HTTPException: If string is not a valid UUID
    """
    try:
        # Remove hyphens if present (handles both formats)
        clean_string = uuid_string.replace("-", "")
        
        # Try to create UUID from hex string
        if len(clean_string) == 32:
            return uuid.UUID(hex=clean_string)
        else:
            # Try standard UUID parsing
            return uuid.UUID(uuid_string)
            
    except (ValueError, AttributeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID format: {uuid_string}"
        )


def uuid_to_string(uuid_obj: Union[uuid.UUID, str, None]) -> Optional[str]:
    """
    Convert UUID object to string representation
    
    Args:
        uuid_obj: UUID object, string, or None
        
    Returns:
        String representation with hyphens, or None
    """
    if uuid_obj is None:
        return None
    
    if isinstance(uuid_obj, str):
        # Already a string, validate and return formatted
        try:
            return str(uuid.UUID(uuid_obj))
        except ValueError:
            return uuid_obj
    
    return str(uuid_obj)


def generate_uuid() -> uuid.UUID:
    """
    Generate a new UUID object
    
    Returns:
        uuid.UUID object
    """
    return uuid.uuid4()
