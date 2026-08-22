"""
Interview Automation Service
Handles meeting link generation, RFC 5545 .ics calendar invitations,
confirmation emails, and APScheduler 10-minute reminder job dispatching.
Reuses existing SMTP configuration from sales_email_marketing plugin.
"""

import logging
import uuid
import smtplib
import socket
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config.database import AsyncSessionLocal
from models.interview_scheduler import Interview, InterviewStatus
from models.plugins import Plugin, UserPlugin

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Date & Time Validation & Normalization Helpers
# ---------------------------------------------------------------------------

def validate_and_normalize_date(date_str: str) -> str:
    """
    Validate and normalize interview date string.
    Supports formats: YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD, DD-MM-YYYY, 'today', 'tomorrow'.
    Returns normalized date string in YYYY-MM-DD format.
    Raises ValueError for invalid inputs.
    """
    if not date_str or not isinstance(date_str, str) or not date_str.strip():
        raise ValueError("Interview date cannot be empty")

    s = date_str.strip()
    s_lower = s.lower()

    if s_lower == "today":
        return datetime.utcnow().strftime("%Y-%m-%d")
    elif s_lower == "tomorrow":
        return (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

    date_formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
    ]

    for fmt in date_formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    raise ValueError(f"Invalid interview date format: '{date_str}'. Expected format: YYYY-MM-DD or DD/MM/YYYY")


def validate_and_normalize_time(time_str: str) -> str:
    """
    Validate and normalize interview time string.
    Accepts 24-hour (15:00, 9:30), 12-hour with minutes (3:00 PM, 2:30pm), 
    and 12-hour without minutes (2 pm, 2pm, 11am).
    Returns normalized time string in HH:MM format (24-hour).
    Raises ValueError for invalid inputs.
    """
    if not time_str or not isinstance(time_str, str) or not time_str.strip():
        raise ValueError("Interview time cannot be empty")

    s = time_str.strip()

    time_formats = [
        "%H:%M",
        "%H:%M:%S",
        "%I:%M %p",
        "%I:%M%p",
        "%I %p",
        "%I%p",
    ]

    for fmt in time_formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%H:%M")
        except ValueError:
            continue

    import re
    match = re.match(r"^(\d{1,2})\s*([ap]\.?m\.?)$", s, re.IGNORECASE)
    if match:
        hr = int(match.group(1))
        ampm = match.group(2).lower().replace(".", "")
        if 1 <= hr <= 12:
            if ampm == "pm" and hr != 12:
                hr += 12
            elif ampm == "am" and hr == 12:
                hr = 0
            return f"{hr:02d}:00"

    raise ValueError(f"Invalid interview time format: '{time_str}'. Expected format: HH:MM or 12-hour time (e.g. '15:00', '2:30 PM', '2 pm')")


def parse_interview_datetime(interview_date: str, interview_time: str) -> Optional[datetime]:
    """
    Parse flexible date and time strings into a datetime object safely.
    Prevents invalid legacy records (e.g. date='likhitha') from throwing exceptions.
    Returns None if parsing fails.
    """
    if not interview_date or not interview_time:
        return None

    try:
        norm_date = validate_and_normalize_date(interview_date)
        norm_time = validate_and_normalize_time(interview_time)
        return datetime.strptime(f"{norm_date} {norm_time}", "%Y-%m-%d %H:%M")
    except Exception as e:
        logger.warning(f"Could not parse interview datetime for record (date='{interview_date}', time='{interview_time}'): {e}")
        return None



# ---------------------------------------------------------------------------
# 1. Meeting Link & Google Calendar Automation
# ---------------------------------------------------------------------------

def generate_meeting_link(interview_id: int, candidate_name: str) -> Optional[str]:
    """
    Return None if no manual meeting link is supplied.
    Real Google Meet URLs are generated strictly via Google Calendar API.
    """
    return None


