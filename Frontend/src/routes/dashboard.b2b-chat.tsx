import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Building2, 
  Clock,
  Check,
  CheckCheck,
  Loader2,
  UserPlus,
  X,
  Wifi,
  WifiOff,
  AlertCircle,
  MoreVertical,
  Lock,
  Shield,
  Trash2,
  MapPin,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";
import { apiClient } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/dashboard/b2b-chat")({
  head: () => ({ meta: [{ title: "B2B Chat — Saadhyam AI" }] }),
  component: B2BChatPage,
});

interface ChatRoom {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_business: string | null;
  other_user_business_description?: string | null;
  other_user_business_location?: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_business: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  status?: "sending" | "sent" | "delivered" | "read";
}

interface ConnectionRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_business: string | null;
  receiver_id: string;
  status: string;
  message: string | null;
  created_at: string;
}

const parseISOOrUTC = (dateStr: string | Date | null | undefined): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  try {
    let formatted = String(dateStr).trim().replace(" ", "T");
    
    // Normalize microsecond precision to millisecond precision (e.g., .123456 -> .123)
    const dotIndex = formatted.indexOf(".");
    if (dotIndex !== -1) {
      let endDigitsIndex = dotIndex + 1;
      while (endDigitsIndex < formatted.length && /\d/.test(formatted[endDigitsIndex])) {
        endDigitsIndex++;
      }
      const digits = formatted.substring(dotIndex + 1, endDigitsIndex);
      if (digits.length > 3) {
        formatted = formatted.substring(0, dotIndex + 4) + formatted.substring(endDigitsIndex);
      }
    }
    
    // If it doesn't have a timezone indicator (Z or +HH:MM or -HH:MM or +HHMM or -HHMM), append Z
    if (!/Z|[+-]\d{2}:?\d{2}$/.test(formatted)) {
      formatted = `${formatted}Z`;
    }
    
    const d = new Date(formatted);
    if (!isNaN(d.getTime())) {
      return d;
    }
  } catch (e) {
    console.error("Error parsing date:", e);
  }
  return new Date(String(dateStr));
};

const formatMessageTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = parseISOOrUTC(dateStr);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRoomTime = (dateStr: string | null) => {
  if (!dateStr) return "";
  const date = parseISOOrUTC(dateStr);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }
};


