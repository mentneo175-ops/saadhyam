import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        "http://localhost:8000/settings/instagram/connection-status",
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
        "http://localhost:8000/api/instagram-analytics/accounts/from-social",
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
            `http://localhost:8000/api/instagram-analytics/dashboard/${account.id}`,
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
      <Card className="overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Instagram className="w-5 h-5 text-purple-600" />
            Instagram Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats?.is_connected) {
    return (
      <Card className="overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" onClick={handleNavigate}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Instagram className="w-5 h-5 text-purple-600" />
            Instagram Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center py-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Instagram className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Connect your Instagram to unlock powerful analytics
            </p>
            <Button 
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleNavigate}
            >
              Connect Instagram
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" onClick={handleNavigate}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Instagram className="w-4 h-4 text-purple-600" />
            Instagram Analytics
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
            Connected
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">@{stats.username}</p>
      </CardHeader>
      <CardContent className="space-y-2.5 flex-1 flex flex-col justify-between py-3">{/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Followers</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {stats.followers_count.toLocaleString()}
              </span>
              {stats.follower_growth !== 0 && (
                <span className={`text-xs flex items-center gap-0.5 ${stats.follower_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
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

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-pink-100">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="text-xs text-muted-foreground">Engagement</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.engagement_rate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Reach</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.reach > 0 ? stats.reach.toLocaleString() : '0'}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">AI Tips</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.recommendations_count}
            </div>
          </div>
        </div>

        {/* Recent Post Preview */}
        {stats.recent_post && (
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Latest Post</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {stats.recent_post.caption || "No caption"}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {stats.recent_post.like_count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {stats.recent_post.comment_count.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(stats.recent_post.published_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* View Full Analytics Button */}
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleNavigate}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Full Analytics
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
