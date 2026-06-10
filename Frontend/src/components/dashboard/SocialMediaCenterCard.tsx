import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Instagram,
  Youtube,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Eye,
  Video,
  ArrowRight,
  Sparkles,
  BarChart3,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { motion, AnimatePresence } from "framer-motion";

interface InstagramStats {
  followers_count: number;
  follower_growth: number;
  engagement_rate: number;
  reach: number;
  recommendations_count: number;
  username: string;
  recent_post?: {
    caption: string;
    like_count: number;
    comment_count: number;
    published_at: string;
  };
}

interface YouTubeStats {
  channel_title: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  thumbnail_url: string;
  channel_id: string;
  latest_video?: {
    title: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    posted_time?: string;
    created_at: string;
    video_id?: string;
  };
}

export function SocialMediaCenterCard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"instagram" | "youtube">("instagram");
  const [loading, setLoading] = useState(true);

  // Instagram states
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramStats, setInstagramStats] = useState<InstagramStats | null>(null);

  // YouTube states
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeStats, setYoutubeStats] = useState<YouTubeStats | null>(null);

  useEffect(() => {
    loadAllSocialStats();
  }, []);

  const loadAllSocialStats = async () => {
    setLoading(true);
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // 1. Fetch Instagram stats
    try {
      const igConnResponse = await fetch(
        `${env.apiBaseUrl}/settings/instagram/connection-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (igConnResponse.ok) {
        const igConnData = await igConnResponse.json();
        if (igConnData.is_connected) {
          setInstagramConnected(true);
          const igAccResponse = await fetch(
            `${env.apiBaseUrl}/api/instagram-analytics/accounts/from-social`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (igAccResponse.ok) {
            const igAccData = await igAccResponse.json();
            if (igAccData.accounts && igAccData.accounts.length > 0) {
              const account = igAccData.accounts[0];
              const igDashResponse = await fetch(
                `${env.apiBaseUrl}/api/instagram-analytics/dashboard/${account.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (igDashResponse.ok) {
                const igDashData = await igDashResponse.json();
                setInstagramStats({
                  username: account.username,
                  followers_count: igDashData.overview.followers_count,
                  follower_growth: igDashData.overview.follower_growth,
                  engagement_rate: igDashData.overview.engagement_rate,
                  reach: igDashData.overview.reach,
                  recommendations_count: igDashData.recommendations.length,
                  recent_post: igDashData.recent_posts && igDashData.recent_posts.length > 0
                    ? {
                        caption: igDashData.recent_posts[0].caption,
                        like_count: igDashData.recent_posts[0].like_count,
                        comment_count: igDashData.recent_posts[0].comment_count,
                        published_at: igDashData.recent_posts[0].published_at,
                      }
                    : undefined,
                });
              }
            }
          }
        } else {
          setInstagramConnected(false);
        }
      }
    } catch (error) {
      console.error("Failed to load Instagram stats:", error);
    }

    // 2. Fetch YouTube stats
    try {
      const ytResponse = await fetch(`${env.apiBaseUrl}/api/youtube/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        if (ytData.channels && ytData.channels.length > 0) {
          setYoutubeConnected(true);
          const channel = ytData.channels[0];

          // Fetch videos to get the latest video
          let latestVideo = undefined;
          try {
            const videosRes = await fetch(`${env.apiBaseUrl}/api/youtube/videos`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            if (videosRes.ok) {
              const videosData = await videosRes.json();
              const postedVideos = (videosData.videos || []).filter(
                (v: any) => v.status === "posted"
              );
              if (postedVideos.length > 0) {
                latestVideo = {
                  title: postedVideos[0].title,
                  view_count: postedVideos[0].view_count,
                  like_count: postedVideos[0].like_count,
                  comment_count: postedVideos[0].comment_count,
                  posted_time: postedVideos[0].posted_time,
                  created_at: postedVideos[0].created_at,
                  video_id: postedVideos[0].video_id,
                };
              }
            }
          } catch (e) {
            console.error("Failed to load YouTube videos:", e);
          }

          setYoutubeStats({
            channel_title: channel.channel_title,
            subscriber_count: channel.subscriber_count,
            view_count: channel.view_count,
            video_count: channel.video_count,
            thumbnail_url: channel.thumbnail_url,
            channel_id: channel.channel_id,
            latest_video: latestVideo,
          });
        } else {
          setYoutubeConnected(false);
        }
      }
    } catch (error) {
      console.error("Failed to load YouTube stats:", error);
    }

    setLoading(false);
  };

  const handleNavigate = () => {
    if (activeTab === "instagram") {
      navigate({ to: "/dashboard/instagram" });
    } else {
      navigate({ to: "/dashboard/youtube" });
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="relative overflow-hidden bg-white rounded-2xl border border-purple-200/50 shadow-xl shadow-purple-200/50 h-full flex flex-col min-h-[460px] dark:bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30"></div>
        <div className="relative z-10 p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">Social Media Center</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Standardized loader component feel */}
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
              <span>Loading channels</span>
              <span className="inline-flex gap-0.5 items-center">
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s] dark:bg-slate-900"></span>
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s] dark:bg-slate-900"></span>
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce dark:bg-slate-900"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-purple-200/50 shadow-xl shadow-purple-200/50 hover:shadow-2xl hover:shadow-purple-300/50 transition-all duration-300 h-full flex flex-col min-h-[460px] dark:bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-pink-50/20 group-hover:from-purple-50/50 group-hover:to-pink-50/30 transition-all duration-300"></div>

      <div className="relative z-10 p-6 flex-1 flex flex-col">
        {/* Card Header & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">Social Media Center</h3>
            <p className="text-xs text-gray-600">Track and grow your channels</p>
          </div>

          {/* Social Media Selector Pill */}
          <div className="inline-flex rounded-xl bg-slate-100/80 p-1 border border-slate-200 self-start sm:self-auto dark:border-slate-800">
            <button
              onClick={() => setActiveTab("instagram")}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                activeTab === "instagram"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              Instagram
            </button>
            <button
              onClick={() => setActiveTab("youtube")}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                activeTab === "youtube"
                  ? "bg-[#FF0000] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              YouTube
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === "instagram" ? (
            <motion.div
              key="instagram"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between"
            >
              {!instagramConnected ? (
                // IG Not Connected State
                <div className="flex-1 flex flex-col justify-center text-center py-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Instagram className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-700 font-semibold mb-2 dark:text-slate-300">Connect Instagram</p>
                  <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                    Link your Business Instagram account to view followers, engagement rate, and get AI tips.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 transition-all font-bold py-5 rounded-xl"
                    onClick={handleNavigate}
                  >
                    Connect Instagram
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              ) : (
                // IG Connected State
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* IG Header Info */}
                    <div className="flex items-center justify-between mb-4 bg-white/55 p-3 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-5 h-5 text-pink-600" />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-300">@{instagramStats?.username}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200/50 text-[10px] font-bold">
                        Connected
                      </Badge>
                    </div>

                    {/* IG Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-purple-100 hover:border-purple-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[11px] font-semibold text-slate-500">Followers</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                            {instagramStats?.followers_count.toLocaleString()}
                          </span>
                          {instagramStats && instagramStats.follower_growth !== 0 && (
                            <span className={`text-[10px] flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-full ${instagramStats.follower_growth > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {instagramStats.follower_growth > 0 ? "+" : ""}
                              {instagramStats.follower_growth}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-pink-100 hover:border-pink-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Heart className="w-3.5 h-3.5 text-pink-500" />
                          <span className="text-[11px] font-semibold text-slate-500">Engagement</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          {instagramStats?.engagement_rate.toFixed(1)}%
                        </span>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-blue-100 hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[11px] font-semibold text-slate-500">Reach</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          {instagramStats && instagramStats.reach > 0 ? instagramStats.reach.toLocaleString() : "0"}
                        </span>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-amber-100 hover:border-amber-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] font-semibold text-slate-500">AI Tips</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          {instagramStats?.recommendations_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Recent Post */}
                    {instagramStats?.recent_post && (
                      <div className="bg-white/60 rounded-xl p-3 border border-purple-50 mb-4 text-left">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Latest Post</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {instagramStats.recent_post.caption || "No caption"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            {instagramStats.recent_post.like_count.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-blue-500 fill-blue-500" />
                            {instagramStats.recent_post.comment_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all font-bold py-5 rounded-xl text-sm"
                    onClick={handleNavigate}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Open Instagram Analytics
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="youtube"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between"
            >
              {!youtubeConnected ? (
                // YT Not Connected State
                <div className="flex-1 flex flex-col justify-center text-center py-6">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Youtube className="w-8 h-8 text-[#FF0000]" />
                  </div>
                  <p className="text-sm text-gray-700 font-semibold mb-2 dark:text-slate-300">Connect YouTube</p>
                  <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                    Connect your YouTube Channel to monitor subscribers, view counts, upload history, and schedule videos.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-[#FF0000] hover:bg-[#E60000] text-white shadow-lg shadow-red-500/20 transition-all font-bold py-5 rounded-xl"
                    onClick={handleNavigate}
                  >
                    Connect YouTube
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              ) : (
                // YT Connected State
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* YT Header Info */}
                    <div className="flex items-center justify-between mb-4 bg-white/55 p-3 rounded-xl border border-red-100">
                      <div className="flex items-center gap-2">
                        {youtubeStats?.thumbnail_url ? (
                          <img
                            src={youtubeStats.thumbnail_url}
                            alt={youtubeStats.channel_title}
                            className="w-5 h-5 rounded-full border border-red-200"
                          />
                        ) : (
                          <Youtube className="w-5 h-5 text-[#FF0000]" />
                        )}
                        <span className="font-bold text-sm text-slate-800 truncate max-w-[150px] dark:text-slate-300">
                          {youtubeStats?.channel_title}
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200/50 text-[10px] font-bold">
                        Connected
                      </Badge>
                    </div>

                    {/* YT Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-red-100 hover:border-red-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="w-3.5 h-3.5 text-[#FF0000]" />
                          <span className="text-[11px] font-semibold text-slate-500">Subscribers</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          {youtubeStats?.subscriber_count.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-purple-150 hover:border-purple-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-[11px] font-semibold text-slate-500">Total Views</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          {youtubeStats?.view_count.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-slate-100 hover:border-slate-300 transition-all dark:border-slate-800">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Video className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-[11px] font-semibold text-slate-500">Videos</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          {youtubeStats?.video_count.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3.5 border border-amber-100 hover:border-amber-300 transition-all">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] font-semibold text-slate-500">Growth Tips</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-300">
                          3
                        </span>
                      </div>
                    </div>

                    {/* Recent Video */}
                    {youtubeStats?.latest_video && (
                      <div className="bg-white/60 rounded-xl p-3 border border-red-50 mb-4 text-left">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Video className="w-3.5 h-3.5 text-[#FF0000]" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Latest Video</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {youtubeStats.latest_video.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-slate-500" />
                            {youtubeStats.latest_video.view_count.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            {youtubeStats.latest_video.like_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-[#FF0000] hover:bg-[#E60000] text-white shadow-lg shadow-red-500/25 transition-all font-bold py-5 rounded-xl text-sm"
                    onClick={handleNavigate}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Open YouTube Studio
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
