import { createFileRoute, useNavigate } from "@tanstack/react-router";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Users,
  Brain,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Clock,
  Loader2,
  Sparkles,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import {
  getCompetitorAnalysisData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type CompetitorAnalysisData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";

import { CompetitorLayout } from "@/components/competitor-analysis/CompetitorLayout";

import {
  CompetitorPageHeader,
  ReanalyzeButton,
  SectionHeader,
  SummaryMetric,
  SectionDivider,
  LoadingState,
  AnalyzingState,
  NotStartedState,
  ErrorState,
  EmptyInsightsState,
} from "@/components/competitor-analysis/CompetitorShared";

import { CompetitorGrid } from "@/components/competitor-analysis/CompetitorCards";

import { CompetitorAnalyticsSection } from "@/components/competitor-analysis/CompetitorCharts";

import {
  AIInsightsPanel,
  MarketGapsPanel,
  DifferentiationPanel,
  DifferentiationCTA,
} from "@/components/competitor-analysis/CompetitorInsights";

import { getAnalysisSummary, hasAnyInsights } from "@/components/competitor-analysis/utils";

export const Route = createFileRoute("/dashboard/competitor-analysis")({
  head: () => ({ meta: [{ title: "Competitor Analysis — Saadhyam AI" }] }),

  component: CompetitorAnalysisPage,
});

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -m-4 min-h-full bg-background p-6 md:p-8 lg:p-10">
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-mesh opacity-30" />

      <CompetitorLayout>{children}</CompetitorLayout>
    </div>
  );
}

function CompetitorAnalysisPage() {
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<CompetitorAnalysisData | null>(null);

  const [status, setStatus] = useState<AnalysisStatus | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState<string | null>(null);

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
        const data = await getCompetitorAnalysisData(token);

        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        setIsAnalyzing(true);

        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            const data = await getCompetitorAnalysisData(token);

            setAnalysis(data);

            setIsAnalyzing(false);
          })

          .catch((err: Error) => {
            setError(err.message);

            setIsAnalyzing(false);
          });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load competitor analysis";

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

      const data = await getCompetitorAnalysisData(token);

      setAnalysis(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze business";

      console.error("Error analyzing:", err);

      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const header = (
    <CompetitorPageHeader
      title="Competitor Analysis"
      subtitle="Understand your competitive landscape with AI-powered intelligence"
      lastUpdated={analysis?.last_updated}
      actions={
        analysis ? <ReanalyzeButton onClick={handleAnalyze} disabled={isAnalyzing} /> : undefined
      }
    />
  );

  // Loading state

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  }

  // Analyzing state
  if (isAnalyzing || status?.status === "analyzing") {
    return (
      <PageShell>
        <AnalyzingState />
      </PageShell>
    );
  }

  // Not started state
  if (!analysis && status?.status === "not_started") {
    return (
      <PageShell>
        <NotStartedState onNavigate={() => navigate({ to: "/dashboard/business-analysis" })} />
      </PageShell>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <PageShell>
        <ErrorState error={error} onRetry={handleAnalyze} />
      </PageShell>
    );
  }


  const data = analysis?.competitor_analysis;

  const summary = getAnalysisSummary(data);

  const competitors = data?.nearby_competitors ?? [];

  const patterns = data?.competitor_patterns ?? [];

  const gaps = data?.market_gaps ?? [];

  const ideas = data?.differentiation_ideas ?? [];

  return (
    <PageShell>
      <div className="sticky top-14 lg:top-0 z-20 -mx-1 rounded-xl border border-border/50 bg-background/85 px-5 py-5 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] backdrop-blur-md md:-mx-2 md:px-6">
        {header}
      </div>

      {hasAnyInsights(data) && (
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryMetric
              label="Nearby competitors"
              value={summary.competitors}
              icon={Users}
              delay={0}
              metricKey="competitors"
            />

            <SummaryMetric
              label="AI patterns"
              value={summary.patterns}
              icon={Brain}
              delay={0.05}
              metricKey="patterns"
            />

            <SummaryMetric
              label="Market gaps"
              value={summary.gaps}
              icon={Target}
              delay={0.1}
              metricKey="gaps"
            />

            <SummaryMetric
              label="Differentiation ideas"
              value={summary.ideas}
              icon={Lightbulb}
              delay={0.15}
              metricKey="ideas"
            />
          </div>
        </section>
      )}

      {hasAnyInsights(data) && (
        <>
          <SectionDivider />

          <CompetitorAnalyticsSection
            competitors={summary.competitors}
            patterns={summary.patterns}
            gaps={summary.gaps}
            ideas={summary.ideas}
          />
        </>
      )}

      {competitors.length > 0 && (
        <>
          <SectionDivider />

          <section className="space-y-6">
            <SectionHeader
              title="Nearby competitors"
              subtitle="Real businesses competing in your area"
              icon={Users}
              badge={`${competitors.length} tracked`}
            />

            <CompetitorGrid competitors={competitors} />
          </section>
        </>
      )}

      {(patterns.length > 0 || gaps.length > 0) && (
        <>
          <SectionDivider />

          <div className="grid gap-5 lg:grid-cols-2">
            {patterns.length > 0 && <AIInsightsPanel patterns={patterns} />}

            {gaps.length > 0 && <MarketGapsPanel gaps={gaps} />}
          </div>
        </>
      )}

      {ideas.length > 0 && (
        <>
          <SectionDivider />

          <DifferentiationPanel ideas={ideas} />
        </>
      )}

      {!hasAnyInsights(data) && <EmptyInsightsState />}

      <DifferentiationCTA onNavigate={() => navigate({ to: "/dashboard/business-analysis" })} />
    </PageShell>
  );
}
