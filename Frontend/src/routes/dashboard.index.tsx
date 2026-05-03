import { createFileRoute } from "@tanstack/react-router";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ContentTabs } from "@/components/dashboard/ContentTabs";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
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
  const [businessAnalysis, setBusinessAnalysis] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [dynamicActions, setDynamicActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      
      // Load business profile and analysis from API
      if (apiClient.isAuthenticated()) {
        try {
          const profile = await apiClient.getBusinessProfile();
          setBusinessProfile(profile);
        } catch (error) {
          console.error("Failed to load business profile:", error);
        }
        
        try {
          const analysis = await apiClient.getLatestBusinessAnalysis();
          if (analysis) {
            setBusinessAnalysis(analysis);
            
            // Generate dynamic action cards from recommendations
            if (analysis.recommendations) {
              const actions = analysis.recommendations.map((rec: string, idx: number) => ({
                icon: getIconForRecommendation(rec, idx),
                title: rec,
                desc: getDescriptionForRecommendation(rec),
                impact: getImpactLevel(idx),
                bg: getBackgroundColor(idx),
                iconColor: getIconColor(idx),
              }));
              setDynamicActions(actions);
            }
          }
        } catch (error) {
          console.error("Failed to load business analysis:", error);
          // Fallback to localStorage
          const localAnalysis = localStorage.getItem("businessAnalysis");
          if (localAnalysis) {
            const parsedAnalysis = JSON.parse(localAnalysis);
            setBusinessAnalysis(parsedAnalysis);
            
            if (parsedAnalysis.recommendations) {
              const actions = parsedAnalysis.recommendations.map((rec: string, idx: number) => ({
                icon: getIconForRecommendation(rec, idx),
                title: rec,
                desc: getDescriptionForRecommendation(rec),
                impact: getImpactLevel(idx),
                bg: getBackgroundColor(idx),
                iconColor: getIconColor(idx),
              }));
              setDynamicActions(actions);
            }
          }
        }
      }
      
      // Fallback to localStorage for business info if needed
      if (!businessProfile) {
        const info = localStorage.getItem("businessInfo");
        if (info) {
          setBusinessProfile(JSON.parse(info));
        }
      }
    } catch (error) {
      console.error("Failed to load business data:", error);
    } finally {
      setIsLoading(false);
    }
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

  // Update snapshot cards with real analysis data if available
  const updatedSnapshots = businessAnalysis
    ? [
        {
          ...defaultSnapshots[0],
          value: `${businessAnalysis.business_score}/10`,
          status: getHealthStatus(businessAnalysis.business_score),
        },
        {
          ...defaultSnapshots[1],
          value: `${businessAnalysis.ai_visibility_score}%`,
          status: getVisibilityStatus(businessAnalysis.ai_visibility_score),
        },
        {
          ...defaultSnapshots[2],
          value: `${businessAnalysis.conversion_score}%`,
          status: getConversionStatus(businessAnalysis.conversion_score),
        },
        defaultSnapshots[3],
      ]
    : defaultSnapshots;

  // Use dynamic actions if available, otherwise use default
  const actionsToShow = dynamicActions.length > 0 ? dynamicActions.slice(0, 5) : defaultActions;

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-7">
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
                  ? "Personalized recommendations based on your business analysis"
                  : "AI-prioritized for maximum impact today"
                }
              </p>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline">See all</button>
          </div>
          <div 
            className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" 
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {actionsToShow.map((a, idx) => (
              <ActionCard key={`${a.title}-${idx}`} {...a} />
            ))}
          </div>
        </div>

        {/* Content tabs */}
        <ContentTabs />
      </div>

      <InsightsPanel businessAnalysis={businessAnalysis} />
    </div>
  );
}
