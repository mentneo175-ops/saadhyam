"""
Connection Handler Middleware
Prevents h11 protocol errors by handling connection timeouts and errors gracefully
"""

import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
import asyncio

logger = logging.getLogger(__name__)


class ConnectionHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle connection errors and timeouts gracefully.
    Prevents h11 LocalProtocolError cascading failures.
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            # Set a reasonable timeout for the request
            response = await asyncio.wait_for(
                call_next(request),
                timeout=60.0  # 60 second timeout
            )
            return response
            
        except asyncio.TimeoutError:
            logger.warning(f"⏱️  Request timeout: {request.url.path}")
            return JSONResponse(
                status_code=504,
                content={"detail": "Request timeout. Please try again."}
            )
            
        except Exception as e:
            # Catch h11 protocol errors and other connection issues
            error_str = str(e)
            if "h11" in str(type(e).__module__) or "LocalProtocolError" in error_str:
                logger.error(f"❌ HTTP protocol error on {request.url.path}: {e}")
                return JSONResponse(
                    status_code=500,
                    content={"detail": "Connection error. Please retry your request."}
                )
            
            # Re-raise other exceptions to be handled by global handler
            raise
