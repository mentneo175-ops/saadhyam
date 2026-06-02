import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { env } from "@/config/env";
import {
  Phone,
  Users,
  TrendingUp,
  Activity,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/voice-agent/")({
  head: () => ({ meta: [{ title: "AI Voice Agent — Saadhyam AI" }] }),
  component: VoiceAgentDashboard,
});

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  language: string;
  total_contacts: number;
  calls_completed: number;
  calls_pending: number;
  calls_failed: number;
  conversion_rate: number;
  avg_call_duration: number;
  created_at: string;
}

function VoiceAgentDashboard() {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<"overview" | "campaigns">("overview");
  const [statsData, setStatsData] = useState<any>(null);
  const [campaignsData, setCampaignsData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("saadhyam_token");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const statsResponse = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token || ""}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (statsResponse.ok) setStatsData(await statsResponse.json());
      } catch (e) {}

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const campaignsResponse = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/campaigns`, {
          headers: { Authorization: `Bearer ${token || ""}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (campaignsResponse.ok) setCampaignsData(await campaignsResponse.json());
      } catch (e) {}
    };
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "paused":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "completed":
        return "bg-[#F3EEFF] text-[#8B5CF6] border-[#E9D5FF]";
      case "draft":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play size={12} />;
      case "paused":
        return <Pause size={12} />;
      case "completed":
        return <CheckCircle size={12} />;
      case "draft":
        return <Clock size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  const stats = statsData?.stats || {
    total_campaigns: 0,
    active_campaigns: 0,
    total_calls: 0,
    total_leads: 0,
  };
  const campaigns = campaignsData?.campaigns || [];

  const statCards = [
    {
      label: "Total Calls",
      value: statsData?.stats?.total_calls || 0,
      sub: `${statsData?.stats?.calls_today || 0} today`,
      icon: BarChart3,
      color: "from-[#8B5CF6] to-[#A855F7]",
      bg: "bg-[#F3EEFF]",
      text: "text-[#8B5CF6]",
    },
    {
      label: "Calls Processed",
      value: statsData?.stats?.total_calls || 0,
      sub: "Total processed",
      icon: Phone,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Leads Generated",
      value: statsData?.stats?.positive_leads || 0,
      sub: "Positive outcomes",
      icon: Users,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Active Campaigns",
      value: statsData?.stats?.active_campaigns || 0,
      sub: "Currently running",
      icon: Activity,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-8 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Phone size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Voice Agent</h1>
            <p className="text-sm text-gray-500 mt-0.5">Automated calling campaigns with AI-powered conversations</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => navigate({ to: "/dashboard/voice-agent/create-campaign" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all cursor-pointer"
          >
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-5 hover:shadow-xl hover:shadow-gray-100/80 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                <stat.icon size={18} className={stat.text} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {(["overview", "campaigns"] as const).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              selectedView === view
                ? "bg-white text-[#8B5CF6] shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {view === "overview" ? "Overview" : "All Campaigns"}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {selectedView === "overview" ? "Recent Campaigns" : "All Campaigns"}
        </h2>
        <div className="space-y-4">
          {(selectedView === "overview" ? campaigns.slice(0, 5) : campaigns).map(
            (campaign: Campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 p-6 hover:shadow-xl hover:shadow-gray-100/80 hover:border-[#8B5CF6]/20 transition-all duration-300 cursor-pointer group"
                onClick={() =>
                  navigate({ to: "/dashboard/voice-agent/campaigns/$campaignId", params: { campaignId: campaign.id.toString() } })
                }
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#8B5CF6] transition-colors truncate">
                        {campaign.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(campaign.status)}`}
                      >
                        {getStatusIcon(campaign.status)} {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {campaign.description || "No description"}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-gray-300 group-hover:text-[#8B5CF6] transition-colors shrink-0 ml-4"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Contacts",
                      value: campaign.total_contacts,
                      color: "text-gray-900",
                    },
                    {
                      label: "Completed",
                      value: campaign.calls_completed,
                      color: "text-emerald-600",
                    },
                    { label: "Pending", value: campaign.calls_pending, color: "text-amber-600" },
                    {
                      label: "Conversion",
                      value: `${(campaign.conversion_rate ?? 0).toFixed(1)}%`,
                      color: "text-[#8B5CF6]",
                    },
                  ].map((m, j) => (
                    <div key={j} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                      <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} /> Avg: {Math.round(campaign.avg_call_duration ?? 0)}s/call
                  </span>
                  <span>Language: {campaign.language}</span>
                </div>
              </div>
            ),
          )}

          {campaigns.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 flex items-center justify-center mx-auto mb-4">
                <Phone size={28} className="text-[#8B5CF6]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Create your first voice campaign to start automated calling with AI
              </p>
              <button
                onClick={() => navigate({ to: "/dashboard/voice-agent/create-campaign" })}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#8B5CF6]/25 transition-all"
              >
                <Plus size={16} /> Create Campaign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
