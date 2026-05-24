"""
WhatsApp Messages Routes
Handles sending messages, viewing conversations, and chat management
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy import or_, and_, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from config.database import get_db_sync
from models.user import User
from models.whatsapp_account import WhatsAppAccount
from models.whatsapp_message import WhatsAppMessage, MessageDirection, MessageType, MessageStatus
from utils.dependencies import get_current_user
from services.whatsapp_service import whatsapp_service
from services.whatsapp_ai_service import whatsapp_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp/messages", tags=["whatsapp-messages"])


class SendMessageRequest(BaseModel):
    """Request model for sending a message"""
    to: str
    message: str
    use_ai: Optional[bool] = False


class MessageResponse(BaseModel):
    """Response model for a message"""
    id: int
    customer_phone: str
    customer_name: Optional[str]
    message: Optional[str]
    message_type: str
    direction: str
    status: str
    timestamp: str
    ai_generated: bool
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Response model for a conversation"""
    customer_phone: str
    customer_name: Optional[str]
    last_message: Optional[str]
    last_message_time: str
    unread_count: int
    message_count: int


@router.post("/send")
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Send a WhatsApp message
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        message_text = request.message
        ai_generated = False
        
        # Generate AI reply if requested
        if request.use_ai:
            # Get conversation history
            history = db.query(WhatsAppMessage).filter(
                and_(
                    WhatsAppMessage.account_id == account.id,
                    WhatsAppMessage.customer_phone == request.to
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
                customer_message=history[0].message if history else "",
                conversation_history=conversation_history,
                business_context=account.business_name,
                tone="professional"
            )
            
            if ai_result.get("success"):
                message_text = ai_result.get("reply")
                ai_generated = True
        
        # Send message via WhatsApp API
        result = await whatsapp_service.send_text_message(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            to=request.to,
            message=message_text
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to send message"))
        
        # Save message to database
        new_message = WhatsAppMessage(
            account_id=account.id,
            user_id=current_user.id,
            customer_phone=request.to,
            message=message_text,
            message_type=MessageType.TEXT,
            direction=MessageDirection.OUTGOING,
            whatsapp_message_id=result.get("message_id"),
            status=MessageStatus.SENT,
            ai_generated=ai_generated
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        logger.info(f"✅ Message sent to {request.to}")
        
        return {
            "success": True,
            "message_id": new_message.id,
            "whatsapp_message_id": result.get("message_id"),
            "ai_generated": ai_generated
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending message: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get all conversations (grouped by customer)
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            return {"conversations": [], "total": 0}
        
        # Get all unique customers with their last message
        from sqlalchemy import func
        
        subquery = db.query(
            WhatsAppMessage.customer_phone,
            func.max(WhatsAppMessage.timestamp).label('last_time')
        ).filter(
            WhatsAppMessage.account_id == account.id
        ).group_by(
            WhatsAppMessage.customer_phone
        ).subquery()
        
        # Get last message for each customer
        conversations_query = db.query(WhatsAppMessage).join(
            subquery,
            and_(
                WhatsAppMessage.customer_phone == subquery.c.customer_phone,
                WhatsAppMessage.timestamp == subquery.c.last_time
            )
        ).order_by(desc(WhatsAppMessage.timestamp))
        
        total = conversations_query.count()
        conversations_data = conversations_query.offset(offset).limit(limit).all()
        
        conversations = []
        for msg in conversations_data:
            # Count unread messages (incoming messages with status != READ)
            unread_count = db.query(WhatsAppMessage).filter(
                and_(
                    WhatsAppMessage.account_id == account.id,
                    WhatsAppMessage.customer_phone == msg.customer_phone,
                    WhatsAppMessage.direction == MessageDirection.INCOMING,
                    WhatsAppMessage.status != MessageStatus.READ
                )
            ).count()
            
            # Count total messages
            message_count = db.query(WhatsAppMessage).filter(
                and_(
                    WhatsAppMessage.account_id == account.id,
                    WhatsAppMessage.customer_phone == msg.customer_phone
                )
            ).count()
            
            conversations.append({
                "customer_phone": msg.customer_phone,
                "customer_name": msg.customer_name,
                "last_message": msg.message,
                "last_message_time": msg.timestamp.isoformat(),
                "unread_count": unread_count,
                "message_count": message_count,
                "direction": msg.direction.value
            })
        
        return {
            "conversations": conversations,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/{customer_phone}")
async def get_conversation(
    customer_phone: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """
    Get messages for a specific conversation
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        # Get messages for this customer
        messages_query = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.account_id == account.id,
                WhatsAppMessage.customer_phone == customer_phone
            )
        ).order_by(desc(WhatsAppMessage.timestamp))
        
        total = messages_query.count()
        messages = messages_query.offset(offset).limit(limit).all()
        
        # Mark incoming messages as read
        unread_messages = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.account_id == account.id,
                WhatsAppMessage.customer_phone == customer_phone,
                WhatsAppMessage.direction == MessageDirection.INCOMING,
                WhatsAppMessage.status != MessageStatus.READ
            )
        ).all()
        
        for msg in unread_messages:
            msg.status = MessageStatus.READ
            msg.read_at = datetime.utcnow()
        
        if unread_messages:
            db.commit()
        
        # Format messages
        formatted_messages = [
            {
                "id": msg.id,
                "customer_phone": msg.customer_phone,
                "customer_name": msg.customer_name,
                "message": msg.message,
                "message_type": msg.message_type.value,
                "direction": msg.direction.value,
                "status": msg.status.value,
                "timestamp": msg.timestamp.isoformat(),
                "ai_generated": msg.ai_generated,
                "media_url": msg.media_url
            }
            for msg in reversed(messages)  # Reverse to show oldest first
        ]
        
        return {
            "messages": formatted_messages,
            "total": total,
            "limit": limit,
            "offset": offset,
            "customer_phone": customer_phone
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting conversation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai-suggestion")
async def get_ai_suggestion(
    customer_phone: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Get AI-generated reply suggestion for a conversation
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        # Get conversation history
        history = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.account_id == account.id,
                WhatsAppMessage.customer_phone == customer_phone
            )
        ).order_by(WhatsAppMessage.timestamp.desc()).limit(10).all()
        
        if not history:
            raise HTTPException(status_code=404, detail="No conversation found")
        
        conversation_history = [
            {
                "direction": msg.direction.value,
                "message": msg.message
            }
            for msg in reversed(history)
        ]
        
        # Generate AI suggestion
        ai_result = whatsapp_ai_service.generate_reply(
            customer_message=history[0].message or "",
            conversation_history=conversation_history,
            business_context=account.business_name,
            tone="professional"
        )
        
        if not ai_result.get("success"):
            raise HTTPException(status_code=500, detail="Failed to generate AI suggestion")
        
        return {
            "success": True,
            "suggestion": ai_result.get("reply"),
            "confidence": ai_result.get("confidence", 70)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting AI suggestion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_message_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Get message statistics
    """
    try:
        # Get active WhatsApp account
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            return {
                "total_messages": 0,
                "total_conversations": 0,
                "unread_count": 0,
                "sent_today": 0,
                "received_today": 0
            }
        
        # Total messages
        total_messages = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.account_id == account.id
        ).count()
        
        # Total conversations
        from sqlalchemy import func
        total_conversations = db.query(
            func.count(func.distinct(WhatsAppMessage.customer_phone))
        ).filter(
            WhatsAppMessage.account_id == account.id
        ).scalar()
        
        # Unread count
        unread_count = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.account_id == account.id,
                WhatsAppMessage.direction == MessageDirection.INCOMING,
                WhatsAppMessage.status != MessageStatus.READ
            )
        ).count()
        
        # Today's messages
        from datetime import date
        today_start = datetime.combine(date.today(), datetime.min.time())
        
        sent_today = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.account_id == account.id,
                WhatsAppMessage.direction == MessageDirection.OUTGOING,
                WhatsAppMessage.timestamp >= today_start
            )
        ).count()
        
        received_today = db.query(WhatsAppMessage).filter(
            and_(
                WhatsAppMessage.account_id == account.id,
                WhatsAppMessage.direction == MessageDirection.INCOMING,
                WhatsAppMessage.timestamp >= today_start
            )
        ).count()
        
        return {
            "total_messages": total_messages,
            "total_conversations": total_conversations or 0,
            "unread_count": unread_count,
            "sent_today": sent_today,
            "received_today": received_today
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting message stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
