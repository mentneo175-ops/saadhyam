"""
Pydantic schemas for the Live Chat plugin.
Used by both the agent-facing and public-facing route modules.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from models.live_chat import (
    LiveChatConversationStatus,
    LiveChatMessageType,
    LiveChatSenderType,
)


# ---------------------------------------------------------------------------
# Visitor
# ---------------------------------------------------------------------------

class VisitorOut(BaseModel):
    """Serialised visitor record returned inside a conversation detail."""

    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    device: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

class MessageOut(BaseModel):
    """A single chat message."""

    id: str
    conversation_id: str
    sender_type: LiveChatSenderType
    sender_id: Optional[str] = None
    message: Optional[str] = None
    message_type: LiveChatMessageType
    attachment_url: Optional[str] = None
    is_read: bool
    ai_generated: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AgentSendMessageRequest(BaseModel):
    """Request body when an agent sends a message."""

    message: str = Field(..., min_length=1, max_length=10000)
    message_type: LiveChatMessageType = LiveChatMessageType.TEXT


class VisitorSendMessageRequest(BaseModel):
    """Request body when a visitor sends a message (public API)."""

    message: str = Field(..., min_length=1, max_length=10000)
    message_type: LiveChatMessageType = LiveChatMessageType.TEXT


class MessageListResponse(BaseModel):
    """Paginated list of messages."""

    messages: List[MessageOut]
    total: int
    limit: int
    offset: int
    config: Optional[dict] = None


# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------

class ConversationOut(BaseModel):
    """Conversation summary (used in list view)."""

    id: str
    user_id: int
    visitor_id: str
    status: LiveChatConversationStatus
    department: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    ai_enabled: bool
    summary: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailOut(BaseModel):
    """Full conversation detail with visitor and recent messages."""

    conversation: ConversationOut
    visitor: VisitorOut
    messages: List[MessageOut]


class ConversationUpdateRequest(BaseModel):
    """Allowed fields an agent may update on a conversation."""

    status: Optional[LiveChatConversationStatus] = None
    department: Optional[str] = Field(None, max_length=100)
    assigned_agent_id: Optional[int] = None
    ai_enabled: Optional[bool] = None


class ConversationListResponse(BaseModel):
    """List of conversations belonging to a business."""

    conversations: List[ConversationOut]
    total: int


# ---------------------------------------------------------------------------
# Public — Visitor session
# ---------------------------------------------------------------------------

class CreateSessionRequest(BaseModel):
    """
    Public widget calls this on first load.
    ``user_id`` identifies which business account this visitor belongs to.
    """

    plugin_key: str = Field(..., description="Unique public plugin key (lc_pub_...) that identifies the widget settings/owner")
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    ip_address: Optional[str] = Field(None, max_length=50)
    user_agent: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    browser: Optional[str] = Field(None, max_length=100)
    device: Optional[str] = Field(None, max_length=100)


class CreateSessionResponse(BaseModel):
    """Returned after a visitor session is created."""

    visitor_id: str
    session_token: str
    config: Optional[dict] = None


# ---------------------------------------------------------------------------
# Public — Conversation creation
# ---------------------------------------------------------------------------

class CreatePublicConversationRequest(BaseModel):
    """Public widget calls this to start a new conversation."""

    visitor_id: str
    session_token: str
    department: Optional[str] = Field(None, max_length=100)


class CreatePublicConversationResponse(BaseModel):
    """Returned after a conversation is created for a visitor."""

    conversation_id: str
    status: LiveChatConversationStatus
    config: Optional[dict] = None
