import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { YouTubeChannel, YouTubeVideo, YouTubeAnalyticsSummary } from "@/types/youtube";
import { YouTubeChannelCard } from "@/components/youtube/YouTubeChannelCard";
import { VideoCard } from "@/components/youtube/VideoCard";
import { VideoUploadForm } from "@/components/youtube/VideoUploadForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import {
  Youtube,
  Plus,
  Video,
  Calendar,
  Clock,
  RefreshCw,
  BarChart2,
  Loader2,
  Eye,
  Users,
  ThumbsUp,
  MessageSquare,
  Upload,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";
import { realtimeService } from "@/lib/realtimeService";

/* ─── helpers ──────────────────────────────────────────────── */

function formatErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string") return error.trim() ? error : fallback;
  if (Array.isArray(error)) {
    const messages = error
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const v = item as { msg?: unknown; loc?: unknown };
          if (typeof v.msg === "string" && v.msg.trim()) {
            if (Array.isArray(v.loc) && v.loc.length > 0) return `${v.loc.join(".")}: ${v.msg}`;
            return v.msg;
          }
        }
        return "";
      })
      .filter(Boolean);
    return messages.length > 0 ? messages.join("; ") : fallback;
  }
  if (error && typeof error === "object") {
    const e = error as { detail?: unknown; message?: unknown; error?: unknown };
    return (
      formatErrorMessage(e.detail, "") ||
      formatErrorMessage(e.message, "") ||
      formatErrorMessage(e.error, "") ||
      fallback
    );
  }
  return fallback;
}

function getAuthHeaders(): HeadersInit | null {
  const token = localStorage.getItem("saadhyam_token");
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function buildYoutubeApiUrls(path: string): string[] {
  const baseUrl = env.apiBaseUrl.replace(/\/+$/, "");
  const rootUrl = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
  return [`${baseUrl}${path}`, `${rootUrl}${path}`, path];
}

async function readErrorDetail(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return (
      [parsed?.message, parsed?.detail, parsed?.suggestion].filter(Boolean).join(" ") ||
      parsed?.error ||
      text
    );
  } catch {
    return text;
  }
}

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ─── route ─────────────────────────────────────────────────── */
export const Route = createFileRoute("/dashboard/youtube")({
  head: () => ({ meta: [{ title: "YouTube — Saadhyam AI" }] }),
  component: YouTubeDashboard,
});

type TabId = "upload" | "videos" | "scheduled" | "analytics";

const TABS: { id: TabId; label: string; Icon: typeof Video }[] = [
  { id: "upload", label: "Upload", Icon: Upload },
  { id: "videos", label: "Content", Icon: Video },
  { id: "scheduled", label: "Scheduled", Icon: Calendar },
  { id: "analytics", label: "Analytics", Icon: BarChart2 },
];

