"""
HR Interview Scheduler Routes — Authenticated CRUD Endpoints.
Enforces workspace isolation by filtering all queries against current_user.id.
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.interview_scheduler import Interview, InterviewSlot, InterviewStatus
from models.user import User
from schemas.interview_scheduler_schema import (
    InterviewCreateRequest,
    InterviewUpdateRequest,
    InterviewResponse,
    InterviewListResponse,
    InterviewSlotCreateRequest,
    InterviewSlotResponse,
)
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview-scheduler", tags=["Interview Scheduler"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _get_interview_or_404(
    interview_id: int,
    user_id: int,
    db: AsyncSession,
) -> Interview:
    """Fetch an interview belonging to the current user or raise 404."""
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
    )
    interview = result.scalars().first()
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID {interview_id} not found",
        )
    return interview


# ---------------------------------------------------------------------------
# Interview Endpoints
# ---------------------------------------------------------------------------

@router.get("/interviews", response_model=InterviewListResponse)
async def list_interviews(
    interview_status: Optional[InterviewStatus] = Query(None, alias="status", description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all scheduled interviews for the current user."""
    try:
        stmt = select(Interview).where(Interview.user_id == current_user.id)
        if interview_status:
            stmt = stmt.where(Interview.interview_status == interview_status)
        stmt = stmt.order_by(desc(Interview.created_at))

        result = await db.execute(stmt)
        interviews = result.scalars().all()

        return InterviewListResponse(
            interviews=[InterviewResponse.from_orm(i) for i in interviews],
            total=len(interviews),
        )
    except Exception as e:
        logger.error(f"Failed to fetch interviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve interviews",
        )


@router.post("/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    request: InterviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule a new interview appointment."""
    try:
        interview = Interview(
            user_id=current_user.id,
            candidate_name=request.candidate_name,
            candidate_email=str(request.candidate_email) if request.candidate_email else None,
            interviewer_name=request.interviewer_name,
            job_role=request.job_role,
            interview_date=request.interview_date,
            interview_time=request.interview_time,
            meeting_link=request.meeting_link,
            interview_status=request.interview_status or InterviewStatus.SCHEDULED,
            notes=request.notes,
        )
        db.add(interview)
        await db.commit()
        await db.refresh(interview)

        logger.info(f"Scheduled new interview ID={interview.id} for candidate '{interview.candidate_name}'")
        return InterviewResponse.from_orm(interview)
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create interview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule interview: {str(e)}",
        )


@router.put("/interviews/{id}", response_model=InterviewResponse)
async def update_interview(
    id: int,
    request: InterviewUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update or reschedule an existing interview appointment."""
    interview = await _get_interview_or_404(id, current_user.id, db)

    try:
        if request.candidate_name is not None:
            interview.candidate_name = request.candidate_name
        if request.candidate_email is not None:
            interview.candidate_email = str(request.candidate_email)
        if request.interviewer_name is not None:
            interview.interviewer_name = request.interviewer_name
        if request.job_role is not None:
            interview.job_role = request.job_role
        if request.interview_date is not None:
            interview.interview_date = request.interview_date
        if request.interview_time is not None:
            interview.interview_time = request.interview_time
        if request.meeting_link is not None:
            interview.meeting_link = request.meeting_link
        if request.interview_status is not None:
            interview.interview_status = request.interview_status
        if request.notes is not None:
            interview.notes = request.notes

        await db.commit()
        await db.refresh(interview)

        logger.info(f"Updated interview ID={interview.id}")
        return InterviewResponse.from_orm(interview)
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update interview ID={id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update interview: {str(e)}",
        )


@router.delete("/interviews/{id}")
async def delete_interview(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel or remove an interview appointment."""
    interview = await _get_interview_or_404(id, current_user.id, db)

    try:
        await db.delete(interview)
        await db.commit()

        logger.info(f"Deleted interview ID={id}")
        return {
            "success": True,
            "message": "Interview cancelled successfully",
            "id": id,
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete interview ID={id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel interview: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Interview Slot Endpoints
# ---------------------------------------------------------------------------

@router.get("/slots", response_model=List[InterviewSlotResponse])
async def list_interview_slots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all available and booked interview time slots for the current user."""
    try:
        stmt = select(InterviewSlot).where(
            InterviewSlot.user_id == current_user.id
        ).order_by(desc(InterviewSlot.created_at))

        result = await db.execute(stmt)
        slots = result.scalars().all()

        return [InterviewSlotResponse.from_orm(s) for s in slots]
    except Exception as e:
        logger.error(f"Failed to fetch interview slots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve interview slots",
        )


@router.post("/slots", response_model=InterviewSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_interview_slot(
    request: InterviewSlotCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new available interview time slot."""
    try:
        slot = InterviewSlot(
            user_id=current_user.id,
            slot_date=request.slot_date,
            start_time=request.start_time,
            end_time=request.end_time,
            is_booked=request.is_booked or False,
        )
        db.add(slot)
        await db.commit()
        await db.refresh(slot)

        logger.info(f"Created interview slot ID={slot.id} on date '{slot.slot_date}'")
        return InterviewSlotResponse.from_orm(slot)
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create interview slot: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create interview slot: {str(e)}",
        )
