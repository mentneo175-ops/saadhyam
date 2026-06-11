/**
 * Meta Ads Dashboard
 * Complete dashboard for managing Meta ad campaigns
 */

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Loader } from "@/components/ui/loader";
import {
  Loader2,
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  Settings,
  Eye,
  Calendar,
  Sparkles,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { MetaConnectionWizard } from "@/components/meta-ads/MetaConnectionWizard";
import { CampaignCard } from "@/components/meta-ads/CampaignCard";
import {
  getMetaConnectionStatus,
  getCampaigns,
  getDashboardSummary,
  disconnectMetaAccount,
  getCampaignAnalytics,
} from "@/lib/meta-ads-api";
import type { MetaConnectionStatus, Campaign, DashboardSummary, CampaignAnalytics } from "@/types/meta-ads";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/meta-ads")({
  head: () => ({ meta: [{ title: "Meta Ads — Saadhyam AI" }] }),
  component: MetaAdsPage,
});

function MetaAdsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<MetaConnectionStatus>({
    is_connected: false,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Campaign details dialog state
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<Campaign | null>(null);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const status = await getMetaConnectionStatus();
      setConnectionStatus(status);

      if (status.is_connected) {
        await loadData();
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [campaignsResult, summaryResult] = await Promise.all([
        getCampaigns().catch(err => ({ success: false, error: err.message })),
        getDashboardSummary().catch(err => ({ success: false, error: err.message })),
      ]);

      if (campaignsResult.success && "campaigns" in campaignsResult) {
        setCampaigns(campaignsResult.campaigns);
      } else {
        console.warn("Failed to load campaigns:", "error" in campaignsResult ? campaignsResult.error : "Unknown error");
      }

      if (summaryResult.success && "summary" in summaryResult) {
        setSummary(summaryResult.summary);
      } else {
        console.warn("Failed to load summary:", "error" in summaryResult ? summaryResult.error : "Unknown error");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load campaigns");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Meta Ads account?")) {
      return;
    }

    setDisconnecting(true);
    try {
      await disconnectMetaAccount();
      toast.success("Meta Ads account disconnected");
      setConnectionStatus({ is_connected: false });
      setCampaigns([]);
      setSummary(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleViewDetails = async (campaign: Campaign) => {
    setSelectedCampaignForDetails(campaign);
    setCampaignDetailsOpen(true);
    setAnalyticsLoading(true);
    setCampaignAnalytics(null);

    try {
      const result = await getCampaignAnalytics(campaign.id);
      if (result.success && result.analytics) {
        setCampaignAnalytics(result.analytics);
      } else {
        toast.error("Failed to load campaign analytics");
      }
    } catch (error: any) {
      console.error("Error fetching campaign analytics:", error);
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getObjectiveLabel = (objective: string) => {
    const labels: Record<string, string> = {
      OUTCOME_TRAFFIC: "Traffic",
      OUTCOME_ENGAGEMENT: "Engagement",
      OUTCOME_AWARENESS: "Awareness",
      OUTCOME_LEADS: "Leads",
      OUTCOME_SALES: "Sales",
    };
    return labels[objective] || objective;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50">Active</Badge>;
      case "PAUSED":
        return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50">Paused</Badge>;
      case "DELETED":
        return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!mounted) return null;

  if (loading) {
    return <Loader text="Loading Meta Ads" className="min-h-full py-20" />;
  }

  // Show connection wizard if not connected
  if (!connectionStatus.is_connected || showConnectionWizard) {
    return (
      <MetaConnectionWizard
        onSuccess={() => {
          setShowConnectionWizard(false);
          checkConnection();
        }}
      />
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const pausedCampaigns = campaigns.filter((c) => c.status === "PAUSED");

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Meta Ads"
          subtitle={`Connected as ${connectionStatus.ad_account_name || connectionStatus.ad_account_id}`}
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Connected</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Disconnect
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-purple-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Total Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{summary.total_campaigns}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-green-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{summary.active_campaigns}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-yellow-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                Paused Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{summary.paused_campaigns}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-blue-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Daily Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                ₹{(summary?.total_daily_spend ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">
            All ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({pausedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {campaigns.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 dark:border-slate-700">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">No campaigns yet</h3>
                <p className="text-gray-600 mb-4">
                  Go to Instagram page and click "Promote Post" to create your first campaign
                </p>
                <Button
                  onClick={() => (window.location.href = "/dashboard/instagram")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Go to Instagram
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onUpdate={loadData}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeCampaigns.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 dark:border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No active campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onUpdate={loadData}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          {pausedCampaigns.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 dark:border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No paused campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pausedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onUpdate={loadData}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Campaign Details Dialog */}
      <Dialog open={campaignDetailsOpen} onOpenChange={setCampaignDetailsOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/80 text-foreground">
          {selectedCampaignForDetails && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedCampaignForDetails.status)}
                  <span className="text-xs text-muted-foreground">• ID: {selectedCampaignForDetails.campaign_id || selectedCampaignForDetails.id}</span>
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {selectedCampaignForDetails.name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Detailed report and performance stats for this campaign.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs">AI Recommendations</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs">Performance</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 border rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Objective</p>
                      <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50">
                        {getObjectiveLabel(selectedCampaignForDetails.objective)}
                      </Badge>
                    </div>

                    <div className="p-3 bg-muted/30 border rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Daily Budget</p>
                      <p className="text-lg font-bold text-foreground">
                        ₹{selectedCampaignForDetails.daily_budget?.toLocaleString() || "0"}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/30 border rounded-xl col-span-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Created At</p>
                        <p className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(selectedCampaignForDetails.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                        <p className="text-sm text-slate-500">
                          {new Date(selectedCampaignForDetails.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* AI Recommendations Tab */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                  {selectedCampaignForDetails.ai_recommendations ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {/* Audience Rec */}
                      {selectedCampaignForDetails.ai_recommendations.audience && (
                        <div className="p-4 bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/20 rounded-xl space-y-3">
                          <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                            <Sparkles size={14} /> Recommended Audience
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Age Range: </span>
                              <span className="font-semibold text-foreground">{selectedCampaignForDetails.ai_recommendations.audience.recommended_age_min} - {selectedCampaignForDetails.ai_recommendations.audience.recommended_age_max}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Genders: </span>
                              <span className="font-semibold text-foreground">{selectedCampaignForDetails.ai_recommendations.audience.recommended_genders.join(", ")}</span>
                            </div>
                          </div>
                          {selectedCampaignForDetails.ai_recommendations.audience.reasoning && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-white/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-border/40">
                              {selectedCampaignForDetails.ai_recommendations.audience.reasoning}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Budget Rec */}
                      {selectedCampaignForDetails.ai_recommendations.budget && (
                        <div className="p-4 bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/20 rounded-xl space-y-3">
                          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <DollarSign size={14} /> Budget Optimization
                          </h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Est. CPC: </span>
                              <span className="font-semibold text-foreground">₹{(selectedCampaignForDetails.ai_recommendations.budget.estimated_cpc ?? 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Est. CPM: </span>
                              <span className="font-semibold text-foreground">₹{(selectedCampaignForDetails.ai_recommendations.budget.estimated_cpm ?? 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration: </span>
                              <span className="font-semibold text-foreground">{selectedCampaignForDetails.ai_recommendations.budget.recommended_duration_days} days</span>
                            </div>
                          </div>
                          {selectedCampaignForDetails.ai_recommendations.budget.reasoning && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-white/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-border/40">
                              {selectedCampaignForDetails.ai_recommendations.budget.reasoning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-muted/10 border border-dashed rounded-xl">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No AI recommendations generated for this campaign.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Performance Analytics Tab */}
                <TabsContent value="analytics" className="mt-4">
                  {analyticsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground">Fetching live Meta ad metrics...</p>
                    </div>
                  ) : campaignAnalytics ? (
                    <div className="space-y-4">
                      {/* Metric Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/20 border rounded-xl text-center">
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">Spend</p>
                          <p className="text-lg font-bold text-foreground">₹{(campaignAnalytics?.spend ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-muted/20 border rounded-xl text-center">
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">Clicks</p>
                          <p className="text-lg font-bold text-foreground">{(campaignAnalytics?.clicks ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-muted/20 border rounded-xl text-center">
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">Impressions</p>
                          <p className="text-lg font-bold text-foreground">{(campaignAnalytics?.impressions ?? 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/20 border rounded-xl">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">CTR (Click-Through)</span>
                            <span className="font-bold text-foreground">{((campaignAnalytics?.ctr ?? 0) * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${Math.min(100, (campaignAnalytics?.ctr ?? 0) * 1000)}%` }} />
                          </div>
                        </div>

                        <div className="p-3 bg-muted/20 border rounded-xl">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">CPC (Cost Per Click)</span>
                            <span className="font-bold text-foreground">₹{(campaignAnalytics?.cpc ?? 0).toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">Average cost per click-through</p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/20 border rounded-xl flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                          <BarChart3 size={14} className="text-blue-500" /> CPM (Cost Per Mille)
                        </span>
                        <span className="font-bold text-foreground">₹{(campaignAnalytics?.cpm ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-muted/10 border border-dashed rounded-xl">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Unable to load campaign analytics. Please verify Facebook API keys are active.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
