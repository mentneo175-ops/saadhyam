/**
 * Real-time Communication Service
 * Socket.IO client for real-time updates across the platform
 */

import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:8000';

export interface RealtimeMessage {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_type: string;
  message_type: string;
  content: string;
  attachment_url?: string;
  created_at: string;
  is_read: boolean;
}

export interface TypingStatus {
  conversation_id: number;
  user_id: number;
  is_typing: boolean;
}

export interface UserPresence {
  user_id: number;
  timestamp: string;
  last_seen?: string;
}

export interface Notification {
  notification: any;
  timestamp: string;
}

class RealtimeService {
  private socket: Socket | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to Socket.IO server
   */
  connect(userId: number): void {
    if (this.socket?.connected) {
      console.log('✅ Already connected to real-time server');
      return;
    }

    this.userId = userId;

    console.log('🔌 Connecting to real-time server...', { userId, url: BACKEND_URL });

    this.socket = io(BACKEND_URL, {
      auth: {
        user_id: userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from real-time server...');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to real-time server', { socketId: this.socket?.id });
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from real-time server', { reason });
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.emit('connection_failed', { error });
      }
    });

    // User presence events
    this.socket.on('user_online', (data: UserPresence) => {
      console.log('👤 User online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data: UserPresence) => {
      console.log('👤 User offline:', data);
      this.emit('user_offline', data);
    });

    // Message events
    this.socket.on('new_message', (data: { conversation_id: number; message: RealtimeMessage; timestamp: string }) => {
      console.log('📨 New message:', data);
      this.emit('new_message', data);
    });

    this.socket.on('user_typing', (data: TypingStatus) => {
      console.log('⌨️ User typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('message_read', (data: any) => {
      console.log('✓✓ Message read:', data);
      this.emit('message_read', data);
    });

    // Notification events
    this.socket.on('notification', (data: Notification) => {
      console.log('🔔 Notification:', data);
      this.emit('notification', data);
    });
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: number): Promise<{ success: boolean; room?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.userId) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      console.log('🚪 Joining conversation:', { conversationId, userId: this.userId });

      this.socket.emit(
        'join_conversation',
        {
          conversation_id: conversationId,
          user_id: this.userId,
        },
        (response: any) => {
          console.log('✅ Joined conversation:', response);
          resolve(response);
        }
      );
    });
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: number): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.userId) {
        resolve({ success: false, error: 'Not connected' });
        return;
      }

      console.log('🚪 Leaving conversation:', { conversationId, userId: this.userId });

      this.socket.emit(
        'leave_conversation',
        {
          conversation_id: conversationId,
          user_id: this.userId,
        },
        (response: any) => {
          console.log('✅ Left conversation:', response);
          resolve(response);
        }
      );
    });
  }

  /**
   * Send typing start event
   */
  startTyping(conversationId: number): void {
    if (!this.socket || !this.userId) return;

    this.socket.emit('typing_start', {
      conversation_id: conversationId,
      user_id: this.userId,
    });
  }

  /**
   * Send typing stop event
   */
  stopTyping(conversationId: number): void {
    if (!this.socket || !this.userId) return;

    this.socket.emit('typing_stop', {
      conversation_id: conversationId,
      user_id: this.userId,
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(conversationId: number, messageId: number): void {
    if (!this.socket || !this.userId) return;

    this.socket.emit('mark_read', {
      conversation_id: conversationId,
      user_id: this.userId,
      message_id: messageId,
    });
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current user ID
   */
  getUserId(): number | null {
    return this.userId;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export class for testing
export default RealtimeService;
