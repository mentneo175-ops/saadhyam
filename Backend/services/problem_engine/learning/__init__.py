"""
Closed-Loop Learning & Replanning Subsystem (Phase 11)
Derives empirical learning signals from verified real-world outcomes and applies
historical effectiveness weights to replan unresolved problems with full human-in-the-loop safety.
"""

from .service import ProblemLearningService

__all__ = ["ProblemLearningService"]
