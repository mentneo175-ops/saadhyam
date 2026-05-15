# Socket.IO Implementation Guide

## Overview
Your project implements **Socket.IO** for real-time communication between the backend and frontend. This enables features like:
- Real-time messaging
- Typing indicators
- User presence (online/offline status)
- Message read receipts
- Live notifications

---

## Architecture

### Backend (Python/FastAPI)

#### 1. **Server Setup** (`Backend/services/realtime_service.py`)

```python
class RealtimeService:
    def __init__(self):
        # Create Socket.IO server with async mode
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*',
            logger=True,
            engineio_logger=False
        )
```

**Key Features:**
- Async mode for FastAPI compatibility
- CORS enabled for cross-origin connections
- Stores user connections, typing status, and online users

#### 2. **Event Handlers** (Backend)

The backend registers these Socket.IO events:

| Event | Purpose | Data |
|-------|---------|------|
| `connect` | User connects | `user_id`, `timestamp` |
| `disconnect` | User disconnects | `user_id`, `last_seen` |
| `join_conversation` | Join a chat room | `conversation_id`, `user_id` |
| `leave_conversation` | Leave a chat room | `conversation_id`, `user_id` |
| `typing_start` | User starts typing | `conversation_id`, `user_id` |
| `typing_stop` | User stops typing | `conversation_id`, `user_id` |
| `mark_read` | Mark message as read | `conversation_id`, `user_id`, `message_id` |

#### 3. **Broadcasting Methods** (Backend)

```python
# Broadcast new message to conversation
await realtime_service.broadcast_new_message(conversation_id, message)

# Broadcast collaboration update
await realtime_service.broadcast_collaboration_update(collaboration_id, update_data)

# Broadcast influencer update
await realtime_service.broadcast_influencer_update(influencer_id, update_data)

# Send notification to specific user
await realtime_service.notify_user(user_id, notification)
```

---

### Frontend (React/TypeScript)

#### 1. **Client Service** (`Frontend/src/lib/realtimeService.ts`)

```typescript
class RealtimeService {
  private socket: Socket | null = null;
  private userId: number | null = null;
  
  connect(userId: number): void {
    this.socket = io(BACKEND_URL, {
      auth: { user_id: userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
}
```

**Connection Options:**
- **Transports**: WebSocket (primary) + Polling (fallback)
- **Auto-reconnect**: Enabled with max 5 attempts
- **Auth**: User ID passed during connection

#### 2. **React Hook** (`Frontend/src/hooks/useRealtime.ts`)

```typescript
// Basic hook for real-time features
const realtime = useRealtime({
  userId: 123,
  autoConnect: true
});

// Conversation-specific hook
const {
  isConnected,
  messages,
  typingUsers,
  startTyping,
  stopTyping,
  markAsRead
} = useConversationRealtime(conversationId, userId);
```

#### 3. **Component Usage** (`Frontend/src/components/RealtimeChat.tsx`)

```typescript
export function RealtimeChat({ conversationId, onSendMessage }) {
  const { isConnected, messages, typingUsers, startTyping, stopTyping } = 
    useConversationRealtime(conversationId, userId);

  return (
    <div>
      {/* Connection status */}
      {isConnected ? <Badge>🟢 Connected</Badge> : <Badge>🔴 Disconnected</Badge>}
      
      {/* Messages */}
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      
      {/* Typing indicator */}
      {typingUsers.length > 0 && <p>Someone is typing...</p>}
      
      {/* Input */}
      <Input onChange={handleInputChange} onKeyPress={handleKeyPress} />
    </div>
  );
}
```

---

## Data Flow

### Real-time Message Flow

```
1. User types message in frontend
   ↓
2. Frontend sends message via HTTP API
   ↓
3. Backend saves message to database
   ↓
4. Backend broadcasts via Socket.IO: broadcast_new_message()
   ↓
5. All connected clients in conversation receive 'new_message' event
   ↓
6. Frontend updates UI with new message
```

### Typing Indicator Flow

```
1. User starts typing in frontend
   ↓
2. Frontend emits 'typing_start' event
   ↓
3. Backend receives and broadcasts to conversation room
   ↓
4. Other users receive 'user_typing' event with is_typing=true
   ↓
5. Frontend shows "Someone is typing..." indicator
   ↓
6. After 5 seconds of inactivity, frontend emits 'typing_stop'
   ↓
7. Indicator disappears
```

---

## Current Status

### ✅ Implemented
- Socket.IO server initialized in backend
- Event handlers for all core features
- React hooks for easy integration
- Real-time chat component example
- Typing indicators
- Message read receipts
- User presence tracking

### ⚠️ Disabled (Temporarily)
The Socket.IO ASGI wrapper is **currently disabled** in `main.py`:

```python
# Mount Socket.IO app for real-time communication
# NOTE: Temporarily disabled Socket.IO wrapper due to request timeout issues
# The wrapper was preventing HTTP requests from reaching the FastAPI app
# TODO: Fix Socket.IO integration to properly delegate HTTP requests
# sio_asgi_app = socketio.ASGIApp(
#     socketio_server=realtime_service.sio,
#     other_asgi_app=app,
#     socketio_path='/socket.io'
# )
```

