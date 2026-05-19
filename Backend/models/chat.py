"""
Chat Models for B2B Network
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from config.database import Base

class ChatRoom(Base):
    """
    Chat room between two users
    """
    __tablename__ = "chat_rooms"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ChatRoom {self.id}: {self.user1_id} <-> {self.user2_id}>"


class ChatMessage(Base):
    """
    Individual chat message
    """
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    
    def __repr__(self):
        return f"<ChatMessage {self.id}: {self.sender_id} in {self.room_id}>"


class ConnectionRequest(Base):
    """
    Connection request between users in B2B network
    """
    __tablename__ = "connection_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, accepted, rejected
    message = Column(Text, nullable=True)  # Optional connection message
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ConnectionRequest {self.id}: {self.sender_id} -> {self.receiver_id} ({self.status})>"
