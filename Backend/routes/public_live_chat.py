"""
Live Chat Public Routes — No JWT authentication required.
Authentication is performed using session_token to identify the visitor.
"""

import logging
import secrets

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from config.database import get_db
from models.live_chat import (
    LiveChatConversation,
    LiveChatConversationStatus,
    LiveChatMessage,
    LiveChatMessageType,
    LiveChatSenderType,
    LiveChatVisitor,
)
from schemas.live_chat import (
    CreatePublicConversationRequest,
    CreatePublicConversationResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    MessageListResponse,
    MessageOut,
    VisitorSendMessageRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public/live-chat", tags=["Live Chat Public"])


# ---------------------------------------------------------------------------
# Helpers — Resolve public plugin settings & owners
# ---------------------------------------------------------------------------

async def _resolve_user_plugin_by_key(
    plugin_key: str,
    db: AsyncSession,
) -> tuple[int, dict]:
    """
    Look up the UserPlugin record by public_key, returning (owner_user_id, config_dict).
    """
    from models.plugins import UserPlugin, Plugin
    
    stmt = select(UserPlugin).join(Plugin).where(Plugin.plugin_key == "sales_live_chat")
    res = await db.execute(stmt)
    user_plugins = res.scalars().all()
    
    target_up = None
    for up in user_plugins:
        if up.user_config and up.user_config.get("public_key") == plugin_key:
            target_up = up
            break
            
    if not target_up:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget plugin key not found",
        )
        
    config = target_up.user_config or {}
    widget_config = {
        "business_name": config.get("business_name", "Saadhyam Support"),
        "welcome_message": config.get("welcome_message", "Hello! How can we help you today?"),
        "primary_color": config.get("primary_color", "#8B5CF6"),
        "position": config.get("position", "bottom_right"),
    }
    return target_up.user_id, widget_config


async def _get_widget_config_by_user_id(
    user_id: int,
    db: AsyncSession,
) -> dict:
    """
    Get widget config settings dict for a resolved user_id.
    """
    from models.plugins import UserPlugin, Plugin
    
    stmt = select(UserPlugin).join(Plugin).where(
        UserPlugin.user_id == user_id,
        Plugin.plugin_key == "sales_live_chat"
    )
    res = await db.execute(stmt)
    up = res.scalars().first()
    
    config = up.user_config if up else {}
    return {
        "business_name": config.get("business_name", "Saadhyam Support"),
        "welcome_message": config.get("welcome_message", "Hello! How can we help you today?"),
        "primary_color": config.get("primary_color", "#8B5CF6"),
        "position": config.get("position", "bottom_right"),
    }


# ---------------------------------------------------------------------------
# Helper — resolve visitor via session_token
# ---------------------------------------------------------------------------

async def _get_visitor_by_token(
    visitor_id: str,
    session_token: str,
    db: AsyncSession,
) -> LiveChatVisitor:
    """
    Return the visitor only if both visitor_id and session_token match.
    Raises 401 on mismatch or 404 if visitor does not exist.
    """
    result = await db.execute(
        select(LiveChatVisitor).where(LiveChatVisitor.id == visitor_id)
    )
    visitor = result.scalars().first()

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    if visitor.session_token != session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token",
        )

    return visitor


# ---------------------------------------------------------------------------
# Public API 1 — Create visitor session
# ---------------------------------------------------------------------------

