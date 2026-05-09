import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, X, Sparkles, User, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  customer_phone: string;
  customer_name?: string;
  message?: string;
  message_type: string;
  direction: string;
  status: string;
  timestamp: string;
  ai_generated: boolean;
  media_url?: string;
}

interface ChatWindowProps {
  customerPhone: string;
  onClose: () => void;
}

export function ChatWindow({ customerPhone, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [customerPhone]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/whatsapp/messages/conversation/${encodeURIComponent(customerPhone)}?limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAiSuggestion = async () => {
    try {
      setLoadingAi(true);
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/whatsapp/messages/ai-suggestion?customer_phone=${encodeURIComponent(customerPhone)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAiSuggestion(data.suggestion);
        toast.success("AI suggestion generated!");
      } else {
        toast.error("Failed to generate AI suggestion");
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast.error("Failed to generate AI suggestion");
    } finally {
      setLoadingAi(false);
    }
  };

  const sendMessage = async (useAi: boolean = false) => {
    const text = useAi ? aiSuggestion : messageText;
    
    if (!text?.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem("saadhyam_token");
      
      const response = await fetch(
        "http://localhost:8000/api/whatsapp/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: customerPhone,
            message: text,
            use_ai: false,
          }),
        }
      );

      if (response.ok) {
        toast.success("Message sent!");
        setMessageText("");
        setAiSuggestion(null);
        loadMessages();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check size={14} className="text-muted-foreground" />;
      case "delivered":
      case "read":
        return <CheckCheck size={14} className="text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
              {messages[0]?.customer_name
                ? messages[0].customer_name.charAt(0).toUpperCase()
                : <User size={20} />}
            </div>
            <div>
              <CardTitle className="text-lg">
                {messages[0]?.customer_name || customerPhone}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{customerPhone}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.direction === "outgoing"
                        ? "bg-emerald-600 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {msg.message && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      msg.direction === "outgoing" ? "text-emerald-100" : "text-muted-foreground"
                    }`}>
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.direction === "outgoing" && getStatusIcon(msg.status)}
                      {msg.ai_generated && (
                        <Sparkles size={12} className="ml-1" title="AI Generated" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                  AI Suggestion
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {aiSuggestion}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => sendMessage(true)}
                  disabled={sending}
                  className="h-7 px-2"
                >
                  <Send size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAiSuggestion(null)}
                  className="h-7 px-2"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(false);
                }
              }}
              className="min-h-[60px] max-h-[120px] resize-none"
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => sendMessage(false)}
                disabled={sending || !messageText.trim()}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
              <Button
                onClick={getAiSuggestion}
                disabled={loadingAi || messages.length === 0}
                size="sm"
                variant="outline"
                title="Get AI suggestion"
              >
                {loadingAi ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
