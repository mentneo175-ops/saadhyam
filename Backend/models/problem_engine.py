"""
Problem Discovery & Resolution Engine Database Models
Defines normalized, indexed schemas for:
- problems
- problem_observations
- problem_evidence
- problem_root_causes
- problem_solutions
- solution_execution_plans
- problem_outcomes
- business_events
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


# ===========================================================================
# Enums
# ===========================================================================

class ProblemStatus(str, enum.Enum):
    """12-state lifecycle of a business problem."""
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    CONFIRMED = "CONFIRMED"
    PLANNING = "PLANNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    IMPROVING = "IMPROVING"
    SOLVED = "SOLVED"
    PARTIALLY_SOLVED = "PARTIALLY_SOLVED"
    FAILED = "FAILED"
    MONITORING = "MONITORING"


class ProblemSeverity(str, enum.Enum):
    """Severity tier for problem triage."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ProblemCategory(str, enum.Enum):
    """Core problem and opportunity detection categories."""
    # Problem & Risk Categories
    ANOMALY = "ANOMALY"
    BOTTLENECK = "BOTTLENECK"
    REVENUE_LEAKAGE = "REVENUE_LEAKAGE"
    CUSTOMER_CHURN = "CUSTOMER_CHURN"
    PRODUCTIVITY = "PRODUCTIVITY"
    GOAL_DEVIATION = "GOAL_DEVIATION"
    RISK = "RISK"
    # Opportunity Categories (Phase 9)
    REVENUE_GROWTH = "REVENUE_GROWTH"
    CUSTOMER_RETENTION = "CUSTOMER_RETENTION"
    SALES_OPPORTUNITY = "SALES_OPPORTUNITY"
    ENGAGEMENT_EXPANSION = "ENGAGEMENT_EXPANSION"
    COST_SAVING = "COST_SAVING"
    OPERATIONAL_EFFICIENCY = "OPERATIONAL_EFFICIENCY"


class TimeSensitivity(str, enum.Enum):
    """Urgency / time sensitivity level."""
    URGENT = "URGENT"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class EvidenceType(str, enum.Enum):
    """Type of empirical evidence collected."""
    METRIC_DELTA = "METRIC_DELTA"
    EVENT_LOG = "EVENT_LOG"
    CUSTOMER_SENTIMENT = "CUSTOMER_SENTIMENT"
    CONVERSATION_SNIPPET = "CONVERSATION_SNIPPET"
    WORKFLOW_BOTTLENECK = "WORKFLOW_BOTTLENECK"


class StrategyType(str, enum.Enum):
    """Implementation strategy for a proposed solution."""
    AUTOMATION = "AUTOMATION"
    AI_AGENT = "AI_AGENT"
    VOICE_AI = "VOICE_AI"
    WORKFLOW_CHANGE = "WORKFLOW_CHANGE"
    PLUGIN_ACTION = "PLUGIN_ACTION"


