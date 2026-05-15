# Real-time Integration Guide - Frontend

## ✅ Installation Complete

Socket.IO client has been installed and integrated into the frontend!

---

## 📦 Files Created

### 1. Core Service
- **`src/lib/realtimeService.ts`** - Socket.IO client service
  - Connection management
  - Event handling
  - Room management
  - Typing indicators
  - Presence tracking

### 2. React Hooks
- **`src/hooks/useRealtime.ts`** - React hooks for real-time features
  - `useRealtime()` - Basic real-time connection
  - `useConversationRealtime()` - Conversation-specific features
  - `useInfluencerRealtime()` - Influencer updates
  - `useCollaborationRealtime()` - Collaboration updates

### 3. Context Provider
- **`src/contexts/RealtimeContext.tsx`** - Global real-time state
  - Auto-connect on user authentication
  - Global online users tracking
  - Connection status management

### 4. Example Component
- **`src/components/RealtimeChat.tsx`** - Example chat component
  - Real-time messaging
  - Typing indicators
  - Read receipts
  - Auto-scroll

---

## 🚀 Quick Start

### Step 1: Add RealtimeProvider to Your App

**File**: `src/routes/__root.tsx` or `src/App.tsx`

```tsx
import { RealtimeProvider } from './contexts/RealtimeContext';

export function Root() {
  return (
    <RealtimeProvider>
      {/* Your app content */}
      <Outlet />
    </RealtimeProvider>
  );
}
```

### Step 2: Use Real-time in Components

#### Example 1: Simple Connection Status

```tsx
import { useRealtimeContext } from '../contexts/RealtimeContext';

function MyComponent() {
  const { isConnected, onlineUsers } = useRealtimeContext();

  return (
    <div>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <p>Online users: {onlineUsers.size}</p>
    </div>
  );
}
```

#### Example 2: Real-time Chat

```tsx
import { useConversationRealtime } from '../hooks/useRealtime';

function ChatComponent({ conversationId, userId }) {
  const {
    isConnected,
    messages,
    typingUsers,
    startTyping,
    stopTyping,
  } = useConversationRealtime(conversationId, userId);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {typingUsers.length > 0 && <p>Someone is typing...</p>}
    </div>
  );
}
```

#### Example 3: Influencer Updates

```tsx
import { useInfluencerRealtime } from '../hooks/useRealtime';

function InfluencerDashboard({ userId }) {
  const {
    isConnected,
    influencerUpdates,
    trustScoreUpdates,
  } = useInfluencerRealtime(userId);

  useEffect(() => {
    // Updates automatically refresh when received
    console.log('New influencer updates:', influencerUpdates);
  }, [influencerUpdates]);

  return (
    <div>
      {/* Your influencer dashboard */}
    </div>
  );
}
```

#### Example 4: Collaboration Updates

```tsx
import { useCollaborationRealtime } from '../hooks/useRealtime';

function CollaborationList({ userId }) {
  const {
    isConnected,
    collaborationUpdates,
  } = useCollaborationRealtime(userId);

  useEffect(() => {
    // Status changes appear instantly
    console.log('Collaboration updates:', collaborationUpdates);
  }, [collaborationUpdates]);

  return (
    <div>
      {/* Your collaboration list */}
    </div>
  );
}
```

---

## 🎯 Integration Points

### 1. Collaboration Page (`dashboard.collaborations.tsx`)

```tsx
import { useConversationRealtime } from '../hooks/useRealtime';
import { useAuth } from '../hooks/useAuth';

export function CollaborationsPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  const numericUserId = user?.uid ? Math.abs(hashCode(user.uid)) : null;
  
  const {
    isConnected,
    messages,
    typingUsers,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
  } = useConversationRealtime(selectedConversation, numericUserId);

  // Join conversation when selected
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation);
    }
  }, [selectedConversation]);

  // Your existing UI code...
}
```

### 2. Influencer Trust Page (`dashboard.influencer-trust.tsx`)

```tsx
import { useInfluencerRealtime } from '../hooks/useRealtime';

export function InfluencerTrustPage() {
  const { user } = useAuth();
  const numericUserId = user?.uid ? Math.abs(hashCode(user.uid)) : null;
  
  const {
    isConnected,
    influencerUpdates,
    trustScoreUpdates,
    getInfluencerUpdate,
    getTrustScoreUpdate,
  } = useInfluencerRealtime(numericUserId);

  // Listen for updates
  useEffect(() => {
    // Refresh UI when updates arrive
    if (influencerUpdates.size > 0) {
      console.log('Influencer data updated in real-time!');
      // Trigger UI refresh
    }
  }, [influencerUpdates]);

  // Your existing UI code...
}
```

### 3. Dashboard Header (Show Connection Status)

```tsx
import { useRealtimeContext } from '../contexts/RealtimeContext';

export function DashboardHeader() {
  const { isConnected, onlineUsers } = useRealtimeContext();

  return (
    <header>
      {/* Your existing header */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Badge variant="default" className="bg-green-500">
            🟢 Live
          </Badge>
        ) : (
          <Badge variant="destructive">
            🔴 Offline
          </Badge>
        )}
      </div>
    </header>
  );
}
```

---

## 🔧 Configuration

### Backend URL

**File**: `src/lib/realtimeService.ts`

```typescript
const BACKEND_URL = 'http://localhost:8000';
// For production:
// const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://api.yourdomain.com';
```

### User ID Conversion

