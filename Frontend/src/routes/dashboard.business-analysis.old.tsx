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
  Users,
  Eye,
  RefreshCw,
  Clock,
  Building2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getRealtimeBusinessAnalysis, clearAnalysisCache, getCacheAge, type BusinessAnalysisResult } from "@/lib/businessAnalysisGeminiApi";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/business-analysis/old")({
  head: () => ({ meta: [{ title: "Business Analysis AI — Saadhyam AI" }] }),
  component: BusinessAnalysisPage,
});

function BusinessAnalysisPage() {
  const [analysis, setAnalysis] = useState<BusinessAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheAge, setCacheAge] = useState<string | null>(null);

  // Load analysis on mount
  useEffect(() => {
    loadAnalysis();
  }, []);

  // Update cache age
  useEffect(() => {
    const updateCacheAge = () => {
      setCacheAge(getCacheAge());
    };
    updateCacheAge();
    const interval = setInterval(updateCacheAge, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [analysis]);

  const loadAnalysis = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await getRealtimeBusinessAnalysis(forceRefresh);

      if (result.status === "needs_onboarding") {
        setError("Please complete your business profile setup first.");
        setAnalysis(null);
      } else if (result.status === "error") {
        setError(result.message || "Failed to load analysis");
        setAnalysis(null);
      } else {
        setAnalysis(result);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error loading analysis:", err);
      setError(err.message || "Failed to load business analysis");
      setAnalysis(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    clearAnalysisCache();
    loadAnalysis(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis AI"
          subtitle="Real-time AI insights powered by Google Search"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-purple-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Analyzing your business...</p>
          <p className="text-sm text-gray-600 mt-2">Using Google AI Studio Gemini with Search Grounding</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    const isRateLimit = error.includes("rate limit") || error.includes("quota") || error.includes("429");
    
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis AI"
          subtitle="Real-time AI insights powered by Google Search"
        />
        <div className={`${isRateLimit ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6 text-center`}>
          <AlertCircle size={48} className={`mx-auto ${isRateLimit ? 'text-yellow-600' : 'text-red-600'} mb-4`} />
          <p className={`text-lg font-semibold ${isRateLimit ? 'text-yellow-900' : 'text-red-900'} mb-2`}>
            {isRateLimit ? "Rate Limit Reached" : "Analysis Unavailable"}
          </p>
          <p className={`${isRateLimit ? 'text-yellow-700' : 'text-red-700'} mb-4`}>{error}</p>
          {isRateLimit && (
            <p className="text-sm text-yellow-600 mb-4">
              💡 The free tier allows 5 requests per minute. Please wait 60 seconds and try again.
            </p>
          )}
          <Button variant="hero" onClick={() => loadAnalysis(true)}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show full analysis
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Analysis AI</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Sparkles size={14} className="text-purple-600" />
            Real-time insights powered by Google AI Studio Gemini with Search Grounding
          </p>
          {cacheAge && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock size={12} />
              Last updated: {cacheAge}
            </p>
          )}
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Refresh Analysis
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

      {/* Competitor Analysis */}
      {analysis?.competitor_analysis && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users size={20} className="text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold">Competitor Analysis</h3>
          </div>
          <div className="space-y-4">
            {analysis.competitor_analysis.competitor_patterns && analysis.competitor_analysis.competitor_patterns.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Competitor Patterns</h4>
                <ul className="space-y-2">
                  {analysis.competitor_analysis.competitor_patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.competitor_analysis.market_gaps && analysis.competitor_analysis.market_gaps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Market Gaps</h4>
                <ul className="space-y-2">
                  {analysis.competitor_analysis.market_gaps.map((gap, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.competitor_analysis.differentiation_ideas && analysis.competitor_analysis.differentiation_ideas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Differentiation Ideas</h4>
                <ul className="space-y-2">
                  {analysis.competitor_analysis.differentiation_ideas.map((idea, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <Sparkles size={14} className="text-orange-600 shrink-0 mt-1" />
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEO & Google Maps Tips */}
      {analysis?.seo_google_maps_tips && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Eye size={20} className="text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold">SEO & Google Maps Tips</h3>
          </div>
          <div className="space-y-4">
            {analysis.seo_google_maps_tips.keywords && analysis.seo_google_maps_tips.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.seo_google_maps_tips.keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analysis.seo_google_maps_tips.ranking_tips && analysis.seo_google_maps_tips.ranking_tips.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Ranking Tips</h4>
                <ul className="space-y-2">
                  {analysis.seo_google_maps_tips.ranking_tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-1" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.seo_google_maps_tips.local_visibility_ideas && analysis.seo_google_maps_tips.local_visibility_ideas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Local Visibility Ideas</h4>
                <ul className="space-y-2">
                  {analysis.seo_google_maps_tips.local_visibility_ideas.map((idea, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <Sparkles size={14} className="text-teal-600 shrink-0 mt-1" />
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 30-Day Growth Plan */}
      {analysis?.thirty_day_growth_plan && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/60">
          <div className="bg-gradient-to-r from-purple-200 to-pink-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-300 flex items-center justify-center">
                <Map size={24} className="text-purple-800" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">30-Day Growth Plan</h3>
                <p className="text-sm text-gray-700">Your personalized roadmap to success</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {analysis.thirty_day_growth_plan.week_1 && analysis.thirty_day_growth_plan.week_1.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Week 1 · Foundations</h4>
                <ul className="space-y-2">
                  {analysis.thirty_day_growth_plan.week_1.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={14} className="text-purple-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.thirty_day_growth_plan.week_2 && analysis.thirty_day_growth_plan.week_2.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Week 2 · Engagement</h4>
                <ul className="space-y-2">
                  {analysis.thirty_day_growth_plan.week_2.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={14} className="text-purple-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.thirty_day_growth_plan.week_3 && analysis.thirty_day_growth_plan.week_3.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Week 3 · Acceleration</h4>
                <ul className="space-y-2">
                  {analysis.thirty_day_growth_plan.week_3.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={14} className="text-purple-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.thirty_day_growth_plan.week_4 && analysis.thirty_day_growth_plan.week_4.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Week 4 · Optimization</h4>
                <ul className="space-y-2">
                  {analysis.thirty_day_growth_plan.week_4.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={14} className="text-purple-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Suggestions */}
      {analysis?.daily_suggestions && analysis.daily_suggestions.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Sparkles size={20} className="text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold">Daily Suggestions</h3>
          </div>
          <ul className="space-y-3">
            {analysis.daily_suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Sparkles size={18} className="text-pink-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Source Attribution */}
      {analysis?.source && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Powered by {analysis.source.replace(/_/g, " ")}
          </p>
        </div>
      )}
    </div>
  );
}
