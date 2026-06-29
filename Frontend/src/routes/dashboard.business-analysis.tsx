import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useCooldown, formatCooldownTime } from "@/hooks/useCooldown";
import { useNotificationHelpers } from "@/components/notifications";
import {
  getBusinessAnalysisData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type BusinessAnalysisData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";
import { BusinessAnalysisLayout } from "@/components/business-analysis/BusinessAnalysisLayout";
import {
  BusinessPageHeader,
  HeaderActions,
  SectionDivider,
  LoadingState,
  AnalyzingState,
  NotStartedState,
  ErrorState,
} from "@/components/business-analysis/BusinessAnalysisShared";
import { BusinessHero, HealthScoreWidget } from "@/components/business-analysis/BusinessHero";
import { MetricsGrid } from "@/components/business-analysis/MetricCards";
import { AnalyticsSection } from "@/components/business-analysis/AnalyticsCharts";
import { InsightPanels } from "@/components/business-analysis/InsightPanels";
import { buildBusinessMetricsData, buildSwotData } from "@/components/business-analysis/utils";
import { Clock, Download, RefreshCw, Sparkles, HelpCircle, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/business-analysis")({
  head: () => ({ meta: [{ title: "Business Analysis — Saadhyam AI" }] }),
  component: BusinessAnalysisPage,
  // Prevent redirect on refresh - stay on this route even if there are errors
  beforeLoad: async ({ location }) => {
    // Log the current location to help debug
    console.log("🔍 Loading business-analysis route:", location.pathname);

    // Store this route in sessionStorage on client side only
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem("lastDashboardRoute", location.pathname);
      } catch (error) {
        console.warn("Could not save route to sessionStorage:", error);
      }
    }

    // This ensures the route loads without redirecting
    // Even if there are errors, the errorComponent will handle them
    return {};
  },
  errorComponent: ({ error, reset }) => (
    <div className="p-6">
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 dark:text-slate-100">Unable to load Business Analysis</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  ),
  // Explicitly prevent pending redirects
  pendingComponent: () => (
    <div className="p-6">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Business Analysis...</p>
      </div>
    </div>
  ),
});

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 dark:bg-slate-900">
      {/* Layered premium backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,oklch(0.92_0.06_295/0.45),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_50%,oklch(0.94_0.05_320/0.25),transparent_50%)]"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none absolute inset-0 bg-mesh opacity-[0.38]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">
        <BusinessAnalysisLayout>{children}</BusinessAnalysisLayout>
      </div>
    </div>
  );
}

function BusinessAnalysisPage() {
  const [analysis, setAnalysis] = useState<BusinessAnalysisData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifyWarning } = useNotificationHelpers();

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-ba-health-score",
      title: "Health Score",
      heading: "1. Business Health Score",
      desc: "Track your overall business standing based on online performance metrics.",
      indicator: 1
    },
    {
      id: "tour-ba-controls",
      title: "Analysis Controls",
      heading: "2. Controls & Actions",
      desc: "Regenerate your AI analysis or download the full comprehensive PDF report.",
      indicator: 2
    },
    {
      id: "tour-ba-hero",
      title: "Business Summary",
      heading: "3. Business Profile",
      desc: "Review your business location, category description, and key details.",
      indicator: 3
    },
    {
      id: "tour-ba-metrics",
      title: "Metrics Summary",
      heading: "4. Strengths & Opportunities",
      desc: "Quick count summary of your strengths, weaknesses, and optimization flags.",
      indicator: 4
    },
    {
      id: "tour-ba-analytics",
      title: "SWOT Analytics",
      heading: "5. SWOT & Sentiment Charts",
      desc: "Visual charts evaluating strengths, weaknesses, opportunities, and threats.",
      indicator: 5
    },
    {
      id: "tour-ba-insights",
      title: "Detailed Insights",
      heading: "6. AI Recommendations Panel",
      desc: "Deep dive tabs detailing key local demand analysis and optimization actions.",
      indicator: 6
    }
  ];

  // Auto-trigger tour for new users once data has loaded
  useEffect(() => {
    if (analysis) {
      const isCompleted = localStorage.getItem("saadhyam_tour_ba_completed");
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

  // Cooldown for regenerate button (2 hours)
  const regenerateCooldown = useCooldown({
    cooldownMinutes: 120,
    storageKey: 'business-analysis-cooldown',
  });

  const businessMetricsData = useMemo(() => buildBusinessMetricsData(analysis), [analysis]);
  const swotData = useMemo(() => buildSwotData(analysis), [analysis]);

  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const statusResult = await getAnalysisStatus(token);
      setStatus(statusResult);

      if (statusResult.status === "completed") {
        const data = await getBusinessAnalysisData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            const data = await getBusinessAnalysisData(token);
            setAnalysis(data);
            setIsAnalyzing(false);
          })
          .catch((err: Error) => {
            setError(err.message);
            setIsAnalyzing(false);
          });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load business analysis";
      console.error("Error loading data:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    // Check cooldown
    if (!regenerateCooldown.canExecute) {
      notifyWarning(
        'Analysis on Cooldown',
        `Please wait ${formatCooldownTime(regenerateCooldown.remainingTime)} before regenerating analysis.`
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const token = getToken();
      await triggerComprehensiveAnalysis(token);
      await pollAnalysisStatus(token, (updatedStatus) => {
        setStatus(updatedStatus);
      });
      const data = await getBusinessAnalysisData(token);
      setAnalysis(data);

      // Start cooldown ONLY after successfully getting complete data
      regenerateCooldown.execute();
    } catch (err: any) {
      console.error("Error analyzing:", err);
      setError(err.message || "Failed to analyze business");
      // Don't start cooldown if analysis failed - user can retry
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!analysis) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download the PDF report");
      return;
    }

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Business Analysis Report - ${analysis.business_details?.business_name || "Business"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; padding: 40px; background: white; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; font-weight: bold; color: rgba(139, 92, 246, 0.08); z-index: -1; pointer-events: none; white-space: nowrap; }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #8b5cf6; }
            .logo { font-size: 32px; font-weight: bold; color: #8b5cf6; margin-bottom: 10px; }
            .report-title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .report-date { color: #6b7280; font-size: 14px; }
            .business-overview { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
            .business-overview h2 { font-size: 24px; margin-bottom: 15px; }
            .business-info { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px; }
            .business-info-item { background: rgba(255, 255, 255, 0.2); padding: 10px 15px; border-radius: 8px; font-size: 14px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric-card { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
            .metric-value { font-size: 36px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px; }
            .metric-label { font-size: 14px; color: #6b7280; font-weight: 600; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
            .list-item { background: #f9fafb; padding: 12px 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #8b5cf6; }
            .strengths .list-item { border-left-color: #8b5cf6; }
            .weaknesses .list-item { border-left-color: #06b6d4; }
            .opportunities .list-item { border-left-color: #a855f7; }
            .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .insight-box { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .insight-title { font-weight: bold; color: #1f2937; margin-bottom: 8px; font-size: 14px; }
            .insight-content { color: #4b5563; font-size: 13px; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            .footer-logo { font-size: 18px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px; }
            @media print { body { padding: 20px; } .watermark { font-size: 100px; } }
          </style>
        </head>
        <body>
          <div class="watermark">MENTNEO</div>
          <div class="header">
            <div class="logo">MENTNEO</div>
            <div class="report-title">Business Analysis Report</div>
            <div class="report-date">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <div class="business-overview">
            <h2>${analysis.business_details?.business_name || "Business"}</h2>
            <div class="business-info">
              <div class="business-info-item">📍 ${analysis.business_details?.location || "N/A"}</div>
              <div class="business-info-item">🏢 ${analysis.business_details?.business_type || "N/A"}</div>
              ${analysis.health_score ? `<div class="business-info-item">💯 Health Score: ${analysis.health_score}/100</div>` : ""}
            </div>
            ${analysis.business_details?.summary ? `<p style="margin-top: 15px; font-size: 14px; line-height: 1.6;">${analysis.business_details.summary}</p>` : ""}
          </div>
          <div class="metrics-grid">
            <div class="metric-card"><div class="metric-value">${analysis.strengths?.length || 0}</div><div class="metric-label">Strengths</div></div>
            <div class="metric-card"><div class="metric-value">${analysis.weaknesses?.length || 0}</div><div class="metric-label">Weaknesses</div></div>
            <div class="metric-card"><div class="metric-value">${analysis.growth_opportunities?.length || 0}</div><div class="metric-label">Opportunities</div></div>
            <div class="metric-card"><div class="metric-value">${analysis.business_details?.services?.length || 0}</div><div class="metric-label">Services</div></div>
          </div>
          ${analysis.strengths && analysis.strengths.length > 0 ? `<div class="section strengths"><h3 class="section-title">✅ Strengths</h3>${analysis.strengths.map((item) => `<div class="list-item">${item}</div>`).join("")}</div>` : ""}
          ${analysis.weaknesses && analysis.weaknesses.length > 0 ? `<div class="section weaknesses"><h3 class="section-title">⚠️ Weaknesses</h3>${analysis.weaknesses.map((item) => `<div class="list-item">${item}</div>`).join("")}</div>` : ""}
          ${analysis.growth_opportunities && analysis.growth_opportunities.length > 0 ? `<div class="section opportunities"><h3 class="section-title">🎯 Growth Opportunities</h3>${analysis.growth_opportunities.map((item) => `<div class="list-item">${item}</div>`).join("")}</div>` : ""}
          ${analysis.local_market_insights ? `<div class="section"><h3 class="section-title">🗺️ Local Market Insights</h3><div class="insights-grid">${analysis.local_market_insights.local_demand ? `<div class="insight-box"><div class="insight-title">Local Demand</div><div class="insight-content">${analysis.local_market_insights.local_demand}</div></div>` : ""}${analysis.local_market_insights.customer_behavior ? `<div class="insight-box"><div class="insight-title">Customer Behavior</div><div class="insight-content">${analysis.local_market_insights.customer_behavior}</div></div>` : ""}${analysis.local_market_insights.competition_level ? `<div class="insight-box"><div class="insight-title">Competition Level</div><div class="insight-content">${analysis.local_market_insights.competition_level}</div></div>` : ""}${analysis.local_market_insights.trending_services && analysis.local_market_insights.trending_services.length > 0 ? `<div class="insight-box"><div class="insight-title">Trending Services</div><div class="insight-content">${analysis.local_market_insights.trending_services.join(", ")}</div></div>` : ""}</div></div>` : ""}
          <div class="footer">
            <div class="footer-logo">MENTNEO</div>
            <div>AI-Powered Business Intelligence Platform</div>
            <div style="margin-top: 5px;">This report was generated using real-time market data and AI analysis</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const header = (
    <BusinessPageHeader
      title="Business Analysis"
      subtitle=""
      lastUpdated={analysis?.last_updated}
      actions={
        analysis && (
          <div className="flex items-center gap-3">
            <button
              id="tour-btn-ba-help"
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
          </div>
        )
      }
    />
  );

  if (isLoading) {
    return (
      <PageShell>
        {header}
        <LoadingState />
      </PageShell>
    );
  }

  if (isAnalyzing || status?.status === "analyzing") {
    return (
      <PageShell>
        {header}
        <AnalyzingState />
      </PageShell>
    );
  }

  if (!analysis && status?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6 dark:bg-slate-900">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20 max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden backdrop-blur-md dark:border-slate-700">
          <div className="h-20 w-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <Sparkles size={40} className="text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Ready to Analyze Your Business?</h2>
          <p className="text-slate-400 mb-6 text-center max-w-md">
            Get comprehensive AI-powered insights including strengths, weaknesses, opportunities, and local market analysis.
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={handleAnalyze}
            disabled={!regenerateCooldown.canExecute}
            title={
              !regenerateCooldown.canExecute
                ? `Cooldown: ${formatCooldownTime(regenerateCooldown.remainingTime)}`
                : "Analyze your business"
            }
            className="shadow-glow"
          >
            <Sparkles size={20} className="mr-2" />
            {!regenerateCooldown.canExecute
              ? formatCooldownTime(regenerateCooldown.remainingTime).split(' ')[0]
              : 'Analyze My Business'}
          </Button>
          <p className="text-xs text-slate-500 mt-4">Takes 2-3 minutes • Powered by Google AI Studio Gemini</p>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <PageShell>
        {header}
        <ErrorState error={error} onRetry={handleAnalyze} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {header}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-6">
        {/* Left Column: Health Score & Control Center Panel */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          {/* Health Score Gauge Card */}
          {analysis?.health_score !== undefined && (
            <div id="tour-ba-health-score">
              <HealthScoreWidget score={analysis.health_score} />
            </div>
          )}

          {/* Quick Actions Panel */}
          <div id="tour-ba-controls" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden dark:border-slate-700">
            <div className="absolute top-0 right-0 h-32 w-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Analysis Controls</h3>
              </div>

              <Button
                variant="hero"
                size="default"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !regenerateCooldown.canExecute}
                title={
                  !regenerateCooldown.canExecute
                    ? `Cooldown: ${formatCooldownTime(regenerateCooldown.remainingTime)}`
                    : "Regenerate analysis"
                }
                className="w-full gap-2 justify-center py-2 h-9 text-xs shadow-lg shadow-purple-500/15"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing
                  ? "Analyzing..."
                  : !regenerateCooldown.canExecute
                    ? "On Cooldown"
                    : "Regenerate"}
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={handleDownloadPDF}
                disabled={!analysis}
                className="w-full gap-2 justify-center py-2 h-9 text-xs border-slate-800 hover:bg-slate-900 text-slate-300 dark:border-slate-700"
              >
                <Download size={14} /> Download PDF
              </Button>
            </div>
          </div>

          {/* Cooldown Timer Status */}
          {!regenerateCooldown.canExecute && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-400 space-y-1.5 dark:border-slate-700">
              <span className="font-semibold text-purple-400 uppercase tracking-wider block text-[9px]">Cooldown Active</span>
              <p>Next request available in:</p>
              <p className="font-bold text-slate-200">{formatCooldownTime(regenerateCooldown.remainingTime)}</p>
            </div>
          )}

          {/* Quick Summary / Engine Stats */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-[11px] text-slate-400 space-y-2 dark:border-slate-700">
            <div className="flex justify-between">
              <span>Grounding:</span>
              <span className="font-semibold text-slate-350">Google Grounded</span>
            </div>
            <div className="flex justify-between">
              <span>Engine Status:</span>
              <span className="font-semibold text-emerald-450">Stable</span>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {analysis?.business_details && (
            <div id="tour-ba-hero">
              <BusinessHero
                details={analysis.business_details}
              />
            </div>
          )}

          <div id="tour-ba-metrics">
            <MetricsGrid
              strengths={analysis?.strengths?.length ?? 0}
              weaknesses={analysis?.weaknesses?.length ?? 0}
              opportunities={analysis?.growth_opportunities?.length ?? 0}
              services={analysis?.business_details?.services?.length ?? 0}
            />
          </div>

          <SectionDivider />

          <div id="tour-ba-analytics">
            <AnalyticsSection businessMetricsData={businessMetricsData} swotData={swotData} />
          </div>

          <SectionDivider />

          <div id="tour-ba-insights">
            <InsightPanels
              strengths={analysis?.strengths ?? []}
              weaknesses={analysis?.weaknesses ?? []}
              opportunities={analysis?.growth_opportunities ?? []}
              localMarket={analysis?.local_market_insights}
            />
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-green-400 uppercase font-bold tracking-wider animate-pulse">Monitoring Live Health</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Sparkles size={14} className="animate-spin text-purple-400" />
                    <span>Google AI Studio Gemini Active</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Profile Grounding Active</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 4 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold">
                    <Clock size={12} className="animate-bounce" />
                    <span>Auditing Metrics Active</span>
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
                {activeTourSteps[tourStep - 1].indicator === 6 && (
                  <div className="text-[10px] font-bold text-purple-300 border border-purple-500/20 px-2 py-1 rounded bg-purple-500/10 flex items-center gap-1.5 animate-pulse">
                    <Zap size={10} />
                    <span>AI Analysis Active</span>
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
                        localStorage.setItem("saadhyam_tour_ba_completed", "true");
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
    </PageShell>
  );
}
