import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Instagram,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Eye,
  ArrowRight,
  Sparkles,
  BarChart3,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { env } from "@/config/env";

interface InstagramStats {
  followers_count: number;
  follower_growth: number;
  engagement_rate: number;
  reach: number;
  recommendations_count: number;
  is_connected: boolean;
  username: string;
  recent_post?: {
    caption: string;
    like_count: number;
    comment_count: number;
    published_at: string;
  };
}

export function InstagramAnalyticsCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<InstagramStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstagramStats();
  }, []);

  const loadInstagramStats = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      
      // Check if Instagram is connected
      const connectionResponse = await fetch(
        `${env.apiBaseUrl}/settings/instagram/connection-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!connectionResponse.ok) {
        setLoading(false);
        return;
      }

      const connectionData = await connectionResponse.json();
      
      if (!connectionData.is_connected) {
        setStats({
          is_connected: false,
          followers_count: 0,
          follower_growth: 0,
          engagement_rate: 0,
          reach: 0,
          recommendations_count: 0,
          username: "",
        });
        setLoading(false);
        return;
      }

      // Get analytics account
      const accountResponse = await fetch(
        `${env.apiBaseUrl}/api/instagram-analytics/accounts/from-social`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        
        if (accountData.accounts && accountData.accounts.length > 0) {
          const account = accountData.accounts[0];
          
          // Get dashboard data
          const dashboardResponse = await fetch(
            `${env.apiBaseUrl}/api/instagram-analytics/dashboard/${account.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            
            setStats({
              is_connected: true,
              username: account.username,
              followers_count: dashboardData.overview.followers_count,
              follower_growth: dashboardData.overview.follower_growth,
              engagement_rate: dashboardData.overview.engagement_rate,
              reach: dashboardData.overview.reach,
              recommendations_count: dashboardData.recommendations.length,
              recent_post: dashboardData.recent_posts && dashboardData.recent_posts.length > 0 
                ? {
                    caption: dashboardData.recent_posts[0].caption,
                    like_count: dashboardData.recent_posts[0].like_count,
                    comment_count: dashboardData.recent_posts[0].comment_count,
                    published_at: dashboardData.recent_posts[0].published_at,
                  }
                : undefined,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load Instagram stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    navigate({ to: "/dashboard/instagram" });
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-xl shadow-purple-200/50 h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30"></div>
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">Instagram Analytics</h3>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 relative z-10"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats?.is_connected) {
    return (
      <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-xl shadow-purple-200/50 hover:shadow-2xl hover:shadow-purple-300/50 transition-all duration-300 cursor-pointer h-full flex flex-col" onClick={handleNavigate}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30 group-hover:from-purple-50/70 group-hover:to-pink-50/50 transition-all duration-300"></div>
        <div className="relative z-10 p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-300">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">Instagram Analytics</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Instagram className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-700 font-medium mb-2 dark:text-slate-300">Unlock Powerful Analytics</p>
            <p className="text-xs text-gray-600 mb-6">
              Connect your Instagram to track performance and get AI-powered insights
            </p>
            <Button 
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
              onClick={handleNavigate}
            >
              Connect Instagram
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-xl shadow-purple-200/50 hover:shadow-2xl hover:shadow-purple-300/50 transition-all duration-300 cursor-pointer h-full flex flex-col" onClick={handleNavigate}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30 group-hover:from-purple-50/70 group-hover:to-pink-50/50 transition-all duration-300"></div>
      
      <div className="relative z-10 p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-300">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">Instagram Analytics</h3>
              <p className="text-xs text-gray-600">@{stats.username}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs font-bold px-3 py-1 shadow-sm">
            Connected
          </Badge>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Followers</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {stats.followers_count.toLocaleString()}
              </span>
              {stats.follower_growth !== 0 && (
                <span className={`text-xs flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full ${stats.follower_growth > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {stats.follower_growth > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(stats.follower_growth)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Engagement</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {stats.engagement_rate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Reach</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {stats.reach > 0 ? stats.reach.toLocaleString() : '0'}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600">AI Tips</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {stats.recommendations_count}
            </div>
          </div>
        </div>

        {/* Recent Post Preview */}
        {stats.recent_post && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-slate-100">Latest Post</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed dark:text-slate-300">
              {stats.recent_post.caption || "No caption"}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {stats.recent_post.like_count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {stats.recent_post.comment_count.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-gray-600 ml-auto font-medium">
                {new Date(stats.recent_post.published_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* View Full Analytics Button */}
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all font-bold"
          onClick={handleNavigate}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Full Analytics
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
