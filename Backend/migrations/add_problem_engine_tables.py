"""
Migration: Add Problem Discovery & Resolution Engine Tables
Creates database tables for:
  - problems
  - problem_observations
  - problem_evidence
  - problem_root_causes
  - problem_solutions
  - solution_execution_plans
  - problem_outcomes
  - business_events
"""

import logging
from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_problem_engine_tables():
    """Create Problem Engine tables in the database if sync_engine is available."""
    logger.info("🔄 Running Problem Discovery & Resolution Engine tables migration...")

    if sync_engine is None:
        logger.warning(
            "⚠️ Sync database engine not available, skipping Problem Engine tables migration"
        )
        return

    try:
        import models  # noqa: F401 — registers all models with Base
        from models.problem_engine import (
            Problem,
            ProblemObservation,
            ProblemEvidence,
            ProblemRootCause,
            ProblemSolution,
            SolutionExecutionPlan,
            ProblemOutcome,
            BusinessEvent,
        )

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                Problem.__table__,
                ProblemObservation.__table__,
                ProblemEvidence.__table__,
                ProblemRootCause.__table__,
                ProblemSolution.__table__,
                SolutionExecutionPlan.__table__,
                ProblemOutcome.__table__,
                BusinessEvent.__table__,
            ],
        )
        logger.info("✅ Problem Discovery & Resolution Engine tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ Problem Engine tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_problem_engine_tables()
