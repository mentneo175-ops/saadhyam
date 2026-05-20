"""
Global Error Handler Middleware
Provides consistent error responses across all endpoints
"""

import logging
import traceback
import uuid
import sys
from typing import Callable, Optional, List, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from models.responses import ErrorCode, error_response

logger = logging.getLogger(__name__)

# Check if ExceptionGroup is available (Python 3.11+)
if sys.version_info >= (3, 11):
    ExceptionGroup = ExceptionGroup
else:
    try:
        from exceptiongroup import ExceptionGroup
    except ImportError:
        ExceptionGroup = None


async def global_exception_handler(request: Request, call_next: Callable):
    """
    Global exception handler middleware
    Catches all unhandled exceptions and returns standardized error responses
    """
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    try:
        response = await call_next(request)
        return response
        
    except RequestValidationError as exc:
        # Pydantic validation errors
        logger.warning(f"[{request_id}] Validation error: {exc}")
        
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
                "code": error["type"]
            })
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response(
                error_code=ErrorCode.VALIDATION_ERROR,
                message="Validation error",
                detail="One or more fields contain invalid data",
                errors=errors,
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except StarletteHTTPException as exc:
        # HTTP exceptions (404, 403, etc.)
        logger.warning(f"[{request_id}] HTTP exception: {exc.status_code} - {exc.detail}")
        
        # Map HTTP status codes to error codes
        error_code_map = {
            401: ErrorCode.UNAUTHORIZED,
            403: ErrorCode.FORBIDDEN,
            404: ErrorCode.NOT_FOUND,
            409: ErrorCode.CONFLICT,
            429: ErrorCode.RATE_LIMIT_EXCEEDED,
            503: ErrorCode.SERVICE_UNAVAILABLE,
        }
        
        error_code = error_code_map.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                error_code=error_code,
                message=str(exc.detail),
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except IntegrityError as exc:
        # Database integrity errors (unique constraint, foreign key, etc.)
        logger.error(f"[{request_id}] Database integrity error: {exc}")
        
        # Try to extract meaningful message
        error_msg = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
        
        if "unique constraint" in error_msg.lower():
            message = "A record with this information already exists"
            error_code = ErrorCode.ALREADY_EXISTS
        elif "foreign key" in error_msg.lower():
            message = "Referenced record does not exist"
            error_code = ErrorCode.VALIDATION_ERROR
        else:
            message = "Database constraint violation"
            error_code = ErrorCode.CONFLICT
        
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=error_response(
                error_code=error_code,
                message=message,
                detail=error_msg if logger.level == logging.DEBUG else None,
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except SQLAlchemyError as exc:
        # Other database errors
        logger.error(f"[{request_id}] Database error: {exc}", exc_info=True)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                error_code=ErrorCode.INTERNAL_ERROR,
                message="Database operation failed",
                detail="An error occurred while accessing the database",
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except ValueError as exc:
        # Value errors (invalid input)
        logger.warning(f"[{request_id}] Value error: {exc}")
        
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=error_response(
                error_code=ErrorCode.INVALID_INPUT,
                message="Invalid input",
                detail=str(exc),
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except PermissionError as exc:
        # Permission errors
        logger.warning(f"[{request_id}] Permission error: {exc}")
        
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content=error_response(
                error_code=ErrorCode.FORBIDDEN,
                message="Permission denied",
                detail=str(exc),
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except TimeoutError as exc:
        # Timeout errors
        logger.error(f"[{request_id}] Timeout error: {exc}")
        
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content=error_response(
                error_code=ErrorCode.TIMEOUT,
                message="Request timeout",
                detail="The operation took too long to complete",
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except ConnectionError as exc:
        # Connection errors (external APIs, database, etc.)
        logger.error(f"[{request_id}] Connection error: {exc}")
        
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_response(
                error_code=ErrorCode.SERVICE_UNAVAILABLE,
                message="Service temporarily unavailable",
                detail="Unable to connect to required service",
                path=str(request.url.path),
                request_id=request_id
            )
        )
    
    except BaseException as exc:
        # Handle ExceptionGroup (from anyio TaskGroup) and other base exceptions
        if ExceptionGroup and isinstance(exc, ExceptionGroup):
            logger.error(f"[{request_id}] Exception group with {len(exc.exceptions)} exceptions")
            
            # Log all sub-exceptions
            for i, sub_exc in enumerate(exc.exceptions):
                logger.error(f"[{request_id}] Sub-exception {i+1}: {type(sub_exc).__name__}: {sub_exc}")
                logger.error(f"[{request_id}] Traceback:\n{''.join(traceback.format_exception(type(sub_exc), sub_exc, sub_exc.__traceback__))}")
            
            # Return error for the first exception
            first_exc = exc.exceptions[0] if exc.exceptions else exc
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response(
                    error_code=ErrorCode.INTERNAL_ERROR,
                    message="Internal server error",
                    detail=f"Multiple errors occurred: {type(first_exc).__name__}",
                    path=str(request.url.path),
                    request_id=request_id
                )
            )
        
        # Re-raise if it's a system exit or keyboard interrupt
        if isinstance(exc, (KeyboardInterrupt, SystemExit)):
            raise
            
        # Log and handle other base exceptions
        logger.error(
            f"[{request_id}] Base exception: {type(exc).__name__}: {exc}",
            exc_info=True
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                error_code=ErrorCode.INTERNAL_ERROR,
                message="Internal server error",
                detail="An unexpected error occurred. Please try again later.",
                path=str(request.url.path),
                request_id=request_id
            )
        )
        
    except Exception as exc:
        # Catch-all for unexpected errors
        logger.error(
            f"[{request_id}] Unhandled exception: {type(exc).__name__}: {exc}",
            exc_info=True
        )
        
        # Log full traceback for debugging
        logger.error(f"[{request_id}] Traceback:\n{traceback.format_exc()}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                error_code=ErrorCode.INTERNAL_ERROR,
                message="Internal server error",
                detail="An unexpected error occurred. Please try again later.",
                path=str(request.url.path),
                request_id=request_id
            )
        )


class CustomHTTPException(Exception):
    """
    Custom HTTP exception with standardized error response
    
    Usage:
        raise CustomHTTPException(
            status_code=400,
            error_code=ErrorCode.INVALID_INPUT,
            message="Invalid email format",
            detail="Email must be a valid email address"
        )
    """
    
    def __init__(
        self,
        status_code: int,
        error_code: ErrorCode,
        message: str,
        detail: Optional[str] = None,
        errors: Optional[List[Dict[str, str]]] = None
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.detail = detail
        self.errors = errors
        super().__init__(message)


async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
    """Handler for CustomHTTPException"""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            error_code=exc.error_code,
            message=exc.message,
            detail=exc.detail,
            errors=exc.errors,
            path=str(request.url.path),
            request_id=request_id
        )
    )


# Export
__all__ = [
    "global_exception_handler",
    "custom_http_exception_handler",
    "CustomHTTPException"
]
