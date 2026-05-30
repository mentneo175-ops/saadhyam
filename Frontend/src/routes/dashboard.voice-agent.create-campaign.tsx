import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Phone, Globe, Mic } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { env } from "@/config/env";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/voice-agent/create-campaign")({
  component: CreateCampaignPage,
});

interface CampaignFormData {
  name: string;
  description: string;
  language: string;
  voice_type: string;
  script_template: string;
}

function CreateCampaignPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    description: "",
    language: "english",
    voice_type: "female",
    script_template: "",
  });
  
  const [contacts, setContacts] = useState<Array<{ name: string; phone_number: string; email: string }>>([
    { name: "", phone_number: "", email: "" }
  ]);
  const [uploadMode, setUploadMode] = useState<'manual' | 'text' | 'file'>('manual');
  const [textPasteContent, setTextPasteContent] = useState("");

  const parseContactsData = (text: string): Array<{ name: string; phone_number: string; email: string }> => {
    const lines = text.split(/\r?\n/);
    const parsed: Array<{ name: string; phone_number: string; email: string }> = [];
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
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
        setContacts(parsed);
        toast.success(`Loaded ${parsed.length} contacts from file`);
      } else {
        toast.error("Could not parse any contacts. Ensure layout is: Name, Phone");
      }
    };
    reader.readAsText(file);
  };

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/api/voice-agent/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create campaign");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      const campaignId = data.campaign.id;
      const token = localStorage.getItem("saadhyam_token");
      
      let validContacts: Array<{ name: string; phone_number: string; email: string }> = [];
      if (uploadMode === 'manual') {
        validContacts = contacts.filter(c => c.name && c.phone_number);
      } else if (uploadMode === 'text') {
        validContacts = parseContactsData(textPasteContent);
      } else if (uploadMode === 'file') {
        validContacts = contacts.filter(c => c.name && c.phone_number);
      }

      if (validContacts.length > 0) {
        try {
          const uploadResponse = await fetch(
            `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaignId}/contacts/bulk`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ contacts: validContacts }),
            }
          );
          
          if (uploadResponse.ok) {
            toast.success(`Created campaign and uploaded ${validContacts.length} contacts!`);
          } else {
            toast.error("Campaign created, but failed to upload contacts.");
          }
        } catch (err) {
          console.error("Contacts upload error:", err);
          toast.error("Campaign created, but failed to upload contacts.");
        }
      } else {
        toast.success("Campaign created successfully!");
      }
      
      navigate({ to: "/dashboard/voice-agent/campaigns/$campaignId", params: { campaignId: campaignId.toString() } });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns" })}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Voice Campaign</h1>
          <p className="text-gray-600 mt-1">
            Set up a new automated calling campaign with AI conversations
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Configure your voice campaign settings and conversation script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Product Launch Campaign"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the campaign purpose..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language">
                <Globe size={16} className="inline mr-2" />
                Language <span className="text-red-500">*</span>
              </Label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="english">English</option>
                <option value="hinglish">Hinglish</option>
                <option value="telugu">Telugu</option>
                <option value="hindi">Hindi</option>
                <option value="tamil">Tamil</option>
              </select>
              <p className="text-sm text-gray-500">
                Select the language for AI conversations
              </p>
            </div>

            {/* Voice Type */}
            <div className="space-y-2">
              <Label htmlFor="voice_type">
                <Mic size={16} className="inline mr-2" />
                Voice Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="voice_type"
                name="voice_type"
                value={formData.voice_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="female">Female Voice</option>
                <option value="male">Male Voice</option>
              </select>
            </div>

            {/* Script Template */}
            <div className="space-y-2">
              <Label htmlFor="script_template">
                <Phone size={16} className="inline mr-2" />
                Conversation Script Template
              </Label>
              <Textarea
                id="script_template"
                name="script_template"
                placeholder="Hello! I'm calling from [Company Name] about [Product/Service]...

Key points to cover:
- Introduce yourself and company
- Explain the purpose of the call
- Ask qualifying questions
- Address objections
- Schedule follow-up if interested

Example:
'Hi, this is [Name] from [Company]. We help businesses [value proposition]. Do you have a moment to discuss how we can help you [benefit]?'"
                value={formData.script_template}
                onChange={handleChange}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500">
                Provide a conversation template for the AI agent. This will guide the
                conversation flow.
              </p>
            </div>

            {/* Step 2: Add Contacts */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Customer Contacts</h3>
              <p className="text-sm text-gray-500">
                Specify the customers to be called for this campaign. Upload via CSV/Text file or enter manually.
              </p>

              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadMode === "manual" ? "default" : "outline"}
                  onClick={() => setUploadMode("manual")}
                  size="sm"
                >
                  Manual Entry
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === "text" ? "default" : "outline"}
                  onClick={() => setUploadMode("text")}
                  size="sm"
                >
                  Copy & Paste
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === "file" ? "default" : "outline"}
                  onClick={() => setUploadMode("file")}
                  size="sm"
                >
                  CSV / Text File Upload
                </Button>
              </div>

              {uploadMode === "manual" && (
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="John Doe"
                          value={contact.name}
                          onChange={(e) => {
                            const updated = [...contacts];
                            updated[index].name = e.target.value;
                            setContacts(updated);
                          }}
                          required={index === 0}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Phone Number</Label>
                        <Input
                          placeholder="+919876543210"
                          value={contact.phone_number}
                          onChange={(e) => {
                            const updated = [...contacts];
                            updated[index].phone_number = e.target.value;
                            setContacts(updated);
                          }}
                          required={index === 0}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Email (Optional)</Label>
                        <Input
                          placeholder="john@example.com"
                          value={contact.email}
                          onChange={(e) => {
                            const updated = [...contacts];
                            updated[index].email = e.target.value;
                            setContacts(updated);
                          }}
                        />
                      </div>
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setContacts(contacts.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 h-9"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setContacts([...contacts, { name: "", phone_number: "", email: "" }])}
                    className="w-full mt-2"
                  >
                    + Add Another Customer
                  </Button>
                </div>
              )}

              {uploadMode === "text" && (
                <div className="space-y-2">
                  <Label htmlFor="textPasteContent">Paste contact rows here:</Label>
                  <Textarea
                    id="textPasteContent"
                    placeholder="Formats:&#10;Kiran Kumar, +919876543210&#10;Kiran Kumar: 9876543210&#10;Jane Smith: jane@example.com: 9876543211"
                    value={textPasteContent}
                    onChange={(e) => setTextPasteContent(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  {textPasteContent && (
                    <div className="bg-purple-50 text-purple-800 p-2.5 rounded text-xs font-semibold">
                      🔍 Detected {parseContactsData(textPasteContent).length} contacts.
                    </div>
                  )}
                </div>
              )}

              {uploadMode === "file" && (
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center space-y-3">
                  <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center">
                    <Globe size={48} className="mx-auto" />
                  </div>
                  <div>
                    <Label htmlFor="contact-file-upload" className="cursor-pointer text-purple-600 font-semibold hover:underline">
                      Upload a CSV or Text file
                    </Label>
                    <Input
                      id="contact-file-upload"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Accepted formats: .csv or .txt (Format: Name, Phone, Email)
                  </p>
                  
                  {contacts.length > 0 && contacts[0].name && (
                    <div className="bg-purple-50 text-purple-700 text-sm py-2 px-4 rounded-md inline-block">
                      📄 Loaded {contacts.filter(c => c.name).length} contacts from file
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Better Campaigns</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep the script natural and conversational</li>
                <li>• Include open-ended questions to engage customers</li>
                <li>• Prepare responses for common objections</li>
                <li>• Set clear call-to-action (schedule demo, send info, etc.)</li>
                <li>• Test with a small batch before scaling up</li>
              </ul>
            </div>

            {/* Error Message */}
            {createCampaignMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  ❌ {createCampaignMutation.error?.message || "Failed to create campaign"}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createCampaignMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/dashboard/voice-agent/campaigns" })}
                disabled={createCampaignMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