The backend expects numeric user IDs. Convert Firebase UID to numeric:

```typescript
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

const numericUserId = Math.abs(hashCode(user.uid));
```

Or fetch from your user profile if you store numeric IDs.

---

## 📊 Available Events

### Connection Events
- `connected` - Connected to server
- `disconnected` - Disconnected from server
- `connection_failed` - Connection failed

### Message Events
- `new_message` - New message received
- `user_typing` - User typing status changed
- `message_read` - Message marked as read

### Presence Events
- `user_online` - User came online
- `user_offline` - User went offline

### Influencer Events
- `influencer_update` - Influencer data updated
- `trust_score_update` - Trust score recalculated

### Collaboration Events
- `collaboration_update` - Collaboration status changed

### Notification Events
- `notification` - General notification

---

## 🎨 UI Components

### Connection Status Badge

```tsx
import { Badge } from './ui/badge';
import { useRealtimeContext } from '../contexts/RealtimeContext';

export function ConnectionStatus() {
  const { isConnected } = useRealtimeContext();

  return (
    <Badge variant={isConnected ? 'default' : 'destructive'}>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </Badge>
  );
}
```

### Typing Indicator

```tsx
export function TypingIndicator({ typingUsers }: { typingUsers: number[] }) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="text-sm text-muted-foreground italic">
      {typingUsers.length === 1
        ? 'Someone is typing...'
        : `${typingUsers.length} people are typing...`}
    </div>
  );
}
```

### Online Users List

```tsx
import { useRealtimeContext } from '../contexts/RealtimeContext';

export function OnlineUsersList() {
  const { onlineUsers } = useRealtimeContext();

  return (
    <div>
      <h3>Online Users ({onlineUsers.size})</h3>
      <ul>
        {Array.from(onlineUsers).map(userId => (
          <li key={userId}>
            <Badge variant="default">User {userId}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🧪 Testing

### Test Real-time Connection

```tsx
import { useEffect } from 'react';
import { realtimeService } from '../lib/realtimeService';

export function TestRealtime() {
  useEffect(() => {
    // Connect
    realtimeService.connect(1);

    // Listen for events
    realtimeService.on('connected', () => {
      console.log('✅ Connected!');
    });

    realtimeService.on('new_message', (data) => {
      console.log('📨 New message:', data);
    });

    return () => {
      realtimeService.disconnect();
    };
  }, []);

  return <div>Check console for real-time events</div>;
}
```

---

## 🐛 Troubleshooting

### Issue 1: Not Connecting

**Check**:
1. Backend is running on http://localhost:8000
2. Socket.IO endpoint is accessible: http://localhost:8000/socket.io
3. CORS is configured correctly in backend
4. User is authenticated

**Solution**:
```typescript
// Check connection status
console.log('Connected:', realtimeService.isConnected());
console.log('Socket ID:', realtimeService.getSocketId());
```

### Issue 2: Events Not Firing

**Check**:
1. Event names match exactly (case-sensitive)
2. You've subscribed to the event before it fires
3. Conversation room is joined for message events

**Solution**:
```typescript
// Debug events
realtimeService.on('new_message', (data) => {
  console.log('Event received:', data);
});
```

### Issue 3: TypeScript Errors

**Solution**:
```bash
# Ensure types are installed
npm install --save-dev @types/node
```

---

## 📚 API Reference

### realtimeService

```typescript
// Connect
realtimeService.connect(userId: number): void

// Disconnect
realtimeService.disconnect(): void

// Check connection
realtimeService.isConnected(): boolean

// Join conversation
realtimeService.joinConversation(conversationId: number): Promise<any>

// Leave conversation
realtimeService.leaveConversation(conversationId: number): Promise<any>

// Typing indicators
realtimeService.startTyping(conversationId: number): void
realtimeService.stopTyping(conversationId: number): void

// Mark as read
realtimeService.markAsRead(conversationId: number, messageId: number): void

// Event subscription
realtimeService.on(event: string, callback: Function): void
realtimeService.off(event: string, callback: Function): void
```

### useRealtime Hook

```typescript
const {
  isConnected,
  connect,
  disconnect,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping,
  markAsRead,
  onNewMessage,
  onUserTyping,
  onInfluencerUpdate,
  onTrustScoreUpdate,
  onCollaborationUpdate,
  onUserOnline,
  onUserOffline,
} = useRealtime({ userId, autoConnect: true });
```

---

## 🎉 Next Steps

1. **Add RealtimeProvider** to your app root
2. **Update collaboration page** to use real-time chat
3. **Update influencer page** to show live updates
4. **Add connection status** to dashboard header
5. **Test with multiple browser tabs**

---

## 📝 Example: Complete Integration

```tsx
// App.tsx or __root.tsx
import { RealtimeProvider } from './contexts/RealtimeContext';

export function App() {
  return (
    <RealtimeProvider>
      <YourApp />
    </RealtimeProvider>
  );
}

// CollaborationPage.tsx
import { useConversationRealtime } from '../hooks/useRealtime';
import { RealtimeChat } from '../components/RealtimeChat';

export function CollaborationPage() {
  const [conversationId, setConversationId] = useState(1);

  const handleSendMessage = async (content: string) => {
    // Send via API
    await fetch(`/api/collaborations/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    // Message will broadcast via Socket.IO automatically
  };

  return (
    <div>
      <RealtimeChat
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
```

---

**Real-time features are now fully integrated! 🚀**

Start using the hooks and components in your pages to enable live updates!
