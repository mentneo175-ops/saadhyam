"""
WhatsApp Webhook Routes
Handles incoming webhook events from Meta WhatsApp Cloud API
"""

import logging
import os
from fastapi import APIRouter, Request, HTTPException, Query, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from config.database import get_sync_db
from services.whatsapp_webhook_service import webhook_service
from services.whatsapp_service import whatsapp_service
from tasks.whatsapp_tasks import process_auto_reply

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp/webhook", tags=["whatsapp-webhook"])


@router.get("")
async def verify_webhook(
    mode: str = Query(alias="hub.mode"),
    token: str = Query(alias="hub.verify_token"),
    challenge: str = Query(alias="hub.challenge")
):
    """
    Webhook verification endpoint
    Meta will call this to verify the webhook URL
    """
    try:
        verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "saadhyam_whatsapp_verify_token_2024")
        
        logger.info(f"🔍 Webhook verification request: mode={mode}, token={token[:10]}...")
        
        if mode == "subscribe" and token == verify_token:
            logger.info("✅ Webhook verified successfully")
            return PlainTextResponse(content=challenge, status_code=200)
        else:
            logger.error(f"❌ Webhook verification failed: Invalid token")
            raise HTTPException(status_code=403, detail="Verification failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in webhook verification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def receive_webhook(
    request: Request,
    db: Session = Depends(get_sync_db)
):
    """
    Receive webhook events from WhatsApp
    Handles incoming messages, status updates, etc.
    """
    try:
        # Get request body
        body = await request.body()
        
        # Verify signature (important for security)
        signature = request.headers.get("X-Hub-Signature-256", "")
        app_secret = os.getenv("META_APP_SECRET")
        
        if app_secret and signature:
            is_valid = whatsapp_service.verify_webhook_signature(
                payload=body,
                signature=signature,
                app_secret=app_secret
            )
            
            if not is_valid:
                logger.error("❌ Invalid webhook signature")
                raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse JSON
        webhook_data = await request.json()
        
        logger.info(f"📨 Received webhook event: {webhook_data.get('object', 'unknown')}")
        
        # Process webhook event
        result = webhook_service.process_webhook_event(db, webhook_data)
        
        # Check if this is an incoming message that needs auto-reply
        if webhook_data.get("entry"):
            for entry in webhook_data["entry"]:
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    if "messages" in value:
                        # Get the last saved message and trigger auto-reply
                        messages = value.get("messages", [])
                        for msg_data in messages:
                            # Find the message in DB and trigger auto-reply task
                            from models.whatsapp_message import WhatsAppMessage
                            message = db.query(WhatsAppMessage).filter(
                                WhatsAppMessage.whatsapp_message_id == msg_data.get("id")
                            ).first()
                            
                            if message:
                                # Queue auto-reply task
                                process_auto_reply.delay(message.id)
        
        # Always return 200 to acknowledge receipt
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing webhook: {e}", exc_info=True)
        # Still return 200 to prevent Meta from retrying
        return {"success": False, "error": str(e)}
