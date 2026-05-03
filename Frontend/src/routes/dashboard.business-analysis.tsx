import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle, Target, Map, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/business-analysis")({
  head: () => ({ meta: [{ title: "Business Analysis AI — Saadhyam AI" }] }),
  component: BusinessAnalysisPage,
});

const growthWeeks = [
  {
    week: "Week 1 · Foundations",
    progress: 100,
    items: [
      { t: "Connect Instagram & WhatsApp accounts", done: true },
      { t: "Import customer list", done: true },
      { t: "Set brand voice and target audience", done: true },
    ],
  },
  {
    week: "Week 2 · Engagement",
    progress: 75,
    items: [
      { t: "Launch WhatsApp re-engagement campaign", done: true },
      { t: "Run first AI-suggested offer", done: true },
      { t: "A/B test 3 ad creatives", done: false },
    ],
  },
  {
    week: "Week 3 · Acceleration",
    progress: 25,
    items: [
      { t: "Scale top-performing ad by 2×", done: true },
      { t: "Build 14-day email nurture sequence", done: false },
      { t: "Launch loyalty program", done: false },
    ],
  },
];

function BusinessAnalysisPage() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await apiClient.analyzeBusinessAsync(businessType, location);
      if (response.success) {
        setShowResults(true);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      // Still show results for demo
      setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalDone = growthWeeks.reduce((s, w) => s + w.items.filter((i) => i.done).length, 0);
  const total = growthWeeks.reduce((s, w) => s + w.items.length, 0);
  const growthPct = Math.round((totalDone / total) * 100);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Business Analysis AI"
        subtitle="Get AI-powered insights about your business strengths, weaknesses, and growth opportunities"
        actions={
          <Button variant="hero" size="sm">
            <Sparkles size={14} /> Quick Analysis
          </Button>
        }
      />

      {/* Input Section */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Business Type</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g., Dental Clinic, Salon, Restaurant"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Hyderabad, Banjara Hills"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            />
          </div>
        </div>

        <Button
          variant="hero"
          className="w-full"
          size="lg"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Target size={16} className="animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Analyze My Business
            </>
          )}
        </Button>
      </div>

      {showResults && (
        <>
          {/* Strengths */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold">Strengths</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Strong local presence with 4.8★ rating</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Experienced team with 5+ years in business</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Good customer retention rate (68%)</span>
              </li>
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle size={16} className="text-red-600" />
              </div>
              <h3 className="text-sm font-semibold">Weaknesses</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>Low online visibility - not ranking on Google Maps</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>Inconsistent social media posting</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>No WhatsApp automation for follow-ups</span>
              </li>
            </ul>
          </div>

          {/* Growth Opportunities */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target size={16} className="text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold">Growth Opportunities</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Launch referral program - competitors seeing 30% growth</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Start Instagram Reels - high engagement in your area</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Optimize Google Maps listing for local searches</span>
              </li>
            </ul>
          </div>

          {/* 30-Day Growth Plan */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-200 to-pink-200 p-4 text-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-purple-300 flex items-center justify-center">
                    <Map size={18} className="text-purple-800" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">30-Day Growth Plan</h3>
                    <p className="text-xs text-gray-700">Your personalized roadmap to success</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-purple-300 hover:bg-purple-400 text-purple-900 border-purple-300 text-xs h-8"
                >
                  <Sparkles size={12} /> View Details
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-700 mb-0.5">Overall Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{growthPct}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-700 mb-0.5">Revenue Goal</p>
                  <p className="text-lg font-semibold text-gray-900">₹3.62L / ₹5L</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-purple-300 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${growthPct}%` }}
                />
              </div>
            </div>
            <div className="p-4 space-y-3">
              {growthWeeks.map((w) => (
                <div key={w.week} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900">{w.week}</p>
                    <span className="text-xs font-semibold text-purple-600">{w.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${w.progress}%` }}
                    />
                  </div>
                  <ul className="space-y-1.5">
                    {w.items.map((it) => (
                      <li key={it.t} className="flex items-start gap-2 text-xs">
                        {it.done ? (
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        )}
                        <span className={it.done ? "line-through text-gray-500" : "text-gray-700"}>
                          {it.t}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
