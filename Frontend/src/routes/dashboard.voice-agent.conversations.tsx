import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Calendar,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneCall,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/conversations")({
  component: ConversationsPage,
});

interface Call {
  id: number;
  campaign_id: number;
  contact_id: number;
  phone_number: string;
  status: string;
  duration: number;
  conversation_summary: string;
  customer_sentiment: string;
  call_outcome: string;
  transcript: string;
  created_at: string;
  started_at: string;
  ended_at: string;
  contact_name?: string;
  campaign_name?: string;
}

function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all calls
  const { data: callsData, isLoading } = useQuery<{ success: boolean; calls: Call[] }>({
    queryKey: ["voice-agent-all-calls", selectedStatus, selectedSentiment],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      
      // Get all campaigns first
      const campaignsResponse = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const campaignsData = await campaignsResponse.json();
      
      // Get calls from all campaigns
      const allCalls: Call[] = [];
      for (const campaign of campaignsData.campaigns || []) {
        const callsResponse = await fetch(
          `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaign.id}/calls`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const callsResult = await callsResponse.json();
        
        if (callsResult.success && callsResult.calls) {
          // Add campaign name to each call
          const callsWithCampaign = callsResult.calls.map((call: Call) => ({
            ...call,
            campaign_name: campaign.name,
          }));
          allCalls.push(...callsWithCampaign);
        }
      }
      
      return { success: true, calls: allCalls };
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-700 border-green-300";
      case "negative":
        return "bg-red-100 text-red-700 border-red-300";
      case "neutral":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return <TrendingUp size={14} />;
      case "negative":
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome?.toLowerCase()) {
      case "interested":
        return "bg-green-100 text-green-700 border-green-300";
      case "not_interested":
        return "bg-red-100 text-red-700 border-red-300";
      case "callback_requested":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "not_available":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome?.toLowerCase()) {
      case "interested":
        return <CheckCircle size={14} />;
      case "not_interested":
        return <XCircle size={14} />;
      case "callback_requested":
        return <PhoneCall size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadTranscript = (call: Call) => {
    const transcript = `
CALL TRANSCRIPT
===============

Campaign: ${call.campaign_name || "N/A"}
Phone: ${call.phone_number}
Date: ${formatDate(call.created_at)}
Duration: ${formatDuration(call.duration)}
Sentiment: ${call.customer_sentiment || "N/A"}
Outcome: ${call.call_outcome || "N/A"}

TRANSCRIPT:
-----------
${call.transcript || "No transcript available"}

SUMMARY:
--------
${call.conversation_summary || "No summary available"}
    `.trim();

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call_${call.id}_transcript.txt`;
    a.click();
  };

  // Filter calls
  const filteredCalls = callsData?.calls?.filter((call) => {
    const matchesSearch =
      searchQuery === "" ||
      call.phone_number.includes(searchQuery) ||
      call.conversation_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || call.status?.toLowerCase() === selectedStatus.toLowerCase();

    const matchesSentiment =
      selectedSentiment === "all" ||
      call.customer_sentiment?.toLowerCase() === selectedSentiment.toLowerCase();

    return matchesSearch && matchesStatus && matchesSentiment;
  }) || [];

  // Calculate stats
  const stats = {
    total: filteredCalls.length,
    positive: filteredCalls.filter((c) => c.customer_sentiment?.toLowerCase() === "positive").length,
    negative: filteredCalls.filter((c) => c.customer_sentiment?.toLowerCase() === "negative").length,
    interested: filteredCalls.filter((c) => c.call_outcome?.toLowerCase() === "interested").length,
    avgDuration: filteredCalls.length > 0
      ? Math.round(filteredCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / filteredCalls.length)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Conversation History
          </h1>
          <p className="text-gray-600 mt-1">View and analyze all voice conversations</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/dashboard/voice-agent"}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Phone size={24} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Negative</p>
                <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown size={24} className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interested</p>
                <p className="text-2xl font-bold text-blue-600">{stats.interested}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Star size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.avgDuration)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search by phone, campaign, or transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter size={20} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sentiment</label>
                  <select
                    value={selectedSentiment}
                    onChange={(e) => setSelectedSentiment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || selectedStatus !== "all" || selectedSentiment !== "all"
                  ? "Try adjusting your filters"
                  : "Start a campaign to see conversations here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCalls.map((call) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{call.phone_number}</CardTitle>
                        <Badge className={getSentimentColor(call.customer_sentiment)}>
                          {getSentimentIcon(call.customer_sentiment)}
                          {call.customer_sentiment || "Unknown"}
                        </Badge>
                        <Badge className={getOutcomeColor(call.call_outcome)}>
                          {getOutcomeIcon(call.call_outcome)}
                          {call.call_outcome?.replace("_", " ") || "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(call.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(call.duration)}
                        </span>
                        {call.campaign_name && (
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {call.campaign_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript(call)}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedCallId(expandedCallId === call.id ? null : call.id)
                        }
                      >
                        {expandedCallId === call.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Summary */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Summary</p>
                    <p className="text-gray-600">
                      {call.conversation_summary || "No summary available"}
                    </p>
                  </div>

                  {/* Expanded Transcript */}
                  <AnimatePresence>
                    {expandedCallId === call.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t pt-4"
                      >
                        <p className="text-sm font-medium text-gray-700 mb-3">Full Transcript</p>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                          {call.transcript ? (
                            <div className="space-y-3">
                              {call.transcript.split("\n").map((line, idx) => {
                                const isAgent = line.toLowerCase().startsWith("agent:");
                                const isCustomer = line.toLowerCase().startsWith("customer:");
                                
                                if (!isAgent && !isCustomer) {
                                  return <p key={idx} className="text-gray-600 text-sm">{line}</p>;
                                }

                                return (
                                  <div
                                    key={idx}
                                    className={`flex gap-2 ${isAgent ? "justify-start" : "justify-end"}`}
                                  >
                                    <div
                                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                        isAgent
                                          ? "bg-purple-100 text-purple-900"
                                          : "bg-blue-100 text-blue-900"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        {isAgent ? (
                                          <Bot size={14} className="text-purple-600" />
                                        ) : (
                                          <User size={14} className="text-blue-600" />
                                        )}
                                        <span className="text-xs font-medium">
                                          {isAgent ? "Agent" : "Customer"}
                                        </span>
                                      </div>
                                      <p className="text-sm">
                                        {line.replace(/^(Agent:|Customer:)\s*/i, "")}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No transcript available</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
