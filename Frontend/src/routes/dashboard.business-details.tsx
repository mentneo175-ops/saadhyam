import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, FileText, Edit3, Save, X, AlertCircle, User, Mail, Calendar, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { PDFUpload } from "@/components/business/PDFUpload";
import { VoiceInput } from "@/components/business/VoiceInput";
import { WebsiteImport } from "@/components/business/WebsiteImport";

export const Route = createFileRoute("/dashboard/business-details")({
  head: () => ({ meta: [{ title: "Business Details — Saadhyam AI" }] }),
  component: BusinessDetailsPage,
});

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
  business_location?: string;
  business_description?: string;
  business_setup_completed: boolean;
}

function BusinessDetailsPage() {
  const navigate = useNavigate();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    business_name: "",
    business_type: "",
    business_location: "",
    business_description: "",
  });
  const [baseDescription, setBaseDescription] = useState(""); // Store base text before live recording

  // Handler for PDF/Website text extraction
  const handleTextExtracted = (extractedText: string, title?: string) => {
    // Reset base description when final text is extracted
    setBaseDescription("");
    
    // Intelligently merge extracted text with existing description
    const currentText = editForm.business_description.trim();
    
    if (!currentText) {
      // If description is empty, just use extracted text
      setEditForm(prev => ({ ...prev, business_description: extractedText }));
    } else {
      // If there's existing text, append intelligently
      const separator = currentText.endsWith('.') || currentText.endsWith('!') || currentText.endsWith('?') 
        ? ' ' 
        : '. ';
      setEditForm(prev => ({ 
        ...prev, 
        business_description: `${currentText}${separator}${extractedText}` 
      }));
    }
    
    // If title is provided and business name is empty, suggest it
    if (title && !editForm.business_name.trim()) {
      toast.success(`Suggestion: Use "${title}" as business name?`, {
        action: {
          label: "Use it",
          onClick: () => setEditForm(prev => ({ ...prev, business_name: title }))
        }
      });
    }
    
    toast.success("Text added to description!");
  };

  // Handler for live voice transcription
  const handleLiveTranscript = (liveText: string) => {
    // Update description in real-time while recording
    if (!liveText.trim()) {
      // Store base description when recording starts
      setBaseDescription(editForm.business_description);
      return;
    }
    
    // Use stored base description to avoid duplication
    const base = baseDescription || editForm.business_description;
    
    // Only update if the live text is different from what's already there
    const currentWithoutBase = editForm.business_description.replace(base, '').trim();
    if (currentWithoutBase === liveText.trim()) {
      return; // No change needed
    }
    
    // Add separator if base text exists
    const separator = base && !base.endsWith('.') && !base.endsWith('!') && !base.endsWith('?') 
      ? '. ' 
      : base ? ' ' : '';
    
    // Update with base + live transcript
    setEditForm(prev => ({ 
      ...prev, 
      business_description: base + separator + liveText
    }));
  };

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await apiClient.getBusinessProfile();
      setBusinessProfile(profile);
      
      // Initialize edit form with current data
      setEditForm({
        business_name: profile.business_name || "",
        business_type: profile.business_type || "",
        business_location: profile.business_location || "",
        business_description: profile.business_description || "",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load business profile";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset form to original values
    if (businessProfile) {
      setEditForm({
        business_name: businessProfile.business_name || "",
        business_type: businessProfile.business_type || "",
        business_location: businessProfile.business_location || "",
        business_description: businessProfile.business_description || "",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!editForm.business_name.trim()) {
      setError("Business name is required");
      return false;
    }
    if (!editForm.business_type.trim()) {
      setError("Business type is required");
      return false;
    }
    if (!editForm.business_location.trim()) {
      setError("Business location is required");
      return false;
    }
    if (!editForm.business_description.trim()) {
      setError("Business description is required");
      return false;
    }
    if (editForm.business_description.length < 20) {
      setError("Business description must be at least 20 characters");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const updatedProfile = await apiClient.updateBusinessProfile(editForm);
      setBusinessProfile(updatedProfile);
      setIsEditing(false);
      toast.success("Business profile updated successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update business profile";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const businessTypes = [
    "Restaurant", "Hotel", "Salon", "Gym", "Clinic", "Retail Store", 
    "E-commerce", "Service", "Education", "Healthcare", "Other"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading business details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard-style Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
             
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Business Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your business information and settings
                </p>
              </div>
            </div>
            
            {!isEditing && businessProfile?.business_setup_completed && (
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit3 size={16} />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <AlertCircle size={18} className="text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!businessProfile?.business_setup_completed ? (
            // Empty State
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Building2 size={32} className="text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No Business Profile Found</h3>
              <p className="mb-6 text-muted-foreground">
                Complete your business setup to unlock all platform features
              </p>
              <Button
                onClick={() => navigate({ to: "/onboarding" })}
                className="flex items-center gap-2"
              >
                <Building2 size={16} />
                Complete Business Setup
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Profile Header Card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Building2 size={24} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {businessProfile.business_name || "Business Name"}
                      </h2>
                      <p className="text-muted-foreground">
                        {businessProfile.business_type} • {businessProfile.business_location}
                      </p>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <X size={16} className="mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <Save size={16} className="mr-1" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing ? (
                // Edit Form
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-6 text-lg font-semibold">Edit Business Information</h3>
                  
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Business Name</label>
                        <input
                          type="text"
                          name="business_name"
                          value={editForm.business_name}
                          onChange={handleInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter business name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Business Type</label>
                        <select
                          name="business_type"
                          value={editForm.business_type}
                          onChange={handleInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select business type</option>
                          {businessTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <input
                        type="text"
                        name="business_location"
                        value={editForm.business_location}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter business location"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Description</label>
                      <div className="space-y-4">
                        {/* Textarea */}
                        <div className="relative group">
                          <textarea
                            name="business_description"
                            value={editForm.business_description}
                            onChange={handleInputChange}
                            rows={6}
                            className="flex min-h-[80px] w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-300"
                            placeholder="Describe your business, services, challenges, and goals..."
                          />
                          {/* AI Ready indicator */}
                          {editForm.business_description.length > 0 && (
                            <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full shadow-sm">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI Ready</span>
                            </div>
                          )}
                        </div>

                        {/* Character counter */}
                        <div className="flex items-center justify-between text-xs px-2">
                          <div className="flex items-center gap-2">
                            {editForm.business_description.length > 5000 ? (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-600 font-semibold">
                                  Too long! Shorten by {editForm.business_description.length - 5000} chars
                                </span>
                              </>
                            ) : editForm.business_description.length >= 20 ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50"></div>
                                <span className="text-emerald-600 font-semibold">Perfect length</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-amber-600 font-semibold">
                                  {20 - editForm.business_description.length} more needed
                                </span>
                              </>
                            )}
                          </div>
                          <span className={`font-mono font-bold ${
                            editForm.business_description.length > 5000 
                              ? 'text-red-600' 
                              : editForm.business_description.length > 4500 
                              ? 'text-amber-600' 
                              : 'text-gray-600'
                          }`}>
                            {editForm.business_description.length.toLocaleString()}<span className="text-gray-400 font-normal">/5,000</span>
                          </span>
                        </div>

                        {/* Premium divider */}
                        <div className="relative py-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-border"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <div className="px-5 py-2 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-full border-2 border-purple-200 shadow-lg">
                              <div className="flex items-center gap-2.5">
                                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                                <span className="text-sm font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                                  Quick Import Options
                                </span>
                                <Sparkles className="w-4 h-4 text-pink-600 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Import options grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* PDF Upload */}
                          <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                            <div className="relative h-full">
                              <PDFUpload 
                                onTextExtracted={handleTextExtracted}
                                disabled={isSaving}
                              />
                            </div>
                          </div>

                          {/* Voice Input */}
                          <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                            <div className="relative h-full">
                              <VoiceInput 
                                onTextExtracted={handleTextExtracted}
                                onLiveTranscript={handleLiveTranscript}
                                disabled={isSaving}
                              />
                            </div>
                          </div>

                          {/* Website Import */}
                          <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                            <div className="relative h-full">
                              <WebsiteImport 
                                onTextExtracted={handleTextExtracted}
                                disabled={isSaving}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Helper text */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-muted-foreground font-medium">
                              Import from any source or type directly
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="grid gap-6">
                  {/* Business Information */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">Business Information</h3>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Building2 size={18} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                            <p className="text-base font-medium">
                              {businessProfile.business_name || "Not specified"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User size={18} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                            <p className="text-base">
                              {businessProfile.business_type || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Location</p>
                            <p className="text-base">
                              {businessProfile.business_location || "Not specified"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar size={18} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <p className="text-base">Profile Complete</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Description */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Business Description</h3>
                    </div>
                    <div className="rounded-md bg-muted/50 p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {businessProfile.business_description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-border bg-gradient-to-br from-purple-50 to-pink-50 p-4 hover:shadow-md transition-shadow">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                          <FileText size={18} className="text-white" />
                        </div>
                        <h4 className="mb-1 font-semibold">Edit Profile</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Update your business information
                        </p>
                        <Button variant="outline" size="sm" onClick={handleEdit} className="w-full">
                          <Edit3 size={14} className="mr-2" />
                          Edit Now
                        </Button>
                      </div>
                      
                      <div className="rounded-lg border border-border bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                          <Sparkles size={18} className="text-white" />
                        </div>
                        <h4 className="mb-1 font-semibold">AI Analysis</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Get AI-powered insights
                        </p>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      </div>

                      <div className="rounded-lg border border-border bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                          <Building2 size={18} className="text-white" />
                        </div>
                        <h4 className="mb-1 font-semibold">Export Data</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Download your business profile
                        </p>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Coming Soon
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}