import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Building2,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/chat")({
  component: ChatPage,
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
}

function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current user ID from stored user data
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem("saadhyam_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id?.toString();
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    return null;
  };
  
  const currentUserId = getCurrentUserId();

  // Get room ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId) {
      loadRooms().then(() => {
        const room = rooms.find((r) => r.id === roomId);
        if (room) {
          setSelectedRoom(room);
          loadMessages(roomId);
        }
      });
    } else {
      loadRooms();
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRooms = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token"); // Fixed: was "token"
      const response = await fetch("http://localhost:8000/api/b2b-chat/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      toast.error("Failed to load chat rooms");
    }
  };

  const loadMessages = async (roomId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("saadhyam_token"); // Fixed: was "token"
      const response = await fetch(
        `http://localhost:8000/api/b2b-chat/rooms/${roomId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    setSending(true);
    try {
      const token = localStorage.getItem("saadhyam_token"); // Fixed: was "token"
      const response = await fetch(
        `http://localhost:8000/api/b2b-chat/rooms/${selectedRoom.id}/messages?message=${encodeURIComponent(newMessage)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNewMessage("");
        loadMessages(selectedRoom.id);
        loadRooms(); // Refresh room list to update last message
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    loadMessages(room.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Chat Rooms List */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            B2B Chats
          </h2>
        </div>

        <div className="overflow-y-auto h-[calc(100%-5rem)]">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-2">
                Connect with businesses to start chatting
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <motion.div
                key={room.id}
                whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.05)" }}
                onClick={() => handleRoomSelect(room)}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id
                    ? "bg-purple-50 dark:bg-purple-900/20"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {room.other_user_name}
                      </h3>
                      {room.unread_count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    {room.other_user_business && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {room.other_user_business}
                      </p>
                    )}
                    {room.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {room.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRoom(null)}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedRoom.other_user_name}
                  </h3>
                  {selectedRoom.other_user_business && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.other_user_business}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Clock className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.sender_id === currentUserId;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Select a conversation</p>
              <p className="text-sm mt-2">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
