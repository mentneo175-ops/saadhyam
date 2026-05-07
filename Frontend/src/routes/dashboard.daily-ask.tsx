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
import {
  getDailySuggestionsData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type DailySuggestionsData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/daily-ask")({
  head: () => ({ meta: [{ title: "Daily Suggestions — Saadhyam AI" }] }),
  component: DailyAskPage,
});

function DailyAskPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<DailySuggestionsData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  // Load completed tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("completedDailyTasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedTasks(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse completed tasks:", e);
      }
    }
  }, []);

  // Save completed tasks to localStorage
  const saveCompletedTasks = (tasks: Set<number>) => {
    localStorage.setItem("completedDailyTasks", JSON.stringify(Array.from(tasks)));
  };

  // Toggle task completion
  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTasks(newCompleted);
    saveCompletedTasks(newCompleted);
  };

  // Load analysis status and data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();

      // Check status first
      const statusResult = await getAnalysisStatus(token);
      setStatus(statusResult);

      // If completed, load the data
      if (statusResult.status === "completed") {
        const data = await getDailySuggestionsData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        // If analyzing, start polling
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            // Analysis completed, load data
            const data = await getDailySuggestionsData(token);
            setAnalysis(data);
            setIsAnalyzing(false);
          })
          .catch((err) => {
            setError(err.message);
            setIsAnalyzing(false);
          });
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load daily suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const token = getToken();

      // Trigger analysis
      await triggerComprehensiveAnalysis(token);

      // Start polling for status
      await pollAnalysisStatus(token, (updatedStatus) => {
        setStatus(updatedStatus);
      });

      // Load the completed analysis
      const data = await getDailySuggestionsData(token);
      setAnalysis(data);
    } catch (err: any) {
      console.error("Error analyzing:", err);
      setError(err.message || "Failed to analyze business");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate progress
  const totalTasks = analysis?.daily_suggestions?.length || 0;
  const completedCount = completedTasks.size;
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

  // Analyzing state
  if (isAnalyzing || status?.status === "analyzing") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-pink-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Generating suggestions...</p>
          <p className="text-sm text-gray-600 mt-2">This may take 2-3 minutes</p>
          <p className="text-xs text-gray-500 mt-1">Using Google AI Studio Gemini with Search Grounding</p>
        </div>
      </div>
    );
  }

  // Not started state
  if (!analysis && status?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
            <Calendar size={40} className="text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Suggestions Found</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            You need to run a business analysis first to get daily action suggestions.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate({ to: "/dashboard/business-analysis" })}>
            <Sparkles size={20} />
            Go to Business Analysis
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Daily Suggestions"
          subtitle="Your daily action plan"
        />
        <div className="bg-red-50 border-red-200 border rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</p>
          <p className="text-red-700 mb-4">{error}</p>
          <Button variant="hero" onClick={handleAnalyze}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show daily suggestions
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
          {analysis?.last_updated && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock size={12} />
              Last updated: {new Date(analysis.last_updated).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          <RefreshCw size={14} className={isAnalyzing ? "animate-spin" : ""} />
          Re-analyze
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

      {/* Daily Suggestions Checklist */}
      {analysis?.daily_suggestions && analysis.daily_suggestions.length > 0 && (
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
            {analysis.daily_suggestions.map((suggestion, idx) => {
              const isCompleted = completedTasks.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleTask(idx)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isCompleted
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm leading-relaxed ${
                        isCompleted ? "text-gray-500 line-through" : "text-gray-700"
                      }`}
                    >
                      {suggestion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analysis?.daily_suggestions || analysis.daily_suggestions.length === 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No daily suggestions available yet.</p>
          <p className="text-sm text-gray-500 mt-2">Run a business analysis to get personalized action items.</p>
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
