import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, FileText, Edit3, Save, X, AlertCircle, User, Mail, Calendar } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

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
                      <textarea
                        name="business_description"
                        value={editForm.business_description}
                        onChange={handleInputChange}
                        rows={6}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        placeholder="Describe your business, services, and goals..."
                      />
                      <p className="text-xs text-muted-foreground">
                        {editForm.business_description.length}/2000 characters (minimum 20)
                      </p>
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

                  {/* Future Features */}
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">Additional Features</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-md border border-dashed border-border p-4 text-center">
                        <div className="mb-2 text-2xl">📄</div>
                        <h4 className="mb-1 font-medium">Document Upload</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Upload business documents and brochures
                        </p>
                        <Button variant="outline" size="sm" disabled>
                          Coming Soon
                        </Button>
                      </div>
                      
                      <div className="rounded-md border border-dashed border-border p-4 text-center">
                        <div className="mb-2 text-2xl">🎤</div>
                        <h4 className="mb-1 font-medium">Voice Input</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Record voice descriptions of your business
                        </p>
                        <Button variant="outline" size="sm" disabled>
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