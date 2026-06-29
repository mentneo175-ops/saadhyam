import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Zap,
  Trash2,
  TrendingUp,
  Brain,
  ArrowRight,
  Sparkles,
  MapPin,
  Globe,
  Plus,
  MessageSquare,
  DollarSign,
  Share2,
  Megaphone,
  AlertCircle,
  CheckCircle,
  Star,
  PenSquare,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  Eye,
  Activity,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  getMonitoredCompetitors,
  getCompetitorDetails,
  addCompetitor,
  deleteCompetitor,
  getCompetitorSuggestions,
  type CompetitorIntelligence,
} from "@/lib/competitorIntelligenceApi";

export const Route = createFileRoute("/dashboard/competitor-analysis")({
  head: () => ({ meta: [{ title: "Competitor Intelligence AI — Saadhyam AI" }] }),
  component: CompetitorIntelligencePage,
});

// Color cycling for suggestion cards
const CARD_PALETTES = [
  {
    border: "border-violet-200 dark:border-violet-500/30",
    glow: "shadow-violet-500/10",
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    badge: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    dot: "bg-violet-400"
  },
  {
    border: "border-cyan-200 dark:border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    icon: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
    badge: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300",
    dot: "bg-cyan-400"
  },
  {
    border: "border-indigo-200 dark:border-indigo-500/30",
    glow: "shadow-indigo-500/10",
    icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    badge: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    dot: "bg-indigo-400"
  },
  {
    border: "border-fuchsia-200 dark:border-fuchsia-500/30",
    glow: "shadow-fuchsia-500/10",
    icon: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    badge: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
    dot: "bg-fuchsia-400"
  },
  {
    border: "border-emerald-200 dark:border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-400"
  },
];

