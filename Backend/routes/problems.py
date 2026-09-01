"""
Comprehensive Problem Discovery & Resolution Engine API Routes (Phase 6)
Provides complete REST APIs for Problem Discovery, Investigation, Solutions,
ROI, Execution Plans, Approval Workflows, and Outcome Verification.
All endpoints enforce user_id tenant boundary and sensitive credential redaction.
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config.database import get_db
from models.user import User
from models.problem_engine import (
    Problem,
    ProblemObservation,
    ProblemEvidence,
    ProblemRootCause,
    ProblemSolution,
    SolutionExecutionPlan,
    ProblemOutcome,
    ProblemStatus,
    ProblemCategory,
    ProblemSeverity,
    TimeSensitivity,
    ApprovalStatus,
    ExecutionState,
)
from routes.auth import get_current_user
from services.problem_engine.detection.engine import problem_detection_engine
from services.problem_engine.root_cause.analyzer import RootCauseAnalyzer
from services.problem_engine.solutions.generator import SolutionGenerator
from services.problem_engine.roi.calculator import ROICalculator
from services.problem_engine.execution.planner import ExecutionPlanner
from services.problem_engine.execution.workflow import ApprovalWorkflowService
from services.problem_engine.execution.engine import ExecutionEngine
from services.problem_engine.execution.outcome import OutcomeVerifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/problems", tags=["Problem Engine Complete"])


# ===========================================================================
# 1. Problem Lifecycle & Listing
# ===========================================================================

@router.post("/detect")
async def trigger_problem_detection(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger problem detection engine for current tenant."""
    try:
        return await problem_detection_engine.detect_problems(db, current_user.id)
    except Exception as e:
        logger.error(f"Error running detection for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run problem detection")


