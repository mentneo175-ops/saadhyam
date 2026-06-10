import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Copy, RefreshCcw, ThumbsUp, ThumbsDown, Clock, MessageSquare, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/review-reply")({
  head: () => ({ meta: [{ title: "Review Reply AI — Saadhyam AI" }] }),
  component: ReviewReplyPage,
});

interface HistoryItem {
  id: number;
  review: string;
  reply: string;
  rating: number;
  business_type: string;
  tone: string;
  created_at: string;
}

function ReviewReplyPage() {
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

  const businessTypes = [
    "Restaurant", "Hotel", "E-commerce", "Retail",
    "Service", "Healthcare", "Education", "Other",
  ];
  const tones = ["professional", "friendly", "grateful", "apologetic", "calm"];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${env.apiBaseUrl}/ai/generate-review-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ review_text: reviewText, rating, business_type: businessType, tone }),
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setGeneratedReply(data.reply);
        await fetchHistory();
      } else {
        setError(data.error || "Failed to generate reply");
      }
    } catch (error) {
      setError("Failed to generate reply: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!reviewText.trim()) { setError("Please enter a review"); return; }
    setError("");
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${env.apiBaseUrl}/ai/generate-review-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ review_text: reviewText, rating, business_type: businessType, tone }),
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setGeneratedReply(data.reply);
        await fetchHistory();
      } else {
        setError(data.error || "Failed to regenerate reply");
      }
    } catch (error) {
      setError("Failed to regenerate reply: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGenerating(false);
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-xl shadow-lg shadow-[#8B5CF6]/30">
                <MessageSquare size={18} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Review Reply AI</h1>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">Generate professional replies to Google reviews instantly</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !reviewText.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} /> Quick Reply
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Input Panel */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 space-y-5 dark:bg-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="p-2 bg-[#F3EEFF] rounded-xl">
              <Star size={15} className="text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Review Details</h3>
              <p className="text-xs text-gray-500">Configure the review parameters</p>
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
                    className={star <= rating ? "text-yellow-400" : "text-gray-200"}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500 self-center">{rating}/5 stars</span>
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
                      ? "bg-[#F3EEFF] text-[#8B5CF6] border-[#E9D5FF]"
                      : "border-gray-200 text-gray-600 hover:border-[#8B5CF6]/40 hover:bg-[#F9F7FF]"
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
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-red-500 text-xs font-medium">{error}</span>
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
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 flex flex-col dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F3EEFF] rounded-xl">
                <Sparkles size={15} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">AI Generated Reply</h3>
                <p className="text-xs text-gray-500">Ready to copy & use</p>
              </div>
            </div>
            {generatedReply && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle size={11} /> Ready
              </span>
            )}
          </div>

          <div className="flex-1 rounded-xl bg-gradient-to-br from-[#F8F7FC] to-[#F3F1F9] dark:from-slate-950 dark:to-slate-950/50 border border-gray-200/60 dark:border-slate-800 p-5 mb-5 min-h-64">
            {generatedReply ? (
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line dark:text-slate-300">{generatedReply}</p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <MessageSquare size={22} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Your reply will appear here</p>
                <p className="text-xs text-gray-400">Fill in the details and click Generate Reply</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyReply}
              disabled={!generatedReply}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F9F7FF] transition-all disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800"
            >
              {copied ? <><CheckCircle size={14} className="text-emerald-600" /><span className="text-emerald-600">Copied!</span></> : <><Copy size={14} /> Copy Reply</>}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={!generatedReply || isGenerating}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F9F7FF] transition-all disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800"
            >
              <RefreshCcw size={14} className={isGenerating ? "animate-spin" : ""} /> Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Recent Replies History */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 mb-6 dark:bg-slate-900">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5 dark:border-slate-800">
          <div className="p-2 bg-[#F3EEFF] rounded-xl">
            <Clock size={15} className="text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Recent Replies {history.length > 0 ? `(${history.length})` : ""}</h3>
            <p className="text-xs text-gray-500">Click to reload a previous reply</p>
          </div>
        </div>
        {isLoadingHistory ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Loader2 size={16} className="animate-spin" /> Loading saved replies...
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200/60 p-4 hover:border-[#8B5CF6]/30 hover:bg-[#F9F7FF] transition-all cursor-pointer group"
                onClick={() => loadFromHistory(item)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#8B5CF6] bg-[#F3EEFF] px-2 py-0.5 rounded-full">{item.business_type}</span>
                      <span className="text-xs text-gray-500">{item.tone}</span>
                      <span className="text-xs text-yellow-500">{"★".repeat(item.rating)}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 dark:text-slate-300">{item.review}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleCopyHistoryReply(item.reply, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white rounded-lg"
                      title="Copy reply"
                    >
                      <Copy size={14} className="text-gray-400 hover:text-[#8B5CF6]" />
                    </button>
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 italic">Reply: {item.reply}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3 dark:bg-slate-900">
              <MessageSquare size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No saved replies yet</p>
            <p className="text-xs text-gray-400 mt-1">Generate one and it will appear here.</p>
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 dark:bg-slate-900">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5 dark:border-slate-800">
          <div className="p-2 bg-[#F3EEFF] rounded-xl">
            <Sparkles size={15} className="text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">Quick Reply Templates</h3>
            <p className="text-xs text-gray-500">Example responses for common scenarios</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp size={14} className="text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700">Positive Review (4–5 stars)</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Thank you for the wonderful feedback! We're delighted to have served you and hope to see you again soon.
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown size={14} className="text-red-500" />
              <p className="text-xs font-semibold text-red-700">Negative Review (1–3 stars)</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              We sincerely apologize for your experience. Please contact us directly so we can make it right for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
