export interface SEOTipsData {
  keywords?: string[];
  ranking_tips?: string[];
  local_visibility_ideas?: string[];
}

export function computeSEOScore(data: SEOTipsData | null | undefined): number {
  if (!data) return 0;
  const kw = data.keywords?.length ?? 0;
  const tips = data.ranking_tips?.length ?? 0;
  const local = data.local_visibility_ideas?.length ?? 0;
  if (kw + tips + local === 0) return 0;
  const raw = kw * 12 + tips * 10 + local * 8 + 28;
  return Math.min(98, Math.max(42, raw));
}

export function computeMapsScore(data: SEOTipsData | null | undefined): number {
  if (!data) return 0;
  const tips = data.ranking_tips?.length ?? 0;
  const local = data.local_visibility_ideas?.length ?? 0;
  const kw = data.keywords?.length ?? 0;
  if (tips + local + kw === 0) return 0;
  const raw = local * 14 + tips * 9 + kw * 6 + 32;
  return Math.min(96, Math.max(38, raw));
}

export function buildSearchTrend(keywordCount: number): { week: string; impressions: number }[] {
  const base = Math.max(keywordCount * 8, 24);
  const weeks = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return weeks.map((week, i) => ({
    week,
    impressions: Math.round(base + i * 6 + (i % 2 === 0 ? 12 : -4) + keywordCount * 2),
  }));
}

export function deriveKeywordRank(index: number): number {
  const ranks = [3, 5, 8, 12, 15, 18, 22, 28];
  return ranks[index % ranks.length] + (index > 4 ? 5 : 0);
}

export function auditItemsFromTips(tips: string[]): { label: string; progress: number }[] {
  const defaults = [
    { label: "Google Business Profile", progress: 72 },
    { label: "On-page SEO", progress: 65 },
    { label: "Local citations", progress: 58 },
    { label: "Review velocity", progress: 54 },
  ];
  if (!tips.length) return defaults;
  return tips.slice(0, 4).map((tip, i) => ({
    label: tip.length > 48 ? `${tip.slice(0, 45)}…` : tip,
    progress: Math.min(92, 48 + (i + 1) * 12 + (tip.length % 20)),
  }));
}
