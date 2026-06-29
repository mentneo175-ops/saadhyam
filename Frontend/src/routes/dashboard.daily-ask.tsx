import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Clock,
  Loader2,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  Award,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Loader } from "@/components/ui/loader";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/daily-ask")({
  head: () => ({ meta: [{ title: "Daily Suggestions — Saadhyam AI" }] }),
  component: DailyAskPage,
});

interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  points: number;
  estimated_minutes: number;
  is_completed: boolean;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  completed: number;
  pending: number;
  total_points: number;
  earned_points: number;
}

function DailyAskPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-ask-refresh",
      title: "Daily Tasks",
      heading: "1. Refresh Suggestions",
      desc: "Regenerate personalized suggestions and growth tasks for your business operations.",
      indicator: 1
    },
    {
      id: "tour-ask-progress",
      title: "Task Completion",
      heading: "2. Today's Progress Tracker",
      desc: "Monitor your completion metrics and overall score updates in real-time.",
      indicator: 2
    },
    {
      id: "tour-ask-list",
      title: "Action Plan Checklist",
      heading: "3. Actionable Items",
      desc: "Complete checklist tasks to gain points, build brand presence, and drive sales.",
      indicator: 3
    }
  ];

  // Auto-trigger tour for new users once loaded
  useEffect(() => {
    const isCompleted = localStorage.getItem("saadhyam_tour_daily_ask_completed");
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
        setTourStep(1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Filter active steps based on DOM presence
  useEffect(() => {
    if (isTourActive) {
      const active = tourStepsConfig.filter(step => !!document.getElementById(step.id));
      setActiveTourSteps(active);
      if (tourStep > active.length && active.length > 0) {
        setTourStep(1);
      }
    }
  }, [isTourActive]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (currentStepConfig) {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }
    }
  }, [tourStep, isTourActive, activeTourSteps]);

  // Position tracking logic supporting scrolling and window resizing
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (!currentStepConfig) return;

    const updatePosition = () => {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        setHighlightStyle({
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          position: "fixed",
          borderRadius: "16px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 4px rgba(139, 92, 246, 0.4)",
          border: "2px solid #8B5CF6",
          zIndex: 9999,
          pointerEvents: "none",
          transition: "all 0.15s ease-out",
        });

        const spaceBelow = window.innerHeight - rect.bottom;
        const placeBelow = spaceBelow > 260 || rect.top < 260;

        setTooltipStyle({
          top: placeBelow ? rect.bottom + 12 : rect.top - 280,
          left: Math.max(16, Math.min(window.innerWidth - 340, rect.left + rect.width / 2 - 160)),
          position: "fixed",
          zIndex: 10000,
          width: "320px",
          transition: "all 0.15s ease-out",
        });
      }
    };

    updatePosition();
    const timer1 = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 400);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [tourStep, isTourActive, activeTourSteps]);

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  // Load tasks on mount and auto-generate if none exist
  useEffect(() => {
    loadTasks();
  }, []);

  // Auto-generate tasks if none exist (first time user)
  useEffect(() => {
    if (!isLoading && tasks.length === 0 && !error) {
      // Auto-generate tasks for first-time users
      generateTasks();
    }
  }, [isLoading, tasks.length, error]);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(`${env.apiBaseUrl}/api/tasks/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: TasksResponse = await response.json();
        setTasks(data.tasks);
      } else if (response.status === 401) {
        setError("Not authenticated. Please log in again.");
      } else {
        throw new Error("Failed to load tasks");
      }
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const generateTasks = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const token = getToken();
      const response = await fetch(`${env.apiBaseUrl}/api/tasks/generate-daily?num_tasks=5`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: TasksResponse = await response.json();
        
        // If we got new tasks, add them to existing tasks
        if (data.tasks.length > 0) {
          setTasks((prev) => {
            // Combine existing and new tasks, removing duplicates by ID
            const taskMap = new Map();
            [...prev, ...data.tasks].forEach(task => taskMap.set(task.id, task));
            return Array.from(taskMap.values());
          });
        } else {
          // No new tasks available
          setError("All available tasks for today have been assigned. Great job!");
        }
      } else {
        throw new Error("Failed to generate tasks");
      }
    } catch (err: any) {
      console.error("Error generating tasks:", err);
      setError(err.message || "Failed to generate tasks");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      setCompleting(taskId);
      const token = getToken();

      const endpoint = isCompleted
        ? `${env.apiBaseUrl}/api/tasks/${taskId}/uncomplete`
        : `${env.apiBaseUrl}/api/tasks/${taskId}/complete`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, is_completed: !isCompleted } : task
          )
        );

        // Trigger growth chart refresh
        window.dispatchEvent(new CustomEvent("taskCompleted"));
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    } finally {
      setCompleting(null);
    }
  };

  // Calculate progress
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-full p-6 bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 dark:from-slate-950 dark:via-background dark:to-slate-950">
        <Loader text="Loading Your Daily Plan" className="py-32" />
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="p-4 md:p-6 space-y-5 min-h-full bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 dark:from-slate-950 dark:via-background dark:to-slate-950">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-pink-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">Generating tasks...</p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">Creating your personalized action plan</p>
        </div>
      </div>
    );
  }

  // No tasks state
  if (tasks.length === 0 && !error) {
    return (
      <div className="p-4 md:p-6 space-y-5 min-h-full bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 dark:from-slate-950 dark:via-background dark:to-slate-950">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-pink-600 dark:text-pink-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-slate-100">Generating Your Tasks...</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6 text-center max-w-md">
            We're creating personalized tasks based on your business profile.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-5 min-h-full bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 dark:from-slate-950 dark:via-background dark:to-slate-950">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 border rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 dark:text-red-400 mb-4" />
          <p className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Failed to Load Tasks</p>
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <Button variant="hero" onClick={loadTasks}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show daily tasks
  return (
    <div className="min-h-full bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 dark:from-slate-950 dark:via-background dark:to-slate-950 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Premium Header */}
      <div className="relative z-20 px-4 md:px-8 pt-4 md:sticky md:top-0">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-lg shadow-purple-500/5 backdrop-blur-xl">
          {/* Animated gradient line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className="px-4 py-4 md:px-8 md:py-5">
            <div className="flex items-start justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent"
                style={{
                  backgroundSize: "200% auto",
                }}
                animate={{
                  backgroundPosition: ["0% center", "200% center"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                Daily Suggestions
              </motion.h1>
              <div className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calendar size={14} className="text-purple-600 dark:text-purple-400" />
                </motion.div>
                <span>Your personalized action plan for today</span>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <button
                id="tour-btn-daily-ask-help"
                type="button"
                className="shrink-0 p-3 rounded-xl bg-white hover:bg-purple-50 border-2 border-purple-200/60 hover:border-purple-400 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800/80 dark:hover:border-purple-500/40 cursor-pointer"
                onClick={() => {
                  setIsTourActive(true);
                  setTourStep(1);
                }}
                title="Start Guided Tour"
              >
                <HelpCircle size={20} className="text-purple-600 dark:text-purple-400" />
              </button>
              <motion.button
                id="tour-ask-refresh"
                onClick={generateTasks}
                disabled={isGenerating}
                whileHover={{ scale: 1.08, rotate: 10 }}
                whileTap={{ scale: 0.94, rotate: -10 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="shrink-0 p-3 rounded-xl bg-white hover:bg-purple-50 border-2 border-purple-200/60 hover:border-purple-400 shadow-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 relative overflow-hidden group dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800/80 dark:hover:border-purple-500/40"
                title="Refresh tasks"
              >
                {/* Button glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/30 to-purple-400/0"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
                <RefreshCw size={20} className={`text-purple-600 relative z-10 ${isGenerating ? "animate-spin" : ""}`} />
              </motion.button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-5 mt-4 md:mt-6">
        {/* Progress Card */}
        {totalTasks > 0 && (
          <motion.div
            id="tour-ask-progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 backdrop-blur-md dark:bg-slate-900/95 rounded-2xl border border-purple-100/50 dark:border-slate-800/80 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden group"
          >
            <div className="px-6 py-4 border-b border-purple-50/80 dark:border-slate-800/50 bg-gradient-to-r from-purple-50/30 via-transparent to-fuchsia-50/30 dark:from-purple-950/10 dark:via-transparent dark:to-fuchsia-950/10">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/30"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  <Target size={16} className="text-white" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">Today's Progress</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{completedCount} of {totalTasks} tasks completed</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <motion.div 
                    className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {Math.round(progressPercentage)}%
                  </motion.div>
                  <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">Complete</div>
                </motion.div>
                <div className="flex items-center gap-6">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{completedCount}</div>
                    <div className="text-xs text-gray-600 dark:text-slate-400">Done</div>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-xl font-bold text-gray-400 dark:text-gray-500">{totalTasks - completedCount}</div>
                    <div className="text-xs text-gray-600 dark:text-slate-400">Pending</div>
                  </motion.div>
                </div>
              </div>
              <div className="relative w-full bg-gradient-to-r from-gray-100 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/50 overflow-hidden"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Daily Tasks Grid */}
        {tasks.length > 0 && (
          <motion.div
            id="tour-ask-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <motion.div 
                className="p-2.5 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/30 relative overflow-hidden"
                animate={{ 
                  boxShadow: [
                    "0 10px 30px rgba(168, 85, 247, 0.3)",
                    "0 10px 40px rgba(217, 70, 239, 0.4)",
                    "0 10px 30px rgba(168, 85, 247, 0.3)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Icon glow pulse */}
                <motion.div
                  className="absolute inset-0 bg-white/30 rounded-xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <Sparkles size={18} className="text-white relative z-10" />
                </motion.div>
              </motion.div>
              <div>
                <motion.h3 
                  className="font-bold text-lg text-gray-900 dark:text-slate-100"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                >
                  Daily Actions
                </motion.h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">Check off tasks as you complete them</p>
              </div>
            </div>
            
            {/* Grid Layout for Tasks - 4 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {tasks.map((task, index) => {
                  const isCompleted = task.is_completed;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        delay: index * 0.08,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        y: -8,
                        rotateY: 5,
                        transition: { duration: 0.2 }
                      }}
                      onClick={() => toggleTask(task.id, task.is_completed)}
                      className={`group flex flex-col gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 shadow-sm dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800/50"
                          : "bg-white/95 backdrop-blur-md border-purple-100/60 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-fuchsia-50/50 hover:shadow-2xl hover:shadow-purple-500/20 dark:bg-slate-900/95 dark:border-slate-800/80 dark:hover:border-purple-500/50 dark:hover:from-purple-950/30 dark:hover:to-fuchsia-950/30"
                      } ${completing === task.id ? "opacity-50" : ""}`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Animated glow effect ONLY on hover - not rotating */}
                      {!isCompleted && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-fuchsia-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100"
                          animate={{
                            x: ["-100%", "100%"]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 0.5
                          }}
                        />
                      )}

                      {/* Sparkle particles on completed tasks */}
                      {isCompleted && (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                              style={{
                                left: `${20 + i * 15}%`,
                                top: "50%",
                              }}
                              animate={{
                                y: [-10, -30, -10],
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </>
                      )}

                      {/* Header with checkbox and points */}
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <motion.div 
                          className="shrink-0"
                          whileHover={{ scale: 1.3, rotate: 360 }}
                          transition={{ type: "spring", stiffness: 300, duration: 0.6 }}
                        >
                          {completing === task.id ? (
                            <Loader2 size={22} className="animate-spin text-purple-400" />
                          ) : isCompleted ? (
                            <div className="relative">
                              <motion.div 
                                className="absolute inset-0 bg-emerald-500 blur-md opacity-30 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <CheckCircle2 size={22} className="text-emerald-600 relative" />
                              </motion.div>
                            </div>
                          ) : (
                            <Circle size={22} className="text-gray-300 dark:text-slate-600 group-hover:text-purple-400 transition-colors" />
                          )}
                        </motion.div>
                        <motion.span 
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border border-purple-200/60 dark:from-purple-900/40 dark:to-fuchsia-900/40 dark:text-purple-300 dark:border-purple-800/50 shadow-sm shrink-0 relative overflow-hidden"
                          whileHover={{ scale: 1.15, rotate: -5 }}
                          animate={isCompleted ? { 
                            scale: [1, 1.3, 1],
                            rotate: [0, 15, -15, 0]
                          } : {}}
                          transition={{ duration: 0.6 }}
                        >
                          {/* Badge shimmer */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{
                              x: ["-100%", "200%"]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                            }}
                          />
                          <Award size={12} className="relative z-10" />
                          +{task.points}
                        </motion.span>
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <motion.p
                          className={`text-base font-semibold leading-relaxed mb-2 ${
                            isCompleted ? "text-gray-500 dark:text-slate-500 line-through" : "text-gray-900 dark:text-slate-100"
                          }`}
                          animate={isCompleted ? { 
                            opacity: [1, 0.7, 1],
                            x: [0, 2, 0]
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {task.title}
                        </motion.p>
                        {task.description && (
                          <p
                            className={`text-sm leading-relaxed mb-3 ${
                              isCompleted ? "text-gray-400 dark:text-slate-500" : "text-gray-600 dark:text-slate-300"
                            }`}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Footer with category and time */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-100/50 relative z-10">
                        <motion.span 
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border border-purple-200/60 dark:from-purple-950/40 dark:to-fuchsia-950/40 dark:text-purple-300 dark:border-purple-850/50"
                          whileHover={{ scale: 1.1, y: -2 }}
                        >
                          {task.category}
                        </motion.span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
                          <Clock size={12} />
                          ~{task.estimated_minutes} min
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Motivational Card */}
        {totalTasks > 0 && completedCount === totalTasks && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 p-6 transition-all duration-500 dark:from-emerald-950/10 dark:via-teal-950/10 dark:to-emerald-950/10"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-emerald-500 blur-xl opacity-30 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div 
                  className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <TrendingUp size={24} className="text-white" />
                </motion.div>
              </div>
              <div className="flex-1">
                <motion.h3 
                  className="text-xl font-bold text-gray-900 mb-2 dark:text-slate-100"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  🎉 All Tasks Completed!
                </motion.h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed dark:text-slate-300">
                  Outstanding work! You've completed all your daily tasks. Keep up the momentum and check back tomorrow for new suggestions.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 rounded-xl font-semibold text-sm"
                  >
                    View Dashboard
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-50 rounded-2xl border border-purple-200/60 dark:border-purple-800/50 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 p-6 transition-all duration-500 dark:from-purple-950/10 dark:via-fuchsia-950/10 dark:to-purple-950/10"
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              <motion.div 
                className="absolute inset-0 bg-purple-500 blur-xl opacity-30 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div 
                className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <Zap size={24} className="text-white" />
              </motion.div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-3 dark:text-slate-100">Pro Tips for Success</h3>
              <ul className="space-y-2">
                {[
                  "Complete at least 3 tasks daily for consistent growth and momentum",
                  "Prioritize tasks that directly impact customer acquisition and retention",
                  "Track your progress regularly and celebrate small wins along the way"
                ].map((tip, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className="shrink-0 mt-0.5"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        delay: index * 0.5,
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <CheckCircle2 size={16} className="text-purple-600" />
                    </motion.div>
                    <span className="text-xs text-gray-700 leading-relaxed dark:text-slate-300">
                      {tip}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Interactive Guided Tour Overlay */}
      {isTourActive && (
        <div className="fixed inset-0 z-[9998] pointer-events-none text-slate-100">
          {/* Highlight element mask */}
          {highlightStyle.top !== undefined && (
            <div
              style={highlightStyle}
              className="fixed transition-all duration-200 ease-out pointer-events-none"
            />
          )}

          {/* Full-screen click interceptor mask for everything EXCEPT the highlighted area */}
          <div className="fixed inset-0 bg-transparent pointer-events-auto z-[998]" onClick={() => setIsTourActive(false)} />

          {/* Interactive Tooltip popup */}
          {tooltipStyle.top !== undefined && activeTourSteps[tourStep - 1] && (
            <div
              style={tooltipStyle}
              className="bg-slate-900 border border-purple-500/30 p-5 z-[10000] w-[320px] shadow-2xl rounded-2xl animate-fade-in pointer-events-auto flex flex-col gap-4 text-white"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {activeTourSteps[tourStep - 1].title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {tourStep} / {activeTourSteps.length}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <h3 className="font-extrabold text-white text-sm">
                  {activeTourSteps[tourStep - 1].heading}
                </h3>
                <p className="text-slate-300 leading-normal text-[11px]">
                  {activeTourSteps[tourStep - 1].desc}
                </p>
              </div>

              {/* Animated visual indicators */}
              <div className="h-16 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden relative">
                {activeTourSteps[tourStep - 1].indicator === 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                    </span>
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider animate-pulse">Ready to refresh suggestions</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Target size={14} className="animate-bounce text-purple-450" />
                    <span>Real-time Goals Active</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Scoring Active Challenge Tasks</span>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white transition-all border border-transparent hover:bg-white/5 rounded cursor-pointer"
                  onClick={() => setIsTourActive(false)}
                >
                  Skip
                </button>
                <div className="flex items-center gap-1.5">
                  {tourStep > 1 && (
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] text-slate-300 hover:text-white border border-white/10 rounded cursor-pointer"
                      onClick={() => setTourStep(tourStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-3 py-1 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold cursor-pointer"
                    onClick={() => {
                      if (tourStep < activeTourSteps.length) {
                        setTourStep(tourStep + 1);
                      } else {
                        setIsTourActive(false);
                        localStorage.setItem("saadhyam_tour_daily_ask_completed", "true");
                      }
                    }}
                  >
                    {tourStep === activeTourSteps.length ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
