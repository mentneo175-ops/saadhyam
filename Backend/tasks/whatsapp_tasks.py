"""
WhatsApp Celery Tasks
Background tasks for WhatsApp automation, campaigns, and follow-ups
"""

import logging
from celery import Task
from celery_worker import celery, get_db_session
from datetime import datetime, timedelta
from sqlalchemy import and_
from models.whatsapp_campaign import WhatsAppCampaign, CampaignStatus
from models.whatsapp_automation import WhatsAppAutomation, TriggerEvent, AutomationType
from models.whatsapp_message import WhatsAppMessage, MessageDirection, MessageStatus
from models.whatsapp_account import WhatsAppAccount
from services.whatsapp_campaign_service import campaign_service
from services.whatsapp_service import whatsapp_service
from services.whatsapp_ai_service import whatsapp_ai_service

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3)
def process_scheduled_campaigns(self):
    """
    Process scheduled campaigns that are ready to be sent
    Runs every 5 minutes
    """
    db = get_db_session()
    try:
        logger.info("🔄 Processing scheduled WhatsApp campaigns...")
        
        # Get campaigns scheduled for now or earlier
        campaigns = db.query(WhatsAppCampaign).filter(
            and_(
                WhatsAppCampaign.campaign_status == CampaignStatus.SCHEDULED,
                WhatsAppCampaign.scheduled_time <= datetime.utcnow()
            )
        ).all()
        
        logger.info(f"Found {len(campaigns)} campaigns ready to send")
        
        for campaign in campaigns:
            try:
                # Execute campaign
                result = campaign_service.execute_campaign(db, campaign.id)
                
                if result.get("success"):
                    logger.info(f"✅ Campaign {campaign.id} executed: {result.get('sent_count')} sent")
                else:
                    logger.error(f"❌ Campaign {campaign.id} failed: {result.get('error')}")
                    
            except Exception as e:
                logger.error(f"❌ Error executing campaign {campaign.id}: {e}", exc_info=True)
        
        return {"success": True, "processed": len(campaigns)}
        
    except Exception as e:
        logger.error(f"❌ Error processing scheduled campaigns: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
    finally:
        db.close()


@celery.task(bind=True, max_retries=3)
def process_follow_up_automations(self):
    """
    Process follow-up automations (e.g., send reminder after X days)
    Runs every 10 minutes
    """
    db = get_db_session()
    try:
        logger.info("🔄 Processing WhatsApp follow-up automations...")
        
        # Get enabled follow-up automations
        automations = db.query(WhatsAppAutomation).filter(
            and_(
                WhatsAppAutomation.is_enabled == True,
                WhatsAppAutomation.automation_type == AutomationType.FOLLOW_UP
            )
        ).all()
        
        logger.info(f"Found {len(automations)} active follow-up automations")
        
        for automation in automations:
            try:
                # Get WhatsApp account
                account = db.query(WhatsAppAccount).filter(
                    WhatsAppAccount.id == automation.account_id
                ).first()
                
                if not account or not account.is_active:
                    continue
                
                # Find conversations that need follow-up
                cutoff_time = datetime.utcnow() - timedelta(minutes=automation.delay_minutes)
                
                # Get last messages from each customer
                last_messages = db.query(WhatsAppMessage).filter(
                    and_(
                        WhatsAppMessage.account_id == account.id,
                        WhatsAppMessage.direction == MessageDirection.INCOMING,
                        WhatsAppMessage.timestamp <= cutoff_time
                    )
                ).order_by(WhatsAppMessage.timestamp.desc()).all()
                
                # Group by customer and check if follow-up needed
                customers_to_follow_up = {}
                for msg in last_messages:
                    if msg.customer_phone not in customers_to_follow_up:
                        # Check if we already sent a follow-up
                        recent_outgoing = db.query(WhatsAppMessage).filter(
                            and_(
                                WhatsAppMessage.account_id == account.id,
                                WhatsAppMessage.customer_phone == msg.customer_phone,
                                WhatsAppMessage.direction == MessageDirection.OUTGOING,
                                WhatsAppMessage.timestamp > msg.timestamp
                            )
                        ).first()
                        
                        if not recent_outgoing:
                            customers_to_follow_up[msg.customer_phone] = msg
                
                # Send follow-up messages
                for customer_phone, last_msg in customers_to_follow_up.items():
                    try:
                        # Generate message (with AI if enabled)
                        if automation.use_ai:
                            ai_result = whatsapp_ai_service.generate_reply(
                                customer_message=last_msg.message or "",
                                business_context=f"Follow-up after {automation.delay_minutes} minutes",
                                tone="friendly"
                            )
                            message_text = ai_result.get("reply") if ai_result.get("success") else automation.message_template
                        else:
                            message_text = automation.message_template
                        
                        # Send message
                        result = whatsapp_service.send_text_message(
                            phone_number_id=account.phone_number_id,
                            access_token=account.access_token,
                            to=customer_phone,
                            message=message_text
                        )
                        
                        if result.get("success"):
                            # Save message record
                            follow_up_msg = WhatsAppMessage(
                                account_id=account.id,
                                user_id=automation.user_id,
                                customer_phone=customer_phone,
                                message=message_text,
                                direction=MessageDirection.OUTGOING,
                                whatsapp_message_id=result.get("message_id"),
                                status=MessageStatus.SENT,
                                automation_id=automation.id,
                                ai_generated=automation.use_ai
                            )
                            db.add(follow_up_msg)
                            
                            # Update automation stats
                            automation.sent_count += 1
                            automation.success_count += 1
                            automation.last_triggered_at = datetime.utcnow()
                            
                            logger.info(f"✅ Sent follow-up to {customer_phone}")
                        else:
                            automation.failed_count += 1
                            logger.error(f"❌ Failed to send follow-up to {customer_phone}: {result.get('error')}")
                            
                    except Exception as e:
                        logger.error(f"❌ Error sending follow-up to {customer_phone}: {e}")
                        automation.failed_count += 1
                
                db.commit()
                
            except Exception as e:
                logger.error(f"❌ Error processing automation {automation.id}: {e}", exc_info=True)
        
        return {"success": True, "processed": len(automations)}
        
    except Exception as e:
        logger.error(f"❌ Error processing follow-up automations: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
    finally:
        db.close()


@celery.task(bind=True, max_retries=3)
def process_auto_reply(self, message_id: int):
    """
    Process auto-reply for an incoming message
    
    Args:
        message_id: WhatsApp message ID
    """
    db = get_db_session()
    try:
        logger.info(f"🔄 Processing auto-reply for message {message_id}")
        
        # Get the message
        message = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.id == message_id
        ).first()
        
        if not message or message.direction != MessageDirection.INCOMING:
            return {"success": False, "error": "Message not found or not incoming"}
        
        # Get enabled auto-reply automations for this account
        automations = db.query(WhatsAppAutomation).filter(
            and_(
                WhatsAppAutomation.account_id == message.account_id,
                WhatsAppAutomation.is_enabled == True,
                WhatsAppAutomation.automation_type == AutomationType.AUTO_REPLY
            )
        ).all()
        
        if not automations:
            return {"success": False, "error": "No auto-reply automations enabled"}
        
        # Get account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.id == message.account_id
        ).first()
        
        if not account or not account.is_active:
            return {"success": False, "error": "Account not active"}
        
        # Find matching automation (keyword match or general auto-reply)
        matched_automation = None
        for automation in automations:
            if automation.trigger_event == TriggerEvent.KEYWORD_MATCH:
                # Check if message contains any trigger keywords
                if automation.trigger_keywords and message.message:
                    message_lower = message.message.lower()
                    if any(keyword.lower() in message_lower for keyword in automation.trigger_keywords):
                        matched_automation = automation
                        break
            elif automation.trigger_event == TriggerEvent.NEW_MESSAGE:
                matched_automation = automation
                break
        
        if not matched_automation:
            return {"success": False, "error": "No matching automation found"}
        
        # Generate reply
        if matched_automation.use_ai:
            # Get conversation history
            history = db.query(WhatsAppMessage).filter(
                and_(
                    WhatsAppMessage.account_id == message.account_id,
                    WhatsAppMessage.customer_phone == message.customer_phone
                )
            ).order_by(WhatsAppMessage.timestamp.desc()).limit(10).all()
            
            conversation_history = [
                {
                    "direction": msg.direction.value,
                    "message": msg.message
                }
                for msg in reversed(history)
            ]
            
            ai_result = whatsapp_ai_service.generate_reply(
                customer_message=message.message or "",
                conversation_history=conversation_history,
                tone="professional"
            )
            
            reply_text = ai_result.get("reply") if ai_result.get("success") else matched_automation.message_template
        else:
            reply_text = matched_automation.message_template
        
        # Send reply
        result = whatsapp_service.send_text_message(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            to=message.customer_phone,
            message=reply_text
        )
        
        if result.get("success"):
            # Save reply message
            reply_msg = WhatsAppMessage(
                account_id=account.id,
                user_id=message.user_id,
                customer_phone=message.customer_phone,
                message=reply_text,
                direction=MessageDirection.OUTGOING,
                whatsapp_message_id=result.get("message_id"),
                status=MessageStatus.SENT,
                automation_id=matched_automation.id,
                ai_generated=matched_automation.use_ai
            )
            db.add(reply_msg)
            
            # Update automation stats
            matched_automation.triggered_count += 1
            matched_automation.sent_count += 1
            matched_automation.success_count += 1
            matched_automation.last_triggered_at = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"✅ Auto-reply sent to {message.customer_phone}")
            return {"success": True, "message_id": result.get("message_id")}
        else:
            matched_automation.failed_count += 1
            db.commit()
            return {"success": False, "error": result.get("error")}
        
    except Exception as e:
        logger.error(f"❌ Error processing auto-reply: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
    finally:
        db.close()


@celery.task(bind=True, max_retries=3)
def sync_message_statuses(self):
    """
    Sync message delivery/read statuses
    Runs every 30 minutes
    """
    db = get_db_session()
    try:
        logger.info("🔄 Syncing WhatsApp message statuses...")
        
        # Get messages that are sent but not delivered/read (last 24 hours)
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        messages = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.direction == MessageDirection.OUTGOING,
                WhatsAppMessage.status.in_([MessageStatus.SENT, MessageStatus.DELIVERED]),
                WhatsAppMessage.timestamp >= cutoff_time
            )
        ).all()
        
        logger.info(f"Found {len(messages)} messages to sync")
        
        # Note: Status updates come via webhook, this is just a placeholder
        # In production, you might want to poll the API for status updates
        
        return {"success": True, "synced": len(messages)}
        
    except Exception as e:
        logger.error(f"❌ Error syncing message statuses: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
    finally:
        db.close()
