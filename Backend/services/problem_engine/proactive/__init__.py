"""
Proactive & Event-Driven Discovery Module (Phase 8)
Provides real-time event ingestion, proactive detection evaluation, stable fingerprint deduplication,
dynamic priority recalculation, scheduled discovery scans, and lifecycle audit logging.
"""

from services.problem_engine.proactive.audit import ProblemAuditLogger
from services.problem_engine.proactive.service import ProactiveDiscoveryService

__all__ = [
    "ProblemAuditLogger",
    "ProactiveDiscoveryService",
]
