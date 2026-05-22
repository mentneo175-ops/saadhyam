import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/campaigns")({
  component: CampaignsPage,
});

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  language: string;
  voice_type: string;
  total_contacts: number;
  calls_completed: number;
  calls_pending: number;
  calls_failed: number;
  conversion_rate: number;
  avg_call_duration: number;
  created_at: string;
  updated_at: string;
}

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const url = statusFilter === "all" 
        ? `${env.apiBaseUrl}/api/voice-agent/campaigns`
        : `${env.apiBaseUrl}/api/voice-agent/campaigns?status_filter=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (campaignId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/status?status_update=${newStatus}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Failed to update campaign status:", error);
    }
  };

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
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
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
        return <Clock size={14} />;
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Manage your automated calling campaigns
          </p>
        </div>
        <Link to="/dashboard/voice-agent/campaigns/new">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Plus size={20} className="mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => setStatusFilter("draft")}
                size="sm"
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Phone size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No campaigns found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first voice campaign to get started"}
              </p>
              {!searchQuery && (
                <Link to="/dashboard/voice-agent/campaigns/new">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Plus size={20} className="mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {campaign.name}
                        </h3>
                        <Badge className={`${getStatusColor(campaign.status)} border`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.language}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.voice_type} voice
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">
                        {campaign.description || "No description"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCampaignStatus(campaign.id, "active")}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Play size={16} className="mr-1" />
                          Start
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCampaignStatus(campaign.id, "paused")}
                          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        >
                          <Pause size={16} className="mr-1" />
                          Pause
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCampaignStatus(campaign.id, "active")}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Play size={16} className="mr-1" />
                          Resume
                        </Button>
                      )}
                      <Link to={`/dashboard/voice-agent/campaigns/${campaign.id}`}>
                        <Button size="sm" variant="outline">
                          <BarChart3 size={16} className="mr-1" />
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Contacts</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {campaign.total_contacts}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Completed</p>
                      <p className="text-lg font-semibold text-green-600">
                        {campaign.calls_completed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pending</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {campaign.calls_pending}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Failed</p>
                      <p className="text-lg font-semibold text-red-600">
                        {campaign.calls_failed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Conversion</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {campaign.conversion_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg Duration</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {Math.round(campaign.avg_call_duration)}s
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {campaign.total_contacts > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>
                          {campaign.calls_completed} / {campaign.total_contacts} calls
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(campaign.calls_completed / campaign.total_contacts) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
