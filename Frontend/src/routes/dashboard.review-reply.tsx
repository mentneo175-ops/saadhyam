import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Copy, RefreshCcw, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

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

  const businessTypes = [
    "Restaurant",
    "Hotel",
    "E-commerce",
    "Retail",
    "Service",
    "Healthcare",
    "Education",
    "Other",
  ];
  const tones = ["professional", "friendly", "grateful", "apologetic", "calm"];

  // Fetch history on component mount
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
        "http://localhost:8000/ai/review-reply-history?limit=3",
        "http://localhost:8000/api/review-reply/history?limit=3",
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, { method: "GET", headers });

        if (response.status === 404) {
          continue;
        }

        const data = await response.json();
        console.log("History response:", data);

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
    if (!reviewText.trim()) {
      setError("Please enter a review");
      return;
    }

    setError("");
    setIsGenerating(true);
    try {
      console.log("Sending request to backend...");
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/ai/generate-review-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          review_text: reviewText,
          rating,
          business_type: businessType,
          tone,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success && data.reply) {
        setGeneratedReply(data.reply);
        // Refresh history after successful generation
        await fetchHistory();
      } else {
        setError(data.error || "Failed to generate reply");
      }
    } catch (error) {
      console.error("Generation error:", error);
      setError(
        "Failed to generate reply: " + (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!reviewText.trim()) {
      setError("Please enter a review");
      return;
    }

    setError("");
    setIsGenerating(true);
    try {
      console.log("Sending regenerate request to backend...");
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/ai/generate-review-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          review_text: reviewText,
          rating,
          business_type: businessType,
          tone,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success && data.reply) {
        setGeneratedReply(data.reply);
        // Refresh history after successful generation
        await fetchHistory();
      } else {
        setError(data.error || "Failed to regenerate reply");
      }
    } catch (error) {
      console.error("Regeneration error:", error);
      setError(
        "Failed to regenerate reply: " + (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setReviewText(item.review);
    setRating(item.rating);
    setBusinessType(item.business_type);
    setTone(item.tone);
    setGeneratedReply(item.reply);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Review Reply AI"
        subtitle="Generate professional replies to Google reviews instantly"
        actions={
          <Button variant="hero" size="sm">
            <Sparkles size={14} /> Quick Reply
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Review Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
                >
                  <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            >
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Reply Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            >
              {tones.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Customer Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={6}
              placeholder="Paste the customer's review here..."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            variant="hero"
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !reviewText.trim()}
          >
            {isGenerating ? (
              <>
                <RefreshCcw size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Reply
              </>
            )}
          </Button>
        </div>

        {/* Output Panel */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">AI Generated Reply</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-success/10 text-success">
              <Sparkles size={10} /> Ready
            </span>
          </div>

          <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 mb-4 min-h-64">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {generatedReply || "Click 'Generate Reply' to create a professional response"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!generatedReply}
              onClick={() => navigator.clipboard?.writeText(generatedReply)}
            >
              <Copy size={13} /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={!generatedReply || isGenerating}
              onClick={handleRegenerate}
            >
              <RefreshCcw size={13} className={isGenerating ? "animate-spin" : ""} /> Regenerate
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Replies History */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} /> Recent Replies {history.length > 0 ? `(${history.length})` : ""}
        </h3>
        {isLoadingHistory ? (
          <div className="rounded-lg border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
            Loading saved replies...
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/40 p-3 hover:bg-accent/20 transition cursor-pointer"
                onClick={() => loadFromHistory(item)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {item.business_type} • {item.tone} • ⭐ {item.rating}/5
                    </p>
                    <p className="text-sm line-clamp-2 text-foreground">{item.review}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 italic">
                  Reply: {item.reply}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
            No saved replies yet. Generate one and it will appear here.
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Reply Templates</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp size={14} className="text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700">Positive Review (4-5 stars)</p>
            </div>
            <p className="text-xs text-gray-700">
              Thank you for the wonderful feedback! We're delighted to have served you...
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown size={14} className="text-red-600" />
              <p className="text-xs font-semibold text-red-700">Negative Review (1-3 stars)</p>
            </div>
            <p className="text-xs text-gray-700">
              We apologize for your experience. Please contact us so we can make it right...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
