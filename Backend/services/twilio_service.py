import logging
from twilio.rest import Client
from config.settings import settings

logger = logging.getLogger(__name__)

class TwilioService:
    """Service to interact with Twilio REST APIs for Outbound Calling and Webhooks"""

    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.phone_number = settings.TWILIO_PHONE_NUMBER
        self.backend_url = settings.EXOTEL_STREAM_URL or settings.BACKEND_URL
        self._client = None

    @property
    def client(self) -> Client:
        if self._client is None:
            if not self.account_sid or not self.auth_token:
                raise ValueError("Twilio Account SID or Auth Token is not configured in settings")
            self._client = Client(self.account_sid, self.auth_token)
        return self._client

    def trigger_outbound_call(self, customer_phone: str, call_id: int) -> dict:
        """
        Trigger an outbound call using Twilio's Call API pointing to our TwiML callback endpoint.
        """
        if not self.account_sid or not self.auth_token or not self.phone_number:
            logger.error("❌ Twilio credentials or phone number not configured in settings")
            return {"success": False, "message": "Twilio is not configured in settings"}

        # Format number: ensure E.164 format (with +91 for India by default if 10 digits)
        phone = customer_phone.strip()
        if not phone.startswith("+") and not phone.startswith("0"):
            if len(phone) == 12 and phone.startswith("91"):
                phone = f"+{phone}"
            elif len(phone) == 10:
                phone = f"+91{phone}"

        # Clean from number
        from_number = self.phone_number.replace("-", "").replace(" ", "").strip()
        if not from_number.startswith("+") and not from_number.startswith("0"):
            if len(from_number) == 10:
                from_number = f"+91{from_number}"

        # TwiML URL when caller answers
        twiml_url = f"{self.backend_url.rstrip('/')}/api/voice-agent/webhooks/twilio-call-start/{call_id}"
        status_callback_url = f"{self.backend_url.rstrip('/')}/api/voice-agent/webhooks/twilio-status"

        logger.info(f"📞 Twilio Outbound Call connect triggering: {from_number} -> {phone}")
        logger.info(f"🔗 TwiML Callback URL: {twiml_url}")

        try:
            call = self.client.calls.create(
                to=phone,
                from_=from_number,
                url=twiml_url,
                status_callback=status_callback_url,
                status_callback_event=["initiated", "ringing", "answered", "completed"],
                status_callback_method="POST",
                record=True
            )
            
            logger.info(f"✅ Twilio outbound call queued successfully. Twilio Call SID: {call.sid}")
            return {
                "success": True,
                "exotel_call_sid": call.sid,  # using 'exotel_call_sid' to align with queue service schema expectations
                "status": call.status,
                "data": {"sid": call.sid, "status": call.status}
            }

        except Exception as e:
            logger.error(f"❌ Exception triggering Twilio call: {e}")
            return {"success": False, "message": str(e)}

twilio_service = TwilioService()
