"""
Standardized Response Models
Provides consistent response format across all API endpoints
"""

from pydantic import BaseModel, Field
from typing import Any, Optional, Dict, List
from datetime import datetime
from enum import Enum


class ResponseStatus(str, Enum):
    """Standard response status values"""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ErrorCode(str, Enum):
    """Standard error codes"""
    # Authentication & Authorization
    UNAUTHORIZED = "unauthorized"
    FORBIDDEN = "forbidden"
    TOKEN_EXPIRED = "token_expired"
    INVALID_CREDENTIALS = "invalid_credentials"
    
    # Validation
    VALIDATION_ERROR = "validation_error"
    INVALID_INPUT = "invalid_input"
    MISSING_FIELD = "missing_field"
    
    # Resource
    NOT_FOUND = "not_found"
    ALREADY_EXISTS = "already_exists"
    CONFLICT = "conflict"
    
    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    TOO_MANY_REQUESTS = "too_many_requests"
    
    # Server
    INTERNAL_ERROR = "internal_error"
    SERVICE_UNAVAILABLE = "service_unavailable"
    TIMEOUT = "timeout"
    
    # External Services
    EXTERNAL_API_ERROR = "external_api_error"
    INSTAGRAM_API_ERROR = "instagram_api_error"
    WHATSAPP_API_ERROR = "whatsapp_api_error"
    GEMINI_API_ERROR = "gemini_api_error"
    
    # Business Logic
    INSUFFICIENT_QUOTA = "insufficient_quota"
    FEATURE_DISABLED = "feature_disabled"
    OPERATION_FAILED = "operation_failed"


class ErrorDetail(BaseModel):
    """Detailed error information"""
    field: Optional[str] = Field(None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Specific error code")


class ErrorResponse(BaseModel):
    """
    Standard error response format
    
    Example:
    {
        "status": "error",
        "error_code": "validation_error",
        "message": "Invalid input data",
        "detail": "Email format is invalid",
        "errors": [
            {"field": "email", "message": "Invalid email format", "code": "invalid_format"}
        ],
        "timestamp": "2026-05-20T10:30:00Z",
        "path": "/api/auth/register",
        "request_id": "abc123"
    }
    """
    status: ResponseStatus = Field(ResponseStatus.ERROR, description="Response status")
    error_code: ErrorCode = Field(..., description="Error code for programmatic handling")
    message: str = Field(..., description="Human-readable error message")
    detail: Optional[str] = Field(None, description="Additional error details")
    errors: Optional[List[ErrorDetail]] = Field(None, description="List of specific errors")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Error timestamp")
    path: Optional[str] = Field(None, description="Request path that caused the error")
    request_id: Optional[str] = Field(None, description="Unique request identifier for tracking")
    
    # Rate limiting specific fields
    retry_after: Optional[int] = Field(None, description="Seconds to wait before retrying")
    retry_after_time: Optional[str] = Field(None, description="Human-readable retry time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "error_code": "validation_error",
                "message": "Invalid input data",
                "detail": "Email format is invalid",
                "errors": [
                    {"field": "email", "message": "Invalid email format", "code": "invalid_format"}
                ],
                "timestamp": "2026-05-20T10:30:00Z",
                "path": "/api/auth/register",
                "request_id": "abc123"
            }
        }


class SuccessResponse(BaseModel):
    """
    Standard success response format
    
    Example:
    {
        "status": "success",
        "message": "Operation completed successfully",
        "data": {...},
        "timestamp": "2026-05-20T10:30:00Z"
    }
    """
    status: ResponseStatus = Field(ResponseStatus.SUCCESS, description="Response status")
    message: Optional[str] = Field(None, description="Success message")
    data: Any = Field(..., description="Response data")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Response timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "User registered successfully",
                "data": {
                    "user_id": 123,
                    "email": "user@example.com"
                },
                "timestamp": "2026-05-20T10:30:00Z"
            }
        }


