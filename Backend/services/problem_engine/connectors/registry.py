"""
Connector Registry for Problem Discovery Engine
Provides dynamic discovery and registration of data connectors.
"""

import logging
from typing import Dict, List, Optional, Type
from services.problem_engine.connectors.base import BaseBusinessConnector

logger = logging.getLogger(__name__)


class ConnectorRegistry:
    """
    Central registry mapping connector keys to active connector instances.
    Enables pluggable data source extensions without hardcoded references.
    """

    def __init__(self):
        self._connectors: Dict[str, BaseBusinessConnector] = {}

    def register(self, connector: BaseBusinessConnector) -> None:
        """Register a connector instance in the registry."""
        key = connector.connector_key
        if key in self._connectors:
            logger.info(f"🔄 Overwriting connector registration for '{key}'")
        else:
            logger.info(f"🔌 Registered Problem Engine connector: '{key}' ({connector.display_name})")
        self._connectors[key] = connector

    def get(self, connector_key: str) -> Optional[BaseBusinessConnector]:
        """Retrieve a registered connector by key."""
        return self._connectors.get(connector_key)

    def list_available(self) -> List[Dict[str, str]]:
        """Return summary metadata for all registered connectors."""
        return [
            {
                "key": c.connector_key,
                "name": c.display_name,
                "source_type": c.source_type,
                "description": c.description,
            }
            for c in self._connectors.values()
        ]

    def get_all(self) -> Dict[str, BaseBusinessConnector]:
        """Return all registered connectors dictionary."""
        return dict(self._connectors)


# Global singleton instance
connector_registry = ConnectorRegistry()
