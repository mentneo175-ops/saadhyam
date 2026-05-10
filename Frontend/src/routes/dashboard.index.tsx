import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ContentTabs } from "@/components/dashboard/ContentTabs";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { Button } from "@/components/ui/button";
import { BusinessOnboarding } from "@/components/dashboard/BusinessOnboarding";
import { apiClient } from "@/lib/api";
import { useRealtimeBusiness } from "@/hooks/useRealtimeBusiness";
import { formatCacheAge } from "@/lib/realtimeBusinessApi";
import { getGrowthPlanData, type GrowthPlanData } from "@/lib/comprehensiveAnalysisApi";
import {
  Activity,
  Eye,
  TrendingUp,
  PenTool,
  Star,
  Instagram,
  MessageCircle,
  Tag,
  Eye as EyeIcon,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Zap,
  RefreshCw,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [{ title: "Saadhyam AI" }],
  }),
  component: Overview,
});

// Icon mapping for dynamic action cards
const iconMap: Record<string, any> = {
  Star,
  Instagram,
  MessageCircle,
  Tag,
  EyeIcon,
  Sparkles,
  Target,
  Users,
  Zap,
  TrendingUp,
  Activity,
};

function Overview() {
  const navigate = useNavigate();
  const context = useRouteContext({ from: "/dashboard/" }) as { refreshTrigger?: number };
  
  // Use real-time business intelligence hook
  const {
    profile,
    profileLoading,
    profileError,
    analysis,
    analysisLoading,
    insights,
    insightsLoading,
    refreshAll,
    refreshAnalysis,
    cacheStatus,
    lastUpdated,
  } = useRealtimeBusiness();

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Dynamic actions state
  const [dynamicActions, setDynamicActions] = useState<any[]>([]);
  
  // 30-Day Growth Plan state
  const [growthPlan, setGrowthPlan] = useState<GrowthPlanData | null>(null);
  const [growthPlanLoading, setGrowthPlanLoading] = useState(false);

  // Listen to refresh trigger from context
  useEffect(() => {
    if (context.refreshTrigger && context.refreshTrigger > 0) {
      refreshAll();
    }
  }, [context.refreshTrigger, refreshAll]);

  // Check if business profile is complete
  useEffect(() => {
    const checkProfile = async () => {
      if (apiClient.isAuthenticated()) {
        try {
          const status = await apiClient.getBusinessSetupStatus();
          if (!status.setup_completed) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error checking profile status:", error);
        }
      }
      setCheckingProfile(false);
    };

    checkProfile();
  }, []);

  // Generate dynamic action cards from Gemini insights
  useEffect(() => {
    if (insights?.status === "success" && insights.insights?.next_actions) {
      const actions = insights.insights.next_actions.slice(0, 5).map((action: string, idx: number) => ({
        icon: getIconForRecommendation(action, idx),
        title: action,
        desc: getDescriptionForRecommendation(action),
        impact: getImpactLevel(idx),
        bg: getBackgroundColor(idx),
        iconColor: getIconColor(idx),
      }));
      setDynamicActions(actions);
    } else if (analysis?.status === "success" && analysis.analysis?.thirty_day_plan) {
      // Fallback to analysis thirty_day_plan
      const actions = analysis.analysis.thirty_day_plan.slice(0, 5).map((action: string, idx: number) => ({
        icon: getIconForRecommendation(action, idx),
        title: action,
        desc: getDescriptionForRecommendation(action),
        impact: getImpactLevel(idx),
        bg: getBackgroundColor(idx),
        iconColor: getIconColor(idx),
      }));
      setDynamicActions(actions);
    }
  }, [insights, analysis]);

  // Load 30-Day Growth Plan from comprehensive analysis
  useEffect(() => {
    const loadGrowthPlan = async () => {
      setGrowthPlanLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const data = await getGrowthPlanData(token);
          setGrowthPlan(data);
        }
      } catch (err) {
        console.error("Failed to load growth plan:", err);
        // Silently fail - growth plan is optional
      } finally {
        setGrowthPlanLoading(false);
      }
    };
    
    if (profile && !checkingProfile) {
      loadGrowthPlan();
    }
  }, [profile, checkingProfile]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Reload page to fetch new data
    window.location.reload();
  };

  // Helper functions for dynamic action cards
  const getIconForRecommendation = (rec: string, idx: number) => {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes('social') || lowerRec.includes('instagram') || lowerRec.includes('facebook')) return Instagram;
    if (lowerRec.includes('review') || lowerRec.includes('rating')) return Star;
    if (lowerRec.includes('message') || lowerRec.includes('whatsapp') || lowerRec.includes('communication')) return MessageCircle;
    if (lowerRec.includes('offer') || lowerRec.includes('discount') || lowerRec.includes('promotion')) return Tag;
    if (lowerRec.includes('visibility') || lowerRec.includes('seo') || lowerRec.includes('online')) return EyeIcon;
    if (lowerRec.includes('target') || lowerRec.includes('audience')) return Target;
    if (lowerRec.includes('customer') || lowerRec.includes('engagement')) return Users;
    if (lowerRec.includes('automat') || lowerRec.includes('system')) return Zap;
    return [Sparkles, TrendingUp, Activity][idx % 3];
  };

  const getDescriptionForRecommendation = (rec: string) => {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes('social')) return "Boost your social media presence and engagement";
    if (lowerRec.includes('review')) return "Improve your online reputation and ratings";
    if (lowerRec.includes('seo') || lowerRec.includes('online')) return "Increase your online visibility and reach";
    if (lowerRec.includes('customer')) return "Enhance customer relationships and retention";
    return "AI-recommended action to grow your business";
  };

  const getImpactLevel = (idx: number): "High" | "Medium" | "Low" => {
    return idx < 2 ? "High" : idx < 4 ? "Medium" : "Low";
  };

  const getBackgroundColor = (idx: number) => {
    const colors = [
      "bg-gradient-to-br from-purple-50 to-fuchsia-50",
      "bg-gradient-to-br from-pink-50 to-rose-50",
      "bg-gradient-to-br from-blue-50 to-indigo-50",
      "bg-gradient-to-br from-emerald-50 to-teal-50",
      "bg-gradient-to-br from-amber-50 to-orange-50",
    ];
    return colors[idx % colors.length];
  };

  const getIconColor = (idx: number) => {
    const colors = [
      "text-purple-600",
      "text-pink-600",
      "text-blue-600",
      "text-emerald-600",
      "text-amber-600",
    ];
    return colors[idx % colors.length];
  };

  // Default snapshot cards
  const defaultSnapshots = [
    {
      title: "Business Health",
      value: "7",
      delta: "+2.2%",
      trend: "down" as const,
      status: "Excellent" as const,
      icon: Activity,
      gradient: "from-purple-500 to-fuchsia-500",
      data: [40, 44, 50, 48, 56, 65, 72, 78, 87],
    },
    {
      title: "AI Visibility",
      value: "72%",
      delta: "+8.1%",
      trend: "up" as const,
      status: "Good" as const,
      icon: Eye,
      gradient: "from-pink-500 to-rose-500",
      data: [30, 35, 38, 42, 50, 55, 60, 67, 72],
    },
    {
      title: "Lead Conversion",
      value: "12.4%",
      delta: "-1.3%",
      trend: "down" as const,
      status: "Needs Improvement" as const,
      icon: TrendingUp,
      gradient: "from-orange-500 to-amber-500",
      data: [16, 15, 14.5, 14, 13.8, 13, 12.8, 12.5, 12.4],
    },
    {
      title: "Content Activity",
      value: "24",
      delta: "+12",
      trend: "up" as const,
      status: "Good" as const,
      icon: PenTool,
      gradient: "from-violet-500 to-purple-500",
      data: [4, 6, 8, 10, 14, 16, 18, 22, 24],
    },
  ];

  // Default action cards (fallback)
  const defaultActions = [
    {
      icon: Star,
      title: "Ask for Google reviews",
      desc: "Send a one-tap review request to your last 30 happy customers.",
      impact: "High" as const,
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      iconColor: "text-amber-600",
    },
    {
      icon: Instagram,
      title: "Post Instagram content",
      desc: "Your audience is most active in 2 hours — schedule today's post.",
      impact: "High" as const,
      bg: "bg-gradient-to-br from-pink-50 to-rose-50",
      iconColor: "text-pink-600",
    },
    {
      icon: MessageCircle,
      title: "Send WhatsApp messages",
      desc: "47 customers haven't ordered in 30 days — re-engage them now.",
      impact: "Medium" as const,
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      iconColor: "text-emerald-600",
    },
  ];

  // Helper functions for status determination (moved before usage)
  const getHealthStatus = (score: number): "Excellent" | "Good" | "Needs Improvement" => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    return "Needs Improvement";
  };

  const getVisibilityStatus = (score: number): "Excellent" | "Good" | "Needs Improvement" => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  const getConversionStatus = (score: number): "Excellent" | "Good" | "Needs Improvement" => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  // Calculate scores from Gemini analysis
  const businessScore = analysis?.status === "success" && analysis.analysis?.strengths && analysis.analysis?.weaknesses
    ? Math.round((analysis.analysis.strengths.length / (analysis.analysis.strengths.length + analysis.analysis.weaknesses.length)) * 10)
    : 7;

  const visibilityScore = analysis?.status === "success" && analysis.analysis?.local_market_ideas
    ? Math.min(Math.round(analysis.analysis.local_market_ideas.length * 15), 100)
    : 72;

  const conversionScore = analysis?.status === "success" && analysis.analysis?.growth_opportunities
    ? Math.min(Math.round(analysis.analysis.growth_opportunities.length * 12), 100)
    : 65;

  // Update snapshot cards with real Gemini data
  const updatedSnapshots = [
    {
      ...defaultSnapshots[0],
      value: `${businessScore}/10`,
      status: getHealthStatus(businessScore),
      delta: analysisLoading ? "..." : "+2.2%",
    },
    {
      ...defaultSnapshots[1],
      value: `${visibilityScore}%`,
      status: getVisibilityStatus(visibilityScore),
      delta: analysisLoading ? "..." : "+8.1%",
    },
    {
      ...defaultSnapshots[2],
      value: `${conversionScore}%`,
      status: getConversionStatus(conversionScore),
      delta: analysisLoading ? "..." : "-1.3%",
    },
    defaultSnapshots[3],
  ];

  // Use dynamic actions if available, otherwise use default
  const actionsToShow = dynamicActions.length > 0 ? dynamicActions.slice(0, 5) : defaultActions;

  return (
    <>
      {/* Business Onboarding Modal */}
      <BusinessOnboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <div className="flex">
        <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-7">
          {/* Loading state */}
          {checkingProfile && (
            <div className="text-center py-12">
              <Sparkles size={32} className="animate-spin mx-auto text-purple-600 mb-4" />
              <p className="text-gray-600">Loading your business intelligence...</p>
            </div>
          )}

          {/* Error state */}
          {profileError && !checkingProfile && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{profileError}</p>
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowOnboarding(true)}
                className="mt-3"
              >
                Complete Business Setup
              </Button>
            </div>
          )}

          {/* Main content */}
          {!checkingProfile && profile && (
            <>
              {/* Snapshot cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {updatedSnapshots.map((s) => (
                  <SnapshotCard key={s.title} {...s} />
                ))}
              </div>

              {/* Growth journey */}
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">Your growth journey</h3>
                    <p className="text-xs text-muted-foreground">From January → today → projected goal</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View full report <ArrowRight size={14} />
                  </Button>
                </div>
                <GrowthChart />
              </div>

              {/* Recommended actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {dynamicActions.length > 0 ? "AI-Generated Action Plan" : "Recommended actions"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {dynamicActions.length > 0 
                        ? "Personalized recommendations from Gemini AI with real-time insights"
                        : "AI-prioritized for maximum impact today"
                      }
                    </p>
                  </div>
                  <button className="text-xs font-semibold text-primary hover:underline">See all</button>
                </div>
                
                {insightsLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="min-w-[280px] h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div 
                    className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" 
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {actionsToShow.map((a, idx) => (
                      <ActionCard key={`${a.title}-${idx}`} {...a} />
                    ))}
                  </div>
                )}
              </div>

              {/* 30-Day Growth Plan */}
              {growthPlan?.thirty_day_growth_plan && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-border/60">
                  <div className="bg-gradient-to-r from-purple-200 to-pink-200 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-purple-300 flex items-center justify-center">
                          <Target size={24} className="text-purple-800" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">30-Day Growth Plan</h3>
                          <p className="text-sm text-gray-700">Your personalized roadmap to success</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate({ to: "/dashboard/daily-ask" })}
                        className="bg-white/80 hover:bg-white"
                      >
                        View All <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="p-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {growthPlan.thirty_day_growth_plan.week_1 && growthPlan.thirty_day_growth_plan.week_1.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-700">1</span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900">Week 1 · Foundations</h4>
                        </div>
                        <ul className="space-y-2">
                          {growthPlan.thirty_day_growth_plan.week_1.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-purple-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {growthPlan.thirty_day_growth_plan.week_2 && growthPlan.thirty_day_growth_plan.week_2.length > 0 && (
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-pink-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-pink-700">2</span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900">Week 2 · Engagement</h4>
                        </div>
                        <ul className="space-y-2">
                          {growthPlan.thirty_day_growth_plan.week_2.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-pink-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {growthPlan.thirty_day_growth_plan.week_3 && growthPlan.thirty_day_growth_plan.week_3.length > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">3</span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900">Week 3 · Acceleration</h4>
                        </div>
                        <ul className="space-y-2">
                          {growthPlan.thirty_day_growth_plan.week_3.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-blue-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {growthPlan.thirty_day_growth_plan.week_4 && growthPlan.thirty_day_growth_plan.week_4.length > 0 && (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-700">4</span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900">Week 4 · Optimization</h4>
                        </div>
                        <ul className="space-y-2">
                          {growthPlan.thirty_day_growth_plan.week_4.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content tabs */}
              <ContentTabs />
            </>
          )}
        </div>

        <InsightsPanel 
          businessAnalysis={analysis?.status === "success" ? analysis.analysis : null}
        />
      </div>
    </>
  );
}
