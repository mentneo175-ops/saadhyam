import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Upload,
  Plus,
  Users,
  Search,
  Filter,
  Download,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Loader2,
  FileSpreadsheet,
  UserPlus,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/leads")({
  component: LeadsPage,
});

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  language?: string;
  location?: string;
  interest?: string;
  call_attempts: number;
  is_completed: boolean;
  created_at: string;
}

function LeadsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // New lead form
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    language: "english",
    location: "",
    interest: "",
    notes: ""
  });

  // Fetch campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ["voice-campaigns"],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Fetch leads for selected campaign
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["campaign-leads", selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/v2/voice-agent/campaigns/${selectedCampaign}/leads`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.json();
    },
    enabled: !!selectedCampaign,
  });

  // Upload leads mutation
  const uploadLeadsMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCampaign) throw new Error("No campaign selected");
      
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/v2/voice-agent/campaigns/${selectedCampaign}/leads/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-leads", selectedCampaign] });
      setShowUploadModal(false);
      setUploadFile(null);
    },
  });

  // Add single lead mutation
  const addLeadMutation = useMutation({
    mutationFn: async (leadData: typeof newLead) => {
      if (!selectedCampaign) throw new Error("No campaign selected");

      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/v2/voice-agent/campaigns/${selectedCampaign}/leads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(leadData),
        }
      );

      if (!response.ok) throw new Error("Failed to add lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-leads", selectedCampaign] });
      setShowAddLeadModal(false);
      setNewLead({
        name: "",
        phone: "",
        email: "",
        language: "english",
        location: "",
        interest: "",
        notes: ""
      });
    },
  });

  const handleUpload = () => {
    if (uploadFile) {
      uploadLeadsMutation.mutate(uploadFile);
    }
  };

  const handleAddLead = () => {
    addLeadMutation.mutate(newLead);
  };

  const filteredLeads = leadsData?.leads?.filter((lead: Lead) =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone.includes(searchQuery)
  ) || [];

  const downloadTemplate = () => {
    const csvContent = "name,phone,email,language,location,interest,notes\nJohn Doe,+919876543210,john@example.com,english,Hyderabad,High,Interested in product\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_template.csv";
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Lead Management
          </h1>
          <p className="text-gray-600 mt-1">
            Upload and manage leads for your voice campaigns
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/dashboard/voice-agent"}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Campaign Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Campaign</CardTitle>
          <CardDescription>Choose a campaign to manage its leads</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedCampaign || ""}
            onChange={(e) => setSelectedCampaign(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Select a campaign --</option>
            {campaignsData?.campaigns?.map((campaign: any) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.total_contacts} contacts)
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <>
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Upload size={20} className="mr-2" />
              Upload CSV/Excel
            </Button>
            <Button
              onClick={() => setShowAddLeadModal(true)}
              variant="outline"
            >
              <UserPlus size={20} className="mr-2" />
              Add Single Lead
            </Button>
            <Button
              onClick={downloadTemplate}
              variant="outline"
            >
              <Download size={20} className="mr-2" />
              Download Template
            </Button>
          </div>

          {/* Search & Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search leads by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads List */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 size={48} className="mx-auto text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600">Loading leads...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredLeads.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No leads yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload a CSV file or add leads manually to get started
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <Upload size={20} className="mr-2" />
                      Upload Leads
                    </Button>
                    <Button
                      onClick={() => setShowAddLeadModal(true)}
                      variant="outline"
                    >
                      <Plus size={20} className="mr-2" />
                      Add Lead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.map((lead: Lead, index: number) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lead.name}
                            </h3>
                            {lead.is_completed && (
                              <Badge className="bg-green-100 text-green-700">
                                Completed
                              </Badge>
                            )}
                            {lead.language && (
                              <Badge variant="outline">{lead.language}</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone size={16} />
                              <span>{lead.phone}</span>
                            </div>
                            {lead.email && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={16} />
                                <span>{lead.email}</span>
                              </div>
                            )}
                            {lead.location && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={16} />
                                <span>{lead.location}</span>
                              </div>
                            )}
                          </div>

                          {lead.interest && (
                            <div className="mt-2 flex items-center gap-2">
                              <Star size={16} className="text-yellow-500" />
                              <span className="text-sm text-gray-600">
                                Interest: {lead.interest}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            <span>Call Attempts: {lead.call_attempts}</span>
                            <span>Added: {new Date(lead.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats */}
          {leadsData?.leads && leadsData.leads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{leadsData.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {leadsData.leads.filter((l: Lead) => l.is_completed).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {leadsData.leads.filter((l: Lead) => !l.is_completed).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Attempts</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(leadsData.leads.reduce((sum: number, l: Lead) => sum + l.call_attempts, 0) / leadsData.leads.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">Upload Leads</h3>
            <div className="space-y-4">
              <div>
                <Label>Select CSV or Excel File</Label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Required columns: name, phone. Optional: email, language, location, interest, notes
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploadLeadsMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {uploadLeadsMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 my-8"
          >
            <h3 className="text-xl font-bold mb-4">Add New Lead</h3>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newLead.name}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  placeholder="+919876543210"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Language</Label>
                <select
                  value={newLead.language}
                  onChange={(e) => setNewLead({...newLead, language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish</option>
                  <option value="telugu">Telugu</option>
                  <option value="tamil">Tamil</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={newLead.location}
                  onChange={(e) => setNewLead({...newLead, location: e.target.value})}
                  placeholder="Hyderabad"
                />
              </div>
              <div>
                <Label>Interest Level</Label>
                <Input
                  value={newLead.interest}
                  onChange={(e) => setNewLead({...newLead, interest: e.target.value})}
                  placeholder="High, Medium, Low"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddLead}
                  disabled={!newLead.name || !newLead.phone || addLeadMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {addLeadMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Add Lead
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddLeadModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
