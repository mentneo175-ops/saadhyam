import type { NearbyCompetitor, CompetitorAnalysis } from "@/lib/comprehensiveAnalysisApi";



export const CHART_COLORS = [

  "oklch(0.55 0.24 295)",

  "oklch(0.68 0.22 350)",

  "oklch(0.68 0.16 155)",

  "oklch(0.78 0.16 65)",

];



export function deriveThreatScore(competitor: NearbyCompetitor, index: number): number {

  const strengthLen = competitor.strengths?.length ?? 0;

  const weaknessLen = competitor.weaknesses?.length ?? 0;

  const raw = 58 + strengthLen * 0.35 - weaknessLen * 0.2 + (index % 4) * 4;

  return Math.min(94, Math.max(48, Math.round(raw)));

}



export function getAnalysisSummary(analysis: CompetitorAnalysis | undefined) {

  const competitors = analysis?.nearby_competitors?.length ?? 0;

  const patterns = analysis?.competitor_patterns?.length ?? 0;

  const gaps = analysis?.market_gaps?.length ?? 0;

  const ideas = analysis?.differentiation_ideas?.length ?? 0;

  const total = competitors + patterns + gaps + ideas;

  const readiness = total === 0 ? 0 : Math.min(98, 42 + patterns * 8 + gaps * 10 + ideas * 9);

  return { competitors, patterns, gaps, ideas, readiness };

}



export function hasAnyInsights(analysis: CompetitorAnalysis | undefined): boolean {

  if (!analysis) return false;

  return (

    (analysis.nearby_competitors?.length ?? 0) > 0 ||

    (analysis.competitor_patterns?.length ?? 0) > 0 ||

    (analysis.market_gaps?.length ?? 0) > 0 ||

    (analysis.differentiation_ideas?.length ?? 0) > 0

  );

}



function normalizeCount(count: number, max = 8): number {

  if (count === 0) return 0;

  return Math.min(10, Math.max(2, Math.round((count / max) * 10)));

}



export function buildLandscapeRadarData({

  competitors,

  patterns,

  gaps,

  ideas,

}: {

  competitors: number;

  patterns: number;

  gaps: number;

  ideas: number;

}) {

  return [

    { category: "Competitors", value: normalizeCount(competitors), fullMark: 10 },

    { category: "Patterns", value: normalizeCount(patterns), fullMark: 10 },

    { category: "Market gaps", value: normalizeCount(gaps), fullMark: 10 },

    { category: "Ideas", value: normalizeCount(ideas), fullMark: 10 },

  ];

}



export function buildIntelligenceDistribution({

  competitors,

  patterns,

  gaps,

  ideas,

}: {

  competitors: number;

  patterns: number;

  gaps: number;

  ideas: number;

}) {

  const items = [

    { name: "Competitors", value: competitors, color: CHART_COLORS[0] },

    { name: "Patterns", value: patterns, color: CHART_COLORS[1] },

    { name: "Market gaps", value: gaps, color: CHART_COLORS[2] },

    { name: "Ideas", value: ideas, color: CHART_COLORS[3] },

  ];

  return items.filter((item) => item.value > 0);

}



export function buildThreatDistribution(competitors: NearbyCompetitor[]) {

  const levels = { high: 0, medium: 0, moderate: 0 };

  competitors.forEach((c, i) => {

    const score = deriveThreatScore(c, i);

    if (score >= 75) levels.high++;

    else if (score >= 60) levels.medium++;

    else levels.moderate++;

  });

  return [

    { name: "High threat", value: levels.high, color: "oklch(0.6 0.24 27)" },

    { name: "Medium threat", value: levels.medium, color: "oklch(0.78 0.16 65)" },

    { name: "Moderate threat", value: levels.moderate, color: "oklch(0.68 0.16 155)" },

  ].filter((item) => item.value > 0);

}

