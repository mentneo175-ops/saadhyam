/**
 * Types for the Problem Discovery & Resolution Engine (Phases 1-7)
 */

export type ProblemCategory =
  | "REVENUE_LEAKAGE"
  | "CUSTOMER_CHURN"
  | "BOTTLENECK"
  | "PRODUCTIVITY"
  | "COMPLIANCE"
  | "QUALITY"
  | "GOAL_DEVIATION"
  | "ANOMALY"
  | "RISK"
  | "COST_OVERRUN"
  | "REVENUE_GROWTH"
  | "CUSTOMER_RETENTION"
  | "SALES_OPPORTUNITY"
  | "ENGAGEMENT_EXPANSION"
  | "COST_SAVING"
  | "OPERATIONAL_EFFICIENCY";

export type ProblemSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TimeSensitivity = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type ProblemStatus =
  | "DETECTED"
  | "INVESTIGATING"
  | "CONFIRMED"
  | "PLANNING"
  | "WAITING_FOR_APPROVAL"
  | "EXECUTING"
  | "VERIFYING"
  | "IMPROVING"
  | "SOLVED"
  | "PARTIALLY_SOLVED"
  | "FAILED"
  | "MONITORING";

export type EvidenceType =
  | "METRIC_DELTA"
  | "EVENT_LOG"
  | "CUSTOMER_SENTIMENT"
  | "WORKFLOW_BOTTLENECK"
  | "EXTERNAL_SIGNAL";

export type StrategyType =
  | "AUTOMATION"
  | "AI_AGENT"
  | "VOICE_AI"
  | "WORKFLOW_CHANGE"
  | "PLUGIN_ACTION";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NOT_REQUIRED";

export type ExecutionState =
  | "IDLE"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type OutcomeStatus =
  | "SOLVED"
  | "IMPROVING"
  | "PARTIALLY_SOLVED"
  | "UNCHANGED"
  | "WORSENING"
  | "FAILED";

export interface ProblemObservation {
  id: number;
  observation_text: string;
  impact_summary: string;
  hypothesis: string;
  investigation_details: string;
  created_at?: string;
}

export interface ProblemEvidence {
  id: number;
  evidence_type: EvidenceType;
  source_system: string;
  metric_name?: string | null;
  value_before?: string | null;
  value_current?: string | null;
  description: string;
  raw_data?: Record<string, any> | null;
  recorded_at?: string;
}

export interface ProblemRootCause {
  id: number;
  diagnosis: string;
  confidence: number;
  is_primary: boolean;
  contributing_factors?: Record<string, any> | null;
  alternative_causes?: string[] | null;
  identified_at?: string;
}

export interface ProblemSolution {
  id: number;
  title: string;
  description: string;
  strategy_type: StrategyType;
  risk_level: RiskLevel;
  expected_impact: string;
  estimated_cost_inr: number;
  expected_roi_multiplier: number;
  implementation_time_hours: number;
  confidence: number;
  required_plugin_keys?: string[] | null;
  required_agent_ids?: string[] | null;
  required_voice_usage: boolean;
  is_recommended: boolean;
}

export interface ExecutionStep {
  step_id: number;
  name: string;
  action_type: string;
  required_capability: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  parameters?: Record<string, any>;
  result_summary?: string;
  executed_at?: string;
}

export interface SolutionExecutionPlan {
  id: number;
  solution_id: number;
  approval_status: ApprovalStatus;
  approved_by_user_id?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  execution_state: ExecutionState;
  execution_steps: ExecutionStep[];
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
}

export interface ProblemOutcome {
  id: number;
  status: OutcomeStatus;
  baseline_metrics: Record<string, any>;
  current_metrics: Record<string, any>;
  relative_improvement_pct: number;
  revenue_recovered_inr: number;
  cost_saved_inr: number;
  hours_saved: number;
  verification_notes?: string | null;
  verified_at?: string;
}

export interface ProblemSummaryItem {
  id: number;
  title: string;
  summary: string;
  category: ProblemCategory;
  severity: ProblemSeverity;
  priority_score: number;
  confidence: number;
  status: ProblemStatus;
  estimated_impact_inr?: number | null;
  cost_impact_inr?: number | null;
  recovery_amount_inr?: number | null;
  affected_customers_count?: number;
  affected_employees_count?: number;
  time_sensitivity: TimeSensitivity;
  is_risk: boolean;
  is_opportunity: boolean;
  detected_at?: string;
  solved_at?: string | null;
  updated_at?: string;
}

export interface ProblemDetail extends ProblemSummaryItem {
  observations: ProblemObservation[];
  evidence: ProblemEvidence[];
  root_causes: ProblemRootCause[];
  solutions: ProblemSolution[];
  execution_plans: SolutionExecutionPlan[];
  outcome?: ProblemOutcome | null;
}

export interface ROIAssessment {
  problem_id: number;
  solution_id?: number | null;
  solution_title?: string | null;
  data_certainty: "ACTUAL" | "ESTIMATED" | "ESTIMATED_OPPORTUNITY" | "UNKNOWN";
  total_impact_inr?: number | null;
  recoverable_amount_inr?: number | null;
  implementation_cost_inr?: number | null;
  net_benefit_inr?: number | null;
  roi_percentage?: number | null;
  roi_multiplier?: number | null;
  explanation: string;
}

export interface EvidenceReference {
  id: number;
  source_system: string;
  evidence_type: string;
  metric_name?: string | null;
  value_before?: string | null;
  value_current?: string | null;
  description: string;
  raw_data?: Record<string, any> | null;
}

export interface InvestigationResult {
  question: string;
  problem_id: number;
  is_opportunity: boolean;
  intent: string;
  certainty_tier: "MEASURED_FACT" | "CALCULATED" | "ESTIMATED" | "HYPOTHESIS" | "INSUFFICIENT_DATA";
  direct_answer: string;
  observed_facts: string[];
  calculated_metrics: string[];
  estimates_and_hypotheses: string[];
  recommendations: string[];
  evidence_references: EvidenceReference[];
  missing_evidence_notes: string[];
}

export interface ProblemLearningRecord {
  id: number;
  predicted_impact_inr?: number | null;
  actual_verified_impact_inr?: number | null;
  prediction_error_pct: number;
  outcome_status: OutcomeStatus;
  is_successful: boolean;
  replan_triggered: boolean;
  learned_signals: {
    strategy_type?: string;
    solution_title?: string;
    effectiveness_tier?: string;
    weight_bias?: number;
    measured_improvement_pct?: number;
    prediction_variance_pct?: number;
    hours_saved?: number;
    key_takeaway?: string;
    recorded_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}
