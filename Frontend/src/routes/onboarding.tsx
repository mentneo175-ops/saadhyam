import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader, AlertCircle, Upload, Mic } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Business Setup — Saadhyam AI" }] }),
  component: OnboardingPage,
});

const businessTypes = [
  "Restaurant",
  "Hotel",
  "Salon",
  "Gym",
  "Clinic",
  "Retail Store",
  "E-commerce",
  "Service",
  "Education",
  "Healthcare",
  "Other",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "analyzing" | "complete">("form");
  const [formData, setFormData] = useState({
    businessType: "",
    businessName: "",
    description: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleBusinessTypeSelect = (type: string) => {
    setFormData((prev) => ({ ...prev, businessType: type }));
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.businessType.trim()) {
      setError("Please select a business type");
      return false;
    }
    if (!formData.businessName.trim()) {
      setError("Please enter your business name");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Please describe your business");
      return false;
    }
    if (formData.description.length < 20) {
      setError("Description must be at least 20 characters");
      return false;
    }
    if (!formData.location.trim()) {
      setError("Please enter your location");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsAnalyzing(true);
    setStep("analyzing");

    try {
      // Save business profile to database
      const businessProfile = {
        business_name: formData.businessName,
        business_type: formData.businessType,
        business_location: formData.location,
        business_description: formData.description,
      };

      // Update business profile in database
      await apiClient.updateBusinessProfile(businessProfile);

      // Combine all info into a comprehensive description for analysis
      const fullDescription = `Business Name: ${formData.businessName}
Business Type: ${formData.businessType}
Location: ${formData.location}

Description: ${formData.description}`;

      // Analyze the business
      const response = await apiClient.analyzeBusiness(fullDescription);

      if (response.success) {
        // Store analysis in localStorage for dashboard (temporary until we move this to DB too)
        localStorage.setItem("businessAnalysis", JSON.stringify(response));

        // Generate tasks from recommendations
        const generatedTasks = response.recommendations.map(
          (rec: string, idx: number) => ({
            title: rec,
            impact: idx < 2 ? "High" : idx < 4 ? "Medium" : "Low",
            time: "15 min",
            done: false,
            ai: true,
            icon: "Sparkles",
          })
        );

        // Create tasks in backend
        for (const task of generatedTasks) {
          try {
            await apiClient.createTask(task);
          } catch (err) {
            console.error("Failed to create task:", err);
          }
        }

        toast.success("Business profile saved! Welcome to Saadhyam AI 🎉");
        setStep("complete");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 2000);
      } else {
        setError(response.error || "Analysis failed");
        setStep("form");
        setIsAnalyzing(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save business profile";
      setError(errorMsg);
      setStep("form");
      setIsAnalyzing(false);
      toast.error(errorMsg);
    }
  };

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-6">
            <Loader size={32} className="text-purple-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Business</h2>
          <p className="text-gray-600 mb-8">
            Our AI is reviewing your business information and generating personalized insights...
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Analyzing business strengths</p>
            <p>✓ Identifying growth opportunities</p>
            <p>✓ Generating daily tasks</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <Sparkles size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Set! 🎉</h2>
          <p className="text-gray-600 mb-8">
            Your business analysis is ready. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
            <Sparkles size={24} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Saadhyam AI</h1>
          <p className="text-gray-600">
            Let's set up your business profile so we can provide personalized insights
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Business Type Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-3 block">
                What type of business do you run?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {businessTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeSelect(type)}
                    className={`p-3 rounded-lg border-2 transition font-medium text-sm ${
                      formData.businessType === type
                        ? "border-purple-600 bg-purple-50 text-purple-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-purple-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="e.g., The Italian Kitchen"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Downtown, Hyderabad"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            {/* Business Description */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Tell us about your business
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Describe your business, current challenges, and goals. This helps us provide better insights.
              </p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="E.g., We are a restaurant with 50 seats, open 6 days a week. We have Instagram and Facebook but post irregularly. We get about 30 customers per day and want to increase online visibility..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none min-h-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Input Methods Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 mb-2">📝 Input Methods</p>
              <p className="text-xs text-purple-800">
                Currently supporting text input. Voice and PDF uploads coming soon!
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader size={16} className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Analyze My Business
                </>
              )}
            </Button>

            <p className="text-xs text-gray-600 text-center">
              We'll analyze your business and create personalized daily tasks for you.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
