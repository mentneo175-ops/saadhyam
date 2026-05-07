import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader, AlertCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { apiClient } from "@/lib/api";
import { triggerComprehensiveAnalysis, pollAnalysisStatus } from "@/lib/comprehensiveAnalysisApi";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Business Setup — Saadhyam AI" }] }),
  component: OnboardingPage,
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
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "",
    location: "",
    description: ""
  });

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleInputChange = (value: string, field: keyof FormData) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

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
        business_name: formData.name,
        business_type: formData.type,
        business_location: formData.location,
        business_description: formData.description,
      };

      await apiClient.updateBusinessProfile(businessProfile);

      // Trigger comprehensive business analysis (NEW API)
      await triggerComprehensiveAnalysis(token);

      // Poll for analysis completion
      await pollAnalysisStatus(token, (status) => {
        console.log("Analysis status:", status.status);
      });

      // Analysis complete!
      setIsComplete(true);
      toast.success("Business profile saved! Welcome to Saadhyam AI 🎉");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 2000);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save business profile";
      setError(errorMsg);
      setIsAnalyzing(false);
      toast.error(errorMsg);
    }
  };

  // Analyzing state
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
              <Sparkles size={32} className="text-white" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-purple-200 animate-spin border-t-purple-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Analyzing Your Business</h2>
          <p className="text-gray-600 mb-6">
            Our AI is analyzing your business with Google Search grounding...
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Analyzing business strengths & weaknesses</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Researching competitor landscape</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Generating growth recommendations</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Creating SEO & Google Maps tips</span>
            </div>
          </div>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-900">
              💡 This comprehensive analysis takes 2-3 minutes but will populate all your dashboard features instantly!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Complete state
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center mb-8 animate-bounce">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">All Set! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your business analysis is ready. Redirecting to dashboard...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Saadhyam AI</h1>
          <p className="text-gray-600 text-sm">Let's set up your business profile</p>
        </div>

        {/* Progress Bar with enhanced animations */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className="font-medium">Step {currentStep} of 4</span>
            <span className="font-medium">{Math.round((currentStep / 4) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
            </div>
          </div>
        </div>

        {/* Main Card with enhanced styling */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 relative overflow-hidden backdrop-blur-sm">
          {/* Enhanced background decorations */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 rounded-full -translate-y-20 translate-x-20 opacity-60 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-100 via-purple-50 to-purple-100 rounded-full translate-y-16 -translate-x-16 opacity-40 animate-float-delayed"></div>
          
          {/* Back button - Enhanced with better animations */}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 p-3 rounded-full hover:bg-gray-100 transition-all duration-300 group hover:scale-110 hover:shadow-lg"
              title="Go back to previous step"
            >
              <ChevronLeft size={20} className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300" />
            </button>
          )}

          {/* Step Content */}
          <div className="relative">
            {/* Step Title with enhanced animations */}
            <div 
              key={currentStep}
              className="mb-6 animate-slide-in-fade"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3 animate-text-focus-in">
                {getStepTitle()}
              </h2>
              <p className="text-sm text-gray-600 animate-fade-in-delayed">
                {getStepSubtitle()}
              </p>
            </div>

            {/* Error Message with enhanced animation */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Step Input */}
            <div 
              key={`step-${currentStep}`}
              className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500"
            >
              {currentStep === 1 && (
                <div className="relative">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange(e.target.value, "name")}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="w-full text-xl px-6 py-5 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-500 bg-gray-50 focus:bg-white hover:border-gray-300 font-medium placeholder:text-gray-400"
                  />
                  {isTyping && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-0.5 h-6 bg-purple-500 animate-pulse"></div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  {businessTypes.map((type, index) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange(type, "type")}
                      className={`p-5 rounded-2xl border-2 transition-all duration-400 text-sm font-semibold relative overflow-hidden group ${
                        formData.type === type
                          ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 shadow-lg scale-105 animate-pulse-subtle"
                          : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-25 hover:to-pink-25 hover:scale-102 hover:shadow-md"
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      {/* Ripple effect on click */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-active:opacity-20 transition-opacity duration-200 rounded-2xl"></div>
                      <span className="relative z-10">{type}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange(e.target.value, "location")}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  className="w-full text-lg px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                />
              )}

              {currentStep === 4 && (
                <div>
                  <div className="relative">
                    <textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      value={formData.description}
                      onChange={(e) => handleInputChange(e.target.value, "description")}
                      onKeyPress={handleKeyPress}
                      placeholder={placeholder}
                      rows={4}
                      className="w-full text-lg px-6 py-5 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-500 bg-gray-50 focus:bg-white resize-none font-medium placeholder:text-gray-400"
                    />
                    {isTyping && (
                      <div className="absolute right-4 top-6">
                        <div className="w-0.5 h-6 bg-purple-500 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-right font-medium">
                    {formData.description.length}/2000 characters
                  </div>
                  
                  {/* Alternative Input Methods */}
                  <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl">
                    <h4 className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      Alternative Input Methods
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* PDF Upload */}
                      <button
                        type="button"
                        disabled
                        className="group p-4 bg-white border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-300 transition-all duration-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-r from-red-100 to-red-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-lg">📄</span>
                          </div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">PDF Upload</h5>
                          <p className="text-xs text-gray-600 mb-2">Upload business documents</p>
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      </button>

                      {/* Voice Input */}
                      <button
                        type="button"
                        disabled
                        className="group p-4 bg-white border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-300 transition-all duration-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-lg">🎤</span>
                          </div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">Voice Input</h5>
                          <p className="text-xs text-gray-600 mb-2">Record your description</p>
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      </button>

                      {/* Website Import */}
                      <button
                        type="button"
                        disabled
                        className="group p-4 bg-white border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-300 transition-all duration-300 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span className="text-lg">🌐</span>
                          </div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">Website Import</h5>
                          <p className="text-xs text-gray-600 mb-2">Import from your website</p>
                          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      </button>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-xs text-purple-700 font-medium">
                        💡 For now, please describe your business in the text area above
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Back Button */}
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 py-4 text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-300"
                >
                  <ChevronLeft size={20} className="mr-2" />
                  Back
                </Button>
              )}
              
              {/* Next/Submit Button */}
              <Button
                onClick={handleNext}
                className={`py-4 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                  currentStep > 1 ? 'flex-1' : 'w-full'
                }`}
              >
                {currentStep === 4 ? (
                  <>
                    <Sparkles size={20} className="mr-2" />
                    Analyze My Business
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            We'll analyze your business and create personalized recommendations
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes text-focus-in {
          0% {
            filter: blur(12px);
            opacity: 0;
          }
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }
        
        @keyframes slide-in-fade {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-text-focus-in {
          animation: text-focus-in 0.8s cubic-bezier(0.550, 0.085, 0.680, 0.530) both;
        }
        
        .animate-slide-in-fade {
          animation: slide-in-fade 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in-delayed 1.2s ease-out both;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        /* Enhanced input focus effects */
        input:focus, textarea:focus {
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1), 0 10px 25px -5px rgba(147, 51, 234, 0.1);
        }
        
        /* Button hover effects */
        button:hover {
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          transition-property: transform, box-shadow, background-color, border-color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}