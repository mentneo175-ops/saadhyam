/**
 * Business Onboarding Modal
 * Shows when user hasn't completed business profile setup
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2, MapPin, FileText, X } from "lucide-react";
import { apiClient } from "@/lib/api";

interface BusinessOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

export function BusinessOnboarding({ isOpen, onComplete, onSkip }: BusinessOnboardingProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "",
    business_location: "",
    business_description: "",
  });

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNext = () => {
    // Validate current step
    if (step === 1 && !formData.business_name.trim()) {
      setError("Please enter your business name");
      return;
    }
    if (step === 2 && !formData.business_type.trim()) {
      setError("Please enter your business type");
      return;
    }
    if (step === 3 && !formData.business_location.trim()) {
      setError("Please enter your business location");
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    // Validate description
    if (!formData.business_description.trim() || formData.business_description.length < 20) {
      setError("Please provide a description (at least 20 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save business profile
      await apiClient.updateBusinessProfile(formData);

      // Save to localStorage as backup
      localStorage.setItem("businessProfile", JSON.stringify({
        business_name: formData.business_name,
        business_type: formData.business_type,
        location: formData.business_location,
        description: formData.business_description,
      }));

      // Call onComplete callback
      onComplete();
    } catch (err: any) {
      console.error("Error saving business profile:", err);
      setError(err.message || "Failed to save business profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Welcome to Saadhyam AI</h2>
                <p className="text-sm text-white/90">Let's set up your business profile</p>
              </div>
            </div>
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Skip onboarding"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/80 mt-2">Step {step} of 4</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Business Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">What's your business name?</h3>
                  <p className="text-sm text-gray-600">This helps us personalize your experience</p>
                </div>
              </div>

              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => handleInputChange("business_name", e.target.value)}
                placeholder="e.g., Luxury Spa Resort, Tech Solutions Inc."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Business Type */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Sparkles size={20} className="text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">What type of business do you run?</h3>
                  <p className="text-sm text-gray-600">Help us understand your industry</p>
                </div>
              </div>

              <input
                type="text"
                value={formData.business_type}
                onChange={(e) => handleInputChange("business_type", e.target.value)}
                placeholder="e.g., Spa & Wellness, Restaurant, Retail Store, Service"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                autoFocus
              />

              <div className="flex flex-wrap gap-2 mt-4">
                {["Restaurant", "Retail Store", "Spa & Wellness", "Salon", "Clinic", "Service Business"].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleInputChange("business_type", type)}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Where is your business located?</h3>
                  <p className="text-sm text-gray-600">We'll provide location-specific insights</p>
                </div>
              </div>

              <input
                type="text"
                value={formData.business_location}
                onChange={(e) => handleInputChange("business_location", e.target.value)}
                placeholder="e.g., Hyderabad, Banjara Hills or Kakinada, Andhra Pradesh"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Step 4: Description */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Tell us about your business</h3>
                  <p className="text-sm text-gray-600">
                    Describe your services, target customers, and goals (min. 20 characters)
                  </p>
                </div>
              </div>

              <textarea
                value={formData.business_description}
                onChange={(e) => handleInputChange("business_description", e.target.value)}
                placeholder="e.g., We offer premium spa services including massages, facials, and wellness treatments. Our target customers are professionals aged 25-45 looking for relaxation and self-care. We aim to become the top-rated spa in our area."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
                rows={6}
                autoFocus
              />

              <p className="text-xs text-gray-500">
                {formData.business_description.length} / 20 characters minimum
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className="px-6"
            >
              Back
            </Button>

            {step < 4 ? (
              <Button variant="hero" onClick={handleNext} className="px-8">
                Next
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
