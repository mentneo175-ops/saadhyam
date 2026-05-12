/**
 * React Hook for Real-time Features
 * Easy integration of Socket.IO in React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService, RealtimeMessage, TypingStatus } from '../lib/realtimeService';

export interface UseRealtimeOptions {
  userId?: number;
  autoConnect?: boolean;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  connect: (userId: number) => void;
  disconnect: () => void;
  joinConversation: (conversationId: number) => Promise<any>;
  leaveConversation: (conversationId: number) => Promise<any>;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
  markAsRead: (conversationId: number, messageId: number) => void;
  onNewMessage: (callback: (data: any) => void) => void;
  onUserTyping: (callback: (data: TypingStatus) => void) => void;
  onUserOnline: (callback: (data: any) => void) => void;
  onUserOffline: (callback: (data: any) => void) => void;
}

/**
 * Hook for real-time features
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const { userId, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<Map<string, Set<Function>>>(new Map());

  // Connect to real-time server
  const connect = useCallback((uid: number) => {
    console.log('🔌 useRealtime: Connecting...', { userId: uid });
    realtimeService.connect(uid);
  }, []);

  // Disconnect from real-time server
  const disconnect = useCallback(() => {
    console.log('🔌 useRealtime: Disconnecting...');
    realtimeService.disconnect();
  }, []);

  // Setup connection status listener
  useEffect(() => {
    const handleConnected = () => {
      console.log('✅ useRealtime: Connected');
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      console.log('❌ useRealtime: Disconnected');
      setIsConnected(false);
    };

    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);

    // Check initial connection state
    setIsConnected(realtimeService.isConnected());

    return () => {
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
    };
  }, []);

  // Auto-connect if userId provided
  useEffect(() => {
    if (autoConnect && userId && !isConnected) {
      connect(userId);
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [userId, autoConnect, isConnected, connect, disconnect]);

  // Conversation methods
  const joinConversation = useCallback(async (conversationId: number) => {
    return await realtimeService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    return await realtimeService.leaveConversation(conversationId);
  }, []);

  const startTyping = useCallback((conversationId: number) => {
    realtimeService.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: number) => {
    realtimeService.stopTyping(conversationId);
  }, []);

  const markAsRead = useCallback((conversationId: number, messageId: number) => {
    realtimeService.markAsRead(conversationId, messageId);
  }, []);

  // Event subscription methods
  const createEventSubscriber = useCallback((eventName: string) => {
    return (callback: Function) => {
      if (!callbacksRef.current.has(eventName)) {
        callbacksRef.current.set(eventName, new Set());
      }
      callbacksRef.current.get(eventName)!.add(callback);
      realtimeService.on(eventName, callback);

      // Return cleanup function
      return () => {
        callbacksRef.current.get(eventName)?.delete(callback);
        realtimeService.off(eventName, callback);
      };
    };
  }, []);

  const onNewMessage = useCallback(createEventSubscriber('new_message'), [createEventSubscriber]);
  const onUserTyping = useCallback(createEventSubscriber('user_typing'), [createEventSubscriber]);
  const onUserOnline = useCallback(createEventSubscriber('user_online'), [createEventSubscriber]);
  const onUserOffline = useCallback(createEventSubscriber('user_offline'), [createEventSubscriber]);

  return {
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
    onUserOnline,
    onUserOffline,
  };
}

/**
 * Hook for conversation real-time features
 */
export function useConversationRealtime(conversationId: number | null, userId: number | null) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const realtime = useRealtime({
    userId: userId || undefined,
    autoConnect: !!userId,
  });

  // Join conversation when ID changes
  useEffect(() => {
    if (conversationId && realtime.isConnected) {
      console.log('🚪 Joining conversation:', conversationId);
      realtime.joinConversation(conversationId);

      return () => {
        console.log('🚪 Leaving conversation:', conversationId);
        realtime.leaveConversation(conversationId);
      };
    }
  }, [conversationId, realtime.isConnected]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = realtime.onNewMessage((data: any) => {
      if (data.conversation_id === conversationId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return cleanup;
  }, [conversationId, realtime.onNewMessage]);

  // Listen for typing indicators
  useEffect(() => {
    const cleanup = realtime.onUserTyping((data: TypingStatus) => {
      if (data.conversation_id === conversationId && data.user_id !== userId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          
          if (data.is_typing) {
            newSet.add(data.user_id);
            
            // Clear existing timeout
            const existingTimeout = typingTimeoutRef.current.get(data.user_id);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // Set new timeout to remove typing indicator after 5 seconds
            const timeout = setTimeout(() => {
              setTypingUsers((prev) => {
                const updated = new Set(prev);
                updated.delete(data.user_id);
                return updated;
              });
              typingTimeoutRef.current.delete(data.user_id);
            }, 5000);
            
            typingTimeoutRef.current.set(data.user_id, timeout);
          } else {
            newSet.delete(data.user_id);
            
            // Clear timeout
            const timeout = typingTimeoutRef.current.get(data.user_id);
            if (timeout) {
              clearTimeout(timeout);
              typingTimeoutRef.current.delete(data.user_id);
            }
          }
          
          return newSet;
        });
      }
    });

    return cleanup;
  }, [conversationId, userId, realtime.onUserTyping]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, []);

  return {
    ...realtime,
    messages,
    typingUsers: Array.from(typingUsers),
    addMessage: (message: RealtimeMessage) => setMessages((prev) => [...prev, message]),
    clearMessages: () => setMessages([]),
  };
}