const getAvatarColor = (name: string) => {
  const colors = [
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getFriendlyDate = (date: Date) => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

function B2BChatPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedRoomRef = useRef<ChatRoom | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [usePolling, setUsePolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Get currentUserId only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem("saadhyam_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) {
            setCurrentUserId(user.id.toString());
            return;
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
      setCurrentUserId(localStorage.getItem("user_id"));
    }
  }, []);

  // Keep selectedRoomRef in sync
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatRooms = useCallback(async () => {
    try {
      const data = await apiClient.get<ChatRoom[]>("/api/b2b-chat/rooms");
      setChatRooms(data);
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      toast.error("Failed to load chat rooms");
    }
  }, []);

  const loadPendingRequests = useCallback(async () => {
    try {
      const data = await apiClient.get<ConnectionRequest[]>("/api/b2b-chat/connections/requests");
      setPendingRequests(data);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const data = await apiClient.get<any[]>(`/api/b2b-chat/rooms/${roomId}/messages`);
      const formatted = data.map((msg: any) => ({ ...msg, id: String(msg.id) }));
      setMessages(formatted);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  // Auto-select room from query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId && chatRooms.length > 0) {
      const room = chatRooms.find((r) => String(r.id) === String(roomId));
      if (room) {
        setSelectedRoom(room);
        // Clear query parameter so it doesn't keep resetting/triggering
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [chatRooms]);

  // Initial data load on mount
  useEffect(() => {
    Promise.all([
      loadChatRooms(),
      loadPendingRequests()
    ]).finally(() => {
      setLoading(false);
    });
  }, [loadChatRooms, loadPendingRequests]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUserId) return; // Wait for currentUserId to be set
    
    console.log("🔌 Initializing Socket.IO...");
    
    const socket = io(env.socketUrl, {
      auth: { user_id: currentUserId },
      transports: ["websocket", "polling"],
      timeout: 10000, // 10 second connection timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected");
      setConnectionStatus("connected");
      toast.dismiss(); // Dismiss any connection error toasts
    });
    
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
      setConnectionStatus("disconnected");
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });
    
    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
      setConnectionStatus("error");
      toast.error("Real-time connection failed. Messages may not update automatically.", {
        id: "socket-error",
        duration: 5000,
      });
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`);
      setConnectionStatus("connected");
      toast.success("Real-time connection restored!", {
        id: "socket-reconnect",
        duration: 3000,
      });
    });

    socket.on("reconnect_error", (error) => {
      console.error("❌ Socket.IO reconnection failed:", error);
      setConnectionStatus("error");
      
      // After multiple failed reconnection attempts, fall back to polling
      setUsePolling(true);
      toast.error("Real-time connection failed. Using fallback mode.", {
        id: "socket-reconnect-error",
        duration: 8000,
      });
    });

    socket.on("new_message", (data: any) => {
      console.log("📨 New message received:", data);
      
      // Use ref to get current room
      const currentRoom = selectedRoomRef.current;
      
      if (currentRoom && String(data.conversation_id) === String(currentRoom.id)) {
        setMessages((prev) => {
          // Normalize IDs to strings for comparison
          const messageId = String(data.message.id);
          const exists = prev.some(msg => String(msg.id) === messageId);
          if (exists) {
            return prev;
          }

          // If the message is from the current user, check if we have a temporary optimistic message
          // with the same content that we can replace to prevent duplicate rendering.
          const isCurrentUser = String(data.message.sender_id) === String(currentUserId);
          if (isCurrentUser) {
            const tempIndex = prev.findIndex(
              (msg) =>
                typeof msg.id === "string" &&
                msg.id.startsWith("temp-") &&
                msg.message === data.message.message
            );
            if (tempIndex !== -1) {
              console.log("✅ Replacing optimistic message with real message");
              const next = [...prev];
              next[tempIndex] = {
                ...data.message,
                id: messageId,
                status: "sent"
              };
              return next;
            }
          }

          console.log("✅ Adding message to chat");
          return [...prev, { ...data.message, id: messageId }];
        });
      }
      
      loadChatRooms();
    });

    socket.on("chat_cleared", (data: any) => {
      console.log("🧹 Chat cleared event received:", data);
      const currentRoom = selectedRoomRef.current;
      if (currentRoom && String(data.conversation_id) === String(currentRoom.id)) {
        setMessages([]);
      }
      loadChatRooms();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, loadChatRooms]);

  // Polling fallback when Socket.IO fails
  useEffect(() => {
    if (!usePolling || !selectedRoom) return;

    console.log("🔄 Starting polling fallback for messages...");
    
    const pollMessages = async () => {
      try {
        const data = await apiClient.get<any[]>(`/api/b2b-chat/rooms/${selectedRoom.id}/messages`);
        const formatted = data.map((msg: any) => ({ ...msg, id: String(msg.id) }));
        setMessages(formatted);
      } catch (error) {
        console.error("❌ Polling error:", error);
      }
    };

    // Poll every 3 seconds when using fallback
    pollingIntervalRef.current = setInterval(pollMessages, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [usePolling, selectedRoom]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (selectedRoom && socketRef.current) {
      loadMessages(selectedRoom.id);
      socketRef.current.emit("join_conversation", {
        conversation_id: selectedRoom.id,
        user_id: currentUserId,
      });
      console.log(`🚪 Joined room: ${selectedRoom.id}`);

      return () => {
        socketRef.current?.emit("leave_conversation", {
          conversation_id: selectedRoom.id,
          user_id: currentUserId,
        });
      };
    }
  }, [selectedRoom, currentUserId, loadMessages]);

  const retryConnection = useCallback(() => {
    if (socketRef.current) {
      console.log("🔄 Manually retrying Socket.IO connection...");
      setConnectionStatus("connecting");
      setUsePolling(false);
      socketRef.current.connect();
    }
  }, []);

  const handleClearChat = useCallback(async () => {
    if (!selectedRoom) return;
    
    const confirmClear = window.confirm("Are you sure you want to clear this chat? All message history will be permanently deleted for both participants.");
    if (!confirmClear) return;
    
    try {
      await apiClient.post(`/api/b2b-chat/rooms/${selectedRoom.id}/clear`, {});
      setMessages([]);
      loadChatRooms();
      toast.success("Chat cleared successfully");
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  }, [selectedRoom, loadChatRooms]);

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault(); // Always prevent default form submission
    if (!newMessage.trim() || !selectedRoom || sendingMessage) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage: Message = {
      id: tempId,
      room_id: selectedRoom.id,
      sender_id: currentUserId || "",
      sender_name: "You",
      sender_business: null,
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      setSendingMessage(true);
      const data = await apiClient.post(`/api/b2b-chat/rooms/${selectedRoom.id}/messages`, { message: messageText });

      setMessages((prev) => {
        const realId = String(data.message_id);
        const alreadyExists = prev.some((msg) => String(msg.id) === realId);
        if (alreadyExists) {
          return prev.filter((msg) => msg.id !== tempId);
        }
        return prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, id: realId, created_at: data.created_at, status: "sent" }
            : msg
        );
      });
      loadChatRooms();
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedRoom, sendingMessage, currentUserId, loadChatRooms]);

  const acceptRequest = async (requestId: string) => {
    try {
      await apiClient.post(`/api/b2b-chat/connections/accept/${requestId}`);
      toast.success("Connection accepted!");
      loadPendingRequests();
      loadChatRooms();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await apiClient.post(`/api/b2b-chat/connections/reject/${requestId}`);
      toast.success("Request rejected");
      loadPendingRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const filteredRooms = chatRooms.filter(
    (room) =>
      room.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.other_user_business?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const renderMessages = () => {
    const elements: React.ReactNode[] = [];
    let lastDateStr = "";
    
    messages.forEach((message, index) => {
      const msgDate = parseISOOrUTC(message.created_at);
      const dateOption: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
      const currentDateStr = msgDate.toLocaleDateString([], dateOption);
      
      // If date changes, insert a date divider
      if (currentDateStr !== lastDateStr) {
        elements.push(
          <div key={`date-${currentDateStr}-${index}`} className="flex justify-center my-4 select-none">
            <div className="bg-[#f0edf5]/95 dark:bg-[#1b1633]/95 backdrop-blur-sm text-[11px] font-semibold text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg shadow-sm border border-purple-100/30 dark:border-purple-950/20 uppercase tracking-wide">
              {getFriendlyDate(msgDate)}
            </div>
          </div>
        );
        lastDateStr = currentDateStr;
      }
      
      const isCurrentUser = String(message.sender_id) === String(currentUserId);
      const status = message.status || (message.is_read ? "read" : "sent");
      
      elements.push(
        <div
          key={message.id}
          className={`flex w-full mb-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`relative max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm text-[14px] leading-relaxed break-words ${
              isCurrentUser
                ? "bg-[#ebdfff] text-[#2c006b] dark:bg-[#581c87] dark:text-[#f5f3ff]" // Outgoing: Soft Brand Purple vs Deep Purple
                : "bg-white text-gray-900 dark:bg-[#18132e] dark:text-[#f1f0f5]" // Incoming: White vs Rich Deep Violet-Grey
            }`}
            style={{
              borderTopRightRadius: isCurrentUser ? "0px" : undefined,
              borderTopLeftRadius: !isCurrentUser ? "0px" : undefined,
            }}
          >
            {/* Message text */}
            <p className="pr-12 whitespace-pre-wrap">{message.message}</p>
            
            {/* Time & status badge */}
            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-60 select-none">
              <span>{formatMessageTime(message.created_at)}</span>
              {isCurrentUser && (
                <span className="flex items-center">
                  {status === "sending" && <Clock className="h-3 w-3 text-gray-400" />}
                  {status === "sent" && <Check className="h-3 w-3 text-gray-400" />}
                  {status === "read" && <CheckCheck className="h-3 w-3 text-purple-600 dark:text-purple-400" />}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
    
    return elements;
  };

  return (
    <div data-b2b-chat-container className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4.0rem)] w-full overflow-hidden bg-[#f3f0f8] dark:bg-[#080512]">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-[380px] flex-shrink-0 border-r border-purple-100/50 dark:border-purple-950/30 bg-[#faf9fc] dark:bg-[#0e0a1f] flex flex-col h-full z-20 ${
        selectedRoom ? "hidden md:flex" : "flex"
      }`}>
        {/* Sidebar Header */}
        <div className="flex-shrink-0 h-[60px] bg-[#f0edf5] dark:bg-[#151128] px-4 flex items-center justify-between border-b border-purple-100/50 dark:border-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm shadow-sm select-none">
              {currentUserId ? "ME" : "U"}
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">B2B Chat</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status Indicator */}
            <div className="mr-2">
              {connectionStatus === "connected" && !usePolling && (
                <Wifi className="h-4 w-4 text-green-500 hover:text-green-600 cursor-pointer" title="Connected in real-time" />
              )}
              {connectionStatus === "connecting" && (
                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" title="Connecting to real-time..." />
              )}
              {connectionStatus === "disconnected" && (
                <WifiOff className="h-4 w-4 text-orange-500 hover:text-orange-600 cursor-pointer animate-pulse" title="Disconnected, reconnecting..." onClick={retryConnection} />
              )}
              {(connectionStatus === "error" || usePolling) && (
                <Clock className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" title="Polling Mode enabled" onClick={retryConnection} />
              )}
            </div>
            
            {/* Requests Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRequests(!showRequests)}
              className="relative h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            >
              <UserPlus className="h-5 w-5" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  {pendingRequests.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Requests Panel Banner */}
        <AnimatePresence>
          {showRequests && pendingRequests.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 border-b border-purple-100/50 dark:border-purple-950/30 bg-purple-50/50 dark:bg-purple-950/10"
            >
              <div className="p-3 border-b border-purple-100/50 dark:border-purple-950/20">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                    Connection Requests
                  </h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setShowRequests(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-purple-200/60 bg-[#faf9fc] p-2 dark:bg-[#151128] dark:border-purple-950/50 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                          <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                            {request.sender_name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {request.sender_business || "Business"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5" onClick={() => acceptRequest(request.id)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 py-0.5 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300" onClick={() => rejectRequest(request.id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Input Container */}
        <div className="flex-shrink-0 p-2 bg-[#faf9fc] dark:bg-[#0e0a1f] border-b border-purple-100/50 dark:border-purple-950/30">
          <div className="relative flex items-center bg-[#f0edf5] dark:bg-[#1b1633] rounded-full px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 border-none focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* Chat Rooms Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-purple-100/30 dark:divide-purple-950/20">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-48">
              <MessageCircle className="mb-2 h-10 w-10 text-gray-400 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No conversations yet</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              const initials = getInitials(room.other_user_name);
              const avatarColor = getAvatarColor(room.other_user_name);
              const isUnread = room.unread_count > 0;
              
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition select-none ${
                    isSelected 
                      ? "bg-[#e2daf3] dark:bg-[#201740]" 
                      : "hover:bg-[#f1edf8] dark:hover:bg-[#18132e] bg-transparent"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm shadow-sm ${avatarColor}`}>
                    {initials}
                  </div>
                  
                  {/* Details */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5 h-auto py-0.5">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                        {room.other_user_name}
                      </p>
                      <span className={`text-xs ${isUnread ? "text-purple-600 dark:text-purple-400 font-semibold" : "text-gray-500"}`}>
                        {formatRoomTime(room.last_message_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="truncate text-sm text-gray-500 dark:text-gray-400 max-w-[80%]">
                        {room.other_user_business ? (
                          <span className="text-[11px] font-medium text-purple-600/75 dark:text-purple-400/75 block truncate">
                            {room.other_user_business}
                          </span>
                        ) : null}
                        <span className="truncate text-gray-500 dark:text-gray-400 block mt-0.5">
                          {room.last_message || "No messages yet"}
                        </span>
                      </div>
                      
                      {isUnread && (
                        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500 text-[11px] font-bold text-white px-1">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className={`flex flex-1 flex-col bg-[#f6f4fa] dark:bg-[#090614] overflow-hidden relative h-full ${
        selectedRoom ? "flex" : "hidden md:flex"
      }`}>
        {/* Brand Wallpaper Grid */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#8b5cf6 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        {selectedRoom ? (
          <>
            {/* Active Chat Header */}
            <div className="flex-shrink-0 h-[60px] bg-[#f0edf5] dark:bg-[#151128] px-4 flex items-center justify-between border-b border-purple-100/50 dark:border-purple-950/30 z-10 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
                  onClick={() => setSelectedRoom(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition select-none min-w-0"
                  onClick={() => setShowProfileModal(true)}
                  title="View Business Profile"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm shadow-sm flex-shrink-0 ${getAvatarColor(selectedRoom.other_user_name)}`}>
                    {getInitials(selectedRoom.other_user_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] leading-tight hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate">
                      {selectedRoom.other_user_name}
                    </p>
                    {selectedRoom.other_user_business && (
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate max-w-[200px] sm:max-w-[400px]">
                        {selectedRoom.other_user_business}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#151128] border border-purple-100/20 dark:border-purple-950/40">
                    <DropdownMenuItem 
                      onClick={handleClearChat}
                      className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-invisible z-10">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="bg-white/80 dark:bg-[#18132e]/85 backdrop-blur-sm rounded-xl p-6 shadow-sm max-w-sm border border-purple-100/40 dark:border-purple-950/30">
                    <MessageCircle className="mx-auto mb-3 h-10 w-10 text-purple-500" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">No messages yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Start the conversation by typing a message below!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Action Bar */}
            <div className="flex-shrink-0 h-[60px] bg-[#f0edf5] dark:bg-[#151128] px-4 flex items-center gap-3 border-t border-purple-100/50 dark:border-purple-950/30 z-10">
              <form onSubmit={sendMessage} className="flex flex-1 items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                  autoComplete="off"
                  className="flex-1 bg-white dark:bg-[#1b1633] rounded-lg px-4 py-2 text-sm outline-none text-gray-800 dark:text-gray-200 border-none focus:ring-0 placeholder-gray-500"
                />
                
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendingMessage}
                  className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center flex-shrink-0 shadow-md transition"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-4.5 w-4.5" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Default Screen (Intro) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
            <div className="max-w-md flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full scale-125 animate-pulse" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl">
                  <MessageCircle className="h-12 w-12" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Saadhyam B2B Chat
              </h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Connect and communicate directly with verified business partners in your network. Check request queue to expand your connections.
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-800/60 pt-6 w-full">
                <Lock className="h-3.5 w-3.5" />
                <span>End-to-end encrypted. Powered by Saadhyam AI</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {showProfileModal && selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-[#151128] rounded-2xl w-full max-w-sm border border-purple-100/20 dark:border-purple-950/40 shadow-2xl max-h-[90vh] overflow-y-auto relative p-6 z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Avatar and Info */}
              <div className="text-center mt-3">
                <div className={`h-20 w-20 rounded-full font-bold text-2xl shadow-md flex items-center justify-center mx-auto mb-4 ${getAvatarColor(selectedRoom.other_user_name)}`}>
                  {getInitials(selectedRoom.other_user_name)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {selectedRoom.other_user_name}
                </h3>
                {selectedRoom.other_user_business && (
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 uppercase tracking-wider">
                    {selectedRoom.other_user_business}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Business Description
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-purple-50/30 dark:bg-purple-950/10 p-3 rounded-xl border border-purple-100/10 min-h-[70px] max-h-[180px] overflow-y-auto">
                    {selectedRoom.other_user_business_description || (
                      <span className="italic text-gray-400 dark:text-gray-500 text-xs">No business description provided.</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-purple-50/30 dark:bg-purple-950/10 p-3 rounded-xl border border-purple-100/10 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span>{selectedRoom.other_user_business_location || (
                      <span className="italic text-gray-400 dark:text-gray-500 text-xs">Location not specified.</span>
                    )}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
