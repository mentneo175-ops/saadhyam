import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  Users,
  TrendingUp,
  Activity,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute("/dashboard/voice-agent/")({
  component: VoiceAgentDashboard,
});

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  language: string;
  total_contacts: number;
  calls_completed: number;
  calls_pending: number;
  calls_failed: number;
  conversion_rate: number;
  avg_call_duration: number;
  created_at: string;
}

interface DashboardOverview {
  total_campaigns: number;
  active_campaigns: number;
  total_calls: number;
  total_leads: number;
  recent_campaigns: Campaign[];
}

function VoiceAgentDashboard() {
  const [selectedView, setSelectedView] = useState<"overview" | "campaigns">("overview");
  const [statsData, setStatsData] = useState<any>(null);
  const [campaignsData, setCampaignsData] = useState<any>(null);

  // Load data on mount with timeout
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("saadhyam_token");
      
      // Fetch stats with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const statsResponse = await fetch("http://localhost:8000/api/v2/voice-agent/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStatsData(data);
        }
      } catch (error) {
        console.log("Stats fetch failed or timed out");
      }

      // Fetch campaigns with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const campaignsResponse = await fetch("http://localhost:8000/api/v2/voice-agent/campaigns", {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (campaignsResponse.ok) {
          const data = await campaignsResponse.json();
          setCampaignsData(data);
        }
      } catch (error) {
        console.log("Campaigns fetch failed or timed out");
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play size={14} />;
      case "paused":
        return <Pause size={14} />;
      case "completed":
        return <CheckCircle size={14} />;
      case "draft":
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  // Fallback data if queries fail
  const stats = statsData?.stats || { total_campaigns: 0, active_campaigns: 0, total_calls: 0, total_leads: 0 };
  const campaigns = campaignsData?.campaigns || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Voice Agent</h1>
          <p className="text-gray-600 mt-1">
            Automated calling campaigns with AI-powered conversations
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/dashboard/voice-agent/create-campaign")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus size={20} className="mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Campaigns
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsData?.stats.total_calls || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {statsData?.stats.calls_today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Calls
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Phone size={20} className="text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsData?.stats.total_calls || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">Calls processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Leads
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsData?.stats.positive_leads || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">Leads generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Now
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Activity size={20} className="text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsData?.stats.active_campaigns || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">Running campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedView("overview")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedView === "overview"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView("campaigns")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedView === "campaigns"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All Campaigns
        </button>
      </div>

      {/* Recent Campaigns */}
      {selectedView === "overview" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Campaigns</h2>
          <div className="grid grid-cols-1 gap-4">
            {campaignsData?.campaigns?.slice(0, 5).map((campaign) => (
              <Card
                key={campaign.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  (window.location.href = `/dashboard/voice-agent/campaigns/${campaign.id}`)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1`}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Contacts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {campaign.total_contacts}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {campaign.calls_completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {campaign.calls_pending}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversion</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {campaign.conversion_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={16} />
                      Avg Duration: {Math.round(campaign.avg_call_duration)}s
                    </span>
                    <span>Language: {campaign.language}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!campaignsData?.campaigns ||
              campaignsData.campaigns.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Phone size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No campaigns yet
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    Create your first voice campaign to start automated calling
                  </p>
                  <Button
                    onClick={() =>
                      (window.location.href = "/dashboard/voice-agent/create-campaign")
                    }
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus size={20} className="mr-2" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* All Campaigns */}
      {selectedView === "campaigns" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Campaigns</h2>
          <div className="grid grid-cols-1 gap-4">
            {campaignsData?.campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  (window.location.href = `/dashboard/voice-agent/campaigns/${campaign.id}`)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1`}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Contacts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {campaign.total_contacts}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {campaign.calls_completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {campaign.calls_pending}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversion</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {campaign.conversion_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
