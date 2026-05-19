import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
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
import {
  getSEOGoogleMapsData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type SEOGoogleMapsData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";

export const Route = createFileRoute("/dashboard/seo-google-maps")({
  head: () => ({ meta: [{ title: "SEO & Google Maps — Saadhyam AI" }] }),
  component: SEOGoogleMapsPage,
});

function SEOGoogleMapsPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SEOGoogleMapsData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SEOTabId>("seo");

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
      const message = err instanceof Error ? err.message : "Failed to load SEO & Google Maps data";
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

  const header = (
    <SEOPageHeader
      title="SEO & Google Maps"
      subtitle="Boost your local visibility and search rankings"
      lastUpdated={analysis?.last_updated}
      actions={
        analysis ? (
          <Button
            variant="hero"
            size="default"
            className="gap-2"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            Re-analyze
          </Button>
        ) : undefined
      }
    />
  );

  if (isLoading) {
    return (
      <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8">
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
      <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8">
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
      <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8">
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
      <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <SEOLayout>
          {header}
          <ErrorState error={error} onRetry={handleAnalyze} />
        </SEOLayout>
      </div>
    );
  }

  return (
    <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
      <SEOLayout>
        {header}

        <SEOTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        {tipsData ? (
          activeTab === "seo" ? (
            <SEOTabPanel data={tipsData} />
          ) : (
            <MapsTabPanel data={tipsData} />
          )
        ) : (
          <EmptyInsightsState />
        )}

        <QuickActionsGrid delay={0.35} />
        <ProTipsBanner delay={0.42} />
      </SEOLayout>
    </div>
  );
}
