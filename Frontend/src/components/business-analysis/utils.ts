import type { BusinessAnalysisData } from "@/lib/comprehensiveAnalysisApi";

export function buildBusinessMetricsData(analysis: BusinessAnalysisData | null) {
  if (!analysis) return [];
  return [
    { category: "Strengths", value: analysis.strengths?.length || 0, fullMark: 10 },
    {
      category: "Opportunities",
      value: analysis.growth_opportunities?.length || 0,
      fullMark: 10,
    },
    {
      category: "Market Fit",
      value: analysis.health_score ? Math.floor(analysis.health_score / 10) : 5,
      fullMark: 10,
    },
    {
      category: "Services",
      value: analysis.business_details?.services?.length || 0,
      fullMark: 10,
    },
  ];
}

export function buildSwotData(analysis: BusinessAnalysisData | null) {
  if (!analysis) return [];
  return [
    { name: "Strengths", value: analysis.strengths?.length || 0, color: "oklch(0.55 0.24 295)" },
    { name: "Weaknesses", value: analysis.weaknesses?.length || 0, color: "oklch(0.68 0.22 350)" },
    {
      name: "Opportunities",
      value: analysis.growth_opportunities?.length || 0,
      color: "oklch(0.7 0.22 305)",
    },
  ];
}

export const CHART_COLORS = ["oklch(0.55 0.24 295)", "oklch(0.68 0.22 350)", "oklch(0.7 0.22 305)"];
