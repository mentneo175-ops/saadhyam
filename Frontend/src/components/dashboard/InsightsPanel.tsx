import { Star, Activity, Tag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
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

  // Helper function to render markdown text with bold
  const renderMarkdown = (text: string) => {
    // Split by ** to find bold sections
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** and render as bold
        const boldText = part.slice(2, -2);
        return <strong key={idx} className="font-semibold text-gray-900">{boldText}</strong>;
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
    <aside className="hidden xl:flex flex-col gap-5 w-80 shrink-0 border-l border-gray-200 bg-gray-50 p-5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
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
                  className="rounded-lg border border-gray-200 p-4 bg-white animate-pulse"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mt-2" />
                </div>
              ))}
            </>
          ) : (
            // Real data
            insights.map((it) => (
              <div
                key={it.title}
                className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <it.icon size={16} className="text-blue-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600">{it.title}</p>
                    <p className="text-sm font-bold text-gray-900">{it.metric}</p>
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
        <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-blue-900" />
            <p className="text-sm font-semibold text-gray-900">AI Business Analysis</p>
          </div>
          <p className="text-xs text-gray-600 mb-4">Personalized insights for your business</p>
          
          <div className="space-y-3">
            {/* Strengths */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">💪</span>
                <h4 className="text-xs font-semibold text-gray-900">Strengths</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.strengths?.slice(0, 2).map((strength: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-700">• {renderMarkdown(strength)}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⚠️</span>
                <h4 className="text-xs font-semibold text-gray-900">Weaknesses</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.weaknesses?.slice(0, 2).map((weakness: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-700">• {renderMarkdown(weakness)}</li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🚀</span>
                <h4 className="text-xs font-semibold text-gray-900">Opportunities</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.opportunities?.slice(0, 2).map((opportunity: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-700">• {renderMarkdown(opportunity)}</li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⚡</span>
                <h4 className="text-xs font-semibold text-gray-900">Threats</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.threats?.slice(0, 2).map((threat: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-700">• {threat}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
