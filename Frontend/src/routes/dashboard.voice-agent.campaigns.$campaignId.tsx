import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/campaigns/$campaignId")({
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

function CampaignDetailsPage() {
  const { campaignId } = Route.useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showContactUpload, setShowContactUpload] = useState(false);
  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaignData, isLoading: campaignLoading } = useQuery<{
    success: boolean;
    campaign: Campaign;
  }>({
    queryKey: ["voice-campaign", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
        }
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
        }
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
        }
      );
      if (!response.ok) throw new Error("Failed to fetch calls");
      return response.json();
    },
    enabled: activeTab === "calls",
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
        }
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
        }
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
    mutationFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/start-calling`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start calling");
      }
      return response.json();
    },
    onSuccess: () => {
      // Redirect to calling interface
      window.location.href = `/dashboard/voice-agent/campaigns/${campaignId}/calling`;
    },
  });

  const campaign = campaignData?.campaign;
  const analytics = analyticsData?.analytics;

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
          <Button onClick={() => (window.location.href = "/dashboard/voice-agent")}>
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
            onClick={() => (window.location.href = "/dashboard/voice-agent")}
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
              onClick={() => startCallingMutation.mutate()}
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
            <Button
              onClick={() => (window.location.href = `/dashboard/voice-agent/campaigns/${campaignId}/calling`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Phone size={16} className="mr-2" />
              View Live Calls
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button
              onClick={() => (window.location.href = `/dashboard/voice-agent/campaigns/${campaignId}/calling`)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Phone size={16} className="mr-2" />
              Resume Calling
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
            <p className="text-sm text-gray-500 mt-1">
              {analytics?.pending_calls || 0} pending
            </p>
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
              {analytics?.conversion_rate.toFixed(1) || 0}%
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
                    <span className="font-semibold">{analytics?.conversion_rate.toFixed(1) || 0}%</span>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
  const [contacts, setContacts] = useState<Array<{ name: string; phone_number: string; email?: string }>>([
    { name: "", phone_number: "", email: "" },
  ]);

  const uploadMutation = useMutation({
    mutationFn: async (data: { contacts: Array<{ name: string; phone_number: string; email?: string }> }) => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/contacts/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to upload contacts");
      return response.json();
    },
    onSuccess,
  });

  const addContact = () => {
    setContacts([...contacts, { name: "", phone_number: "", email: "" }]);
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validContacts = contacts.filter((c) => c.name && c.phone_number);
    uploadMutation.mutate({ contacts: validContacts });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Import Contacts</CardTitle>
          <CardDescription>Add contacts to this campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => updateContact(index, "name", e.target.value)}
                  required
                />
                <Input
                  placeholder="Phone"
                  value={contact.phone_number}
                  onChange={(e) => updateContact(index, "phone_number", e.target.value)}
                  required
                />
                <Input
                  placeholder="Email (optional)"
                  value={contact.email}
                  onChange={(e) => updateContact(index, "email", e.target.value)}
                />
                {contacts.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeContact(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addContact} className="w-full">
              + Add Another Contact
            </Button>

            {uploadMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                {uploadMutation.error?.message || "Failed to upload contacts"}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Upload Contacts
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
