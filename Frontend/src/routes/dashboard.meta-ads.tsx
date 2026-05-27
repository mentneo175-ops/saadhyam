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
import { Loader2, Plus, TrendingUp, DollarSign, Target, Zap, Settings } from "lucide-react";
import { toast } from "sonner";
import { MetaConnectionWizard } from "@/components/meta-ads/MetaConnectionWizard";
import { CampaignCard } from "@/components/meta-ads/CampaignCard";
import {
  getMetaConnectionStatus,
  getCampaigns,
  getDashboardSummary,
  disconnectMetaAccount,
} from "@/lib/meta-ads-api";
import type { MetaConnectionStatus, Campaign, DashboardSummary } from "@/types/meta-ads";

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

      if (campaignsResult.success) {
        setCampaigns(campaignsResult.campaigns);
      } else {
        console.warn("Failed to load campaigns:", campaignsResult.error);
      }

      if (summaryResult.success) {
        setSummary(summaryResult.summary);
      } else {
        console.warn("Failed to load summary:", summaryResult.error);
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Connected</span>
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
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Total Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-900">{summary.total_campaigns}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900">{summary.active_campaigns}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Paused Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-900">{summary.paused_campaigns}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Daily Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900">
                ₹{summary.total_daily_spend.toLocaleString()}
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
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
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
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeCampaigns.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
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
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          {pausedCampaigns.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
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
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
