import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

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

export function DailyTasksWidget() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/tasks/today", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: TasksResponse = await response.json();
        setTasks(data.tasks);
        setEarnedPoints(data.earned_points);
        setTotalPoints(data.total_points);
        // Find first incomplete task
        const firstIncomplete = data.tasks.findIndex(t => !t.is_completed);
        if (firstIncomplete !== -1) {
          setCurrentTaskIndex(firstIncomplete);
        }
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      setCompleting(taskId);
      const token = localStorage.getItem("saadhyam_token");
      if (!token) return;

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
        
        // Update points
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          if (!isCompleted) {
            setEarnedPoints(prev => prev + task.points);
          } else {
            setEarnedPoints(prev => prev - task.points);
          }
        }
        
        // Move to next incomplete task
        if (!isCompleted) {
          const nextIncomplete = tasks.findIndex((t, idx) => idx > currentTaskIndex && !t.is_completed);
          if (nextIncomplete !== -1) {
            setCurrentTaskIndex(nextIncomplete);
          }
        }

        // Trigger growth chart refresh by dispatching custom event
        window.dispatchEvent(new CustomEvent("taskCompleted"));
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    } finally {
      setCompleting(null);
    }
  };

  const nextTask = () => {
    const nextIndex = tasks.findIndex((t, idx) => idx > currentTaskIndex && !t.is_completed);
    if (nextIndex !== -1) {
      setCurrentTaskIndex(nextIndex);
    } else {
      // Wrap around to first incomplete
      const firstIncomplete = tasks.findIndex(t => !t.is_completed);
      if (firstIncomplete !== -1) {
        setCurrentTaskIndex(firstIncomplete);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      marketing: "bg-pink-100 text-pink-700",
      content: "bg-purple-100 text-purple-700",
      engagement: "bg-blue-100 text-blue-700",
      analytics: "bg-emerald-100 text-emerald-700",
      growth: "bg-amber-100 text-amber-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const currentTask = tasks[currentTaskIndex];

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-pink-600" />
      </div>
    );
  }

  // No tasks state
  if (tasks.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-gray-600 mb-3">No tasks for today</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/dashboard/daily-ask" })}
        >
          <Sparkles size={14} />
          Generate Tasks
        </Button>
      </div>
    );
  }

  // All tasks completed
  if (completedCount === tasks.length) {
    return (
      <div className="py-4">
        <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg p-4 text-center mb-3">
          <p className="text-sm font-semibold text-emerald-900">
            🎉 All tasks completed today!
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            +{earnedPoints} points earned
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Today's Progress</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  // Show current task
  return (
    <div className="py-3">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Today's Progress ({completedCount}/{tasks.length})</span>
          <span className="font-semibold text-pink-600">{earnedPoints}/{totalPoints} pts</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div
          onClick={() => toggleTask(currentTask.id, currentTask.is_completed)}
          className="flex items-start gap-3 p-3 rounded-lg border-2 bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50 cursor-pointer transition-all mb-3"
        >
          <div className="shrink-0 mt-0.5">
            {completing === currentTask.id ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : currentTask.is_completed ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : (
              <Circle size={18} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium leading-tight text-gray-900">
                {currentTask.title}
              </p>
              <span className="text-xs font-semibold text-pink-600 shrink-0">
                +{currentTask.points}
              </span>
            </div>
            {currentTask.description && (
              <p className="text-xs leading-relaxed mb-2 text-gray-600">
                {currentTask.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                  currentTask.category
                )}`}
              >
                {currentTask.category}
              </span>
              <span className="text-xs text-gray-500">
                ~{currentTask.estimated_minutes} min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {tasks.filter(t => !t.is_completed).length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={nextTask}
            className="flex-1"
          >
            Next Task <ChevronRight size={14} />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/dashboard/daily-ask" })}
          className="flex-1"
        >
          View All <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