class RiskLevel(str, enum.Enum):
    """Risk tier governing human approval requirement."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ApprovalStatus(str, enum.Enum):
    """Human-in-the-loop approval state."""
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ExecutionState(str, enum.Enum):
    """State of solution execution."""
    IDLE = "IDLE"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class OutcomeStatus(str, enum.Enum):
    """Certified outcome state based on measurable metric deltas."""
    SOLVED = "SOLVED"
    IMPROVING = "IMPROVING"
    PARTIALLY_SOLVED = "PARTIALLY_SOLVED"
    UNCHANGED = "UNCHANGED"
    WORSENING = "WORSENING"
    FAILED = "FAILED"


class AuditEventType(str, enum.Enum):
    """Lifecycle audit event types for proactive and event-driven problem engine."""
    EVENT_RECEIVED = "EVENT_RECEIVED"
    OBSERVATION_CREATED = "OBSERVATION_CREATED"
    DETECTION_EXECUTED = "DETECTION_EXECUTED"
    PROBLEM_CREATED = "PROBLEM_CREATED"
    PROBLEM_UPDATED = "PROBLEM_UPDATED"
    PRIORITY_RECALCULATED = "PRIORITY_RECALCULATED"
    RETRY_ATTEMPT = "RETRY_ATTEMPT"
    SCAN_COMPLETED = "SCAN_COMPLETED"
    FAILURE = "FAILURE"


# ===========================================================================
# Core Models
# ===========================================================================

class Problem(Base):
    """
    Core Problem Entity representing an identified business friction point,
    anomaly, or revenue leakage. Enforces tenant isolation via user_id.
    """
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False, index=True)
    summary = Column(Text, nullable=False)

    status = Column(
        SQLEnum(ProblemStatus, values_callable=lambda x: [e.value for e in x]),
        default=ProblemStatus.DETECTED,
        nullable=False,
        index=True
    )
    priority_score = Column(Integer, default=50, nullable=False, index=True)  # 0 - 100
    severity = Column(
        SQLEnum(ProblemSeverity, values_callable=lambda x: [e.value for e in x]),
        default=ProblemSeverity.MEDIUM,
        nullable=False,
        index=True
    )
    category = Column(
        SQLEnum(ProblemCategory, values_callable=lambda x: [e.value for e in x]),
        default=ProblemCategory.ANOMALY,
        nullable=False,
        index=True
    )

    confidence = Column(Float, default=0.85, nullable=False)  # 0.0 - 1.0
    estimated_impact_inr = Column(Float, default=0.0, nullable=False)
    cost_impact_inr = Column(Float, default=0.0, nullable=False)
    recovery_amount_inr = Column(Float, default=0.0, nullable=False)

    affected_customers_count = Column(Integer, default=0, nullable=False)
    affected_employees_count = Column(Integer, default=0, nullable=False)

    time_sensitivity = Column(
        SQLEnum(TimeSensitivity, values_callable=lambda x: [e.value for e in x]),
        default=TimeSensitivity.MEDIUM,
        nullable=False
    )

    is_opportunity = Column(Boolean, default=False, nullable=False, index=True)
    is_risk = Column(Boolean, default=False, nullable=False, index=True)
    fingerprint = Column(String(128), nullable=True, index=True)

    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    solved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="problems")
    observations = relationship("ProblemObservation", back_populates="problem", cascade="all, delete-orphan")
    evidence_items = relationship("ProblemEvidence", back_populates="problem", cascade="all, delete-orphan")
    root_causes = relationship("ProblemRootCause", back_populates="problem", cascade="all, delete-orphan")
    solutions = relationship("ProblemSolution", back_populates="problem", cascade="all, delete-orphan")
    execution_plans = relationship("SolutionExecutionPlan", back_populates="problem", cascade="all, delete-orphan")
    outcome = relationship("ProblemOutcome", back_populates="problem", uselist=False, cascade="all, delete-orphan")
    lifecycle_audits = relationship("ProblemLifecycleAudit", back_populates="problem", cascade="all, delete-orphan")
    learning_records = relationship("ProblemLearningRecord", back_populates="problem", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Problem(id={self.id}, user_id={self.user_id}, title='{self.title}', status='{self.status}', priority={self.priority_score})>"


class ProblemObservation(Base):
    """
    Observation pipeline record linking symptom, business impact,
    working hypothesis, and investigation steps.
    """
    __tablename__ = "problem_observations"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)

    observation_text = Column(Text, nullable=False)
    impact_summary = Column(Text, nullable=False)
    hypothesis = Column(Text, nullable=False)
    investigation_details = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="observations")

    def __repr__(self):
        return f"<ProblemObservation(id={self.id}, problem_id={self.problem_id})>"


class ProblemEvidence(Base):
    """
    Empirical evidence supporting problem detection, investigation,
    and root cause attribution.
    """
    __tablename__ = "problem_evidence"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)

    evidence_type = Column(
        SQLEnum(EvidenceType, values_callable=lambda x: [e.value for e in x]),
        default=EvidenceType.METRIC_DELTA,
        nullable=False,
        index=True
    )
    source_system = Column(String(50), nullable=False, index=True)  # CRM, ORDERS, GMAIL, CALENDAR, etc.
    metric_name = Column(String(100), nullable=True)
    value_before = Column(String(100), nullable=True)
    value_current = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    raw_data = Column(JSON, nullable=True)

    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="evidence_items")

    def __repr__(self):
        return f"<ProblemEvidence(id={self.id}, problem_id={self.problem_id}, type='{self.evidence_type}', source='{self.source_system}')>"


class ProblemRootCause(Base):
    """
    Identified root cause diagnosis with Bayesian confidence score
    and contributing factor mapping.
    """
    __tablename__ = "problem_root_causes"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)

    diagnosis = Column(Text, nullable=False)
    confidence = Column(Float, default=0.90, nullable=False)  # 0.0 - 1.0
    contributing_factors = Column(JSON, nullable=True)
    is_primary = Column(Boolean, default=True, nullable=False, index=True)
    alternative_causes = Column(JSON, nullable=True)

    identified_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="root_causes")

    def __repr__(self):
        return f"<ProblemRootCause(id={self.id}, problem_id={self.problem_id}, is_primary={self.is_primary}, confidence={self.confidence})>"


class ProblemSolution(Base):
    """
    Candidate solution generated to address the confirmed root cause.
    Includes cost/ROI calculation and capability dependencies.
    """
    __tablename__ = "problem_solutions"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    strategy_type = Column(
        SQLEnum(StrategyType, values_callable=lambda x: [e.value for e in x]),
        default=StrategyType.AUTOMATION,
        nullable=False,
        index=True
    )
    risk_level = Column(
        SQLEnum(RiskLevel, values_callable=lambda x: [e.value for e in x]),
        default=RiskLevel.MEDIUM,
        nullable=False,
        index=True
    )
    expected_impact = Column(String(20), default="HIGH", nullable=False)
    estimated_cost_inr = Column(Float, default=0.0, nullable=False)
    expected_roi_multiplier = Column(Float, default=1.0, nullable=False)
    implementation_time_hours = Column(Float, default=1.0, nullable=False)
    confidence = Column(Float, default=0.90, nullable=False)

    # Capability references (loosely coupled keys to existing systems)
    required_plugin_keys = Column(JSON, nullable=True)  # List of plugin_keys (e.g. ["sales_order_management"])
    required_agent_ids = Column(JSON, nullable=True)    # List of agent ids/roles
    required_voice_usage = Column(Boolean, default=False, nullable=False)

    is_recommended = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="solutions")
    execution_plans = relationship("SolutionExecutionPlan", back_populates="solution", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ProblemSolution(id={self.id}, problem_id={self.problem_id}, title='{self.title}', risk='{self.risk_level}')>"


class SolutionExecutionPlan(Base):
    """
    Guarded execution plan with approval audit trail and multi-step action dispatch.
    """
    __tablename__ = "solution_execution_plans"

    id = Column(Integer, primary_key=True, index=True)
    solution_id = Column(Integer, ForeignKey("problem_solutions.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)

    approval_status = Column(
        SQLEnum(ApprovalStatus, values_callable=lambda x: [e.value for e in x]),
        default=ApprovalStatus.PENDING,
        nullable=False,
        index=True
    )
    approved_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    execution_state = Column(
        SQLEnum(ExecutionState, values_callable=lambda x: [e.value for e in x]),
        default=ExecutionState.IDLE,
        nullable=False,
        index=True
    )
    execution_steps = Column(JSON, nullable=False, default=list)  # List of action steps with runner, payload, and status

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    solution = relationship("ProblemSolution", back_populates="execution_plans")
    problem = relationship("Problem", back_populates="execution_plans")

    def __repr__(self):
        return f"<SolutionExecutionPlan(id={self.id}, solution_id={self.solution_id}, approval='{self.approval_status}', state='{self.execution_state}')>"


class ProblemOutcome(Base):
    """
    Outcome Verification Ledger comparing baseline vs post-execution metrics.
    Certifies whether a problem is truly SOLVED or requires replanning.
    """
    __tablename__ = "problem_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    status = Column(
        SQLEnum(OutcomeStatus, values_callable=lambda x: [e.value for e in x]),
        default=OutcomeStatus.IMPROVING,
        nullable=False,
        index=True
    )
    baseline_metrics = Column(JSON, nullable=False, default=dict)
    current_metrics = Column(JSON, nullable=False, default=dict)
    relative_improvement_pct = Column(Float, default=0.0, nullable=False)

    revenue_recovered_inr = Column(Float, default=0.0, nullable=False)
    cost_saved_inr = Column(Float, default=0.0, nullable=False)
    hours_saved = Column(Float, default=0.0, nullable=False)

    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    problem = relationship("Problem", back_populates="outcome")

    def __repr__(self):
        return f"<ProblemOutcome(id={self.id}, problem_id={self.problem_id}, status='{self.status}', improvement={self.relative_improvement_pct}%)>"


class BusinessEvent(Base):
    """
    Normalized event stream record powering ingestion and anomaly detection.
    """
    __tablename__ = "business_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    event_name = Column(String(100), nullable=False, index=True)  # lead.created, deal.lost, invoice.overdue, etc.
    source = Column(String(50), nullable=False, index=True)        # crm, orders, gmail, calendar, voice, etc.
    entity_id = Column(String(100), nullable=True, index=True)
    payload = Column(JSON, nullable=False, default=dict)

    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="business_events")

    def __repr__(self):
        return f"<BusinessEvent(id={self.id}, user_id={self.user_id}, event='{self.event_name}', source='{self.source}')>"


class BusinessEntity(Base):
    """
    Normalized business entity reference layer indexing records across
    existing domain subsystems (orders, leads, calls, interviews, tasks, etc.).
    """
    __tablename__ = "business_entities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    entity_type = Column(String(50), nullable=False, index=True)      # order, lead, customer, campaign, interview, task, etc.
    entity_key = Column(String(150), nullable=False, index=True)      # e.g. "order:101", "lead:45"
    source_system = Column(String(50), nullable=False, index=True)    # orders, voice, interview_scheduler, task_tracking, etc.
    source_record_id = Column(String(100), nullable=False, index=True)

    display_name = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True, index=True)
    properties = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="business_entities")
    outgoing_relationships = relationship(
        "BusinessEntityRelationship",
        foreign_keys="BusinessEntityRelationship.from_entity_id",
        back_populates="from_entity",
        cascade="all, delete-orphan",
    )
    incoming_relationships = relationship(
        "BusinessEntityRelationship",
        foreign_keys="BusinessEntityRelationship.to_entity_id",
        back_populates="to_entity",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<BusinessEntity(id={self.id}, user_id={self.user_id}, key='{self.entity_key}', type='{self.entity_type}', source='{self.source_system}')>"


class BusinessEntityRelationship(Base):
    """
    Directional relationship between two normalized business entities
    powering the Business Context Graph.
    """
    __tablename__ = "business_entity_relationships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    from_entity_id = Column(Integer, ForeignKey("business_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    to_entity_id = Column(Integer, ForeignKey("business_entities.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, index=True)  # placed, contains, assigned_to, generated, etc.

    metadata_json = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    from_entity = relationship("BusinessEntity", foreign_keys=[from_entity_id], back_populates="outgoing_relationships")
    to_entity = relationship("BusinessEntity", foreign_keys=[to_entity_id], back_populates="incoming_relationships")

    def __repr__(self):
        return f"<BusinessEntityRelationship(id={self.id}, from={self.from_entity_id}, to={self.to_entity_id}, type='{self.relationship_type}')>"


class ConnectorSyncState(Base):
    """
    Observable sync state and health telemetry for data connectors per tenant.
    """
    __tablename__ = "connector_sync_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    connector_key = Column(String(50), nullable=False, index=True)
    sync_status = Column(String(30), default="IDLE", nullable=False, index=True)  # IDLE, SYNCING, SUCCESS, PARTIAL, FAILED
    last_sync_at = Column(DateTime(timezone=True), nullable=True)

    records_processed = Column(Integer, default=0, nullable=False)
    entities_created = Column(Integer, default=0, nullable=False)
    events_created = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="connector_sync_states")

    def __repr__(self):
        return f"<ConnectorSyncState(id={self.id}, user_id={self.user_id}, connector='{self.connector_key}', status='{self.sync_status}')>"


class ProblemLifecycleAudit(Base):
    """
    Audit ledger recording all state transitions, event ingestions,
    and background detection actions for full observability and traceability.
    """
    __tablename__ = "problem_lifecycle_audits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=True, index=True)

    event_type = Column(
        SQLEnum(AuditEventType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    details = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="problem_lifecycle_audits")
    problem = relationship("Problem", back_populates="lifecycle_audits")

    def __repr__(self):
        return f"<ProblemLifecycleAudit(id={self.id}, user_id={self.user_id}, event='{self.event_type}', problem_id={self.problem_id})>"


class ProblemLearningRecord(Base):
    """
    Closed-Loop Learning Record (Phase 11)
    Stores empirical learnings, prediction variances, and strategy effectiveness
    signals derived from verified real-world outcomes.
    """
    __tablename__ = "problem_learning_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    solution_id = Column(Integer, ForeignKey("problem_solutions.id", ondelete="SET NULL"), nullable=True, index=True)
    execution_plan_id = Column(Integer, ForeignKey("solution_execution_plans.id", ondelete="SET NULL"), nullable=True, index=True)

    predicted_impact_inr = Column(Float, nullable=True)
    actual_verified_impact_inr = Column(Float, nullable=True)
    prediction_error_pct = Column(Float, default=0.0, nullable=False)

    outcome_status = Column(
        SQLEnum(OutcomeStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    is_successful = Column(Boolean, default=False, nullable=False, index=True)
    learned_signals = Column(JSON, nullable=False, default=dict)
    replan_triggered = Column(Boolean, default=False, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="problem_learning_records")
    problem = relationship("Problem", back_populates="learning_records")
    solution = relationship("ProblemSolution")
    execution_plan = relationship("SolutionExecutionPlan")

    def __repr__(self):
        return f"<ProblemLearningRecord(id={self.id}, problem_id={self.problem_id}, outcome='{self.outcome_status}', success={self.is_successful}, error={self.prediction_error_pct}%)>"
