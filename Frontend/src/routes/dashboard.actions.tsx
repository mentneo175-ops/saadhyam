import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Plus,
  Star,
  Instagram,
  MessageCircle,
  Tag,
  Eye,
  Megaphone,
  Mail,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/actions")({
  head: () => ({ meta: [{ title: "Daily Tasks — Saadhyam AI" }] }),
  component: ActionsPage,
});

const iconMap: Record<string, any> = {
  Star,
  Instagram,
  MessageCircle,
  Tag,
  Eye,
  Megaphone,
  Mail,
};

const initial = [
  {
    id: 1,
    icon: "Star",
    title: "Ask 30 customers for Google reviews",
    impact: "High",
    time: "10 min",
    done: false,
    ai: true,
  },
  {
    id: 2,
    icon: "Instagram",
    title: "Schedule today's Instagram reel",
    impact: "High",
    time: "5 min",
    done: false,
    ai: true,
  },
  {
    id: 3,
    icon: "MessageCircle",
    title: "Reply to 12 unread WhatsApp messages",
    impact: "Medium",
    time: "15 min",
    done: false,
    ai: false,
  },
  {
    id: 4,
    icon: "Tag",
    title: "Launch Diwali bundle offer",
    impact: "High",
    time: "20 min",
    done: false,
    ai: true,
  },
  {
    id: 5,
    icon: "Eye",
    title: "Review competitor pricing changes",
    impact: "Low",
    time: "8 min",
    done: true,
    ai: false,
  },
  {
    id: 6,
    icon: "Megaphone",
    title: "Approve weekend ad copy",
    impact: "Medium",
    time: "3 min",
    done: false,
    ai: true,
  },
  {
    id: 7,
    icon: "Mail",
    title: "Send re-engagement email to dormant leads",
    impact: "Medium",
    time: "12 min",
    done: false,
    ai: true,
  },
];

const impactColor: Record<string, string> = {
  High: "bg-secondary/15 text-secondary",
  Medium: "bg-accent/20 text-amber-700",
  Low: "bg-muted text-muted-foreground",
};

function ActionsPage() {
  const [tasks, setTasks] = useState(initial);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", impact: "Medium", time: "10 min" });

  // Load tasks from backend
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await apiClient.getTasks();
      if (response.success && response.tasks && response.tasks.length > 0) {
        setTasks(response.tasks);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
      // Use initial tasks as fallback
    }
  };

  const toggle = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, done: !task.done };

    try {
      await apiClient.updateTask(id, updatedTask);
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
      toast.success(updatedTask.done ? "Task completed!" : "Task reopened");
    } catch (error) {
      console.error("Failed to update task:", error);
      // Update locally anyway
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      const response = await apiClient.createTask({
        title: newTask.title,
        impact: newTask.impact,
        time: newTask.time,
        done: false,
        ai: false,
        icon: "Star",
      });

      if (response.success && response.task) {
        setTasks([...tasks, response.task]);
        toast.success("Task added successfully!");
        setNewTask({ title: "", impact: "Medium", time: "10 min" });
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error("Failed to add task");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await apiClient.deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Daily Tasks AI"
        subtitle={`${remaining} tasks for today · AI-prioritized by impact`}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles size={14} /> AI Suggest
            </Button>
            <Button variant="hero" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus size={14} /> Add Task
            </Button>
          </>
        }
      />

      {/* Add Task Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="E.g., Follow up with 10 leads"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Impact</label>
                  <select
                    value={newTask.impact}
                    onChange={(e) => setNewTask({ ...newTask, impact: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Time</label>
                  <input
                    type="text"
                    value={newTask.time}
                    onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                    placeholder="10 min"
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button variant="hero" className="flex-1" onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border/60 shadow-soft divide-y divide-border/60 overflow-hidden">
        {tasks.map((t) => {
          const IconComponent = iconMap[t.icon] || Star;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-4 p-4 hover:bg-muted/40 transition ${t.done ? "opacity-60" : ""}`}
            >
              <button
                onClick={() => toggle(t.id)}
                className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition shrink-0 ${
                  t.done ? "bg-success border-success" : "border-border hover:border-primary"
                }`}
              >
                {t.done && (
                  <svg viewBox="0 0 20 20" className="w-3 h-3 text-white">
                    <path
                      d="M5 10l4 4 6-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shrink-0">
                <IconComponent size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${t.done ? "line-through" : ""}`}>{t.title}</p>
                  {t.ai && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                      <Sparkles size={10} /> AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">~{t.time}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${impactColor[t.impact]}`}
              >
                {t.impact}
              </span>
              <button
                onClick={() => handleDeleteTask(t.id)}
                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
