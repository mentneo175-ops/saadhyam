import logging
import requests
from requests.auth import HTTPBasicAuth
from config.settings import settings

logger = logging.getLogger(__name__)

class ExotelService:
    """Service to interact with Exotel REST APIs for Outbound Calling"""

    def __init__(self):
        self.sid = settings.EXOTEL_SID
        self.api_key = settings.EXOTEL_API_KEY
        self.api_token = settings.EXOTEL_API_TOKEN
        self.exophone = settings.EXOPHONE_NUMBER
        self.stream_url_base = settings.EXOTEL_STREAM_URL or settings.BACKEND_URL

    def get_websocket_stream_url(self, call_id: int) -> str:
        """Construct the websocket stream URL for Exotel AgentStream"""
        base = self.stream_url_base.strip()
        
        # Strip trailing slash
        if base.endswith("/"):
            base = base[:-1]
            
        # Convert http(s) to ws(s)
        if base.startswith("https://"):
            base = base.replace("https://", "wss://")
        elif base.startswith("http://"):
            base = base.replace("http://", "ws://")
        elif not base.startswith("ws://") and not base.startswith("wss://"):
            base = f"wss://{base}"
            
        return f"{base}/api/voice-agent/stream/{call_id}"

    def trigger_outbound_call(self, customer_phone: str, call_id: int) -> dict:
        """
        Trigger an outbound call using Exotel's Call Connect API with bidirectional stream.
        """
        if not self.sid or not self.api_key or not self.api_token or not self.exophone:
            logger.error("❌ Exotel credentials or Exophone number not configured in settings")
            return {"success": False, "message": "Exotel is not configured in settings"}

        # Format number (Exotel prefers numbers to be E.164. For India, we can format prefix if needed)
        phone = customer_phone.strip()
        if not phone.startswith("+") and not phone.startswith("0"):
            # If 10 digits, add +91 for Indian numbers as default
            if len(phone) == 10:
                phone = f"+91{phone}"

        # Clean Caller ID (remove hyphens, spaces if present)
        caller_id = self.exophone.replace("-", "").replace(" ", "").strip()

        # Try global cluster first since these credentials are hosted there
        url = f"https://api.exotel.com/v1/Accounts/{self.sid}/Calls/connect.json"
        
        # Construct the WebSocket endpoint
        stream_url = self.get_websocket_stream_url(call_id)
        
        payload = {
            "From": phone,
            "To": caller_id,
            "CallerId": caller_id,
            "streamurl": stream_url,
            "streamtype": "bidirectional",
            "CallType": "trans",
            "Record": "true",
            "StatusCallback": f"{self.stream_url_base.rstrip('/')}/api/voice-agent/webhooks/exotel-status"
        }

        logger.info(f"📞 Exotel Outbound Call connect triggering: {phone} -> ExoPhone: {caller_id}")
        logger.info(f"🔗 streamurl: {stream_url}")

        try:
            auth = HTTPBasicAuth(self.api_key, self.api_token)
            response = requests.post(url, data=payload, auth=auth, timeout=10)
            
            # Fallback to Mumbai cluster if global cluster fails with auth/not found error
            if response.status_code in [401, 404]:
                mumbai_url = f"https://api.in.exotel.com/v1/Accounts/{self.sid}/Calls/connect.json"
                logger.info(f"🔄 Global cluster returned {response.status_code}, falling back to Mumbai cluster: {mumbai_url}")
                response = requests.post(mumbai_url, data=payload, auth=auth, timeout=10)

            if response.status_code in [200, 201]:
                data = response.json()
                # Exotel returns a Call object inside response
                call_data = data.get("Call", {})
                sid = call_data.get("Sid")
                logger.info(f"✅ Exotel outbound call queued successfully. Exotel Call SID: {sid}")
                return {
                    "success": True,
                    "exotel_call_sid": sid,
                    "status": call_data.get("Status"),
                    "data": call_data
                }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"❌ Exotel Connect API call failed: {error_msg}")
                return {"success": False, "message": error_msg}

        except Exception as e:
            logger.error(f"❌ Exception triggering Exotel call: {e}")
            return {"success": False, "message": str(e)}

exotel_service = ExotelService()
