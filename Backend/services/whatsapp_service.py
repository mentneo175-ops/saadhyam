"""
WhatsApp Cloud API Service
Handles all interactions with Meta WhatsApp Cloud API
"""

import logging
import os
import httpx
import hmac
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class WhatsAppCloudAPIService:
    """Service for interacting with Meta WhatsApp Cloud API"""
    
    def __init__(self):
        self.api_version = os.getenv("WHATSAPP_API_VERSION", "v21.0")
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        
    async def send_text_message(
        self,
        phone_number_id: str,
        access_token: str,
        to: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Send a text message via WhatsApp Cloud API
        
        Args:
            phone_number_id: WhatsApp Business Phone Number ID
            access_token: Access token for the WhatsApp Business Account
            to: Recipient phone number (with country code, no + sign)
            message: Message text to send
            
        Returns:
            Dict containing success status and message ID or error
        """
        try:
            url = f"{self.base_url}/{phone_number_id}/messages"
            
            # Log request details (without full token for security)
            logger.info(f"📤 Sending WhatsApp message:")
            logger.info(f"   URL: {url}")
            logger.info(f"   To: {to}")
            logger.info(f"   Message length: {len(message)} chars")
            logger.info(f"   Token: {access_token[:20]}..." if access_token else "   Token: None")
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to,
                "type": "text",
                "text": {
                    "preview_url": False,
                    "body": message
                }
            }
            
            logger.info(f"   Payload: {payload}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
            
            # Log response status
            logger.info(f"📥 Response status: {response.status_code}")
            logger.info(f"📥 Response body: {response.text}")
            
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("messages"):
                message_id = data["messages"][0]["id"]
                logger.info(f"✅ Message sent successfully: {message_id}")
                return {
                    "success": True,
                    "message_id": message_id,
                    "data": data
                }
            else:
                logger.error(f"❌ Unexpected response format: {data}")
                return {
                    "success": False,
                    "error": "Unexpected response format"
                }
                
        except httpx.RequestError as e:
            logger.error(f"❌ Failed to send message: {e}")
            error_message = str(e)
            error_details = {}
            
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_details = error_data.get("error", {})
                    error_message = error_details.get("message", str(e))
                    error_code = error_details.get("code")
                    error_type = error_details.get("type")
                    error_fbtrace_id = error_details.get("fbtrace_id")
                    
                    logger.error(f"❌ WhatsApp API Error Details:")
                    logger.error(f"   Code: {error_code}")
                    logger.error(f"   Type: {error_type}")
                    logger.error(f"   Message: {error_message}")
                    logger.error(f"   Trace ID: {error_fbtrace_id}")
                    logger.error(f"   Full response: {error_data}")
                except:
                    error_message = e.response.text or str(e)
                    logger.error(f"❌ Response text: {error_message}")
            
            return {
                "success": False,
                "error": error_message,
                "error_details": error_details
            }
    
    async def send_template_message(
        self,
        phone_number_id: str,
        access_token: str,
        to: str,
        template_name: str,
        language_code: str = "en",
        components: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Send a template message via WhatsApp Cloud API
        
        Args:
            phone_number_id: WhatsApp Business Phone Number ID
            access_token: Access token
            to: Recipient phone number
            template_name: Name of the approved template
            language_code: Template language code (default: en)
            components: Template components (parameters, buttons, etc.)
            
        Returns:
            Dict containing success status and message ID or error
        """
        try:
            url = f"{self.base_url}/{phone_number_id}/messages"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {
                        "code": language_code
                    }
                }
            }
            
            if components:
                payload["template"]["components"] = components
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("messages"):
                message_id = data["messages"][0]["id"]
                logger.info(f"✅ Template message sent: {message_id}")
                return {
                    "success": True,
                    "message_id": message_id,
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "error": "Unexpected response format"
                }
                
        except httpx.RequestError as e:
            logger.error(f"❌ Failed to send template message: {e}")
            error_message = str(e)
            
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get("error", {}).get("message", str(e))
                except:
                    error_message = e.response.text or str(e)
            
            return {
                "success": False,
                "error": error_message
            }
    
    async def send_media_message(
        self,
        phone_number_id: str,
        access_token: str,
        to: str,
        media_type: str,
        media_id: Optional[str] = None,
        media_link: Optional[str] = None,
        caption: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a media message (image, video, document, audio)
        
        Args:
            phone_number_id: WhatsApp Business Phone Number ID
            access_token: Access token
            to: Recipient phone number
            media_type: Type of media (image, video, document, audio)
            media_id: Media ID (if already uploaded)
            media_link: Direct link to media (alternative to media_id)
            caption: Optional caption for the media
            
        Returns:
            Dict containing success status and message ID or error
        """
        try:
            url = f"{self.base_url}/{phone_number_id}/messages"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            media_object = {}
            if media_id:
                media_object["id"] = media_id
            elif media_link:
                media_object["link"] = media_link
            else:
                return {
                    "success": False,
                    "error": "Either media_id or media_link must be provided"
                }
            
            if caption and media_type in ["image", "video", "document"]:
                media_object["caption"] = caption
            
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to,
                "type": media_type,
                media_type: media_object
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("messages"):
                message_id = data["messages"][0]["id"]
                logger.info(f"✅ Media message sent: {message_id}")
                return {
                    "success": True,
                    "message_id": message_id,
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "error": "Unexpected response format"
                }
                
        except httpx.RequestError as e:
            logger.error(f"❌ Failed to send media message: {e}")
            error_message = str(e)
            
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get("error", {}).get("message", str(e))
                except:
                    error_message = e.response.text or str(e)
            
            return {
                "success": False,
                "error": error_message
            }
    
    async def mark_message_as_read(
        self,
        phone_number_id: str,
        access_token: str,
        message_id: str
    ) -> Dict[str, Any]:
        """
        Mark a message as read
        
        Args:
            phone_number_id: WhatsApp Business Phone Number ID
            access_token: Access token
            message_id: WhatsApp message ID to mark as read
            
        Returns:
            Dict containing success status
        """
        try:
            url = f"{self.base_url}/{phone_number_id}/messages"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messaging_product": "whatsapp",
                "status": "read",
                "message_id": message_id
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            return {
                "success": True,
                "data": response.json()
            }
                
        except httpx.RequestError as e:
            logger.error(f"❌ Failed to mark message as read: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_business_profile(
        self,
        phone_number_id: str,
        access_token: str
    ) -> Dict[str, Any]:
        """
        Get WhatsApp Business Profile information
        
        Args:
            phone_number_id: WhatsApp Business Phone Number ID
            access_token: Access token
            
        Returns:
            Dict containing profile information or error
        """
        try:
            url = f"{self.base_url}/{phone_number_id}/whatsapp_business_profile"
            
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            params = {
                "fields": "about,address,description,email,profile_picture_url,websites,vertical"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            return {
                "success": True,
                "data": data.get("data", [{}])[0] if data.get("data") else {}
            }
                
        except httpx.RequestError as e:
            logger.error(f"❌ Failed to get business profile: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str,
        app_secret: str
    ) -> bool:
        """
        Verify webhook signature from Meta
        
        Args:
            payload: Raw request body
            signature: X-Hub-Signature-256 header value
            app_secret: App secret from Meta App Dashboard
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Remove 'sha256=' prefix if present
            if signature.startswith('sha256='):
                signature = signature[7:]
            
            # Calculate expected signature
            expected_signature = hmac.new(
                app_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(expected_signature, signature)
            
        except Exception as e:
            logger.error(f"❌ Error verifying webhook signature: {e}")
            return False


# Create singleton instance
whatsapp_service = WhatsAppCloudAPIService()
