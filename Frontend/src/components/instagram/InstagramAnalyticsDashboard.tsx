import { useState, useEffect } from "react";
import { useCooldown, formatCooldownTime } from "@/hooks/useCooldown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Loader2,
  RefreshCw,
  Sparkles,
  BarChart3,
  Calendar,
  Target,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { PromotePostModal } from "@/components/meta-ads/PromotePostModal";
import { Loader } from "@/components/ui/loader";
import { env } from "@/config/env";

interface AnalyticsAccount {
  id: number;
  username: string;
  sync_status: string;
  last_synced_at: string | null;
}

interface DashboardData {
  overview: {
    followers_count: number;
    follower_growth: number;
    follower_growth_rate: number;
    engagement_rate: number;
    impressions: number;
    reach: number;
    profile_views: number;
    website_clicks: number;
  };
  recent_posts: Array<{
    id: number;
    media_id: string;
    caption: string;
    like_count: number;
    comment_count: number;
    engagement_rate: number;
    published_at: string;
  }>;
  recommendations: Array<{
    id: number;
    title: string;
    recommendation: string;
    category: string;
    priority: string;
    confidence_score: number;
  }>;
}

export function InstagramAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [account, setAccount] = useState<AnalyticsAccount | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedPostForPromotion, setSelectedPostForPromotion] = useState<any>(null);
  
  // Cooldown for sync button (2 hours)
  const syncCooldown = useCooldown({
    cooldownMinutes: 120,
    storageKey: 'instagram-sync-cooldown',
  });

  useEffect(() => {
    initializeAnalytics();
  }, []);

  const initializeAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      // Get or create analytics account from existing Instagram connection
      const accountResponse = await fetch(
        `${env.apiBaseUrl}/api/instagram-analytics/accounts/from-social`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!accountResponse.ok) {
        throw new Error("Failed to get analytics account");
      }

      const accountData = await accountResponse.json();

      if (accountData.accounts && accountData.accounts.length > 0) {
        const analyticsAccount = accountData.accounts[0];
        setAccount(analyticsAccount);

        // If never synced, trigger initial sync
        if (!analyticsAccount.last_synced_at || analyticsAccount.sync_status === "pending") {
          toast.info("🔄 Starting initial analytics sync...", {
            description: "This may take a minute. We're fetching your Instagram data.",
          });
          await triggerSync(analyticsAccount.id);
        }

        // Load dashboard data
        await loadDashboard(analyticsAccount.id);
      } else {
        toast.error("No Instagram account found. Please connect Instagram first.");
      }
    } catch (error) {
      console.error("Failed to initialize analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (accountId: number) => {
    // Check cooldown
    if (!syncCooldown.canExecute) {
      toast.warning('Sync on Cooldown', {
        description: `Please wait ${formatCooldownTime(syncCooldown.remainingTime)} before syncing again.`,
      });
      return;
    }

    try {
      setSyncing(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch(
        `${env.apiBaseUrl}/api/instagram-analytics/sync/${accountId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("✅ Sync started successfully!");
        
        // Show syncing message
        toast.info("🔄 Syncing data... This may take 30 seconds", {
          duration: 5000,
        });
        
        // Poll for sync completion and load data
        setTimeout(async () => {
          try {
            await loadDashboard(accountId);
            toast.success("✅ Data refreshed successfully!");
            
            // Start cooldown ONLY after successfully getting complete data
            syncCooldown.execute();
          } catch (error) {
            console.error("Failed to load dashboard after sync:", error);
            toast.error("Sync completed but failed to load data. Please try again.");
            // Don't start cooldown if data loading failed
          }
        }, 5000);
      } else {
        throw new Error("Sync request failed");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync analytics");
      // Don't start cooldown if sync failed - user can retry
    } finally {
      setSyncing(false);
    }
  };

  const loadDashboard = async (accountId: number) => {
    try {
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch(
        `${env.apiBaseUrl}/api/instagram-analytics/dashboard/${accountId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    }
  };

  if (loading) {
    return <Loader text="Loading analytics" className="py-12" />;
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
        <p className="text-muted-foreground">
          Please connect your Instagram Business account first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            @{account.username} • Last synced:{" "}
            {account.last_synced_at
              ? new Date(account.last_synced_at).toLocaleString()
              : "Never"}
          </p>
        </div>
        <Button
          onClick={() => triggerSync(account.id)}
          disabled={syncing || !syncCooldown.canExecute}
          className="flex items-center gap-2"
          title={
            !syncCooldown.canExecute
              ? `Cooldown: ${formatCooldownTime(syncCooldown.remainingTime)}`
              : "Refresh Instagram data"
          }
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : !syncCooldown.canExecute ? (
            <>
              <RefreshCw className="w-4 h-4" />
              {formatCooldownTime(syncCooldown.remainingTime).split(' ')[0]}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </>
          )}
        </Button>
      </div>

      {dashboardData ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.followers_count.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {dashboardData.overview.follower_growth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span
                    className={
                      dashboardData.overview.follower_growth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {dashboardData.overview.follower_growth >= 0 ? "+" : ""}
                    {dashboardData.overview.follower_growth} (
                    {dashboardData.overview.follower_growth_rate.toFixed(1)}%)
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Engagement Rate
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.engagement_rate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average across all posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reach</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.reach.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.impressions.toLocaleString()}{" "}
                  impressions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Profile Views
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.overview.profile_views.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.website_clicks} website clicks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout: AI Recommendations (Left) and Recent Posts (Right) */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: AI Recommendations */}
            <div>
              {dashboardData.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dashboardData.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge
                            variant={
                              rec.priority === "high"
                                ? "destructive"
                                : rec.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.recommendation}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Confidence: {(rec.confidence_score * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span className="capitalize">{rec.category}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Recent Posts */}
            <div>
              {dashboardData.recent_posts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Posts Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.recent_posts.slice(0, 5).map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">
                              {post.caption || "No caption"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.published_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span>{post.like_count}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <MessageCircle className="w-4 h-4 text-blue-500" />
                              <span>{post.comment_count}</span>
                            </div>
                            <Badge variant="outline">
                              {post.engagement_rate.toFixed(1)}%
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPostForPromotion({
                                  id: post.id,
                                  media_id: post.media_id,
                                  image_url: "",
                                  caption: post.caption || "",
                                });
                                setShowPromoteModal(true);
                              }}
                              className="ml-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:text-purple-900"
                            >
                              <Megaphone className="w-3 h-3 mr-1" />
                              Promote
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Click "Refresh Data" to sync your Instagram analytics
          </p>
          <Button onClick={() => triggerSync(account.id)} disabled={syncing || !syncCooldown.canExecute}>
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : !syncCooldown.canExecute ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {formatCooldownTime(syncCooldown.remainingTime).split(' ')[0]}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Promote Post Modal */}
      {selectedPostForPromotion && (
        <PromotePostModal
          isOpen={showPromoteModal}
          onClose={() => {
            setShowPromoteModal(false);
            setSelectedPostForPromotion(null);
          }}
          post={selectedPostForPromotion}
          onSuccess={() => {
            toast.success("Campaign created! Check Meta Ads Manager.");
          }}
        />
      )}
    </div>
  );
}
