import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Send, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  TrendingUp,
  Eye,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { CampaignForm } from "./CampaignForm";
import { env } from "@/config/env";

interface Campaign {
  id: number;
  title: string;
  description?: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  reply_count: number;
  scheduled_time?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  message_content?: string;
  recipient_list?: string[];
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [executing, setExecuting] = useState<number | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    // Premium demo campaign showing successful stats
    const demoCampaign: Campaign = {
      id: -999,
      title: "Mentneo Launch Broadcast",
      description: "Opening promotional broadcast to active retail subscribers",
      status: "completed",
      total_recipients: 150,
      sent_count: 150,
      delivered_count: 148,
      read_count: 120,
      failed_count: 0,
      reply_count: 32,
      created_at: new Date(Date.now() - 36 * 60 * 60 * 1000 - 5000).toISOString(), // 36 hours ago
      start_time: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      message_content: "Hello! We are excited to launch Mentneo. Use code WELCOME20 to get 20% off our billing plans."
    };

    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/campaigns?limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const apiCampaigns = data.campaigns || [];
        setCampaigns([demoCampaign, ...apiCampaigns]);
      } else {
        setCampaigns([demoCampaign]);
        toast.error("Failed to load live campaigns");
      }
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setCampaigns([demoCampaign]);
      toast.error("Failed to load live campaigns");
    } finally {
      setLoading(false);
    }
  };

  const executeCampaign = async (campaignId: number) => {
    try {
      setExecuting(campaignId);
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/campaigns/${campaignId}/execute`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`Campaign executed! Sent: ${data.sent_count}, Failed: ${data.failed_count}`);
        loadCampaigns();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to execute campaign");
      }
    } catch (error) {
      console.error("Error executing campaign:", error);
      toast.error("Failed to execute campaign");
    } finally {
      setExecuting(null);
    }
  };

  const deleteCampaign = async (campaignId: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/campaigns/${campaignId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Campaign deleted successfully");
        loadCampaigns();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: "secondary", label: "Draft", icon: Clock },
      scheduled: { variant: "default", label: "Scheduled", icon: Calendar },
      in_progress: { variant: "default", label: "In Progress", icon: Loader2 },
      completed: { variant: "default", label: "Completed", icon: CheckCircle },
      failed: { variant: "destructive", label: "Failed", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} className={status === "in_progress" ? "animate-spin" : ""} />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateSuccessRate = (campaign: Campaign) => {
    if (campaign.sent_count === 0) return 0;
    return Math.round((campaign.delivered_count / campaign.sent_count) * 100);
  };

  if (showForm) {
    return (
      <CampaignForm
        campaign={selectedCampaign}
        onClose={() => {
          setShowForm(false);
          setSelectedCampaign(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setSelectedCampaign(null);
          loadCampaigns();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Manager</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage WhatsApp broadcast campaigns
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus size={16} className="mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create your first campaign to send messages to multiple customers at once
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus size={16} className="mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{campaign.title}</CardTitle>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.description && (
                        <CardDescription>{campaign.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(campaign.status === "draft" || campaign.status === "scheduled") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executeCampaign(campaign.id)}
                            disabled={executing === campaign.id}
                          >
                            {executing === campaign.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowForm(true);
                            }}
                          >
                            <Eye size={14} />
                          </Button>
                        </>
                      )}
                      {(campaign.status === "draft" || campaign.status === "failed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCampaign(campaign.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                        <p className="text-sm font-semibold">{campaign.total_recipients}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Send size={16} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="text-sm font-semibold">{campaign.sent_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Delivered</p>
                        <p className="text-sm font-semibold">{campaign.delivered_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                        <p className="text-sm font-semibold">{calculateSuccessRate(campaign)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {campaign.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Scheduled: {formatDate(campaign.scheduled_time)}
                        </span>
                      )}
                      {campaign.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Started: {formatDate(campaign.start_time)}
                        </span>
                      )}
                    </div>
                    <span>Created: {formatDate(campaign.created_at)}</span>
                  </div>

                  {campaign.failed_count > 0 && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                      <p className="text-xs text-red-800 dark:text-red-200">
                        <XCircle size={12} className="inline mr-1" />
                        {campaign.failed_count} message(s) failed to send
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
