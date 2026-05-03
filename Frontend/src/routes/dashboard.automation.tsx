import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Workflow,
  Zap,
  MessageCircle,
  Mail,
  Star,
  Tag,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/automation")({
  head: () => ({ meta: [{ title: "Automation — Saadhyam AI" }] }),
  component: AutomationPage,
});

const iconMap: Record<string, any> = {
  MessageCircle,
  Mail,
  Star,
  Tag,
  Workflow,
};

const initial = [
  {
    id: 1,
    name: "Welcome new customers",
    on: true,
    icon: "MessageCircle",
    desc: "Send a personalized WhatsApp welcome 5 min after first purchase.",
    runs: "247 runs this month",
    steps: ["New order", "Wait 5 min", "Send WhatsApp message"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 2,
    name: "Re-engage dormant customers",
    on: true,
    icon: "Mail",
    desc: "Email customers who haven't purchased in 60 days with a 15% offer.",
    runs: "84 runs this month",
    steps: ["No purchase 60 days", "Generate AI offer", "Send email"],
    color: "from-purple-500 to-fuchsia-500",
  },
  {
    id: 3,
    name: "Ask for review",
    on: false,
    icon: "Star",
    desc: "Send a Google review request 3 days after order delivery.",
    runs: "Inactive",
    steps: ["Order delivered", "Wait 3 days", "Send WhatsApp review link"],
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 4,
    name: "Abandoned cart recovery",
    on: true,
    icon: "Tag",
    desc: "Trigger AI-personalized recovery message after 1 hour cart abandon.",
    runs: "156 runs this month",
    steps: ["Cart abandoned", "Wait 1 hr", "Send WhatsApp + offer"],
    color: "from-pink-500 to-rose-500",
  },
];

function AutomationPage() {
  const [flows, setFlows] = useState(initial);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: "", desc: "" });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await apiClient.getWorkflows();
      if (response.success && response.workflows && response.workflows.length > 0) {
        setFlows(response.workflows);
      }
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  };

  const toggle = async (id: number) => {
    const workflow = flows.find((f) => f.id === id);
    if (!workflow) return;

    const updatedWorkflow = { ...workflow, on: !workflow.on };

    try {
      await apiClient.updateWorkflow(id, updatedWorkflow);
      setFlows(flows.map((f) => (f.id === id ? updatedWorkflow : f)));
      toast.success(updatedWorkflow.on ? "Workflow activated" : "Workflow paused");
    } catch (error) {
      console.error("Failed to update workflow:", error);
      // Update locally anyway
      setFlows(flows.map((f) => (f.id === id ? updatedWorkflow : f)));
    }
  };

  const handleAddWorkflow = async () => {
    if (!newWorkflow.name.trim() || !newWorkflow.desc.trim()) {
      toast.error("Please enter name and description");
      return;
    }

    try {
      const response = await apiClient.createWorkflow({
        name: newWorkflow.name,
        desc: newWorkflow.desc,
        on: false,
        icon: "Workflow",
        runs: "0 runs",
        steps: ["Trigger", "Action", "Complete"],
        color: "from-blue-500 to-cyan-500",
      });

      if (response.success && response.workflow) {
        setFlows([...flows, response.workflow]);
        toast.success("Workflow created successfully!");
        setNewWorkflow({ name: "", desc: "" });
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error("Failed to add workflow:", error);
      toast.error("Failed to create workflow");
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    try {
      await apiClient.deleteWorkflow(id);
      setFlows(flows.filter((f) => f.id !== id));
      toast.success("Workflow deleted");
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      toast.error("Failed to delete workflow");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Automation"
        subtitle="Set it once, grow on autopilot"
        actions={
          <Button variant="hero" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus size={14} /> New workflow
          </Button>
        }
      />

      {/* Add Workflow Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Workflow</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Workflow Name</label>
                <input
                  type="text"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="E.g., Birthday wishes"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Description</label>
                <textarea
                  value={newWorkflow.desc}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, desc: e.target.value })}
                  placeholder="What does this workflow do?"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button variant="hero" className="flex-1" onClick={handleAddWorkflow}>
                  Create Workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { l: "Active workflows", v: flows.filter((f) => f.on).length, i: Workflow },
          { l: "Total runs (30d)", v: "487", i: Zap },
          { l: "Time saved", v: "32 hrs", i: Star },
        ].map((s) => (
          <div
            key={s.l}
            className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 flex items-center gap-4"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <s.i size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.l}</p>
              <p className="text-2xl font-bold">{s.v}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {flows.map((f) => {
          const IconComponent = iconMap[f.icon] || Workflow;
          return (
            <div
              key={f.id}
              className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 hover-lift relative"
            >
              <button
                onClick={() => handleDeleteWorkflow(f.id)}
                className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex items-start gap-4">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0`}
                >
                  <IconComponent size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.runs}</p>
                    </div>
                    <Switch checked={f.on} onCheckedChange={() => toggle(f.id)} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {f.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-muted/60 text-xs font-medium">
                          {s}
                        </span>
                        {i < f.steps.length - 1 && (
                          <ArrowRight size={12} className="text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
