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

from pydantic import BaseModel, Field

from services.interview_automation_service import (
    generate_meeting_link,
    process_google_calendar_automation,
    update_google_calendar_automation,
    delete_google_calendar_automation,
    send_interview_confirmation_email,
    send_interview_cancellation_email,
    send_interview_reminder_email,
    schedule_interview_reminder,
    cancel_interview_reminder,
)
from services.google_calendar_service import GoogleCalendarService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview-scheduler", tags=["Interview Scheduler"])


class GoogleCalendarOAuthRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


from fastapi.responses import RedirectResponse
import urllib.parse

# ---------------------------------------------------------------------------
# Google Calendar Connection Endpoints
# ---------------------------------------------------------------------------

@router.get("/google-calendar/status")
async def get_google_calendar_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if the current user has connected Google Calendar."""
    token = await GoogleCalendarService.get_valid_access_token(current_user.id, db)
    return {"connected": bool(token)}


@router.get("/google-calendar/auth-url")
async def get_google_calendar_auth_url(
    redirect_uri: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Generate Google OAuth 2.0 authorization URL for Google Calendar with signed state token."""
    state = GoogleCalendarService.generate_oauth_state(current_user.id)
    target_redirect = redirect_uri or GoogleCalendarService.get_default_redirect_uri()
    url = GoogleCalendarService.get_auth_url(redirect_uri=target_redirect, state=state)
    return {"auth_url": url}


@router.get("/google-calendar/callback")
async def handle_google_calendar_callback_get(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth 2.0 GET redirect from Google authorization server."""
    frontend_url = "http://localhost:5173/dashboard/plugins/interview-scheduler"
    if error:
        logger.warning(f"OAuth callback received error from Google: {error}")
        err_msg = urllib.parse.quote("Google Calendar connection failed. Please check your Google Calendar configuration.")
        return RedirectResponse(url=f"{frontend_url}?google_calendar=error&message={err_msg}", status_code=302)

    if not code or not state:
        err_msg = urllib.parse.quote("Invalid OAuth callback parameters.")
        return RedirectResponse(url=f"{frontend_url}?google_calendar=error&message={err_msg}", status_code=302)

    user_id = GoogleCalendarService.verify_oauth_state(state)
    if not user_id:
        logger.warning("OAuth callback failed state token verification")
        err_msg = urllib.parse.quote("Invalid or expired OAuth session. Please try connecting again.")
        return RedirectResponse(url=f"{frontend_url}?google_calendar=error&message={err_msg}", status_code=302)

    target_redirect = GoogleCalendarService.get_default_redirect_uri()
    res = await GoogleCalendarService.exchange_code(
        code=code,
        redirect_uri=target_redirect,
        user_id=user_id,
        db=db
    )

    if res.get("success"):
        return RedirectResponse(url=f"{frontend_url}?google_calendar=connected", status_code=302)
    else:
        err_msg = urllib.parse.quote("Google Calendar connection failed. Please check your Google Calendar configuration.")
        return RedirectResponse(url=f"{frontend_url}?google_calendar=error&message={err_msg}", status_code=302)


@router.post("/google-calendar/callback")
async def handle_google_calendar_callback(
    request: GoogleCalendarOAuthRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Exchange authorization code for Google Calendar OAuth tokens (POST fallback)."""
    target_redirect = request.redirect_uri or GoogleCalendarService.get_default_redirect_uri()
    res = await GoogleCalendarService.exchange_code(
        code=request.code,
        redirect_uri=target_redirect,
        user_id=current_user.id,
        db=db
    )
    if not res.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("error"))
    return res



@router.delete("/google-calendar/disconnect")
async def disconnect_google_calendar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect Google Calendar for current user."""
    from models.user_api_keys import UserAPIKeys
    stmt = select(UserAPIKeys).where(
        UserAPIKeys.user_id == current_user.id,
        UserAPIKeys.platform == "google_calendar"
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if record:
        record.is_active = False
        await db.commit()
    return {"success": True, "message": "Google Calendar disconnected"}


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
    """Schedule a new interview appointment with automated Google Calendar + Google Meet creation, email, and reminder."""
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

        # 1. Automation: Process Google Calendar Event + Real Google Meet URL creation
        try:
            await process_google_calendar_automation(current_user.id, interview, db)
        except Exception as cal_err:
            logger.error(f"Error processing Google Calendar automation for interview ID={interview.id}: {cal_err}")

        await db.refresh(interview)
        meeting_link_persisted = bool(interview.meeting_link)

        logger.info(
            f"Scheduled new interview ID={interview.id} for candidate '{interview.candidate_name}', "
            f"meeting_link_persisted={meeting_link_persisted}"
        )

        # 2. Automation: Send confirmation email with .ics attachment
        try:
            await send_interview_confirmation_email(current_user.id, interview.id, db)
        except Exception as email_err:
            logger.error(f"Error sending confirmation email for interview ID={interview.id}: {email_err}")

        # 3. Automation: Schedule 10-minute reminder job
        try:
            schedule_interview_reminder(interview)
        except Exception as rem_err:
            logger.error(f"Error scheduling 10-minute reminder for interview ID={interview.id}: {rem_err}")

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
        date_changed = request.interview_date is not None and request.interview_date != interview.interview_date
        time_changed = request.interview_time is not None and request.interview_time != interview.interview_time
        rescheduled = date_changed or time_changed

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

        if rescheduled:
            interview.interview_status = InterviewStatus.RESCHEDULED
            interview.reminder_sent = False

        await db.commit()
        await db.refresh(interview)

        # Automation status management
        if interview.interview_status in [InterviewStatus.CANCELLED, InterviewStatus.COMPLETED, InterviewStatus.NO_SHOW]:
            cancel_interview_reminder(interview.id)
            if interview.google_calendar_event_id:
                try:
                    await delete_google_calendar_automation(current_user.id, interview.google_calendar_event_id, db)
                except Exception as del_cal_err:
                    logger.error(f"Error deleting Google Calendar event: {del_cal_err}")
            if interview.interview_status == InterviewStatus.CANCELLED:
                try:
                    await send_interview_cancellation_email(current_user.id, interview, db)
                except Exception as email_err:
                    logger.warning(f"Error sending cancellation email for interview ID={id}: {email_err}")
        elif rescheduled:
            cancel_interview_reminder(interview.id)
            try:
                await update_google_calendar_automation(current_user.id, interview, db)
            except Exception as upd_cal_err:
                logger.error(f"Error updating Google Calendar event for interview ID={id}: {upd_cal_err}")
            try:
                await send_interview_confirmation_email(current_user.id, interview.id, db)
            except Exception as email_err:
                logger.error(f"Error sending updated confirmation email for interview ID={id}: {email_err}")
            try:
                schedule_interview_reminder(interview)
            except Exception as rem_err:
                logger.error(f"Error rescheduling reminder job for interview ID={id}: {rem_err}")

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
        cancel_interview_reminder(interview.id)
        if interview.google_calendar_event_id:
            try:
                await delete_google_calendar_automation(current_user.id, interview.google_calendar_event_id, db)
            except Exception as del_cal_err:
                logger.error(f"Error deleting Google Calendar event: {del_cal_err}")

        try:
            await send_interview_cancellation_email(current_user.id, interview, db)
        except Exception as email_err:
            logger.warning(f"Error sending cancellation email for interview ID={id}: {email_err}")

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


@router.post("/interviews/{id}/trigger-reminder")
async def trigger_interview_reminder(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger the 10-minute reminder email for testing purposes."""
    interview = await _get_interview_or_404(id, current_user.id, db)
    res = await send_interview_reminder_email(interview.id)
    return res


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
