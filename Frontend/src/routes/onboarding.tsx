import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, ArrowRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { triggerComprehensiveAnalysis, pollAnalysisStatus } from "@/lib/comprehensiveAnalysisApi";
import { toast } from "sonner";
import { PDFUpload } from "@/components/business/PDFUpload";
import { VoiceInput } from "@/components/business/VoiceInput";
import { WebsiteImport } from "@/components/business/WebsiteImport";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Business Setup — Saadhyam AI" }] }),
  component: () => (
    <ProtectedRoute>
      <OnboardingPage />
    </ProtectedRoute>
  ),
});

const businessTypes = [
  "Restaurant", "Hotel", "Salon", "Gym", "Clinic", "Retail Store",
  "E-commerce", "Service", "Education", "Healthcare", "Other"
];

interface FormData {
  name: string;
  type: string;
  location: string;
  description: string;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "",
    location: "",
    description: ""
  });
  const [baseDescription, setBaseDescription] = useState(""); // Store base text before live recording
  const [activeInputMethod, setActiveInputMethod] = useState<"none" | "website" | "pdf" | "voice" | "text">("none");
  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisStep(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % 5);
    }, 4200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    let cancelled = false;

    const checkSetupStatus = async () => {
      try {
        const setupStatus = await apiClient.getBusinessSetupStatus();
        if (!cancelled && setupStatus?.setup_completed) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
      } catch (checkError) {
        console.error("Failed to check onboarding status:", checkError);
      }

      if (!cancelled) {
        setIsCheckingSetup(false);
      }
    };

    checkSetupStatus();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Auto-focus on input when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && currentStep !== 2) {
        inputRef.current.focus();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Typing effect for placeholders with more sophisticated animation
  const [placeholder, setPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const placeholders = {
    1: "e.g., The Italian Kitchen",
    3: "e.g., Downtown, New York", 
    4: "Tell us about your business, challenges, and goals..."
  };

  useEffect(() => {
    if (currentStep === 2) return;
    
    const targetPlaceholder = placeholders[currentStep as keyof typeof placeholders] || "";
    let currentIndex = 0;
    setPlaceholder("");
    setIsTyping(true);

    const timer = setInterval(() => {
      if (currentIndex <= targetPlaceholder.length) {
        setPlaceholder(targetPlaceholder.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30); // Faster typing for more professional feel

    return () => clearInterval(timer);
  }, [currentStep]);

  const validateCurrentStep = () => {
    setError(null);
    
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          setError("Please enter your business name");
          return false;
        }
        break;
      case 2:
        if (!formData.type.trim()) {
          setError("Please select a business type");
          return false;
        }
        break;
      case 3:
        if (!formData.location.trim()) {
          setError("Please enter your location");
          return false;
        }
        break;
      case 4:
        if (!formData.description.trim()) {
          setError("Please describe your business");
          return false;
        }
        if (formData.description.length < 20) {
          setError("Description must be at least 20 characters");
          return false;
        }
        if (formData.description.length > 5000) {
          setError(`Description is too long (${formData.description.length - 5000} characters over the 5000 limit). Please shorten it.`);
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && currentStep !== 4) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleInputChange = (value: string, field: keyof FormData) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleTextExtracted = (extractedText: string, title?: string) => {
    // Reset base description when final text is extracted
    setBaseDescription("");
    
    // Intelligently merge extracted text with existing description
    const currentText = formData.description.trim();
    
    if (!currentText) {
      // If textarea is empty, just use extracted text
      setFormData(prev => ({ ...prev, description: extractedText }));
    } else {
      // If there's existing text, append intelligently
      const separator = currentText.endsWith('.') || currentText.endsWith('!') || currentText.endsWith('?') 
        ? ' ' 
        : '. ';
      setFormData(prev => ({ 
        ...prev, 
        description: `${currentText}${separator}${extractedText}` 
      }));
    }
    
    // Show textarea after extraction
    setActiveInputMethod("text");
    
    // If title is provided and business name is empty, suggest it
    if (title && !formData.name.trim()) {
      toast.success(`Suggestion: Use "${title}" as business name?`, {
        action: {
          label: "Use it",
          onClick: () => setFormData(prev => ({ ...prev, name: title }))
        }
      });
    }
    
    toast.success("Text added to description!");
  };

  const handleLiveTranscript = (liveText: string) => {
    // Update textarea in real-time while recording
    if (!liveText.trim()) {
      // Store base description when recording starts
      setBaseDescription(formData.description);
      return;
    }
    
    // Use stored base description to avoid duplication
    const base = baseDescription || formData.description;
    
    // Only update if the live text is different from what's already there
    const currentWithoutBase = formData.description.replace(base, '').trim();
    if (currentWithoutBase === liveText.trim()) {
      return; // No change needed
    }
    
    // Add separator if base text exists
    const separator = base && !base.endsWith('.') && !base.endsWith('!') && !base.endsWith('?') 
      ? '. ' 
      : base ? ' ' : '';
    
    // Update with base + live transcript
    setFormData(prev => ({ 
      ...prev, 
      description: base + separator + liveText
    }));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    // Double-check all fields before submitting
    if (!formData.name.trim() || !formData.type.trim() || 
        !formData.location.trim() || !formData.description.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    if (formData.description.length < 20) {
      setError("Description must be at least 20 characters");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get token from apiClient (which reads from localStorage)
      const token = apiClient.getToken();
      if (!token) {
        setError("Not authenticated. Please log in again.");
        setIsAnalyzing(false);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 2000);
        return;
      }

      // Save business profile to database
      const businessProfile = {
        business_name: formData.name.trim(),
        business_type: formData.type.trim(),
        business_location: formData.location.trim(),
        business_description: formData.description.trim(),
      };

      console.log("📤 [Step 1/4] Saving business profile...", {
        name_length: businessProfile.business_name.length,
        type_length: businessProfile.business_type.length,
        location_length: businessProfile.business_location.length,
        description_length: businessProfile.business_description.length
      });

      try {
        await apiClient.updateBusinessProfile(businessProfile);
        console.log("✅ [Step 1/4] Business profile saved successfully");
      } catch (profileErr) {
        console.error("❌ [Step 1/4] FAILED - updateBusinessProfile:", profileErr);
        throw profileErr;
      }

      console.log("📤 [Step 2/4] Fetching updated user...");
      try {
        await apiClient.getCurrentUser();
        console.log("✅ [Step 2/4] User fetched successfully");
      } catch (userErr) {
        console.error("❌ [Step 2/4] FAILED - getCurrentUser:", userErr);
        // Non-critical: continue even if this fails
        console.warn("⚠️ Continuing despite getCurrentUser failure...");
      }

      console.log("📤 [Step 3/4] Triggering comprehensive analysis...");
      try {
        await triggerComprehensiveAnalysis(token);
        console.log("✅ [Step 3/4] Analysis triggered successfully");
      } catch (analysisErr) {
        console.error("❌ [Step 3/4] FAILED - triggerComprehensiveAnalysis:", analysisErr);
        throw analysisErr;
      }

      console.log("📤 [Step 4/4] Polling analysis status...");
      try {
        await pollAnalysisStatus(token, (status) => {
          console.log("📊 Analysis status:", status.status);
        });
        console.log("✅ [Step 4/4] Analysis completed!");
      } catch (pollErr) {
        console.error("❌ [Step 4/4] FAILED - pollAnalysisStatus:", pollErr);
        throw pollErr;
      }

      // Analysis complete!
      setIsComplete(true);
      toast.success("Business profile saved! Welcome to Saadhyam AI 🎉");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 2000);

    } catch (err) {
      console.error("❌ Onboarding submit failed:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to save business profile";
      setError(errorMsg);
      setIsAnalyzing(false);
      toast.error(errorMsg);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4">
        <div className="rounded-2xl border border-purple-100 bg-white/90 px-6 py-5 shadow-lg shadow-purple-100/50 backdrop-blur-md">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Checking setup status...</p>
        </div>
      </div>
    );
  }

  // Enhanced Analyzing state
  if (isAnalyzing) {
    const analysisSentences = [
      "Analyzing business strengths & weaknesses",
      "Researching competitor landscape",
      "Generating growth recommendations",
      "Creating Google Hub insights",
      "Finalizing your custom marketing blueprints"
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>

        <div className="text-center max-w-md relative z-10 animate-scale-in">
          {/* Simple loading animation with three dots (unified design) */}
          <div className="flex items-center justify-center gap-1.5 text-purple-600 font-bold text-lg mb-3">
            <span>Analyzing Your Business</span>
            <span className="inline-flex gap-0.5 items-center">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-10 max-w-xs mx-auto leading-relaxed">
            Our AI is analyzing your business with Google Search grounding...
          </p>

          {/* Smoothly transitioning overlay points */}
          <div className="h-16 flex items-center justify-center overflow-hidden mb-6 relative">
            <AnimatePresence>
              <motion.div
                key={analysisStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-purple-100/80 px-5 py-3 rounded-full shadow-md shadow-purple-50/50 whitespace-nowrap dark:text-slate-300 dark:bg-slate-900"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>{analysisSentences[analysisStep]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 bg-blue-50/70 border border-blue-150 rounded-xl p-4 max-w-sm mx-auto shadow-xs">
            <p className="text-xs text-blue-800 leading-relaxed">
              💡 This comprehensive analysis takes 2-3 minutes but will populate all your dashboard features instantly!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Complete state with celebration
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>

        <div className="text-center max-w-md relative z-10 animate-scale-in">
          {/* Success icon with celebration effect */}
          <div className="relative mb-10">
            {/* Expanding rings */}
            <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full bg-emerald-200 animate-ping opacity-30"></div>
            <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full bg-green-200 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
            
            {/* Main icon */}
            <div className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-2xl animate-bounce">
              <Sparkles size={48} className="text-white" />
            </div>
            
            {/* Floating sparkles */}
            <div className="absolute top-0 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-down dark:text-slate-100">
            All Set! 🎉
          </h2>
          <p className="text-gray-600 mb-8 text-lg animate-fade-in-up">
            Your business analysis is ready. Redirecting to dashboard...
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner animate-fade-in-up dark:bg-slate-700" style={{ animationDelay: '200ms' }}>
            <div 
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-3 rounded-full relative overflow-hidden"
              style={{ width: '100%', animation: 'slide-in-right 3s ease-out' }}
            >
              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Success message */}
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
              <span className="font-semibold text-lg">Profile Created Successfully</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "What's your business name?";
      case 2: return "What type of business do you run?";
      case 3: return "Where is your business located?";
      case 4: return "Tell us about your business";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "This will be displayed on your dashboard";
      case 2: return "Select the category that best describes your business";
      case 3: return "City, state, or region where you operate";
      case 4: return "Describe your services, challenges, and goals (minimum 20 characters)";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT SIDE - Welcome Section */}
        <div className="flex flex-col justify-center items-center p-8 lg:p-16">
          <div className="max-w-md animate-fade-in-down">
            {/* Logo */}
            <div className="mb-8">
              <img 
                src="/src/Icon/Saadhyam_Icon-removebg-preview.png" 
                alt="Saadhyam AI" 
                className="h-24 w-auto mx-auto transform hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            {/* Welcome Text */}
            <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 leading-tight dark:text-slate-100">
              Welcome to Saadhyam AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Let's set up your business profile in 4 simple steps. We'll help you unlock powerful AI-driven insights.
            </p>

            {/* Progress Indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span className="font-semibold text-purple-600">Step {currentStep} of 4</span>
                <span className="font-semibold text-purple-600">{Math.round((currentStep / 4) * 100)}% complete</span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner dark:bg-slate-700">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step <= currentStep
                          ? "bg-white shadow-lg scale-125"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step Labels */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                {["Business", "Type", "Location", "Details"].map((label, idx) => (
                  <div key={idx} className="text-center">
                    <div className={`text-xs font-medium transition-colors duration-300 ${
                      idx + 1 <= currentStep ? "text-purple-600" : "text-gray-400"
                    }`}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Input Card */}
        <div className="flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-xl">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative overflow-hidden animate-scale-in">
              {/* Decorative gradient orbs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 rounded-full -translate-y-20 translate-x-20 opacity-60 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-100 via-purple-50 to-purple-100 rounded-full translate-y-16 -translate-x-16 opacity-40 blur-2xl"></div>
              
              {/* Back button */}
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="absolute top-6 left-6 p-3 rounded-xl hover:bg-purple-50 transition-all duration-300 group hover:scale-110 hover:shadow-md z-10"
                  title="Go back to previous step"
                >
                  <ChevronLeft size={20} className="text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />
                </button>
              )}

              {/* Step Content */}
              <div className="relative">
            {/* Step Title with stagger animation */}
            <div 
              key={`title-${currentStep}`}
              className="mb-6 animate-slide-in-right"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3 dark:text-slate-100">
                {getStepTitle()}
              </h2>
              <p className="text-sm text-gray-600">
                {getStepSubtitle()}
              </p>
            </div>

            {/* Error Message with shake animation */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 animate-shake-x">
                <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Step Input with entrance animation */}
            <div 
              key={`input-${currentStep}`}
              className="mb-6 animate-fade-in-up"
            >
              {currentStep === 1 && (
                <div className="relative group">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange(e.target.value, "name")}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="w-full text-xl px-6 py-5 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-gradient-to-br from-gray-50 to-white hover:border-purple-300 font-medium placeholder:text-gray-400 shadow-sm hover:shadow-md dark:border-slate-800"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                    <div className="w-1 h-6 bg-purple-500 animate-pulse rounded-full"></div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  {businessTypes.map((type, index) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange(type, "type")}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                      className={`group relative p-5 rounded-2xl border-2 transition-all duration-400 text-sm font-semibold overflow-hidden animate-fade-in-up ${
                        formData.type === type
                          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-900 shadow-lg scale-105 animate-glow"
                          : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-25 hover:to-pink-25 hover:scale-102 hover:shadow-md card-hover"
                      }`}
                    >
                      {/* Ripple effect background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-active:opacity-20 transition-opacity duration-200 rounded-2xl"></div>
                      
                      {/* Selected indicator */}
                      {formData.type === type && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-scale-in">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <span className="relative z-10 block">{type}</span>
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="relative group">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange(e.target.value, "location")}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="w-full text-xl px-6 py-5 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-gradient-to-br from-gray-50 to-white hover:border-purple-300 font-medium placeholder:text-gray-400 shadow-sm hover:shadow-md dark:border-slate-800"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                    <div className="w-1 h-6 bg-purple-500 animate-pulse rounded-full"></div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Header Text */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">
                      Tell us about your business
                    </h2>
                    <p className="text-sm text-gray-500">
                      Pick any one — whatever is easiest for you.
                    </p>
                  </div>

                  {/* Show input method cards only when no method is active */}
                  {activeInputMethod === "none" && (
                    <div className="space-y-3">
                      {/* Website URL Card */}
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("website")}
                        className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-300 hover:shadow-lg group text-left animate-fade-in-up dark:border-slate-800"
                        style={{ animationDelay: '0ms' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors duration-300">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-0.5 dark:text-slate-100">
                              Paste Website URL
                            </h3>
                            <p className="text-sm text-gray-500">
                              e.g. www.sharmaelectronics.in
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* PDF Upload Card */}
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("pdf")}
                        className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-300 hover:shadow-lg group text-left animate-fade-in-up dark:border-slate-800"
                        style={{ animationDelay: '50ms' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors duration-300">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-0.5 dark:text-slate-100">
                              Upload PDF or Brochure
                            </h3>
                            <p className="text-sm text-gray-500">
                              Menu, catalog, flyer
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Type Business Details Card */}
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("text")}
                        className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-300 hover:shadow-lg group text-left animate-fade-in-up dark:border-slate-800"
                        style={{ animationDelay: '100ms' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors duration-300">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-0.5 dark:text-slate-100">
                              Type Business Details
                            </h3>
                            <p className="text-sm text-gray-500">
                              Tell us in your own words
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Voice Input Card */}
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("voice")}
                        className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-300 hover:shadow-lg group text-left animate-fade-in-up dark:border-slate-800"
                        style={{ animationDelay: '150ms' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors duration-300">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-0.5 dark:text-slate-100">
                              Record Voice
                            </h3>
                            <p className="text-sm text-gray-500">
                              Speak in any language
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Website Import UI */}
                  {activeInputMethod === "website" && (
                    <div className="space-y-4 animate-fade-in-up">
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("none")}
                        className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to options
                      </button>
                      <WebsiteImport 
                        onTextExtracted={(text, title) => {
                          handleTextExtracted(text, title);
                          setActiveInputMethod("text"); // Switch to textarea after import
                        }}
                        disabled={isAnalyzing}
                      />
                    </div>
                  )}

                  {/* PDF Upload UI */}
                  {activeInputMethod === "pdf" && (
                    <div className="space-y-4 animate-fade-in-up">
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("none")}
                        className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to options
                      </button>
                      <PDFUpload 
                        onTextExtracted={(text) => {
                          handleTextExtracted(text);
                          setActiveInputMethod("text"); // Switch to textarea after upload
                        }}
                        disabled={isAnalyzing}
                      />
                    </div>
                  )}

                  {/* Voice Input UI */}
                  {activeInputMethod === "voice" && (
                    <div className="space-y-4 animate-fade-in-up">
                      <button
                        type="button"
                        onClick={() => setActiveInputMethod("none")}
                        className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to options
                      </button>
                      <VoiceInput 
                        onTextExtracted={(text) => {
                          handleTextExtracted(text);
                          setActiveInputMethod("text"); // Switch to textarea after recording
                        }}
                        onLiveTranscript={handleLiveTranscript}
                        disabled={isAnalyzing}
                      />
                    </div>
                  )}

                  {/* Textarea - Shows when "text" method is active OR when description has content */}
                  {(activeInputMethod === "text" || formData.description.length > 0) && (
                    <div className="space-y-3 animate-fade-in-up">
                      {activeInputMethod === "text" && (
                        <button
                          type="button"
                          onClick={() => setActiveInputMethod("none")}
                          className="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back to options
                        </button>
                      )}
                      
                      <div className="relative group">
                        <textarea
                          id="business-description-textarea"
                          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                          value={formData.description}
                          onChange={(e) => handleInputChange(e.target.value, "description")}
                          onKeyPress={handleKeyPress}
                          placeholder="Describe your business, services, challenges, and goals..."
                          rows={10}
                          className={`w-full text-base px-5 py-4 border-2 rounded-2xl focus:ring-4 outline-none transition-all duration-300 bg-gradient-to-br from-gray-50 to-white hover:border-purple-300 resize-none font-medium placeholder:text-gray-400 shadow-sm hover:shadow-md ${
                            formData.description.length > 5000
                              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                              : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                          }`}
                          autoFocus
                        />
                        <div className="absolute right-4 top-4 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <div className={`w-1 h-6 rounded-full animate-pulse ${
                            formData.description.length > 5000 ? 'bg-red-500' : 'bg-purple-500'
                          }`}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-gray-500 font-medium">
                          {formData.description.length > 5000 ? (
                            <span className="text-red-600 flex items-center gap-1 font-bold">
                              <AlertCircle className="w-3 h-3" />
                              Too long!
                            </span>
                          ) : formData.description.length >= 20 ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Ready
                            </span>
                          ) : (
                            <span className="text-orange-600">
                              {20 - formData.description.length} more needed
                            </span>
                          )}
                        </span>
                        <span className={`font-medium transition-colors duration-300 ${
                          formData.description.length > 5000 
                            ? 'text-red-600 font-bold animate-pulse' 
                            : formData.description.length > 4500 
                            ? 'text-orange-600' 
                            : 'text-gray-500'
                        }`}>
                          {formData.description.length}/5000
                        </span>
                      </div>

                      {/* Option to use other methods */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveInputMethod("none")}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Or use another input method
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons with enhanced styling */}
            <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {/* Back Button */}
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 py-6 text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md group dark:border-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                  Back
                </Button>
              )}
              
              {/* Next/Submit Button */}
              <Button
                onClick={handleNext}
                className={`py-6 text-lg font-semibold bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 hover:from-purple-600 hover:via-purple-700 hover:to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                  currentStep > 1 ? 'flex-1' : 'w-full'
                }`}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                <span className="relative z-10 flex items-center justify-center">
                  {currentStep === 4 ? (
                    <>
                      <Sparkles size={20} className="mr-2 animate-pulse" />
                      Analyze My Business
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </Button>
            </div>

            {/* Enhanced Progress Dots */}
            <div className="flex justify-center mt-8 space-x-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`transition-all duration-500 rounded-full ${
                    step === currentStep
                      ? "w-8 h-3 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
                      : step < currentStep
                      ? "w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400"
                      : "w-3 h-3 bg-gray-300"
                  }`}
                  style={{
                    transform: step === currentStep ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake-x {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgb(168 85 247);
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4);
          }
          50% {
            border-color: rgb(236 72 153);
            box-shadow: 0 0 0 8px rgba(236, 72, 153, 0);
          }
        }
        
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(236, 72, 153, 0.5);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-shake-x {
          animation: shake-x 0.5s ease-in-out;
        }
        
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        
        .animate-float-up {
          animation: float-up 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        /* Enhanced input focus effects */
        input:focus, textarea:focus {
          animation: pulse-border 2s ease-in-out infinite;
        }
        
        /* Button hover effects */
        button:hover {
          transform: translateY(-2px);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          transition-property: transform, box-shadow, background-color, border-color, opacity;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Card hover effect */
        .card-hover:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        /* Gradient text animation */
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}