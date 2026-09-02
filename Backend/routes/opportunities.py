"""
Opportunities Management REST API (Phase 9)
Provides dedicated endpoints for positive business opportunity discovery, scoring,
evidence validation, solution synthesis, ROI estimation, and execution workflow.
"""

import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from config.database import get_db
from models.user import User
from models.problem_engine import (
    Problem,
    ProblemStatus,
    ProblemCategory,
    ProblemSeverity,
    TimeSensitivity,
    ApprovalStatus,
    ExecutionState,
)
from routes.auth import get_current_user
from services.problem_engine.detection.engine import problem_detection_engine
from services.problem_engine.solutions.generator import SolutionGenerator
from services.problem_engine.roi.calculator import ROICalculator
from services.problem_engine.execution.planner import ExecutionPlanner
from services.problem_engine.execution.workflow import ApprovalWorkflowService
from services.problem_engine.execution.engine import ExecutionEngine
from services.problem_engine.execution.outcome import OutcomeVerifier
from services.problem_engine.investigation.service import ProblemInvestigationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/opportunities", tags=["Opportunities Complete"])


@router.post("/detect")
async def detect_opportunities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Triggers detection engine and returns newly discovered or updated business opportunities.
    """
    try:
        detection_result = await problem_detection_engine.detect_problems(db, current_user.id)

        # Query active opportunities for this user
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.user_id == current_user.id,
                    Problem.is_opportunity == True,
                )
            )
            .order_by(desc(Problem.priority_score), desc(Problem.updated_at))
        )
        res = await db.execute(stmt)
        opps = res.scalars().all()

        return {
            "success": True,
            "count": len(opps),
            "detection_summary": detection_result,
            "opportunities": [
                {
                    "id": o.id,
                    "title": o.title,
                    "summary": o.summary,
                    "category": o.category.value if hasattr(o.category, "value") else str(o.category),
                    "priority_score": o.priority_score,
                    "confidence": o.confidence,
                    "status": o.status.value if hasattr(o.status, "value") else str(o.status),
                    "estimated_roi_inr": o.estimated_impact_inr or o.recovery_amount_inr,
                    "detected_at": o.detected_at.isoformat() if o.detected_at else None,
                }
                for o in opps
            ],
        }
    except Exception as e:
        logger.error(f"Error detecting opportunities for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run opportunity detection")


@router.get("")
async def list_opportunities(
    category: Optional[str] = Query(None, description="Filter by opportunity category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    min_priority: Optional[int] = Query(None, ge=0, le=100),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List positive business growth and retention opportunities for the current tenant.
    """
    try:
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.user_id == current_user.id,
                    Problem.is_opportunity == True,
                )
            )
            .order_by(desc(Problem.priority_score), desc(Problem.updated_at))
        )
        if category:
            stmt = stmt.where(Problem.category == category)
        if status:
            stmt = stmt.where(Problem.status == status)
        if min_priority is not None:
            stmt = stmt.where(Problem.priority_score >= min_priority)

        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        opportunities = result.scalars().all()

        return {
            "success": True,
            "count": len(opportunities),
            "offset": offset,
            "limit": limit,
            "opportunities": [
                {
                    "id": o.id,
                    "title": o.title,
                    "summary": o.summary,
                    "category": o.category.value if hasattr(o.category, "value") else str(o.category),
                    "severity": o.severity.value if hasattr(o.severity, "value") else str(o.severity),
                    "priority_score": o.priority_score,
                    "confidence": o.confidence,
                    "status": o.status.value if hasattr(o.status, "value") else str(o.status),
                    "estimated_impact_inr": o.estimated_impact_inr,
                    "cost_impact_inr": o.cost_impact_inr,
                    "recovery_amount_inr": o.recovery_amount_inr,
                    "affected_customers_count": o.affected_customers_count,
                    "time_sensitivity": o.time_sensitivity.value if hasattr(o.time_sensitivity, "value") else str(o.time_sensitivity),
                    "is_opportunity": True,
                    "is_risk": o.is_risk,
                    "detected_at": o.detected_at.isoformat() if o.detected_at else None,
                    "updated_at": o.updated_at.isoformat() if o.updated_at else None,
                }
                for o in opportunities
            ],
        }
    except Exception as e:
        logger.error(f"Error listing opportunities for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list opportunities")


