import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ContentTabs } from "@/components/dashboard/ContentTabs";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { SocialMediaCenterCard } from "@/components/dashboard/SocialMediaCenterCard";
import { DailyTasksWidget } from "@/components/dashboard/DailyTasksWidget";
import { Button } from "@/components/ui/button";
import { DashboardLoader } from "@/components/dashboard/DashboardLoader";
import { apiClient } from "@/lib/api";
import { useRealtimeBusiness } from "@/hooks/useRealtimeBusiness";
import { useRoutePreservation } from "@/hooks/useRoutePreservation";
import { formatCacheAge } from "@/lib/realtimeBusinessApi";
import { getGrowthPlanData, type GrowthPlanData } from "@/lib/comprehensiveAnalysisApi";
import { useDashboardContext } from "@/contexts/DashboardContext";
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
  const { refreshTrigger } = useDashboardContext();
  // Use route preservation hook to handle refresh redirects
  useRoutePreservation();

  // Use real-time business intelligence hook
  const {
    profile,
    profileLoading,
    analysis,
    analysisLoading,
    insights,
    insightsLoading,
    refreshAll,
    refreshAnalysis,
    cacheStatus,
    lastUpdated,
  } = useRealtimeBusiness();

  const checkingProfile = profileLoading;

  // Dashboard loading state (for first-time users after onboarding)
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);

  // Dynamic actions state
  const [dynamicActions, setDynamicActions] = useState<any[]>([]);

  // 30-Day Growth Plan state
  const [growthPlan, setGrowthPlan] = useState<GrowthPlanData | null>(null);
  const [growthPlanLoading, setGrowthPlanLoading] = useState(false);

  // Listen to refresh trigger from context
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refreshAll();
    }
  }, [refreshTrigger, refreshAll]);

  // Generate dynamic action cards from Gemini insights
  useEffect(() => {
    console.log("📊 Dashboard Data Status:", {
      insights: insights?.status,
      hasNextActions: insights?.insights?.next_actions?.length,
      analysis: analysis?.status,
      hasThirtyDayPlan: analysis?.analysis?.thirty_day_plan?.length,
      growthPlan: growthPlan?.thirty_day_growth_plan ? "available" : "not available",
    });

    // Priority 1: Use insights next_actions
    if (insights?.status === "success" && insights.insights?.next_actions) {
      console.log("✅ Using Gemini insights for action cards");
      const actions = insights.insights.next_actions
        .slice(0, 5)
        .map((action: string, idx: number) => ({
          icon: getIconForRecommendation(action, idx),
          title: action,
          desc: getDescriptionForRecommendation(action),
          impact: getImpactLevel(idx),
          bg: getBackgroundColor(idx),
          iconColor: getIconColor(idx),
        }));
      setDynamicActions(actions);
    }
    // Priority 2: Use analysis thirty_day_plan
    else if (analysis?.status === "success" && analysis.analysis?.thirty_day_plan) {
      console.log("✅ Using analysis thirty_day_plan for action cards");
      const actions = analysis.analysis.thirty_day_plan
        .slice(0, 5)
        .map((action: string, idx: number) => ({
          icon: getIconForRecommendation(action, idx),
          title: action,
          desc: getDescriptionForRecommendation(action),
          impact: getImpactLevel(idx),
          bg: getBackgroundColor(idx),
          iconColor: getIconColor(idx),
        }));
      setDynamicActions(actions);
    }
    // Priority 3: Use growth plan week 1 + week 2 tasks
    else if (
      growthPlan?.thirty_day_growth_plan?.week_1 &&
      growthPlan.thirty_day_growth_plan.week_1.length > 0
    ) {
      console.log("✅ Using growth plan for action cards");
      // Combine Week 1 and Week 2 tasks for more variety
      const week1Tasks = growthPlan.thirty_day_growth_plan.week_1 || [];
      const week2Tasks = growthPlan.thirty_day_growth_plan.week_2 || [];
      const allTasks = [...week1Tasks, ...week2Tasks];

      const actions = allTasks.map((action: string, idx: number) => ({
        icon: getIconForRecommendation(action, idx),
        title: action,
        desc: getDescriptionForRecommendation(action),
        impact: getImpactLevel(idx),
        bg: getBackgroundColor(idx),
        iconColor: getIconColor(idx),
      }));
      setDynamicActions(actions);
      console.log(
        `✅ Loaded ${actions.length} action cards (Week 1: ${week1Tasks.length}, Week 2: ${week2Tasks.length})`,
      );
    } else {
      console.warn("⚠️ No Gemini data available, using default actions");
    }
  }, [insights, analysis, growthPlan]);

  // Load 30-Day Growth Plan from comprehensive analysis
  useEffect(() => {
    const loadGrowthPlan = async () => {
      setGrowthPlanLoading(true);
      try {
        const token = localStorage.getItem("saadhyam_token");
        if (token) {
          // Load growth plan
          const data = await getGrowthPlanData(token);
          setGrowthPlan(data);

          // Note: Business analysis is already loaded by useRealtimeBusiness hook
          // No need to fetch it separately here
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

  // Helper function to render markdown text with bold
  const renderMarkdown = (text: string) => {
    // Split by ** to find bold sections
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Remove ** and render as bold
        const boldText = part.slice(2, -2);
        return (
          <strong key={idx} className="font-semibold text-gray-900">
            {boldText}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Monitor when dashboard data is fully loaded
  useEffect(() => {
    if (
      isDashboardLoading &&
      !profileLoading &&
      !analysisLoading &&
      !insightsLoading &&
      profile &&
      analysis
    ) {
      // Wait a bit more to ensure everything is rendered
      const timer = setTimeout(() => {
        setDashboardReady(true);
        setIsDashboardLoading(false);
      }, 2000); // 2 second delay to ensure smooth transition

      return () => clearTimeout(timer);
    }
  }, [isDashboardLoading, profileLoading, analysisLoading, insightsLoading, profile, analysis]);

  // Helper functions for dynamic action cards
  const getIconForRecommendation = (rec: string, idx: number) => {
    const lowerRec = rec.toLowerCase();
    if (
      lowerRec.includes("social") ||
      lowerRec.includes("instagram") ||
      lowerRec.includes("facebook")
    )
      return Instagram;
    if (lowerRec.includes("review") || lowerRec.includes("rating")) return Star;
    if (
      lowerRec.includes("message") ||
      lowerRec.includes("whatsapp") ||
      lowerRec.includes("communication")
    )
      return MessageCircle;
    if (
      lowerRec.includes("offer") ||
      lowerRec.includes("discount") ||
      lowerRec.includes("promotion")
    )
      return Tag;
    if (lowerRec.includes("visibility") || lowerRec.includes("seo") || lowerRec.includes("online"))
      return EyeIcon;
    if (lowerRec.includes("target") || lowerRec.includes("audience")) return Target;
    if (lowerRec.includes("customer") || lowerRec.includes("engagement")) return Users;
    if (lowerRec.includes("automat") || lowerRec.includes("system")) return Zap;
    return [Sparkles, TrendingUp, Activity][idx % 3];
  };

  const getDescriptionForRecommendation = (rec: string) => {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes("social")) return "Boost social media engagement";
    if (lowerRec.includes("review")) return "Improve online reputation";
    if (lowerRec.includes("seo") || lowerRec.includes("online"))
      return "Increase online visibility";
    if (lowerRec.includes("customer")) return "Enhance customer retention";
    return "AI-recommended action";
  };

  const getImpactLevel = (idx: number): "High" | "Medium" | "Low" => {
    return idx < 2 ? "High" : idx < 4 ? "Medium" : "Low";
  };

  // Professional theme - all cards use white background with navy accents
  const getBackgroundColor = (idx: number) => {
    return "bg-white";
  };

  const getIconColor = (idx: number) => {
    // Use navy blue as primary brand color for all icons
    return "text-blue-900";
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
  const businessScore =
    analysis?.status === "success" && analysis.analysis?.strengths && analysis.analysis?.weaknesses
      ? Math.round(
          (analysis.analysis.strengths.length /
            (analysis.analysis.strengths.length + analysis.analysis.weaknesses.length)) *
            10,
        )
      : 7;

  const visibilityScore =
    analysis?.status === "success" && analysis.analysis?.local_market_ideas
      ? Math.min(Math.round(analysis.analysis.local_market_ideas.length * 15), 100)
      : 72;

  const conversionScore =
    analysis?.status === "success" && analysis.analysis?.growth_opportunities
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
  const actionsToShow = dynamicActions.length > 0 ? dynamicActions : defaultActions;

  return (
    <>
      {/* Dashboard Loading Screen - Shows after onboarding */}
      <DashboardLoader isLoading={isDashboardLoading} message="Analyzing your business" />

      <div className="flex flex-1 bg-background">
        <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Loading state */}
          {checkingProfile && (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-linear-to-r from-[#8B5CF6] to-[#A855F7] rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Sparkles
                  size={32}
                  className="animate-spin mx-auto text-[#8B5CF6] relative z-10 mb-4"
                />
              </div>
              <p className="text-gray-700 text-base font-medium">
                Loading your business intelligence...
              </p>
              <p className="text-gray-500 text-sm mt-1">Preparing insights powered by AI</p>
            </div>
          )}

          {/* Analysis Error State */}
          {analysis?.status === "error" && !analysisLoading && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
              <h3 className="text-slate-900 text-lg font-semibold mb-2">System Optimizing</h3>
              <p className="text-slate-600 text-sm mb-4">
                Our intelligence engine is currently optimizing. Insights are being computed, please
                check back shortly.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Refresh Overview
                </Button>
              </div>
            </div>
          )}

          {/* Main content - show even without profile */}
          {!checkingProfile && (
            <>
              {/* Snapshot cards - Mobile: 2x2 Grid, Desktop: Single Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {updatedSnapshots.map((s) => (
                  <SnapshotCard key={s.title} {...s} />
                ))}
              </div>

              {/* Instagram Analytics Preview Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1">
                  <SocialMediaCenterCard />
                </div>

                {/* Growth journey with integrated daily task */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl shadow-gray-200/50 p-6 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Your Growth Journey</h3>
                      <p className="text-sm text-gray-600">Track your progress with daily tasks</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate({ to: "/dashboard/daily-ask" })}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      View full report <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>

                  {/* Daily Task Section - Integrated */}
                  <DailyTasksWidget />

                  {/* Growth Chart */}
                  <GrowthChart />
                </div>
              </div>

              {/* Recommended actions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {dynamicActions.length > 0
                        ? "🎯 AI-Generated Action Plan"
                        : "Recommended Actions"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dynamicActions.length > 0
                        ? "Personalized recommendations from Gemini AI with real-time insights"
                        : "AI-prioritized for maximum impact today"}
                    </p>
                  </div>
                </div>

                {insightsLoading ? (
                  <div className="flex gap-5 overflow-x-auto pb-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="min-w-70 h-36 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
                        <div className="p-5 space-y-3">
                          <div className="h-10 w-10 bg-gray-200/70 rounded-xl animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200/70 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-200/50 rounded w-full animate-pulse" />
                            <div className="h-3 bg-gray-200/50 rounded w-5/6 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {actionsToShow.map((a, idx) => (
                      <ActionCard key={`${a.title}-${idx}`} {...a} />
                    ))}
                  </div>
                )}
              </div>

              {/* 30-Day Growth Plan */}
              {growthPlan?.thirty_day_growth_plan && (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-200/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-300/50 transition-all duration-300">
                  <div className="bg-linear-to-r from-[#8B5CF6] to-[#A855F7] p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <Target size={28} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white">30-Day Growth Plan</h3>
                          <p className="text-sm text-[#E9D5FF]">
                            Your personalized roadmap to success
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate({ to: "/dashboard/daily-ask" })}
                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/30 text-white hover:border-white/50 transition-all"
                      >
                        View All <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {growthPlan.thirty_day_growth_plan.week_1 &&
                      growthPlan.thirty_day_growth_plan.week_1.length > 0 && (
                        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all">
                              <span className="text-base font-bold text-white">1</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Week 1</h4>
                              <p className="text-xs text-gray-600">Foundations</p>
                            </div>
                          </div>
                          <ul className="space-y-2.5">
                            {growthPlan.thirty_day_growth_plan.week_1
                              .slice(0, 2)
                              .map((action, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-700 flex items-start gap-2"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="text-green-600 shrink-0 mt-0.5"
                                  />
                                  <span className="line-clamp-2 leading-relaxed">
                                    {renderMarkdown(action)}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    {growthPlan.thirty_day_growth_plan.week_2 &&
                      growthPlan.thirty_day_growth_plan.week_2.length > 0 && (
                        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 group-hover:shadow-xl group-hover:shadow-[#8B5CF6]/40 transition-all">
                              <span className="text-base font-bold text-white">2</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Week 2</h4>
                              <p className="text-xs text-gray-600">Engagement</p>
                            </div>
                          </div>
                          <ul className="space-y-2.5">
                            {growthPlan.thirty_day_growth_plan.week_2
                              .slice(0, 2)
                              .map((action, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-700 flex items-start gap-2"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="text-green-600 shrink-0 mt-0.5"
                                  />
                                  <span className="line-clamp-2 leading-relaxed">
                                    {renderMarkdown(action)}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    {growthPlan.thirty_day_growth_plan.week_3 &&
                      growthPlan.thirty_day_growth_plan.week_3.length > 0 && (
                        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-xl group-hover:shadow-orange-500/40 transition-all">
                              <span className="text-base font-bold text-white">3</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Week 3</h4>
                              <p className="text-xs text-gray-600">Acceleration</p>
                            </div>
                          </div>
                          <ul className="space-y-2.5">
                            {growthPlan.thirty_day_growth_plan.week_3
                              .slice(0, 2)
                              .map((action, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-700 flex items-start gap-2"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="text-green-600 shrink-0 mt-0.5"
                                  />
                                  <span className="line-clamp-2 leading-relaxed">
                                    {renderMarkdown(action)}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    {growthPlan.thirty_day_growth_plan.week_4 &&
                      growthPlan.thirty_day_growth_plan.week_4.length > 0 && (
                        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 group">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-all">
                              <span className="text-base font-bold text-white">4</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">Week 4</h4>
                              <p className="text-xs text-gray-600">Optimization</p>
                            </div>
                          </div>
                          <ul className="space-y-2.5">
                            {growthPlan.thirty_day_growth_plan.week_4
                              .slice(0, 2)
                              .map((action, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-700 flex items-start gap-2"
                                >
                                  <CheckCircle2
                                    size={14}
                                    className="text-green-600 shrink-0 mt-0.5"
                                  />
                                  <span className="line-clamp-2 leading-relaxed">
                                    {renderMarkdown(action)}
                                  </span>
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
