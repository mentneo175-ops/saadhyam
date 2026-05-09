"""
WhatsApp Webhook Service
Processes incoming webhook events from Meta WhatsApp Cloud API
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models.whatsapp_message import WhatsAppMessage, MessageDirection, MessageType, MessageStatus
from models.whatsapp_account import WhatsAppAccount
from services.whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)


class WhatsAppWebhookService:
    """Service for processing WhatsApp webhook events"""
    
    def process_webhook_event(self, db: Session, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process incoming webhook event from WhatsApp
        
        Args:
            db: Database session
            webhook_data: Webhook payload from Meta
            
        Returns:
            Dict containing processing result
        """
        try:
            # Extract entry data
            entry = webhook_data.get("entry", [])
            if not entry:
                logger.warning("No entry data in webhook")
                return {"success": True, "message": "No entry data"}
            
            for entry_item in entry:
                changes = entry_item.get("changes", [])
                
                for change in changes:
                    value = change.get("value", {})
                    
                    # Process messages
                    if "messages" in value:
                        self._process_incoming_messages(db, value)
                    
                    # Process message status updates
                    if "statuses" in value:
                        self._process_status_updates(db, value)
            
            return {"success": True, "message": "Webhook processed"}
            
        except Exception as e:
            logger.error(f"❌ Error processing webhook: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def _process_incoming_messages(self, db: Session, value: Dict[str, Any]):
        """Process incoming messages from webhook"""
        try:
            messages = value.get("messages", [])
            metadata = value.get("metadata", {})
            phone_number_id = metadata.get("phone_number_id")
            
            if not phone_number_id:
                logger.warning("No phone_number_id in webhook metadata")
                return
            
            # Find WhatsApp account
            account = db.query(WhatsAppAccount).filter(
                WhatsAppAccount.phone_number_id == phone_number_id
            ).first()
            
            if not account:
                logger.warning(f"No account found for phone_number_id: {phone_number_id}")
                return
            
            for message_data in messages:
                self._save_incoming_message(db, account, message_data)
                
                # Mark message as read
                message_id = message_data.get("id")
                if message_id:
                    whatsapp_service.mark_message_as_read(
                        phone_number_id=phone_number_id,
                        access_token=account.access_token,
                        message_id=message_id
                    )
            
            db.commit()
            
        except Exception as e:
            logger.error(f"❌ Error processing incoming messages: {e}", exc_info=True)
            db.rollback()
    
    def _save_incoming_message(
        self,
        db: Session,
        account: WhatsAppAccount,
        message_data: Dict[str, Any]
    ):
        """Save incoming message to database"""
        try:
            message_id = message_data.get("id")
            from_number = message_data.get("from")
            timestamp = message_data.get("timestamp")
            message_type = message_data.get("type", "text")
            
            # Check if message already exists
            existing = db.query(WhatsAppMessage).filter(
                WhatsAppMessage.whatsapp_message_id == message_id
            ).first()
            
            if existing:
                logger.info(f"Message {message_id} already exists, skipping")
                return
            
            # Extract message content based on type
            message_text = None
            media_url = None
            media_id = None
            media_mime_type = None
            
            if message_type == "text":
                message_text = message_data.get("text", {}).get("body")
            elif message_type == "image":
                image_data = message_data.get("image", {})
                media_id = image_data.get("id")
                media_mime_type = image_data.get("mime_type")
                message_text = image_data.get("caption")
            elif message_type == "video":
                video_data = message_data.get("video", {})
                media_id = video_data.get("id")
                media_mime_type = video_data.get("mime_type")
                message_text = video_data.get("caption")
            elif message_type == "document":
                document_data = message_data.get("document", {})
                media_id = document_data.get("id")
                media_mime_type = document_data.get("mime_type")
                message_text = document_data.get("caption") or document_data.get("filename")
            elif message_type == "audio":
                audio_data = message_data.get("audio", {})
                media_id = audio_data.get("id")
                media_mime_type = audio_data.get("mime_type")
            
            # Get contact info
            contacts = message_data.get("contacts", [])
            customer_name = None
            if contacts:
                contact = contacts[0]
                profile = contact.get("profile", {})
                customer_name = profile.get("name")
            
            # Create message record
            new_message = WhatsAppMessage(
                account_id=account.id,
                user_id=account.user_id,
                customer_phone=from_number,
                customer_name=customer_name,
                message=message_text,
                message_type=MessageType(message_type) if message_type in [t.value for t in MessageType] else MessageType.TEXT,
                direction=MessageDirection.INCOMING,
                whatsapp_message_id=message_id,
                status=MessageStatus.DELIVERED,
                media_id=media_id,
                media_url=media_url,
                media_mime_type=media_mime_type,
                timestamp=datetime.fromtimestamp(int(timestamp)) if timestamp else datetime.utcnow()
            )
            
            db.add(new_message)
            logger.info(f"✅ Saved incoming message from {from_number}")
            
        except Exception as e:
            logger.error(f"❌ Error saving incoming message: {e}", exc_info=True)
    
    def _process_status_updates(self, db: Session, value: Dict[str, Any]):
        """Process message status updates from webhook"""
        try:
            statuses = value.get("statuses", [])
            
            for status_data in statuses:
                message_id = status_data.get("id")
                status = status_data.get("status")
                timestamp = status_data.get("timestamp")
                
                if not message_id or not status:
                    continue
                
                # Find message in database
                message = db.query(WhatsAppMessage).filter(
                    WhatsAppMessage.whatsapp_message_id == message_id
                ).first()
                
                if not message:
                    logger.warning(f"Message {message_id} not found for status update")
                    continue
                
                # Update message status
                if status == "sent":
                    message.status = MessageStatus.SENT
                elif status == "delivered":
                    message.status = MessageStatus.DELIVERED
                    message.delivered_at = datetime.fromtimestamp(int(timestamp)) if timestamp else datetime.utcnow()
                elif status == "read":
                    message.status = MessageStatus.READ
                    message.read_at = datetime.fromtimestamp(int(timestamp)) if timestamp else datetime.utcnow()
                elif status == "failed":
                    message.status = MessageStatus.FAILED
                    error = status_data.get("errors", [{}])[0]
                    message.error_message = error.get("message", "Unknown error")
                
                message.updated_at = datetime.utcnow()
                
                logger.info(f"✅ Updated message {message_id} status to {status}")
            
            db.commit()
            
        except Exception as e:
            logger.error(f"❌ Error processing status updates: {e}", exc_info=True)
            db.rollback()


# Create singleton instance
webhook_service = WhatsAppWebhookService()
