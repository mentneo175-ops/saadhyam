/**
 * Realtime Context
 * Provides global real-time state and connection management
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { realtimeService } from '../lib/realtimeService';
import { useAuth } from '../hooks/useAuth';

interface RealtimeContextType {
  isConnected: boolean;
  onlineUsers: Set<number>;
  connect: () => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Connect when user is authenticated
  useEffect(() => {
    if (user?.id) {
      console.log('🔌 RealtimeProvider: Connecting for user', user.id);
      
      realtimeService.connect(user.id);
    }

    return () => {
      if (user?.id) {
        console.log('🔌 RealtimeProvider: Disconnecting');
        realtimeService.disconnect();
      }
    };
  }, [user?.id]);

  // Listen for connection status
  useEffect(() => {
    const handleConnected = () => {
      console.log('✅ RealtimeProvider: Connected');
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      console.log('❌ RealtimeProvider: Disconnected');
      setIsConnected(false);
    };

    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);

    // Check initial state
    setIsConnected(realtimeService.isConnected());

    return () => {
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
    };
  }, []);

  // Listen for user presence
  useEffect(() => {
    const handleUserOnline = (data: any) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.add(data.user_id);
        return updated;
      });
    };

    const handleUserOffline = (data: any) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(data.user_id);
        return updated;
      });
    };

    realtimeService.on('user_online', handleUserOnline);
    realtimeService.on('user_offline', handleUserOffline);

    return () => {
      realtimeService.off('user_online', handleUserOnline);
      realtimeService.off('user_offline', handleUserOffline);
    };
  }, []);

  const connect = () => {
    if (user?.id) {
      realtimeService.connect(user.id);
    }
  };

  const disconnect = () => {
    realtimeService.disconnect();
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        onlineUsers,
        connect,
        disconnect,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

// Helper function to convert string to numeric ID
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
