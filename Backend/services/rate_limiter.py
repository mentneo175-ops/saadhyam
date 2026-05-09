"""
Rate Limiter for Gemini API
Prevents exceeding 5 requests per minute to avoid API disabling
"""

import logging
import time
from collections import deque
from typing import Optional
import asyncio

logger = logging.getLogger(__name__)


class GeminiRateLimiter:
    """
    Rate limiter for Gemini API calls
    Limits to 5 requests per minute (60 seconds)
    """
    
    def __init__(self, max_requests: int = 5, time_window: int = 60):
        """
        Initialize rate limiter
        
        Args:
            max_requests: Maximum number of requests allowed in time window (default: 5)
            time_window: Time window in seconds (default: 60)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.request_times = deque()
        self._lock = asyncio.Lock()
    
    async def acquire(self) -> None:
        """
        Acquire permission to make an API call
        Blocks if rate limit would be exceeded
        """
        async with self._lock:
            current_time = time.time()
            
            # Remove requests outside the time window
            while self.request_times and current_time - self.request_times[0] > self.time_window:
                self.request_times.popleft()
            
            # Check if we've hit the limit
            if len(self.request_times) >= self.max_requests:
                # Calculate how long to wait
                oldest_request = self.request_times[0]
                wait_time = self.time_window - (current_time - oldest_request)
                
                if wait_time > 0:
                    logger.warning(
                        f"[RateLimiter] ⚠️ Rate limit reached ({self.max_requests} requests/{self.time_window}s). "
                        f"Waiting {wait_time:.1f} seconds..."
                    )
                    await asyncio.sleep(wait_time + 0.1)  # Add small buffer
                    
                    # Remove old requests after waiting
                    current_time = time.time()
                    while self.request_times and current_time - self.request_times[0] > self.time_window:
                        self.request_times.popleft()
            
            # Record this request
            self.request_times.append(time.time())
            logger.info(
                f"[RateLimiter] ✅ API call approved. "
                f"Requests in last {self.time_window}s: {len(self.request_times)}/{self.max_requests}"
            )
    
    def get_remaining_requests(self) -> int:
        """Get number of remaining requests in current window"""
        current_time = time.time()
        
        # Remove requests outside the time window
        while self.request_times and current_time - self.request_times[0] > self.time_window:
            self.request_times.popleft()
        
        return max(0, self.max_requests - len(self.request_times))
    
    def get_reset_time(self) -> Optional[float]:
        """Get time in seconds until rate limit resets"""
        if not self.request_times:
            return 0
        
        current_time = time.time()
        oldest_request = self.request_times[0]
        reset_time = self.time_window - (current_time - oldest_request)
        
        return max(0, reset_time)


# Global rate limiter instance
# 5 requests per minute for Gemini API
gemini_rate_limiter = GeminiRateLimiter(max_requests=5, time_window=60)


async def with_rate_limit(func, *args, **kwargs):
    """
    Execute a function with rate limiting
    
    Args:
        func: Function to execute
        *args: Positional arguments for the function
        **kwargs: Keyword arguments for the function
    
    Returns:
        Function result
    """
    await gemini_rate_limiter.acquire()
    
    if asyncio.iscoroutinefunction(func):
        return await func(*args, **kwargs)
    else:
        return func(*args, **kwargs)
