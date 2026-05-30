import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, Fragment } from "react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Users,
  TrendingUp,
  Upload,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  BarChart3,
  MessageSquare,
  UserCheck,
  Loader2,
  Mic,
  Globe,
  Trash2,
  ChevronDown,
  ChevronUp,
  Smile,
  Meh,
  Frown,
  Award,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/campaigns/$campaignId/")({
  component: CampaignDetailsPage,
});

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  language: string;
  voice_type: string;
  script_template: string;
  total_contacts: number;
  calls_completed: number;
  calls_pending: number;
  calls_failed: number;
  conversion_rate: number;
  avg_call_duration: number;
  created_at: string;
}

interface Contact {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  call_attempts: number;
  is_completed: boolean;
  created_at: string;
}

interface Call {
  id: number;
  phone_number: string;
  status: string;
  duration: number;
  conversation_summary: string;
  customer_sentiment: string;
  call_outcome: string;
  created_at: string;
  started_at: string;
  ended_at: string;
  contact_name?: string;
  contact_id?: number;
  notes?: string;
  key_quote?: string;
  conversation_transcript?: string;
}

interface Lead {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  status: string;
  lead_score: number;
  interest_level: string;
  follow_up_required: boolean;
  callback_requested: boolean;
  appointment_scheduled: boolean;
  interaction_count: number;
  is_converted: boolean;
  created_at: string;
  notes?: string;
  key_quote?: string;
}

interface Analytics {
  campaign_id: number;
  campaign_name: string;
  status: string;
  total_contacts: number;
  total_calls: number;
  completed_calls: number;
  pending_calls: number;
  failed_calls: number;
  total_leads: number;
  interested_leads: number;
  converted_leads: number;
  conversion_rate: number;
  avg_call_duration: number;
}

const parseTranscriptLines = (transcriptStr: string) => {
  if (!transcriptStr) return [];
  return transcriptStr.split('\n').map(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const speaker = parts[0].trim();
      const text = parts.slice(1).join(':').trim();
      return { speaker, text };
    }
    return { speaker: 'Unknown', text: line };
  });
};

