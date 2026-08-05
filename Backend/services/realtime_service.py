"""
Real-time Communication Service
Socket.IO server for real-time updates across the platform
"""

import logging
import socketio
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class RealtimeService:
    """
    Centralized real-time communication service using Socket.IO
    Handles real-time updates for:
    - Collaboration messages
    - Influencer data updates
    - Trust score changes
    - Typing indicators
    - Online presence
    """
    
    def __init__(self):
        """Initialize Socket.IO server with Redis for pub/sub"""
        # Create Socket.IO server with async mode
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*',
            logger=True,
            engineio_logger=False
        )
        
        # Store user connections: {user_id: [sid1, sid2, ...]}
        self.user_connections: Dict[int, List[str]] = {}
        
        # Store typing status: {conversation_id: {user_id: timestamp}}
        self.typing_status: Dict[int, Dict[int, datetime]] = {}
        
        # Store online users: {user_id: last_seen}
        self.online_users: Dict[int, datetime] = {}
        
        logger.info("[SUCCESS] Real-time service initialized")
        
        # Register event handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            try:
                # Extract user_id/session_token from auth
                user_id = auth.get('user_id') if auth else None
                session_token = auth.get('session_token') if auth else None
                
                # Check if visitor session_token is provided
                if session_token:
                    from config.database import AsyncSessionLocal
                    from sqlalchemy import select
                    from models.live_chat import LiveChatVisitor
                    
                    async with AsyncSessionLocal() as db:
                        stmt = select(LiveChatVisitor).where(LiveChatVisitor.session_token == session_token)
                        result = await db.execute(stmt)
                        visitor = result.scalars().first()
                    
                    if not visitor:
                        logger.warning(f"[WARNING] Connection rejected: invalid session_token={session_token} (sid: {sid})")
                        return False
                    
                    visitor_id = visitor.id
                    # Add connection to visitor's connection list
                    if visitor_id not in self.user_connections:
                        self.user_connections[visitor_id] = []
                    self.user_connections[visitor_id].append(sid)
                    
                    # Mark visitor as online
                    self.online_users[visitor_id] = datetime.now()
                    
                    logger.info(f"[SUCCESS] Visitor {visitor_id} connected (sid: {sid})")
                    
                    # Notify others about online status
                    await self.sio.emit('visitor_online', {
                        'visitor_id': visitor_id,
                        'timestamp': datetime.now().isoformat()
                    }, skip_sid=sid)
                    
                    return True
                
                elif user_id is not None:
                    # Cast user_id if possible
                    try:
                        user_id_key = int(user_id)
                    except (ValueError, TypeError):
                        user_id_key = user_id
                    
                    # Add connection to user's connection list
                    if user_id_key not in self.user_connections:
                        self.user_connections[user_id_key] = []
                    self.user_connections[user_id_key].append(sid)
                    
                    # Mark user as online
                    self.online_users[user_id_key] = datetime.now()
                    
                    logger.info(f"[SUCCESS] User {user_id_key} connected (sid: {sid})")
                    
                    # Notify others about online status
                    await self.sio.emit('user_online', {
                        'user_id': user_id_key,
                        'timestamp': datetime.now().isoformat()
                    }, skip_sid=sid)
                    
                    return True
                else:
                    logger.warning(f"[WARNING] Anonymous connection (sid: {sid})")
                    return True
                
            except Exception as e:
                logger.error(f"[ERROR] Connection error: {e}")
                return False
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            try:
                # Find user_id/visitor_id for this connection
                user_id = None
                for uid, sids in self.user_connections.items():
                    if sid in sids:
                        user_id = uid
                        sids.remove(sid)
                        if not sids:
                            del self.user_connections[uid]
                        break
                
                if user_id is not None:
                    # Update last seen
                    self.online_users[user_id] = datetime.now()
                    
                    # If no more connections, mark as offline
                    if user_id not in self.user_connections:
                        if isinstance(user_id, str):
                            # Visitor UUID
                            await self.sio.emit('visitor_offline', {
                                'visitor_id': user_id,
                                'last_seen': datetime.now().isoformat()
                            })
                        else:
                            # Agent/User integer
                            await self.sio.emit('user_offline', {
                                'user_id': user_id,
                                'last_seen': datetime.now().isoformat()
                            })
                    
                    logger.info(f"[SUCCESS] User/Visitor {user_id} disconnected (sid: {sid})")
                else:
                    logger.info(f"[SUCCESS] Anonymous user disconnected (sid: {sid})")
                    
            except Exception as e:
                logger.error(f"[ERROR] Disconnection error: {e}")
        
        @self.sio.event
        async def join_conversation(sid, data):
            """Join a conversation room with full workspace validation"""
            try:
                conversation_id = data.get('conversation_id')
                
                if not conversation_id:
                    return {'success': False, 'error': 'Missing conversation_id'}
                
                # Find caller_id from self.user_connections
                caller_id = None
                for uid, sids in self.user_connections.items():
                    if sid in sids:
                        caller_id = uid
                        break
                
                if caller_id is None:
                    return {'success': False, 'error': 'Unauthorized: connection not authenticated'}
                
                from config.database import AsyncSessionLocal
                from sqlalchemy import select
                from models.live_chat import LiveChatConversation
                from models.chat import ChatRoom
                
                async with AsyncSessionLocal() as db:
                    # 1. First check if it exists in LiveChatConversation (Live Chat plugin)
                    stmt_lc = select(LiveChatConversation).where(LiveChatConversation.id == conversation_id)
                    res_lc = await db.execute(stmt_lc)
                    lc_conv = res_lc.scalars().first()
                    
                    if lc_conv:
                        # Validate Live Chat authorization
                        if isinstance(caller_id, str):
                            # Visitor must match the conversation's visitor_id
                            if lc_conv.visitor_id != caller_id:
                                return {'success': False, 'error': 'Unauthorized: Visitor does not belong to this conversation'}
                        else:
                            # Agent must belong to the workspace/owner user_id
                            try:
                                caller_id_int = int(caller_id)
                            except (ValueError, TypeError):
                                caller_id_int = caller_id
                            
                            if lc_conv.user_id != caller_id_int:
                                return {'success': False, 'error': 'Unauthorized: Agent does not belong to this workspace'}
                    else:
                        # 2. Next check if it exists in ChatRoom (B2B chat)
                        stmt_b2b = select(ChatRoom).where(ChatRoom.id == conversation_id)
                        res_b2b = await db.execute(stmt_b2b)
                        b2b_room = res_b2b.scalars().first()
                        
                        if not b2b_room:
                            return {'success': False, 'error': 'Conversation not found'}
                        
                        # Validate B2B Chat access (caller must be user1_id or user2_id)
                        try:
                            caller_id_int = int(caller_id)
                        except (ValueError, TypeError):
                            caller_id_int = caller_id
                        
                        if b2b_room.user1_id != caller_id_int and b2b_room.user2_id != caller_id_int:
                            return {'success': False, 'error': 'Unauthorized: User does not belong to this chat room'}
                
                room = f"conversation_{conversation_id}"
                await self.sio.enter_room(sid, room)
                logger.info(f"[SUCCESS] Caller {caller_id} joined room {room}")
                
                return {'success': True, 'room': room}
                
            except Exception as e:
                logger.error(f"[ERROR] Join conversation error: {e}")
                return {'success': False, 'error': str(e)}
        
        @self.sio.event
        async def leave_conversation(sid, data):
            """Leave a conversation room"""
            try:
                conversation_id = data.get('conversation_id')
                
                if conversation_id:
                    room = f"conversation_{conversation_id}"
                    await self.sio.leave_room(sid, room)
                    logger.info(f"[SUCCESS] Connection {sid} left conversation {conversation_id}")
                    
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Missing conversation_id'}
                    
            except Exception as e:
                logger.error(f"[ERROR] Leave conversation error: {e}")
                return {'success': False, 'error': str(e)}

        @self.sio.event
        async def send_message(sid, data):
            """Receive a new message and broadcast it to the room (Version 1: only synchronizes, no DB save)"""
            try:
                conversation_id = data.get('conversation_id')
                message = data.get('message')
                
                if conversation_id and message:
                    room = f"conversation_{conversation_id}"
                    
                    # Broadcast to everyone in the room
                    await self.sio.emit('new_message', {
                        'conversation_id': conversation_id,
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    }, room=room)
                    
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Missing conversation_id or message'}
                    
            except Exception as e:
                logger.error(f"[ERROR] Send message event error: {e}")
                return {'success': False, 'error': str(e)}
        
        @self.sio.event
        async def typing_start(sid, data):
            """Handle typing start event"""
            try:
                conversation_id = data.get('conversation_id')
                user_id = data.get('user_id') or data.get('visitor_id')
                
                if conversation_id and user_id:
                    # Update typing status
                    if conversation_id not in self.typing_status:
                        self.typing_status[conversation_id] = {}
                    self.typing_status[conversation_id][user_id] = datetime.now()
                    
                    # Broadcast to conversation room
                    room = f"conversation_{conversation_id}"
                    await self.sio.emit('user_typing', {
                        'conversation_id': conversation_id,
                        'user_id': user_id,
                        'is_typing': True
                    }, room=room, skip_sid=sid)
                    
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Missing data'}
                    
            except Exception as e:
                logger.error(f"[ERROR] Typing start error: {e}")
                return {'success': False, 'error': str(e)}
        
        @self.sio.event
        async def typing_stop(sid, data):
            """Handle typing stop event"""
            try:
                conversation_id = data.get('conversation_id')
                user_id = data.get('user_id') or data.get('visitor_id')
                
                if conversation_id and user_id:
                    # Remove typing status
                    if conversation_id in self.typing_status:
                        self.typing_status[conversation_id].pop(user_id, None)
                    
                    # Broadcast to conversation room
                    room = f"conversation_{conversation_id}"
                    await self.sio.emit('user_typing', {
                        'conversation_id': conversation_id,
                        'user_id': user_id,
                        'is_typing': False
                    }, room=room, skip_sid=sid)
                    
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Missing data'}
                    
            except Exception as e:
                logger.error(f"[ERROR] Typing stop error: {e}")
                return {'success': False, 'error': str(e)}
        
        @self.sio.event
        async def mark_read(sid, data):
            """Handle message read event (alias of message_read)"""
            return await self._handle_read_event(sid, data)

        @self.sio.event
        async def message_read(sid, data):
            """Handle message read event"""
            return await self._handle_read_event(sid, data)

    async def _handle_read_event(self, sid, data):
        """Internal helper to process read receipts"""
        try:
            conversation_id = data.get('conversation_id')
            user_id = data.get('user_id') or data.get('visitor_id')
            message_id = data.get('message_id')
            
            if conversation_id and user_id:
                # Broadcast read receipt
                room = f"conversation_{conversation_id}"
                await self.sio.emit('message_read', {
                    'conversation_id': conversation_id,
                    'user_id': user_id,
                    'message_id': message_id,
                    'read_at': datetime.now().isoformat()
                }, room=room, skip_sid=sid)
                
                return {'success': True}
            else:
                return {'success': False, 'error': 'Missing data'}
                
        except Exception as e:
            logger.error(f"[ERROR] Read event processing error: {e}")
            return {'success': False, 'error': str(e)}
    
    # ============ Public Methods for Broadcasting ============
    
    async def broadcast_new_message(self, conversation_id: Any, message: Dict[str, Any]):
        """
        Broadcast new message to conversation participants
        
        Args:
            conversation_id: Conversation ID (int or str)
            message: Message data dictionary
        """
        try:
            room = f"conversation_{conversation_id}"
            await self.sio.emit('new_message', {
                'conversation_id': conversation_id,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }, room=room)
            
            logger.info(f"[SUCCESS] Broadcasted new message to conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"[ERROR] Broadcast message error: {e}")

    async def broadcast_chat_cleared(self, conversation_id: Any):
        """
        Broadcast chat cleared event to conversation participants
        
        Args:
            conversation_id: Conversation ID (int or str)
        """
        try:
            room = f"conversation_{conversation_id}"
            await self.sio.emit('chat_cleared', {
                'conversation_id': conversation_id,
                'timestamp': datetime.now().isoformat()
            }, room=room)
            
            logger.info(f"[SUCCESS] Broadcasted chat cleared to conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"[ERROR] Broadcast chat cleared error: {e}")
    
    async def broadcast_collaboration_update(self, collaboration_id: int, update_data: Dict[str, Any]):
        """
        Broadcast collaboration status update
        
        Args:
            collaboration_id: Collaboration request ID
            update_data: Update data dictionary
        """
        try:
            await self.sio.emit('collaboration_update', {
                'collaboration_id': collaboration_id,
                'update': update_data,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"[SUCCESS] Broadcasted collaboration update for {collaboration_id}")
            
        except Exception as e:
            logger.error(f"[ERROR] Broadcast collaboration update error: {e}")
    
    async def broadcast_influencer_update(self, influencer_id: int, update_data: Dict[str, Any]):
        """
        Broadcast influencer data update (metrics, trust score, etc.)
        
        Args:
            influencer_id: Influencer ID
            update_data: Update data dictionary
        """
        try:
            await self.sio.emit('influencer_update', {
                'influencer_id': influencer_id,
                'update': update_data,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"[SUCCESS] Broadcasted influencer update for {influencer_id}")
            
        except Exception as e:
            logger.error(f"[ERROR] Broadcast influencer update error: {e}")
    
    async def broadcast_trust_score_update(self, influencer_id: int, trust_data: Dict[str, Any]):
        """
        Broadcast trust score update
        
        Args:
            influencer_id: Influencer ID
            trust_data: Trust score data dictionary
        """
        try:
            await self.sio.emit('trust_score_update', {
                'influencer_id': influencer_id,
                'trust_data': trust_data,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"[SUCCESS] Broadcasted trust score update for influencer {influencer_id}")
            
        except Exception as e:
            logger.error(f"[ERROR] Broadcast trust score update error: {e}")
    
    async def notify_user(self, user_id: int, notification: Dict[str, Any]):
        """
        Send notification to specific user
        
        Args:
            user_id: User ID
            notification: Notification data dictionary
        """
        try:
            # Get all connections for this user
            sids = self.user_connections.get(user_id, [])
            
            for sid in sids:
                await self.sio.emit('notification', {
                    'notification': notification,
                    'timestamp': datetime.now().isoformat()
                }, room=sid)
            
            logger.info(f"[SUCCESS] Sent notification to user {user_id}")
            
        except Exception as e:
            logger.error(f"[ERROR] Notify user error: {e}")

    async def broadcast_youtube_analytics(self, user_id: int, channel_id: int, metrics: Dict[str, Any]):
        """
        Send YouTube analytics update to a specific user.

        Args:
            user_id: target user id
            channel_id: youtube channel db id
            metrics: dictionary of analytics metrics
        """
        try:
            notification = {
                "type": "youtube_analytics",
                "channel_id": channel_id,
                "metrics": metrics,
                "timestamp": datetime.now().isoformat(),
            }
            await self.notify_user(user_id, notification)
            logger.info(f"[SUCCESS] Sent youtube analytics update to user {user_id}")
        except Exception as e:
            logger.error(f"[ERROR] Failed to broadcast youtube analytics: {e}")
    
    async def broadcast_notification(self, notification: Dict[str, Any]):
        """
        Broadcast notification to all connected users
        """
        try:
            await self.sio.emit('notification', {
                'notification': notification,
                'timestamp': datetime.now().isoformat()
            })
            logger.info("[SUCCESS] Broadcasted notification to all users")
        except Exception as e:
            logger.error(f"[ERROR] Failed to broadcast notification: {e}")
    
    def is_user_online(self, user_id: int) -> bool:
        """
        Check if user is currently online
        
        Args:
            user_id: User ID
            
        Returns:
            True if user has active connections
        """
        return user_id in self.user_connections and len(self.user_connections[user_id]) > 0
    
    def get_online_users(self) -> List[int]:
        """
        Get list of currently online user IDs
        
        Returns:
            List of user IDs
        """
        return list(self.user_connections.keys())
    
    def get_typing_users(self, conversation_id: int) -> List[int]:
        """
        Get list of users currently typing in a conversation
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            List of user IDs
        """
        if conversation_id not in self.typing_status:
            return []
        
        # Remove stale typing status (older than 5 seconds)
        now = datetime.now()
        stale_users = []
        for user_id, timestamp in self.typing_status[conversation_id].items():
            if (now - timestamp).total_seconds() > 5:
                stale_users.append(user_id)
        
        for user_id in stale_users:
            del self.typing_status[conversation_id][user_id]
        
        return list(self.typing_status[conversation_id].keys())


# Global instance
realtime_service = RealtimeService()
