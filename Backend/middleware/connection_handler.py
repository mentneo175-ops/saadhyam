"""
Connection Handler Middleware
Handles client disconnections gracefully
"""

import logging
from typing import Callable
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import asyncio

logger = logging.getLogger(__name__)


class ConnectionStateMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle client disconnections gracefully
    Prevents errors when trying to send responses to closed connections
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and handle disconnections
        """
        try:
            # Check if client is still connected
            if await request.is_disconnected():
                logger.warning(f"Client disconnected before processing: {request.url.path}")
                # Return empty response (won't be sent anyway)
                return Response(status_code=499, content="Client Closed Request")
            
            # Process request
            response = await call_next(request)
            
            # Check again before sending response
            if await request.is_disconnected():
                logger.warning(f"Client disconnected during processing: {request.url.path}")
                return Response(status_code=499, content="Client Closed Request")
            
            return response
            
        except asyncio.CancelledError:
            # Handle cancelled requests (client disconnected)
            logger.warning(f"Request cancelled (client disconnected): {request.url.path}")
            return Response(status_code=499, content="Client Closed Request")
            
        except Exception as exc:
            # Let other exceptions bubble up to error handler
            logger.error(f"Error in connection handler: {exc}")
            raise


async def check_client_disconnect(request: Request) -> bool:
    """
    Check if client has disconnected
    
    Args:
        request: FastAPI request object
        
    Returns:
        True if client is disconnected, False otherwise
    """
    try:
        return await request.is_disconnected()
    except Exception:
        # If we can't check, assume connected
        return False


# Export
__all__ = [
    "ConnectionStateMiddleware",
    "check_client_disconnect"
]
