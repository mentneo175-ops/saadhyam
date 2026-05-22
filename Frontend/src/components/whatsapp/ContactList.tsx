import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, User, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";

interface Conversation {
  customer_phone: string;
  customer_name?: string;
  last_message?: string;
  last_message_time: string;
  unread_count: number;
  message_count: number;
  direction: string;
}

interface ContactListProps {
  selectedContact: string | null;
  onSelectContact: (phone: string) => void;
}

export function ContactList({ selectedContact, onSelectContact }: ContactListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/messages/conversations?limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.customer_phone.includes(searchLower) ||
      conv.customer_name?.toLowerCase().includes(searchLower) ||
      conv.last_message?.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle size={20} />
          Conversations
        </CardTitle>
        <div className="relative mt-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle size={48} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.customer_phone}
                  onClick={() => onSelectContact(conv.customer_phone)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    selectedContact === conv.customer_phone ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {conv.customer_name
                        ? conv.customer_name.charAt(0).toUpperCase()
                        : <User size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {conv.customer_name || conv.customer_phone}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(conv.last_message_time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.direction === "outgoing" && "You: "}
                          {conv.last_message || "No messages"}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