function CompetitorIntelligencePage() {
  const [competitors, setCompetitors] = useState<CompetitorIntelligence[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedComp, setSelectedComp] = useState<CompetitorIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState<boolean[]>([]);

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-comp-watchlist",
      title: "Competitors Watchlist",
      heading: "1. Monitor Tracked Competitors",
      desc: "Lists all local and digital competitors currently under real-time auditing.",
      indicator: 1
    },
    {
      id: "tour-comp-add-input",
      title: "Manual Add",
      heading: "2. Track New Competitor",
      desc: "Manually input a competitor name and location details to trigger scraping tasks.",
      indicator: 2
    },
    {
      id: "tour-comp-tabs",
      title: "Intelligence tabs",
      heading: "3. Signal Comparison Categories",
      desc: "Toggle between marketing promotions, review trends, pricing models, and AI actions.",
      indicator: 3
    },
    {
      id: "tour-comp-cards",
      title: "Comparison Cards",
      heading: "4. Competitive Audit Reports",
      desc: "Detailed side-by-side analysis, highlighting key pricing shifts or discount campaigns.",
      indicator: 4
    }
  ];

  // Auto-trigger tour for new users once data has loaded
  useEffect(() => {
    if (!isLoading && competitors.length > 0) {
      const isCompleted = localStorage.getItem("saadhyam_tour_competitor_completed");
      if (!isCompleted) {
        const timer = setTimeout(() => {
          setIsTourActive(true);
          setTourStep(1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, competitors]);

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

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [businessType, setBusinessType] = useState<string>("your industry");
  const [monitoringId, setMonitoringId] = useState<string | null>(null); // which suggestion card is loading

  // Manual form state
  const [showManual, setShowManual] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLoc, setFormLoc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [manualSuggestions, setManualSuggestions] = useState<string[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"snapshot" | "marketing" | "pricing" | "reviews" | "recommendations">("snapshot");

  const scanSteps = [
    "Initializing secure scraper proxies...",
    "Querying Meta Ads Library index...",
    "Scanning public reviews & Google Maps references...",
    "Downloading public website pricing lists...",
    "Analyzing social media engagement indexes...",
    "Running Gemini AI sentiment correlation...",
    "Generating prioritized local threat suggestions...",
  ];

  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) throw new Error("Not authenticated");
    return token;
  };

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setConsoleLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 12)]);
  };

  useEffect(() => {
    loadCompetitors();
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (token) {
        const res = await getCompetitorSuggestions(token);
        setSuggestions(res.suggestions);
        setAllSuggestions(res.suggestions);
        setManualSuggestions(res.suggestions);
        setBusinessType(res.business_type || "your industry");
        // Stagger card animations
        res.suggestions.forEach((_, i) => {
          setTimeout(() => {
            setSuggestionsVisible((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, 80 * i);
        });
      }
    } catch {
      // Silently fail
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId !== null) {
      loadCompetitorDetails(selectedId);
    } else {
      setSelectedComp(null);
    }
  }, [selectedId]);

  const loadCompetitors = async (selectFirstId = true) => {
    setIsLoading(true);
    try {
      const token = getToken();
      const res = await getMonitoredCompetitors(token);
      setCompetitors(res.competitors);
      if (res.competitors.length > 0 && selectFirstId) {
        setSelectedId(res.competitors[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load monitored competitors");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompetitorDetails = async (id: number) => {
    try {
      const token = getToken();
      const res = await getCompetitorDetails(token, id);
      setSelectedComp(res.competitor);
    } catch {
      toast.error("Failed to load competitor detail metrics");
    }
  };

  const runScan = async (name: string, location?: string, website?: string) => {
    setIsAdding(true);
    setScanStep(0);
    setConsoleLogs([]);
    addLog(`Initiated competitive intelligence scan for: "${name}"`);

    let stepCount = 0;
    const stepInterval = setInterval(() => {
      stepCount++;
      if (stepCount < scanSteps.length) {
        setScanStep(stepCount);
        addLog(scanSteps[stepCount]);
      } else {
        clearInterval(stepInterval);
      }
    }, 700);

    try {
      const token = getToken();
      const res = await addCompetitor(token, {
        name: name.trim(),
        location: location?.trim() || undefined,
        website_or_social: website?.trim() || undefined,
      });

      clearInterval(stepInterval);
      addLog(`Scan complete. Saved intelligence record ID #${res.competitor.id}`);
      toast.success(`✅ Successfully analyzed: ${res.competitor.name}`, { position: "top-right" });

      // Remove from suggestions list
      setSuggestions((prev) => prev.filter((s) => s !== name));

      // Reset form
      setFormName("");
      setFormLoc("");
      setFormUrl("");

      await loadCompetitors(false);
      setSelectedId(res.competitor.id);
    } catch (err: any) {
      clearInterval(stepInterval);
      addLog(`Error during scan: ${err.message}`);
      toast.error(err.message || "Failed to analyze competitor");
    } finally {
      setIsAdding(false);
      setMonitoringId(null);
    }
  };

  const handleSuggestionMonitor = (name: string) => {
    setMonitoringId(name);
    runScan(name);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Please enter a competitor name");
      return;
    }
    await runScan(formName, formLoc, formUrl);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Remove all tracking data for "${name}"?`)) return;
    try {
      const token = getToken();
      await deleteCompetitor(token, id);
      toast.success(`Stopped tracking: ${name}`);
      const updated = competitors.filter((c) => c.id !== id);
      setCompetitors(updated);
      if (selectedId === id) {
        setSelectedId(updated.length > 0 ? updated[0].id : null);
        setSelectedComp(null);
      }
    } catch {
      toast.error("Failed to delete competitor tracking records");
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return <span className="px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] font-bold">High</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] font-bold">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 text-[10px] font-bold">Low</span>;
    }
  };

  const alreadyMonitored = (name: string) => competitors.some((c) => c.name.toLowerCase() === name.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page-level keyframe styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cai-sweep {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        @keyframes cai-fadeinup {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cai-glow-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
          50%      { box-shadow: 0 0 20px 4px rgba(124,58,237,0.3); }
        }
        @keyframes cai-border-cycle {
          0%,100% { border-color: rgba(124,58,237,0.25); }
          50%      { border-color: rgba(124,58,237,0.65); }
        }
        @keyframes cai-radar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cai-fadeinup { animation: cai-fadeinup 0.45s cubic-bezier(.22,1,.36,1) both; }
        .cai-sweep { animation: cai-sweep 2.5s ease-in-out infinite; }
        .cai-border-cycle { animation: cai-border-cycle 2.5s ease-in-out infinite; }
        .cai-glow-pulse { animation: cai-glow-pulse 3s ease-in-out infinite; }
        .cai-suggestion-card:hover { transform: translateY(-3px); }
        .cai-suggestion-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
      ` }} />

      {/* ── Live Scan Modal ── */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d1117] border border-violet-500/35 rounded-3xl p-6 shadow-[0_0_60px_rgba(124,58,237,0.20)] space-y-5 overflow-hidden relative cai-border-cycle">
            {/* sweep line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent cai-sweep" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">AI Scraper Core — LIVE</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">GEMINI_GROUNDED_SEARCH</span>
            </div>

            <div className="flex flex-col items-center py-4 text-center space-y-3">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border border-violet-500/20" />
                <div className="absolute inset-0 rounded-full border-t border-violet-500 cai-radar" style={{ animation: "cai-radar 1.4s linear infinite" }} />
                <div className="absolute inset-3 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Brain className="text-violet-400" size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Analyzing competitor signals...</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Querying Meta Ads, reviews, Google Search, social counters</p>
              </div>
            </div>

            {/* Terminal */}
            <div>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1 mb-1.5">Live Scraping Terminal</p>
              <div className="h-36 bg-[#060a0f] rounded-xl p-3 border border-white/5 font-mono text-[10px] space-y-1 overflow-y-auto">
                {consoleLogs.map((log, i) => (
                  <div key={i} className={`border-l-2 pl-2 ${i === 0 ? "text-violet-300 border-violet-500 font-bold" : "text-zinc-700 border-zinc-900"} dark:border-slate-700`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-zinc-700 px-1 border-t border-white/5 pt-2.5">
              <span>STATUS: RUNNING</span>
              <span>STEP {scanStep + 1}/7</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 space-y-7 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-xl bg-violet-100/70 border border-violet-200/60 dark:bg-violet-500/15 dark:border-violet-500/30 flex items-center justify-center">
                <Brain size={16} className="text-violet-600 dark:text-violet-400" />
              </span>
              Competitor Intelligence AI
              <span className="text-xs font-medium text-slate-450 dark:text-zinc-500 hidden sm:inline">— Market Strategist</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-zinc-400 pl-1">
              Track ads, pricing, reviews &amp; social signals for competitors in{" "}
              <span className="text-violet-600 dark:text-violet-400 font-semibold capitalize">{businessType}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tour-btn-competitor-help"
              type="button"
              className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/8 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all cursor-pointer"
              onClick={() => {
                setIsTourActive(true);
                setTourStep(1);
              }}
              title="Start Guided Tour"
            >
              <HelpCircle size={12} />
            </button>
            {competitors.length > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 dark:bg-violet-500/10 dark:border-violet-500/20 dark:text-violet-400 text-[11px] font-bold flex items-center gap-1.5">
                <Activity size={11} />
                {competitors.length} Monitored
              </span>
            )}
            <button
              onClick={() => setShowManual((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-white/8 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all"
            >
              <PenSquare size={12} />
              Manual Add
              {showManual ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>

        {/* ── Manual Add Form (collapsible) ── */}
        {showManual && (
          <div id="tour-comp-add-input" className="cai-fadeinup bg-slate-50/50 dark:bg-white/3 border border-violet-200 dark:border-violet-500/20 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
              <Plus size={13} />
              Add Competitor Manually
            </h3>
            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" size={12} />
                <input
                  type="text"
                  placeholder="Competitor name *"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setManualSuggestions(allSuggestions.filter((s) => s.toLowerCase().includes(e.target.value.toLowerCase())));
                    setShowDropdown(true);
                  }}
                  onFocus={() => { setManualSuggestions(allSuggestions); setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 160)}
                  className="w-full text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-violet-500/50 text-slate-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  required
                />
                {showDropdown && manualSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-violet-500/20 rounded-xl shadow-2xl overflow-hidden">
                    <div className="max-h-40 overflow-y-auto">
                      {manualSuggestions.slice(0, 7).map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => { setFormName(s); setShowDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-zinc-300 hover:bg-violet-500/10 flex items-center gap-2 transition-colors"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" size={12} />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={formLoc}
                  onChange={(e) => setFormLoc(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-violet-500/50 text-slate-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-500/20"
              >
                <Zap size={13} />
                Monitor Competitor
              </button>
            </form>
          </div>
        )}

        {/* ── AI-Suggested Competitors Grid ── */}
        {(suggestionsLoading || suggestions.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-px flex-1 bg-gradient-to-r from-violet-500/40 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles size={11} />
                AI-Recommended Competitors to Monitor
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/40 to-transparent" />
            </div>

            {suggestionsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-28 bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {suggestions.map((name, i) => {
                  const palette = CARD_PALETTES[i % CARD_PALETTES.length];
                  const monitored = alreadyMonitored(name);
                  const loading = monitoringId === name;
                  return (
                    <div
                      key={name}
                      className={`cai-suggestion-card relative overflow-hidden rounded-2xl border bg-white dark:bg-white/3 p-4 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all ${palette.border} ${monitored ? "opacity-50" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/6"}`}
                      style={{
                        opacity: suggestionsVisible[i] ? 1 : 0,
                        animation: suggestionsVisible[i] ? `cai-fadeinup 0.45s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` : "none",
                      }}
                    >
                      {/* Top glow orb */}
                      <div className={`absolute -top-4 -right-4 h-12 w-12 rounded-full blur-xl opacity-40 ${palette.dot} bg-current`} />

                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${palette.icon}`}>
                        <Target size={15} />
                      </div>

                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">{name}</p>
                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 capitalize">{businessType}</p>
                      </div>

                      {monitored ? (
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 w-fit ${palette.badge}`}>
                          <ShieldCheck size={9} />
                          Tracked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSuggestionMonitor(name)}
                          disabled={loading || isAdding}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 w-full justify-center transition-all ${palette.icon} border ${palette.border} hover:brightness-125 disabled:opacity-50`}
                        >
                          {loading ? (
                            <><span className="animate-spin text-base leading-none">↻</span> Scanning...</>
                          ) : (
                            <><Eye size={10} /> Monitor</>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Monitored Competitors + Detail View ── */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Left: tracked list */}
            <div id="tour-comp-watchlist" className="lg:col-span-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 px-1 flex items-center gap-1.5">
                <Users size={11} />
                Monitored ({competitors.length})
              </p>

              {competitors.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/2 p-6 text-center space-y-2">
                  <AlertCircle className="mx-auto text-zinc-400 dark:text-zinc-700" size={24} />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">No competitors tracked yet.</p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-50">Click Monitor on a suggestion above to start.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                  {competitors.map((c) => {
                    const isSelected = selectedId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`cai-suggestion-card flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                          isSelected
                            ? "bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10 dark:bg-violet-500/10 dark:border-violet-500/40"
                            : "bg-white border-slate-200 hover:bg-slate-50 hover:border-violet-500/20 dark:bg-white/3 dark:border-white/5 dark:hover:bg-white/5 dark:hover:border-violet-500/20"
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <p className={`text-xs font-bold truncate ${isSelected ? "text-violet-700 dark:text-violet-300" : "text-slate-800 dark:text-zinc-200"}`}>{c.name}</p>
                          <div className="flex items-center gap-2 text-[9px] text-zinc-500 dark:text-zinc-400">
                            {c.location && <span className="flex items-center gap-0.5"><MapPin size={8} />{c.location}</span>}
                            <span className={`font-bold ${isSelected ? "text-violet-600 dark:text-violet-400" : "text-zinc-500"}`}>{c.activity_score}%</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-600 dark:text-zinc-700 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: detail panel */}
            <div className="lg:col-span-9">
              {!selectedComp ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-white/2 p-16 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                    <Brain size={22} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-400">Select a tracked competitor to view intelligence</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">Click Monitor on any suggestion card to start tracking</p>
                </div>
              ) : (
                <div className="space-y-4 cai-fadeinup">

                  {/* Profile card */}
                  <div className="bg-white border border-slate-200 dark:bg-white/3 dark:border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedComp.name}</h2>
                        {selectedComp.website_or_social && (
                          <a href={selectedComp.website_or_social} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:underline">
                            <Globe size={9} /> Website
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-medium">
                        {selectedComp.location && <span className="flex items-center gap-1"><MapPin size={10} className="text-zinc-450" />{selectedComp.location}</span>}
                        <span>Sentiment: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedComp.review_sentiment || "N/A"}</span></span>
                        <span>Pricing: <span className="text-amber-600 dark:text-amber-400 font-bold">{selectedComp.pricing_trend || "Stable"}</span></span>
                      </div>
                    </div>

                    {/* Score ring */}
                    <div className="flex items-center gap-3 bg-violet-500/8 border border-violet-500/20 px-4 py-3 rounded-2xl shrink-0 cai-glow-pulse">
                      <div className="relative h-12 w-12 shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <g transform="rotate(-90 50 50)">
                            <circle cx="50" cy="50" r="40" stroke="rgba(124,58,237,0.12)" strokeWidth="8" fill="transparent" />
                            <circle cx="50" cy="50" r="40" stroke="rgb(124,58,237)" strokeWidth="8" fill="transparent"
                              strokeDasharray={251.3}
                              strokeDashoffset={251.3 - (251.3 * selectedComp.activity_score) / 100}
                              className="transition-all duration-1000"
                            />
                          </g>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-violet-600 dark:text-violet-400 z-10">
                          {selectedComp.activity_score}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Activity</p>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-300">
                          {selectedComp.activity_score >= 80 ? "Highly Active" : selectedComp.activity_score >= 60 ? "Moderate" : "Low Signals"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Tab nav */}
                  <div id="tour-comp-tabs" className="bg-slate-100/70 border border-slate-200 dark:bg-white/3 dark:border-white/6 p-1.5 rounded-xl flex flex-wrap gap-1">
                    {[
                      { id: "snapshot", label: "Overview", icon: Activity },
                      { id: "marketing", label: "Ads & Social", icon: Megaphone },
                      { id: "pricing", label: "Pricing", icon: DollarSign },
                      { id: "reviews", label: "Reviews", icon: MessageSquare },
                      { id: "recommendations", label: "AI Recs", icon: Sparkles },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          activeTab === id
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                            : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 dark:hover:text-zinc-300 dark:hover:bg-white/5"
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div id="tour-comp-cards" className="space-y-4">

                    {/* SNAPSHOT */}
                    {activeTab === "snapshot" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                            <TrendingUp size={11} /> Active Offers & Promos
                          </h4>
                          {selectedComp.trending_offers.length === 0 ? (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-600 italic">No visible offers recently.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedComp.trending_offers.map((offer, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-[11px] font-medium text-slate-700 dark:bg-violet-500/5 dark:border-violet-500/10 dark:text-zinc-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-1" />
                                  {offer}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <DollarSign size={11} /> Pricing Positioning
                          </h4>
                          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10 p-3 rounded-xl">
                            <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-semibold">Pricing Level:</span>
                            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">{selectedComp.pricing_trend || "Stable"}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-500 leading-relaxed">{selectedComp.pricing_data?.summary || "No pricing data available."}</p>
                        </div>

                        <div className="md:col-span-2 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                            <TrendingUp size={11} /> Market Demand & Search Spikes
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-700 uppercase tracking-widest mb-1">Search Spike Signals</p>
                              <p className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{selectedComp.demand_data?.search_trends || "Stable search trends"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-700 uppercase tracking-widest mb-1">Buying Intent</p>
                              <p className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{selectedComp.demand_data?.buying_behavior || "Direct booking patterns"}</p>
                            </div>
                          </div>
                          {selectedComp.demand_data?.market_demand_signals && (
                            <ul className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/5">
                              {selectedComp.demand_data.market_demand_signals.map((sig, i) => (
                                <li key={i} className="text-[11px] text-slate-600 dark:text-zinc-400 flex items-start gap-1.5">
                                  <span className="text-cyan-500 shrink-0">•</span>{sig}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}

                    {/* MARKETING */}
                    {activeTab === "marketing" && (
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-4 shadow-sm">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-3">
                            <Megaphone size={12} /> Ads & Local Promotions
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { label: "Facebook / Meta Ads", data: selectedComp.ads_data?.facebook_ads },
                              { label: "Google Search Ads", data: selectedComp.ads_data?.google_ads },
                              { label: "Instagram Promotions", data: selectedComp.ads_data?.instagram_promotions },
                              { label: "Local Promotions", data: selectedComp.ads_data?.local_promotions },
                            ].map(({ label, data }) => (
                              <div key={label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/2 dark:border-white/5 space-y-2 shadow-xs">
                                <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{label}</p>
                                {data && data.length > 0 ? data.map((ad, i) => (
                                  <p key={i} className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{ad}</p>
                                )) : <p className="text-[11px] text-slate-400 dark:text-zinc-700 italic">None detected.</p>}
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-slate-200 dark:border-white/5 pt-3">
                            <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-700 uppercase tracking-widest mb-1">Ad Strategy Summary</p>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{selectedComp.ads_data?.summary || "No significant promotions detected."}</p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 shadow-sm">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-3">
                            <Share2 size={12} /> Social Media Performance
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-700 uppercase tracking-widest mb-1">Follower Growth</p>
                              <p className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{selectedComp.social_data?.follower_growth || "No updates"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-700 uppercase tracking-widest mb-1">Engagement Trends</p>
                              <p className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{selectedComp.social_data?.engagement_trends || "Moderate activity"}</p>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 dark:border-white/5 pt-3">
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{selectedComp.social_data?.summary || "No social indicators."}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PRICING */}
                    {activeTab === "pricing" && (
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 shadow-sm">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-3">
                            <Zap size={12} /> Offers & Discounts
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                              { label: "Discount Campaigns", data: selectedComp.offers_data?.discount_campaigns },
                              { label: "Bundle Packs", data: selectedComp.offers_data?.bundle_offers },
                              { label: "Limited-Time Deals", data: selectedComp.offers_data?.limited_time_deals },
                            ].map(({ label, data }) => (
                              <div key={label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/2 dark:border-white/5 space-y-2 shadow-xs">
                                <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">{label}</p>
                                {data && data.length > 0 ? data.map((d, i) => (
                                  <p key={i} className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{d}</p>
                                )) : <p className="text-[11px] text-slate-400 dark:text-zinc-700 italic">None detected.</p>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 shadow-sm">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-3">
                            <DollarSign size={12} /> Pricing Shift Monitor
                          </h3>
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10 space-y-2">
                            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Detected Price Changes</p>
                            {selectedComp.pricing_data?.price_changes && selectedComp.pricing_data.price_changes.length > 0
                              ? selectedComp.pricing_data.price_changes.map((c, i) => (
                                <p key={i} className="text-[11px] text-slate-800 dark:text-zinc-300 font-medium">{c}</p>
                              ))
                              : <p className="text-[11px] text-slate-500 dark:text-zinc-600 italic">No recent pricing adjustments detected.</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REVIEWS */}
                    {activeTab === "reviews" && (
                      <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-4 shadow-sm">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-3">
                          <MessageSquare size={12} /> Reviews Sentiment & Patterns
                        </h3>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-violet-50 border border-violet-200 dark:bg-violet-500/5 dark:border-violet-500/15">
                          <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">Aggregate Sentiment:</span>
                          <span className="text-sm font-extrabold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                            <Star className="text-yellow-400 fill-yellow-400" size={13} />
                            {selectedComp.review_sentiment || "Stable"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10 space-y-3">
                            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle size={10} /> Positive Patterns</p>
                            {selectedComp.reviews_data?.positive_patterns?.length > 0
                              ? <ul className="space-y-1.5">{selectedComp.reviews_data.positive_patterns.map((p, i) => <li key={i} className="text-[11px] text-slate-800 dark:text-zinc-300 flex items-start gap-1.5"><span className="text-emerald-500 shrink-0">•</span>{p}</li>)}</ul>
                              : <p className="text-[11px] text-slate-400 dark:text-zinc-700 italic">None recorded.</p>}
                          </div>
                          <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-500/5 dark:border-red-500/10 space-y-3">
                            <p className="text-[9px] font-bold text-red-650 dark:text-red-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> Negative Patterns</p>
                            {selectedComp.reviews_data?.negative_patterns?.length > 0
                              ? <ul className="space-y-1.5">{selectedComp.reviews_data.negative_patterns.map((p, i) => <li key={i} className="text-[11px] text-slate-800 dark:text-zinc-300 flex items-start gap-1.5"><span className="text-red-500 shrink-0">•</span>{p}</li>)}</ul>
                              : <p className="text-[11px] text-slate-400 dark:text-zinc-700 italic">None recorded.</p>}
                          </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-white/5 pt-3">
                          <p className="text-[11px] text-slate-650 dark:text-zinc-400 leading-relaxed">{selectedComp.reviews_data?.summary || "No review intelligence collected."}</p>
                        </div>
                      </div>
                    )}

                    {/* RECOMMENDATIONS */}
                    {activeTab === "recommendations" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                            <Sparkles size={11} className="animate-pulse" /> AI Recommendation Engine
                          </h3>
                          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-700 uppercase">Threat Analysis Active</span>
                        </div>

                        {selectedComp.recommendations.length === 0 ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center dark:bg-white/2 dark:border-white/5">
                            <AlertCircle className="mx-auto text-zinc-400 dark:text-zinc-700 mb-2" size={28} />
                            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-500">No threat alerts generated.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedComp.recommendations.map((rec, i) => (
                              <div key={i} className="cai-suggestion-card bg-white dark:bg-white/2 border border-slate-200 dark:border-white/6 rounded-2xl p-4 space-y-3 hover:border-violet-500/25 flex flex-col justify-between shadow-sm">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{rec.title}</p>
                                    {renderPriorityBadge(rec.priority)}
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{rec.description}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5">
                                  <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-700 uppercase tracking-widest">{rec.category}</span>
                                  <button className="text-[10px] font-bold text-violet-600 hover:text-violet-500 flex items-center gap-1 transition-colors">
                                    {rec.action} <ArrowRight size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider animate-pulse">Monitoring Active Competitors</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Plus size={14} className="animate-pulse text-purple-400" />
                    <span>Inputs Audited Ready</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Signal Categories Live</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 4 && (
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
                        localStorage.setItem("saadhyam_tour_competitor_completed", "true");
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
