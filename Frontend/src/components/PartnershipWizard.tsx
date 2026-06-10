import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Briefcase,
  Users,
  Target,
  Handshake,
  DollarSign,
  Calendar,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/api";

interface WizardProps {
  onComplete: (data: FormData) => void;
  isLoading: boolean;
}

interface FormData {
  businessName: string;
  industry: string;
  targetAudience: string;
  collaborationGoal: string;
  partnershipType: string;
  budget: string;
  timeline: string;
  location: string;
}

const steps = [
  {
    id: "businessName",
    title: "What's your business name?",
    subtitle: "Let's start with the basics",
    icon: Building2,
    type: "text",
    placeholder: "e.g., Spice Garden Restaurant",
  },
  {
    id: "industry",
    title: "What industry are you in?",
    subtitle: "This helps us find relevant creators",
    icon: Briefcase,
    type: "select",
    options: [
      { value: "food", label: "Food & Beverage" },
      { value: "fashion", label: "Fashion & Apparel" },
      { value: "tech", label: "Technology" },
      { value: "beauty", label: "Beauty & Cosmetics" },
      { value: "fitness", label: "Health & Fitness" },
      { value: "travel", label: "Travel & Tourism" },
      { value: "education", label: "Education" },
      { value: "real-estate", label: "Real Estate" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "targetAudience",
    title: "Who's your target audience?",
    subtitle: "Describe your ideal customers",
    icon: Users,
    type: "text",
    placeholder: "e.g., Young professionals aged 25-35",
  },
  {
    id: "collaborationGoal",
    title: "What's your collaboration goal?",
    subtitle: "What do you want to achieve?",
    icon: Target,
    type: "textarea",
    placeholder: "e.g., Increase brand awareness and drive foot traffic to our new location",
  },
  {
    id: "partnershipType",
    title: "What type of partnership?",
    subtitle: "Choose your preferred collaboration style",
    icon: Handshake,
    type: "select",
    options: [
      { value: "sponsored-post", label: "Sponsored Posts" },
      { value: "product-review", label: "Product Reviews" },
      { value: "brand-ambassador", label: "Brand Ambassador" },
      { value: "event-collaboration", label: "Event Collaboration" },
      { value: "giveaway", label: "Giveaway Campaign" },
      { value: "affiliate", label: "Affiliate Partnership" },
    ],
  },
  {
    id: "budget",
    title: "What's your budget range?",
    subtitle: "This helps us match you with suitable creators",
    icon: DollarSign,
    type: "select",
    options: [
      { value: "10k-25k", label: "₹10,000 - ₹25,000" },
      { value: "25k-50k", label: "₹25,000 - ₹50,000" },
      { value: "50k-100k", label: "₹50,000 - ₹1,00,000" },
      { value: "100k-250k", label: "₹1,00,000 - ₹2,50,000" },
      { value: "250k+", label: "₹2,50,000+" },
    ],
  },
  {
    id: "timeline",
    title: "What's your timeline?",
    subtitle: "When do you want to start?",
    icon: Calendar,
    type: "select",
    options: [
      { value: "immediate", label: "Immediate (1-2 weeks)" },
      { value: "short", label: "Short-term (1 month)" },
      { value: "medium", label: "Medium-term (2-3 months)" },
      { value: "long", label: "Long-term (3+ months)" },
    ],
  },
  {
    id: "location",
    title: "Where are you located?",
    subtitle: "We'll find local and regional creators",
    icon: MapPin,
    type: "text",
    placeholder: "e.g., Visakhapatnam, Andhra Pradesh",
  },
];

export default function PartnershipWizard({ onComplete, isLoading }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    industry: "",
    targetAudience: "",
    collaborationGoal: "",
    partnershipType: "",
    budget: "",
    timeline: "",
    location: "",
  });
  const [direction, setDirection] = useState(1);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Auto-fill business details from database
  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const profile = await apiClient.getBusinessProfile();
          
          // Auto-fill form data from user's business profile
          setFormData((prev) => ({
            ...prev,
            businessName: profile.business_name || prev.businessName,
            industry: profile.business_type || prev.industry,
            location: profile.business_location || prev.location,
            // Keep other fields empty for user to fill
          }));
          
          console.log("✅ Auto-filled business profile:", {
            businessName: profile.business_name,
            industry: profile.business_type,
            location: profile.business_location,
          });
        }
      } catch (error) {
        console.error("Failed to load business profile:", error);
        // Continue with empty form if profile fetch fails
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadBusinessProfile();
  }, []);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    const fieldValue = formData[currentStepData.id as keyof FormData];
    if (!fieldValue || fieldValue.trim() === "") {
      return; // Don't proceed if field is empty
    }

    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (value: string) => {
    setFormData({
      ...formData,
      [currentStepData.id]: value,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentStepData.type !== "textarea") {
      e.preventDefault();
      handleNext();
    }
  };

  const isCurrentStepValid = () => {
    const fieldValue = formData[currentStepData.id as keyof FormData];
    return fieldValue && fieldValue.trim() !== "";
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const Icon = currentStepData.icon;

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your business profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4 md:min-h-0 md:py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 md:p-12 relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -z-10" />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Icon className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3 dark:text-slate-100">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 text-center mb-8">{currentStepData.subtitle}</p>

              {/* Input Field */}
              <div className="mb-8">
                {/* Auto-filled indicator */}
                {(currentStepData.id === "businessName" || currentStepData.id === "industry" || currentStepData.id === "location") && 
                 formData[currentStepData.id as keyof FormData] && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                    <CheckCircle2 size={16} />
                    <span>Auto-filled from your business profile</span>
                  </div>
                )}
                
                {currentStepData.type === "text" && (
                  <input
                    type="text"
                    value={formData[currentStepData.id as keyof FormData]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={currentStepData.placeholder}
                    autoFocus
                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none dark:border-slate-800"
                  />
                )}

                {currentStepData.type === "textarea" && (
                  <textarea
                    value={formData[currentStepData.id as keyof FormData]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={currentStepData.placeholder}
                    autoFocus
                    rows={4}
                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none dark:border-slate-800"
                  />
                )}

                {currentStepData.type === "select" && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentStepData.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleInputChange(option.value)}
                        className={`px-6 py-4 text-left rounded-2xl border-2 transition-all ${
                          formData[currentStepData.id as keyof FormData] === option.value
                            ? "border-purple-500 bg-purple-50 text-purple-900 font-semibold"
                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold text-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid() || isLoading}
                  className={`px-6 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentStep === 0 ? "flex-1" : "flex-[2]"
                  } ${
                    isCurrentStepValid()
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Building Your Network...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Network
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: Sparkles, text: "AI-Powered" },
            { icon: CheckCircle2, text: "Verified Data" },
            { icon: Users, text: "Real Creators" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-center text-sm text-gray-600 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800"
            >
              <item.icon className="w-4 h-4 text-purple-600" />
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
