"""
Pydantic schemas for the HR Interview Scheduler plugin.
Used for validating API request payloads and serializing database objects.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, EmailStr, field_validator

from models.interview_scheduler import InterviewStatus
from services.interview_automation_service import (
    validate_and_normalize_date,
    validate_and_normalize_time,
)


# ---------------------------------------------------------------------------
# Interview Request & Response Schemas
# ---------------------------------------------------------------------------

class InterviewCreateRequest(BaseModel):
    """Schema for creating a new interview appointment."""

    candidate_name: str = Field(..., min_length=1, description="Full name of the candidate")
    candidate_email: Optional[EmailStr] = Field(None, description="Email address of the candidate")
    interviewer_name: str = Field(..., min_length=1, description="Full name of the interviewer")
    job_role: str = Field(..., min_length=1, description="Job role or position title")
    interview_date: str = Field(..., min_length=1, description="Date of the interview (e.g. 2026-08-10 or 'tomorrow')")
    interview_time: str = Field(..., min_length=1, description="Time of the interview (e.g. 15:00, 2:30 PM, or 2 PM)")
    meeting_link: Optional[str] = Field(None, description="Virtual meeting link (Google Meet, Zoom, Teams)")
    interview_status: Optional[InterviewStatus] = Field(default=InterviewStatus.SCHEDULED, description="Interview status")
    notes: Optional[str] = Field(None, description="Additional notes or instructions")

    @field_validator("interview_date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        return validate_and_normalize_date(v)

    @field_validator("interview_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        return validate_and_normalize_time(v)


class InterviewUpdateRequest(BaseModel):
    """Schema for updating an existing interview appointment."""

    candidate_name: Optional[str] = Field(None, min_length=1, description="Full name of the candidate")
    candidate_email: Optional[EmailStr] = Field(None, description="Email address of the candidate")
    interviewer_name: Optional[str] = Field(None, min_length=1, description="Full name of the interviewer")
    job_role: Optional[str] = Field(None, min_length=1, description="Job role or position title")
    interview_date: Optional[str] = Field(None, min_length=1, description="Date of the interview")
    interview_time: Optional[str] = Field(None, min_length=1, description="Time of the interview")
    meeting_link: Optional[str] = Field(None, description="Virtual meeting link")
    interview_status: Optional[InterviewStatus] = Field(None, description="Updated interview status")
    notes: Optional[str] = Field(None, description="Additional notes or instructions")

    @field_validator("interview_date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_and_normalize_date(v)
        return v

    @field_validator("interview_time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_and_normalize_time(v)
        return v



class InterviewResponse(BaseModel):
    """Schema for serializing an interview record."""

    id: int
    user_id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    interviewer_name: str
    job_role: str
    interview_date: str
    interview_time: str
    meeting_link: Optional[str] = None
    interview_status: InterviewStatus
    notes: Optional[str] = None
    confirmation_sent: bool = False
    reminder_sent: bool = False
    google_calendar_event_id: Optional[str] = None
    google_calendar_event_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InterviewListResponse(BaseModel):
    """Schema for returning a list of interviews."""

    interviews: List[InterviewResponse] = Field(default_factory=list, description="List of interviews")
    total: int = Field(default=0, description="Total count of interview records")


# ---------------------------------------------------------------------------
# Interview Slot Request & Response Schemas
# ---------------------------------------------------------------------------

class InterviewSlotCreateRequest(BaseModel):
    """Schema for creating a new available interview time slot."""

    slot_date: str = Field(..., min_length=1, description="Date of the available time slot")
    start_time: str = Field(..., min_length=1, description="Start time of the slot (e.g. 10:00)")
    end_time: str = Field(..., min_length=1, description="End time of the slot (e.g. 11:00)")
    is_booked: Optional[bool] = Field(default=False, description="Whether the slot is booked")


class InterviewSlotResponse(BaseModel):
    """Schema for serializing an interview time slot record."""

    id: int
    user_id: int
    interview_id: Optional[int] = None
    slot_date: str
    start_time: str
    end_time: str
    is_booked: bool
    created_at: datetime

    class Config:
        from_attributes = True
