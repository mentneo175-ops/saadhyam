import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Clock,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getCompetitorAnalysisData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type CompetitorAnalysisData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/competitor-analysis")({
  head: () => ({ meta: [{ title: "Competitor Analysis — Saadhyam AI" }] }),
  component: CompetitorAnalysisPage,
});

function CompetitorAnalysisPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<CompetitorAnalysisData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
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
        const data = await getCompetitorAnalysisData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        // If analyzing, start polling
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            // Analysis completed, load data
            const data = await getCompetitorAnalysisData(token);
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
      setError(err.message || "Failed to load competitor analysis");
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
      const data = await getCompetitorAnalysisData(token);
      setAnalysis(data);
    } catch (err: any) {
      console.error("Error analyzing:", err);
      setError(err.message || "Failed to analyze business");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Competitor Analysis"
          subtitle="Understand your competitive landscape"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-orange-600 mb-4" />
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
          title="Competitor Analysis"
          subtitle="Understand your competitive landscape"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-orange-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Analyzing competitors...</p>
          <p className="text-sm text-gray-600 mt-2">This may take 2-3 minutes</p>
          {/* <p className="text-xs text-gray-500 mt-1">Using Google AI Studio Gemini with Search Grounding</p> */}
        </div>
      </div>
    );
  }

  // Not started state
  if (!analysis && status?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Competitor Analysis"
          subtitle="Understand your competitive landscape"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center mb-6">
            <Users size={40} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analysis Found</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            You need to run a business analysis first to see competitor insights.
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
          title="Competitor Analysis"
          subtitle="Understand your competitive landscape"
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

  // Success state - show competitor analysis data
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Users size={14} className="text-orange-600" />
            Understand your competitive landscape
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

      {/* Nearby Competitors */}
      {analysis?.competitor_analysis?.nearby_competitors && 
       analysis.competitor_analysis.nearby_competitors.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-200 flex items-center justify-center">
              <Users size={20} className="text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nearby Competitors</h3>
              <p className="text-xs text-gray-600">Real businesses competing in your area</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysis.competitor_analysis.nearby_competitors.map((competitor, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-700">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{competitor.name}</h4>
                    <p className="text-xs text-gray-600 truncate">{competitor.location}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {competitor.type}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Strengths:</p>
                    <p className="text-xs text-gray-700">{competitor.strengths}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                    <p className="text-xs font-semibold text-orange-700 mb-1">Weaknesses:</p>
                    <p className="text-xs text-gray-700">{competitor.weaknesses}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Patterns */}
      {analysis?.competitor_analysis?.competitor_patterns && 
       analysis.competitor_analysis.competitor_patterns.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Competitor Patterns</h3>
              <p className="text-xs text-gray-600">What your competitors are doing</p>
            </div>
          </div>
          <ul className="space-y-3">
            {analysis.competitor_analysis.competitor_patterns.map((pattern, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="h-6 w-6 rounded-full bg-orange-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-700">{idx + 1}</span>
                </div>
                <span className="text-sm text-gray-700">{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Market Gaps */}
      {analysis?.competitor_analysis?.market_gaps && 
       analysis.competitor_analysis.market_gaps.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Target size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Market Gaps</h3>
              <p className="text-xs text-gray-600">Opportunities your competitors are missing</p>
            </div>
          </div>
          <ul className="space-y-3">
            {analysis.competitor_analysis.market_gaps.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Differentiation Ideas */}
      {analysis?.competitor_analysis?.differentiation_ideas && 
       analysis.competitor_analysis.differentiation_ideas.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-200 flex items-center justify-center">
              <Lightbulb size={20} className="text-purple-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Differentiation Ideas</h3>
              <p className="text-xs text-gray-600">How to stand out from the competition</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.competitor_analysis.differentiation_ideas.map((idea, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Lightbulb size={16} className="text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{idea}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analysis?.competitor_analysis?.competitor_patterns || 
        analysis.competitor_analysis.competitor_patterns.length === 0) &&
       (!analysis?.competitor_analysis?.market_gaps || 
        analysis.competitor_analysis.market_gaps.length === 0) &&
       (!analysis?.competitor_analysis?.differentiation_ideas || 
        analysis.competitor_analysis.differentiation_ideas.length === 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No competitor analysis data available yet.</p>
          <p className="text-sm text-gray-500 mt-2">Run a business analysis to get competitor insights.</p>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl border border-orange-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
            <Lightbulb size={24} className="text-orange-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Ready to Differentiate?</h3>
            <p className="text-sm text-gray-700 mb-4">
              Use these insights to create a unique value proposition that sets you apart from competitors.
            </p>
            <Button variant="hero" size="sm" onClick={() => navigate({ to: "/dashboard/business-analysis" })}>
              View Full Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
