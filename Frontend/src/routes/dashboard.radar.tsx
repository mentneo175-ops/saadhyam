import { toast } from "sonner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Radio,
  MapPin,
  TrendingUp,
  Briefcase,
  Calendar,
  Zap,
  ArrowRight,
  X,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Maximize2,
  ListFilter,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import {
  getRadarOpportunities,
  scanRadarOpportunities,
  updateRadarOpportunity,
  type RadarOpportunity,
} from "@/lib/radarApi";

export const Route = createFileRoute("/dashboard/radar")({
  head: () => ({ meta: [{ title: "Radar AI — Saadhyam AI" }] }),
  component: RadarPage,
});

function RadarPage() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<RadarOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-radar-console-graphic",
      title: "Radar Sweeper",
      heading: "1. AI Signal Sweeper",
      desc: "Visual representation of real-time market search auditing and signal matching.",
      indicator: 1
    },
    {
      id: "tour-radar-scan-btn",
      title: "Scan Trigger",
      heading: "2. Trigger Radar Scan",
      desc: "Click to run active crawling algorithms across GMB reviews, directories, and seasonal trends.",
      indicator: 2
    },
    {
      id: "tour-radar-log-feed",
      title: "Live Feed",
      heading: "3. Live Signal Console",
      desc: "Monitors and displays incoming grounding signals, algorithms matching, and live log updates.",
      indicator: 3
    },
    {
      id: "tour-radar-metrics",
      title: "Potential Metrics",
      heading: "4. Opportunity Analytics",
      desc: "Tracks the total volume of growth paths matched and calculated monthly revenue potential.",
      indicator: 4
    },
    {
      id: "tour-radar-opportunity-list",
      title: "Opportunities List",
      heading: "5. Signal Match Category Grid",
      desc: "Categorized growth leads. Toggle sections to reveal maps, B2B queries, or seasonal recommendations.",
      indicator: 5
    }
  ];

  // Auto-trigger tour for new users once data has loaded
  useEffect(() => {
    if (!isLoading && opportunities.length > 0) {
      const isCompleted = localStorage.getItem("saadhyam_tour_radar_completed");
      if (!isCompleted) {
        const timer = setTimeout(() => {
          setIsTourActive(true);
          setTourStep(1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, opportunities]);

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
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "nearby" | "seasonal" | "b2b" | "trend">("all");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [lastScanned, setLastScanned] = useState<string>("Never");

  const scanSteps = [
    "Initializing radar intelligence signals...",
    "Correlating maps & public registers...",
    "Querying seasonal event engines...",
    "Analyzing search query frequencies...",
    "Running matching priority algorithms...",
  ];

  // Get auth token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConsoleLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 14)]);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await getRadarOpportunities(token);
      setOpportunities(res.opportunities);
      if (res.opportunities.length > 0) {
        addLog(`System initialized. Loaded ${res.opportunities.length} opportunities from cache.`);
        setLastScanned("Cached (just loaded)");
      } else {
        addLog("System initialized. No cached opportunities. Ready for first scan.");
      }
    } catch (err: any) {
      console.error("Error loading radar data:", err);
      setError(err.message || "Failed to load opportunities");
      addLog("System error: Failed to fetch opportunities.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanStep(0);
    setError(null);
    setConsoleLogs([]);
    addLog("Radar sweep triggered. Scanning local business signals...");

    // Simulate step messages during scan
    let stepCount = 0;
    const stepInterval = setInterval(() => {
      stepCount++;
      if (stepCount < scanSteps.length) {
        setScanStep(stepCount);
        addLog(scanSteps[stepCount]);
      } else {
        clearInterval(stepInterval);
      }
    }, 850);

    try {
      const token = getToken();
      const res = await scanRadarOpportunities(token);
      clearInterval(stepInterval);
      setOpportunities(res.opportunities);
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastScanned(now);
      
      addLog(`Scan complete. Found ${res.opportunities.length} fresh opportunities.`);
      toast.success("Opportunity Radar scan completed successfully!", {
        position: "top-right",
      });
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("Error scanning opportunities:", err);
      addLog(`Scan failed: ${err.message || "Unknown API error"}`);
      toast.error(err.message || "Failed to run radar scan", {
        position: "top-right",
      });
    } finally {
      setIsScanning(false);
    }
  };

   const handleAction = async (oppId: number, currentAction: string, actionLink?: string) => {
    setActioningId(oppId);
    try {
      const token = getToken();
      await updateRadarOpportunity(token, oppId, "contacted");
      
      // Update state local list
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === oppId ? { ...opp, status: "contacted" as const } : opp))
      );
      
      addLog(`Action performed on ID #${oppId}: "${currentAction}"`);
      toast.success(`Success! Marked as actioned: "${currentAction}"`, {
        position: "top-right",
      });

      if (actionLink) {
        setTimeout(() => {
          navigate({ to: actionLink as any });
        }, 800);
      }
    } catch (err: any) {
      console.error("Error performing opportunity action:", err);
      toast.error("Failed to perform action");
      addLog(`Failed to perform action on opportunity ID #${oppId}.`);
    } finally {
      setActioningId(null);
    }
  };

  const handleDismiss = async (oppId: number) => {
    try {
      const token = getToken();
      await updateRadarOpportunity(token, oppId, "dismissed");
      
      // Remove from list visually
      setOpportunities((prev) => prev.filter((opp) => opp.id !== oppId));
      addLog(`Opportunity ID #${oppId} dismissed.`);
      toast.success("Opportunity dismissed", {
        position: "top-right",
      });
    } catch (err: any) {
      console.error("Error dismissing opportunity:", err);
      toast.error("Failed to dismiss opportunity");
    }
  };

  // Filter opportunities by selected category
  const filteredOpps = opportunities.filter((opp) => {
    if (selectedCategory === "all") return opp.status === "active" || opp.status === "contacted";
    return opp.category === selectedCategory && (opp.status === "active" || opp.status === "contacted");
  });

  // Calculate potential revenue
  const calculatePotentialRevenue = () => {
    let total = 0;
    opportunities.forEach((opp) => {
      if (opp.status === "active" && opp.estimated_value) {
        // Extract digits
        const digits = opp.estimated_value.replace(/[^0-9]/g, "");
        if (digits) {
          total += parseInt(digits, 10);
        }
      }
    });
    return total > 0 ? `₹${total.toLocaleString("en-IN")}` : "₹0";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "nearby":
        return <MapPin className="text-emerald-500" size={15} />;
      case "seasonal":
        return <Calendar className="text-orange-500" size={15} />;
      case "b2b":
        return <Briefcase className="text-blue-500" size={15} />;
      case "trend":
        return <TrendingUp className="text-purple-500" size={15} />;
      default:
        return <HelpCircle className="text-gray-500" size={15} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "nearby":
        return "Nearby Need";
      case "seasonal":
        return "Seasonal Demand";
      case "b2b":
        return "B2B / Vendor";
      case "trend":
        return "Search Trend";
      default:
        return "Opportunity";
    }
  };

  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case "nearby":
        return "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 text-emerald-700 dark:text-emerald-300";
      case "seasonal":
        return "border-orange-500 bg-orange-500/5 shadow-orange-500/10 text-orange-700 dark:text-orange-300";
      case "b2b":
        return "border-blue-500 bg-blue-500/5 shadow-blue-500/10 text-blue-700 dark:text-blue-300";
      case "trend":
        return "border-purple-500 bg-purple-500/5 shadow-purple-500/10 text-purple-700 dark:text-purple-300";
      default:
        return "border-gray-500 bg-gray-500/5 shadow-gray-500/10 text-gray-700 dark:text-gray-300";
    }
  };

  const renderStars = (urgency: string) => {
    const starCount = urgency === "high" ? 3 : urgency === "medium" ? 2 : 1;
    return (
      <div className="flex gap-0.5">
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            size={11}
            className={`${
              i < starCount
                ? "text-yellow-500 fill-yellow-500 animate-pulse"
                : "text-gray-300 dark:text-zinc-700"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Radar AI"
          subtitle="Proactive AI growth partner discovering opportunities automatically"
        />
        <Loader text="Calibrating Tactical Radar Console..." className="py-20" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Custom Keyframe Animations CSS injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.95); opacity: 0.2; }
          50% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.2; }
        }
        @keyframes grid-glow {
          0% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.1) inset; }
          50% { box-shadow: 0 0 25px rgba(139, 92, 246, 0.25) inset; }
          100% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.1) inset; }
        }
        @keyframes signal-ping-emerald {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-radar-sweep {
          animation: radar-sweep 6s linear infinite;
        }
        .animate-radar-sweep-fast {
          animation: radar-sweep 1.8s linear infinite;
        }
        .animate-radar-pulse {
          animation: radar-pulse 3s ease-in-out infinite;
        }
        .animate-grid-glow {
          animation: grid-glow 4s ease-in-out infinite;
        }
        .ping-glow-emerald {
          animation: signal-ping-emerald 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}} />

      {/* Page Title & Status */}
      <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-zinc-800/40 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Radio className="text-purple-500 animate-pulse" size={24} />
            Radar AI <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">— Proactive Business Radar</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Continuously monitors maps, search spikes, and B2B activity to discover growth before you look.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="tour-btn-radar-help"
            type="button"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-purple-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-purple-400 shadow-xs transition-all cursor-pointer"
            onClick={() => {
              setIsTourActive(true);
              setTourStep(1);
            }}
            title="Start Guided Tour"
          >
            <HelpCircle size={16} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Active Scanner Mode
          </div>
        </div>
      </div>

      {/* Main Grid Layout - Sidebar style radar dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Radar Console Panel (Col-span 4) */}
        <div className="lg:col-span-4 bg-white text-zinc-700 rounded-3xl border border-zinc-200 shadow-xl p-6 space-y-6 relative overflow-hidden animate-grid-glow dark:bg-slate-900 dark:text-zinc-300 dark:border-slate-700">
          {/* Glowing scanner line underlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_70%)] pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 relative z-10 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Radar Console</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">SYS_V2.0_READY</span>
          </div>

          {/* Centered Radar Graphic */}
          <div id="tour-radar-console-graphic" className="flex justify-center py-4 relative z-10">
            <div className="relative w-48 h-48 rounded-full border-2 border-purple-200 bg-purple-50/30 flex items-center justify-center overflow-hidden animate-radar-pulse shadow-[0_0_25px_rgba(168,85,247,0.15)] dark:bg-purple-950/20 dark:border-purple-500/30">
              {/* Concentric rings */}
              <div className="absolute w-12 h-12 rounded-full border-2 border-purple-200/80 dark:border-purple-500/20" />
              <div className="absolute w-24 h-24 rounded-full border-2 border-purple-200/60 dark:border-purple-500/15" />
              <div className="absolute w-36 h-36 rounded-full border-2 border-purple-200/40 dark:border-purple-500/10" />
              {/* Crosshairs */}
              <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-purple-200/60 dark:bg-purple-500/20 -translate-y-1/2" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-purple-200/60 dark:bg-purple-500/20 -translate-x-1/2" />
              
              {/* Radar Sweeping Sector */}
              <div className={`absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left border-l-[3px] border-purple-600 dark:border-purple-400 bg-gradient-to-tr from-purple-500/70 dark:from-purple-500/40 to-transparent ${
                isScanning ? "animate-radar-sweep-fast" : "animate-radar-sweep"
              }`} />
              
              {/* Active Signal Blips (pulsing targets) */}
              {opportunities.length > 0 && !isScanning && (
                <>
                  {/* Near target - Emerald (Nearby) */}
                  <div className="absolute top-[28%] left-[28%] w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 ping-glow-emerald" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />
                  </div>
                  {/* Medium target - Purple (Trend) */}
                  <div className="absolute top-[70%] left-[64%] w-3 h-3 rounded-full bg-purple-500/20 flex items-center justify-center" style={{ animationDelay: "0.6s" }}>
                    <span className="absolute inset-0 rounded-full bg-purple-400 ping-glow-emerald" style={{ animationDelay: "0.6s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm" />
                  </div>
                  {/* Far target - Orange (Seasonal) */}
                  <div className="absolute top-[48%] left-[78%] w-3 h-3 rounded-full bg-orange-500/20 flex items-center justify-center" style={{ animationDelay: "1.2s" }}>
                    <span className="absolute inset-0 rounded-full bg-orange-400 ping-glow-emerald" style={{ animationDelay: "1.2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-sm" />
                  </div>
                </>
              )}

              {/* Central base node */}
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] z-10" />
            </div>
          </div>

          {/* Trigger Scan Button */}
          <div id="tour-radar-scan-btn" className="space-y-3 relative z-10">
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className={`w-full py-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-0 ${
                isScanning
                  ? "bg-purple-100 text-purple-400 dark:bg-purple-900/50 dark:text-purple-300 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/45 animate-pulse"
              }`}
            >
              <Zap size={16} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? "SWEEPING SIGNALS..." : "TRIGGER RADAR SCAN"}
            </Button>
            
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-500 px-1">
              <span>SCANNER_RAD: 5.0 KM</span>
              <span>LAST_SCAN: {lastScanned}</span>
            </div>
          </div>

          {/* Scrolling Realtime Logs inside the Console */}
          <div id="tour-radar-log-feed" className="border-t border-zinc-200 pt-4 space-y-2 relative z-10 dark:border-slate-700">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Live Signal Feed</p>
            <div className="h-44 bg-zinc-50/80 rounded-xl p-3 border border-zinc-200 font-mono text-[10px] text-purple-700 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent dark:bg-zinc-950/80 dark:border-slate-700 dark:text-purple-400/90 dark:scrollbar-thumb-zinc-900">
              {consoleLogs.length === 0 ? (
                <span className="text-zinc-500 dark:text-zinc-600 italic">No signals recorded. Trigger a scan to start signal feed.</span>
              ) : (
                consoleLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`leading-normal border-l-2 pl-1.5 transition-all duration-300 ${
                      index === 0
                        ? "text-purple-700 dark:text-purple-300 border-purple-500 font-bold scale-[1.01]"
                        : "text-zinc-500 border-zinc-200 dark:border-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Opportunities Dashboard Control (Col-span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Metrics Bar */}
          <div id="tour-radar-metrics" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Metric 1 */}
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/20 dark:border-zinc-800/40 p-5 rounded-3xl shadow-md flex items-center justify-between group hover:border-purple-500/25 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Active growth paths</p>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {opportunities.filter((opp) => opp.status === "active").length} Opportunities
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Radio size={20} />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/20 dark:border-zinc-800/40 p-5 rounded-3xl shadow-md flex items-center justify-between group hover:border-emerald-500/25 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Total Market Potential</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {calculatePotentialRevenue()}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <DollarSign size={20} />
              </div>
            </div>
          </div>

          {/* Filtering Tabs & Header */}
          <div id="tour-radar-opportunity-list" className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/20 dark:border-zinc-800/40 p-4 rounded-3xl shadow-md space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800/30 pb-3">
              <ListFilter size={16} className="text-purple-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">Signal Categories</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === "all"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white/60 dark:bg-zinc-950/20 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-white"
                }`}
              >
                All ({opportunities.filter((o) => o.status !== "dismissed").length})
              </button>
              <button
                onClick={() => setSelectedCategory("nearby")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedCategory === "nearby"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white/60 dark:bg-zinc-950/20 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-white"
                }`}
              >
                <MapPin size={12} />
                Nearby ({opportunities.filter((o) => o.category === "nearby" && o.status !== "dismissed").length})
              </button>
              <button
                onClick={() => setSelectedCategory("seasonal")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedCategory === "seasonal"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white/60 dark:bg-zinc-950/20 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-white"
                }`}
              >
                <Calendar size={12} />
                Seasonal ({opportunities.filter((o) => o.category === "seasonal" && o.status !== "dismissed").length})
              </button>
              <button
                onClick={() => setSelectedCategory("b2b")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedCategory === "b2b"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white/60 dark:bg-zinc-950/20 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-white"
                }`}
              >
                <Briefcase size={12} />
                B2B ({opportunities.filter((o) => o.category === "b2b" && o.status !== "dismissed").length})
              </button>
              <button
                onClick={() => setSelectedCategory("trend")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedCategory === "trend"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white/60 dark:bg-zinc-950/20 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-white"
                }`}
              >
                <TrendingUp size={12} />
                Trends ({opportunities.filter((o) => o.category === "trend" && o.status !== "dismissed").length})
              </button>
            </div>
          </div>

          {/* Actionable Cards Stack */}
          <div className="space-y-4">
            {filteredOpps.length === 0 ? (
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-zinc-800/40 rounded-3xl p-12 text-center shadow-md space-y-4 max-w-xl mx-auto">
                <AlertCircle size={40} className="mx-auto text-purple-400 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Active Opportunities in View</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Try clearing the category filter tabs, triggering a fresh scan in the console, or verifying your business setup details.
                </p>
              </div>
            ) : (
              filteredOpps.map((opp) => {
                const isCompleted = opp.status === "contacted";
                return (
                  <div
                    key={opp.id}
                    className={`relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch ${
                      isCompleted
                        ? "bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200/50 dark:border-emerald-900/30 opacity-70"
                        : "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-white/20 dark:border-zinc-800/40 shadow-md hover:shadow-xl hover:border-purple-500/20 hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Visual Category Side Stripe */}
                    <div className={`w-2 md:w-2 shrink-0 ${
                      opp.category === "nearby"
                        ? "bg-emerald-500"
                        : opp.category === "seasonal"
                        ? "bg-orange-500"
                        : opp.category === "b2b"
                        ? "bg-blue-500"
                        : "bg-purple-500"
                    }`} />

                    {/* Content Body */}
                    <div className="p-5 md:p-6 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Header Row */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-solid ${getCategoryColorClass(opp.category)}`}>
                            {getCategoryIcon(opp.category)}
                            {getCategoryLabel(opp.category)}
                          </span>
                          
                          <span className="text-gray-300 dark:text-zinc-800">•</span>
                          
                          {/* Stars Priority rating instead of simple badge */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Priority:</span>
                            {renderStars(opp.urgency)}
                          </div>
                        </div>

                        {/* Top-Right Dismiss Cross */}
                        {!isCompleted && (
                          <button
                            onClick={() => handleDismiss(opp.id)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Dismiss opportunity"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Main Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug">
                          {opp.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400 font-normal leading-relaxed">
                          {opp.description}
                        </p>
                      </div>

                      {/* Info & Metrics Row */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold pt-3 border-t border-gray-100/50 dark:border-zinc-800/20">
                        {opp.estimated_value && (
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                            <span className="text-gray-400 dark:text-zinc-500 font-medium">Estimated Value:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                              {opp.estimated_value}
                            </span>
                          </div>
                        )}
                        {opp.distance && (
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                            <span className="text-gray-400 dark:text-zinc-500 font-medium">Hyperlocal:</span>
                            <span className="text-gray-900 dark:text-white font-bold flex items-center gap-0.5">
                              <MapPin size={11} className="text-gray-400" />
                              {opp.distance}
                            </span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right-Side Action Sidebar (Pushes button to the right of card on larger screens) */}
                    <div className="p-5 md:p-6 border-t md:border-t-0 md:border-l border-gray-100/50 dark:border-zinc-800/20 flex items-center justify-center shrink-0 w-full md:w-48 bg-gray-50/30 dark:bg-zinc-950/5">
                      {isCompleted ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                          <CheckCircle size={14} />
                          ACTION TAKEN
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAction(opp.id, opp.action_label, opp.action_link)}
                          disabled={actioningId === opp.id}
                          className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-1"
                        >
                          {actioningId === opp.id ? (
                            "COMPLETING..."
                          ) : (
                            <>
                              {opp.action_label}
                              <ArrowRight size={13} />
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                    </span>
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider animate-pulse">Sweeping Active Signals</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Zap size={14} className="animate-pulse text-purple-400" />
                    <span>Scan Trigger Ready</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Grounding Logs Feed Live</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 4 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold">
                    <DollarSign size={12} className="animate-bounce" />
                    <span>Potential Revenue Estimated</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 5 && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-4 bg-purple-500/50 rounded-sm animate-bounce"
                        style={{
                          height: `${Math.random() * 20 + 8}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: "0.8s"
                        }}
                      />
                    ))}
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
                        localStorage.setItem("saadhyam_tour_radar_completed", "true");
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
