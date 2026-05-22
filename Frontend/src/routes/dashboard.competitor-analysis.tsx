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
    <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8 lg:p-10">
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
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader title="Competitor Analysis" subtitle="Understand your competitive landscape" />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-[#8B5CF6] mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  // Analyzing state
  if (isAnalyzing || status?.status === "analyzing") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader title="Competitor Analysis" subtitle="Understand your competitive landscape" />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-[#8B5CF6] mb-4" />
          <p className="text-lg font-semibold text-gray-900">Analyzing competitors...</p>
          <p className="text-sm text-gray-600 mt-2">This may take 2-3 minutes</p>
          {/* <p className="text-xs text-gray-500 mt-1">Using Google AI Studio Gemini with Search Grounding</p> */}
        </div>
      </div>
    );
  }

  // Not started state
  if (!analysis && status?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader title="Competitor Analysis" subtitle="Understand your competitive landscape" />
        <div className="flex flex-col items-center justify-center py-20">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 flex items-center justify-center mb-6">
              <Users size={40} className="text-[#8B5CF6]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analysis Found</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            You need to run a business analysis first to see competitor insights.
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate({ to: "/dashboard/business-analysis" })}
          >
            <Sparkles size={20} />
            Go to Business Analysis
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader title="Competitor Analysis" subtitle="Understand your competitive landscape" />
        <div className="bg-red-50 border-red-200 border rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</p>
          <p className="text-red-700 mb-4">{error}</p>
          <Button variant="hero" onClick={handleAnalyze}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show competitor analysis data
  return (
    <div className="p-4 md:p-6 space-y-8">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competitor Analysis</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
            <Users size={16} className="text-[#8B5CF6]" />
            Understand your competitive landscape and market opportunities
          </p>
          {analysis?.last_updated && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
              <Clock size={14} />
              Last updated: {new Date(analysis.last_updated).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white font-semibold shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
          Re-analyze
        </Button>
      </div>

      {/* Nearby Competitors */}
      {analysis?.competitor_analysis?.nearby_competitors &&
        analysis.competitor_analysis.nearby_competitors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Users size={24} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Nearby Competitors</h3>
                <p className="text-sm text-gray-600">Real businesses competing in your area</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {analysis.competitor_analysis.nearby_competitors.map((competitor, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-[#F9F7FF] to-[#F3EEFF] p-6 shadow-lg shadow-[#8B5CF6]/10 hover:shadow-xl hover:shadow-[#8B5CF6]/20 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  {/* Background gradient accent */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent rounded-full blur-2xl -z-10 group-hover:from-[#8B5CF6]/20 transition-all duration-300"></div>

                  <div className="flex items-start gap-4 mb-5">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shrink-0 shadow-lg shadow-[#8B5CF6]/30">
                      <span className="text-lg font-bold text-white">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 truncate">
                        {competitor.name}
                      </h4>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{competitor.location}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-[#8B5CF6]/20 to-[#A855F7]/20 text-[#8B5CF6] text-xs font-semibold rounded-full border border-[#E9D5FF]">
                        {competitor.type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Strengths */}
                    <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-[#8B5CF6]/20 p-3 hover:bg-white/80 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-[#8B5CF6] shrink-0" />
                        <p className="text-xs font-bold text-gray-900">Strengths</p>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {competitor.strengths}
                      </p>
                    </div>

                    {/* Weaknesses */}
                    <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-[#A855F7]/20 p-3 hover:bg-white/80 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-[#A855F7] shrink-0" />
                        <p className="text-xs font-bold text-gray-900">Weaknesses</p>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {competitor.weaknesses}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Competitor Patterns */}
      {analysis?.competitor_analysis?.competitor_patterns &&
        analysis.competitor_analysis.competitor_patterns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 flex items-center justify-center">
                <TrendingUp size={24} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Competitor Patterns</h3>
                <p className="text-sm text-gray-600">
                  What your competitors are doing successfully
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {analysis.competitor_analysis.competitor_patterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-white to-[#F9F7FF] p-5 shadow-lg shadow-[#8B5CF6]/10 hover:shadow-xl hover:shadow-[#8B5CF6]/20 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#8B5CF6]/15 to-transparent rounded-full blur-2xl -z-10 group-hover:from-[#8B5CF6]/25 transition-all duration-300"></div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shrink-0 shadow-md shadow-[#8B5CF6]/30 mt-1">
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed pt-1">
                      {pattern}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Market Gaps */}
      {analysis?.competitor_analysis?.market_gaps &&
        analysis.competitor_analysis.market_gaps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Target size={24} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Market Gaps & Opportunities</h3>
                <p className="text-sm text-gray-600">Opportunities your competitors are missing</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {analysis.competitor_analysis.market_gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-white to-[#F9F7FF] p-5 shadow-lg shadow-[#8B5CF6]/10 hover:shadow-xl hover:shadow-[#8B5CF6]/20 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#A855F7]/15 to-transparent rounded-full blur-2xl -z-10 group-hover:from-[#A855F7]/25 transition-all duration-300"></div>

                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shrink-0 shadow-md shadow-[#8B5CF6]/30 mt-1">
                      <Zap size={18} className="text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed pt-1">{gap}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Differentiation Ideas */}
      {analysis?.competitor_analysis?.differentiation_ideas &&
        analysis.competitor_analysis.differentiation_ideas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 flex items-center justify-center">
                <Lightbulb size={24} className="text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Differentiation Ideas</h3>
                <p className="text-sm text-gray-600">How to stand out and win market share</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {analysis.competitor_analysis.differentiation_ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-white via-[#F9F7FF] to-[#F3EEFF] p-6 shadow-lg shadow-[#8B5CF6]/10 hover:shadow-xl hover:shadow-[#8B5CF6]/20 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
                  }}
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#8B5CF6]/12 to-transparent rounded-full blur-2xl -z-10 group-hover:from-[#8B5CF6]/20 transition-all duration-300"></div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shrink-0 shadow-lg shadow-[#8B5CF6]/30 group-hover:scale-110 transition-transform">
                      <Lightbulb size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-3">
                        {idea}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Empty State */}
      {(!analysis?.competitor_analysis?.competitor_patterns ||
        analysis.competitor_analysis.competitor_patterns.length === 0) &&
        (!analysis?.competitor_analysis?.market_gaps ||
          analysis.competitor_analysis.market_gaps.length === 0) &&
        (!analysis?.competitor_analysis?.differentiation_ideas ||
          analysis.competitor_analysis.differentiation_ideas.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-[#F9F7FF] to-[#F3EEFF]">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/20 flex items-center justify-center mb-4">
              <Users size={32} className="text-[#8B5CF6]" />
            </div>
            <p className="text-lg font-semibold text-gray-900">No competitor analysis data yet</p>
            <p className="text-sm text-gray-600 mt-2">
              Run a business analysis to get detailed competitor insights.
            </p>
          </div>
        )}

      {/* Call to Action */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E9D5FF] bg-gradient-to-r from-[#F9F7FF] via-[#F3EEFF] to-white p-8 shadow-lg shadow-[#8B5CF6]/20">
        {/* Gradient accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#8B5CF6]/15 to-transparent rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[#A855F7]/10 to-transparent rounded-full blur-3xl -z-10"></div>

        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shrink-0 shadow-lg shadow-[#8B5CF6]/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Differentiate?</h3>
            <p className="text-sm text-gray-700 mb-6">
              Use these insights to create a unique value proposition that sets you apart from
              competitors and capture untapped market opportunities.
            </p>
            <Button
              className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white font-semibold shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all"
              onClick={() => navigate({ to: "/dashboard/business-analysis" })}
            >
              View Full Analysis
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
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
      <PageShell>
        {header}

        <NotStartedState onNavigate={() => navigate({ to: "/dashboard/business-analysis" })} />
      </PageShell>
    );
  }

  if (error && !analysis) {
    return (
      <PageShell>
        {header}

        <ErrorState error={error || "An unknown error occurred"} onRetry={handleAnalyze} />
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
      <div className="sticky top-0 z-20 -mx-1 rounded-xl border border-border/50 bg-background/85 px-5 py-5 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] backdrop-blur-md md:-mx-2 md:px-6">
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
