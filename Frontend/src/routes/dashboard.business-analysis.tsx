import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  Map,
  CheckCircle2,
  RefreshCw,
  Clock,
  Building2,
  MapPin,
  Briefcase,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getBusinessAnalysisData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type BusinessAnalysisData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";

export const Route = createFileRoute("/dashboard/business-analysis")({
  head: () => ({ meta: [{ title: "Business Analysis — Saadhyam AI" }] }),
  component: BusinessAnalysisPage,
});

function BusinessAnalysisPage() {
  const [analysis, setAnalysis] = useState<BusinessAnalysisData | null>(null);
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
        const data = await getBusinessAnalysisData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        // If analyzing, start polling
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            // Analysis completed, load data
            const data = await getBusinessAnalysisData(token);
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
      setError(err.message || "Failed to load business analysis");
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
      const data = await getBusinessAnalysisData(token);
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
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
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
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-purple-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Analyzing your business...</p>
          <p className="text-sm text-gray-600 mt-2">This may take 2-3 minutes</p>
          <p className="text-xs text-gray-500 mt-1">Using Google AI Studio Gemini with Search Grounding</p>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-blue-900 text-center">
              💡 We're making ONE comprehensive API call to gather all your business insights.
              After this, all pages will load instantly with no rate limits!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not started state
  if (!analysis && status?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Analyze Your Business?</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Get comprehensive AI-powered insights including strengths, weaknesses, opportunities, and local market analysis.
          </p>
          <Button variant="hero" size="lg" onClick={handleAnalyze}>
            <Sparkles size={20} />
            Analyze My Business
          </Button>
          <p className="text-xs text-gray-500 mt-4">Takes 2-3 minutes • Powered by Google AI Studio Gemini</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
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

  // Success state - show ONLY Business Analysis data
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Analysis</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Sparkles size={14} className="text-purple-600" />
            AI-powered insights from Google Search grounding
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

      {/* Business Details Card */}
      {analysis?.business_details && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                <Building2 size={24} className="text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{analysis.business_details.business_name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-700">
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {analysis.business_details.business_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {analysis.business_details.location}
                  </span>
                </div>
              </div>
            </div>
            {analysis.health_score !== undefined && (
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-700">{analysis.health_score}</div>
                <div className="text-xs text-gray-600">Health Score</div>
              </div>
            )}
          </div>
          {analysis.business_details.services && analysis.business_details.services.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Services</p>
              <div className="flex flex-wrap gap-2">
                {analysis.business_details.services.map((service, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.business_details.summary && (
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.business_details.summary}</p>
          )}
        </div>
      )}

      {/* Strengths */}
      {analysis?.strengths && analysis.strengths.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {analysis?.weaknesses && analysis.weaknesses.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold">Weaknesses</h3>
          </div>
          <ul className="space-y-3">
            {analysis.weaknesses.map((weakness, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Growth Opportunities */}
      {analysis?.growth_opportunities && analysis.growth_opportunities.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Growth Opportunities</h3>
          </div>
          <ul className="space-y-3">
            {analysis.growth_opportunities.map((opportunity, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Local Market Insights */}
      {analysis?.local_market_insights && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Map size={20} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Local Market Insights</h3>
          </div>
          <div className="space-y-4">
            {analysis.local_market_insights.local_demand && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Local Demand</h4>
                <p className="text-sm text-gray-700">{analysis.local_market_insights.local_demand}</p>
              </div>
            )}
            {analysis.local_market_insights.customer_behavior && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Customer Behavior</h4>
                <p className="text-sm text-gray-700">{analysis.local_market_insights.customer_behavior}</p>
              </div>
            )}
            {analysis.local_market_insights.competition_level && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Competition Level</h4>
                <p className="text-sm text-gray-700">{analysis.local_market_insights.competition_level}</p>
              </div>
            )}
            {analysis.local_market_insights.trending_services && analysis.local_market_insights.trending_services.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Trending Services</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.local_market_insights.trending_services.map((service, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
