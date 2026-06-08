/**
 * Realtime Chat Component
 * Example component showing how to use real-time messaging
 */

import React, { useState, useEffect, useRef } from 'react';
import { useConversationRealtime } from '../hooks/useRealtime';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface RealtimeChatProps {
  conversationId: number;
  onSendMessage?: (content: string) => Promise<void>;
}

export function RealtimeChat({ conversationId, onSendMessage }: RealtimeChatProps) {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Get numeric user ID (you might need to fetch this from your user profile)
  const numericUserId = user?.id || null;

  const {
    isConnected,
    messages,
    typingUsers,
    startTyping,
    stopTyping,
    markAsRead,
  } = useConversationRealtime(conversationId, numericUserId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Start typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      startTyping(conversationId);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversationId);
    }, 3000);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping(conversationId);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send message via API
    if (onSendMessage) {
      try {
        await onSendMessage(content);
        // Message will be received via Socket.IO
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mark messages as read when they appear
  useEffect(() => {
    messages.forEach((message) => {
      if (!message.is_read && message.sender_user_id !== numericUserId) {
        markAsRead(conversationId, message.id);
      }
    });
  }, [messages, conversationId, numericUserId, markAsRead]);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Real-time Chat</CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                🟢 Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                🔴 Disconnected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_user_id === numericUserId
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender_user_id === numericUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                      {message.is_read && message.sender_user_id === numericUserId && (
                        <span className="ml-2">✓✓</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground italic">
                    {typingUsers.length === 1
                      ? 'Someone is typing...'
                      : `${typingUsers.length} people are typing...`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !messageInput.trim()}
          >
            Send
          </Button>
        </div>

        {!isConnected && (
          <p className="text-sm text-destructive text-center">
            Disconnected from real-time server. Reconnecting...
          </p>
        )}
      </CardContent>
    </Card>
  );
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