function CampaignDetailsPage() {
  const navigate = useNavigate();
  const { campaignId } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showContactUpload, setShowContactUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCallIdForTranscript, setSelectedCallIdForTranscript] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaignData, isLoading: campaignLoading } = useQuery<{
    success: boolean;
    campaign: Campaign;
  }>({
    queryKey: ["voice-campaign", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch campaign");
      return response.json();
    },
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery<{ success: boolean; analytics: Analytics }>({
    queryKey: ["voice-campaign-analytics", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  // Fetch contacts
  const { data: contactsData } = useQuery<{ success: boolean; contacts: Contact[] }>({
    queryKey: ["voice-campaign-contacts", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/contacts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
    enabled: activeTab === "contacts",
  });

  // Fetch calls
  const { data: callsData } = useQuery<{ success: boolean; calls: Call[] }>({
    queryKey: ["voice-campaign-calls", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/calls`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch calls");
      return response.json();
    },
    enabled: activeTab === "calls" || activeTab === "report",
  });

  // Fetch leads
  const { data: leadsData } = useQuery<{ success: boolean; leads: Lead[] }>({
    queryKey: ["voice-campaign-leads", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/leads`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: activeTab === "leads",
  });

  // Update campaign status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/status?status_update=${newStatus}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-campaign", campaignId] });
    },
  });

  // Start calling mutation
  const startCallingMutation = useMutation({
    mutationFn: async (runBackground: boolean) => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/start-calling?run_background=${runBackground}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start calling");
      }
      return response.json();
    },
    onSuccess: () => {
      // Redirect to calling interface
      navigate({
        to: "/dashboard/voice-agent/campaigns/$campaignId/calling",
        params: { campaignId },
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Campaign deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["voice-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["voice-agent-campaigns"] });
      navigate({ to: "/dashboard/voice-agent/campaigns" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete campaign");
    },
  });

  const campaign = campaignData?.campaign;
  const analytics = analyticsData?.analytics;

  // Auto-open contact upload if campaign has no contacts and is draft
  useEffect(() => {
    if (campaign && campaign.status === "draft" && campaign.total_contacts === 0) {
      setShowContactUpload(true);
    }
  }, [campaign?.status, campaign?.total_contacts]);

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case "interested":
        return "bg-green-100 text-green-700";
      case "not_interested":
        return "bg-red-100 text-red-700";
      case "follow_up_required":
        return "bg-yellow-100 text-yellow-700";
      case "callback_requested":
        return "bg-blue-100 text-blue-700";
      case "converted":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist.</p>
          <Button onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns" })}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1`}>
                {getStatusIcon(campaign.status)}
                {campaign.status}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{campaign.description || "No description"}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Language: {campaign.language}</span>
              <span>Voice: {campaign.voice_type}</span>
              <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {campaign.status === "draft" && campaign.total_contacts > 0 && (
            <Button
              onClick={() => startCallingMutation.mutate(false)}
              disabled={startCallingMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {startCallingMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Start Calling
                </>
              )}
            </Button>
          )}
          {campaign.status === "draft" && campaign.total_contacts === 0 && (
            <Button disabled className="bg-gray-400">
              <Play size={16} className="mr-2" />
              Add Contacts First
            </Button>
          )}
          {campaign.status === "active" && (
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link
                to="/dashboard/voice-agent/campaigns/$campaignId/calling"
                params={{ campaignId }}
              >
                <Phone size={16} className="mr-2" />
                View Live Calls
              </Link>
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
              <Link
                to="/dashboard/voice-agent/campaigns/$campaignId/calling"
                params={{ campaignId }}
              >
                <Phone size={16} className="mr-2" />
                Resume Calling
              </Link>
            </Button>
          )}
          {campaign.status !== "active" && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteCampaignMutation.isPending}
            >
              {deleteCampaignMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{analytics?.total_contacts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Calls Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics?.completed_calls || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">{analytics?.pending_calls || 0} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{analytics?.total_leads || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              {analytics?.converted_leads || 0} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {(analytics?.conversion_rate ?? 0).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Avg: {Math.round(analytics?.avg_call_duration || 0)}s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 size={16} className="mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users size={16} className="mr-2" />
            Contacts ({analytics?.total_contacts || 0})
          </TabsTrigger>
          <TabsTrigger value="calls">
            <Phone size={16} className="mr-2" />
            Calls ({analytics?.total_calls || 0})
          </TabsTrigger>
          <TabsTrigger value="leads">
            <UserCheck size={16} className="mr-2" />
            Leads ({analytics?.total_leads || 0})
          </TabsTrigger>
          <TabsTrigger value="report">
            <TrendingUp size={16} className="mr-2" />
            Report
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Script</CardTitle>
              <CardDescription>AI conversation template</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                {campaign.script_template || "No script template provided"}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Call Completion Rate</span>
                    <span className="font-semibold">
                      {analytics?.total_calls
                        ? ((analytics.completed_calls / analytics.total_calls) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          analytics?.total_calls
                            ? (analytics.completed_calls / analytics.total_calls) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Lead Conversion Rate</span>
                    <span className="font-semibold">
                      {(analytics?.conversion_rate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${analytics?.conversion_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Campaign Contacts</h3>
            <Button
              onClick={() => setShowContactUpload(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload size={16} className="mr-2" />
              Import Contacts
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contactsData?.contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contact.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.phone_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.email || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {contact.call_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contact.is_completed ? (
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <h3 className="text-lg font-semibold">Call History</h3>
          <div className="space-y-3">
            {callsData?.calls.map((call) => (
              <Card key={call.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="font-semibold">{call.phone_number}</span>
                        <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
                        {call.customer_sentiment && (
                          <span className={`text-sm ${getSentimentColor(call.customer_sentiment)}`}>
                            {call.customer_sentiment}
                          </span>
                        )}
                      </div>
                      {call.conversation_summary && (
                        <p className="text-sm text-gray-600 mb-2">{call.conversation_summary}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Duration: {call.duration}s</span>
                        {call.call_outcome && <span>Outcome: {call.call_outcome}</span>}
                        <span>{new Date(call.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Leads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leadsData?.leads.map((lead) => (
              <Card key={lead.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      <CardDescription>{lead.phone_number}</CardDescription>
                    </div>
                    <Badge className={getLeadStatusColor(lead.status)}>
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lead Score:</span>
                      <span className="font-semibold">{lead.lead_score}/100</span>
                    </div>
                    {lead.interest_level && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-semibold capitalize">{lead.interest_level}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {lead.follow_up_required && (
                        <Badge variant="outline" className="text-xs">
                          Follow-up Required
                        </Badge>
                      )}
                      {lead.callback_requested && (
                        <Badge variant="outline" className="text-xs">
                          Callback Requested
                        </Badge>
                      )}
                      {lead.is_converted && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Converted</Badge>
                      )}
                    </div>
                    {lead.notes && (
                      <div className="mt-3 pt-3 border-t border-purple-100/60">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1 mb-1">
                          ✨ Specific Requirements
                        </span>
                        <p className="text-xs text-purple-900 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/50 whitespace-pre-wrap leading-relaxed shadow-sm font-semibold">
                          {lead.notes}
                        </p>
                      </div>
                    )}
                    {lead.key_quote && (
                      <div className="mt-3 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block">
                          💬 Key Quote
                        </span>
                        <blockquote className="text-xs font-semibold italic text-indigo-950 border-l-2 border-indigo-500 pl-2 leading-relaxed">
                          “{lead.key_quote}”
                        </blockquote>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-6">
          {(() => {
            const calls = callsData?.calls || [];
            const total = calls.length;
            const completed = calls.filter(c => c.status === 'completed').length;
            const failed = calls.filter(c => c.status === 'failed').length;
            
            const interested = calls.filter(c => c.call_outcome === 'interested').length;
            const notInterested = calls.filter(c => c.call_outcome === 'not_interested').length;
            const callback = calls.filter(c => c.call_outcome === 'callback_requested').length;
            const notAvailable = calls.filter(c => !c.call_outcome || c.call_outcome === 'not_available').length;
            
            const positive = calls.filter(c => c.customer_sentiment === 'positive').length;
            const neutral = calls.filter(c => c.customer_sentiment === 'neutral').length;
            const negative = calls.filter(c => c.customer_sentiment === 'negative').length;
            
            const answerRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";
            const conversionRate = completed > 0 ? ((interested / completed) * 100).toFixed(1) : "0";
            const positiveSentimentRate = completed > 0 ? ((positive / completed) * 100).toFixed(1) : "0";
            const avgDuration = completed > 0 
              ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / completed)
              : 0;

            const outcomeChartData = [
              { name: "Interested", value: interested, fill: "#10b981" },
              { name: "Not Interested", value: notInterested, fill: "#ef4444" },
              { name: "Callback Requested", value: callback, fill: "#3b82f6" },
              { name: "No Answer/Failed", value: notAvailable + failed, fill: "#6b7280" }
            ].filter(d => d.value > 0);

            const sentimentChartData = [
              { name: "Positive Sentiment", value: positive, fill: "#10b981" },
              { name: "Neutral Sentiment", value: neutral, fill: "#f59e0b" },
              { name: "Negative Sentiment", value: negative, fill: "#ef4444" }
            ].filter(d => d.value > 0);

            if (total === 0) {
              return (
                <Card className="border border-purple-100 shadow-sm">
                  <CardContent className="py-12 text-center text-gray-500">
                    <TrendingUp size={48} className="text-purple-300 mx-auto mb-3" />
                    <p className="font-semibold text-gray-700">No Analytics Available Yet</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Once you start making calls in this campaign, comprehensive reports, charts, transcripts, and AI-extracted quotes will appear here.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-6">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border border-purple-100 shadow-sm bg-gradient-to-br from-purple-50/30 to-white">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Call Answer Rate</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{answerRate}%</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{completed} / {total} calls answered</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <Phone size={20} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-green-100 shadow-sm bg-gradient-to-br from-green-50/30 to-white">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Lead Conversion Rate</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{conversionRate}%</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{interested} interested leads</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Award size={20} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-blue-100 shadow-sm bg-gradient-to-br from-blue-50/30 to-white">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Positive Sentiment</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{positiveSentimentRate}%</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Satisfied customer voice</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Smile size={20} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-amber-100 shadow-sm bg-gradient-to-br from-amber-50/30 to-white">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Avg Call Duration</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{avgDuration}s</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Duration per session</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock size={20} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pie Charts Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outcomes Pie Chart */}
                  <Card className="border border-gray-100 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50 border-b">
                      <CardTitle className="text-base text-gray-800">Call Campaign Outcomes</CardTitle>
                      <CardDescription className="text-xs">Interest response breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {outcomeChartData.length > 0 ? (
                        <div className="flex flex-col items-center justify-center">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={outcomeChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                dataKey="value"
                              >
                                {outcomeChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value) => [`${value} Calls`, 'Outcomes']} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 text-xs">
                            {outcomeChartData.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span className="font-semibold text-gray-600">{item.name} ({item.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-400 py-12 text-sm">No outcome data available to chart.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sentiment Pie Chart */}
                  <Card className="border border-gray-100 shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50 border-b">
                      <CardTitle className="text-base text-gray-800">Sentiment Distribution</CardTitle>
                      <CardDescription className="text-xs">AI analysis of user tone</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {sentimentChartData.length > 0 ? (
                        <div className="flex flex-col items-center justify-center">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={sentimentChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                dataKey="value"
                              >
                                {sentimentChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value) => [`${value} Calls`, 'Sentiment']} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 text-xs">
                            {sentimentChartData.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span className="font-semibold text-gray-600">{item.name} ({item.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-gray-400 py-12 text-sm">No sentiment data available to chart.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Call Logs & Transcripts Accordion Section */}
                <Card className="border border-purple-100 shadow-sm">
                  <CardHeader className="bg-gray-50/60 pb-3 border-b">
                    <CardTitle className="text-base text-gray-800">Call Logs & Conversation Detail</CardTitle>
                    <CardDescription className="text-xs">Select any contact to inspect transcript</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-100/50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Name</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentiment</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome</th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Conversation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {calls.map((call) => {
                            const isSelected = selectedCallIdForTranscript === call.id;
                            const outcome = call.call_outcome || "not_interested";
                            const s = call.customer_sentiment || "neutral";
                            
                            return (
                              <Fragment key={call.id}>
                                <tr className={`hover:bg-purple-50/30 transition-colors ${isSelected ? 'bg-purple-50/45' : ''}`}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {call.contact_name || "Customer"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                    {call.phone_number}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {call.duration}s
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold capitalize text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                      {s === "positive" && <Smile className="text-green-500" size={16} />}
                                      {s === "neutral" && <Meh className="text-amber-500" size={16} />}
                                      {s === "negative" && <Frown className="text-red-500" size={16} />}
                                      <span>{s}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge className={`font-bold ${
                                      outcome === 'interested' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                      outcome === 'callback_requested' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                      outcome === 'not_interested' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                      'bg-gray-100 text-gray-800 hover:bg-gray-100'
                                    }`}>
                                      {outcome.replace(/_/g, ' ').toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedCallIdForTranscript(isSelected ? null : call.id)}
                                      className="text-purple-600 hover:text-purple-800 hover:bg-purple-100/50 font-semibold text-right w-full flex justify-end"
                                    >
                                      {isSelected ? (
                                        <span className="flex items-center gap-1 justify-end">Hide Transcript <ChevronUp size={14} /></span>
                                      ) : (
                                        <span className="flex items-center gap-1 justify-end">View Transcript <ChevronDown size={14} /></span>
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                                
                                {/* Accordion detail panel for selected row */}
                                {isSelected && (
                                  <tr>
                                    <td colSpan={6} className="bg-purple-50/10 px-8 py-5 border-t border-b border-purple-100/50">
                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-1 space-y-3">
                                          <h5 className="text-xs font-bold uppercase text-purple-950 tracking-wider">AI Call Summary</h5>
                                          <div className="bg-white p-3 rounded-lg border border-purple-100/60 text-xs text-gray-700 leading-relaxed shadow-sm">
                                            {call.conversation_summary || "No conversation summary recorded."}
                                          </div>
                                          {call.notes && (
                                            <div className="mt-2.5">
                                              <h5 className="text-xs font-bold uppercase text-purple-950 tracking-wider mb-1 flex items-center gap-1">
                                                ✨ Specific Requirements
                                              </h5>
                                              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100/50 text-xs text-purple-900 leading-relaxed shadow-sm whitespace-pre-wrap">
                                                {call.notes}
                                              </div>
                                            </div>
                                          )}
                                          {call.key_quote && (
                                            <div className="mt-2.5 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                                                💬 Key Quote
                                              </h5>
                                              <blockquote className="text-xs font-semibold italic text-indigo-950 border-l-2 border-indigo-500 pl-2 leading-relaxed">
                                                “{call.key_quote}”
                                              </blockquote>
                                            </div>
                                          )}
                                          <div className="text-[10px] text-gray-400 space-y-1">
                                            <p>Call Date: {new Date(call.created_at).toLocaleString()}</p>
                                            <p>Contact ID: {call.contact_id}</p>
                                            <p>Call DB ID: {call.id}</p>
                                          </div>
                                        </div>
                                        <div className="lg:col-span-2">
                                          <h5 className="text-xs font-bold uppercase text-purple-950 tracking-wider mb-2 flex items-center gap-1.5">
                                            <MessageSquare size={14} className="text-purple-600" />
                                            Dialogue Transcript
                                          </h5>
                                          <div className="bg-white rounded-xl border border-purple-100/60 p-4 max-h-[250px] overflow-y-auto space-y-3.5 shadow-sm scrollbar-thin">
                                            {call.conversation_transcript ? (
                                              parseTranscriptLines(call.conversation_transcript).map((line, idx) => {
                                                const isCustomer = line.speaker.toLowerCase() === 'customer';
                                                return (
                                                  <div key={idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                                                      isCustomer 
                                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none' 
                                                        : 'bg-gray-100 border text-gray-800 rounded-tl-none'
                                                    }`}>
                                                      <p className="font-semibold text-[9px] uppercase tracking-wider mb-0.5 opacity-80">
                                                        {isCustomer ? (call.contact_name || "Customer") : "AI Agent"}
                                                      </p>
                                                      <p className="leading-relaxed">{line.text}</p>
                                                    </div>
                                                  </div>
                                                );
                                              })
                                            ) : (
                                              <p className="text-center text-gray-400 py-6">No transcript details recorded.</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Contact Upload Modal */}
      {showContactUpload && (
        <ContactUploadModal
          campaignId={campaignId}
          onClose={() => setShowContactUpload(false)}
          onSuccess={() => {
            setShowContactUpload(false);
            queryClient.invalidateQueries({ queryKey: ["voice-campaign-contacts", campaignId] });
            queryClient.invalidateQueries({ queryKey: ["voice-campaign", campaignId] });
          }}
        />
      )}

      {/* Delete Campaign Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ Delete Campaign?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                This action CANNOT be undone!
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-900 dark:text-red-100 font-medium mb-2">
                  ✗ This will permanently delete:
                </p>
                <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 ml-4">
                  <li>• The campaign "{campaign.name}"</li>
                  <li>• All associated customer contacts</li>
                  <li>• All recorded calls and summaries</li>
                  <li>• All generated leads from this campaign</li>
                </ul>
              </div>
              <p className="text-sm">
                Are you absolutely sure you want to delete this campaign?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCampaignMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteCampaignMutation.mutate();
              }}
              disabled={deleteCampaignMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCampaignMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Campaign"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Contact Upload Modal Component
function ContactUploadModal({
  campaignId,
  onClose,
  onSuccess,
}: {
  campaignId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"contacts" | "mode">("contacts");
  const [uploadMode, setUploadMode] = useState<"manual" | "text" | "file">("manual");

  const [manualContacts, setManualContacts] = useState<
    Array<{ name: string; phone_number: string; email: string }>
  >([{ name: "", phone_number: "", email: "" }]);
  const [textPasteContent, setTextPasteContent] = useState("");
  const [fileContacts, setFileContacts] = useState<
    Array<{ name: string; phone_number: string; email: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const parseContactsData = (
    text: string,
  ): Array<{ name: string; phone_number: string; email: string }> => {
    const lines = text.split(/\r?\n/);
    const parsed: Array<{ name: string; phone_number: string; email: string }> = [];

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      const separators = [",", ";", ":", "|", "\t"];
      let parts: string[] = [];
      let foundSeparator = false;

      for (const sep of separators) {
        if (cleanLine.includes(sep)) {
          parts = cleanLine.split(sep).map((p) => p.trim());
          foundSeparator = true;
          break;
        }
      }

      if (!foundSeparator) {
        parts = cleanLine.split(/\s+/).map((p) => p.trim());
      }

      if (parts.length >= 2) {
        const part1 = parts[0];
        const part2 = parts[1];
        const part3 = parts[2] || "";

        const isPhone = (str: string) => /^\+?[0-9\s-]{7,15}$/.test(str.replace(/[\s-]/g, ""));

        if (isPhone(part2)) {
          parsed.push({
            name: part1,
            phone_number: part2.replace(/[\s-]/g, ""),
            email: isPhone(part3) ? "" : part3,
          });
        } else if (isPhone(part1)) {
          parsed.push({
            name: part2,
            phone_number: part1.replace(/[\s-]/g, ""),
            email: isPhone(part3) ? "" : part3,
          });
        } else {
          parsed.push({ name: part1, phone_number: part2.replace(/[\s-]/g, ""), email: part3 });
        }
      } else if (parts.length === 1) {
        const phone = parts[0].replace(/[\s-]/g, "");
        if (/^\+?[0-9]{7,15}$/.test(phone)) {
          parsed.push({ name: "Customer", phone_number: phone, email: "" });
        }
      }
    });
    return parsed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseContactsData(text);
      if (parsed.length > 0) {
        setFileContacts(parsed);
        toast.success(`Loaded ${parsed.length} contacts from file`);
      } else {
        toast.error("Could not parse any contacts. Ensure layout is: Name, Phone");
      }
    };
    reader.readAsText(file);
  };

  const addManualContact = () => {
    setManualContacts([...manualContacts, { name: "", phone_number: "", email: "" }]);
  };

  const removeManualContact = (index: number) => {
    setManualContacts(manualContacts.filter((_, i) => i !== index));
  };

  const updateManualContact = (index: number, field: string, value: string) => {
    const updated = [...manualContacts];
    updated[index] = { ...updated[index], [field]: value };
    setManualContacts(updated);
  };

  const handleStartCalling = async (runBackground: boolean) => {
    setLoading(true);
    const token = localStorage.getItem("saadhyam_token");

    try {
      const activateResponse = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/start-calling?run_background=${runBackground}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (activateResponse.ok) {
        toast.success(
          runBackground
            ? "Automated background calling started!"
            : "Interactive calling session ready!",
        );
        onSuccess();
        navigate({
          to: "/dashboard/voice-agent/campaigns/$campaignId/calling",
          params: { campaignId },
        });
      } else {
        const errData = await activateResponse.json();
        throw new Error(errData.detail || "Failed to start campaign calling");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred starting campaign calling");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndProceed = async () => {
    let contactsToUpload: Array<{ name: string; phone_number: string; email?: string }> = [];
    if (uploadMode === "manual") {
      contactsToUpload = manualContacts.filter((c) => c.name && c.phone_number);
    } else if (uploadMode === "text") {
      contactsToUpload = parseContactsData(textPasteContent);
    } else if (uploadMode === "file") {
      contactsToUpload = fileContacts;
    }

    if (contactsToUpload.length === 0) {
      toast.error("Please add at least one contact name and phone number");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("saadhyam_token");

    try {
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/contacts/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contacts: contactsToUpload }),
        },
      );

      if (!response.ok) throw new Error("Failed to upload contacts");

      toast.success(`Uploaded ${contactsToUpload.length} contacts successfully!`);
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-contacts", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["voice-campaign", campaignId] });

      // Directly start calling in interactive mode, bypassing the mode selection dialog
      await handleStartCalling(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to upload contacts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Add Customer Contacts</CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Add customer contacts to start the voice campaign calling session
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-gray-200"
            onClick={onClose}
          >
            ✕
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {step === "contacts" && (
            <div className="space-y-6">
              {/* Mode Toggles */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                    uploadMode === "manual"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                  onClick={() => setUploadMode("manual")}
                >
                  ✍️ Manual Entry
                </button>
                <button
                  type="button"
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                    uploadMode === "text"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                  onClick={() => setUploadMode("text")}
                >
                  📝 Copy & Paste
                </button>
                <button
                  type="button"
                  className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                    uploadMode === "file"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                  onClick={() => setUploadMode("file")}
                >
                  📁 Upload File
                </button>
              </div>

              {/* Manual Entry */}
              {uploadMode === "manual" && (
                <div className="space-y-4">
                  {manualContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100"
                    >
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500">Name</label>
                        <Input
                          placeholder="Kiran Kumar"
                          value={contact.name}
                          onChange={(e) => updateManualContact(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500">Phone</label>
                        <Input
                          placeholder="+919876543210"
                          value={contact.phone_number}
                          onChange={(e) =>
                            updateManualContact(index, "phone_number", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500">
                          Email (Optional)
                        </label>
                        <Input
                          placeholder="kiran@gmail.com"
                          value={contact.email}
                          onChange={(e) => updateManualContact(index, "email", e.target.value)}
                        />
                      </div>
                      {manualContacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                          onClick={() => removeManualContact(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addManualContact}
                    className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    + Add Another Contact
                  </Button>
                </div>
              )}

              {/* Copy Paste */}
              {uploadMode === "text" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                      Paste contact rows here:
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-40"
                      placeholder="Formats:&#10;Kiran Kumar, +919876543210&#10;Kiran Kumar: 9876543210&#10;Jane Smith: jane@example.com: 9876543211"
                      value={textPasteContent}
                      onChange={(e) => setTextPasteContent(e.target.value)}
                    />
                  </div>
                  {textPasteContent && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                      <p className="text-xs text-purple-800 font-semibold">
                        🔍 Detected {parseContactsData(textPasteContent).length} contacts.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload */}
              {uploadMode === "file" && (
                <div className="space-y-4">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-purple-400 transition-colors">
                    <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                    <label
                      htmlFor="modal-details-file-upload"
                      className="cursor-pointer text-purple-600 font-semibold hover:underline block"
                    >
                      Upload CSV or Text File
                    </label>
                    <Input
                      id="modal-details-file-upload"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Files can contain rows like: Name, Phone or Name: Phone
                    </p>
                  </div>
                  {fileContacts.length > 0 && (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-xs font-semibold">
                      ✓ Successfully parsed {fileContacts.length} contacts from file.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadAndProceed}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Upload and Start Calling"
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "mode" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Talk Live Mode */}
                <Card
                  className="border-2 border-purple-400 bg-purple-50/40 hover:bg-purple-50/70 cursor-pointer transition-colors p-4 flex flex-col justify-between"
                  onClick={() => handleStartCalling(false)}
                >
                  <div>
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3 animate-pulse">
                      <Mic size={20} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      Talk Live (Interactive Mic Testing)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Talk to the voice agent yourself using your microphone and laptop speakers.
                      Real-time back-and-forth testing call.
                    </p>
                  </div>
                  <Button
                    disabled={loading}
                    className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCalling(false);
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Configuring...
                      </>
                    ) : (
                      "Launch Live session"
                    )}
                  </Button>
                </Card>

                {/* Automated Background Calling */}
                <Card
                  className="border border-gray-200 hover:border-purple-300 hover:bg-gray-50/50 cursor-pointer transition-colors p-4 flex flex-col justify-between"
                  onClick={() => handleStartCalling(true)}
                >
                  <div>
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-3">
                      <Play size={20} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      Automated Background Calling
                    </h4>
                    <p className="text-sm text-gray-600">
                      Let the voice agent call contacts automatically in the background. Calls are
                      logged for dashboard visualization.
                    </p>
                  </div>
                  <Button
                    disabled={loading}
                    variant="outline"
                    className="mt-6 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCalling(true);
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      "Start Automated Calling"
                    )}
                  </Button>
                </Card>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="ghost" onClick={() => setStep("contacts")}>
                  ← Back to Contacts
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close & Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
