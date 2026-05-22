import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Send,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  User,
  Bot,
  Download,
  RefreshCw,
  Settings,
  MessageSquare,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/simulator")({
  component: VoiceSimulatorPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sentiment?: string;
  intent?: string;
}

interface ConversationResponse {
  response: string;
  intent: string;
  sentiment: string;
  should_continue: boolean;
  next_action: string;
}

function VoiceSimulatorPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [leadScore, setLeadScore] = useState(50);
  const [sentiment, setSentiment] = useState<"positive" | "neutral" | "negative">("neutral");
  
  // Campaign context
  const [campaignContext, setCampaignContext] = useState({
    business_name: "Saadhyam AI",
    offer_details: "AI-powered business automation platform with 50% discount",
    campaign_goal: "Generate qualified leads",
    target_audience: "Small and medium businesses",
    language: "english"
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startCall = async () => {
    const newSessionId = `sim_${Date.now()}`;
    setSessionId(newSessionId);
    setIsCallActive(true);
    setMessages([]);
    setLeadScore(50);
    setSentiment("neutral");

    // AI greeting
    setTimeout(() => {
      const greeting = {
        role: "assistant" as const,
        content: `Hello! I'm calling from ${campaignContext.business_name}. We have an exclusive offer that could benefit your business. Do you have a moment to chat?`,
        timestamp: new Date().toISOString(),
        sentiment: "positive",
        intent: "greeting"
      };
      setMessages([greeting]);
    }, 500);
  };

  const endCall = () => {
    setIsCallActive(false);
    // Could save conversation here
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/conversation/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          customer_message: inputMessage,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          campaign_context: campaignContext,
          language: campaignContext.language
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse: ConversationResponse = data.response;

        const assistantMessage: Message = {
          role: "assistant",
          content: aiResponse.response,
          timestamp: new Date().toISOString(),
          sentiment: aiResponse.sentiment,
          intent: aiResponse.intent
        };

        setMessages(prev => [...prev, assistantMessage]);
        setSentiment(aiResponse.sentiment as any);

        // Update lead score based on intent
        if (aiResponse.intent === "interested") {
          setLeadScore(prev => Math.min(100, prev + 15));
        } else if (aiResponse.intent === "not_interested") {
          setLeadScore(prev => Math.max(0, prev - 20));
        } else if (aiResponse.intent === "needs_info") {
          setLeadScore(prev => Math.min(100, prev + 5));
        }

        // Auto-end call if customer wants to end
        if (aiResponse.intent === "end_call" || !aiResponse.should_continue) {
          setTimeout(() => {
            setIsCallActive(false);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const downloadTranscript = () => {
    const transcript = messages
      .map(m => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
      .join("\n\n");
    
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation_${sessionId}.txt`;
    a.click();
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-700 border-green-300";
      case "negative":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getLeadScoreColor = () => {
    if (leadScore >= 70) return "text-green-600";
    if (leadScore >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Voice Conversation Simulator
          </h1>
          <p className="text-gray-600 mt-1">
            Test AI conversations before launching campaigns
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/dashboard/voice-agent"}
        >
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Call Controls */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {!isCallActive ? (
                    <Button
                      onClick={startCall}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <Phone size={20} className="mr-2" />
                      Start Simulation
                    </Button>
                  ) : (
                    <Button
                      onClick={endCall}
                      size="lg"
                      variant="destructive"
                      className="bg-gradient-to-r from-red-600 to-red-700"
                    >
                      <PhoneOff size={20} className="mr-2" />
                      End Call
                    </Button>
                  )}

                  {isCallActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">Live</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </Button>
                    </motion.div>
                  )}
                </div>

                {isCallActive && messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTranscript}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversation Window */}
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-purple-600" />
                  Conversation
                </CardTitle>
                {isCallActive && (
                  <Badge className={getSentimentColor()}>
                    {sentiment} sentiment
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {!isCallActive && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                    <Phone size={32} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Simulate
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Click "Start Simulation" to begin an AI-powered conversation.
                    Type customer responses to test the AI agent.
                  </p>
                </div>
              )}

              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user" ? "bg-white/20" : "bg-purple-100"
                        }`}>
                          {message.role === "user" ? (
                            <User size={16} className="text-white" />
                          ) : (
                            <Bot size={16} className="text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.intent && (
                            <p className={`text-xs mt-1 ${
                              message.role === "user" ? "text-white/70" : "text-gray-500"
                            }`}>
                              Intent: {message.intent}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-purple-600" />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Area */}
            {isCallActive && (
              <div className="border-t p-4 bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type customer response..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send • Simulate customer responses
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Analytics & Settings */}
        <div className="space-y-4">
          {/* Lead Score */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                Lead Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getLeadScoreColor()}`}>
                  {leadScore}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {leadScore >= 70 ? "High Interest" : leadScore >= 40 ? "Medium Interest" : "Low Interest"}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <motion.div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full"
                    initial={{ width: "50%" }}
                    animate={{ width: `${leadScore}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings size={18} className="text-purple-600" />
                Campaign Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Business Name</label>
                <Input
                  value={campaignContext.business_name}
                  onChange={(e) => setCampaignContext({...campaignContext, business_name: e.target.value})}
                  disabled={isCallActive}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Offer Details</label>
                <Textarea
                  value={campaignContext.offer_details}
                  onChange={(e) => setCampaignContext({...campaignContext, offer_details: e.target.value})}
                  disabled={isCallActive}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Language</label>
                <select
                  value={campaignContext.language}
                  onChange={(e) => setCampaignContext({...campaignContext, language: e.target.value})}
                  disabled={isCallActive}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish</option>
                  <option value="telugu">Telugu</option>
                  <option value="tamil">Tamil</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Stats */}
          {isCallActive && messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-semibold">{messages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold">
                    {messages.filter(m => m.role === "user").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Agent:</span>
                  <span className="font-semibold">
                    {messages.filter(m => m.role === "assistant").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
