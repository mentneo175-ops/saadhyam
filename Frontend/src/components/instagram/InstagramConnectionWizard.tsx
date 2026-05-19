import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Zap,
  TrendingUp,
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
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Ambient Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 -left-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 -right-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10" ref={stepRef}>
          {/* Modern Progress Bar */}
          <motion.div 
            className="mb-12"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Connect Instagram
                </motion.h1>
                <motion.p 
                  className="text-gray-600 mt-1"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Unlock AI-powered content creation
                </motion.p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Badge 
                  variant="outline" 
                  className="text-sm px-4 py-2 bg-white/80 backdrop-blur-sm border-purple-200 text-purple-700 font-medium"
                >
                  Step {currentStep} of {connectionSteps.length}
                </Badge>
              </motion.div>
            </div>
            
            {/* Premium Progress Bar */}
            <div className="relative w-full h-2 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {connectionSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      step.id <= currentStep
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                        : 'bg-white/60 text-gray-400 backdrop-blur-sm'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Premium Main Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                {/* Gradient Top Border */}
                <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                
                <CardHeader className="text-center pb-8 pt-12 relative">
                  {/* Icon with Glow Effect */}
                  <motion.div
                    className="relative w-20 h-20 mx-auto mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                  >
                    {/* Animated Glow */}
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${currentStepData?.color} blur-xl opacity-50`}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.7, 0.5],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    {/* Icon Container */}
                    <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-r ${currentStepData?.color} flex items-center justify-center shadow-xl`}>
                      {currentStepData?.icon && <currentStepData.icon className="w-10 h-10 text-white" />}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                      {currentStepData?.title}
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {currentStepData?.subtitle}
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <CardContent className="px-8 pb-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`content-${currentStep}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                    {/* Step 1: Introduction */}
                    {currentStep === 1 && (
                      <div className="space-y-8">
                        {/* Instagram Icon Hero */}
                        <motion.div 
                          className="text-center relative"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="relative inline-block">
                            {/* Floating Gradient Orbs */}
                            <motion.div
                              className="absolute -inset-8 bg-gradient-to-r from-pink-400/30 to-orange-400/30 rounded-full blur-2xl"
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 90, 0],
                              }}
                              transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            <motion.div
                              className="relative w-28 h-28 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl"
                              animate={{
                                y: [0, -10, 0],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <Instagram className="w-14 h-14 text-white" />
                            </motion.div>
                          </div>
                          
                          <motion.p 
                            className="text-lg text-gray-700 mt-8 mb-6 max-w-2xl mx-auto leading-relaxed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            Welcome! We'll guide you through connecting your Instagram Business account to unlock powerful{" "}
                            <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              AI-driven content creation
                            </span>{" "}
                            and scheduling tools.
                          </motion.p>
                        </motion.div>

                        {/* Premium Info Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <motion.div
                            className="group relative"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ y: -4 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                  <Info className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">What You'll Need</h3>
                              </div>
                              <ul className="space-y-3">
                                {[
                                  "Instagram Business Account",
                                  "Connected Facebook Page",
                                  "Admin access to the page",
                                  "5 minutes of your time"
                                ].map((item, i) => (
                                  <motion.li
                                    key={i}
                                    className="flex items-center gap-3 text-gray-700"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + i * 0.1 }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                                    <span>{item}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>

                          <motion.div
                            className="group relative"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ y: -4 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-pink-200/50 shadow-lg hover:shadow-xl transition-all">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                                  <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">What You'll Get</h3>
                              </div>
                              <ul className="space-y-3">
                                {[
                                  "AI content generation",
                                  "Smart post scheduling",
                                  "Performance analytics",
                                  "Automated workflows"
                                ].map((item, i) => (
                                  <motion.li
                                    key={i}
                                    className="flex items-center gap-3 text-gray-700"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500" />
                                    <span>{item}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        </div>

                        {/* Important Note - Redesigned */}
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-xl" />
                          <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-6 rounded-2xl backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <AlertTriangle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-amber-900 mb-2 text-lg">Important Note</h4>
                                <p className="text-amber-800 leading-relaxed">
                                  This process requires a <span className="font-semibold">Business Instagram account</span>. Personal accounts cannot be connected. 
                                  Don't worry - we'll show you how to convert your account if needed.
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 2: Requirements */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <motion.div 
                          className="text-center mb-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-gray-600 leading-relaxed">
                            Please confirm that your Instagram account meets these requirements. 
                            Check each item as you verify it.
                          </p>
                        </motion.div>

                        <div className="space-y-4">
                          {requirements.map((req, index) => (
                            <motion.div
                              key={index}
                              className="group relative"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg transition-all">
                                <div className="flex items-start gap-4">
                                  <Checkbox
                                    id={`req-${index}`}
                                    checked={checkedRequirements[index]}
                                    onCheckedChange={(checked) => handleRequirementCheck(index, checked as boolean)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <label htmlFor={`req-${index}`} className="font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                                      {req.title}
                                      {req.required && <span className="text-pink-500">*</span>}
                                    </label>
                                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{req.description}</p>
                                    <div className="mt-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100/50">
                                      <p className="text-purple-800 text-sm leading-relaxed">
                                        <strong className="font-semibold">How to check:</strong> {req.helpText}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {!checkedRequirements.every(checked => checked) && (
                          <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 p-6 rounded-2xl">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                                  <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-orange-900 mb-2">Need Help?</h4>
                                  <p className="text-orange-800 text-sm leading-relaxed">
                                    If your account doesn't meet these requirements,{" "}
                                    <a href="#" className="underline font-semibold hover:text-orange-900 transition-colors">
                                      click here for step-by-step setup instructions
                                    </a>.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Permissions */}
                    {currentStep === 3 && (
                      <div className="space-y-8">
                        <motion.div 
                          className="text-center mb-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-gray-600 leading-relaxed">
                            Here's what we'll access from your Instagram account and how we protect your data.
                          </p>
                        </motion.div>

                        <div className="grid gap-5">
                          {permissions.map((permission, index) => (
                            <motion.div
                              key={index}
                              className="group relative"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ x: 4 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative flex items-start gap-5 p-6 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                  <permission.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-1">{permission.title}</h3>
                                  <p className="text-gray-600 text-sm leading-relaxed">{permission.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl blur-xl" />
                          <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 p-8 rounded-2xl">
                            <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-3 text-lg">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                                <Shield className="w-5 h-5 text-white" />
                              </div>
                              Your Data is Protected
                            </h3>
                            <ul className="space-y-3">
                              {[
                                "We never store your Instagram password",
                                "All data is encrypted and securely stored",
                                "You can disconnect anytime from settings",
                                "We only access what's necessary for features",
                                "Your content remains yours - we don't claim ownership"
                              ].map((item, i) => (
                                <motion.li
                                  key={i}
                                  className="flex items-center gap-3 text-emerald-800"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.6 + i * 0.1 }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500" />
                                  <span>{item}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 4: Features */}
                    {currentStep === 4 && (
                      <div className="space-y-8">
                        <motion.div 
                          className="text-center mb-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-gray-600 leading-relaxed">
                            Once connected, you'll have access to these powerful features to grow your Instagram presence.
                          </p>
                        </motion.div>

                        <div className="grid gap-6">
                          {features.map((feature, index) => (
                            <motion.div
                              key={index}
                              className="group relative"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.15 }}
                              whileHover={{ y: -4, scale: 1.02 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative flex items-start gap-5 p-6 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:shadow-xl transition-all">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                  <span className="text-white font-bold text-lg">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg">{feature.title}</h3>
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 font-semibold whitespace-nowrap"
                                    >
                                      {feature.benefit}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-2xl blur-xl" />
                          <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 border border-pink-200/50 p-8 rounded-2xl">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <TrendingUp className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-pink-900 mb-2 text-lg">Ready to Transform Your Instagram?</h3>
                                <p className="text-pink-800 leading-relaxed">
                                  Join thousands of businesses already using our AI-powered tools to create engaging content, 
                                  grow their audience, and save hours of manual work every week.
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Step 5: Final Confirmation */}
                    {currentStep === 5 && (
                      <div className="space-y-8">
                        <motion.div 
                          className="text-center mb-8"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <motion.div
                            className="relative inline-block mb-6"
                            animate={{
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-full blur-2xl" />
                            <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl">
                              <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                          </motion.div>
                          <p className="text-gray-600 leading-relaxed">
                            You're all set! Review the summary below and click "Connect Instagram" to complete the setup.
                          </p>
                        </motion.div>

                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl" />
                          <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                            <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                              <Zap className="w-5 h-5 text-purple-500" />
                              Connection Summary
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </div>
                                  Account Requirements
                                </h4>
                                <ul className="space-y-3">
                                  {[
                                    "Instagram Business Account",
                                    "Facebook Page Connected",
                                    "Admin Access Confirmed"
                                  ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-600">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  Features Enabled
                                </h4>
                                <ul className="space-y-3">
                                  {[
                                    "AI Content Creation",
                                    "Smart Scheduling",
                                    "Performance Analytics"
                                  ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-600">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="space-y-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="flex items-start gap-4 p-5 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                            <Checkbox
                              id="terms"
                              checked={agreedToTerms}
                              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                              className="mt-1"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                              I agree to the{" "}
                              <a href="#" className="text-purple-600 underline font-semibold hover:text-purple-700 transition-colors">
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a href="#" className="text-purple-600 underline font-semibold hover:text-purple-700 transition-colors">
                                Privacy Policy
                              </a>.
                              I understand that I can disconnect my account at any time from the settings page.
                            </label>
                          </div>
                        </motion.div>

                        {!agreedToTerms && (
                          <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-5 rounded-2xl">
                              <p className="text-amber-800 text-sm leading-relaxed">
                                Please agree to the terms and conditions to continue with the connection.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Premium Navigation Buttons */}
          <motion.div 
            className="flex items-center justify-between mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-3">
              {currentStep > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-6 rounded-xl border-gray-300 hover:border-purple-300 hover:bg-purple-50 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-6 py-6 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="relative flex items-center gap-2 px-8 py-6 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : currentStep === 5 ? (
                    <>
                      <Instagram className="w-5 h-5" />
                      Connect Instagram
                      <ExternalLink className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Premium Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 absolute top-0 left-0 right-0 rounded-t-lg" />
          <AlertDialogHeader className="pt-6">
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Connect Instagram Account
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 leading-relaxed pt-2">
              You'll be redirected to Instagram to authorize the connection. 
              This will open a new window where you can safely log in and grant permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel className="rounded-xl px-6 py-5 border-gray-300 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConnect}
              className="rounded-xl px-6 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Continue to Instagram
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};