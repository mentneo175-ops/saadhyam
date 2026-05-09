import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ContactList } from "./ContactList";
import { ChatWindow } from "./ChatWindow";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ConnectionStatus {
  is_connected: boolean;
  phone_number?: string;
  business_name?: string;
}

interface ChatDashboardProps {
  connectionStatus: ConnectionStatus;
}

interface MessageStats {
  total_messages: number;
  total_conversations: number;
  unread_count: number;
  sent_today: number;
  received_today: number;
}

export function ChatDashboard({ connectionStatus }: ChatDashboardProps) {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        "http://localhost:8000/api/whatsapp/messages/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.total_conversations || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total Conversations
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.unread_count || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Unread Messages
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.total_messages || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total Messages
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.sent_today || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Sent Today
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-pink-600">
              {stats?.received_today || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Received Today
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="grid lg:grid-cols-3 gap-4 h-[600px]">
        {/* Contact List */}
        <div className="lg:col-span-1">
          <ContactList
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
          />
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedContact ? (
            <ChatWindow
              customerPhone={selectedContact}
              onClose={() => setSelectedContact(null)}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
