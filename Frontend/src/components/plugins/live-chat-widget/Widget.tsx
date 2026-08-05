import { useState, useEffect, useRef, useCallback } from "react";
import { realtimeService } from "@/lib/realtimeService";
import { ChatButton } from "./ChatButton";
import { ChatWindow } from "./ChatWindow";
import { env } from "@/config/env";
import { toast } from "sonner";

export interface WidgetConfig {
  business_name: string;
  welcome_message: string;
  primary_color: string;
  position: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "visitor" | "agent" | "ai";
  sender_id: string | null;
  message: string | null;
  message_type: "text" | "image" | "file" | "audio";
  attachment_url: string | null;
  is_read: boolean;
  ai_generated: boolean;
  created_at: string;
}

interface WidgetProps {
  pluginKey: string;
}

export function Widget({ pluginKey }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  
  // Visitor states
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Chat list and composer state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false); // Whether agent/bot is typing

  const BASE_URL = env.apiBaseUrl;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LocalStorage keys helper
  const getStorageKey = (suffix: string) => `saadhyam_live_chat_${pluginKey}_${suffix}`;

  // Notify parent window of resize/repositioning
  const notifyParent = useCallback((type: "saadhyam-chat-toggle" | "saadhyam-chat-position", payload: any) => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type, ...payload }, "*");
    }
  }, []);

  // Sync window open state and position with host
  useEffect(() => {
    notifyParent("saadhyam-chat-toggle", { open: isOpen });
  }, [isOpen, notifyParent]);

  useEffect(() => {
    if (config?.position) {
      notifyParent("saadhyam-chat-position", { position: config.position });
    }
  }, [config?.position, notifyParent]);

  // Load initial settings and session from backend/localStorage
  const initializeWidget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedVisitor = localStorage.getItem(getStorageKey("visitor"));
      const storedSession = localStorage.getItem(getStorageKey("session"));
      const storedConv = localStorage.getItem(getStorageKey("conversation"));

      if (storedVisitor && storedSession) {
        setVisitorId(storedVisitor);
        setSessionToken(storedSession);

        if (storedConv) {
          setConversationId(storedConv);
          // Retrieve existing conversation messages
          const res = await fetch(
            `${BASE_URL}/api/public/live-chat/conversation/${storedConv}/messages?visitor_id=${encodeURIComponent(
              storedVisitor
            )}&session_token=${encodeURIComponent(storedSession)}`
          );

          if (!res.ok) {
            if (res.status === 401 || res.status === 404) {
              // Session expired, clear and re-initialize
              localStorage.removeItem(getStorageKey("visitor"));
              localStorage.removeItem(getStorageKey("session"));
              localStorage.removeItem(getStorageKey("conversation"));
              setVisitorId(null);
              setSessionToken(null);
              setConversationId(null);
              await createNewSession();
              return;
            }
            throw new Error("Failed to load message history");
          }

          const data = await res.json();
          setMessages(data.messages || []);
          if (data.config) {
            setConfig(data.config);
          }
          
          // Connect to Socket.IO using extended realtimeService
          realtimeService.connectVisitor(storedVisitor, storedSession);
          await realtimeService.joinConversation(storedConv as any);
        } else {
          // Visitor session exists but no conversation started yet, get config by doing a dummy session request or using defaults
          await createNewSession(storedVisitor, storedSession);
        }
      } else {
        // First visit
        await createNewSession();
      }
    } catch (err) {
      console.error("[Saadhyam Widget] Init error:", err);
      setError("Failed to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, pluginKey]);

  // Create new session or fetch config for existing anonymous visitor
  const createNewSession = async (existingId?: string, existingToken?: string) => {
    // If we have an existing visitor ID but no conversation, we can re-request config
    const reqBody: any = {
      plugin_key: pluginKey,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    const res = await fetch(`${BASE_URL}/api/public/live-chat/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      throw new Error("Session creation failed");
    }

    const data = await res.json();
    const newVisitorId = data.visitor_id;
    const newSessionToken = data.session_token;

    setVisitorId(newVisitorId);
    setSessionToken(newSessionToken);
    setConfig(data.config);

    localStorage.setItem(getStorageKey("visitor"), newVisitorId);
    localStorage.setItem(getStorageKey("session"), newSessionToken);

    // Connect to Socket.IO
    realtimeService.connectVisitor(newVisitorId, newSessionToken);
  };

  // Start initialization on mount
  useEffect(() => {
    initializeWidget();
    return () => {
      realtimeService.disconnect();
    };
  }, [initializeWidget]);

  // Scroll viewport to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join conversation when created or loaded
  useEffect(() => {
    if (conversationId && visitorId && sessionToken) {
      realtimeService.joinConversation(conversationId as any);
    }
  }, [conversationId, visitorId, sessionToken]);

  // Set up socket listeners
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (String(data.conversation_id) === String(conversationId)) {
        const msgId = String(data.message.id);
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === msgId)) return prev;
          // Replace temporary optimistic message
          if (data.message.sender_type === "visitor") {
            const tempIndex = prev.findIndex(
              (m) => m.id.startsWith("temp-") && m.message === data.message.message
            );
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = { ...data.message, id: msgId };
              return next;
            }
          }
          return [...prev, data.message];
        });
      }
    };

    const handleUserTyping = (data: any) => {
      if (String(data.conversation_id) === String(conversationId)) {
        // If the typing user is an agent/bot (not the visitor themselves)
        if (data.user_id !== visitorId) {
          setIsTyping(data.is_typing);
        }
      }
    };

    const handleMessageRead = (data: any) => {
      if (String(data.conversation_id) === String(conversationId)) {
        setMessages((prev) =>
          prev.map((m) => (m.sender_type === "visitor" ? { ...m, is_read: true } : m))
        );
      }
    };

    realtimeService.on("new_message", handleNewMessage);
    realtimeService.on("user_typing", handleUserTyping);
    realtimeService.on("message_read", handleMessageRead);

    return () => {
      realtimeService.off("new_message", handleNewMessage);
      realtimeService.off("user_typing", handleUserTyping);
      realtimeService.off("message_read", handleMessageRead);
    };
  }, [conversationId, visitorId]);

  // Start new conversation channel
  const startConversation = async (initialText: string) => {
    if (!visitorId || !sessionToken) return null;
    try {
      const res = await fetch(`${BASE_URL}/api/public/live-chat/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: visitorId,
          session_token: sessionToken,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await res.json();
      const newConvId = data.conversation_id;
      setConversationId(newConvId);
      localStorage.setItem(getStorageKey("conversation"), newConvId);

      // Join socket room
      await realtimeService.joinConversation(newConvId as any);

      // Send the first message
      return newConvId;
    } catch (err) {
      console.error("[Saadhyam Widget] Conversation creation error:", err);
      toast.error("Failed to start conversation. Please try again.");
      return null;
    }
  };

  // Send message implementation
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    let activeConvId = conversationId;
    
    // Set optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: activeConvId || "",
      sender_type: "visitor",
      sender_id: visitorId,
      message: text,
      message_type: "text",
      attachment_url: null,
      is_read: false,
      ai_generated: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Create conversation on demand if it doesn't exist yet
    if (!activeConvId) {
      activeConvId = await startConversation(text);
      if (!activeConvId) {
        // Rollback optimistic message on fail
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
    }

    try {
      const res = await fetch(
        `${BASE_URL}/api/public/live-chat/conversation/${activeConvId}/messages?visitor_id=${encodeURIComponent(
          visitorId!
        )}&session_token=${encodeURIComponent(sessionToken!)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            message_type: "text",
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const sentMsg = await res.json();
      
      // Update optimistic message with real DB response fields
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...sentMsg, id: String(sentMsg.id) } : m))
      );

      // Trigger socket send synchronisation
      if (realtimeService.isConnected()) {
        const socket = (realtimeService as any).socket;
        if (socket) {
          socket.emit("send_message", {
            conversation_id: activeConvId,
            message: sentMsg,
          });
        }
      }
    } catch (err) {
      console.error("[Saadhyam Widget] Send error:", err);
      // Mark optimistic message as failed/remove or toast error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Failed to send message.");
    }
  };

  const toggleOpen = () => setIsOpen((prev) => !prev);

  // Return primary color styling configurations
  const themeColor = config?.primary_color || "#8B5CF6";

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-4 bg-white/95 dark:bg-gray-900/95 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800">
        <p className="text-sm text-destructive font-medium text-center mb-4">{error}</p>
        <button
          onClick={initializeWidget}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent select-none">
      {isOpen ? (
        <ChatWindow
          config={config || {
            business_name: "Saadhyam Support",
            welcome_message: "Hello! How can we help you today?",
            primary_color: "#8B5CF6",
            position: "bottom_right",
          }}
          messages={messages}
          onClose={toggleOpen}
          onSendMessage={sendMessage}
          isTyping={isTyping}
          conversationId={conversationId}
          messagesEndRef={messagesEndRef}
        />
      ) : (
        <ChatButton onClick={toggleOpen} themeColor={themeColor} />
      )}
    </div>
  );
}