/* ─── component ─────────────────────────────────────────────── */
function YouTubeDashboard() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [analytics, setAnalytics] = useState<YouTubeAnalyticsSummary | null>(null);

  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  /* fetch channels */
  useEffect(() => {
    const run = async () => {
      setIsLoadingChannels(true);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setChannels([]);
          return;
        }
        const res = await fetch(`${env.apiBaseUrl}/api/youtube/accounts`, { headers });
        const data = await res.json();
        if (data.channels) setChannels(data.channels);
      } catch {
        logger.error("Failed to fetch YouTube channels");
      } finally {
        setIsLoadingChannels(false);
      }
    };
    run();
  }, [refreshTrigger]);

  /* fetch videos */
  useEffect(() => {
    const run = async () => {
      setIsLoadingVideos(true);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setVideos([]);
          return;
        }
        const res = await fetch(`${env.apiBaseUrl}/api/youtube/videos`, { headers });
        const data = await res.json();
        if (data.videos) setVideos(data.videos);
      } catch {
        logger.error("Failed to fetch videos list");
      } finally {
        setIsLoadingVideos(false);
      }
    };
    run();
  }, [refreshTrigger]);

  /* fetch analytics */
  useEffect(() => {
    if (activeTab === "analytics" && channels.length > 0) {
      const run = async () => {
        setIsLoadingAnalytics(true);
        try {
          const headers = getAuthHeaders();
          if (!headers) {
            setAnalytics(null);
            return;
          }
          const res = await fetch(
            `${env.apiBaseUrl}/api/youtube/analytics/channel/${channels[0].id}`,
            { headers },
          );
          const data = await res.json();
          setAnalytics(data);
        } catch {
          logger.error("Failed to fetch analytics");
        } finally {
          setIsLoadingAnalytics(false);
        }
      };
      run();
    }
  }, [activeTab, channels, refreshTrigger]);

  /* realtime */
  useEffect(() => {
    const handler = (data: any) => {
      try {
        const payload = data?.notification || data;
        if (!payload) return;
        const currentChannel = channels[0];
        if (payload.type === "youtube_analytics") {
          if (!currentChannel || payload.channel_id !== currentChannel.id) return;
          setAnalytics((prev) => ({ ...prev, ...payload.metrics }) as any);
        }
        if (payload.type === "youtube_videos_update") {
          const updates = payload.updates || [];
          if (!updates.length) return;
          setVideos((current) => {
            const byId = new Map(current.map((v) => [v.id, v]));
            for (const u of updates) {
              const existing = byId.get(u.id);
              if (existing) byId.set(u.id, { ...existing, ...u });
            }
            return Array.from(byId.values()).sort((a, b) => {
              if ((b.posted_time || "") > (a.posted_time || "")) return 1;
              if ((b.posted_time || "") < (a.posted_time || "")) return -1;
              return 0;
            });
          });
        }
      } catch (err) {
        console.warn("Realtime handler error:", err);
      }
    };
    realtimeService.on("notification", handler);
    return () => {
      realtimeService.off("notification", handler);
    };
  }, [channels]);

  /* connect YouTube */
  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/youtube/auth/connect`);
      const data = await res.json();
      if (!data.oauth_url) {
        toast.error("OAuth URL not received");
        setIsConnecting(false);
        return;
      }
      const w = 600,
        h = 650;
      const popup = window.open(
        data.oauth_url,
        "youtube-oauth",
        `width=${w},height=${h},left=${window.screen.width / 2 - w / 2},top=${window.screen.height / 2 - h / 2}`,
      );
      if (!popup) {
        toast.error("Popup blocked! Please allow popups for this site.");
        setIsConnecting(false);
        return;
      }

      let timer: any = null;

      const listener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === "youtube-oauth-success") {
          if (timer) clearInterval(timer);
          window.removeEventListener("message", listener);
          popup.close();
          const token = localStorage.getItem("saadhyam_token");
          if (!token) {
            toast.error("Please sign in again before connecting YouTube.", { id: "yt-connect" });
            setIsConnecting(false);
            return;
          }
          toast.loading("Completing connection...", { id: "yt-connect" });
          try {
            const cbRes = await fetch(`${env.apiBaseUrl}/api/youtube/auth/callback`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ code: event.data.data.code, state: event.data.data.state }),
            });
            if (cbRes.ok) {
              toast.success("YouTube channel connected!", { id: "yt-connect" });
              setRefreshTrigger((p) => p + 1);
            } else {
              const errData = await cbRes.json();
              toast.error(
                formatErrorMessage(errData?.detail, "Failed to complete YouTube OAuth linkage"),
                { id: "yt-connect" },
              );
            }
          } catch (err) {
            toast.error(formatErrorMessage(err, "Connection failed during API exchange"), {
              id: "yt-connect",
            });
          } finally {
            setIsConnecting(false);
          }
        }
        if (event.data.type === "youtube-oauth-error") {
          if (timer) clearInterval(timer);
          window.removeEventListener("message", listener);
          popup.close();
          toast.error(
            `Authorization failed: ${formatErrorMessage(event.data.error, "Unknown OAuth error")}`,
          );
          setIsConnecting(false);
        }
      };

      window.addEventListener("message", listener);

      timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener("message", listener);
          setIsConnecting(false);
        }
      }, 1000);
    } catch {
      toast.error("Failed to start Google connection flow");
      setIsConnecting(false);
    }
  };

  /* disconnect */
  const handleDisconnectChannel = async (channelId: number) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        toast.error("Please sign in again before disconnecting YouTube.");
        return;
      }
      const res = await fetch(`${env.apiBaseUrl}/api/youtube/accounts/${channelId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) setRefreshTrigger((p) => p + 1);
      else throw new Error("Failed disconnect");
    } catch {
      toast.error("Failed to disconnect YouTube account");
    }
  };

  /* submit video */
  const handleVideoSubmit = async (payload: any) => {
    const isSchedule = !!payload.scheduled_time;
    const endpoints = isSchedule
      ? buildYoutubeApiUrls("/api/youtube/schedule")
      : buildYoutubeApiUrls("/api/youtube/post");
    const headers = getAuthHeaders();
    if (!headers) throw new Error("Please sign in again before uploading a YouTube video");
    let created: any = null,
      lastError = "Failed to upload video";
    for (const ep of endpoints) {
      const res = await fetch(ep, { method: "POST", headers, body: JSON.stringify(payload) });
      if (res.ok) {
        created = await res.json();
        break;
      }
      lastError = await readErrorDetail(res);
      if (res.status !== 404) break;
    }
    if (!created) throw new Error(lastError);
    setVideos((cur) => [created, ...cur.filter((v) => v.id !== created.id)]);
    setChannels((cur) =>
      cur.map((c) =>
        c.id === created.channel_id ? { ...c, video_count: (c.video_count || 0) + 1 } : c,
      ),
    );
    setActiveTab(isSchedule ? "scheduled" : "videos");
  };

  /* delete */
  const handleVideoDelete = async (videoDbId: number) => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error("Please sign in again before deleting a YouTube video record");
    const res = await fetch(`${env.apiBaseUrl}/api/youtube/videos/${videoDbId}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) setRefreshTrigger((p) => p + 1);
    else throw new Error("Failed to delete video record");
  };

  const publishedVideos = videos.filter((v) => v.status === "posted");
  const scheduledVideos = videos.filter((v) =>
    ["scheduled", "pending", "publishing"].includes(v.status),
  );
  /* ── loading state ── */
  if (isLoadingChannels) {
    return <Loader text="Loading YouTube Studio" className="min-h-[70vh]" />;
  }
  const isConnected = channels.length > 0;
  const activeChannel = channels[0];

  /* ── not connected ── */
  if (!isConnected) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-5xl mx-auto flex flex-col justify-center min-h-[70vh]">
        <PageHeader
          title="YouTube"
          subtitle="Manage your YouTube channel, publish videos, and view live analytics."
        />

        <Card className="border border-purple-100 dark:border-slate-800 shadow-xl shadow-purple-50/20 dark:shadow-none max-w-xl mx-auto w-full overflow-hidden bg-white/70 dark:bg-slate-950/40 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />
          <CardContent className="py-12 px-6 md:px-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-50/50 dark:ring-red-900/30">
              <Youtube className="w-9 h-9 text-red-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
              Connect your YouTube Channel
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm text-sm leading-relaxed">
              Link your channel to upload videos, schedule content, and track performance analytics
              — all in one native dashboard.
            </p>

            <Button
              onClick={handleConnectYouTube}
              disabled={isConnecting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-950/50 px-8 py-6 text-base group transition-all duration-300 hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting in popup...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" />
                  Sign in with Google
                </>
              )}
            </Button>

            {isConnecting && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-4 animate-pulse font-medium">
                Please complete the authorization in the opened popup...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── main connected view ── */
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-full mx-auto">
      {/* Page Header */}
      <div className="flex items-start md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <PageHeader
            title="YouTube Studio"
            subtitle={`Connected as ${activeChannel.channel_title}`}
          />
        </div>

        {/* Right column on small screens: compact profile on top, controls below */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 lg:hidden">
            <img
              src={activeChannel.thumbnail_url || "/placeholder-avatar.png"}
              alt={activeChannel.channel_title}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
            <div className="text-sm">
              <div className="font-semibold text-slate-800 leading-tight dark:text-slate-300">
                {activeChannel.channel_title}
              </div>
              <div className="text-xs text-slate-500">
                {formatBig(activeChannel.subscriber_count)} subs
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">Connected</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshTrigger((p) => p + 1)}
              className="border-purple-200 hover:bg-purple-50 text-purple-700"
              title="Sync all data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border border-purple-100/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Subscribers
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                {formatBig(activeChannel.subscriber_count)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Views
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                {formatBig(activeChannel.view_count)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Videos
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                {activeChannel.video_count}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section (Upload, list, etc.) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as TabId)}
            className="w-full space-y-6"
          >
            <TabsList className="bg-slate-100/80 border border-slate-200/50 p-1 rounded-xl w-full max-w-md flex">
              {TABS.map(({ id, label, Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs text-slate-600 hover:text-slate-900 focus-visible:outline-hidden"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  {id === "videos" && publishedVideos.length > 0 && (
                    <span className="ml-1.5 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {publishedVideos.length}
                    </span>
                  )}
                  {id === "scheduled" && scheduledVideos.length > 0 && (
                    <span className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {scheduledVideos.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="focus-visible:outline-hidden mt-0">
              <VideoUploadForm channelDbId={activeChannel.id} onSubmit={handleVideoSubmit} />
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="focus-visible:outline-hidden mt-0">
              {isLoadingVideos ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs dark:bg-slate-900 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500">Loading videos list...</p>
                </div>
              ) : publishedVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-2xl text-center max-w-lg mx-auto shadow-xs dark:bg-slate-900 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 dark:bg-slate-900">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1 dark:text-slate-300">No videos yet</h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Upload your first video to see it here.
                  </p>
                  <Button
                    onClick={() => setActiveTab("upload")}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 rounded-xl px-4 py-2"
                  >
                    <Upload className="w-4 h-4" /> Upload a Video
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {publishedVideos.map((v) => (
                    <VideoCard key={v.id} video={v} onDelete={handleVideoDelete} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Scheduled Tab */}
            <TabsContent value="scheduled" className="focus-visible:outline-hidden mt-0">
              {isLoadingVideos ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs dark:bg-slate-900 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500">Loading scheduled list...</p>
                </div>
              ) : scheduledVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-2xl text-center max-w-lg mx-auto shadow-xs dark:bg-slate-900 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 dark:bg-slate-900">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1 dark:text-slate-300">No scheduled uploads</h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Schedule a video to publish it at a specific time.
                  </p>
                  <Button
                    onClick={() => setActiveTab("upload")}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 rounded-xl px-4 py-2"
                  >
                    <Calendar className="w-4 h-4" /> Schedule a Video
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {scheduledVideos.map((v) => (
                    <VideoCard key={v.id} video={v} onDelete={handleVideoDelete} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="focus-visible:outline-hidden mt-0">
              {isLoadingAnalytics ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs dark:bg-slate-900 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500">
                    Fetching live analytics from YouTube...
                  </p>
                </div>
              ) : !analytics ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-2xl text-center max-w-lg mx-auto shadow-xs dark:bg-slate-900 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-400 dark:bg-slate-900">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1 dark:text-slate-300">No analytics data</h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Analytics require at least one published video and a valid token.
                  </p>
                  <Button
                    onClick={() => setRefreshTrigger((p) => p + 1)}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 rounded-xl px-4 py-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Live badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-700">
                      Live data from YouTube Analytics
                    </span>
                  </div>

                  {/* KPI grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    <Card className="border border-slate-100 shadow-xs hover:border-blue-200 transition-colors bg-white dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Views</p>
                          <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                            {formatBig(analytics.views)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-100 shadow-xs hover:border-purple-200 transition-colors bg-white dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Watch Time (min)</p>
                          <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                            {formatBig(analytics.watch_time_minutes)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-100 shadow-xs hover:border-green-200 transition-colors bg-white dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Subs Gained</p>
                          <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                            +{formatBig(analytics.subscribers_gained)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-100 shadow-xs hover:border-pink-200 transition-colors bg-white dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                          <ThumbsUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Likes</p>
                          <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                            {formatBig(analytics.likes)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-100 shadow-xs hover:border-yellow-200 transition-colors bg-white dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Comments</p>
                          <p className="text-2xl font-bold text-slate-800 mt-0.5 dark:text-slate-300">
                            {formatBig(analytics.comments)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      Trend charts will appear once the API provides time-series data. The values
                      above reflect your current live YouTube Analytics summary.
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar (Channel Card) - desktop only */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <YouTubeChannelCard
            channel={activeChannel}
            onDisconnect={handleDisconnectChannel}
            onRefresh={() => setRefreshTrigger((p) => p + 1)}
          />
        </div>
      </div>
    </div>
  );
}

const logger = {
  error: (msg: string) => console.error(`[YouTube Dashboard]: ${msg}`),
  info: (msg: string) => console.log(`[YouTube Dashboard]: ${msg}`),
};
