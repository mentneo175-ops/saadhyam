import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Instagram,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Users,
  Camera,
  Calendar,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";

interface InstagramConnectionWizardProps {
  onConnect: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const connectionSteps = [
  {
    id: 1,
    title: "Before You Connect",
    subtitle: "Important requirements to ensure smooth connection",
    icon: Info,
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: 2,
    title: "Account Requirements",
    subtitle: "Make sure your Instagram account meets these criteria",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: 3,
    title: "Permissions & Privacy",
    subtitle: "What we'll access and how we protect your data",
    icon: Users,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 4,
    title: "Features You'll Get",
    subtitle: "Powerful tools to grow your Instagram presence",
    icon: Camera,
    color: "from-orange-500 to-red-500",
  },
  {
    id: 5,
    title: "Ready to Connect",
    subtitle: "Review and confirm your connection",
    icon: CheckCircle,
    color: "from-pink-500 to-rose-500",
  },
];

const requirements = [
  {
    title: "Instagram Business Account",
    description: "Your account must be converted to a Business account (not Personal)",
    required: true,
    helpText: "Go to Settings → Account → Switch to Professional Account → Business",
  },
  {
    title: "Facebook Page Connected",
    description: "Your Instagram Business account must be linked to a Facebook Page",
    required: true,
    helpText: "In Instagram: Settings → Account → Linked Accounts → Facebook",
  },
  {
    title: "Admin Access",
    description: "You must be an admin of the connected Facebook Page",
    required: true,
    helpText: "Check your Facebook Page roles in Page Settings",
  },
  {
    title: "Account in Good Standing",
    description: "No recent violations or restrictions on your Instagram account",
    required: true,
    helpText: "Check for any warnings in your Instagram notifications",
  },
];

const permissions = [
  {
    title: "Basic Profile Information",
    description: "Username, profile picture, and follower count",
    icon: Users,
  },
  {
    title: "Post Content",
    description: "Create and publish posts with images and captions",
    icon: Camera,
  },
  {
    title: "Scheduling Access",
    description: "Schedule posts for future publishing",
    icon: Calendar,
  },
  {
    title: "Analytics Data",
    description: "View post performance and engagement metrics",
    icon: CheckCircle,
  },
];

const features = [
  {
    title: "AI-Powered Content Creation",
    description: "Generate engaging captions and content ideas automatically",
    benefit: "Save 2+ hours daily",
  },
  {
    title: "Smart Scheduling",
    description: "Post at optimal times when your audience is most active",
    benefit: "Increase engagement by 40%",
  },
  {
    title: "Performance Analytics",
    description: "Track post performance and audience insights",
    benefit: "Data-driven growth",
  },
  {
    title: "Bulk Content Management",
    description: "Plan and schedule multiple posts in advance",
    benefit: "Stay consistent effortlessly",
  },
];

export const InstagramConnectionWizard: React.FC<InstagramConnectionWizardProps> = ({
  onConnect,
  onCancel,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [checkedRequirements, setCheckedRequirements] = useState<boolean[]>(
    new Array(requirements.length).fill(false)
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const stepRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when step changes
  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 2) {
      // Check if all requirements are checked
      const allChecked = checkedRequirements.every(checked => checked);
      if (!allChecked) {
        return;
      }
    }

    if (currentStep === 5) {
      if (!agreedToTerms) {
        return;
      }
      setShowConfirmDialog(true);
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setIsAnimating(false);
    }, 150);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleRequirementCheck = (index: number, checked: boolean) => {
    const newChecked = [...checkedRequirements];
    newChecked[index] = checked;
    setCheckedRequirements(newChecked);
  };

  const handleConnect = () => {
    setShowConfirmDialog(false);
    onConnect();
  };

  const currentStepData = connectionSteps.find(step => step.id === currentStep);
  const progress = (currentStep / connectionSteps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 2:
        return checkedRequirements.every(checked => checked);
      case 5:
        return agreedToTerms;
      default:
        return true;
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6" ref={stepRef}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Connect Instagram Account</h1>
            <Badge variant="outline" className="text-sm">
              Step {currentStep} of {connectionSteps.length}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-orange-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <CardHeader className="text-center pb-6">
            <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${currentStepData?.color} flex items-center justify-center mb-4`}>
              {currentStepData?.icon && <currentStepData.icon className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold">{currentStepData?.title}</CardTitle>
            <CardDescription className="text-lg">{currentStepData?.subtitle}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Introduction */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Instagram className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Welcome! We'll guide you through connecting your Instagram Business account to unlock powerful AI-driven content creation and scheduling tools.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-blue-900 mb-2">What You'll Need</h3>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Instagram Business Account</li>
                      <li>• Connected Facebook Page</li>
                      <li>• Admin access to the page</li>
                      <li>• 5 minutes of your time</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl">
                    <h3 className="font-semibold text-green-900 mb-2">What You'll Get</h3>
                    <ul className="text-green-700 space-y-1 text-sm">
                      <li>• AI content generation</li>
                      <li>• Smart post scheduling</li>
                      <li>• Performance analytics</li>
                      <li>• Automated workflows</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Important Note</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        This process requires a Business Instagram account. Personal accounts cannot be connected. 
                        Don't worry - we'll show you how to convert your account if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Requirements */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Please confirm that your Instagram account meets these requirements. 
                    Check each item as you verify it.
                  </p>
                </div>

                <div className="space-y-4">
                  {requirements.map((req, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`req-${index}`}
                          checked={checkedRequirements[index]}
                          onCheckedChange={(checked) => handleRequirementCheck(index, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor={`req-${index}`} className="font-medium text-gray-900 cursor-pointer">
                            {req.title}
                            {req.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <p className="text-gray-600 text-sm mt-1">{req.description}</p>
                          <div className="mt-2 p-3 bg-blue-50 rounded-md">
                            <p className="text-blue-700 text-sm">
                              <strong>How to check:</strong> {req.helpText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!checkedRequirements.every(checked => checked) && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-orange-800">Need Help?</h4>
                        <p className="text-orange-700 text-sm mt-1">
                          If your account doesn't meet these requirements, 
                          <a href="#" className="underline ml-1">click here for step-by-step setup instructions</a>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Permissions */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Here's what we'll access from your Instagram account and how we protect your data.
                  </p>
                </div>

                <div className="grid gap-4">
                  {permissions.map((permission, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <permission.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{permission.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Your Data is Protected
                  </h3>
                  <ul className="text-green-700 space-y-2 text-sm">
                    <li>• We never store your Instagram password</li>
                    <li>• All data is encrypted and securely stored</li>
                    <li>• You can disconnect anytime from settings</li>
                    <li>• We only access what's necessary for features</li>
                    <li>• Your content remains yours - we don't claim ownership</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Features */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Once connected, you'll have access to these powerful features to grow your Instagram presence.
                  </p>
                </div>

                <div className="grid gap-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {feature.benefit}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-pink-900 mb-2">Ready to Transform Your Instagram?</h3>
                  <p className="text-pink-700 text-sm">
                    Join thousands of businesses already using our AI-powered tools to create engaging content, 
                    grow their audience, and save hours of manual work every week.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Final Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-600">
                    You're all set! Review the summary below and click "Connect Instagram" to complete the setup.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Connection Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Account Requirements ✓</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Instagram Business Account</li>
                        <li>• Facebook Page Connected</li>
                        <li>• Admin Access Confirmed</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Features Enabled</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• AI Content Creation</li>
                        <li>• Smart Scheduling</li>
                        <li>• Performance Analytics</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 underline">Terms of Service</a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 underline">Privacy Policy</a>.
                      I understand that I can disconnect my account at any time from the settings page.
                    </label>
                  </div>
                </div>

                {!agreedToTerms && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-700 text-sm">
                      Please agree to the terms and conditions to continue with the connection.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : currentStep === 5 ? (
              <>
                Connect Instagram
                <ExternalLink className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" />
              Connect Instagram Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              You'll be redirected to Instagram to authorize the connection. 
              This will open a new window where you can safely log in and grant permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConnect}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            >
              Continue to Instagram
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};