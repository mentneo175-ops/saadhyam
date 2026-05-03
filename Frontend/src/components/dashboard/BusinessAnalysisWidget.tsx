import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface BusinessAnalysisWidgetProps {
  onTasksGenerated?: (tasks: any[]) => void;
}

export function BusinessAnalysisWidget({ onTasksGenerated }: BusinessAnalysisWidgetProps) {
  const [businessDescription, setBusinessDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!businessDescription.trim()) {
      setError("Please describe your business");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await apiClient.analyzeBusiness(businessDescription);

      if (response.success) {
        // Convert recommendations to tasks
        const generatedTasks = response.recommendations.map((rec: string, idx: number) => ({
          title: rec,
          impact: idx < 2 ? "High" : idx < 4 ? "Medium" : "Low",
          time: "15 min",
          done: false,
          ai: true,
          icon: "Sparkles",
        }));

        // Create tasks in backend
        for (const task of generatedTasks) {
          try {
            await apiClient.createTask(task);
          } catch (err) {
            console.error("Failed to create task:", err);
          }
        }

        toast.success(`Generated ${generatedTasks.length} tasks from analysis!`);
        setBusinessDescription("");

        // Notify parent component
        if (onTasksGenerated) {
          onTasksGenerated(generatedTasks);
        }
      } else {
        setError(response.error || "Analysis failed");
        toast.error("Analysis failed");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to analyze business";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            AI Business Analysis
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Describe your business to get AI-powered insights and auto-generate daily tasks
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder="E.g., We are a restaurant in downtown area serving Italian cuisine. We have 50 seats, open 6 days a week. We have Instagram and Facebook but post irregularly..."
          className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none resize-none min-h-20"
        />

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          variant="hero"
          className="w-full"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !businessDescription.trim()}
        >
          {isAnalyzing ? (
            <>
              <Loader size={14} className="animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Analyze & Generate Tasks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
