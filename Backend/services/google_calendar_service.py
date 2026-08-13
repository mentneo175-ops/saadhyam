"""
Google Calendar & Google Meet Integration Service
Handles Google OAuth 2.0 authorization, token auto-refresh, and Google Calendar API calls:
- Creating Google Calendar events with real Google Meet conference links
- Updating existing events on reschedule (without duplicating events)
- Deleting calendar events on cancellation
"""

import logging
import os
import uuid
import httpx
import asyncio
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from config.settings import settings
from config.database import AsyncSessionLocal
from models.user_api_keys import UserAPIKeys
from models.interview_scheduler import Interview
from services.encryption_service import get_encryption_service
from services.interview_automation_service import parse_interview_datetime

logger = logging.getLogger(__name__)
encryption_service = get_encryption_service()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"
GOOGLE_CALENDAR_SCOPES = "https://www.googleapis.com/auth/calendar"


class GoogleCalendarService:
    """Service for interacting with Google Calendar API and Google Meet creation."""

    @staticmethod
    def generate_oauth_state(user_id: int) -> str:
        """Generate a signed, short-lived (10 min) JWT state token containing user_id."""
        payload = {
            "user_id": user_id,
            "purpose": "google_calendar_oauth",
            "exp": datetime.utcnow() + timedelta(minutes=10),
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def verify_oauth_state(state: str) -> Optional[int]:
        """Verify signed OAuth state token and return user_id if valid."""
        if not state:
            return None
        try:
            payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("purpose") != "google_calendar_oauth":
                logger.warning("Invalid OAuth state purpose")
                return None
            return payload.get("user_id")
        except JWTError as e:
            logger.warning(f"OAuth state verification failed: {e}")
            return None

    @staticmethod
    def get_client_credentials() -> tuple[str, str]:
        """Fetch Google OAuth Client ID and Secret from settings/env/client_secret.json."""
        client_id = (
            os.getenv("GOOGLE_CLIENT_ID")
            or os.getenv("GOOGLE_CALENDAR_CLIENT_ID")
            or getattr(settings, "GOOGLE_CLIENT_ID", "")
            or getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "")
            or getattr(settings, "YOUTUBE_CLIENT_ID", "")
        ).strip()
        client_secret = (
            os.getenv("GOOGLE_CLIENT_SECRET")
            or os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET")
            or getattr(settings, "GOOGLE_CLIENT_SECRET", "")
            or getattr(settings, "GOOGLE_CALENDAR_CLIENT_SECRET", "")
            or getattr(settings, "YOUTUBE_CLIENT_SECRET", "")
        ).strip()

        if not client_id or not client_secret:
            try:
                from pathlib import Path
                cs_path = Path(__file__).resolve().parents[1] / "client_secret.json"
                if cs_path.exists():
                    import json
                    with open(cs_path, "r", encoding="utf-8") as f:
                        cs_data = json.load(f)
                    info = cs_data.get("installed") or cs_data.get("web") or {}
                    if not client_id:
                        client_id = (info.get("client_id") or "").strip()
                    if not client_secret:
                        client_secret = (info.get("client_secret") or "").strip()
            except Exception as e:
                logger.warning(f"Error checking client_secret.json fallback: {e}")

        return client_id, client_secret

    @staticmethod
    def get_default_redirect_uri() -> str:
        """Fetch canonical Google OAuth callback URI from settings/env."""
        redirect_uri = (
            os.getenv("GOOGLE_REDIRECT_URI")
            or os.getenv("GOOGLE_CALENDAR_REDIRECT_URI")
            or getattr(settings, "GOOGLE_REDIRECT_URI", "")
            or getattr(settings, "GOOGLE_CALENDAR_REDIRECT_URI", "")
            or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')}/api/interview-scheduler/google-calendar/callback"
        )
        return redirect_uri.strip()

    @staticmethod
    def get_auth_url(redirect_uri: Optional[str] = None, state: Optional[str] = None) -> str:
        """Generate Google OAuth 2.0 URL for Google Calendar access."""
        client_id, _ = GoogleCalendarService.get_client_credentials()
        target_redirect = redirect_uri.strip() if redirect_uri else GoogleCalendarService.get_default_redirect_uri()

        if not client_id:
            logger.error("Google Calendar OAuth is not configured: GOOGLE_CLIENT_ID is missing.")
            raise ValueError("Google Calendar OAuth is not configured: GOOGLE_CLIENT_ID is missing.")

        params = {
            "client_id": client_id,
            "redirect_uri": target_redirect,
            "response_type": "code",
            "scope": GOOGLE_CALENDAR_SCOPES,
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state

        query_str = urllib.parse.urlencode(params)
        auth_url = f"{GOOGLE_AUTH_URL}?{query_str}"

        # SAFE diagnostics logged immediately before returning the OAuth URL
        logger.info(
            f"Google OAuth URL generated: client_id_present={bool(client_id)}, "
            f"client_id_length={len(client_id)}, "
            f"redirect_uri={target_redirect}, "
            f"scope={GOOGLE_CALENDAR_SCOPES}"
        )
        return auth_url


    @staticmethod
    async def exchange_code(
        code: str,
        redirect_uri: Optional[str],
        user_id: int,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens."""
        client_id, client_secret = GoogleCalendarService.get_client_credentials()
        target_redirect = redirect_uri.strip() if redirect_uri else GoogleCalendarService.get_default_redirect_uri()

        # Safe diagnostic logging
        logger.info(f"OAuth callback reached: yes, code_received={bool(code)}, redirect_uri={target_redirect}")

        if not client_id or not client_secret:
            logger.error("Token exchange failed: Google OAuth credentials not configured")
            return {"success": False, "error": "Google OAuth client credentials not configured"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": target_redirect,
                        "grant_type": "authorization_code",
                    },
                )
                if res.status_code != 200:
                    logger.error(f"Google token exchange failed with status {res.status_code}")
                    return {"success": False, "error": "Token exchange failed with Google OAuth server"}

                data = res.json()
                access_token = data.get("access_token")
                refresh_token = data.get("refresh_token")
                expires_in = data.get("expires_in", 3600)

                # Save or update UserAPIKeys
                stmt = select(UserAPIKeys).where(
                    UserAPIKeys.user_id == user_id,
                    UserAPIKeys.platform == "google_calendar"
                )
                result = await db.execute(stmt)
                record = result.scalar_one_or_none()

                enc_access = encryption_service.encrypt(access_token) if access_token else None
                enc_refresh = encryption_service.encrypt(refresh_token) if refresh_token else (record.refresh_token if record else None)
                enc_client_id = encryption_service.encrypt(client_id)
                enc_client_secret = encryption_service.encrypt(client_secret)

                expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

                if record:
                    record.access_token = enc_access
                    if refresh_token:
                        record.refresh_token = enc_refresh
                    record.client_id = enc_client_id
                    record.client_secret = enc_client_secret
                    record.is_active = True
                    record.is_verified = True
                    record.last_verified_at = datetime.utcnow()
                    record.config = {"expires_at": expires_at.isoformat()}
                else:
                    record = UserAPIKeys(
                        user_id=user_id,
                        platform="google_calendar",
                        client_id=enc_client_id,
                        client_secret=enc_client_secret,
                        access_token=enc_access,
                        refresh_token=enc_refresh,
                        is_active=True,
                        is_verified=True,
                        last_verified_at=datetime.utcnow(),
                        config={"expires_at": expires_at.isoformat()}
                    )
                    db.add(record)

                await db.commit()
                logger.info(f"✅ Token exchange success: User {user_id} connected Google Calendar")
                return {"success": True, "message": "Google Calendar connected successfully"}

        except Exception as e:
            logger.error(f"Error in exchange_code: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    @staticmethod
    async def get_valid_access_token(user_id: int, db: AsyncSession) -> Optional[str]:
        """Fetch active access token for user, automatically refreshing if expired."""
        try:
            stmt = select(UserAPIKeys).where(
                UserAPIKeys.user_id == user_id,
                UserAPIKeys.platform == "google_calendar",
                UserAPIKeys.is_active == True
            )
            result = await db.execute(stmt)
            record = result.scalar_one_or_none()
            if not record or not record.access_token:
                return None

            raw_access = encryption_service.decrypt(record.access_token)
            raw_refresh = encryption_service.decrypt(record.refresh_token) if record.refresh_token else None
            raw_client_id = encryption_service.decrypt(record.client_id) if record.client_id else None
            raw_client_secret = encryption_service.decrypt(record.client_secret) if record.client_secret else None

            if not raw_client_id or not raw_client_secret:
                raw_client_id, raw_client_secret = GoogleCalendarService.get_client_credentials()

            # Check expiration
            expires_at = None
            if record.config and isinstance(record.config, dict) and "expires_at" in record.config:
                try:
                    expires_at = datetime.fromisoformat(record.config["expires_at"])
                except Exception:
                    pass

            # If token is still valid (with 5-minute margin), return it
            if expires_at and expires_at > (datetime.utcnow() + timedelta(minutes=5)):
                return raw_access

            # Refresh token if expired
            if not raw_refresh or not raw_client_id or not raw_client_secret:
                return raw_access  # Return existing as fallback

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": raw_refresh,
                        "client_id": raw_client_id,
                        "client_secret": raw_client_secret,
                    },
                )
                if res.status_code == 200:
                    new_data = res.json()
                    new_access = new_data.get("access_token")
                    expires_in = new_data.get("expires_in", 3600)
                    if new_access:
                        record.access_token = encryption_service.encrypt(new_access)
                        record.config = {"expires_at": (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()}
                        await db.commit()
                        logger.info(f"🔄 Auto-refreshed Google Calendar access token for user {user_id}")
                        return new_access
                else:
                    logger.warning(f"Failed to refresh Google Calendar token: {res.text}")

            return raw_access
        except Exception as e:
            logger.error(f"Error fetching valid access token for user {user_id}: {e}")
            return None

    @staticmethod
    def extract_meet_url(res_data: Dict[str, Any]) -> tuple[Optional[str], bool, str]:
        """
        Extract Google Meet URL from event payload.
        Returns (meet_url, conferenceData_present, conference_creation_status).
        """
        conf_data = res_data.get("conferenceData") or {}
        conf_present = bool(conf_data)
        
        status_obj = conf_data.get("createRequest", {}).get("status", {})
        creation_status = status_obj.get("statusCode") or "unknown"

        meet_url = None
        entry_points = conf_data.get("entryPoints") or []
        for ep in entry_points:
            if ep.get("entryPointType") == "video":
                uri = ep.get("uri") or ""
                if uri.startswith("https://meet.google.com") or uri.startswith("https://"):
                    meet_url = uri
                    break

        if not meet_url:
            hangout = res_data.get("hangoutLink") or ""
            if hangout.startswith("https://meet.google.com") or hangout.startswith("https://"):
                meet_url = hangout

        return meet_url, conf_present, creation_status

    @staticmethod
    async def create_calendar_event(
        user_id: int,
        interview: Interview,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Create a real Google Calendar Event with automatic Google Meet creation.
        Returns real Google Meet URL and Google Calendar Event ID.
        """
        access_token = await GoogleCalendarService.get_valid_access_token(user_id, db)
        if not access_token:
            logger.info(f"User {user_id} has not connected Google Calendar. Event creation skipped.")
            return {"success": False, "message": "Google Calendar not connected"}

        dt_start = parse_interview_datetime(interview.interview_date, interview.interview_time)
        if not dt_start:
            dt_start = datetime.utcnow() + timedelta(days=1)

        dt_end = dt_start + timedelta(minutes=45)

        event_payload = {
            "summary": f"Interview – {interview.candidate_name} – {interview.job_role}",
            "description": (
                f"Candidate: {interview.candidate_name}\n"
                f"Candidate Email: {interview.candidate_email or 'N/A'}\n"
                f"Position: {interview.job_role}\n"
                f"Interviewer: {interview.interviewer_name}\n"
                f"Notes: {interview.notes or 'None'}\n\n"
                "Scheduled via Saadhyam AI HR Interview Scheduler"
            ),
            "start": {
                "dateTime": dt_start.strftime("%Y-%m-%dT%H:%M:%S"),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": dt_end.strftime("%Y-%m-%dT%H:%M:%S"),
                "timeZone": "Asia/Kolkata",
            },
            "attendees": [{"email": interview.candidate_email}] if interview.candidate_email else [],
            "conferenceData": {
                "createRequest": {
                    "requestId": f"saadhyam-{interview.id}-{uuid.uuid4().hex[:8]}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            },
            "reminders": {
                "useDefault": False,
                "overrides": [{"method": "email", "minutes": 10}, {"method": "popup", "minutes": 10}]
            }
        }

        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?conferenceDataVersion=1",
                    headers=headers,
                    json=event_payload
                )

                if res.status_code in [200, 201]:
                    res_data = res.json()
                    event_id = res_data.get("id")
                    html_link = res_data.get("htmlLink")

                    meet_url, conf_present, creation_status = GoogleCalendarService.extract_meet_url(res_data)

                    # Bounded retries: if Google Meet entryPoint is pending, poll up to 5 retries (1.0s interval)
                    if not meet_url and event_id:
                        logger.info(f"Google Meet URL pending (status={creation_status}) for event ID={event_id}, polling...")
                        for attempt in range(5):
                            await asyncio.sleep(1.0)
                            poll_res = await client.get(
                                f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{event_id}?conferenceDataVersion=1",
                                headers=headers
                            )
                            if poll_res.status_code == 200:
                                poll_data = poll_res.json()
                                meet_url, conf_present, creation_status = GoogleCalendarService.extract_meet_url(poll_data)
                                if meet_url:
                                    logger.info(f"✅ Google Meet URL resolved on poll attempt {attempt+1}: {meet_url}")
                                    break

                    video_ep_present = bool(meet_url)

                    # SAFE diagnostic logs (no secrets or tokens)
                    logger.info(
                        f"Google Calendar event processed: calendar_event_created={bool(event_id)}, "
                        f"event_id={event_id}, conferenceData_present={conf_present}, "
                        f"conference_creation_status={creation_status}, "
                        f"video_entry_point_present={video_ep_present}"
                    )

                    return {
                        "success": True,
                        "event_id": event_id,
                        "meet_url": meet_url,
                        "event_url": html_link,
                        "conferenceData_present": conf_present,
                        "conference_creation_status": creation_status,
                        "video_entry_point_present": video_ep_present
                    }

                else:
                    logger.error(f"Google Calendar API failed ({res.status_code}): {res.text}")
                    return {"success": False, "message": f"Google Calendar API error: {res.text}"}


        except Exception as e:
            logger.error(f"Exception calling Google Calendar API: {e}", exc_info=True)
            return {"success": False, "message": str(e)}

    @staticmethod
    async def update_calendar_event(
        user_id: int,
        event_id: str,
        interview: Interview,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Update existing Google Calendar Event on reschedule without creating duplicate events."""
        if not event_id:
            return {"success": False, "message": "No Google Calendar event ID"}

        access_token = await GoogleCalendarService.get_valid_access_token(user_id, db)
        if not access_token:
            return {"success": False, "message": "Google Calendar not connected"}

        dt_start = parse_interview_datetime(interview.interview_date, interview.interview_time)
        if not dt_start:
            dt_start = datetime.utcnow() + timedelta(days=1)

        dt_end = dt_start + timedelta(minutes=45)

        patch_payload = {
            "summary": f"Interview – {interview.candidate_name} – {interview.job_role}",
            "description": (
                f"Candidate: {interview.candidate_name}\n"
                f"Candidate Email: {interview.candidate_email or 'N/A'}\n"
                f"Position: {interview.job_role}\n"
                f"Interviewer: {interview.interviewer_name}\n"
                f"Notes: {interview.notes or 'None'}\n\n"
                "Rescheduled via Saadhyam AI HR Interview Scheduler"
            ),
            "start": {
                "dateTime": dt_start.strftime("%Y-%m-%dT%H:%M:%S"),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": dt_end.strftime("%Y-%m-%dT%H:%M:%S"),
                "timeZone": "Asia/Kolkata",
            },
            "attendees": [{"email": interview.candidate_email}] if interview.candidate_email else []
        }

        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.patch(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{event_id}?conferenceDataVersion=1",
                    headers=headers,
                    json=patch_payload
                )
                if res.status_code in [200, 201]:
                    res_data = res.json()
                    meet_url = None
                    conf_data = res_data.get("conferenceData", {})
                    entry_points = conf_data.get("entryPoints", [])
                    for ep in entry_points:
                        if ep.get("entryPointType") == "video" and ep.get("uri"):
                            meet_url = ep.get("uri")
                            break
                    if not meet_url:
                        meet_url = res_data.get("hangoutLink") or interview.meeting_link

                    logger.info(f"✅ Updated existing Google Calendar Event ID={event_id}")
                    return {"success": True, "event_id": event_id, "meet_url": meet_url}
                else:
                    logger.error(f"Google Calendar event update failed ({res.status_code}): {res.text}")
                    return {"success": False, "message": f"Update failed: {res.text}"}
        except Exception as e:
            logger.error(f"Exception updating Google Calendar event {event_id}: {e}")
            return {"success": False, "message": str(e)}

    @staticmethod
    async def delete_calendar_event(
        user_id: int,
        event_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Delete Google Calendar event when interview is cancelled."""
        if not event_id:
            return {"success": True}

        access_token = await GoogleCalendarService.get_valid_access_token(user_id, db)
        if not access_token:
            return {"success": False, "message": "Google Calendar not connected"}

        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.delete(
                    f"{GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/{event_id}",
                    headers=headers
                )
                if res.status_code in [200, 204, 410]:
                    logger.info(f"🗑️ Deleted Google Calendar Event ID={event_id}")
                    return {"success": True}
                else:
                    logger.warning(f"Failed to delete Google Calendar event {event_id}: {res.text}")
                    return {"success": False, "message": res.text}
        except Exception as e:
            logger.error(f"Exception deleting Google Calendar event {event_id}: {e}")
            return {"success": False, "message": str(e)}
