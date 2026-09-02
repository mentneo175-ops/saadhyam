"""
Migration: Add Problem Discovery & Resolution Engine Tables & Schema Updates
Creates database tables for:
  - problems (with fingerprint, is_opportunity, is_risk)
  - problem_observations
  - problem_evidence
  - problem_root_causes
  - problem_solutions
  - solution_execution_plans
  - problem_outcomes
  - business_events
  - problem_lifecycle_audits
  - problem_learning_records

Ensures existing problems table contains all required columns (e.g. fingerprint).
Ensures PostgreSQL problemcategory enum contains all Phase 9 opportunity categories.
Idempotent and safe to run multiple times on both PostgreSQL and SQLite.
"""

import logging
from sqlalchemy import text, inspect
from config.database import Base, sync_engine, IS_SQLITE

logger = logging.getLogger(__name__)


def migrate_add_problem_engine_tables():
    """Create Problem Engine tables, update PostgreSQL enums, and repair missing columns in existing tables."""
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
            ProblemLifecycleAudit,
            ProblemLearningRecord,
        )

        # 1. Update PostgreSQL problemcategory enum if on PostgreSQL
        if "sqlite" not in sync_engine.dialect.name:
            with sync_engine.connect() as connection:
                # Query existing enum values
                res = connection.execute(text("""
                    SELECT enumlabel
                    FROM pg_enum e
                    JOIN pg_type t ON e.enumtypid = t.oid
                    WHERE t.typname = 'problemcategory'
                """))
                existing_enum_values = {row[0] for row in res.fetchall()}

                opportunity_categories = [
                    "REVENUE_GROWTH",
                    "CUSTOMER_RETENTION",
                    "SALES_OPPORTUNITY",
                    "ENGAGEMENT_EXPANSION",
                    "COST_SAVING",
                    "OPERATIONAL_EFFICIENCY",
                ]

                for cat in opportunity_categories:
                    if cat not in existing_enum_values:
                        logger.info(f"🔄 Adding enum value '{cat}' to PostgreSQL problemcategory enum...")
                        connection.execute(
                            text(f"ALTER TYPE problemcategory ADD VALUE IF NOT EXISTS '{cat}'")
                        )
                        connection.commit()
                        logger.info(f"✅ Added enum value '{cat}' to problemcategory")

        # 2. Create tables if they do not exist
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
                ProblemLifecycleAudit.__table__,
                ProblemLearningRecord.__table__,
            ],
        )

        # 3. Repair/Add missing columns to existing problems table
        with sync_engine.connect() as connection:
            inspector = inspect(sync_engine)
            if inspector.has_table("problems"):
                existing_columns = {col["name"] for col in inspector.get_columns("problems")}

                # Check and add 'fingerprint'
                if "fingerprint" not in existing_columns:
                    logger.info("🔄 Adding missing 'fingerprint' column to problems table...")
                    connection.execute(
                        text("ALTER TABLE problems ADD COLUMN fingerprint VARCHAR(128) NULL")
                    )
                    try:
                        connection.execute(
                            text("CREATE INDEX IF NOT EXISTS ix_problems_fingerprint ON problems (fingerprint)")
                        )
                    except Exception as idx_err:
                        logger.warning(f"Index creation note: {idx_err}")
                    logger.info("✅ Added 'fingerprint' column to problems table")

                # Check and add 'is_opportunity'
                if "is_opportunity" not in existing_columns:
                    logger.info("🔄 Adding missing 'is_opportunity' column to problems table...")
                    connection.execute(
                        text("ALTER TABLE problems ADD COLUMN is_opportunity BOOLEAN NOT NULL DEFAULT FALSE")
                    )
                    try:
                        connection.execute(
                            text("CREATE INDEX IF NOT EXISTS ix_problems_is_opportunity ON problems (is_opportunity)")
                        )
                    except Exception as idx_err:
                        logger.warning(f"Index creation note: {idx_err}")
                    logger.info("✅ Added 'is_opportunity' column to problems table")

                # Check and add 'is_risk'
                if "is_risk" not in existing_columns:
                    logger.info("🔄 Adding missing 'is_risk' column to problems table...")
                    connection.execute(
                        text("ALTER TABLE problems ADD COLUMN is_risk BOOLEAN NOT NULL DEFAULT FALSE")
                    )
                    try:
                        connection.execute(
                            text("CREATE INDEX IF NOT EXISTS ix_problems_is_risk ON problems (is_risk)")
                        )
                    except Exception as idx_err:
                        logger.warning(f"Index creation note: {idx_err}")
                    logger.info("✅ Added 'is_risk' column to problems table")

                connection.commit()

        logger.info("✅ Problem Discovery & Resolution Engine tables migration completed successfully")
    except Exception as e:
        logger.error(f"❌ Problem Engine tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_problem_engine_tables()
