import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

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
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-pink-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
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
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Suggestions</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Calendar size={14} className="text-pink-600" />
            Your personalized daily action plan
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={generateTasks}
          disabled={isGenerating}
        >
          <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
          Add More Tasks
        </Button>
      </div>

      {/* Progress Card */}
      {totalTasks > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
              <p className="text-sm text-gray-600">
                {completedCount} of {totalTasks} tasks completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-pink-600">{Math.round(progressPercentage)}%</div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Daily Tasks Checklist */}
      {tasks.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Sparkles size={20} className="text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Daily Actions</h3>
              <p className="text-xs text-gray-600">Check off tasks as you complete them</p>
            </div>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => {
              const isCompleted = task.is_completed;
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isCompleted
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  } ${completing === task.id ? "opacity-50" : ""}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {completing === task.id ? (
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p
                        className={`text-sm font-medium leading-relaxed ${
                          isCompleted ? "text-gray-500 line-through" : "text-gray-700"
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className="text-xs font-semibold text-pink-600 shrink-0">
                        +{task.points}
                      </span>
                    </div>
                    {task.description && (
                      <p
                        className={`text-xs leading-relaxed mb-2 ${
                          isCompleted ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        {task.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        ~{task.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivational Card */}
      {totalTasks > 0 && completedCount === totalTasks && (
        <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl border border-emerald-200 p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
              <TrendingUp size={24} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎉 All Tasks Completed!</h3>
              <p className="text-sm text-gray-700 mb-4">
                Great job! You've completed all your daily tasks. Keep up the momentum and check back tomorrow for new suggestions.
              </p>
              <Button variant="hero" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Card */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border border-purple-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-purple-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Pro Tips</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Complete at least 3 tasks daily for consistent growth</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Prioritize tasks that directly impact customer acquisition</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Track your progress and celebrate small wins</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
