"""
B2B Network Chat Routes
Real-time chat between business users
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio
from config.database import get_db_sync
from models.chat import ChatRoom, ChatMessage, ConnectionRequest
from models.user import User
from utils.dependencies import get_current_user
from services.realtime_service import realtime_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/b2b-chat", tags=["B2B Chat"])

# Request/Response Models
class SendMessageRequest(BaseModel):
    receiver_id: str
    message: str

class MessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    sender_name: str
    sender_business: Optional[str]
    message: str
    is_read: bool
    created_at: datetime

class ChatRoomResponse(BaseModel):
    id: str
    other_user_id: str
    other_user_name: str
    other_user_business: Optional[str]
    other_user_business_description: Optional[str] = None
    other_user_business_location: Optional[str] = None
    last_message: Optional[str]
    last_message_time: Optional[datetime]
    unread_count: int

class ConnectionRequestModel(BaseModel):
    receiver_id: str
    message: Optional[str] = None

class ConnectionRequestResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    sender_business: Optional[str]
    receiver_id: str
    status: str
    message: Optional[str]
    created_at: datetime


@router.post("/connections/request")
async def send_connection_request(
    request: ConnectionRequestModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Send a connection request to another business user
    """
    try:
        logger.info(f"[CONN_REQ] Connection request received: sender={current_user.id}, receiver={request.receiver_id}")
        
        # Validate receiver_id is numeric
        try:
            receiver_id_int = int(request.receiver_id)
        except ValueError:
            logger.error(f"[ERROR] Invalid receiver_id format: {request.receiver_id}")
            raise HTTPException(status_code=400, detail=f"Invalid receiver_id format: {request.receiver_id}")
        
        # Check if receiver exists and is a Sadhyam user
        receiver = db.query(User).filter(User.id == receiver_id_int).first()
        if not receiver:
            logger.error(f"[ERROR] Receiver not found: {receiver_id_int}")
            raise HTTPException(status_code=404, detail="User not found")
            
        # Prevent connection to admins
        if receiver.role in ("ADMIN", "SUPER_ADMIN"):
            logger.error(f"[ERROR] User trying to connect with admin: {receiver_id_int}")
            raise HTTPException(status_code=403, detail="Cannot connect with admin accounts")
        
        # Prevent self-connection
        if receiver_id_int == current_user.id:
            logger.error(f"[ERROR] User trying to connect with themselves: {current_user.id}")
            raise HTTPException(status_code=400, detail="Cannot connect with yourself")
        
        # Check if connection request already exists
        existing = db.query(ConnectionRequest).filter(
            ((ConnectionRequest.sender_id == current_user.id) & 
             (ConnectionRequest.receiver_id == receiver_id_int)) |
            ((ConnectionRequest.sender_id == receiver_id_int) & 
             (ConnectionRequest.receiver_id == current_user.id))
        ).first()
        
        if existing:
            if existing.status == "pending":
                logger.warning(f"[WARNING] Connection request already pending: {existing.id}")
                raise HTTPException(status_code=400, detail="Connection request already sent")
            elif existing.status == "accepted":
                logger.warning(f"[WARNING] Users already connected")
                raise HTTPException(status_code=400, detail="Already connected")
        
        # Create connection request
        connection_request = ConnectionRequest(
            sender_id=current_user.id,
            receiver_id=receiver_id_int,
            message=request.message,
            status="pending"
        )
        
        db.add(connection_request)
        db.commit()
        db.refresh(connection_request)
        
        logger.info(f"[SUCCESS] Connection request sent: {current_user.id} -> {receiver_id_int}, request_id={connection_request.id}")
        
        return {
            "success": True,
            "message": "Connection request sent",
            "request_id": connection_request.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Error sending connection request: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connections/requests", response_model=List[ConnectionRequestResponse])
async def get_connection_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Get all pending connection requests for current user
    """
    try:
        requests = db.query(ConnectionRequest).filter(
            ConnectionRequest.receiver_id == current_user.id,
            ConnectionRequest.status == "pending"
        ).all()
        
        result = []
        for req in requests:
            sender = db.query(User).filter(User.id == req.sender_id).first()
            if sender:
                result.append(ConnectionRequestResponse(
                    id=req.id,
                    sender_id=str(req.sender_id),
                    sender_name=sender.name or sender.email,
                    sender_business=sender.business_name,
                    receiver_id=str(req.receiver_id),
                    status=req.status,
                    message=req.message,
                    created_at=req.created_at
                ))
        
        return result
        
    except Exception as e:
        logger.error(f"[ERROR] Error fetching connection requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connections/accept/{request_id}")
async def accept_connection_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Accept a connection request and create chat room
    """
    try:
        # Get connection request
        conn_request = db.query(ConnectionRequest).filter(
            ConnectionRequest.id == request_id,
            ConnectionRequest.receiver_id == current_user.id,
            ConnectionRequest.status == "pending"
        ).first()
        
        if not conn_request:
            raise HTTPException(status_code=404, detail="Connection request not found")
        
        # Update status
        conn_request.status = "accepted"
        
        # Create chat room
        chat_room = ChatRoom(
            user1_id=conn_request.sender_id,
            user2_id=conn_request.receiver_id
        )
        
        db.add(chat_room)
        db.commit()
        db.refresh(chat_room)
        
        logger.info(f"[SUCCESS] Connection accepted: {conn_request.sender_id} <-> {conn_request.receiver_id}")
        
        return {
            "success": True,
            "message": "Connection accepted",
            "room_id": chat_room.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Error accepting connection: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connections/reject/{request_id}")
async def reject_connection_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Reject a connection request
    """
    try:
        conn_request = db.query(ConnectionRequest).filter(
            ConnectionRequest.id == request_id,
            ConnectionRequest.receiver_id == current_user.id,
            ConnectionRequest.status == "pending"
        ).first()
        
        if not conn_request:
            raise HTTPException(status_code=404, detail="Connection request not found")
        
        conn_request.status = "rejected"
        db.commit()
        
        logger.info(f"[REJECTED] Connection rejected: {request_id}")
        
        return {"success": True, "message": "Connection request rejected"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Error rejecting connection: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms", response_model=List[ChatRoomResponse])
async def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Get all chat rooms for current user
    """
    try:
        rooms = db.query(ChatRoom).filter(
            (ChatRoom.user1_id == current_user.id) |
            (ChatRoom.user2_id == current_user.id)
        ).all()
        
        result = []
        for room in rooms:
            # Get other user
            other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
            other_user = db.query(User).filter(User.id == other_user_id).first()
            
            if not other_user:
                continue
            
            # Get last message
            last_message = db.query(ChatMessage).filter(
                ChatMessage.room_id == room.id
            ).order_by(ChatMessage.created_at.desc()).first()
            
            # Count unread messages
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.room_id == room.id,
                ChatMessage.sender_id != current_user.id,
                ChatMessage.is_read == False
            ).count()
            
            result.append(ChatRoomResponse(
                id=room.id,
                other_user_id=str(other_user_id),
                other_user_name=other_user.name or other_user.email,
                other_user_business=other_user.business_name,
                other_user_business_description=other_user.business_description,
                other_user_business_location=other_user.business_location,
                last_message=last_message.message if last_message else None,
                last_message_time=last_message.created_at if last_message else None,
                unread_count=unread_count
            ))
        
        # Sort by last message time
        result.sort(key=lambda x: x.last_message_time or datetime.min, reverse=True)
        
        return result
        
    except Exception as e:
        logger.error(f"[ERROR] Error fetching chat rooms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms/{room_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Get all messages in a chat room
    """
    try:
        # Verify user is part of this room
        room = db.query(ChatRoom).filter(
            ChatRoom.id == room_id,
            ((ChatRoom.user1_id == current_user.id) |
             (ChatRoom.user2_id == current_user.id))
        ).first()
        
        if not room:
            raise HTTPException(status_code=404, detail="Chat room not found")
        
        # Get messages
        messages = db.query(ChatMessage).filter(
            ChatMessage.room_id == room_id
        ).order_by(ChatMessage.created_at.asc()).all()
        
        # Mark messages as read
        db.query(ChatMessage).filter(
            ChatMessage.room_id == room_id,
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False
        ).update({"is_read": True})
        db.commit()
        
        # Fetch both participants to avoid N+1 query problem
        user1 = db.query(User).filter(User.id == room.user1_id).first()
        user2 = db.query(User).filter(User.id == room.user2_id).first()
        
        users_dict = {}
        if user1:
            users_dict[user1.id] = user1
        if user2:
            users_dict[user2.id] = user2

        # Build response
        result = []
        for msg in messages:
            sender = users_dict.get(msg.sender_id)
            if not sender:
                # Fallback in case sender_id is someone else
                sender = db.query(User).filter(User.id == msg.sender_id).first()
                if sender:
                    users_dict[msg.sender_id] = sender
            
            if sender:
                result.append(MessageResponse(
                    id=msg.id,
                    room_id=msg.room_id,
                    sender_id=str(msg.sender_id),
                    sender_name=sender.name or sender.email,
                    sender_business=sender.business_name,
                    message=msg.message,
                    is_read=msg.is_read,
                    created_at=msg.created_at
                ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SendMessageInRoomRequest(BaseModel):
    message: str


@router.post("/rooms/{room_id}/messages")
async def send_message(
    room_id: str,
    request: SendMessageInRoomRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Send a message in a chat room
    """
    try:
        # Verify user is part of this room
        room = db.query(ChatRoom).filter(
            ChatRoom.id == room_id,
            ((ChatRoom.user1_id == current_user.id) |
             (ChatRoom.user2_id == current_user.id))
        ).first()
        
        if not room:
            raise HTTPException(status_code=404, detail="Chat room not found")
        
        # Create message
        chat_message = ChatMessage(
            room_id=room_id,
            sender_id=current_user.id,
            message=request.message
        )
        
        db.add(chat_message)
        
        # Update room timestamp
        room.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(chat_message)
        
        # Get sender info for real-time broadcast
        sender = db.query(User).filter(User.id == current_user.id).first()
        
        # Broadcast message to room via Socket.IO
        await realtime_service.broadcast_new_message(
            conversation_id=room_id,
            message={
                'id': chat_message.id,
                'room_id': room_id,
                'sender_id': str(current_user.id),
                'sender_name': sender.name or sender.email,
                'sender_business': sender.business_name,
                'message': request.message,
                'is_read': False,
                'created_at': chat_message.created_at.isoformat()
            }
        )
        
        logger.info(f"[SUCCESS] Message sent in room {room_id} and broadcasted via Socket.IO")
        
        return {
            "success": True,
            "message_id": chat_message.id,
            "created_at": chat_message.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Error sending message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/{room_id}/clear")
async def clear_chat(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Clear all messages in a chat room (only messages, not the room itself)
    """
    try:
        # Verify user is part of this room
        room = db.query(ChatRoom).filter(
            ChatRoom.id == room_id,
            ((ChatRoom.user1_id == current_user.id) |
             (ChatRoom.user2_id == current_user.id))
        ).first()
        
        if not room:
            raise HTTPException(status_code=404, detail="Chat room not found")
        
        # Delete all messages in this room
        db.query(ChatMessage).filter(ChatMessage.room_id == room_id).delete(synchronize_session=False)
        
        # Update room timestamp to reflect activity
        room.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Broadcast chat cleared event via Socket.IO
        await realtime_service.broadcast_chat_cleared(room_id)
        
        logger.info(f"[CLEAR] Chat cleared for room {room_id} by user {current_user.id}")
        return {"success": True, "message": "Chat cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Error clearing chat: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check-connection/{user_id}")
async def check_connection(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Check if current user is connected with another user
    """
    try:
        user_id_int = int(user_id)
        
        # Check for existing chat room
        room = db.query(ChatRoom).filter(
            ((ChatRoom.user1_id == current_user.id) & (ChatRoom.user2_id == user_id_int)) |
            ((ChatRoom.user1_id == user_id_int) & (ChatRoom.user2_id == current_user.id))
        ).first()
        
        if room:
            return {
                "connected": True,
                "room_id": room.id
            }
        
        # Check for pending connection request
        pending = db.query(ConnectionRequest).filter(
            ((ConnectionRequest.sender_id == current_user.id) & 
             (ConnectionRequest.receiver_id == user_id_int)) |
            ((ConnectionRequest.sender_id == user_id_int) & 
             (ConnectionRequest.receiver_id == current_user.id)),
            ConnectionRequest.status == "pending"
        ).first()
        
        if pending:
            return {
                "connected": False,
                "pending": True,
                "request_id": pending.id,
                "sent_by_me": pending.sender_id == current_user.id
            }
        
        return {
            "connected": False,
            "pending": False
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Error checking connection: {e}")
        raise HTTPException(status_code=500, detail=str(e))
