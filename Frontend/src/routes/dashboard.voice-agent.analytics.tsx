import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Phone,
  Users,
  Clock,
  Target,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/voice-agent/analytics")({
  component: AnalyticsPage,
});

interface Campaign {
  id: number;
  name: string;
  calls_completed: number;
  calls_failed: number;
  conversion_rate: number;
  avg_call_duration: number;
  language: string;
}

interface Call {
  id: number;
  duration: number;
  customer_sentiment: string;
  call_outcome: string;
  created_at: string;
}

const COLORS = {
  primary: "#9333ea",
  secondary: "#ec4899",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#9333ea",
  pink: "#ec4899",
  green: "#10b981",
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#f59e0b",
  gray: "#6b7280",
};

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  // Fetch campaigns
  const { data: campaignsData } = useQuery<{ success: boolean; campaigns: Campaign[] }>({
    queryKey: ["voice-agent-campaigns"],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/api/v2/voice-agent/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  // Fetch all calls for analytics
  const { data: callsData, isLoading } = useQuery<{ success: boolean; calls: Call[] }>({
    queryKey: ["voice-agent-analytics-calls"],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const allCalls: Call[] = [];
      
      if (campaignsData?.campaigns) {
        for (const campaign of campaignsData.campaigns) {
          const response = await fetch(
            `${env.apiBaseUrl}/api/voice-agent/campaigns/${campaign.id}/calls`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const result = await response.json();
          if (result.success && result.calls) {
            allCalls.push(...result.calls);
          }
        }
      }
      
      return { success: true, calls: allCalls };
    },
    enabled: !!campaignsData?.campaigns,
  });

  // Calculate analytics data
  const campaigns = campaignsData?.campaigns || [];
  const calls = callsData?.calls || [];

  // Conversion Funnel Data
  const totalCalls = calls.length;
  const answeredCalls = calls.filter((c) => c.call_outcome !== "not_available").length;
  const interestedCalls = calls.filter((c) => c.call_outcome === "interested").length;
  const convertedCalls = calls.filter((c) => c.call_outcome === "interested").length; // Simplified

  const funnelData = [
    { name: "Total Calls", value: totalCalls, fill: COLORS.purple },
    { name: "Answered", value: answeredCalls, fill: COLORS.blue },
    { name: "Interested", value: interestedCalls, fill: COLORS.green },
    { name: "Converted", value: convertedCalls, fill: COLORS.success },
  ];

  // Sentiment Distribution
  const sentimentData = [
    {
      name: "Positive",
      value: calls.filter((c) => c.customer_sentiment?.toLowerCase() === "positive").length,
      fill: COLORS.green,
    },
    {
      name: "Neutral",
      value: calls.filter((c) => c.customer_sentiment?.toLowerCase() === "neutral").length,
      fill: COLORS.gray,
    },
    {
      name: "Negative",
      value: calls.filter((c) => c.customer_sentiment?.toLowerCase() === "negative").length,
      fill: COLORS.red,
    },
  ];

  // Campaign Performance
  const campaignPerformanceData = campaigns.map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
    completed: c.calls_completed,
    failed: c.calls_failed,
    conversion: c.conversion_rate,
  }));

  // Language Performance
  const languageStats = campaigns.reduce((acc: any, c) => {
    const lang = c.language || "english";
    if (!acc[lang]) {
      acc[lang] = { completed: 0, failed: 0, total: 0 };
    }
    acc[lang].completed += c.calls_completed;
    acc[lang].failed += c.calls_failed;
    acc[lang].total += c.calls_completed + c.calls_failed;
    return acc;
  }, {});

  const languageData = Object.keys(languageStats).map((lang) => ({
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    successRate: languageStats[lang].total > 0
      ? ((languageStats[lang].completed / languageStats[lang].total) * 100).toFixed(1)
      : 0,
    total: languageStats[lang].total,
  }));

  // Call Duration Distribution
  const durationRanges = [
    { name: "0-30s", min: 0, max: 30, count: 0 },
    { name: "30-60s", min: 30, max: 60, count: 0 },
    { name: "60-90s", min: 60, max: 90, count: 0 },
    { name: "90-120s", min: 90, max: 120, count: 0 },
    { name: "120s+", min: 120, max: Infinity, count: 0 },
  ];

  calls.forEach((call) => {
    const duration = call.duration || 0;
    const range = durationRanges.find((r) => duration >= r.min && duration < r.max);
    if (range) range.count++;
  });

  const durationData = durationRanges.map((r) => ({
    name: r.name,
    count: r.count,
  }));

  // Daily Trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const dailyTrendData = last7Days.map((date) => {
    const dayCalls = calls.filter((c) => c.created_at?.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calls: dayCalls.length,
      interested: dayCalls.filter((c) => c.call_outcome === "interested").length,
    };
  });

  // Outcome Distribution
  const outcomeData = [
    {
      name: "Interested",
      value: calls.filter((c) => c.call_outcome === "interested").length,
      fill: COLORS.green,
    },
    {
      name: "Not Interested",
      value: calls.filter((c) => c.call_outcome === "not_interested").length,
      fill: COLORS.red,
    },
    {
      name: "Callback",
      value: calls.filter((c) => c.call_outcome === "callback_requested").length,
      fill: COLORS.blue,
    },
    {
      name: "Not Available",
      value: calls.filter((c) => c.call_outcome === "not_available").length,
      fill: COLORS.gray,
    },
  ];

  // Key Metrics
  const avgDuration = calls.length > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
    : 0;

  const answerRate = totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : "0";
  const conversionRate = answeredCalls > 0 ? ((interestedCalls / answeredCalls) * 100).toFixed(1) : "0";
  const positiveRate = calls.length > 0
    ? ((calls.filter((c) => c.customer_sentiment === "positive").length / calls.length) * 100).toFixed(1)
    : "0";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Voice Agent Analytics
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/dashboard/voice-agent"}>
            Back to Dashboard
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Download size={20} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Answer Rate</p>
                <p className="text-3xl font-bold text-purple-600">{answerRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{answeredCalls} / {totalCalls} calls</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Phone size={24} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">{interestedCalls} interested</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Target size={24} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive Sentiment</p>
                <p className="text-3xl font-bold text-blue-600">{positiveRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Customer satisfaction</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.floor(avgDuration / 60)}:{(avgDuration % 60).toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per call</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Call journey from start to conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="value" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Call Trend</CardTitle>
            <CardDescription>Calls and conversions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                  name="Total Calls"
                />
                <Line
                  type="monotone"
                  dataKey="interested"
                  stroke={COLORS.green}
                  strokeWidth={2}
                  name="Interested"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Customer sentiment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Outcome Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
            <CardDescription>Distribution of call results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Completed vs failed calls by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill={COLORS.green} name="Completed" />
                <Bar dataKey="failed" fill={COLORS.red} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Call Duration Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Call Duration Distribution</CardTitle>
            <CardDescription>How long calls typically last</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Language Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Language Performance</CardTitle>
          <CardDescription>Success rates across different languages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={languageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successRate" fill={COLORS.blue} name="Success Rate (%)" />
              <Bar dataKey="total" fill={COLORS.gray} name="Total Calls" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
