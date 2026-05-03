import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Map, Search, TrendingUp, Target, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/seo")({
  head: () => ({ meta: [{ title: "SEO & Google Maps — Saadhyam AI" }] }),
  component: SEOPage,
});

function SEOPage() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [postIdeas, setPostIdeas] = useState<Array<{ title: string; desc: string }>>([]);

  const handleOptimize = async () => {
    if (!businessType.trim() || !location.trim()) {
      toast.error("Please enter business type and location");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.getSEOKeywords(businessType, location);

      if (response.success) {
        setKeywords(response.keywords);
        setTips(response.tips);
        setPostIdeas(response.post_ideas);
        toast.success("SEO insights generated!");
      } else {
        toast.error("Failed to generate SEO insights");
      }
    } catch (error: any) {
      console.error("SEO generation error:", error);
      toast.error(error.message || "Failed to generate SEO insights");

      // Fallback mock data
      setKeywords([
        `best ${businessType} ${location}`,
        `${businessType} near me`,
        `top ${businessType} ${location}`,
        `affordable ${businessType}`,
        `${businessType} services`,
      ]);
      setTips([
        "Complete your Google Business Profile 100%",
        "Get at least 50+ positive reviews",
        "Post weekly updates with photos",
        "Respond to all reviews within 24 hours",
      ]);
      setPostIdeas([
        { title: "Special Offer", desc: "30% off this week" },
        { title: "New Service", desc: "Introducing new services" },
        { title: "Customer Success", desc: "See our latest transformations" },
        { title: "Health Tip", desc: "Expert tips for you" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="SEO & Google Maps AI"
        subtitle="Improve your local search ranking and visibility"
      />

      {/* Input Form */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Business Type</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="E.g., Dental Clinic, Salon, Restaurant"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="E.g., Hyderabad, Banjara Hills"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
            />
          </div>
        </div>
        <Button variant="hero" className="w-full" onClick={handleOptimize} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Optimize Now
            </>
          )}
        </Button>
      </div>

      {/* Maps Ranking Tips */}
      {tips.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Map size={16} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold">Google Maps Ranking Tips</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Target size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Search size={16} className="text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold">Recommended Keywords</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post Ideas */}
      {postIdeas.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold">Google Posts Ideas</h3>
          </div>
          <div className="space-y-3">
            {postIdeas.map((post, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-1">{post.title}</p>
                <p className="text-xs text-gray-600">{post.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