class PaginatedResponse(BaseModel):
    """
    Standard paginated response format
    
    Example:
    {
        "status": "success",
        "data": [...],
        "pagination": {
            "page": 1,
            "page_size": 20,
            "total_items": 100,
            "total_pages": 5,
            "has_next": true,
            "has_previous": false
        },
        "timestamp": "2026-05-20T10:30:00Z"
    }
    """
    status: ResponseStatus = Field(ResponseStatus.SUCCESS, description="Response status")
    data: List[Any] = Field(..., description="List of items")
    pagination: Dict[str, Any] = Field(..., description="Pagination metadata")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Response timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "data": [{"id": 1, "name": "Item 1"}],
                "pagination": {
                    "page": 1,
                    "page_size": 20,
                    "total_items": 100,
                    "total_pages": 5,
                    "has_next": True,
                    "has_previous": False
                },
                "timestamp": "2026-05-20T10:30:00Z"
            }
        }


class HealthCheckResponse(BaseModel):
    """
    Health check response format
    
    Example:
    {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2026-05-20T10:30:00Z",
        "services": {
            "database": "healthy",
            "redis": "healthy",
            "external_apis": "healthy"
        }
    }
    """
    status: str = Field(..., description="Overall health status")
    version: str = Field(..., description="Application version")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Check timestamp")
    services: Dict[str, str] = Field(..., description="Individual service health status")
    uptime_seconds: Optional[int] = Field(None, description="Application uptime in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2026-05-20T10:30:00Z",
                "services": {
                    "database": "healthy",
                    "redis": "healthy",
                    "external_apis": "healthy"
                },
                "uptime_seconds": 3600
            }
        }


# Helper functions for creating responses

def success_response(
    data: Any,
    message: Optional[str] = None,
    status: ResponseStatus = ResponseStatus.SUCCESS
) -> Dict[str, Any]:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        message: Optional success message
        status: Response status (default: SUCCESS)
    
    Returns:
        Dictionary with standardized success response
    """
    return {
        "status": status.value,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }


def error_response(
    error_code: ErrorCode,
    message: str,
    detail: Optional[str] = None,
    errors: Optional[List[Dict[str, str]]] = None,
    path: Optional[str] = None,
    request_id: Optional[str] = None,
    retry_after: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response
    
    Args:
        error_code: Error code from ErrorCode enum
        message: Human-readable error message
        detail: Additional error details
        errors: List of specific field errors
        path: Request path
        request_id: Unique request identifier
        retry_after: Seconds to wait before retrying (for rate limits)
    
    Returns:
        Dictionary with standardized error response
    """
    response = {
        "status": ResponseStatus.ERROR.value,
        "error_code": error_code.value,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if detail:
        response["detail"] = detail
    if errors:
        response["errors"] = errors
    if path:
        response["path"] = path
    if request_id:
        response["request_id"] = request_id
    if retry_after:
        response["retry_after"] = retry_after
        retry_time = datetime.utcnow().timestamp() + retry_after
        response["retry_after_time"] = datetime.fromtimestamp(retry_time).strftime("%I:%M %p")
    
    return response


def paginated_response(
    data: List[Any],
    page: int,
    page_size: int,
    total_items: int
) -> Dict[str, Any]:
    """
    Create a standardized paginated response
    
    Args:
        data: List of items for current page
        page: Current page number (1-indexed)
        page_size: Number of items per page
        total_items: Total number of items across all pages
    
    Returns:
        Dictionary with standardized paginated response
    """
    total_pages = (total_items + page_size - 1) // page_size  # Ceiling division
    
    return {
        "status": ResponseStatus.SUCCESS.value,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# Export all
__all__ = [
    "ResponseStatus",
    "ErrorCode",
    "ErrorDetail",
    "ErrorResponse",
    "SuccessResponse",
    "PaginatedResponse",
    "HealthCheckResponse",
    "success_response",
    "error_response",
    "paginated_response"
]