@router.post(
    "/session",
    response_model=CreateSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a visitor session (called by the public chat widget on first load)",
)
async def create_visitor_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a LiveChatVisitor record for an anonymous website visitor.
    Returns a visitor_id, session_token and config widget settings.
    No JWT required.
    """
    owner_user_id, widget_config = await _resolve_user_plugin_by_key(body.plugin_key, db)

    # Generate a cryptographically secure session token
    session_token = secrets.token_urlsafe(48)

    visitor = LiveChatVisitor(
        user_id=owner_user_id,
        session_token=session_token,
        name=body.name,
        email=body.email,
        phone=body.phone,
        ip_address=body.ip_address,
        user_agent=body.user_agent,
        location=body.location,
        browser=body.browser,
        device=body.device,
    )
    db.add(visitor)
    await db.commit()
    await db.refresh(visitor)

    logger.info("New visitor session created: visitor_id=%s", visitor.id)

    return CreateSessionResponse(
        visitor_id=visitor.id,
        session_token=session_token,
        config=widget_config,
    )


# ---------------------------------------------------------------------------
# Public API 2 — Create conversation
# ---------------------------------------------------------------------------

@router.post(
    "/conversation",
    response_model=CreatePublicConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new conversation for a visitor",
)
async def create_public_conversation(
    body: CreatePublicConversationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new LiveChatConversation for an existing visitor.
    Authenticates using visitor_id + session_token (no JWT).
    """
    visitor = await _get_visitor_by_token(body.visitor_id, body.session_token, db)
    widget_config = await _get_widget_config_by_user_id(visitor.user_id, db)

    conversation = LiveChatConversation(
        user_id=visitor.user_id,
        visitor_id=visitor.id,
        status=LiveChatConversationStatus.WAITING,
        department=body.department,
        ai_enabled=True,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    logger.info(
        "New conversation created: id=%s, visitor=%s", conversation.id, visitor.id
    )

    return CreatePublicConversationResponse(
        conversation_id=conversation.id,
        status=conversation.status,
        config=widget_config,
    )


# ---------------------------------------------------------------------------
# Public API 3 — Get conversation messages
# ---------------------------------------------------------------------------

@router.get(
    "/conversation/{conversation_id}/messages",
    response_model=MessageListResponse,
    summary="Get conversation history (authenticated by session_token)",
)
async def get_public_conversation_messages(
    conversation_id: str,
    visitor_id: str,
    session_token: str,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    Return messages for a conversation.
    Authentication: visitor_id + session_token query params (no JWT).
    Validates that the conversation belongs to this visitor.
    """
    visitor = await _get_visitor_by_token(visitor_id, session_token, db)
    widget_config = await _get_widget_config_by_user_id(visitor.user_id, db)

    # Validate the conversation belongs to this visitor
    conv_result = await db.execute(
        select(LiveChatConversation).where(
            LiveChatConversation.id == conversation_id,
            LiveChatConversation.visitor_id == visitor.id,
        )
    )
    conversation = conv_result.scalars().first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Fetch messages (ascending — oldest first for chat display)
    stmt = (
        select(LiveChatMessage)
        .where(LiveChatMessage.conversation_id == conversation_id)
        .order_by(LiveChatMessage.created_at)
        .offset(max(0, offset))
        .limit(max(1, min(limit, 200)))
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
        config=widget_config,
    )


# ---------------------------------------------------------------------------
# Public API 4 — Visitor sends a message
# ---------------------------------------------------------------------------

@router.post(
    "/conversation/{conversation_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Visitor sends a message (authenticated by session_token)",
)
async def visitor_send_message(
    conversation_id: str,
    visitor_id: str,
    session_token: str,
    body: VisitorSendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Save a visitor message. Version 1 — no socket emission or AI trigger.
    Authentication: visitor_id + session_token query params.
    """
    if not body.message or not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    visitor = await _get_visitor_by_token(visitor_id, session_token, db)

    # Validate conversation belongs to this visitor
    conv_result = await db.execute(
        select(LiveChatConversation).where(
            LiveChatConversation.id == conversation_id,
            LiveChatConversation.visitor_id == visitor.id,
        )
    )
    conversation = conv_result.scalars().first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    if conversation.status == LiveChatConversationStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This conversation is closed",
        )

    message = LiveChatMessage(
        conversation_id=conversation_id,
        sender_type=LiveChatSenderType.VISITOR,
        sender_id=visitor.id,
        message=body.message.strip(),
        message_type=body.message_type,
        is_read=False,
        ai_generated=False,
    )
    db.add(message)

    # Update last_message_at
    from datetime import datetime
    conversation.last_message_at = datetime.utcnow()

    await db.commit()
    await db.refresh(message)

    logger.info(
        "Visitor %s sent message %s in conversation %s",
        visitor.id,
        message.id,
        conversation_id,
    )
    return MessageOut.model_validate(message)
