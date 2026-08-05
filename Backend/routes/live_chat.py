"""
Live Chat Agent Routes — Authenticated endpoints.
All routes enforce workspace isolation: every query filters by current_user.id.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.live_chat import (
    LiveChatConversation,
    LiveChatConversationStatus,
    LiveChatMessage,
    LiveChatMessageType,
    LiveChatSenderType,
    LiveChatVisitor,
)
from models.user import User
from schemas.live_chat import (
    AgentSendMessageRequest,
    ConversationDetailOut,
    ConversationListResponse,
    ConversationOut,
    ConversationUpdateRequest,
    MessageListResponse,
    MessageOut,
    VisitorOut,
)
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/live-chat", tags=["Live Chat"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _get_conversation_or_404(
    conversation_id: str,
    user_id: int,
    db: AsyncSession,
) -> LiveChatConversation:
    """Fetch a conversation that belongs to the current user or raise 404."""
    result = await db.execute(
        select(LiveChatConversation).where(
            LiveChatConversation.id == conversation_id,
            LiveChatConversation.user_id == user_id,
        )
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conversation


# ---------------------------------------------------------------------------
# API 1 — List conversations
# ---------------------------------------------------------------------------

@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    summary="List all conversations for the authenticated business",
)
async def list_conversations(
    conv_status: Optional[LiveChatConversationStatus] = Query(
        None, alias="status", description="Filter by conversation status"
    ),
    department: Optional[str] = Query(None, description="Filter by department"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return all conversations belonging to the logged-in business,
    sorted by last_message_at DESC (newest first).
    """
    stmt = select(LiveChatConversation).where(
        LiveChatConversation.user_id == current_user.id
    )

    if conv_status is not None:
        stmt = stmt.where(LiveChatConversation.status == conv_status)
    if department is not None:
        stmt = stmt.where(LiveChatConversation.department == department)

    stmt = stmt.order_by(desc(LiveChatConversation.last_message_at))

    result = await db.execute(stmt)
    conversations = result.scalars().all()

    return ConversationListResponse(
        conversations=[ConversationOut.model_validate(c) for c in conversations],
        total=len(conversations),
    )


# ---------------------------------------------------------------------------
# API 2 — Conversation detail
# ---------------------------------------------------------------------------

