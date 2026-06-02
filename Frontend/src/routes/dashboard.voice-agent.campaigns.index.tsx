import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Upload,
  Mic,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { env } from "@/config/env";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/voice-agent/campaigns/")({
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
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Start campaign modal states
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startStep, setStartStep] = useState<'contacts' | 'mode'>('contacts');
  const [uploadMode, setUploadMode] = useState<'manual' | 'text' | 'file'>('manual');
  
  const [manualContacts, setManualContacts] = useState<Array<{ name: string; phone_number: string; email: string }>>([
    { name: "", phone_number: "", email: "" }
  ]);
  const [textPasteContent, setTextInputContacts] = useState("");
  const [fileContacts, setFileContacts] = useState<Array<{ name: string; phone_number: string; email: string }>>([]);
  const [startCallingLoading, setStartCallingLoading] = useState(false);

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
        toast.success(`Campaign status updated to ${newStatus}`);
        fetchCampaigns();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to update campaign status");
      }
    } catch (error) {
      console.error("Failed to update campaign status:", error);
      toast.error("Failed to update campaign status due to network error");
    }
  };

  const handleDirectStartCalling = async (campaignId: number) => {
    setStartCallingLoading(true);
    const token = localStorage.getItem("saadhyam_token");
    try {
      const startResponse = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/start-calling?run_background=true`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (startResponse.ok) {
        toast.success("Interactive calling session ready!");
        setShowStartDialog(false);
        sessionStorage.setItem(`voice-campaign-auto-mode:${campaignId}`, "sim");
        navigate({
          to: "/dashboard/voice-agent/campaigns/$campaignId/calling",
          params: { campaignId: campaignId.toString() }
        });
      } else {
        const errData = await startResponse.json();
        throw new Error(errData.detail || "Failed to start campaign calling");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred starting campaign calling");
    } finally {
      setStartCallingLoading(false);
    }
  };

  const handleStartCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    if (campaign.total_contacts === 0) {
      setStartStep('contacts');
      setShowStartDialog(true);
    } else {
      handleDirectStartCalling(campaign.id);
    }
  };

  // Contacts Text Parser
  const parseContactsData = (text: string): Array<{ name: string; phone_number: string; email: string }> => {
    const lines = text.split(/\r?\n/);
    const parsed: Array<{ name: string; phone_number: string; email: string }> = [];
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      // Attempt to split by common separators
      const separators = [',', ';', ':', '|', '\t'];
      let parts: string[] = [];
      let foundSeparator = false;
      
      for (const sep of separators) {
        if (cleanLine.includes(sep)) {
          parts = cleanLine.split(sep).map(p => p.trim());
          foundSeparator = true;
          break;
        }
      }
      
      if (!foundSeparator) {
        parts = cleanLine.split(/\s+/).map(p => p.trim());
      }
      
      if (parts.length >= 2) {
        const part1 = parts[0];
        const part2 = parts[1];
        const part3 = parts[2] || '';
        
        const isPhone = (str: string) => /^\+?[0-9\s-]{7,15}$/.test(str.replace(/[\s-]/g, ''));
        
        if (isPhone(part2)) {
          parsed.push({ name: part1, phone_number: part2.replace(/[\s-]/g, ''), email: isPhone(part3) ? '' : part3 });
        } else if (isPhone(part1)) {
          parsed.push({ name: part2, phone_number: part1.replace(/[\s-]/g, ''), email: isPhone(part3) ? '' : part3 });
        } else {
          parsed.push({ name: part1, phone_number: part2.replace(/[\s-]/g, ''), email: part3 });
        }
      } else if (parts.length === 1) {
        const phone = parts[0].replace(/[\s-]/g, '');
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

  const handleCreateContactsAndStart = async (runBackground: boolean) => {
    if (!selectedCampaign) return;
    setStartCallingLoading(true);
    const token = localStorage.getItem("saadhyam_token");
    const campaignId = selectedCampaign.id;

    try {
      // 1. Upload contacts if campaign is empty
      if (selectedCampaign.total_contacts === 0) {
        let contactsToUpload: Array<{ name: string; phone_number: string; email: string }> = [];
        if (uploadMode === 'manual') {
          contactsToUpload = manualContacts.filter(c => c.name && c.phone_number);
        } else if (uploadMode === 'text') {
          contactsToUpload = parseContactsData(textPasteContent);
        } else if (uploadMode === 'file') {
          contactsToUpload = fileContacts;
        }

        if (contactsToUpload.length === 0) {
          toast.error("Please add at least one contact name and phone number");
          setStartCallingLoading(false);
          return;
        }

        const uploadResponse = await fetch(
          `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/contacts/bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ contacts: contactsToUpload }),
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload contacts");
        }
        toast.success(`Uploaded ${contactsToUpload.length} contacts!`);
      }

      // 2. Start calling (background or interactive)
      const startResponse = await fetch(
        `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/start-calling?run_background=true`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (startResponse.ok) {
        toast.success(runBackground ? "Automated background campaign started!" : "Interactive calling session ready!");
        setShowStartDialog(false);
        navigate({
          to: "/dashboard/voice-agent/campaigns/$campaignId/calling",
          params: { campaignId: campaignId.toString() }
        });
      } else {
        const errData = await startResponse.json();
        throw new Error(errData.detail || "Failed to start campaign calling");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred starting campaign calling");
    } finally {
      setStartCallingLoading(false);
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
    <div className="p-4 md:p-6 space-y-8 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Phone size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Campaigns</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your automated calling campaigns</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all cursor-pointer" asChild>
            <Link to="/dashboard/voice-agent/create-campaign">
              <Plus size={20} className="mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>
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
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600" asChild>
                  <Link to="/dashboard/voice-agent/create-campaign">
                    <Plus size={20} className="mr-2" />
                    Create Campaign
                  </Link>
                </Button>
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
                          onClick={() => handleStartCampaignClick(campaign)}
                          className="text-green-600 border-green-600 hover:bg-green-50 font-semibold"
                        >
                          <Play size={16} className="mr-1" />
                          Start
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({
                            to: "/dashboard/voice-agent/campaigns/$campaignId/calling",
                            params: { campaignId: campaign.id.toString() }
                          })}
                          className="text-purple-600 border-purple-600 hover:bg-purple-50 font-semibold"
                        >
                          <Phone size={16} className="mr-1" />
                          View Live Calls
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartCampaignClick(campaign)}
                          className="text-green-600 border-green-600 hover:bg-green-50 font-semibold"
                        >
                          <Play size={16} className="mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({
                          to: "/dashboard/voice-agent/campaigns/$campaignId",
                          params: { campaignId: campaign.id.toString() }
                        })}
                      >
                        <BarChart3 size={16} className="mr-1" />
                        Details
                      </Button>
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
                        {(campaign.conversion_rate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Avg Duration</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {Math.round(campaign.avg_call_duration ?? 0)}s
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

      {/* Start Campaign Dialog */}
      {showStartDialog && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {startStep === 'contacts' ? "Step 1: Add Customer Contacts" : "Step 2: Choose Calling Mode"}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Campaign: {selectedCampaign.name}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-gray-200"
                onClick={() => setShowStartDialog(false)}
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              {startStep === 'contacts' && (
                <div className="space-y-6">
                  {/* Mode Toggles */}
                  <div className="flex border-b border-gray-200">
                    <button
                      className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                        uploadMode === "manual" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setUploadMode("manual")}
                    >
                      ✍️ Manual Entry
                    </button>
                    <button
                      className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                        uploadMode === "text" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setUploadMode("text")}
                    >
                      📝 Copy & Paste
                    </button>
                    <button
                      className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                        uploadMode === "file" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-900"
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
                        <div key={index} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500">Name</label>
                            <Input
                              placeholder="Kiran Kumar"
                              value={contact.name}
                              onChange={(e) => {
                                const updated = [...manualContacts];
                                updated[index].name = e.target.value;
                                setManualContacts(updated);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500">Phone</label>
                            <Input
                              placeholder="+919876543210"
                              value={contact.phone_number}
                              onChange={(e) => {
                                const updated = [...manualContacts];
                                updated[index].phone_number = e.target.value;
                                setManualContacts(updated);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500">Email (Optional)</label>
                            <Input
                              placeholder="kiran@gmail.com"
                              value={contact.email}
                              onChange={(e) => {
                                const updated = [...manualContacts];
                                updated[index].email = e.target.value;
                                setManualContacts(updated);
                              }}
                            />
                          </div>
                          {manualContacts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                              onClick={() => setManualContacts(manualContacts.filter((_, i) => i !== index))}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setManualContacts([...manualContacts, { name: "", phone_number: "", email: "" }])}
                        className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        + Add Another Contact
                      </Button>
                    </div>
                  )}

                  {/* Text Paste */}
                  {uploadMode === "text" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">
                          Paste contact rows here:
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-40"
                          placeholder="Formats accepted:&#10;Kiran Kumar, +919876543210&#10;Kiran Kumar: 9876543210&#10;Jane Smith: jane@example.com: 9876543211"
                          value={textPasteContent}
                          onChange={(e) => setTextInputContacts(e.target.value)}
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
                        <label htmlFor="modal-file-upload" className="cursor-pointer text-purple-600 font-semibold hover:underline block">
                          Upload CSV or Text File
                        </label>
                        <Input
                          id="modal-file-upload"
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

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleCreateContactsAndStart(false)}
                      disabled={startCallingLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {startCallingLoading ? (
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

              {startStep === 'mode' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Interactive Mic Mode */}
                    <Card
                      className="border-2 border-purple-400 bg-purple-50/40 hover:bg-purple-50/70 cursor-pointer transition-colors p-4 flex flex-col justify-between"
                      onClick={() => handleCreateContactsAndStart(false)}
                    >
                      <div>
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3 animate-pulse">
                          <Mic size={20} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">Talk Live (Interactive Mic Testing)</h4>
                        <p className="text-sm text-gray-600">
                          Talk to the voice agent yourself using your microphone and laptop speakers. Real-time back-and-forth testing call.
                        </p>
                      </div>
                      <Button
                        disabled={startCallingLoading}
                        className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateContactsAndStart(false);
                        }}
                      >
                        {startCallingLoading ? (
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
                      onClick={() => handleCreateContactsAndStart(true)}
                    >
                      <div>
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-3">
                          <Play size={20} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">Automated Background Calling</h4>
                        <p className="text-sm text-gray-600">
                          Let the voice agent call contacts automatically in the background. Calls are logged for dashboard visualization.
                        </p>
                      </div>
                      <Button
                        disabled={startCallingLoading}
                        variant="outline"
                        className="mt-6 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateContactsAndStart(true);
                        }}
                      >
                        {startCallingLoading ? (
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

                  {/* Back button */}
                  <div className="flex justify-start pt-4 border-t">
                    {selectedCampaign.total_contacts === 0 && (
                      <Button
                        variant="ghost"
                        onClick={() => setStartStep('contacts')}
                      >
                        ← Back to Contacts
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
