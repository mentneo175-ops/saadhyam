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
import { BusinessHero } from "@/components/business-analysis/BusinessHero";
import { MetricsGrid } from "@/components/business-analysis/MetricCards";
import { AnalyticsSection } from "@/components/business-analysis/AnalyticsCharts";
import { InsightPanels } from "@/components/business-analysis/InsightPanels";
import { buildBusinessMetricsData, buildSwotData } from "@/components/business-analysis/utils";
import { Clock, Download, RefreshCw, Sparkles } from "lucide-react";
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load Business Analysis</h2>
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
    <div className="relative w-full min-h-full overflow-hidden bg-background p-4 md:p-6 lg:p-8">
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
      subtitle="AI-powered insights from Google Search grounding"
      lastUpdated={analysis?.last_updated}
      actions={
        analysis ? (
          <HeaderActions
            onDownload={handleDownloadPDF}
            onReanalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        ) : undefined
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
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Analyze Your Business?</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
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
          >
            <Sparkles size={20} />
            {!regenerateCooldown.canExecute 
              ? formatCooldownTime(regenerateCooldown.remainingTime).split(' ')[0] 
              : 'Analyze My Business'}
          </Button>
          <p className="text-xs text-gray-500 mt-4">Takes 2-3 minutes • Powered by Google AI Studio Gemini</p>
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

      {analysis?.business_details && (
        <BusinessHero
          details={analysis.business_details}
          healthScore={analysis.health_score}
        />
      )}

      <MetricsGrid
        strengths={analysis?.strengths?.length ?? 0}
        weaknesses={analysis?.weaknesses?.length ?? 0}
        opportunities={analysis?.growth_opportunities?.length ?? 0}
        services={analysis?.business_details?.services?.length ?? 0}
      />

      <SectionDivider />

      <AnalyticsSection businessMetricsData={businessMetricsData} swotData={swotData} />

      <SectionDivider />

      <InsightPanels
        strengths={analysis?.strengths ?? []}
        weaknesses={analysis?.weaknesses ?? []}
        opportunities={analysis?.growth_opportunities ?? []}
        localMarket={analysis?.local_market_insights}
      />
    </PageShell>
  );
}