async def process_google_calendar_automation(
    user_id: int,
    interview: Interview,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Create a real Google Calendar event with automatic Google Meet creation.
    Saves real Google Meet URL and event_id into DB.
    """
    from services.google_calendar_service import GoogleCalendarService
    
    cal_res = await GoogleCalendarService.create_calendar_event(user_id, interview, db)
    if cal_res.get("success"):
        meet_url = cal_res.get("meet_url")
        event_id = cal_res.get("event_id")
        event_url = cal_res.get("event_url")
        
        if meet_url:
            interview.meeting_link = meet_url
        if event_id:
            interview.google_calendar_event_id = event_id
        if event_url:
            interview.google_calendar_event_url = event_url
            
        await db.commit()
        await db.refresh(interview)

        meeting_link_persisted = bool(interview.meeting_link)

        logger.info(
            f"Google Calendar automation completed: calendar_event_created=True, "
            f"event_id={event_id}, "
            f"conferenceData_present={cal_res.get('conferenceData_present', False)}, "
            f"conference_creation_status='{cal_res.get('conference_creation_status', 'N/A')}', "
            f"video_entry_point_present={cal_res.get('video_entry_point_present', False)}, "
            f"meeting_link_persisted={meeting_link_persisted}"
        )
        return {
            "success": True,
            "google_calendar_created": True,
            "event_id": event_id,
            "meet_url": meet_url,
            "event_url": event_url,
            "meeting_link_persisted": meeting_link_persisted
        }
    else:
        logger.info(
            f"Google Calendar automation skipped/failed: message='{cal_res.get('message')}', "
            f"meeting_link_persisted={bool(interview.meeting_link)}"
        )
        return {
            "success": False,
            "google_calendar_created": False,
            "message": cal_res.get("message", "Google Calendar not connected"),
            "meet_url": None,
            "meeting_link_persisted": bool(interview.meeting_link)
        }


async def update_google_calendar_automation(
    user_id: int,
    interview: Interview,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Update existing Google Calendar event on reschedule without creating duplicate events.
    """
    if not interview.google_calendar_event_id:
        return await process_google_calendar_automation(user_id, interview, db)

    from services.google_calendar_service import GoogleCalendarService
    
    cal_res = await GoogleCalendarService.update_calendar_event(
        user_id, interview.google_calendar_event_id, interview, db
    )
    if cal_res.get("success"):
        meet_url = cal_res.get("meet_url")
        if meet_url:
            interview.meeting_link = meet_url
            await db.commit()
            await db.refresh(interview)
        return cal_res
    return cal_res


async def delete_google_calendar_automation(
    user_id: int,
    google_calendar_event_id: str,
    db: AsyncSession
) -> Dict[str, Any]:
    """Delete Google Calendar event on interview cancellation."""
    if not google_calendar_event_id:
        return {"success": True}
    from services.google_calendar_service import GoogleCalendarService
    return await GoogleCalendarService.delete_calendar_event(user_id, google_calendar_event_id, db)


# ---------------------------------------------------------------------------
# 2. Calendar (.ics) Invitation Generation
# ---------------------------------------------------------------------------

def generate_ics_content(interview: Interview, duration_minutes: int = 45) -> str:
    """Generate a valid RFC 5545 .ics iCalendar file content string."""
    dt_start = parse_interview_datetime(interview.interview_date, interview.interview_time)
    if not dt_start:
        dt_start = datetime.utcnow() + timedelta(days=1)

    dt_end = dt_start + timedelta(minutes=duration_minutes)

    fmt = "%Y%m%dT%H%M%SZ"
    start_str = dt_start.strftime(fmt)
    end_str = dt_end.strftime(fmt)
    stamp_str = datetime.utcnow().strftime(fmt)
    uid = f"interview-{interview.id}-{int(datetime.utcnow().timestamp())}@saadhyam.ai"

    summary = f"Interview: {interview.job_role} - {interview.candidate_name}"
    meeting_url = interview.meeting_link or ""
    description = (
        f"Scheduled Interview with {interview.interviewer_name}\\n"
        f"Position: {interview.job_role}\\n"
        f"Candidate: {interview.candidate_name}\\n"
        f"Meeting Link: {meeting_url or 'N/A'}\\n\\n"
        f"Please join using the meeting link at the scheduled time."
    )

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Saadhyam AI//Interview Scheduler//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{stamp_str}",
        f"DTSTART:{start_str}",
        f"DTEND:{end_str}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        f"LOCATION:{meeting_url or 'Online Meeting'}",
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
        "BEGIN:VALARM",
        "TRIGGER:-PT10M",
        "ACTION:DISPLAY",
        f"DESCRIPTION:Reminder: Interview for {interview.job_role} in 10 minutes",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    return "\r\n".join(ics_lines)


def generate_ics_cancellation_content(interview: Interview, duration_minutes: int = 45) -> str:
    """Generate a valid RFC 5545 CANCEL .ics iCalendar file content string."""
    dt_start = parse_interview_datetime(interview.interview_date, interview.interview_time)
    if not dt_start:
        dt_start = datetime.utcnow() + timedelta(days=1)

    dt_end = dt_start + timedelta(minutes=duration_minutes)

    fmt = "%Y%m%dT%H%M%SZ"
    start_str = dt_start.strftime(fmt)
    end_str = dt_end.strftime(fmt)
    stamp_str = datetime.utcnow().strftime(fmt)
    uid = f"interview-{interview.id}-{int(datetime.utcnow().timestamp())}@saadhyam.ai"

    summary = f"CANCELLED: Interview: {interview.job_role} - {interview.candidate_name}"
    description = (
        f"This interview has been CANCELLED.\\n"
        f"Position: {interview.job_role}\\n"
        f"Candidate: {interview.candidate_name}\\n"
        f"Interviewer: {interview.interviewer_name}"
    )

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Saadhyam AI//Interview Scheduler//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:CANCEL",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{stamp_str}",
        f"DTSTART:{start_str}",
        f"DTEND:{end_str}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        "STATUS:CANCELLED",
        "SEQUENCE:1",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    return "\r\n".join(ics_lines)



# ---------------------------------------------------------------------------
# 3. SMTP Config Helper
# ---------------------------------------------------------------------------

async def get_user_smtp_config(db: AsyncSession, user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch user's configured SMTP credentials from sales_email_marketing plugin."""
    try:
        stmt = select(Plugin).where(Plugin.plugin_key == "sales_email_marketing")
        res = await db.execute(stmt)
        plugin = res.scalars().first()
        if not plugin:
            return None

        stmt2 = select(UserPlugin).where(
            and_(UserPlugin.user_id == user_id, UserPlugin.plugin_id == plugin.id)
        )
        res2 = await db.execute(stmt2)
        user_plugin = res2.scalars().first()

        if user_plugin and user_plugin.user_config:
            config = user_plugin.user_config
            if config.get("smtp_host") and config.get("sender_email") and config.get("password_or_api_key"):
                return config

        return None
    except Exception as e:
        logger.error(f"Failed to fetch SMTP config for user {user_id}: {e}")
        return None


# ---------------------------------------------------------------------------
# 4. Confirmation Email Dispatch
# ---------------------------------------------------------------------------

async def send_interview_confirmation_email(
    user_id: int,
    interview_id: int,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Send an automatic confirmation email with attached .ics calendar invitation
    to the candidate after scheduling.
    """
    try:
        res = await db.execute(
            select(Interview).where(Interview.id == interview_id, Interview.user_id == user_id)
        )
        interview = res.scalars().first()
        if not interview:
            return {"success": False, "message": "Interview not found"}

        if not interview.candidate_email:
            logger.info(f"No candidate email provided for interview {interview_id}. Skipping confirmation email.")
            return {"success": False, "message": "Candidate email missing"}

        smtp_config = await get_user_smtp_config(db, user_id)
        if not smtp_config:
            logger.warning(f"SMTP configuration not found for user {user_id}. Confirmation email skipped.")
            return {"success": False, "message": "Email plugin not configured"}

        host = smtp_config.get("smtp_host")
        port = int(smtp_config.get("smtp_port", 587))
        sender_email = smtp_config.get("sender_email")
        password = smtp_config.get("password_or_api_key")
        sender_name = smtp_config.get("sender_name") or "Saadhyam Interview Team"

        subject = f"Interview Confirmed – {interview.job_role}"
        meeting_link = interview.meeting_link or ""

        body_text = f"""Hi {interview.candidate_name},

Your interview has been successfully scheduled.

Role: {interview.job_role}
Interviewer: {interview.interviewer_name}
Date: {interview.interview_date}
Time: {interview.interview_time}

Meeting Link:
{meeting_link or 'N/A'}

Please join using the meeting link at the scheduled time. A calendar invitation (.ics) is attached to this email.

Regards,
Saadhyam Team"""

        if meeting_link:
            meeting_btn_html = f'''<div style="margin: 25px 0;">
      <a href="{meeting_link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Meeting</a>
    </div>
    <p style="font-size: 14px; color: #64748b;">Direct link: <a href="{meeting_link}">{meeting_link}</a></p>'''
        else:
            meeting_btn_html = '''<p style="font-size: 14px; color: #64748b;"><em>Note: Video meeting link pending or not connected.</em></p>'''

        body_html = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #2563eb; margin-top: 0;">📅 Interview Confirmed</h2>
    <p>Hi <strong>{interview.candidate_name}</strong>,</p>
    <p>Your interview for the <strong>{interview.job_role}</strong> position has been successfully scheduled.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 6px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Role:</td><td style="padding: 10px;">{interview.job_role}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Interviewer:</td><td style="padding: 10px;">{interview.interviewer_name}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Date:</td><td style="padding: 10px;">{interview.interview_date}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Time:</td><td style="padding: 10px;">{interview.interview_time}</td></tr>
    </table>
    
    {meeting_btn_html}
    
    <p style="font-size: 13px; color: #64748b; margin-top: 30px;">A calendar invitation (.ics) is attached to add this event to your Google, Outlook, or Apple calendar.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
    <p style="font-size: 12px; color: #94a3b8;">Regards,<br /><strong>Saadhyam AI Team</strong></p>
  </div>
</body>
</html>"""

        ics_content = generate_ics_content(interview)

        def sync_send_email():
            server = None
            try:
                msg = MIMEMultipart("mixed")
                msg["From"] = f"{sender_name} <{sender_email}>"
                msg["To"] = interview.candidate_email
                msg["Subject"] = subject

                alt_part = MIMEMultipart("alternative")
                alt_part.attach(MIMEText(body_text, "plain", "utf-8"))
                alt_part.attach(MIMEText(body_html, "html", "utf-8"))
                msg.attach(alt_part)

                # Attach .ics calendar file
                ics_part = MIMEBase("text", "calendar", method="REQUEST", name="interview_invitation.ics")
                ics_part.set_payload(ics_content.encode("utf-8"))
                encoders.encode_base64(ics_part)
                ics_part.add_header("Content-Disposition", "attachment", filename="interview_invitation.ics")
                msg.attach(ics_part)

                if port == 465:
                    server = smtplib.SMTP_SSL(host, port, timeout=15)
                else:
                    server = smtplib.SMTP(host, port, timeout=15)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()

                server.login(sender_email, password)
                server.sendmail(sender_email, [interview.candidate_email], msg.as_string())
                return {"success": True}
            except Exception as smtp_err:
                logger.error(f"Confirmation email SMTP failed: {smtp_err}")
                return {"success": False, "message": str(smtp_err)}
            finally:
                if server:
                    try:
                        server.quit()
                    except Exception:
                        pass

        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(None, sync_send_email)

        if res.get("success"):
            interview.confirmation_sent = True
            await db.commit()
            logger.info(f"✅ Confirmation email sent to candidate '{interview.candidate_email}' for interview ID {interview_id}")
            return {"success": True, "message": "Confirmation email sent"}
        else:
            logger.warning(f"⚠️ Confirmation email delivery failed for interview ID {interview_id}: {res.get('message')}")
            return {"success": False, "message": res.get("message")}

    except Exception as e:
        logger.error(f"Error in send_interview_confirmation_email: {e}", exc_info=True)
        return {"success": False, "message": str(e)}


async def send_interview_cancellation_email(
    user_id: int,
    interview_or_id: Any,
    db: AsyncSession
) -> Dict[str, Any]:
    """
    Send an automatic cancellation email with attached cancellation .ics calendar invitation
    to the candidate after an interview is cancelled.
    Email failure does NOT undo the cancellation.
    """
    try:
        if isinstance(interview_or_id, int):
            res = await db.execute(
                select(Interview).where(Interview.id == interview_or_id, Interview.user_id == user_id)
            )
            interview = res.scalars().first()
        else:
            interview = interview_or_id

        if not interview:
            logger.warning(f"Interview record missing for cancellation email. Skipping.")
            return {"success": False, "message": "Interview not found"}

        candidate_email = interview.candidate_email
        if not candidate_email:
            logger.info(f"No candidate email provided for interview {interview.id}. Skipping cancellation email.")
            return {"success": False, "message": "Candidate email missing"}

        smtp_config = await get_user_smtp_config(db, user_id)
        if not smtp_config:
            logger.warning(f"SMTP configuration not found for user {user_id}. Cancellation email skipped.")
            return {"success": False, "message": "Email plugin not configured"}

        host = smtp_config.get("smtp_host")
        port = int(smtp_config.get("smtp_port", 587))
        sender_email = smtp_config.get("sender_email")
        password = smtp_config.get("password_or_api_key")
        sender_name = smtp_config.get("sender_name") or "Saadhyam Interview Team"

        subject = f"Interview CANCELLED – {interview.job_role}"

        body_text = f"""Hi {interview.candidate_name},

Please note that your interview for the position of {interview.job_role} scheduled for {interview.interview_date} at {interview.interview_time} with {interview.interviewer_name} has been CANCELLED.

If you have any questions or would like to reschedule, please reach out to the recruiter or interviewer.

Regards,
Saadhyam Team"""

        body_html = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #dc2626; margin-top: 0;">❌ Interview Cancelled</h2>
    <p>Hi <strong>{interview.candidate_name}</strong>,</p>
    <p>Your interview for the <strong>{interview.job_role}</strong> position has been <strong style="color: #dc2626;">CANCELLED</strong>.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fef2f2; border-radius: 6px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Role:</td><td style="padding: 10px;">{interview.job_role}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Interviewer:</td><td style="padding: 10px;">{interview.interviewer_name}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Original Date:</td><td style="padding: 10px;">{interview.interview_date}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Original Time:</td><td style="padding: 10px;">{interview.interview_time}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Status:</td><td style="padding: 10px; color: #dc2626; font-weight: bold;">CANCELLED</td></tr>
    </table>
    
    <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
      <em>Note: The meeting link is no longer active. If you have questions or wish to reschedule, please contact the recruiter.</em>
    </p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
    <p style="font-size: 12px; color: #94a3b8;">Regards,<br /><strong>Saadhyam AI Team</strong></p>
  </div>
</body>
</html>"""

        ics_content = generate_ics_cancellation_content(interview)

        def sync_send_email():
            server = None
            try:
                msg = MIMEMultipart("mixed")
                msg["From"] = f"{sender_name} <{sender_email}>"
                msg["To"] = candidate_email
                msg["Subject"] = subject

                alt_part = MIMEMultipart("alternative")
                alt_part.attach(MIMEText(body_text, "plain", "utf-8"))
                alt_part.attach(MIMEText(body_html, "html", "utf-8"))
                msg.attach(alt_part)

                # Attach .ics calendar cancellation file
                ics_part = MIMEBase("text", "calendar", method="CANCEL", name="interview_cancellation.ics")
                ics_part.set_payload(ics_content.encode("utf-8"))
                encoders.encode_base64(ics_part)
                ics_part.add_header("Content-Disposition", "attachment", filename="interview_cancellation.ics")
                msg.attach(ics_part)

                if port == 465:
                    server = smtplib.SMTP_SSL(host, port, timeout=15)
                else:
                    server = smtplib.SMTP(host, port, timeout=15)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()

                server.login(sender_email, password)
                server.sendmail(sender_email, [candidate_email], msg.as_string())
                return {"success": True}
            except Exception as smtp_err:
                logger.warning(f"Cancellation email SMTP failed for candidate {candidate_email}: {smtp_err}")
                return {"success": False, "message": str(smtp_err)}
            finally:
                if server:
                    try:
                        server.quit()
                    except Exception:
                        pass

        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(None, sync_send_email)

        if res.get("success"):
            logger.info(f"Cancellation email sent to candidate {candidate_email} for interview ID {interview.id}")
            return {"success": True, "message": "Cancellation email sent"}
        else:
            logger.warning(f"Failed to send cancellation email to candidate {candidate_email} for interview ID {interview.id}: {res.get('message')}")
            return {"success": False, "message": res.get("message")}

    except Exception as e:
        logger.warning(f"Error sending cancellation email for interview ID {getattr(interview_or_id, 'id', 'unknown')}: {e}")
        return {"success": False, "message": str(e)}



# ---------------------------------------------------------------------------
# 5. Reminder Email Dispatch (10 minutes before)
# ---------------------------------------------------------------------------

async def send_interview_reminder_email(interview_id: int) -> Dict[str, Any]:
    """Send 10-minute reminder email to candidate."""
    try:
        async with AsyncSessionLocal() as db:
            res = await db.execute(
                select(Interview).where(Interview.id == interview_id)
            )
            interview = res.scalars().first()
            if not interview:
                logger.info(f"Reminder skipped: Interview {interview_id} no longer exists.")
                return {"success": False, "message": "Interview not found"}

            if interview.interview_status not in [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED]:
                logger.info(f"Reminder skipped: Interview {interview_id} status is '{interview.interview_status}'.")
                return {"success": False, "message": f"Interview status is {interview.interview_status}"}

            if interview.reminder_sent:
                logger.info(f"Reminder skipped: Reminder already sent for interview {interview_id}.")
                return {"success": True, "message": "Reminder already sent"}

            if not interview.candidate_email:
                return {"success": False, "message": "No candidate email"}

            smtp_config = await get_user_smtp_config(db, interview.user_id)
            if not smtp_config:
                logger.warning(f"Reminder skipped: No SMTP config for user {interview.user_id}")
                return {"success": False, "message": "SMTP not configured"}

            host = smtp_config.get("smtp_host")
            port = int(smtp_config.get("smtp_port", 587))
            sender_email = smtp_config.get("sender_email")
            password = smtp_config.get("password_or_api_key")
            sender_name = smtp_config.get("sender_name") or "Saadhyam Interview Team"

            subject = f"Reminder: Interview in 10 Minutes – {interview.job_role}"
            
            body_text = f"""Hi {interview.candidate_name},

This is a reminder that your interview starts in 10 minutes.

Role: {interview.job_role}
Interviewer: {interview.interviewer_name}
Time: {interview.interview_time}

Join here:
{interview.meeting_link or 'N/A'}

See you soon.

Regards,
Saadhyam Team"""

            body_html = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #d97706; margin-top: 0;">⏰ Interview Reminder (Starts in 10 Minutes)</h2>
    <p>Hi <strong>{interview.candidate_name}</strong>,</p>
    <p>This is a quick reminder that your interview for <strong>{interview.job_role}</strong> starts in 10 minutes.</p>
    
    <p><strong>Interviewer:</strong> {interview.interviewer_name}<br /><strong>Time:</strong> {interview.interview_time}</p>
    
    <div style="margin: 25px 0;">
      <a href="{interview.meeting_link}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Meeting Now</a>
    </div>
    
    <p style="font-size: 14px; color: #64748b;">Direct link: <a href="{interview.meeting_link}">{interview.meeting_link}</a></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
    <p style="font-size: 12px; color: #94a3b8;">See you soon,<br /><strong>Saadhyam AI Team</strong></p>
  </div>
</body>
</html>"""

            def sync_send_reminder():
                server = None
                try:
                    msg = MIMEMultipart("alternative")
                    msg["From"] = f"{sender_name} <{sender_email}>"
                    msg["To"] = interview.candidate_email
                    msg["Subject"] = subject

                    msg.attach(MIMEText(body_text, "plain", "utf-8"))
                    msg.attach(MIMEText(body_html, "html", "utf-8"))

                    if port == 465:
                        server = smtplib.SMTP_SSL(host, port, timeout=15)
                    else:
                        server = smtplib.SMTP(host, port, timeout=15)
                        server.ehlo()
                        server.starttls()
                        server.ehlo()

                    server.login(sender_email, password)
                    server.sendmail(sender_email, [interview.candidate_email], msg.as_string())
                    return {"success": True}
                except Exception as err:
                    logger.error(f"Reminder email SMTP failed: {err}")
                    return {"success": False, "message": str(err)}
                finally:
                    if server:
                        try:
                            server.quit()
                        except Exception:
                            pass

            loop = asyncio.get_running_loop()
            res = await loop.run_in_executor(None, sync_send_reminder)

            if res.get("success"):
                interview.reminder_sent = True
                await db.commit()
                logger.info(f"✅ 10-minute reminder email sent for interview ID {interview_id}")
                return {"success": True, "message": "Reminder sent"}
            else:
                return {"success": False, "message": res.get("message")}

    except Exception as e:
        logger.error(f"Error sending interview reminder {interview_id}: {e}")
        return {"success": False, "message": str(e)}


# ---------------------------------------------------------------------------
# 6. APScheduler Job Management (Schedule & Cancel Reminders)
# ---------------------------------------------------------------------------

def schedule_interview_reminder(interview: Interview):
    """Schedule a one-time 10-minute reminder job in APScheduler."""
    try:
        from services.scheduler import scheduler
        if not scheduler or not scheduler.running:
            logger.warning("APScheduler is not initialized/running. Reminder job not scheduled.")
            return

        dt_start = parse_interview_datetime(interview.interview_date, interview.interview_time)
        if not dt_start:
            logger.warning(f"Could not parse datetime for interview {interview.id}. Reminder not scheduled.")
            return

        reminder_time = dt_start - timedelta(minutes=10)
        job_id = f"interview_reminder_{interview.id}"

        # Sync wrapper function for APScheduler executor
        def _run_async_reminder(int_id: int):
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(send_interview_reminder_email(int_id))
                loop.close()
            except Exception as job_err:
                logger.error(f"Error running scheduled reminder for interview {int_id}: {job_err}")

        # If reminder time is in the future, schedule DateTrigger job
        if reminder_time > datetime.now():
            from apscheduler.triggers.date import DateTrigger
            scheduler.add_job(
                func=_run_async_reminder,
                trigger=DateTrigger(run_date=reminder_time),
                args=[interview.id],
                id=job_id,
                name=f"10-min reminder for Interview #{interview.id}",
                replace_existing=True,
            )
            logger.info(f"⏰ Scheduled 10-min reminder job '{job_id}' for {reminder_time.isoformat()}")
        else:
            logger.info(f"Interview {interview.id} start time ({dt_start}) is within 10 minutes or past. Interval processor will check.")

    except Exception as e:
        logger.error(f"Failed to schedule interview reminder job for interview {interview.id}: {e}")


def cancel_interview_reminder(interview_id: int):
    """Remove pending reminder job from APScheduler."""
    try:
        from services.scheduler import scheduler
        if scheduler and scheduler.running:
            job_id = f"interview_reminder_{interview_id}"
            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)
                logger.info(f"🗑️ Removed pending reminder job '{job_id}' for interview #{interview_id}")
    except Exception as e:
        logger.error(f"Failed to cancel interview reminder job for interview #{interview_id}: {e}")
