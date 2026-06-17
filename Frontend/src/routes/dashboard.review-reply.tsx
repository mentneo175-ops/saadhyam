import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Star, 
  Copy, 
  RefreshCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  MessageSquare, 
  Loader2, 
  CheckCircle, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  PieChart 
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/review-reply")({
  component: ReviewReplyPage,
});

interface HistoryItem {
  id: string;
  review: string;
  rating: number;
  business_type: string;
  tone: string;
  reply: string;
  created_at: string;
}

interface ActionableSuggestion {
  suggestion: string;
  category: string;
  priority: string;
  frequency_percentage: number;
}

interface SentimentBreakdown {
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
}

interface CategoryBreakdown {
  category_name: string;
  mention_count: number;
}

interface MapsUrlAnalysis {
  average_rating: number;
  total_reviews_count: number;
  sentiment_summary: string;
  sentiment_breakdown: SentimentBreakdown;
  category_breakdown: CategoryBreakdown[];
  actionable_suggestions: ActionableSuggestion[];
}

interface AnalyzedReview {
  reviewer_name: string;
  rating: number;
  comment: string;
  reply: string;
}

interface MapsAnalysisResult {
  success: boolean;
  business_name: string;
  resolved_url: string;
  reviews: AnalyzedReview[];
  analysis: MapsUrlAnalysis;
}

const getErrorMessage = (err: any): string => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (Array.isArray(err)) {
    return err.map(e => {
      if (typeof e === 'object' && e !== null) {
        return e.msg || JSON.stringify(e);
      }
      return String(e);
    }).join(", ");
  }
  if (typeof err === "object") {
    if (err.detail) return getErrorMessage(err.detail);
    if (err.message) return err.message;
    if (err.error) return err.error;
    return JSON.stringify(err);
  }
  return String(err);
};

