import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Eye,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  Loader2,
  Sparkles,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSEOGoogleMapsData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type SEOGoogleMapsData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/seo-google-maps")({
  head: () => ({ meta: [{ title: "SEO & Google Maps — Saadhyam AI" }] }),
  component: SEOGoogleMapsPage,
});

function SEOGoogleMapsPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SEOGoogleMapsData | null>(null);
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
        const data = await getSEOGoogleMapsData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        // If analyzing, start polling
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            // Analysis completed, load data
            const data = await getSEOGoogleMapsData(token);
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
      setError(err.message || "Failed to load SEO & Google Maps data");
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
      const data = await getSEOGoogleMapsData(token);
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
          title="SEO & Google Maps"
          subtitle="Boost your local visibility"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-teal-600 mb-4" />
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
          title="SEO & Google Maps"
          subtitle="Boost your local visibility"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-teal-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Analyzing SEO opportunities...</p>
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
          title="SEO & Google Maps"
          subtitle="Boost your local visibility"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center mb-6">
            <Search size={40} className="text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analysis Found</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            You need to run a business analysis first to see SEO recommendations.
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
          title="SEO & Google Maps"
          subtitle="Boost your local visibility"
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

  // Success state - show SEO & Google Maps data
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO & Google Maps</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Search size={14} className="text-teal-600" />
            Boost your local visibility and rankings
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

      {/* Keywords */}
      {analysis?.seo_google_maps_tips?.keywords && 
       analysis.seo_google_maps_tips.keywords.length > 0 && (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-teal-200 flex items-center justify-center">
              <Search size={20} className="text-teal-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Target Keywords</h3>
              <p className="text-xs text-gray-600">Optimize your content for these search terms</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.seo_google_maps_tips.keywords.map((keyword, idx) => (
              <div key={idx} className="group relative">
                <span className="px-4 py-2 bg-white border-2 border-teal-300 text-teal-700 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:bg-teal-100 transition-colors cursor-pointer">
                  <Search size={14} />
                  {keyword}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking Tips */}
      {analysis?.seo_google_maps_tips?.ranking_tips && 
       analysis.seo_google_maps_tips.ranking_tips.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Google Maps Ranking Tips</h3>
              <p className="text-xs text-gray-600">Improve your local search rankings</p>
            </div>
          </div>
          <div className="space-y-3">
            {analysis.seo_google_maps_tips.ranking_tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="h-6 w-6 rounded-full bg-yellow-200 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={14} className="text-yellow-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Visibility Ideas */}
      {analysis?.seo_google_maps_tips?.local_visibility_ideas && 
       analysis.seo_google_maps_tips.local_visibility_ideas.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Local Visibility Ideas</h3>
              <p className="text-xs text-gray-600">Strategies to increase your local presence</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.seo_google_maps_tips.local_visibility_ideas.map((idea, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-purple-700" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{idea}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!analysis?.seo_google_maps_tips?.keywords || 
        analysis.seo_google_maps_tips.keywords.length === 0) &&
       (!analysis?.seo_google_maps_tips?.ranking_tips || 
        analysis.seo_google_maps_tips.ranking_tips.length === 0) &&
       (!analysis?.seo_google_maps_tips?.local_visibility_ideas || 
        analysis.seo_google_maps_tips.local_visibility_ideas.length === 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No SEO data available yet.</p>
          <p className="text-sm text-gray-500 mt-2">Run a business analysis to get SEO recommendations.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-5">
          <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center mb-3">
            <MapPin size={24} className="text-blue-700" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Google My Business</h4>
          <p className="text-sm text-gray-600 mb-3">Claim and optimize your business profile</p>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
              Open GMB
            </a>
          </Button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
          <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center mb-3">
            <Search size={24} className="text-green-700" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Search Console</h4>
          <p className="text-sm text-gray-600 mb-3">Monitor your search performance</p>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
              Open Console
            </a>
          </Button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5">
          <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center mb-3">
            <TrendingUp size={24} className="text-purple-700" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
          <p className="text-sm text-gray-600 mb-3">Track your website traffic</p>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
              Open Analytics
            </a>
          </Button>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl border border-teal-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-teal-200 flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-teal-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Pro Tips for Local SEO</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <span>Encourage customers to leave Google reviews regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <span>Keep your business hours and contact information up to date</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <span>Post regular updates and photos to your Google Business Profile</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <span>Respond to all reviews (positive and negative) within 24 hours</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
