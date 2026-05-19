import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

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
      const response = await fetch("http://localhost:8000/api/tasks/today", {
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
      const response = await fetch("http://localhost:8000/api/tasks/generate-daily?num_tasks=5", {
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
        ? `http://localhost:8000/api/tasks/${taskId}/uncomplete`
        : `http://localhost:8000/api/tasks/${taskId}/complete`;

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
      <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 p-6">
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 blur-3xl opacity-20 rounded-full" />
            <Loader2 size={56} className="animate-spin text-purple-600 relative" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mt-8">Loading Your Daily Plan</h3>
          <p className="text-sm text-gray-600 mt-2">Preparing personalized suggestions...</p>
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-pink-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Generating tasks...</p>
          <p className="text-sm text-gray-600 mt-2">Creating your personalized action plan</p>
        </div>
      </div>
    );
  }

  // No tasks state
  if (tasks.length === 0 && !error) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-pink-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Tasks...</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            We're creating personalized tasks based on your business profile.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="bg-red-50 border-red-200 border rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">Failed to Load Tasks</p>
          <p className="text-red-700 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40 relative overflow-hidden">
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
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-purple-100/50 shadow-sm relative overflow-hidden">
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
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
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
              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calendar size={14} className="text-purple-600" />
                </motion.div>
                Your personalized action plan for today
              </p>
            </motion.div>
            <motion.button
              onClick={generateTasks}
              disabled={isGenerating}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9, rotate: -15 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="p-3 rounded-xl bg-white hover:bg-purple-50 border-2 border-purple-200/60 hover:border-purple-400 shadow-sm hover:shadow-lg transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
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

      <div className="px-8 py-6 space-y-5">
        {/* Progress Card */}
        {totalTasks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 backdrop-blur-md rounded-2xl border border-purple-100/50 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden group"
          >
            <div className="px-6 py-4 border-b border-purple-50/80 bg-gradient-to-r from-purple-50/30 via-transparent to-fuchsia-50/30">
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
                  <h3 className="font-bold text-base text-gray-900">Today's Progress</h3>
                  <p className="text-xs text-gray-600">{completedCount} of {totalTasks} tasks completed</p>
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
                  <div className="text-xs text-gray-600 mt-0.5">Complete</div>
                </motion.div>
                <div className="flex items-center gap-6">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-xl font-bold text-gray-900">{completedCount}</div>
                    <div className="text-xs text-gray-600">Done</div>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-xl font-bold text-gray-400">{totalTasks - completedCount}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </motion.div>
                </div>
              </div>
              <div className="relative w-full bg-gradient-to-r from-gray-100 to-purple-50 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/50 relative overflow-hidden"
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
                  className="font-bold text-lg text-gray-900"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                >
                  Daily Actions
                </motion.h3>
                <p className="text-sm text-gray-600">Check off tasks as you complete them</p>
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
                          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 shadow-sm"
                          : "bg-white/95 backdrop-blur-md border-purple-100/60 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-fuchsia-50/50 hover:shadow-2xl hover:shadow-purple-500/20"
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
                            <Circle size={22} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
                          )}
                        </motion.div>
                        <motion.span 
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border border-purple-200/60 shadow-sm shrink-0 relative overflow-hidden"
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
                            isCompleted ? "text-gray-500 line-through" : "text-gray-900"
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
                              isCompleted ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Footer with category and time */}
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-100/50 relative z-10">
                        <motion.span 
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border border-purple-200/60"
                          whileHover={{ scale: 1.1, y: -2 }}
                        >
                          {task.category}
                        </motion.span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
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
            className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/60 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 p-6 transition-all duration-500"
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
                  className="text-xl font-bold text-gray-900 mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  🎉 All Tasks Completed!
                </motion.h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
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
          className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-50 rounded-2xl border border-purple-200/60 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 p-6 transition-all duration-500"
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
              <h3 className="text-base font-bold text-gray-900 mb-3">Pro Tips for Success</h3>
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
                    <span className="text-xs text-gray-700 leading-relaxed">
                      {tip}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
