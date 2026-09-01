"""
Connectors Package Initialization
Registers default adapters into the global ConnectorRegistry.
"""

from services.problem_engine.connectors.base import BaseBusinessConnector, sanitize_sensitive_data
from services.problem_engine.connectors.registry import ConnectorRegistry, connector_registry
from services.problem_engine.connectors.adapters.orders import OrderConnector
from services.problem_engine.connectors.adapters.voice_leads import VoiceLeadConnector
from services.problem_engine.connectors.adapters.interviews import InterviewConnector
from services.problem_engine.connectors.adapters.tasks_growth import TaskGrowthConnector
from services.problem_engine.connectors.adapters.linkedin import LinkedInConnector
from services.problem_engine.connectors.adapters.whatsapp import WhatsAppConnector

# Register core adapters
connector_registry.register(OrderConnector())
connector_registry.register(VoiceLeadConnector())
connector_registry.register(InterviewConnector())
connector_registry.register(TaskGrowthConnector())
connector_registry.register(LinkedInConnector())
connector_registry.register(WhatsAppConnector())

__all__ = [
    "BaseBusinessConnector",
    "ConnectorRegistry",
    "connector_registry",
    "sanitize_sensitive_data",
    "OrderConnector",
    "VoiceLeadConnector",
    "InterviewConnector",
    "TaskGrowthConnector",
    "LinkedInConnector",
    "WhatsAppConnector",
]
