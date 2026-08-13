"""
HR Interview Scheduler Plugin.
Implements the PluginMain contract and connects execution actions
(schedule_interview, list_interviews, cancel_interview, reschedule_interview)
directly to database CRUD operations.
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from plugins.base import BasePlugin
from models.interview_scheduler import Interview, InterviewSlot, InterviewStatus
from config.database import AsyncSessionLocal
from services.interview_automation_service import (
    generate_meeting_link,
    send_interview_confirmation_email,
    schedule_interview_reminder,
    cancel_interview_reminder,
)

logger = logging.getLogger(__name__)


class PluginMain(BasePlugin):
    """HR Interview Scheduler plugin implementation."""

    __plugin__ = True
    plugin_key = "hr_interview_scheduler"
    plugin_name = "Interview Scheduler"
    plugin_description = (
        "Automate interview scheduling with calendar integration, "
        "candidate notifications, and interviewer reminders."
    )
    plugin_icon = "📅"
    plugin_category = "hr"
    plugin_version = "v1.0"

    # ------------------------------------------------------------------ #
    # BasePlugin contract                                                  #
    # ------------------------------------------------------------------ #

    def get_info(self) -> Dict[str, Any]:
        """Return plugin metadata consumed by build_tool_registry()."""
        return {
            "key": self.plugin_key,
            "name": self.plugin_name,
            "description": self.plugin_description,
            "icon": self.plugin_icon,
            "category": self.plugin_category,
            "version": self.plugin_version,
        }

    def get_actions(self) -> List[Dict[str, Any]]:
        """Declare actions exposed to assistant tool router and API dispatcher."""
        return [
            {
                "action": "schedule_interview",
                "name": "Schedule Interview",
                "description": "Schedule a new interview between a candidate and an interviewer",
                "parameters": {
                    "candidate_name": {"type": "string", "required": True},
                    "candidate_email": {"type": "string", "required": False},
                    "interviewer_name": {"type": "string", "required": False},
                    "interview_date": {"type": "string", "required": True},
                    "interview_time": {"type": "string", "required": True},
                    "job_role": {"type": "string", "required": True},
                    "meeting_link": {"type": "string", "required": False},
                },
            },
            {
                "action": "list_interviews",
                "name": "List Interviews",
                "description": "Retrieve a list of all scheduled interviews",
                "parameters": {
                    "status": {"type": "string", "required": False},
                },
            },
            {
                "action": "cancel_interview",
                "name": "Cancel Interview",
                "description": "Cancel a previously scheduled interview",
                "parameters": {
                    "interview_id": {"type": "string", "required": True},
                    "reason": {"type": "string", "required": False},
                },
            },
            {
                "action": "reschedule_interview",
                "name": "Reschedule Interview",
                "description": "Move an existing interview to a new date and time",
                "parameters": {
                    "interview_id": {"type": "string", "required": True},
                    "new_date": {"type": "string", "required": True},
                    "new_time": {"type": "string", "required": True},
                },
            },
        ]

    def get_config_schema(self) -> Dict[str, Any]:
        """Return the JSON schema for plugin configuration."""
        return {
            "type": "object",
            "properties": {
                "calendar_integrations": {
                    "type": "array",
                    "description": "List of calendar providers to connect (e.g. Google Calendar, Outlook)",
                },
                "buffer_time": {
                    "type": "number",
                    "description": "Buffer time in minutes between consecutive interviews",
                    "default": 15,
                },
                "reminder_settings": {
                    "type": "object",
                    "description": "Reminder configuration for candidates and interviewers",
                },
            },
            "required": [],
        }

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate plugin configuration."""
        if not config:
            return True
        buffer = config.get("buffer_time")
        if buffer is not None and not isinstance(buffer, (int, float)):
            logger.warning(
                "Interview Scheduler: 'buffer_time' must be a number, got %s", type(buffer)
            )
            return False
        return True

    def health_check(self) -> Dict[str, Any]:
        """Return plugin health status."""
        return {
            "status": "healthy",
            "code": 200,
            "message": "Interview Scheduler plugin is online and connected to CRUD database layer.",
        }

    # ------------------------------------------------------------------ #
    # Execution Methods                                                   #
    # ------------------------------------------------------------------ #

    async def execute(
        self, action: str, params: Dict[str, Any] = None, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generic execution entry point.
        Dispatches to action handler methods.
        """
        params = params or {}
        context = context or {}

        action_map = {
            "schedule_interview": self.schedule_interview,
            "list_interviews": self.list_interviews,
            "cancel_interview": self.cancel_interview,
            "reschedule_interview": self.reschedule_interview,
        }

        handler = action_map.get(action)
        if not handler:
            logger.error("Interview Scheduler: Invalid action '%s'", action)
            return {
                "success": False,
                "message": f"Unknown action '{action}' for Interview Scheduler plugin.",
                "error": "INVALID_ACTION",
            }

        try:
            return await handler(context, params)
        except Exception as e:
            logger.error("Interview Scheduler: Error executing action '%s': %s", action, e, exc_info=True)
            return {
                "success": False,
                "message": f"Failed to execute action '{action}': {str(e)}",
                "error": str(e),
            }

    async def schedule_interview(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new interview record in the database."""
        user_id = context.get("user_id", 1)
        db: Optional[AsyncSession] = context.get("db")

        candidate_name = params.get("candidate_name")
        interviewer_name = params.get("interviewer_name") or "Hiring Manager"
        job_role = params.get("job_role") or "Candidate"
        interview_date = params.get("interview_date") or params.get("new_date")
        interview_time = params.get("interview_time") or params.get("new_time")

        if not candidate_name or not interview_date or not interview_time:
            return {
                "success": False,
                "message": "Parameters 'candidate_name', 'interview_date', and 'interview_time' are required.",
                "error": "MISSING_PARAMETERS",
            }

        try:
            from services.interview_automation_service import (
                validate_and_normalize_date,
                validate_and_normalize_time,
            )
            norm_date = validate_and_normalize_date(str(interview_date))
            norm_time = validate_and_normalize_time(str(interview_time))
        except ValueError as val_err:
            return {
                "success": False,
                "message": f"Invalid datetime input: {str(val_err)}",
                "error": "INVALID_DATETIME_FORMAT",
            }

        async def _do_schedule(session: AsyncSession):
            interview = Interview(
                user_id=user_id,
                candidate_name=candidate_name,
                candidate_email=params.get("candidate_email"),
                interviewer_name=interviewer_name,
                job_role=job_role,
                interview_date=norm_date,
                interview_time=norm_time,
                meeting_link=params.get("meeting_link"),
                interview_status=InterviewStatus.SCHEDULED,
                notes=params.get("notes"),
            )
            session.add(interview)
            await session.commit()
            await session.refresh(interview)
            return interview


        try:
            if db:
                interview = await _do_schedule(db)
            else:
                async with AsyncSessionLocal() as session:
                    interview = await _do_schedule(session)

            # 1. Automation: Process Google Calendar Event + Real Google Meet URL creation
            try:
                from services.interview_automation_service import process_google_calendar_automation
                if db:
                    await process_google_calendar_automation(user_id, interview, db)
                else:
                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(Interview).where(Interview.id == interview.id))
                        item = res.scalars().first()
                        if item:
                            await process_google_calendar_automation(user_id, item, session)
            except Exception as cal_err:
                logger.error(f"Error processing Google Calendar in plugin schedule_interview: {cal_err}")

            # 2. Automation: Send confirmation email
            try:
                if db:
                    await send_interview_confirmation_email(user_id, interview.id, db)
                else:
                    async with AsyncSessionLocal() as session:
                        await send_interview_confirmation_email(user_id, interview.id, session)
            except Exception as email_err:
                logger.error(f"Error sending confirmation email in plugin schedule_interview: {email_err}")

            # 3. Automation: Schedule reminder
            try:
                schedule_interview_reminder(interview)
            except Exception as rem_err:
                logger.error(f"Error scheduling reminder in plugin schedule_interview: {rem_err}")

            logger.info("Interview Scheduler: Scheduled interview ID=%s for '%s'", interview.id, candidate_name)
            return {
                "success": True,
                "message": f"Interview scheduled successfully for {candidate_name}.",
                "data": {
                    "id": interview.id,
                    "candidate_name": interview.candidate_name,
                    "candidate_email": interview.candidate_email,
                    "interviewer_name": interview.interviewer_name,
                    "job_role": interview.job_role,
                    "interview_date": interview.interview_date,
                    "interview_time": interview.interview_time,
                    "meeting_link": interview.meeting_link,
                    "status": interview.interview_status.value if hasattr(interview.interview_status, "value") else str(interview.interview_status),
                },
            }
        except Exception as e:
            logger.error("Interview Scheduler: Database error in schedule_interview: %s", e)
            return {
                "success": False,
                "message": f"Failed to schedule interview: {str(e)}",
                "error": str(e),
            }

    async def list_interviews(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve interview list for user from the database."""
        user_id = context.get("user_id", 1)
        db: Optional[AsyncSession] = context.get("db")
        status_filter = params.get("status")

        async def _do_list(session: AsyncSession):
            stmt = select(Interview).where(Interview.user_id == user_id)
            if status_filter:
                stmt = stmt.where(Interview.interview_status == status_filter)
            stmt = stmt.order_by(desc(Interview.created_at))
            result = await session.execute(stmt)
            return result.scalars().all()

        try:
            if db:
                interviews = await _do_list(db)
            else:
                async with AsyncSessionLocal() as session:
                    interviews = await _do_list(session)

            data = [
                {
                    "id": item.id,
                    "candidate_name": item.candidate_name,
                    "candidate_email": item.candidate_email,
                    "interviewer_name": item.interviewer_name,
                    "job_role": item.job_role,
                    "interview_date": item.interview_date,
                    "interview_time": item.interview_time,
                    "meeting_link": item.meeting_link,
                    "status": item.interview_status.value if hasattr(item.interview_status, "value") else str(item.interview_status),
                }
                for item in interviews
            ]

            return {
                "success": True,
                "message": f"Retrieved {len(data)} interview(s).",
                "data": data,
            }
        except Exception as e:
            logger.error("Interview Scheduler: Database error in list_interviews: %s", e)
            return {
                "success": False,
                "message": f"Failed to list interviews: {str(e)}",
                "error": str(e),
            }

    async def cancel_interview(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Cancel an existing interview record."""
        user_id = context.get("user_id", 1)
        db: Optional[AsyncSession] = context.get("db")
        interview_id = params.get("interview_id") or params.get("id")

        if not interview_id:
            return {
                "success": False,
                "message": "Parameter 'interview_id' is required.",
                "error": "MISSING_PARAMETERS",
            }

        try:
            int_id = int(interview_id)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": f"Invalid interview_id '{interview_id}'. Must be an integer.",
                "error": "INVALID_PARAMETER",
            }

        async def _do_cancel(session: AsyncSession):
            stmt = select(Interview).where(Interview.id == int_id, Interview.user_id == user_id)
            result = await session.execute(stmt)
            interview = result.scalars().first()
            if not interview:
                return None
            interview.interview_status = InterviewStatus.CANCELLED
            await session.commit()
            return interview

        try:
            if db:
                interview = await _do_cancel(db)
            else:
                async with AsyncSessionLocal() as session:
                    interview = await _do_cancel(session)

            if not interview:
                return {
                    "success": False,
                    "message": f"Interview with ID {int_id} not found.",
                    "error": "NOT_FOUND",
                }

            # 1. Automation: Cancel old APScheduler reminder job
            try:
                from services.interview_automation_service import cancel_interview_reminder
                cancel_interview_reminder(interview.id)
            except Exception as rem_err:
                logger.error(f"Error cancelling reminder in plugin cancel_interview: {rem_err}")

            # 2. Automation: Delete Google Calendar event
            try:
                from services.interview_automation_service import delete_google_calendar_automation
                if interview.google_calendar_event_id:
                    if db:
                        await delete_google_calendar_automation(user_id, interview.google_calendar_event_id, db)
                    else:
                        async with AsyncSessionLocal() as session:
                            await delete_google_calendar_automation(user_id, interview.google_calendar_event_id, session)
            except Exception as cal_err:
                logger.error(f"Error deleting Google Calendar event in plugin cancel_interview: {cal_err}")

            # 3. Automation: Send cancellation email to candidate
            try:
                from services.interview_automation_service import send_interview_cancellation_email
                if db:
                    await send_interview_cancellation_email(user_id, interview, db)
                else:
                    async with AsyncSessionLocal() as session:
                        await send_interview_cancellation_email(user_id, interview, session)
            except Exception as email_err:
                logger.warning(f"Error sending cancellation email in plugin cancel_interview: {email_err}")

            logger.info("Interview Scheduler: Cancelled interview ID=%s", int_id)
            return {
                "success": True,
                "message": f"Interview {int_id} cancelled successfully.",
                "data": {"id": int_id, "status": "cancelled"},
            }
        except Exception as e:
            logger.error("Interview Scheduler: Database error in cancel_interview: %s", e)
            return {
                "success": False,
                "message": f"Failed to cancel interview: {str(e)}",
                "error": str(e),
            }

    async def reschedule_interview(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Reschedule an existing interview record to a new date and time."""
        user_id = context.get("user_id", 1)
        db: Optional[AsyncSession] = context.get("db")
        interview_id = params.get("interview_id") or params.get("id")
        new_date = params.get("new_date") or params.get("interview_date")
        new_time = params.get("new_time") or params.get("interview_time")

        if not interview_id or not new_date or not new_time:
            return {
                "success": False,
                "message": "Parameters 'interview_id', 'new_date', and 'new_time' are required.",
                "error": "MISSING_PARAMETERS",
            }

        try:
            int_id = int(interview_id)
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": f"Invalid interview_id '{interview_id}'. Must be an integer.",
                "error": "INVALID_PARAMETER",
            }

        try:
            from services.interview_automation_service import (
                validate_and_normalize_date,
                validate_and_normalize_time,
            )
            norm_date = validate_and_normalize_date(str(new_date))
            norm_time = validate_and_normalize_time(str(new_time))
        except ValueError as val_err:
            return {
                "success": False,
                "message": f"Invalid datetime input: {str(val_err)}",
                "error": "INVALID_DATETIME_FORMAT",
            }

        async def _do_reschedule(session: AsyncSession):
            stmt = select(Interview).where(Interview.id == int_id, Interview.user_id == user_id)
            result = await session.execute(stmt)
            interview = result.scalars().first()
            if not interview:
                return None
            interview.interview_date = norm_date
            interview.interview_time = norm_time
            interview.interview_status = InterviewStatus.RESCHEDULED
            interview.reminder_sent = False
            await session.commit()
            await session.refresh(interview)
            return interview

        try:
            if db:
                interview = await _do_reschedule(db)
            else:
                async with AsyncSessionLocal() as session:
                    interview = await _do_reschedule(session)

            if not interview:
                return {
                    "success": False,
                    "message": f"Interview with ID {int_id} not found.",
                    "error": "NOT_FOUND",
                }

            # 1. Automation: Cancel old APScheduler reminder job
            try:
                from services.interview_automation_service import cancel_interview_reminder
                cancel_interview_reminder(interview.id)
            except Exception as rem_err:
                logger.error(f"Error cancelling reminder in plugin reschedule_interview: {rem_err}")

            # 2. Automation: Update existing Google Calendar Event (preserves Google Meet URL)
            try:
                from services.interview_automation_service import update_google_calendar_automation
                if db:
                    await update_google_calendar_automation(user_id, interview, db)
                else:
                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(Interview).where(Interview.id == interview.id))
                        item = res.scalars().first()
                        if item:
                            await update_google_calendar_automation(user_id, item, session)
            except Exception as cal_err:
                logger.error(f"Error updating Google Calendar event in plugin reschedule_interview: {cal_err}")

            # 3. Automation: Send updated confirmation email with .ics attachment
            try:
                from services.interview_automation_service import send_interview_confirmation_email
                if db:
                    await send_interview_confirmation_email(user_id, interview.id, db)
                else:
                    async with AsyncSessionLocal() as session:
                        await send_interview_confirmation_email(user_id, interview.id, session)
            except Exception as email_err:
                logger.error(f"Error sending confirmation email in plugin reschedule_interview: {email_err}")

            # 4. Automation: Schedule new 10-minute reminder job
            try:
                from services.interview_automation_service import schedule_interview_reminder
                schedule_interview_reminder(interview)
            except Exception as rem_err:
                logger.error(f"Error scheduling new reminder in plugin reschedule_interview: {rem_err}")

            logger.info("Interview Scheduler: Rescheduled interview ID=%s to %s %s", int_id, new_date, new_time)
            return {
                "success": True,
                "message": f"Interview {int_id} rescheduled to {new_date} at {new_time}.",
                "data": {
                    "id": interview.id,
                    "candidate_name": interview.candidate_name,
                    "interview_date": interview.interview_date,
                    "interview_time": interview.interview_time,
                    "meeting_link": interview.meeting_link,
                    "status": interview.interview_status.value if hasattr(interview.interview_status, "value") else str(interview.interview_status),
                },
            }

        except Exception as e:
            logger.error("Interview Scheduler: Database error in reschedule_interview: %s", e)
            return {
                "success": False,
                "message": f"Failed to reschedule interview: {str(e)}",
                "error": str(e),
            }
