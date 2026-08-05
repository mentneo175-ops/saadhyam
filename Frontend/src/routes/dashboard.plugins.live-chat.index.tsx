import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  Mail,
  Phone,
  Laptop,
  Globe,
  Compass,
  Trash2,
  Bot,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Settings,
  Copy,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { realtimeService } from "@/lib/realtimeService";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/plugins/live-chat/")({
  head: () => ({
    meta: [{ title: "Live Chat Support — Saadhyam AI" }],
  }),
  component: LiveChatPage,
});

// Types based on Backend schemas
interface Visitor {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ip_address: string | null;
  browser: string | null;
  device: string | null;
  location: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: number;
  visitor_id: string;
  status: "active" | "waiting" | "closed";
  department: string | null;
  assigned_agent_id: number | null;
  ai_enabled: boolean;
  summary: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  visitor_name?: string; // UI convenience helper
}

interface Message {
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

const parseISOOrUTC = (dateStr: string | Date | null | undefined): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  try {
    let formatted = String(dateStr).trim().replace(" ", "T");
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

const getInitials = (name: string | null) => {
  if (!name) return "V";
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

function LiveChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "waiting" | "closed">("all");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isVisitorTyping, setIsVisitorTyping] = useState(false);
  const [isPatching, setIsPatching] = useState(false);

  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState({
    business_name: "",
    welcome_message: "",
    primary_color: "#8B5CF6",
    position: "bottom_right",
    public_key: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);

  // Sync selectedConversationRef
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Load current user context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("saadhyam_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) {
            const uid = Number(user.id);
            setCurrentUserId(uid);
            realtimeService.connect(uid);
          }
        } catch (e) {
          console.error("Error parsing user context:", e);
        }
      }
    }
  }, []);

  // Fetch all conversations belonging to workspace
  const loadConversations = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      // Consume GET /api/live-chat/conversations
      const res = await apiClient.get<{ conversations: Conversation[], total: number }>("/api/live-chat/conversations");
      
      // Enhance conversations list with default visitor names
      const enhanced = res.conversations.map((c) => ({
        ...c,
        visitor_name: c.visitor_id.slice(0, 8).toUpperCase()
      }));
      
      setConversations(enhanced);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await apiClient.get<any>("/api/live-chat/settings");
      setWidgetSettings({
        business_name: data.business_name || "",
        welcome_message: data.welcome_message || "",
        primary_color: data.primary_color || "#8B5CF6",
        position: data.position || "bottom_right",
        public_key: data.public_key || "",
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load widget settings");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Save settings to backend
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await apiClient.post<any>("/api/live-chat/settings", {
        business_name: widgetSettings.business_name,
        welcome_message: widgetSettings.welcome_message,
        primary_color: widgetSettings.primary_color,
        position: widgetSettings.position,
      });
      setWidgetSettings((prev) => ({ ...prev, ...res.config }));
      toast.success("Widget settings saved successfully!");
      setSettingsOpen(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Copy embed script to clipboard
  const copyEmbedScript = () => {
    if (!widgetSettings.public_key) return;
    const script = `<script src="${env.appUrl}/live-chat/widget.js" data-plugin-key="${widgetSettings.public_key}" async><\/script>`;
    navigator.clipboard.writeText(script).then(() => {
      setScriptCopied(true);
      toast.success("Embed script copied to clipboard!");
      setTimeout(() => setScriptCopied(false), 3000);
    });
  };

  // Open settings: load data first
  const openSettings = async () => {
    setSettingsOpen(true);
    await loadSettings();
  };

  // Load details & messages for selected conversation
  const loadConversationDetails = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    try {
      // Consume GET /api/live-chat/conversations/{id}
      const data = await apiClient.get<any>(`/api/live-chat/conversations/${convId}`);
      
      // Update selected conversation metadata
      setSelectedConversation({
        ...data.conversation,
        visitor_name: data.visitor.name || data.visitor.id.slice(0, 8).toUpperCase()
      });
      setVisitor(data.visitor);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading conversation detail:", error);
      toast.error("Failed to load conversation details");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Select conversation triggers detail load
  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadConversationDetails(conv.id);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket event subscription hook
  useEffect(() => {
    if (!selectedConversation) return;
    const convId = selectedConversation.id;

    // Join room conversation_{conversation_id}
    realtimeService.joinConversation(convId as any);

    const handleNewMessage = (data: any) => {
      if (String(data.conversation_id) === String(convId)) {
        setMessages((prev) => {
          const msgId = String(data.message.id);
          const alreadyExists = prev.some((m) => String(m.id) === msgId);
          if (alreadyExists) return prev;

          // Replace temporary optimistic message
          const isCurrentUser = data.message.sender_type === "agent" && String(data.message.sender_id) === String(currentUserId);
          if (isCurrentUser) {
            const tempIndex = prev.findIndex(
              (m) => m.id.startsWith("temp-") && m.message === data.message.message
            );
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = { ...data.message, id: msgId };
              return next;
            }
          }
          return [...prev, { ...data.message, id: msgId }];
        });
        
        loadConversations(false);
      }
    };

    const handleUserTyping = (data: any) => {
      if (String(data.conversation_id) === String(convId)) {
        // Only trigger typing indicator if the typist is NOT the agent
        if (String(data.user_id) !== String(currentUserId)) {
          setIsVisitorTyping(data.is_typing);
        }
      }
    };

    const handleMessageRead = (data: any) => {
      if (String(data.conversation_id) === String(convId)) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(data.message_id) || m.created_at <= data.read_at
              ? { ...m, is_read: true }
              : m
          )
        );
      }
    };

    realtimeService.on("new_message", handleNewMessage);
    realtimeService.on("user_typing", handleUserTyping);
    realtimeService.on("message_read", handleMessageRead);

    return () => {
      realtimeService.leaveConversation(convId as any);
      realtimeService.off("new_message", handleNewMessage);
      realtimeService.off("user_typing", handleUserTyping);
      realtimeService.off("message_read", handleMessageRead);
      setIsVisitorTyping(false);
    };
  }, [selectedConversation, currentUserId, loadConversations]);

  // Typing event trigger
  const handleComposerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedConversation) {
      if (e.target.value.trim() !== "") {
        realtimeService.startTyping(selectedConversation.id as any);
      } else {
        realtimeService.stopTyping(selectedConversation.id as any);
      }
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_type: "agent",
      sender_id: currentUserId ? String(currentUserId) : null,
      message: messageText,
      message_type: "text",
      attachment_url: null,
      is_read: false,
      ai_generated: false,
      created_at: timestamp,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    realtimeService.stopTyping(selectedConversation.id as any);

    try {
      setSendingMessage(true);
      // Consume POST /api/live-chat/conversations/{id}/messages
      const res = await apiClient.post<Message>(`/api/live-chat/conversations/${selectedConversation.id}/messages`, {
        message: messageText,
        message_type: "text"
      });

      setMessages((prev) => {
        const realId = String(res.id);
        const alreadyExists = prev.some((m) => String(m.id) === realId);
        if (alreadyExists) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) =>
          m.id === tempId ? { ...res, id: realId } : m
        );
      });
      
      loadConversations(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // PATCH conversation details
  const updateConversationMeta = async (fields: {
    status?: "active" | "waiting" | "closed";
    department?: string | null;
    assigned_agent_id?: number | null;
    ai_enabled?: boolean;
  }) => {
    if (!selectedConversation || isPatching) return;

    try {
      setIsPatching(true);
      const token = apiClient.getToken();
      
      // Consume PATCH /api/live-chat/conversations/{id} via fetch
      const response = await fetch(`${env.apiBaseUrl}/api/live-chat/conversations/${selectedConversation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });

      if (!response.ok) {
        throw new Error("Failed to patch conversation");
      }

      const updated = await response.json();
      
      // Update selected conversation in state
      setSelectedConversation((prev) => prev ? {
        ...prev,
        ...updated,
        visitor_name: prev.visitor_name
      } : null);
      
      // Refresh list to sync badges/departments
      loadConversations(false);
      toast.success("Settings updated");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsPatching(false);
    }
  };

  // DELETE conversation
  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this conversation? All chat history will be permanently erased.");
    if (!confirmDelete) return;

    try {
      // Consume DELETE /api/live-chat/conversations/{id}
      await apiClient.delete(`/api/live-chat/conversations/${selectedConversation.id}`);
      setSelectedConversation(null);
      setVisitor(null);
      setMessages([]);
      loadConversations();
      toast.success("Conversation deleted successfully");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesStatus =
      activeFilter === "all" || c.status === activeFilter;
      
    const searchTarget = (c.visitor_name || "").toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const renderMessageList = () => {
    const listElements: React.ReactNode[] = [];
    let lastDateLabel = "";

    messages.forEach((msg, idx) => {
      const msgDate = parseISOOrUTC(msg.created_at);
      const formattedDateLabel = msgDate.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });

      if (formattedDateLabel !== lastDateLabel) {
        listElements.push(
          <div key={`date-divider-${formattedDateLabel}-${idx}`} className="flex justify-center my-4 select-none">
            <div className="bg-[#f0edf5]/90 dark:bg-[#1b1633]/90 text-[10px] font-bold text-purple-700 dark:text-purple-300 px-3 py-1 rounded-md shadow-sm border border-purple-100/20 uppercase tracking-wider">
              {getFriendlyDate(msgDate)}
            </div>
          </div>
        );
        lastDateLabel = formattedDateLabel;
      }

      const isCurrentUser = msg.sender_type === "agent";
      
      listElements.push(
        <div key={msg.id} className={`flex w-full mb-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
          <div className="flex flex-col max-w-[70%]">
            {/* Sender header for non-agents */}
            {!isCurrentUser && (
              <span className="text-[10px] text-muted-foreground ml-1.5 mb-0.5 font-medium select-none capitalize">
                {msg.sender_type === "ai" ? "🤖 AI Assistant" : "👤 Visitor"}
              </span>
            )}
            
            <div
              className={`relative rounded-xl px-3.5 py-2 shadow-sm text-sm leading-relaxed break-words ${
                isCurrentUser
                  ? "bg-purple-600 text-white"
                  : msg.sender_type === "ai"
                  ? "bg-purple-50 text-purple-900 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/30"
                  : "bg-white text-foreground border border-border dark:bg-zinc-900"
              }`}
              style={{
                borderTopRightRadius: isCurrentUser ? "0px" : undefined,
                borderTopLeftRadius: !isCurrentUser ? "0px" : undefined,
              }}
            >
              <p className="whitespace-pre-wrap pr-10">{msg.message}</p>
              
              <div className="absolute bottom-1 right-2.5 flex items-center gap-1 text-[9px] opacity-70 select-none">
                <span>{formatMessageTime(msg.created_at)}</span>
                {isCurrentUser && (
                  <span className="flex items-center">
                    {msg.is_read ? (
                      <CheckCheck className="h-3 w-3 text-purple-200" />
                    ) : (
                      <Check className="h-3 w-3 text-purple-200" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });

    return listElements;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* Title Header */}
      <div className="flex-shrink-0 h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Live Chat Support</h1>
            <p className="text-xs text-muted-foreground">Manage real-time visitor conversations</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadConversations()}
          className="flex items-center gap-2 border-border"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openSettings}
          className="flex items-center gap-2 border-border"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Button>
      </div>

      {/* Three Panel Viewport */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        
        {/* Left Panel: Conversation List */}
        <div className={`w-full md:w-[360px] flex-shrink-0 border-r border-border bg-card flex flex-col h-full ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}>
          {/* Search bar */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search visitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-border bg-background focus-visible:ring-purple-600"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="flex gap-1 overflow-x-auto select-none py-1">
              {(["all", "waiting", "active", "closed"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "ghost"}
                  onClick={() => setActiveFilter(filter)}
                  className={`h-7 px-2.5 text-xs capitalize ${
                    activeFilter === filter
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {/* Scroll List */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1.5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 flex gap-3 border border-transparent rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-5/6" />
                    </div>
                  </div>
                ))
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium">No conversations found</p>
                  <p className="text-xs">Adjust your status filters</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const initials = getInitials(conv.visitor_name || null);
                  const isWaiting = conv.status === "waiting";
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`group p-3 flex gap-3 rounded-xl border border-border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/30"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 bg-background"
                      }`}
                    >
                      <Avatar className="h-10 w-10 border border-border flex-shrink-0 select-none">
                        <AvatarFallback className={`${
                          isSelected ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        } font-semibold text-sm`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-purple-600 transition-colors">
                            {conv.visitor_name}
                          </h3>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatRoomTime(conv.last_message_at || conv.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate flex-1">
                            {conv.summary || "Click to open conversation history"}
                          </p>
                          
                          {/* Unread indicator (visual helper based on waiting state) */}
                          {isWaiting && (
                            <span className="h-2.5 w-2.5 rounded-full bg-purple-600 flex-shrink-0 ring-4 ring-purple-100 dark:ring-purple-950/40" />
                          )}
                        </div>

                        <div className="flex gap-1.5 mt-2.5 select-none">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded font-bold uppercase tracking-wider ${
                            conv.status === "active"
                              ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
                              : conv.status === "waiting"
                              ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-transparent"
                          }`}>
                            {conv.status}
                          </Badge>
                          {conv.department && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded text-muted-foreground bg-zinc-50 border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
                              {conv.department}
                            </Badge>
                          )}
                          {conv.ai_enabled && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded text-purple-600 bg-purple-50/50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/20 flex items-center gap-0.5">
                              <Bot className="h-2.5 w-2.5" /> AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel: Conversation View */}
        <div className={`flex-1 flex flex-col h-full bg-[#f8f7fc] dark:bg-[#0c091d] min-w-0 relative ${
          selectedConversation ? "flex" : "hidden md:flex"
        }`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex-shrink-0 h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9 border border-border select-none">
                    <AvatarFallback className="bg-purple-600 text-white font-semibold text-xs">
                      {getInitials(selectedConversation.visitor_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                        {selectedConversation.visitor_name}
                      </span>
                      <Badge variant="outline" className={`text-[8px] h-4.5 font-bold uppercase tracking-wider ${
                        selectedConversation.status === "active"
                          ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
                          : selectedConversation.status === "waiting"
                          ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-transparent"
                      }`}>
                        {selectedConversation.status}
                      </Badge>
                    </div>
                    {isVisitorTyping ? (
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium animate-pulse">
                        Visitor is typing...
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Online
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteConversation}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    title="Delete Conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Message scroll viewport */}
              <div className="flex-1 min-h-0 w-full overflow-hidden relative p-4 flex flex-col">
                <ScrollArea className="flex-1 pr-1.5">
                  <div className="flex flex-col space-y-1.5 pb-2">
                    {messagesLoading ? (
                      <div className="space-y-4 py-4">
                        <div className="flex gap-2.5 max-w-[60%]">
                          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
                          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse flex-1" />
                        </div>
                        <div className="flex justify-end gap-2.5 max-w-[65%] ml-auto">
                          <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse flex-1" />
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30 animate-bounce" />
                        <p className="text-sm font-semibold">No messages yet</p>
                        <p className="text-xs">Type a message below to start the conversation</p>
                      </div>
                    ) : (
                      renderMessageList()
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Composer */}
              <div className="flex-shrink-0 p-4 border-t border-border bg-card">
                {selectedConversation.status === "closed" ? (
                  <div className="bg-zinc-50 border border-border rounded-xl p-4 text-center dark:bg-zinc-950/20 select-none">
                    <p className="text-xs text-muted-foreground font-medium">
                      This conversation was marked as closed. Reopen status in right panel to send messages.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2.5 items-end">
                    <Textarea
                      placeholder="Type a message... (Press Enter to send)"
                      value={newMessage}
                      onChange={handleComposerChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[44px] max-h-[120px] resize-none py-2.5 border-border bg-background focus-visible:ring-purple-600 rounded-xl scrollbar-none text-sm"
                      rows={1}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 w-11 p-0 flex-shrink-0 flex items-center justify-center shadow-md shadow-purple-600/10 transition-transform active:scale-95"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-2xl transform scale-150 animate-pulse" />
                <div className="relative h-20 w-20 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-xl">
                  <MessageSquare className="h-10 w-10" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Saadhyam Live Chat</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Select a conversation from the left sidebar to view visitor information, session parameters, and message logs.
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Visitor Information */}
        {selectedConversation && visitor && (
          <div className="hidden lg:flex w-[320px] flex-shrink-0 border-l border-border bg-card flex-col h-full z-10 shadow-sm animate-in slide-in-from-right duration-200">
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                
                {/* Visitor Profile Section */}
                <div className="text-center space-y-2">
                  <Avatar className="h-14 w-14 border border-border mx-auto select-none">
                    <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-base">
                      {getInitials(selectedConversation.visitor_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-foreground truncate max-w-[250px] mx-auto">
                      {selectedConversation.visitor_name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                      Visitor ID: {visitor.id.slice(0, 12)}
                    </p>
                  </div>
                </div>

                <Separator className="border-border" />

                {/* Edit Meta Form */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Conversation Controls
                  </h5>
                  
                  {/* Status Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Status</label>
                    <Select
                      value={selectedConversation.status}
                      onValueChange={(val: "active" | "waiting" | "closed") => updateConversationMeta({ status: val })}
                      disabled={isPatching}
                    >
                      <SelectTrigger className="h-9 border-border bg-background focus:ring-purple-600">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="border-border">
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Department</label>
                    <Input
                      placeholder="e.g. Sales, Billing"
                      value={selectedConversation.department || ""}
                      onChange={(e) => setSelectedConversation(prev => prev ? { ...prev, department: e.target.value } : null)}
                      onBlur={() => updateConversationMeta({ department: selectedConversation.department })}
                      disabled={isPatching}
                      className="h-9 border-border bg-background focus-visible:ring-purple-600"
                    />
                  </div>

                  {/* Assigned Agent */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Assigned Agent</label>
                    <Select
                      value={selectedConversation.assigned_agent_id ? "me" : "unassigned"}
                      onValueChange={(val) => {
                        const agentId = val === "me" ? currentUserId : null;
                        updateConversationMeta({ assigned_agent_id: agentId });
                      }}
                      disabled={isPatching}
                    >
                      <SelectTrigger className="h-9 border-border bg-background focus:ring-purple-600">
                        <SelectValue placeholder="Select Agent" />
                      </SelectTrigger>
                      <SelectContent className="border-border">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {currentUserId && (
                          <SelectItem value="me">Me (Agent)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* AI Enabled Toggle */}
                  <div className="flex items-center justify-between py-2 bg-zinc-50 dark:bg-zinc-950/20 px-3 rounded-lg border border-border/80">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-foreground font-medium">AI Auto-Responder</span>
                    </div>
                    <Switch
                      checked={selectedConversation.ai_enabled}
                      onCheckedChange={(checked) => updateConversationMeta({ ai_enabled: checked })}
                      disabled={isPatching}
                    />
                  </div>
                </div>

                <Separator className="border-border" />

                {/* Visitor Fingerprint Metadata */}
                <div className="space-y-3.5">
                  <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Visitor Fingerprint
                  </h5>
                  
                  {/* Contact info list */}
                  <div className="space-y-2.5 text-xs text-foreground">
                    {visitor.email && (
                      <div className="flex items-start gap-2.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span className="truncate" title={visitor.email}>{visitor.email}</span>
                      </div>
                    )}
                    {visitor.phone && (
                      <div className="flex items-start gap-2.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span>{visitor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <span className="truncate" title={visitor.ip_address || "Unknown"}>IP: {visitor.ip_address || "Unknown"}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Compass className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <span>{visitor.location || "Unknown Location"}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Laptop className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <span className="truncate" title={`${visitor.device || "Device"} • ${visitor.browser || "Browser"}`}>
                        {visitor.device || "Unknown Device"} ({visitor.browser || "Browser"})
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 select-none text-[11px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>First visit: {new Date(visitor.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Separator className="border-border" />

                {/* AI Summary Section */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-[#b45309] dark:text-[#f59e0b] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> AI Conversation Summary
                  </h5>
                  <div className="bg-[#fffbeb] border border-[#fef3c7] dark:bg-amber-950/10 dark:border-amber-950/20 rounded-xl p-3 text-xs leading-relaxed text-[#78350f] dark:text-amber-300">
                    {selectedConversation.summary || "Summary will be generated automatically when this conversation is closed."}
                  </div>
                </div>

              </div>
            </ScrollArea>
          </div>
        )}

      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[520px] gap-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Settings className="h-4 w-4 text-purple-600" />
              Live Chat Widget Settings
            </DialogTitle>
          </DialogHeader>

          {settingsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Business Name */}
              <div className="space-y-1.5">
                <Label htmlFor="settings-business-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Business Name
                </Label>
                <Input
                  id="settings-business-name"
                  value={widgetSettings.business_name}
                  onChange={(e) =>
                    setWidgetSettings((p) => ({ ...p, business_name: e.target.value }))
                  }
                  placeholder="My Business"
                  className="h-9 border-border focus-visible:ring-purple-600"
                />
              </div>

              {/* Welcome Message */}
              <div className="space-y-1.5">
                <Label htmlFor="settings-welcome" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Welcome Message
                </Label>
                <Textarea
                  id="settings-welcome"
                  value={widgetSettings.welcome_message}
                  onChange={(e) =>
                    setWidgetSettings((p) => ({ ...p, welcome_message: e.target.value }))
                  }
                  placeholder="Hello! How can we help you today?"
                  rows={2}
                  className="resize-none border-border focus-visible:ring-purple-600"
                />
              </div>

              {/* Primary Color + Position */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-color" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="settings-color"
                      type="color"
                      value={widgetSettings.primary_color}
                      onChange={(e) =>
                        setWidgetSettings((p) => ({ ...p, primary_color: e.target.value }))
                      }
                      className="h-9 w-12 rounded-md border border-border cursor-pointer p-0.5 bg-white dark:bg-zinc-900"
                    />
                    <Input
                      value={widgetSettings.primary_color}
                      onChange={(e) =>
                        setWidgetSettings((p) => ({ ...p, primary_color: e.target.value }))
                      }
                      className="h-9 font-mono text-sm border-border focus-visible:ring-purple-600"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Widget Position
                  </Label>
                  <Select
                    value={widgetSettings.position}
                    onValueChange={(val) =>
                      setWidgetSettings((p) => ({ ...p, position: val }))
                    }
                  >
                    <SelectTrigger className="h-9 border-border">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom_right">Bottom Right</SelectItem>
                      <SelectItem value="bottom_left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Embed Script */}
              {widgetSettings.public_key && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Embed Script
                  </Label>
                  <div className="relative">
                    <pre className="bg-zinc-50 dark:bg-zinc-900 border border-border rounded-lg px-4 py-3 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all select-all">
{`<script src="${env.appUrl}/live-chat/widget.js" data-plugin-key="${widgetSettings.public_key}" async></script>`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyEmbedScript}
                      className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      {scriptCopied ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Paste this script before the closing <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">&lt;/body&gt;</code> tag on your website.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setSettingsOpen(false)}
              disabled={settingsSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              disabled={settingsSaving || settingsLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {settingsSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
