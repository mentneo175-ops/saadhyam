import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, FileText, Edit3, Save, X, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/dashboard" })}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Details</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your business information and profile
                </p>
              </div>
            </div>
            
            {!isEditing && businessProfile?.business_setup_completed && (
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit3 size={16} />
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
            <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-8">
            {!businessProfile?.business_setup_completed ? (
              // No business profile setup
              <div className="text-center py-12">
                <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Business Profile Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Complete your business setup to access all features
                </p>
                <Button
                  onClick={() => navigate({ to: "/onboarding" })}
                  className="flex items-center gap-2"
                >
                  <Building2 size={16} />
                  Complete Business Setup
                </Button>
              </div>
            ) : isEditing ? (
              // Edit mode
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Business Information</h2>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={editForm.business_name}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Business Type
                    </label>
                    <select
                      name="business_type"
                      value={editForm.business_type}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="business_location"
                      value={editForm.business_location}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                      placeholder="Enter business location"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Business Description
                    </label>
                    <textarea
                      name="business_description"
                      value={editForm.business_description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                      placeholder="Describe your business, services, and goals..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.business_description.length}/2000 characters (minimum 20)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // View mode
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 size={18} className="text-gray-500" />
                          <label className="text-sm font-medium text-gray-700">Business Name</label>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {businessProfile.business_name || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 size={18} className="text-gray-500" />
                          <label className="text-sm font-medium text-gray-700">Business Type</label>
                        </div>
                        <p className="text-gray-900">
                          {businessProfile.business_type || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={18} className="text-gray-500" />
                          <label className="text-sm font-medium text-gray-700">Location</label>
                        </div>
                        <p className="text-gray-900">
                          {businessProfile.business_location || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={18} className="text-gray-500" />
                      <label className="text-sm font-medium text-gray-700">Business Description</label>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {businessProfile.business_description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Future Features */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">📄 PDF Upload</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Upload business documents and brochures
                      </p>
                      <Button variant="outline" size="sm" disabled>
                        Coming Soon
                      </Button>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">🎤 Voice Input</h4>
                      <p className="text-sm text-gray-600 mb-3">
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
        </div>
      </div>
    </div>
  );
}