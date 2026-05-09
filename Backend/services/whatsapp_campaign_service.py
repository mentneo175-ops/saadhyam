"""
WhatsApp Campaign Service
Handles campaign creation, scheduling, and execution
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models.whatsapp_campaign import WhatsAppCampaign, CampaignStatus
from models.whatsapp_message import WhatsAppMessage, MessageDirection, MessageType, MessageStatus
from models.whatsapp_account import WhatsAppAccount
from services.whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)


class WhatsAppCampaignService:
    """Service for managing WhatsApp campaigns"""
    
    def create_campaign(
        self,
        db: Session,
        user_id: int,
        account_id: int,
        title: str,
        message_content: str,
        recipient_list: List[str],
        scheduled_time: Optional[datetime] = None,
        template_name: Optional[str] = None,
        description: Optional[str] = None
    ) -> WhatsAppCampaign:
        """
        Create a new WhatsApp campaign
        
        Args:
            db: Database session
            user_id: User ID
            account_id: WhatsApp account ID
            title: Campaign title
            message_content: Message content
            recipient_list: List of phone numbers
            scheduled_time: When to send (None = send immediately)
            template_name: Optional template name
            description: Optional description
            
        Returns:
            Created campaign object
        """
        try:
            campaign = WhatsAppCampaign(
                user_id=user_id,
                account_id=account_id,
                title=title,
                description=description,
                message_content=message_content,
                template_name=template_name,
                recipient_list=recipient_list,
                total_recipients=len(recipient_list),
                scheduled_time=scheduled_time,
                campaign_status=CampaignStatus.SCHEDULED if scheduled_time else CampaignStatus.DRAFT
            )
            
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            
            logger.info(f"✅ Created campaign: {campaign.id} - {title}")
            return campaign
            
        except Exception as e:
            logger.error(f"❌ Error creating campaign: {e}", exc_info=True)
            db.rollback()
            raise
    
    def execute_campaign(
        self,
        db: Session,
        campaign_id: int
    ) -> Dict[str, Any]:
        """
        Execute a campaign by sending messages to all recipients
        
        Args:
            db: Database session
            campaign_id: Campaign ID to execute
            
        Returns:
            Dict containing execution results
        """
        try:
            campaign = db.query(WhatsAppCampaign).filter(
                WhatsAppCampaign.id == campaign_id
            ).first()
            
            if not campaign:
                return {"success": False, "error": "Campaign not found"}
            
            if campaign.campaign_status not in [CampaignStatus.SCHEDULED, CampaignStatus.DRAFT]:
                return {"success": False, "error": f"Campaign status is {campaign.campaign_status}"}
            
            # Get WhatsApp account
            account = db.query(WhatsAppAccount).filter(
                WhatsAppAccount.id == campaign.account_id
            ).first()
            
            if not account or not account.is_active:
                campaign.campaign_status = CampaignStatus.FAILED
                campaign.error_message = "WhatsApp account not found or inactive"
                db.commit()
                return {"success": False, "error": "WhatsApp account not active"}
            
            # Update campaign status
            campaign.campaign_status = CampaignStatus.RUNNING
            campaign.start_time = datetime.utcnow()
            db.commit()
            
            # Send messages to all recipients
            sent_count = 0
            failed_count = 0
            
            for recipient in campaign.recipient_list:
                try:
                    # Send message
                    if campaign.template_name:
                        result = whatsapp_service.send_template_message(
                            phone_number_id=account.phone_number_id,
                            access_token=account.access_token,
                            to=recipient,
                            template_name=campaign.template_name,
                            language_code=campaign.template_language
                        )
                    else:
                        result = whatsapp_service.send_text_message(
                            phone_number_id=account.phone_number_id,
                            access_token=account.access_token,
                            to=recipient,
                            message=campaign.message_content
                        )
                    
                    if result.get("success"):
                        # Save message record
                        message = WhatsAppMessage(
                            account_id=account.id,
                            user_id=campaign.user_id,
                            customer_phone=recipient,
                            message=campaign.message_content,
                            message_type=MessageType.TEMPLATE if campaign.template_name else MessageType.TEXT,
                            direction=MessageDirection.OUTGOING,
                            whatsapp_message_id=result.get("message_id"),
                            status=MessageStatus.SENT,
                            template_name=campaign.template_name,
                            template_language=campaign.template_language,
                            campaign_id=campaign.id
                        )
                        db.add(message)
                        sent_count += 1
                    else:
                        # Save failed message
                        message = WhatsAppMessage(
                            account_id=account.id,
                            user_id=campaign.user_id,
                            customer_phone=recipient,
                            message=campaign.message_content,
                            message_type=MessageType.TEMPLATE if campaign.template_name else MessageType.TEXT,
                            direction=MessageDirection.OUTGOING,
                            status=MessageStatus.FAILED,
                            error_message=result.get("error"),
                            campaign_id=campaign.id
                        )
                        db.add(message)
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"❌ Error sending to {recipient}: {e}")
                    failed_count += 1
            
            # Update campaign statistics
            campaign.sent_count = sent_count
            campaign.failed_count = failed_count
            campaign.campaign_status = CampaignStatus.COMPLETED
            campaign.end_time = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"✅ Campaign {campaign_id} completed: {sent_count} sent, {failed_count} failed")
            
            return {
                "success": True,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_recipients": campaign.total_recipients
            }
            
        except Exception as e:
            logger.error(f"❌ Error executing campaign: {e}", exc_info=True)
            
            # Mark campaign as failed
            try:
                campaign = db.query(WhatsAppCampaign).filter(
                    WhatsAppCampaign.id == campaign_id
                ).first()
                if campaign:
                    campaign.campaign_status = CampaignStatus.FAILED
                    campaign.error_message = str(e)
                    db.commit()
            except:
                pass
            
            return {"success": False, "error": str(e)}
    
    def get_campaign_analytics(
        self,
        db: Session,
        campaign_id: int
    ) -> Dict[str, Any]:
        """
        Get analytics for a campaign
        
        Args:
            db: Database session
            campaign_id: Campaign ID
            
        Returns:
            Dict containing campaign analytics
        """
        try:
            campaign = db.query(WhatsAppCampaign).filter(
                WhatsAppCampaign.id == campaign_id
            ).first()
            
            if not campaign:
                return {"success": False, "error": "Campaign not found"}
            
            # Count message statuses
            messages = db.query(WhatsAppMessage).filter(
                WhatsAppMessage.campaign_id == campaign_id
            ).all()
            
            delivered_count = sum(1 for m in messages if m.status == MessageStatus.DELIVERED)
            read_count = sum(1 for m in messages if m.status == MessageStatus.READ)
            
            # Count replies (incoming messages from campaign recipients)
            recipient_phones = campaign.recipient_list
            reply_count = db.query(WhatsAppMessage).filter(
                WhatsAppMessage.account_id == campaign.account_id,
                WhatsAppMessage.customer_phone.in_(recipient_phones),
                WhatsAppMessage.direction == MessageDirection.INCOMING,
                WhatsAppMessage.timestamp >= campaign.start_time
            ).count() if campaign.start_time else 0
            
            # Update campaign analytics
            campaign.delivered_count = delivered_count
            campaign.read_count = read_count
            campaign.reply_count = reply_count
            db.commit()
            
            return {
                "success": True,
                "campaign_id": campaign_id,
                "title": campaign.title,
                "status": campaign.campaign_status.value,
                "total_recipients": campaign.total_recipients,
                "sent_count": campaign.sent_count,
                "delivered_count": delivered_count,
                "read_count": read_count,
                "failed_count": campaign.failed_count,
                "reply_count": reply_count,
                "delivery_rate": (delivered_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0,
                "read_rate": (read_count / delivered_count * 100) if delivered_count > 0 else 0,
                "reply_rate": (reply_count / delivered_count * 100) if delivered_count > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting campaign analytics: {e}", exc_info=True)
            return {"success": False, "error": str(e)}


# Create singleton instance
campaign_service = WhatsAppCampaignService()
