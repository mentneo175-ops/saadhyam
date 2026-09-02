"""
Base Connector Interface for Problem Discovery Engine
Provides abstract contract for data connectors and sensitive data sanitization.
"""
import abc
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
logger = logging.getLogger(__name__)
def to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Normalizes a datetime to UTC and strips timezone info (offset-naive).
    Used at the database query boundary for PostgreSQL TIMESTAMP WITHOUT TIME ZONE columns.
    - If dt is timezone-aware, it is converted to UTC before stripping tzinfo.
    - If dt is already naive, it is assumed to represent UTC and returned unchanged.
    - If dt is None, returns None.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt
def to_aware_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Normalizes a datetime to UTC and ensures timezone info is set to timezone.utc (offset-aware).
    Used at the database query boundary for PostgreSQL TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ) columns.
    - If dt is timezone-naive, it is assumed to represent UTC and assigned timezone.utc.
    - If dt is timezone-aware, it is converted to UTC.
    - If dt is None, returns None.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
# Sensitive key patterns to redact automatically
SENSITIVE_KEY_SUBSTRINGS = {
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "authorization",
    "bearer",
    "private_key",
    "access_token",
    "refresh_token",
    "credential",
    "client_secret",
    "auth_code",
}
def sanitize_sensitive_data(obj: Any) -> Any:
    """
    Recursively sanitizes sensitive credential fields from dicts/lists
    to ensure zero leakage into database entities, events, or logs.
    """
    if isinstance(obj, dict):
        sanitized = {}
        for k, v in obj.items():
            key_lower = str(k).lower()
            if any(sub in key_lower for sub in SENSITIVE_KEY_SUBSTRINGS):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = sanitize_sensitive_data(v)
        return sanitized
    elif isinstance(obj, list):
        return [sanitize_sensitive_data(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(sanitize_sensitive_data(item) for item in obj)
    return obj
class BaseBusinessConnector(abc.ABC):
    """
    Abstract base class for all Saadhyam data connectors.
    Connectors ingest raw data from internal models or external APIs,
    normalize them into standard entities/events, and respect tenant isolation.
    """
    @property
    @abc.abstractmethod
    def connector_key(self) -> str:
        """Unique key identifying the connector (e.g. 'orders', 'voice_leads')."""
        pass
    @property
    @abc.abstractmethod
    def source_type(self) -> str:
        """Category/source type (e.g. 'ecommerce', 'voice_crm', 'hr', 'social')."""
        pass
    @property
    @abc.abstractmethod
    def display_name(self) -> str:
        """User-friendly name for UI display."""
        pass
    @property
    def description(self) -> str:
        """Short description of data collected by this connector."""
        return ""
    @abc.abstractmethod
    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        """Verify whether this connector is available/configured for the given tenant."""
        pass
    @abc.abstractmethod
    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch domain records for this tenant and return normalized entity dicts:
        {
            "entity_type": "order",
            "entity_key": "order:101",
            "source_record_id": "101",
            "display_name": "Order #ORD-101",
            "status": "COMPLETED",
            "properties": {...},
            "created_at": datetime,
            "updated_at": datetime
        }
        """
        pass
    @abc.abstractmethod
    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract meaningful business events from domain records:
        {
            "event_name": "order.created",
            "source": "orders",
            "entity_id": "101",
            "payload": {...},
            "occurred_at": datetime
        }
        """
        pass
    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Extract directional graph relationships between entities:
        {
            "from_entity_key": "customer:user_5",
            "to_entity_key": "order:101",
            "relationship_type": "placed",
            "metadata": {...}
        }
        """
        return []
    def sanitize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Convenience method to sanitize payloads before emission."""
        return sanitize_sensitive_data(payload)
    @staticmethod
    def to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
        """Convert aware or naive datetime to naive UTC for TIMESTAMP WITHOUT TIME ZONE columns."""
        return to_naive_utc(dt)
    @staticmethod
    def to_aware_utc(dt: Optional[datetime]) -> Optional[datetime]:
        """Convert aware or naive datetime to aware UTC for TIMESTAMPTZ columns."""
        return to_aware_utc(dt)
    def normalize_since(self, since: Optional[datetime], target_tz_aware: bool = False) -> Optional[datetime]:
        """Normalize the `since` parameter to match the target database column type."""
        return to_aware_utc(since) if target_tz_aware else to_naive_utc(since)
