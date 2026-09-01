"""
Unit & Integration Tests for Phase 1 Problem Discovery & Resolution Engine Schema
Tests:
- Table creation
- Schema & column integrity
- Foreign keys & indexes
- Model instantiation & CRUD
- Cascading delete behavior
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import sessionmaker
from config.database import Base
from models.user import User
from models.problem_engine import (
    Problem,
    ProblemObservation,
    ProblemEvidence,
    ProblemRootCause,
    ProblemSolution,
    SolutionExecutionPlan,
    ProblemOutcome,
    BusinessEvent,
    ProblemStatus,
    ProblemSeverity,
    ProblemCategory,
    TimeSensitivity,
    EvidenceType,
    StrategyType,
    RiskLevel,
    ApprovalStatus,
    ExecutionState,
    OutcomeStatus,
)


def test_problem_engine_tables_and_relationships():
    # Use an isolated in-memory SQLite database with foreign keys enabled
    engine = create_engine("sqlite:///:memory:", echo=False)
    
    # Enable foreign keys in SQLite
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    # 1. Verify all 8 Problem Engine tables exist
    required_tables = {
        "problems",
        "problem_observations",
        "problem_evidence",
        "problem_root_causes",
        "problem_solutions",
        "solution_execution_plans",
        "problem_outcomes",
        "business_events",
    }
    for table in required_tables:
        assert table in table_names, f"Table '{table}' not found in database tables"

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # 2. Create a test tenant User
        user = User(
            email="tenant_test@saadhyam.ai",
            name="Problem Engine Test User",
            business_name="Acme Enterprise",
            auth_provider="email",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        assert user.id is not None

        # 3. Create a Problem
        problem = Problem(
            user_id=user.id,
            title="Lead Response Time Degradation",
            summary="Lead qualification response time increased from 18 min to 2.4 hours causing 14% conversion loss.",
            status=ProblemStatus.DETECTED,
            priority_score=91,
            severity=ProblemSeverity.HIGH,
            category=ProblemCategory.BOTTLENECK,
            confidence=0.91,
            estimated_impact_inr=620000.0,
            cost_impact_inr=50000.0,
            time_sensitivity=TimeSensitivity.HIGH,
            affected_customers_count=68,
        )
        session.add(problem)
        session.commit()
        session.refresh(problem)

        assert problem.id is not None
        assert problem.user_id == user.id

        # 4. Attach Observation
        observation = ProblemObservation(
            problem_id=problem.id,
            observation_text="Inbound leads waiting >2h before initial contact",
            impact_summary="14% drop in qualification conversion",
            hypothesis="Manual SDR qualification capacity exceeded during peak hours",
            investigation_details="Analyzed 240 recent leads across CRM and Gmail timestamps.",
        )
        session.add(observation)

        # 5. Attach Evidence Items
        evidence1 = ProblemEvidence(
            problem_id=problem.id,
            evidence_type=EvidenceType.METRIC_DELTA,
            source_system="CRM",
            metric_name="avg_lead_response_time_hours",
            value_before="0.3",
            value_current="2.4",
            description="Average response time increased 8x over 30-day trailing period",
            raw_data={"sample_size": 240, "p90_hours": 3.8},
        )
        evidence2 = ProblemEvidence(
            problem_id=problem.id,
            evidence_type=EvidenceType.METRIC_DELTA,
            source_system="ORDERS",
            metric_name="lead_to_order_conversion_pct",
            value_before="12.4",
            value_current="10.6",
            description="Direct conversion drop observed for delayed leads",
        )
        session.add_all([evidence1, evidence2])

        # 6. Attach Root Cause
        root_cause = ProblemRootCause(
            problem_id=problem.id,
            diagnosis="Manual lead qualification bottleneck",
            confidence=0.93,
            contributing_factors=["Inbound lead surge (+45%)", "Static SDR team size", "Lack of auto-enrichment"],
            is_primary=True,
        )
        session.add(root_cause)

        # 7. Attach Solutions
        solution = ProblemSolution(
            problem_id=problem.id,
            title="Deploy AI Lead Qualification & Instant Voice Follow-up",
            description="Deploy Saadhyam AI Lead Agent + Voice Agent for instant <60s outreach.",
            strategy_type=StrategyType.AI_AGENT,
            risk_level=RiskLevel.MEDIUM,
            expected_impact="HIGH",
            estimated_cost_inr=15000.0,
            expected_roi_multiplier=8.5,
            implementation_time_hours=2.0,
            confidence=0.92,
            required_plugin_keys=["sales_order_management"],
            required_voice_usage=True,
            is_recommended=True,
        )
        session.add(solution)
        session.commit()
        session.refresh(solution)

        # 8. Attach Execution Plan
        plan = SolutionExecutionPlan(
            solution_id=solution.id,
            problem_id=problem.id,
            approval_status=ApprovalStatus.APPROVED,
            approved_by_user_id=user.id,
            approved_at=datetime.utcnow(),
            execution_state=ExecutionState.RUNNING,
            execution_steps=[
                {"step": 1, "runner": "plugin", "key": "sales_order_management", "status": "COMPLETED"},
                {"step": 2, "runner": "voice_agent", "action": "enable_instant_dialer", "status": "IN_PROGRESS"},
            ],
        )
        session.add(plan)

        # 9. Attach Outcome Ledger
        outcome = ProblemOutcome(
            problem_id=problem.id,
            status=OutcomeStatus.IMPROVING,
            baseline_metrics={"response_time_min": 144, "conversion_pct": 10.6},
            current_metrics={"response_time_min": 1.2, "conversion_pct": 14.8},
            relative_improvement_pct=39.6,
            revenue_recovered_inr=420000.0,
            hours_saved=84.0,
            verification_notes="Tested over 7-day monitoring window with 112 new leads.",
        )
        session.add(outcome)

        # 10. Attach Business Event
        event = BusinessEvent(
            user_id=user.id,
            event_name="lead.uncontacted_sla_breach",
            source="crm",
            entity_id="lead_9841",
            payload={"response_time_hours": 2.5, "assigned_rep": "unassigned"},
        )
        session.add(event)
        session.commit()

        # 11. Verify Relationships
        session.refresh(problem)
        session.refresh(user)

        assert len(problem.observations) == 1
        assert len(problem.evidence_items) == 2
        assert len(problem.root_causes) == 1
        assert len(problem.solutions) == 1
        assert len(problem.execution_plans) == 1
        assert problem.outcome is not None
        assert problem.outcome.status == OutcomeStatus.IMPROVING
        assert len(user.problems) == 1
        assert len(user.business_events) == 1

        # 12. Test Cascading Deletion
        # Deleting the parent problem must cascade delete all child rows
        problem_id = problem.id
        session.delete(problem)
        session.commit()

        assert session.get(Problem, problem_id) is None
        assert session.query(ProblemObservation).filter_by(problem_id=problem_id).first() is None
        assert session.query(ProblemEvidence).filter_by(problem_id=problem_id).first() is None
        assert session.query(ProblemRootCause).filter_by(problem_id=problem_id).first() is None
        assert session.query(ProblemSolution).filter_by(problem_id=problem_id).first() is None
        assert session.query(SolutionExecutionPlan).filter_by(problem_id=problem_id).first() is None
        assert session.query(ProblemOutcome).filter_by(problem_id=problem_id).first() is None

        # Deleting the user must cascade delete business events
        user_id = user.id
        session.delete(user)
        session.commit()

        assert session.get(User, user_id) is None
        assert session.query(BusinessEvent).filter_by(user_id=user_id).first() is None

        print("SUCCESS: All Phase 1 Problem Engine schema and relationship tests passed successfully!")

    finally:
        session.close()


if __name__ == "__main__":
    test_problem_engine_tables_and_relationships()