@router.get("/{opportunity_id}")
async def get_opportunity_detail(
    opportunity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get 360-degree opportunity record with evidence, observations, candidate solutions, and ROI.
    """
    stmt = (
        select(Problem)
        .where(
            and_(
                Problem.id == opportunity_id,
                Problem.user_id == current_user.id,
                Problem.is_opportunity == True,
            )
        )
        .options(
            selectinload(Problem.observations),
            selectinload(Problem.evidence_items),
            selectinload(Problem.root_causes),
            selectinload(Problem.solutions),
            selectinload(Problem.execution_plans),
            selectinload(Problem.outcome),
        )
    )
    res = await db.execute(stmt)
    opp = res.scalar_one_or_none()

    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {
        "success": True,
        "opportunity": {
            "id": opp.id,
            "title": opp.title,
            "summary": opp.summary,
            "category": opp.category.value if hasattr(opp.category, "value") else str(opp.category),
            "severity": opp.severity.value if hasattr(opp.severity, "value") else str(opp.severity),
            "priority_score": opp.priority_score,
            "confidence": opp.confidence,
            "status": opp.status.value if hasattr(opp.status, "value") else str(opp.status),
            "estimated_impact_inr": opp.estimated_impact_inr,
            "cost_impact_inr": opp.cost_impact_inr,
            "recovery_amount_inr": opp.recovery_amount_inr,
            "affected_customers_count": opp.affected_customers_count,
            "time_sensitivity": opp.time_sensitivity.value if hasattr(opp.time_sensitivity, "value") else str(opp.time_sensitivity),
            "is_opportunity": True,
            "is_risk": opp.is_risk,
            "fingerprint": opp.fingerprint,
            "detected_at": opp.detected_at.isoformat() if opp.detected_at else None,
            "updated_at": opp.updated_at.isoformat() if opp.updated_at else None,
            "observations": [
                {
                    "id": obs.id,
                    "observation_text": obs.observation_text,
                    "impact_summary": obs.impact_summary,
                    "hypothesis": obs.hypothesis,
                    "investigation_details": obs.investigation_details,
                    "created_at": obs.created_at.isoformat() if obs.created_at else None,
                }
                for obs in opp.observations
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
                for ev in opp.evidence_items
            ],
            "solutions": [
                {
                    "id": sol.id,
                    "title": sol.title,
                    "description": sol.description,
                    "strategy_type": sol.strategy_type.value if hasattr(sol.strategy_type, "value") else str(sol.strategy_type),
                    "risk_level": sol.risk_level.value if hasattr(sol.risk_level, "value") else str(sol.risk_level),
                    "expected_impact": sol.expected_impact,
                    "estimated_cost_inr": sol.estimated_cost_inr,
                    "expected_roi_multiplier": sol.expected_roi_multiplier,
                    "implementation_time_hours": sol.implementation_time_hours,
                    "confidence": sol.confidence,
                    "required_plugin_keys": sol.required_plugin_keys,
                    "required_agent_ids": sol.required_agent_ids,
                    "required_voice_usage": sol.required_voice_usage,
                    "is_recommended": sol.is_recommended,
                }
                for sol in opp.solutions
            ],
        },
    }


@router.post("/{opportunity_id}/solutions")
async def generate_opportunity_solutions(
    opportunity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate candidate execution strategies and ROI recommendations for an opportunity.
    """
    # Verify ownership and opportunity type
    stmt = select(Problem.id).where(
        and_(
            Problem.id == opportunity_id,
            Problem.user_id == current_user.id,
            Problem.is_opportunity == True,
        )
    )
    res = await db.execute(stmt)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Opportunity not found")

    try:
        solutions = await SolutionGenerator.generate_solutions(db, current_user.id, opportunity_id)
        return {
            "success": True,
            "opportunity_id": opportunity_id,
            "solutions_count": len(solutions),
            "solutions": [
                {
                    "id": sol.id,
                    "title": sol.title,
                    "description": sol.description,
                    "strategy_type": sol.strategy_type.value if hasattr(sol.strategy_type, "value") else str(sol.strategy_type),
                    "risk_level": sol.risk_level.value if hasattr(sol.risk_level, "value") else str(sol.risk_level),
                    "expected_impact": sol.expected_impact,
                    "estimated_cost_inr": sol.estimated_cost_inr,
                    "expected_roi_multiplier": sol.expected_roi_multiplier,
                    "implementation_time_hours": sol.implementation_time_hours,
                    "confidence": sol.confidence,
                    "required_plugin_keys": sol.required_plugin_keys,
                    "required_agent_ids": sol.required_agent_ids,
                    "required_voice_usage": sol.required_voice_usage,
                    "is_recommended": sol.is_recommended,
                }
                for sol in solutions
            ],
        }
    except Exception as e:
        logger.error(f"Error generating solutions for opportunity {opportunity_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate opportunity solutions")


@router.get("/{opportunity_id}/roi")
async def calculate_opportunity_roi(
    opportunity_id: int,
    solution_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate projected financial ROI and net benefit for an opportunity and selected solution.
    """
    try:
        roi_data = await ROICalculator.calculate_roi(
            db, current_user.id, opportunity_id, solution_id=solution_id
        )
        return {
            "success": True,
            "opportunity_id": opportunity_id,
            "roi_assessment": roi_data,
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error calculating ROI for opportunity {opportunity_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate opportunity ROI")


@router.post("/{opportunity_id}/investigate")
async def investigate_opportunity(
    opportunity_id: int,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Investigate an opportunity using evidence-grounded natural-language question answering.
    """
    question = payload.get("question")
    if not question or not str(question).strip():
        raise HTTPException(status_code=400, detail="Field 'question' is required.")

    try:
        investigation_result = await ProblemInvestigationService.investigate_problem(
            db, current_user.id, opportunity_id, question
        )
        return {"success": True, "investigation": investigation_result}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error investigating opportunity {opportunity_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run natural language investigation")