@router.get("")
async def list_problems(
    category: Optional[str] = Query(None, description="Filter by category"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List business problems for current tenant with filtering and pagination."""
    try:
        stmt = (
            select(Problem)
            .where(Problem.user_id == current_user.id)
            .order_by(desc(Problem.priority_score), desc(Problem.updated_at))
        )
        if category:
            stmt = stmt.where(Problem.category == category)
        if severity:
            stmt = stmt.where(Problem.severity == severity)
        if status:
            stmt = stmt.where(Problem.status == status)

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        problems = result.scalars().all()

        return {
            "success": True,
            "count": len(problems),
            "offset": offset,
            "limit": limit,
            "problems": [
                {
                    "id": p.id,
                    "title": p.title,
                    "summary": p.summary,
                    "category": p.category.value if hasattr(p.category, "value") else str(p.category),
                    "severity": p.severity.value if hasattr(p.severity, "value") else str(p.severity),
                    "priority_score": p.priority_score,
                    "confidence": p.confidence,
                    "status": p.status.value if hasattr(p.status, "value") else str(p.status),
                    "estimated_impact_inr": p.estimated_impact_inr,
                    "cost_impact_inr": p.cost_impact_inr,
                    "recovery_amount_inr": p.recovery_amount_inr,
                    "affected_customers_count": p.affected_customers_count,
                    "affected_employees_count": p.affected_employees_count,
                    "time_sensitivity": p.time_sensitivity.value if hasattr(p.time_sensitivity, "value") else str(p.time_sensitivity),
                    "is_risk": p.is_risk,
                    "is_opportunity": p.is_opportunity,
                    "detected_at": p.detected_at.isoformat() if p.detected_at else None,
                    "solved_at": p.solved_at.isoformat() if p.solved_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                }
                for p in problems
            ],
        }
    except Exception as e:
        logger.error(f"Error listing problems for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list problems")


@router.get("/{problem_id}")
async def get_problem_detail(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete 360-degree problem record with all related entities."""
    stmt = (
        select(Problem)
        .where(
            and_(
                Problem.id == problem_id,
                Problem.user_id == current_user.id,
            )
        )
        .options(
            selectinload(Problem.observations),
            selectinload(Problem.evidence_items),
            selectinload(Problem.root_causes),
            selectinload(Problem.solutions).selectinload(ProblemSolution.execution_plans),
            selectinload(Problem.execution_plans),
            selectinload(Problem.outcome),
        )
    )
    result = await db.execute(stmt)
    p = result.scalar_one_or_none()

    if not p:
        raise HTTPException(status_code=404, detail="Problem not found")

    return {
        "success": True,
        "problem": {
            "id": p.id,
            "title": p.title,
            "summary": p.summary,
            "category": p.category.value if hasattr(p.category, "value") else str(p.category),
            "severity": p.severity.value if hasattr(p.severity, "value") else str(p.severity),
            "priority_score": p.priority_score,
            "confidence": p.confidence,
            "status": p.status.value if hasattr(p.status, "value") else str(p.status),
            "estimated_impact_inr": p.estimated_impact_inr,
            "cost_impact_inr": p.cost_impact_inr,
            "recovery_amount_inr": p.recovery_amount_inr,
            "affected_customers_count": p.affected_customers_count,
            "affected_employees_count": p.affected_employees_count,
            "time_sensitivity": p.time_sensitivity.value if hasattr(p.time_sensitivity, "value") else str(p.time_sensitivity),
            "is_risk": p.is_risk,
            "is_opportunity": p.is_opportunity,
            "detected_at": p.detected_at.isoformat() if p.detected_at else None,
            "solved_at": p.solved_at.isoformat() if p.solved_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "observations": [
                {
                    "id": obs.id,
                    "observation_text": obs.observation_text,
                    "impact_summary": obs.impact_summary,
                    "hypothesis": obs.hypothesis,
                    "investigation_details": obs.investigation_details,
                    "created_at": obs.created_at.isoformat() if obs.created_at else None,
                }
                for obs in p.observations
            ],
            "evidence": [
                {
                    "id": ev.id,
                    "evidence_type": ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type),
                    "source_system": ev.source_system,
                    "metric_name": ev.metric_name,
                    "value_before": ev.value_before,
                    "value_current": ev.value_current,
                    "description": ev.description,
                    "raw_data": ev.raw_data,
                    "recorded_at": ev.recorded_at.isoformat() if ev.recorded_at else None,
                }
                for ev in p.evidence_items
            ],
            "root_causes": [
                {
                    "id": rc.id,
                    "diagnosis": rc.diagnosis,
                    "confidence": rc.confidence,
                    "is_primary": rc.is_primary,
                    "contributing_factors": rc.contributing_factors,
                    "alternative_causes": rc.alternative_causes,
                    "identified_at": rc.identified_at.isoformat() if rc.identified_at else None,
                }
                for rc in p.root_causes
            ],
            "solutions": [
                {
                    "id": s.id,
                    "title": s.title,
                    "description": s.description,
                    "strategy_type": s.strategy_type.value if hasattr(s.strategy_type, "value") else str(s.strategy_type),
                    "risk_level": s.risk_level.value if hasattr(s.risk_level, "value") else str(s.risk_level),
                    "expected_impact": s.expected_impact,
                    "estimated_cost_inr": s.estimated_cost_inr,
                    "expected_roi_multiplier": s.expected_roi_multiplier,
                    "implementation_time_hours": s.implementation_time_hours,
                    "confidence": s.confidence,
                    "required_plugin_keys": s.required_plugin_keys,
                    "required_agent_ids": s.required_agent_ids,
                    "required_voice_usage": s.required_voice_usage,
                    "is_recommended": s.is_recommended,
                }
                for s in p.solutions
            ],
            "execution_plans": [
                {
                    "id": ep.id,
                    "solution_id": ep.solution_id,
                    "approval_status": ep.approval_status.value if hasattr(ep.approval_status, "value") else str(ep.approval_status),
                    "execution_state": ep.execution_state.value if hasattr(ep.execution_state, "value") else str(ep.execution_state),
                    "execution_steps": ep.execution_steps,
                    "started_at": ep.started_at.isoformat() if ep.started_at else None,
                    "completed_at": ep.completed_at.isoformat() if ep.completed_at else None,
                    "error_message": ep.error_message,
                }
                for ep in p.execution_plans
            ],
            "outcome": {
                "id": p.outcome.id,
                "status": p.outcome.status.value if hasattr(p.outcome.status, "value") else str(p.outcome.status),
                "baseline_metrics": p.outcome.baseline_metrics,
                "current_metrics": p.outcome.current_metrics,
                "relative_improvement_pct": p.outcome.relative_improvement_pct,
                "revenue_recovered_inr": p.outcome.revenue_recovered_inr,
                "cost_saved_inr": p.outcome.cost_saved_inr,
                "hours_saved": p.outcome.hours_saved,
                "verification_notes": p.outcome.verification_notes,
                "verified_at": p.outcome.verified_at.isoformat() if p.outcome.verified_at else None,
            } if p.outcome else None,
        },
    }


@router.patch("/{problem_id}/status")
async def update_problem_status(
    problem_id: int,
    status_update: Dict[str, str] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update problem status with lifecycle transition validation."""
    target_status_str = status_update.get("status")
    if not target_status_str:
        raise HTTPException(status_code=400, detail="Status field is required")

    try:
        target_status = ProblemStatus[target_status_str.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid problem status: {target_status_str}")

    stmt = select(Problem).where(
        and_(Problem.id == problem_id, Problem.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    problem = res.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    problem.status = target_status
    if target_status == ProblemStatus.SOLVED:
        problem.solved_at = datetime.utcnow()
    problem.updated_at = datetime.utcnow()
    await db.commit()

    return {"success": True, "problem_id": problem.id, "status": problem.status.value}


# ===========================================================================
# 2. Root Cause Analysis
# ===========================================================================

@router.get("/{problem_id}/root-causes")
async def get_root_causes(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List diagnosed root causes for a problem."""
    stmt = (
        select(ProblemRootCause)
        .join(Problem, ProblemRootCause.problem_id == Problem.id)
        .where(
            and_(
                ProblemRootCause.problem_id == problem_id,
                Problem.user_id == current_user.id,
            )
        )
    )
    res = await db.execute(stmt)
    causes = res.scalars().all()

    return {
        "success": True,
        "problem_id": problem_id,
        "root_causes": [
            {
                "id": rc.id,
                "diagnosis": rc.diagnosis,
                "confidence": rc.confidence,
                "is_primary": rc.is_primary,
                "contributing_factors": rc.contributing_factors,
                "alternative_causes": rc.alternative_causes,
                "identified_at": rc.identified_at.isoformat() if rc.identified_at else None,
            }
            for rc in causes
        ],
    }


@router.post("/{problem_id}/analyze")
async def analyze_problem_root_cause(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger root cause analysis for a problem."""
    try:
        causes = await RootCauseAnalyzer.analyze_problem(db, current_user.id, problem_id)
        return {
            "success": True,
            "problem_id": problem_id,
            "root_causes_count": len(causes),
            "primary_cause": causes[0].diagnosis if causes else None,
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error analyzing root cause for problem {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run root cause analysis")


# ===========================================================================
# 3. Solutions Generation & Selection
# ===========================================================================

@router.get("/{problem_id}/solutions")
async def get_solutions(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List candidate solutions for a problem."""
    stmt = (
        select(ProblemSolution)
        .join(Problem, ProblemSolution.problem_id == Problem.id)
        .where(
            and_(
                ProblemSolution.problem_id == problem_id,
                Problem.user_id == current_user.id,
            )
        )
    )
    res = await db.execute(stmt)
    solutions = res.scalars().all()

    return {
        "success": True,
        "problem_id": problem_id,
        "solutions": [
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "strategy_type": s.strategy_type.value if hasattr(s.strategy_type, "value") else str(s.strategy_type),
                "risk_level": s.risk_level.value if hasattr(s.risk_level, "value") else str(s.risk_level),
                "expected_impact": s.expected_impact,
                "estimated_cost_inr": s.estimated_cost_inr,
                "expected_roi_multiplier": s.expected_roi_multiplier,
                "implementation_time_hours": s.implementation_time_hours,
                "confidence": s.confidence,
                "required_plugin_keys": s.required_plugin_keys,
                "required_agent_ids": s.required_agent_ids,
                "required_voice_usage": s.required_voice_usage,
                "is_recommended": s.is_recommended,
            }
            for s in solutions
        ],
    }


@router.post("/{problem_id}/solutions/generate")
async def generate_solutions(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate solution recommendations for a problem."""
    try:
        solutions = await SolutionGenerator.generate_solutions(db, current_user.id, problem_id)
        return {
            "success": True,
            "problem_id": problem_id,
            "solutions_count": len(solutions),
            "recommended_solution": next((s.title for s in solutions if s.is_recommended), None),
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating solutions for problem {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate solutions")


@router.post("/{problem_id}/solutions/{solution_id}/select")
async def select_solution(
    problem_id: int,
    solution_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a solution candidate as selected/recommended for execution."""
    stmt = (
        select(ProblemSolution)
        .join(Problem, ProblemSolution.problem_id == Problem.id)
        .where(
            and_(
                ProblemSolution.id == solution_id,
                ProblemSolution.problem_id == problem_id,
                Problem.user_id == current_user.id,
            )
        )
    )
    res = await db.execute(stmt)
    sol = res.scalar_one_or_none()

    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Set selected
    all_sols = (await db.execute(
        select(ProblemSolution).where(ProblemSolution.problem_id == problem_id)
    )).scalars().all()
    for s in all_sols:
        s.is_recommended = (s.id == solution_id)

    await db.commit()
    return {"success": True, "selected_solution_id": solution_id, "title": sol.title}


# ===========================================================================
# 4. ROI Assessment
# ===========================================================================

@router.get("/{problem_id}/roi")
async def get_roi(
    problem_id: int,
    solution_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get calculated ROI metrics for problem and selected solution."""
    try:
        return await ROICalculator.calculate_roi(db, current_user.id, problem_id, solution_id=solution_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error computing ROI for problem {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to compute ROI")


@router.post("/{problem_id}/roi/calculate")
async def calculate_roi(
    problem_id: int,
    payload: Dict[str, Any] = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger ROI calculation."""
    solution_id = payload.get("solution_id")
    try:
        return await ROICalculator.calculate_roi(db, current_user.id, problem_id, solution_id=solution_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


# ===========================================================================
# 5. Execution Plans, Approvals & Dispatch
# ===========================================================================

@router.get("/{problem_id}/executions")
async def get_executions(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List execution plans for a problem."""
    stmt = (
        select(SolutionExecutionPlan)
        .join(Problem, SolutionExecutionPlan.problem_id == Problem.id)
        .where(
            and_(
                SolutionExecutionPlan.problem_id == problem_id,
                Problem.user_id == current_user.id,
            )
        )
    )
    res = await db.execute(stmt)
    plans = res.scalars().all()

    return {
        "success": True,
        "problem_id": problem_id,
        "execution_plans": [
            {
                "id": ep.id,
                "solution_id": ep.solution_id,
                "approval_status": ep.approval_status.value if hasattr(ep.approval_status, "value") else str(ep.approval_status),
                "approved_by_user_id": ep.approved_by_user_id,
                "approved_at": ep.approved_at.isoformat() if ep.approved_at else None,
                "rejection_reason": ep.rejection_reason,
                "execution_state": ep.execution_state.value if hasattr(ep.execution_state, "value") else str(ep.execution_state),
                "execution_steps": ep.execution_steps,
                "started_at": ep.started_at.isoformat() if ep.started_at else None,
                "completed_at": ep.completed_at.isoformat() if ep.completed_at else None,
                "error_message": ep.error_message,
            }
            for ep in plans
        ],
    }


@router.post("/{problem_id}/executions/plan")
async def create_execution_plan(
    problem_id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a structured execution plan for a solution."""
    solution_id = payload.get("solution_id")
    if not solution_id:
        raise HTTPException(status_code=400, detail="solution_id is required")

    try:
        plan = await ExecutionPlanner.create_plan(db, current_user.id, problem_id, solution_id)
        return {
            "success": True,
            "plan_id": plan.id,
            "approval_status": plan.approval_status.value,
            "steps_count": len(plan.execution_steps or []),
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{problem_id}/executions/{plan_id}/approve")
async def approve_execution_plan(
    problem_id: int,
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve an execution plan requiring human-in-the-loop authorization."""
    try:
        plan = await ApprovalWorkflowService.approve_plan(
            db, current_user.id, plan_id, approved_by_user_id=current_user.id
        )
        return {
            "success": True,
            "plan_id": plan.id,
            "approval_status": plan.approval_status.value,
            "approved_at": plan.approved_at.isoformat() if plan.approved_at else None,
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{problem_id}/executions/{plan_id}/reject")
async def reject_execution_plan(
    problem_id: int,
    plan_id: int,
    payload: Dict[str, str] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject an execution plan with a recorded audit reason."""
    reason = payload.get("reason", "Rejected by administrator")
    try:
        plan = await ApprovalWorkflowService.reject_plan(db, current_user.id, plan_id, reason=reason)
        return {
            "success": True,
            "plan_id": plan.id,
            "approval_status": plan.approval_status.value,
            "rejection_reason": plan.rejection_reason,
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{problem_id}/executions/{plan_id}/run")
async def run_execution_plan(
    problem_id: int,
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Safely execute an approved resolution plan."""
    try:
        res = await ExecutionEngine.run_plan(db, current_user.id, plan_id)
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error executing plan {plan_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run execution plan")


# ===========================================================================
# 6. Outcome Verification
# ===========================================================================

@router.get("/{problem_id}/outcomes")
async def get_problem_outcome(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get outcome verification ledger for a problem."""
    stmt = (
        select(ProblemOutcome)
        .join(Problem, ProblemOutcome.problem_id == Problem.id)
        .where(
            and_(
                ProblemOutcome.problem_id == problem_id,
                Problem.user_id == current_user.id,
            )
        )
    )
    res = await db.execute(stmt)
    outcome = res.scalar_one_or_none()

    if not outcome:
        return {"success": True, "problem_id": problem_id, "outcome": None}

    return {
        "success": True,
        "problem_id": problem_id,
        "outcome": {
            "id": outcome.id,
            "status": outcome.status.value if hasattr(outcome.status, "value") else str(outcome.status),
            "baseline_metrics": outcome.baseline_metrics,
            "current_metrics": outcome.current_metrics,
            "relative_improvement_pct": outcome.relative_improvement_pct,
            "revenue_recovered_inr": outcome.revenue_recovered_inr,
            "cost_saved_inr": outcome.cost_saved_inr,
            "hours_saved": outcome.hours_saved,
            "verification_notes": outcome.verification_notes,
            "verified_at": outcome.verified_at.isoformat() if outcome.verified_at else None,
        },
    }


@router.post("/{problem_id}/outcomes/verify")
async def verify_outcome(
    problem_id: int,
    payload: Dict[str, Any] = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run outcome verification comparing baseline to post-execution state."""
    current_data = payload.get("current_data")
    try:
        outcome = await OutcomeVerifier.verify_problem_outcome(
            db, current_user.id, problem_id, current_data_override=current_data
        )
        return {
            "success": True,
            "problem_id": problem_id,
            "status": outcome.status.value if hasattr(outcome.status, "value") else str(outcome.status),
            "improvement_pct": outcome.relative_improvement_pct,
            "revenue_recovered_inr": outcome.revenue_recovered_inr,
            "verified_at": outcome.verified_at.isoformat() if outcome.verified_at else None,
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error verifying outcome for problem {problem_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to verify outcome")
