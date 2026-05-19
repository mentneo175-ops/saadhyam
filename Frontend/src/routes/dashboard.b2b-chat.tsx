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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

export const Route = createFileRoute("/dashboard/b2b-chat")({
  head: () => ({ meta: [{ title: "B2B Chat — Saadhyam AI" }] }),
  component: B2BChatPage,
});

interface ChatRoom {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_business: string | null;
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

  // Get currentUserId only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
      const token = localStorage.getItem("saadhyam_token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch("http://localhost:8000/api/b2b-chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data);
      } else {
        console.error("Failed to load chat rooms:", response.status);
        toast.error("Failed to load chat rooms");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("Chat rooms request timed out");
        toast.error("Request timed out. Please check your connection.");
      } else {
        console.error("Error loading chat rooms:", error);
        toast.error("Failed to load chat rooms");
      }
    }
  }, []);

  const loadPendingRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        "http://localhost:8000/api/b2b-chat/connections/requests",
        { 
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      } else {
        console.error("Failed to load pending requests:", response.status);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("Pending requests timed out");
      } else {
        console.error("Error loading pending requests:", error);
      }
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/b2b-chat/rooms/${roomId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    if (!currentUserId) return; // Wait for currentUserId to be set
    
    console.log("🔌 Initializing Socket.IO...");
    
    const socket = io("http://localhost:8000", {
      auth: { user_id: currentUserId },
      transports: ["websocket", "polling"],
      timeout: 10000, // 10 second connection timeout
    });

    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket.IO connected"));
    socket.on("disconnect", () => console.log("❌ Socket.IO disconnected"));
    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
      toast.error("Real-time connection failed. Messages may not update automatically.");
    });

    socket.on("new_message", (data: any) => {
      console.log("📨 New message received:", data);
      
      // Use ref to get current room
      const currentRoom = selectedRoomRef.current;
      
      if (currentRoom && data.conversation_id === currentRoom.id) {
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === data.message.id);
          if (!exists) {
            console.log("✅ Adding message to chat");
            return [...prev, data.message];
          }
          return prev;
        });
      }
      
      loadChatRooms();
    });

    // Load data with timeout handling
    Promise.all([
      loadChatRooms(),
      loadPendingRequests()
    ]).finally(() => {
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, loadChatRooms, loadPendingRequests]);

  // Join/leave rooms
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
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/b2b-chat/rooms/${selectedRoom.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: messageText }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: data.message_id, created_at: data.created_at, status: "sent" }
              : msg
          )
        );
        loadChatRooms();
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(messageText);
        toast.error("Failed to send message");
      }
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
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/b2b-chat/connections/accept/${requestId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        toast.success("Connection accepted!");
        loadPendingRequests();
        loadChatRooms();
      }
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/b2b-chat/connections/reject/${requestId}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        toast.success("Request rejected");
        loadPendingRequests();
      }
    } catch (error) {
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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title="B2B Chat"
            subtitle="Connect and communicate with business partners"
          />
          <Button
            variant="outline"
            onClick={() => setShowRequests(!showRequests)}
            className="relative"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {pendingRequests.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showRequests && pendingRequests.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 border-b border-border bg-purple-50 dark:bg-purple-900/10"
          >
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Pending Connection Requests
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowRequests(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-white p-3 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.sender_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.sender_business || "Business"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptRequest(request.id)}>
                        <Check className="mr-1 h-3 w-3" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectRequest(request.id)}>
                        <X className="mr-1 h-3 w-3" />
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

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="flex-shrink-0 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full border-b border-border p-4 text-left transition hover:bg-muted ${
                    selectedRoom?.id === room.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {room.other_user_name}
                        </p>
                        {room.unread_count > 0 && (
                          <span className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                      {room.other_user_business && (
                        <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                          {room.other_user_business}
                        </p>
                      )}
                      {room.last_message && (
                        <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                          {room.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-background overflow-hidden">
          {selectedRoom ? (
            <>
              <div className="flex-shrink-0 border-b border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedRoom.other_user_name}
                    </p>
                    {selectedRoom.other_user_business && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedRoom.other_user_business}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.sender_id === currentUserId;
                      const status = message.status || (message.is_read ? "read" : "sent");
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isCurrentUser
                                ? "bg-purple-600 text-white"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                              {isCurrentUser && (
                                <>
                                  {status === "sending" && <Clock className="ml-1 h-3 w-3" />}
                                  {status === "sent" && <Check className="ml-1 h-3 w-3" />}
                                  {status === "read" && <CheckCheck className="ml-1 h-3 w-3" />}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-border bg-card p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Select a conversation
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a chat room from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
