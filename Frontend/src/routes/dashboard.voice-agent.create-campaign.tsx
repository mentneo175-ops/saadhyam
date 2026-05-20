import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Phone, Globe, Mic } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { FeatureDisabledState } from "@/components/feature/FeatureDisabledState";
import { FEATURE_KEYS } from "@/config/featureKeys";
import { useFeatureGate } from "@/hooks/useFeatureGate";

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
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    description: "",
    language: "english",
    voice_type: "female",
    script_template: "",
  });
  const featureGate = useFeatureGate(FEATURE_KEYS.VOICE_AGENT);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch("http://localhost:8000/api/voice-agent/campaigns", {
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
    onSuccess: (data) => {
      // Redirect to campaign details page
      window.location.href = `/dashboard/voice-agent/campaigns/${data.campaign.id}`;
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

  if (featureGate.isDisabled) {
    return (
      <FeatureDisabledState
        title="Create Voice Campaign"
        featureLabel={FEATURE_KEYS.VOICE_AGENT}
        message="Campaign creation is currently disabled by your admin. Refresh after the module is re-enabled."
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "/dashboard/voice-agent")}
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
                onClick={() => (window.location.href = "/dashboard/voice-agent")}
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
