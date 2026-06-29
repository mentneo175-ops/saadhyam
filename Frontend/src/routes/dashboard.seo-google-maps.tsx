import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  RefreshCw,
  Globe,
  Lock,
  Unlock,
  Settings,
  Link as LinkIcon,
  MapPin,
  TrendingUp,
  BarChart as BarChartIcon,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Shield,
  Activity,
  Loader2,
  Search,
  HelpCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SEOLayout } from "@/components/seo/SEOLayout";
import {
  SEOPageHeader,
  SEOTabSwitcher,
  LoadingState,
  AnalyzingState,
  NotStartedState,
  ErrorState,
  QuickActionsGrid,
  ProTipsBanner,
  EmptyInsightsState,
  type SEOTabId,
} from "@/components/seo/SEOShared";
import { SEOTabPanel, MapsTabPanel } from "@/components/seo/SEOTabPanels";
import { computeSEOScore, computeMapsScore } from "@/components/seo/utils";
import { SEOScoreGauge } from "@/components/seo/SEOVisualizations";
import {
  getSEOGoogleMapsData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type SEOGoogleMapsData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";
import {
  getGoogleApiMetrics,
  getIntegrationsStatus,
  getAutopilotSettings,
  updateAutopilotSettings,
} from "@/lib/aeoGeoApi";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";

export const Route = createFileRoute("/dashboard/seo-google-maps")({
  head: () => ({ meta: [{ title: "Google Hub — Saadhyam AI" }] }),
  component: SEOGoogleMapsPage,
});

function SEOGoogleMapsPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SEOGoogleMapsData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-gmaps-profile",
      title: "Connection Status",
      heading: "1. Google Integration Center",
      desc: "Connect your Google Suite to sync real-time reviews, metrics, and local profiles.",
      indicator: 1
    },
    {
      id: "tour-gmaps-scores",
      title: "Authority Scores",
      heading: "2. SEO & Maps Health Gauges",
      desc: "Scores generated based on directory citations, review sentiment, and keyword authority.",
      indicator: 2
    },
    {
      id: "tour-gmaps-keywords",
      title: "Keywords Audit",
      heading: "3. Keyword Insights",
      desc: "Displays keyword relevance, search volumes, search spikes, and targeted SEO copy recommendations.",
      indicator: 3
    },
    {
      id: "tour-gmaps-citations",
      title: "Citations List",
      heading: "4. Business Profile & Citations",
      desc: "Verify your address matching and synchronization across Google Business Profile and other directories.",
      indicator: 4
    }
  ];

  // Auto-trigger tour for new users once data has loaded
  useEffect(() => {
    if (analysis) {
      const isCompleted = localStorage.getItem("saadhyam_tour_gmaps_completed");
      if (!isCompleted) {
        const timer = setTimeout(() => {
          setIsTourActive(true);
          setTourStep(1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [analysis]);

  // Filter active steps based on DOM presence
  useEffect(() => {
    if (isTourActive) {
      const active = tourStepsConfig.filter(step => !!document.getElementById(step.id));
      setActiveTourSteps(active);
      if (tourStep > active.length && active.length > 0) {
        setTourStep(1);
      }
    }
  }, [isTourActive]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (currentStepConfig) {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }
    }
  }, [tourStep, isTourActive, activeTourSteps]);

  // Position tracking logic supporting scrolling and window resizing
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (!currentStepConfig) return;

    const updatePosition = () => {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        setHighlightStyle({
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          position: "fixed",
          borderRadius: "16px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 4px rgba(139, 92, 246, 0.4)",
          border: "2px solid #8B5CF6",
          zIndex: 9999,
          pointerEvents: "none",
          transition: "all 0.15s ease-out",
        });

        const spaceBelow = window.innerHeight - rect.bottom;
        const placeBelow = spaceBelow > 260 || rect.top < 260;

        setTooltipStyle({
          top: placeBelow ? rect.bottom + 12 : rect.top - 280,
          left: Math.max(16, Math.min(window.innerWidth - 340, rect.left + rect.width / 2 - 160)),
          position: "fixed",
          zIndex: 10000,
          width: "320px",
          transition: "all 0.15s ease-out",
        });
      }
    };

    updatePosition();
    const timer1 = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 400);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [tourStep, isTourActive, activeTourSteps]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SEOTabId>("seo");

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleMetrics, setGoogleMetrics] = useState<any>(null);
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  const fetchGoogleMetrics = async (token: string) => {
    setIsFetchingGoogle(true);
    try {
      const res = await getGoogleApiMetrics(token);
      if (res.status === "success") {
        setGoogleMetrics(res);
      }
    } catch (err) {
      console.error("Failed to fetch Google API metrics:", err);
    } finally {
      setIsFetchingGoogle(false);
    }
  };

  const checkGoogleConnection = async (token: string) => {
    try {
      const res = await getIntegrationsStatus(token);
      const googleStatus = res.integrations?.google?.connected;
      setIsGoogleConnected(!!googleStatus);
      if (googleStatus) {
        await fetchGoogleMetrics(token);
      }
    } catch (err) {
      console.error("Failed to check Google connection:", err);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    toast.info("Connecting to Google Account API Suite...");
    
    // Simulate OAuth consent delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const token = getToken();
      const settingsRes = await getAutopilotSettings(token);
      const currentSettings = settingsRes.settings;
      
      const updated = {
        ...currentSettings,
        google_connected: true
      };
      
      await updateAutopilotSettings(token, updated);
      setIsGoogleConnected(true);
      toast.success("Google Analytics, Search Console, & Business Profile connected successfully!");
      
      await fetchGoogleMetrics(token);
      setActiveTab("search-console");
    } catch (err: any) {
      console.error("Google integration failed:", err);
      toast.error(err.message || "Failed to connect Google account");
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    toast.info("Disconnecting Google Account...");
    try {
      const token = getToken();
      const settingsRes = await getAutopilotSettings(token);
      const currentSettings = settingsRes.settings;
      
      const updated = {
        ...currentSettings,
        google_connected: false
      };
      
      await updateAutopilotSettings(token, updated);
      setIsGoogleConnected(false);
      setGoogleMetrics(null);
      setActiveTab("integrations");
      toast.success("Google Account disconnected successfully.");
    } catch (err: any) {
      console.error("Failed to disconnect Google account:", err);
      toast.error(err.message || "Failed to disconnect Google account");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      await checkGoogleConnection(token);
      const statusResult = await getAnalysisStatus(token);
      setStatus(statusResult);

      if (statusResult.status === "completed") {
        const data = await getSEOGoogleMapsData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            const data = await getSEOGoogleMapsData(token);
            setAnalysis(data);
            setIsAnalyzing(false);
          })
          .catch((err) => {
            setError(err.message);
            setIsAnalyzing(false);
          });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Google Hub data";
      console.error("Error loading data:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const token = getToken();
      await triggerComprehensiveAnalysis(token);
      await pollAnalysisStatus(token, (updatedStatus) => {
        setStatus(updatedStatus);
      });
      const data = await getSEOGoogleMapsData(token);
      setAnalysis(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze business";
      console.error("Error analyzing:", err);
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tipsData = analysis?.seo_google_maps_tips;

  const handleQuickAction = (title: string) => {
    if (title === "Google Business Profile") {
      setActiveTab("maps");
      return;
    }

    setActiveTab("seo");
  };

  const header = (
    <SEOPageHeader
      title="Google Hub"
      subtitle="Boost your local visibility, organic traffic, and local maps presence"
      lastUpdated={analysis?.last_updated}
      actions={
        analysis ? (
          <div className="flex items-center gap-3">
            <button
              id="tour-btn-gmaps-help"
              type="button"
              className="p-2 rounded-xl bg-slate-900 border border-slate-805/40 text-slate-400 hover:bg-slate-800 hover:text-purple-400 shadow-xs transition-all cursor-pointer dark:border-slate-800"
              onClick={() => {
                setIsTourActive(true);
                setTourStep(1);
              }}
              title="Start Guided Tour"
            >
              <HelpCircle size={16} />
            </button>
            <Button
              variant="hero"
              size="default"
              className="gap-2 border border-purple-500/20 shadow-lg shadow-purple-500/10 cursor-pointer"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              Re-analyze
            </Button>
          </div>
        ) : undefined
      }
    />
  );

  const ambientLayers = (
    <>
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-[min(580px,90vw)] w-[min(580px,90vw)] rounded-full bg-purple-500/[0.12] blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-[-5%] h-[min(460px,80vw)] w-[min(460px,80vw)] rounded-full bg-indigo-500/[0.1] blur-[100px]" aria-hidden />
    </>
  );

  if (isLoading) {
    return (
      <div className="relative -m-4 flex-grow flex flex-col min-h-full bg-background p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" aria-hidden />
        <SEOLayout>
          {header}
          <LoadingState />
        </SEOLayout>
      </div>
    );
  }

  if (isAnalyzing || status?.status === "analyzing") {
    return (
      <div className="relative -m-4 flex-grow flex flex-col min-h-full bg-background p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" aria-hidden />
        <SEOLayout>
          {header}
          <AnalyzingState />
        </SEOLayout>
      </div>
    );
  }

  if (!analysis && status?.status === "not_started") {
    return (
      <div className="relative -m-4 flex-grow flex flex-col min-h-full bg-background p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <SEOLayout>
          {header}
          <NotStartedState onNavigate={() => navigate({ to: "/dashboard/business-analysis" })} />
        </SEOLayout>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="relative -m-4 flex-grow flex flex-col min-h-full bg-background p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <SEOLayout>
          {header}
          <ErrorState error={error} onRetry={handleAnalyze} />
        </SEOLayout>
      </div>
    );
  }  const seoScore = tipsData ? computeSEOScore(tipsData) : 0;
  const mapsScore = tipsData ? computeMapsScore(tipsData) : 0;

  return (
    <div className="relative -m-4 flex-grow flex flex-col min-h-full bg-background p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
      <SEOLayout>
        {header}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-6">
          {/* Left Column: Control Panel / Health Center */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
            {/* Google OAuth & Account Link Status Card */}
            <div id="tour-gmaps-profile" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden dark:border-slate-700">
              <div className="absolute top-0 right-0 h-32 w-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4.5 w-4.5 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">OAuth Status</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Connection state:</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    isGoogleConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {isGoogleConnected ? "Connected" : "Inactive"}
                  </span>
                </div>

                {isGoogleConnected ? (
                  <Button variant="destructive" size="sm" onClick={handleDisconnectGoogle} className="w-full gap-2 justify-center py-2 h-9 text-xs">
                    <Unlock size={12} /> Disconnect Google
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    size="default"
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className="w-full gap-2 justify-center py-2 h-9 text-xs shadow-lg shadow-purple-500/15"
                  >
                    {isConnectingGoogle ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
                      </>
                    ) : (
                      <>
                        <Lock size={12} /> Link Google Suite
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Health Indicators */}
            {tipsData && (
              <div id="tour-gmaps-scores" className="space-y-6">
                <SEOScoreGauge score={seoScore} label="SEO Health Score" />
                <SEOScoreGauge score={mapsScore} label="Local Presence Score" />
              </div>
            )}
            
            {/* Quick Summary / Sync Stats */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-2 dark:border-slate-700">
              <div className="flex justify-between">
                <span>Sync Mode:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-350">Simulated / Live API</span>
              </div>
              <div className="flex justify-between">
                <span>Engine Version:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-350">v1.2.0</span>
              </div>
            </div>
          </div>

          {/* Right Column: Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <SEOTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} isGoogleConnected={isGoogleConnected} />

            {activeTab === "seo" && (
              <div id="tour-gmaps-keywords">
                {tipsData ? <SEOTabPanel data={tipsData} /> : <EmptyInsightsState />}
              </div>
            )}

            {activeTab === "maps" && (
              <div id="tour-gmaps-citations">
                {tipsData ? <MapsTabPanel data={tipsData} /> : <EmptyInsightsState />}
              </div>
            )}

            {/* Tab: Google API Suite Connection Panel */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden dark:border-slate-700">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Google OAuth Integration Center</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sync live Search Console, Analytics, and Business Profile metrics directly into your Saadhyam dashboards. Use the sidebar connection settings to manage active status.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Card 1: Search Console */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-5 space-y-3 relative group backdrop-blur-md hover:border-slate-700 transition-all dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <Search className="h-5 w-5 text-blue-400" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        isGoogleConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {isGoogleConnected ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Search Console</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Track organic query impressions, keywords, position indexing status, and click-through rates.
                    </p>
                  </div>

                  {/* Card 2: Google Analytics */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-5 space-y-3 relative group backdrop-blur-md hover:border-slate-700 transition-all dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        isGoogleConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {isGoogleConnected ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Analytics (GA4)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Analyze active session counts, traffic referrals, user engagement, and top landing page views.
                    </p>
                  </div>

                  {/* Card 3: Business Profile */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/60 p-5 space-y-3 relative group backdrop-blur-md hover:border-slate-700 transition-all dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <MapPin className="h-5 w-5 text-purple-450" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        isGoogleConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {isGoogleConnected ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Business Profile</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Monitor local Map views, direct directions requests, phone calls, and customer reviews.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Search Console Dashboard */}
            {activeTab === "search-console" && isGoogleConnected && googleMetrics?.search_console && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-blue-400">
                      {googleMetrics.search_console.stats.total_clicks}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Total Web Clicks</div>
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {googleMetrics.search_console.stats.total_impressions.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Total Impressions</div>
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-emerald-400">
                      {googleMetrics.search_console.stats.avg_ctr}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Average CTR</div>
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-purple-400">
                      {googleMetrics.search_console.stats.avg_position}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Average Position</div>
                  </div>
                </div>

                {/* Clicks over time chart */}
                <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Search Performance Over Time</h4>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={googleMetrics.search_console.clicks_over_time}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" stroke="#a855f7" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="impressions" name="Impressions" stroke="#a855f7" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top queries table */}
                <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md overflow-hidden dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-800/80">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Top Queries Driving Organic Traffic</h4>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/60 dark:bg-slate-950/60 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3">Search Query</th>
                        <th className="px-6 py-3 text-right">Clicks</th>
                        <th className="px-6 py-3 text-right">Impressions</th>
                        <th className="px-6 py-3 text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                      {googleMetrics.search_console.top_queries.map((q: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-950/20">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{q.query}</td>
                          <td className="px-6 py-4 text-right text-blue-400 font-bold">{q.clicks}</td>
                          <td className="px-6 py-4 text-right">{q.impressions.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-emerald-400 font-bold">{q.ctr}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Google Analytics Dashboard */}
            {activeTab === "analytics" && isGoogleConnected && googleMetrics?.analytics && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-blue-400">
                      {googleMetrics.analytics.stats.sessions.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Total Sessions</div>
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {googleMetrics.analytics.stats.users.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Total Users</div>
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-purple-400">
                      {googleMetrics.analytics.stats.pageviews.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Pageviews</div>
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 dark:border-slate-700">
                    <div className="text-2xl font-black text-emerald-400">
                      {googleMetrics.analytics.stats.avg_session_duration}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Avg Session Duration</div>
                  </div>
                </div>

                {/* Traffic Sources & Pages grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Traffic Sources */}
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4 lg:col-span-1 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Traffic Channels</h4>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={googleMetrics.analytics.sources} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                          <YAxis dataKey="source" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                          <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }} />
                          <Bar dataKey="sessions" fill="#10b981" radius={[0, 4, 4, 0]}>
                            {googleMetrics.analytics.sources.map((entry: any, index: number) => {
                              const colors = ["#a855f7", "#3b82f6", "#10b981", "#f97316"];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Pages */}
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md overflow-hidden lg:col-span-2 dark:border-slate-700">
                    <div className="px-6 py-4 border-b border-slate-800/80">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Top Site Pages Visited</h4>
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/60 dark:bg-slate-950/60 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-3">Page URL</th>
                          <th className="px-6 py-3">Page Title</th>
                          <th className="px-6 py-3 text-right">Views</th>
                          <th className="px-6 py-3 text-right">Time on Page</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-700 dark:text-slate-300">
                        {googleMetrics.analytics.top_pages.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-950/20">
                            <td className="px-6 py-4 font-mono text-purple-400">{p.url}</td>
                            <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">{p.title}</td>
                            <td className="px-6 py-4 text-right text-blue-400 font-bold">{p.views.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">{p.avg_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Google Business Profile Insights */}
            {activeTab === "business-insights" && isGoogleConnected && googleMetrics?.business_profile && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-between transition-all hover:border-slate-700 dark:border-slate-700">
                    <div>
                      <div className="text-2xl font-black text-purple-500">
                        {googleMetrics.business_profile.stats.profile_views.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Profile Views</div>
                    </div>
                    <Globe className="h-8 w-8 text-purple-500/20" />
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-between transition-all hover:border-slate-700 dark:border-slate-700">
                    <div>
                      <div className="text-2xl font-black text-blue-500">
                        {googleMetrics.business_profile.stats.search_views.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Search Views</div>
                    </div>
                    <Search className="h-8 w-8 text-blue-500/20" />
                  </div>
                  <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-between transition-all hover:border-slate-700 dark:border-slate-700">
                    <div>
                      <div className="text-2xl font-black text-emerald-500">
                        {googleMetrics.business_profile.stats.customer_actions}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Customer Actions</div>
                    </div>
                    <Activity className="h-8 w-8 text-emerald-500/20" />
                  </div>
                </div>

                {/* Actions breakdown info box */}
                <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-4 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Customer Actions Breakdown</h4>
                  <div className="grid gap-4 md:grid-cols-3 text-xs">
                    <div className="bg-slate-100/60 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 dark:border-slate-700">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Website Clicks</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{googleMetrics.business_profile.actions_breakdown.website_clicks}</div>
                    </div>
                    <div className="bg-slate-100/60 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 dark:border-slate-700">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Directions Requests</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{googleMetrics.business_profile.actions_breakdown.directions_requests}</div>
                    </div>
                    <div className="bg-slate-100/60 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 dark:border-slate-700">
                      <div className="text-slate-500 font-bold uppercase text-[10px]">Phone Calls</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{googleMetrics.business_profile.actions_breakdown.phone_calls}</div>
                    </div>
                  </div>
                </div>

                {/* Latest reviews */}
                <div className="bg-white/85 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md overflow-hidden dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-800/80">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Latest Google Maps Reviews</h4>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {googleMetrics.business_profile.latest_reviews.map((r: any, i: number) => (
                      <div key={i} className="p-5 space-y-2 hover:bg-slate-950/20 transition-colors">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{r.author}</span>
                          <span className="text-slate-500 dark:text-slate-400">{r.date}</span>
                        </div>
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, idx) => (
                            <span key={idx}>★</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <QuickActionsGrid delay={0.35} onAction={handleQuickAction} />
            <ProTipsBanner delay={0.42} />
          </div>
        </div>
      </SEOLayout>

      {/* Interactive Guided Tour Overlay */}
      {isTourActive && (
        <div className="fixed inset-0 z-[9998] pointer-events-none text-slate-100">
          {/* Highlight element mask */}
          {highlightStyle.top !== undefined && (
            <div
              style={highlightStyle}
              className="fixed transition-all duration-200 ease-out pointer-events-none"
            />
          )}

          {/* Full-screen click interceptor mask for everything EXCEPT the highlighted area */}
          <div className="fixed inset-0 bg-transparent pointer-events-auto z-[998]" onClick={() => setIsTourActive(false)} />

          {/* Interactive Tooltip popup */}
          {tooltipStyle.top !== undefined && activeTourSteps[tourStep - 1] && (
            <div
              style={tooltipStyle}
              className="bg-slate-900 border border-purple-500/30 p-5 z-[10000] w-[320px] shadow-2xl rounded-2xl animate-fade-in pointer-events-auto flex flex-col gap-4 text-white"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {activeTourSteps[tourStep - 1].title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {tourStep} / {activeTourSteps.length}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <h3 className="font-extrabold text-white text-sm">
                  {activeTourSteps[tourStep - 1].heading}
                </h3>
                <p className="text-slate-300 leading-normal text-[11px]">
                  {activeTourSteps[tourStep - 1].desc}
                </p>
              </div>

              {/* Animated visual indicators */}
              <div className="h-16 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden relative">
                {activeTourSteps[tourStep - 1].indicator === 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-green-400 uppercase font-bold tracking-wider animate-pulse">Monitoring Google Connection</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <TrendingUp size={14} className="animate-bounce text-purple-400" />
                    <span>Authority Algorithms Active</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Indexing Search Keywords</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 4 && (
                  <div className="text-[10px] font-bold text-purple-300 border border-purple-500/20 px-2 py-1 rounded bg-purple-500/10 flex items-center gap-1.5 animate-pulse">
                    <Zap size={10} />
                    <span>Sync Citations Active</span>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white transition-all border border-transparent hover:bg-white/5 rounded cursor-pointer"
                  onClick={() => setIsTourActive(false)}
                >
                  Skip
                </button>
                <div className="flex items-center gap-1.5">
                  {tourStep > 1 && (
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] text-slate-300 hover:text-white border border-white/10 rounded cursor-pointer"
                      onClick={() => setTourStep(tourStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-3 py-1 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold cursor-pointer"
                    onClick={() => {
                      if (tourStep < activeTourSteps.length) {
                        setTourStep(tourStep + 1);
                      } else {
                        setIsTourActive(false);
                        localStorage.setItem("saadhyam_tour_gmaps_completed", "true");
                      }
                    }}
                  >
                    {tourStep === activeTourSteps.length ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
