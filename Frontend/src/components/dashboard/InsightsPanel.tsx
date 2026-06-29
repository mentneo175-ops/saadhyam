import { Star, Activity, Tag, Sparkles, AlertTriangle, Zap, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";

interface InsightsPanelProps {
  businessAnalysis?: any;
}

interface InsightData {
  metric: string;
  detail: string;
  available: boolean;
}

interface AnalyticsData {
  posting_activity?: InsightData;
  whatsapp_messages?: InsightData;
  review_replies?: InsightData;
  campaign_performance?: InsightData;
}

export function InsightsPanel({ businessAnalysis }: InsightsPanelProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("Loading...");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    "strengths" | "weaknesses" | "opportunities" | "recommendations"
  >("strengths");
  const [isHovered, setIsHovered] = useState(false);

  const analysisTabs = ["strengths", "weaknesses", "opportunities", "recommendations"] as const;

  // Auto-rotate tabs with hover pause and manual click-reset
  useEffect(() => {
    if (isHovered || !businessAnalysis) return;

    const interval = setInterval(() => {
      setActiveAnalysisTab((prev) => {
        const currentIndex = analysisTabs.indexOf(prev);
        const nextIndex = (currentIndex + 1) % analysisTabs.length;
        return analysisTabs[nextIndex];
      });
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [activeAnalysisTab, isHovered, businessAnalysis]);

  // Helper function to render markdown text with bold
  const renderMarkdown = (text: string) => {
    // Split by ** to find bold sections
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** and render as bold
        const boldText = part.slice(2, -2);
        return <strong key={idx} className="font-semibold text-gray-900 dark:text-slate-100">{boldText}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Fetch real analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<any>("/api/dashboard/analytics");
        
        if (response.success && response.insights) {
          setAnalytics(response.insights);
          
          // Format last updated time
          const updatedAt = new Date(response.updated_at);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - updatedAt.getTime()) / 60000);
          
          if (diffMinutes < 1) {
            setLastUpdated("Updated just now");
          } else if (diffMinutes < 60) {
            setLastUpdated(`Updated ${diffMinutes} min ago`);
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            setLastUpdated(`Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        // Keep loading state to show skeleton
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Dynamic insights based on real data
  const insights = analytics ? [
    {
      icon: Activity,
      title: "Posting activity",
      metric: analytics.posting_activity?.metric || "0 posts",
      detail: analytics.posting_activity?.detail || "No data available",
      accent: "from-purple-500 to-fuchsia-500",
      available: analytics.posting_activity?.available || false,
    },
    {
      icon: Tag,
      title: "WhatsApp messages",
      metric: analytics.whatsapp_messages?.metric || "0 messages",
      detail: analytics.whatsapp_messages?.detail || "No data available",
      accent: "from-green-500 to-emerald-500",
      available: analytics.whatsapp_messages?.available || false,
    },
    {
      icon: Star,
      title: "Campaign performance",
      metric: analytics.campaign_performance?.metric || "0 campaigns",
      detail: analytics.campaign_performance?.detail || "No data available",
      accent: "from-amber-500 to-orange-500",
      available: analytics.campaign_performance?.available || false,
    },
  ] : [];

  return (
    <aside className="hidden xl:flex flex-col gap-5 w-80 border-l border-gray-200 bg-gray-50 p-5 fixed right-0 top-16 bottom-0 overflow-y-auto dark:border-slate-800 dark:bg-slate-900 z-30">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">AI Insights</h3>
            <p className="text-xs text-gray-600">{lastUpdated}</p>
          </div>
          <span className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`} />
        </div>
        
        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 p-4 bg-white animate-pulse dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24 dark:bg-slate-700" />
                      <div className="h-4 bg-gray-200 rounded w-16 dark:bg-slate-700" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mt-2 dark:bg-slate-700" />
                </div>
              ))}
            </>
          ) : (
            // Real data
            insights.map((it) => (
              <div
                key={it.title}
                className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <it.icon size={16} className="text-blue-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">{it.title}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{it.metric}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{it.detail}</p>
              </div>
            ))
          )}
        </div>
        
        {/* <button className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-accent/40 transition flex items-center justify-center gap-1">
          View all insights <ArrowRight size={14} />
        </button> */}
      </div>

      {/* Business Analysis Section */}
      {businessAnalysis ? (
        <div 
          className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm transition-all duration-300 dark:bg-slate-900 dark:border-slate-800"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-blue-900 animate-pulse" />
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">AI Business Analysis</p>
          </div>
          <p className="text-xs text-gray-600 mb-4">Personalized insights for your business</p>
          
          {/* Responsive 2x2 tab selector */}
          <div className="grid grid-cols-2 gap-1 mb-4 bg-slate-100 p-1 rounded-xl border border-slate-200/50 dark:bg-slate-800">
            <button
              onClick={() => setActiveAnalysisTab("strengths")}
              className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeAnalysisTab === "strengths"
                  ? "bg-white text-emerald-700 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles size={10} className="text-emerald-500" />
              <span>Strengths</span>
            </button>
            <button
              onClick={() => setActiveAnalysisTab("weaknesses")}
              className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeAnalysisTab === "weaknesses"
                  ? "bg-white text-orange-700 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <AlertTriangle size={10} className="text-orange-500" />
              <span>Weakness</span>
            </button>
            <button
              onClick={() => setActiveAnalysisTab("opportunities")}
              className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeAnalysisTab === "opportunities"
                  ? "bg-white text-purple-700 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Zap size={10} className="text-purple-500" />
              <span>Opps</span>
            </button>
            <button
              onClick={() => setActiveAnalysisTab("recommendations")}
              className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeAnalysisTab === "recommendations"
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Lightbulb size={10} className="text-blue-500" />
              <span>Recs</span>
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {activeAnalysisTab === "strengths" && businessAnalysis.strengths && (
                <motion.div
                  key="strengths"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={13} className="text-emerald-600 animate-pulse" />
                    <h4 className="text-[11px] font-bold text-emerald-950">Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {businessAnalysis.strengths.slice(0, 3).map((strength: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-emerald-800 leading-relaxed list-none pl-2 border-l-2 border-emerald-300">
                        {renderMarkdown(strength)}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {activeAnalysisTab === "weaknesses" && businessAnalysis.weaknesses && (
                <motion.div
                  key="weaknesses"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-orange-50/50 rounded-xl p-3 border border-orange-100"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={13} className="text-orange-600" />
                    <h4 className="text-[11px] font-bold text-orange-955">Weaknesses</h4>
                  </div>
                  <ul className="space-y-2">
                    {businessAnalysis.weaknesses.slice(0, 3).map((weakness: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-orange-800 leading-relaxed list-none pl-2 border-l-2 border-orange-300">
                        {renderMarkdown(weakness)}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {activeAnalysisTab === "opportunities" && businessAnalysis.growth_opportunities && (
                <motion.div
                  key="opportunities"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-purple-50/50 rounded-xl p-3 border border-purple-100"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={13} className="text-purple-600" />
                    <h4 className="text-[11px] font-bold text-purple-950">Opportunities</h4>
                  </div>
                  <ul className="space-y-2">
                    {businessAnalysis.growth_opportunities.slice(0, 3).map((opportunity: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-purple-800 leading-relaxed list-none pl-2 border-l-2 border-purple-300">
                        {renderMarkdown(opportunity)}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {activeAnalysisTab === "recommendations" && businessAnalysis.recommendations && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="bg-blue-50/50 rounded-xl p-3 border border-blue-100"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb size={13} className="text-blue-600" />
                    <h4 className="text-[11px] font-bold text-blue-950">Recommendations</h4>
                  </div>
                  <ul className="space-y-2">
                    {businessAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-blue-800 leading-relaxed list-none pl-2 border-l-2 border-blue-300">
                        {renderMarkdown(rec)}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