@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailOut,
    summary="Get a conversation with visitor info and recent messages",
)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the conversation, its visitor, and the last 50 messages.
    Returns 404 if the conversation does not belong to the current user.
    """
    conversation = await _get_conversation_or_404(
        conversation_id, current_user.id, db
    )

    # Fetch visitor
    visitor_result = await db.execute(
        select(LiveChatVisitor).where(
            LiveChatVisitor.id == conversation.visitor_id
        )
    )
    visitor = visitor_result.scalars().first()
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor record not found",
        )

    # Fetch last 50 messages ascending
    msg_result = await db.execute(
        select(LiveChatMessage)
        .where(LiveChatMessage.conversation_id == conversation_id)
        .order_by(LiveChatMessage.created_at)
        .limit(50)
    )
    messages = msg_result.scalars().all()

    return ConversationDetailOut(
        conversation=ConversationOut.model_validate(conversation),
        visitor=VisitorOut.model_validate(visitor),
        messages=[MessageOut.model_validate(m) for m in messages],
    )


# ---------------------------------------------------------------------------
# API 3 — Message list (paginated)
# ---------------------------------------------------------------------------

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessageListResponse,
    summary="Get all messages in a conversation (paginated, ascending)",
)
async def list_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=200, description="Number of messages to return"),
    offset: int = Query(0, ge=0, description="Number of messages to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return messages in ascending order with limit/offset pagination."""
    await _get_conversation_or_404(conversation_id, current_user.id, db)

    stmt = (
        select(LiveChatMessage)
        .where(LiveChatMessage.conversation_id == conversation_id)
        .order_by(LiveChatMessage.created_at)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    # Total count
    count_result = await db.execute(
        select(LiveChatMessage).where(
            LiveChatMessage.conversation_id == conversation_id
        )
    )
    total = len(count_result.scalars().all())

    return MessageListResponse(
        messages=[MessageOut.model_validate(m) for m in messages],
        total=total,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# API 4 — Agent sends a message
# ---------------------------------------------------------------------------

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Agent sends a message in a conversation",
)
async def agent_send_message(
    conversation_id: str,
    body: AgentSendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Save an agent message. Version 1 — no socket emission or AI calls.
    Updates conversation.last_message_at.
    """
    conversation = await _get_conversation_or_404(
        conversation_id, current_user.id, db
    )

    if conversation.status == LiveChatConversationStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a message to a closed conversation",
        )

    message = LiveChatMessage(
        conversation_id=conversation_id,
        sender_type=LiveChatSenderType.AGENT,
        sender_id=str(current_user.id),
        message=body.message,
        message_type=body.message_type,
        is_read=False,
        ai_generated=False,
    )
    db.add(message)

    # Update last_message_at on conversation
    from datetime import datetime
    conversation.last_message_at = datetime.utcnow()

    await db.commit()
    await db.refresh(message)

    logger.info(
        "Agent %s sent message %s in conversation %s",
        current_user.id,
        message.id,
        conversation_id,
    )
    return MessageOut.model_validate(message)


# ---------------------------------------------------------------------------
# API 5 — Update conversation
# ---------------------------------------------------------------------------

@router.patch(
    "/conversations/{conversation_id}",
    response_model=ConversationOut,
    summary="Update status, department, assigned agent, or AI toggle",
)
async def update_conversation(
    conversation_id: str,
    body: ConversationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Only the four allowed fields may be updated.
    No other fields can be modified through this endpoint.
    """
    conversation = await _get_conversation_or_404(
        conversation_id, current_user.id, db
    )

    if body.status is not None:
        conversation.status = body.status
    if body.department is not None:
        conversation.department = body.department
    if body.assigned_agent_id is not None:
        conversation.assigned_agent_id = body.assigned_agent_id
    if body.ai_enabled is not None:
        conversation.ai_enabled = body.ai_enabled

    await db.commit()
    await db.refresh(conversation)

    logger.info(
        "Conversation %s updated by agent %s", conversation_id, current_user.id
    )
    return ConversationOut.model_validate(conversation)


# ---------------------------------------------------------------------------
# API 6 — Delete conversation
# ---------------------------------------------------------------------------

@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation (messages cascade delete via DB constraint)",
)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete the conversation. Messages are removed via the CASCADE constraint
    defined in Phase 2 (live_chat_messages.conversation_id ON DELETE CASCADE).
    """
    conversation = await _get_conversation_or_404(
        conversation_id, current_user.id, db
    )

    await db.delete(conversation)
    await db.commit()

    logger.info(
        "Conversation %s deleted by agent %s", conversation_id, current_user.id
    )


# ---------------------------------------------------------------------------
# API 7 — Live Chat Settings
# ---------------------------------------------------------------------------

from pydantic import BaseModel

class LiveChatSettingsRequest(BaseModel):
    business_name: str
    welcome_message: str
    primary_color: str
    position: str

@router.get(
    "/settings",
    summary="Get Live Chat plugin configuration",
)
async def get_live_chat_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Load UserPlugin configuration for sales_live_chat.
    Auto-generates public_key in user_config if missing.
    """
    from models.plugins import UserPlugin, Plugin
    import secrets
    
    # 1. Fetch plugin registry
    res_plugin = await db.execute(
        select(Plugin).where(Plugin.plugin_key == "sales_live_chat")
    )
    plugin = res_plugin.scalar_one_or_none()
    if not plugin:
        raise HTTPException(status_code=404, detail="Live Chat plugin registry not found")
        
    # 2. Fetch or create UserPlugin
    stmt = select(UserPlugin).where(
        UserPlugin.user_id == current_user.id,
        UserPlugin.plugin_id == plugin.id
    )
    res_up = await db.execute(stmt)
    user_plugin = res_up.scalar_one_or_none()
    
    if not user_plugin:
        # Create installation automatically if not present
        user_plugin = UserPlugin(
            user_id=current_user.id,
            plugin_id=plugin.id,
            installed_version=plugin.version,
            user_config={}
        )
        db.add(user_plugin)
        await db.commit()
        await db.refresh(user_plugin)
        
    # Ensure config has defaults and public_key
    config = user_plugin.user_config or {}
    updated = False
    
    if "business_name" not in config:
        config["business_name"] = "Saadhyam Support"
        updated = True
    if "welcome_message" not in config:
        config["welcome_message"] = "Hello! How can we help you today?"
        updated = True
    if "primary_color" not in config:
        config["primary_color"] = "#8B5CF6"
        updated = True
    if "position" not in config:
        config["position"] = "bottom_right"
        updated = True
    if "public_key" not in config:
        config["public_key"] = f"lc_pub_{secrets.token_hex(16)}"
        updated = True
        
    if updated:
        user_plugin.user_config = config
        db.add(user_plugin)
        await db.commit()
        
    return config


@router.post(
    "/settings",
    summary="Save Live Chat plugin configuration",
)
async def save_live_chat_settings(
    body: LiveChatSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Save configuration changes for sales_live_chat.
    """
    from models.plugins import UserPlugin, Plugin
    import secrets
    
    # 1. Fetch plugin registry
    res_plugin = await db.execute(
        select(Plugin).where(Plugin.plugin_key == "sales_live_chat")
    )
    plugin = res_plugin.scalar_one_or_none()
    if not plugin:
        raise HTTPException(status_code=404, detail="Live Chat plugin registry not found")
        
    # 2. Fetch UserPlugin
    stmt = select(UserPlugin).where(
        UserPlugin.user_id == current_user.id,
        UserPlugin.plugin_id == plugin.id
    )
    res_up = await db.execute(stmt)
    user_plugin = res_up.scalar_one_or_none()
    
    if not user_plugin:
        raise HTTPException(status_code=404, detail="Live Chat plugin not installed")
        
    config = user_plugin.user_config or {}
    
    # Ensure public_key is retained/generated
    if "public_key" not in config:
        config["public_key"] = f"lc_pub_{secrets.token_hex(16)}"
        
    config["business_name"] = body.business_name
    config["welcome_message"] = body.welcome_message
    config["primary_color"] = body.primary_color
    config["position"] = body.position
    
    user_plugin.user_config = config
    db.add(user_plugin)
    await db.commit()
    
    return {"success": True, "config": config}