**Why?** The ASGI wrapper was causing timeout issues with HTTP requests. The Socket.IO server is initialized but not actively mounted.

### ❌ Not Yet Integrated
- Socket.IO not actively used in any routes
- No real-time updates being broadcast from API endpoints
- Frontend components not connected to actual backend Socket.IO

---

## How to Enable Socket.IO

### Step 1: Fix the ASGI Wrapper
Update `Backend/main.py` to properly mount Socket.IO:

```python
# Option A: Use Socket.IO ASGI wrapper (requires fixing timeout issues)
from socketio import ASGIApp

sio_asgi_app = ASGIApp(
    socketio_server=realtime_service.sio,
    other_asgi_app=app,
    socketio_path='/socket.io'
)

# Run with: uvicorn main:sio_asgi_app

# Option B: Use Starlette middleware (alternative approach)
from starlette.middleware.base import BaseHTTPMiddleware
# ... implement custom middleware
```

### Step 2: Integrate with API Routes
Add Socket.IO broadcasts to your API endpoints:

```python
@router.post("/messages")
async def send_message(message: MessageCreate, db: Session = Depends(get_db)):
    # Save message to database
    db_message = Message(**message.dict())
    db.add(db_message)
    db.commit()
    
    # Broadcast to real-time clients
    await realtime_service.broadcast_new_message(
        conversation_id=message.conversation_id,
        message={
            'id': db_message.id,
            'content': db_message.content,
            'sender_id': message.sender_id,
            'created_at': db_message.created_at.isoformat()
        }
    )
    
    return db_message
```

### Step 3: Connect Frontend to Backend
Ensure frontend is connecting to the correct backend URL:

```typescript
// Frontend/src/lib/realtimeService.ts
const BACKEND_URL = 'http://localhost:8000'; // Update if needed
```

---

## Usage Examples

### Example 1: Real-time Chat Component

```typescript
import { RealtimeChat } from '@/components/RealtimeChat';

export function ChatPage() {
  const conversationId = 123;
  
  const handleSendMessage = async (content: string) => {
    await apiClient.post('/messages', {
      conversation_id: conversationId,
      content: content
    });
    // Message will be received via Socket.IO
  };
  
  return (
    <RealtimeChat 
      conversationId={conversationId}
      onSendMessage={handleSendMessage}
    />
  );
}
```

### Example 2: Broadcasting from Backend

```python
# In any route or service
from services.realtime_service import realtime_service

# Broadcast influencer update
await realtime_service.broadcast_influencer_update(
    influencer_id=123,
    update_data={
        'trust_score': 85,
        'engagement_rate': 4.5,
        'followers': 50000
    }
)

# Send notification to specific user
await realtime_service.notify_user(
    user_id=456,
    notification={
        'type': 'collaboration_request',
        'title': 'New Collaboration Request',
        'message': 'You have a new collaboration request'
    }
)
```

### Example 3: Custom Real-time Hook

```typescript
function useInfluencerUpdates(influencerId: number) {
  const [influencer, setInfluencer] = useState(null);
  const realtime = useRealtime({ userId: currentUserId });
  
  useEffect(() => {
    const cleanup = realtime.on('influencer_update', (data) => {
      if (data.influencer_id === influencerId) {
        setInfluencer(prev => ({
          ...prev,
          ...data.update
        }));
      }
    });
    
    return cleanup;
  }, [influencerId]);
  
  return influencer;
}
```

---

## Troubleshooting

### Issue: Frontend can't connect to Socket.IO
**Solution:** 
- Check backend URL in `realtimeService.ts`
- Ensure backend is running on port 8000
- Check CORS settings in backend

### Issue: Messages not being received
**Solution:**
- Verify Socket.IO is mounted in `main.py`
- Check that routes are calling `broadcast_new_message()`
- Check browser console for connection errors

### Issue: Typing indicators not working
**Solution:**
- Ensure `startTyping()` and `stopTyping()` are being called
- Check that conversation room is joined via `joinConversation()`
- Verify typing timeout is set correctly (5 seconds)

---

## Performance Considerations

1. **Connection Pooling**: Socket.IO maintains persistent connections
2. **Memory Usage**: Stores user connections and typing status in memory
3. **Scalability**: For production, consider using Redis adapter for multi-server deployments
4. **Bandwidth**: WebSocket is more efficient than polling for real-time updates

---

## Next Steps

1. **Enable Socket.IO ASGI wrapper** in `main.py`
2. **Integrate broadcasts** into existing API routes
3. **Test real-time features** with multiple clients
4. **Add Redis adapter** for production scalability
5. **Implement error handling** and reconnection logic
6. **Add unit tests** for Socket.IO events

---

## References

- [Socket.IO Documentation](https://socket.io/docs/)
- [Python-SocketIO](https://python-socketio.readthedocs.io/)
- [Socket.IO Client (JavaScript)](https://socket.io/docs/v4/client-api/)
- [FastAPI + Socket.IO Integration](https://python-socketio.readthedocs.io/en/latest/server.html#asgi-usage)