function ReviewReplyPage() {
  const [activeTab, setActiveTab] = useState<"manual" | "maps">("manual");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [businessType, setBusinessType] = useState("Restaurant");
  const [tone, setTone] = useState("professional");
  const [generatedReply, setGeneratedReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [copied, setCopied] = useState(false);

  // Maps tab states
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsTone, setMapsTone] = useState("professional");
  const [isAnalyzingMaps, setIsAnalyzingMaps] = useState(false);
  const [mapsAnalysisResult, setMapsAnalysisResult] = useState<MapsAnalysisResult | null>(null);
  const [mapsError, setMapsError] = useState("");
  const [copiedReviewReplies, setCopiedReviewReplies] = useState<{ [key: number]: boolean }>({});

  // Auto-responder states
  const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState(false);
  const [autoReplyTone, setAutoReplyTone] = useState("professional");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const businessTypes = [
    "Restaurant", "Hotel", "E-commerce", "Retail",
    "Service", "Healthcare", "Education", "Other",
  ];
  const tones = ["professional", "friendly", "grateful", "apologetic", "calm"];

  useEffect(() => {
    fetchHistory();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = apiClient.getToken();
      const response = await fetch(`${env.apiBaseUrl}/api/review-reply/settings`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsAutoReplyEnabled(data.enabled);
        setAutoReplyTone(data.tone);
        if (data.url && !mapsUrl) {
          setMapsUrl(data.url);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleSaveSettings = async (enabled: boolean, tone: string) => {
    setIsSavingSettings(true);
    try {
      const token = apiClient.getToken();
      const response = await fetch(`${env.apiBaseUrl}/api/review-reply/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          enabled,
          tone,
          url: mapsUrl
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setIsAutoReplyEnabled(data.enabled);
        setAutoReplyTone(data.tone);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = apiClient.getToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      const endpoints = [
        `${env.apiBaseUrl}/ai/review-reply-history?limit=3`,
        `${env.apiBaseUrl}/api/review-reply/history?limit=3`,
      ];
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, { method: "GET", headers });
        if (response.status === 404 || response.status === 422) continue;
        if (!response.ok) continue;
        const data = await response.json();
        const historyItems = Array.isArray(data) ? data : data.history;
        if (historyItems) {
          setHistory(historyItems.slice(0, 3));
          return;
        }
      }
      setHistory([]);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!reviewText.trim()) { setError("Please enter a review"); return; }
    setError("");
    setIsGenerating(true);
    try {
      const token = apiClient.getToken();
      const response = await fetch(`${env.apiBaseUrl}/ai/generate-review-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ review_text: reviewText, rating, business_type: businessType, tone }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.reply) {
        setGeneratedReply(data.reply);
        await fetchHistory();
      } else {
        setError(getErrorMessage(data.detail || data.error || data || "Failed to generate reply"));
      }
    } catch (error) {
      setError("Failed to generate reply: " + getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!reviewText.trim()) { setError("Please enter a review"); return; }
    setError("");
    setIsGenerating(true);
    try {
      const token = apiClient.getToken();
      const response = await fetch(`${env.apiBaseUrl}/ai/generate-review-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ review_text: reviewText, rating, business_type: businessType, tone }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.reply) {
        setGeneratedReply(data.reply);
        await fetchHistory();
      } else {
        setError(getErrorMessage(data.detail || data.error || data || "Failed to regenerate reply"));
      }
    } catch (error) {
      setError("Failed to regenerate reply: " + getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeMaps = async () => {
    if (!mapsUrl.trim()) { setMapsError("Please enter a Google Maps link"); return; }
    setMapsError("");
    setIsAnalyzingMaps(true);
    setMapsAnalysisResult(null);
    try {
      const token = apiClient.getToken();
      const response = await fetch(`${env.apiBaseUrl}/api/review-reply/analyze-maps-url`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(token && { Authorization: `Bearer ${token}` }) 
        },
        body: JSON.stringify({ url: mapsUrl, tone: mapsTone }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMapsAnalysisResult(data);
        await fetchHistory();
      } else {
        setMapsError(getErrorMessage(data.detail || data.error || data || "Failed to analyze Google Maps URL"));
      }
    } catch (error) {
      setMapsError("Failed to analyze URL: " + getErrorMessage(error));
    } finally {
      setIsAnalyzingMaps(false);
    }
  };

  const handleCopyReviewReply = async (reply: string, index: number) => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopiedReviewReplies(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedReviewReplies(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dateString; }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setReviewText(item.review);
    setRating(item.rating);
    setBusinessType(item.business_type);
    setTone(item.tone);
    setGeneratedReply(item.reply);
  };

  const handleCopyReply = async () => {
    if (!generatedReply) return;
    try {
      await navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = generatedReply;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(textArea);
    }
  };

  const handleCopyHistoryReply = async (reply: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try { await navigator.clipboard.writeText(reply); } catch {}
  };

  return (
    <div className="min-h-full bg-white p-4 md:p-6 lg:p-8 dark:bg-slate-900">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-xl shadow-lg shadow-[#8B5CF6]/30">
                <MessageSquare size={18} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Review Reply AI</h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px] dark:text-slate-400">Generate professional replies to Google reviews instantly</p>
          </div>
          {activeTab === "manual" && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !reviewText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={14} /> Quick Reply
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("manual")}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "manual"
              ? "border-[#8B5CF6] text-[#8B5CF6]"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          ✍️ Manual Review Reply
        </button>
        <button
          onClick={() => setActiveTab("maps")}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "maps"
              ? "border-[#8B5CF6] text-[#8B5CF6]"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          🗺️ Analyze Google Maps Reviews
        </button>
      </div>

      {activeTab === "manual" ? (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Input Panel */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 space-y-5 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2 bg-[#F3EEFF] rounded-xl dark:bg-purple-950/30">
                <Star size={15} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Review Details</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Configure the review parameters</p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2.5 block dark:text-slate-300">Review Rating</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={star <= rating ? "text-yellow-400" : "text-gray-200 dark:text-slate-700"}
                      fill={star <= rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 self-center dark:text-slate-400">{rating}/5 stars</span>
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2.5 block dark:text-slate-300">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {businessTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2.5 block dark:text-slate-300">Reply Tone</label>
              <div className="flex gap-2 flex-wrap">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      tone === t
                        ? "bg-[#F3EEFF] text-[#8B5CF6] border-[#E9D5FF] dark:bg-purple-950/45 dark:border-purple-800 dark:text-purple-300"
                        : "border-gray-200 text-gray-600 hover:border-[#8B5CF6]/40 hover:bg-[#F9F7FF] dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-300"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2.5 block dark:text-slate-300">Customer Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
                placeholder="Paste the customer's review here..."
                className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 text-sm text-gray-700 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none resize-none transition-all placeholder:text-gray-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30">
                <span className="text-red-500 text-xs font-medium dark:text-red-400">{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !reviewText.trim()}
              className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate Reply</>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F3EEFF] rounded-xl dark:bg-purple-950/30">
                  <Sparkles size={15} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">AI Generated Reply</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Ready to copy & use</p>
                </div>
              </div>
              {generatedReply && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                  <CheckCircle size={11} /> Ready
                </span>
              )}
            </div>

            <div className="flex-1 rounded-xl bg-gradient-to-br from-[#F8F7FC] to-[#F3F1F9] border border-gray-200/60 p-5 mb-5 min-h-64 dark:bg-none dark:bg-slate-950 dark:border-slate-800">
              {generatedReply ? (
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line dark:text-slate-300">{generatedReply}</p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <MessageSquare size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium dark:text-slate-500">Your reply will appear here</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Fill in the details and click Generate Reply</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyReply}
                disabled={!generatedReply}
                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F9F7FF] transition-all disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950/40"
              >
                {copied ? <><CheckCircle size={14} className="text-emerald-600" /><span className="text-emerald-600">Copied!</span></> : <><Copy size={14} /> Copy Reply</>}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={!generatedReply || isGenerating}
                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F9F7FF] transition-all disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950/40"
              >
                <RefreshCcw size={14} className={isGenerating ? "animate-spin" : ""} /> Regenerate
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
          {/* Maps URL Input Panel */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 space-y-5 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="p-2 bg-[#F3EEFF] rounded-xl dark:bg-purple-950/30">
                <MapPin size={15} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Google Maps Reviews Link</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Provide the URL to study customer reviews & generate reply suggestions</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block dark:text-slate-300">Google Maps Reviews URL</label>
                <input
                  type="text"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="Paste link (e.g., https://maps.app.goo.gl/... or https://google.com/maps/...)"
                  className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all placeholder:text-gray-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block dark:text-slate-300">Reply Tone</label>
                <select
                  value={mapsTone}
                  onChange={(e) => setMapsTone(e.target.value)}
                  className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Google Maps Reviews Auto-Responder Toggle Switch */}
            <div className="border-t border-gray-100 pt-5 mt-2 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-purple-50/45 dark:bg-purple-950/20 rounded-2xl border border-purple-100/50 dark:border-purple-900/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-xl mt-0.5">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      🤖 Google Maps Auto-Responder
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-[#8B5CF6] dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-full uppercase">Beta</span>
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automatically response to all new incoming reviews in the background using AI</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Tone:</span>
                    <select
                      value={autoReplyTone}
                      onChange={(e) => {
                        const newTone = e.target.value;
                        setAutoReplyTone(newTone);
                        handleSaveSettings(isAutoReplyEnabled, newTone);
                      }}
                      className="h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 text-xs text-gray-700 dark:text-gray-300 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/20 outline-none transition-all cursor-pointer"
                    >
                      {tones.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoReplyEnabled}
                      disabled={isSavingSettings}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsAutoReplyEnabled(checked);
                        handleSaveSettings(checked, autoReplyTone);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                    <span className="ml-2.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                      {isAutoReplyEnabled ? "Active" : "Disabled"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {mapsError && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30">
                <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0 dark:text-red-400" />
                <span className="text-red-600 text-xs font-medium dark:text-red-400">{mapsError}</span>
              </div>
            )}

            <button
              onClick={handleAnalyzeMaps}
              disabled={isAnalyzingMaps || !mapsUrl.trim()}
              className="w-full h-12 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzingMaps ? (
                <><Loader2 size={16} className="animate-spin" /> Fetching & Analyzing Real Reviews...</>
              ) : (
                <><Sparkles size={16} /> Fetch, Analyze & Generate Replies</>
              )}
            </button>
          </div>

          {/* Maps Analytics Dashboard Results */}
          {mapsAnalysisResult && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-[#F3EEFF]/40 rounded-2xl border border-[#E9D5FF]/60 dark:bg-purple-950/15 dark:border-purple-900/30">
                <div className="p-2 bg-[#8B5CF6] text-white rounded-xl shadow-md">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{mapsAnalysisResult.business_name}</h2>
                  <p className="text-xs text-[#8B5CF6] font-medium dark:text-purple-300">Google Maps Reviews & AI Reply Analysis Dashboard</p>
                </div>
              </div>

              {/* Grid of Analytics Widgets */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Rating Summary */}
                <div className="bg-white rounded-2xl border border-gray-200/60 p-5 space-y-3 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">Rating Summary</span>
                    <Star size={18} className="text-yellow-400" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100">
                      {mapsAnalysisResult.analysis.average_rating}
                    </h3>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={13} 
                          className={s <= Math.round(mapsAnalysisResult.analysis.average_rating) ? "text-yellow-400" : "text-gray-200 dark:text-slate-800"}
                          fill={s <= Math.round(mapsAnalysisResult.analysis.average_rating) ? "currentColor" : "none"}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1 dark:text-slate-500">({mapsAnalysisResult.analysis.total_reviews_count} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Sentiment Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200/60 p-5 space-y-3 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-slate-400">Sentiment Breakdown</span>
                    <PieChart size={18} className="text-[#8B5CF6]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">Pos: {mapsAnalysisResult.analysis.sentiment_breakdown.positive_percentage}%</span>
                      <span className="text-amber-500 dark:text-amber-400">Neu: {mapsAnalysisResult.analysis.sentiment_breakdown.neutral_percentage}%</span>
                      <span className="text-red-500 dark:text-red-400">Neg: {mapsAnalysisResult.analysis.sentiment_breakdown.negative_percentage}%</span>
                    </div>
                    {/* Multi-segmented Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-slate-950 flex overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all" 
                        style={{ width: `${mapsAnalysisResult.analysis.sentiment_breakdown.positive_percentage}%` }}
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all" 
                        style={{ width: `${mapsAnalysisResult.analysis.sentiment_breakdown.neutral_percentage}%` }}
                      />
                      <div 
                        className="bg-red-500 h-full transition-all" 
                        style={{ width: `${mapsAnalysisResult.analysis.sentiment_breakdown.negative_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Sentiment Summary Text */}
                <div className="bg-white rounded-2xl border border-gray-200/60 p-5 space-y-2 md:col-span-2 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block dark:text-slate-400">AI Sentiment Analysis</span>
                  <p className="text-xs text-gray-600 leading-relaxed italic dark:text-slate-300">
                    "{mapsAnalysisResult.analysis.sentiment_summary}"
                  </p>
                </div>
              </div>

              {/* Lower Section: Suggestions & Category Mentions */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Prioritized Suggestions */}
                <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                    <TrendingUp size={16} className="text-[#8B5CF6]" />
                    <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Actionable Suggestions & Priorities</h3>
                  </div>
                  <div className="space-y-3">
                    {mapsAnalysisResult.analysis.actionable_suggestions.map((s, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex items-start gap-3 justify-between ${
                          s.priority === "High" 
                            ? "bg-red-50/45 border-red-100 dark:bg-red-950/10 dark:border-red-900/30" 
                            : s.priority === "Medium"
                            ? "bg-amber-50/45 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30"
                            : "bg-blue-50/45 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{s.suggestion}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase dark:text-slate-500">{s.category}</span>
                            <span className="text-gray-300 dark:text-slate-700">•</span>
                            <span className="text-[10px] text-gray-500 font-semibold dark:text-slate-400">{s.frequency_percentage}% mention rate</span>
                          </div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          s.priority === "High" 
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100" 
                            : s.priority === "Medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                        }`}>
                          {s.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Mentions Frequency */}
                <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                    <BarChart3 size={16} className="text-[#8B5CF6]" />
                    <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Customer Mention Counts</h3>
                  </div>
                  <div className="space-y-3">
                    {mapsAnalysisResult.analysis.category_breakdown.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300">
                          <span>{cat.category_name}</span>
                          <span>{cat.mention_count} mentions</span>
                        </div>
                        {/* CSS Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-slate-950 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, (cat.mention_count / Math.max(...mapsAnalysisResult.analysis.category_breakdown.map(c => c.mention_count))) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Reviews & Reply Suggestions */}
              <div className="bg-white rounded-2xl border border-gray-200/60 p-6 space-y-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-800">
                  <MessageSquare size={16} className="text-[#8B5CF6]" />
                  <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Generated Customer Replies</h3>
                </div>
                <div className="space-y-4">
                  {mapsAnalysisResult.reviews.map((r, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 space-y-3 hover:border-[#8B5CF6]/25 transition-all dark:border-slate-800 dark:bg-slate-950/20">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{r.reviewer_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-yellow-500">{"★".repeat(r.rating)}</span>
                            <span className="text-gray-300 dark:text-slate-700">•</span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">{r.rating}/5 rating</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 italic dark:text-slate-400">"{r.comment}"</p>
                      
                      <div className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm space-y-2 dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={11} /> Suggested Reply ({mapsTone})
                          </span>
                          <button
                            onClick={() => handleCopyReviewReply(r.reply, idx)}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#8B5CF6] transition-colors dark:text-slate-500 dark:hover:text-purple-400"
                          >
                            {copiedReviewReplies[idx] ? (
                              <><CheckCircle size={12} className="text-emerald-500" /><span className="text-emerald-500 font-semibold text-[10px]">Copied!</span></>
                            ) : (
                              <><Copy size={12} /> <span className="text-[10px]">Copy</span></>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line dark:text-slate-300">{r.reply}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Replies History */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5 dark:border-slate-800">
          <div className="p-2 bg-[#F3EEFF] rounded-xl dark:bg-purple-950/35">
            <Clock size={15} className="text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Recent Replies {history.length > 0 ? `(${history.length})` : ""}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Click to reload a previous reply</p>
          </div>
        </div>
        {isLoadingHistory ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4 dark:text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading saved replies...
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200/60 p-4 hover:border-[#8B5CF6]/30 hover:bg-[#F9F7FF] transition-all cursor-pointer group dark:border-slate-800 dark:hover:bg-slate-950/40"
                onClick={() => loadFromHistory(item)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#8B5CF6] bg-[#F3EEFF] px-2 py-0.5 rounded-full dark:bg-purple-950/45 dark:text-purple-300">{item.business_type}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{item.tone}</span>
                      <span className="text-xs text-yellow-500">{"★".repeat(item.rating)}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 dark:text-slate-300">{item.review}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleCopyHistoryReply(item.reply, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg"
                      title="Copy reply"
                    >
                      <Copy size={14} className="text-gray-400 hover:text-[#8B5CF6]" />
                    </button>
                    <p className="text-xs text-gray-400 whitespace-nowrap dark:text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 italic dark:text-slate-400">Reply: {item.reply}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3 dark:bg-slate-950">
              <MessageSquare size={20} className="text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No saved replies yet</p>
            <p className="text-xs text-gray-400 mt-1 dark:text-slate-500">Generate one and it will appear here.</p>
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5 dark:border-slate-800">
          <div className="p-2 bg-[#F3EEFF] rounded-xl dark:bg-purple-950/35">
            <Sparkles size={15} className="text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Quick Reply Templates</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Example responses for common scenarios</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp size={14} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Positive Review (4–5 stars)</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed dark:text-slate-400">
              Thank you for the wonderful feedback! We're delighted to have served you and hope to see you again soon.
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 dark:bg-red-950/10 dark:border-red-900/30">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown size={14} className="text-red-500 dark:text-red-400" />
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">Negative Review (1–3 stars)</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed dark:text-slate-400">
              We sincerely apologize for your experience. Please contact us directly so we can make it right for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
