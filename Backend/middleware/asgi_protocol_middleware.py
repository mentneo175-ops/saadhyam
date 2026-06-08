"""ASGI wrapper that suppresses known protocol errors (h11 LocalProtocolError, ConnectionResetError)
to avoid noisy tracebacks when clients disconnect while the app is sending a response.
"""
import logging
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)


class ProtocolSafeASGI:
    def __init__(self, app: Callable):
        self.app = app

    async def __call__(self, scope, receive, send):
        try:
            await self.app(scope, receive, send)
        except Exception as exc:
            # Best-effort suppression for common connection/HTTP protocol errors
            try:
                mod = getattr(exc, "__module__", "")
                name = type(exc).__name__
                if "h11" in mod or name == "LocalProtocolError" or isinstance(exc, ConnectionResetError):
                    logger.warning(f"[ASGI] Suppressed protocol exception: {type(exc).__name__}: {exc}")
                    # Try to silently close the connection by sending nothing
                    return
            except Exception:
                # If anything goes wrong in suppression, re-raise original
                pass
            raise
