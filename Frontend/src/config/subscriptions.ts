export const PACK_ORDER = ["starter", "growth", "education", "business"] as const;

export type PackKey = (typeof PACK_ORDER)[number];

export const PACK_LABELS: Record<PackKey, string> = {
  starter: "Starter Pack",
  growth: "Growth Pack",
  education: "Education Pack",
  business: "Business Pack",
};

export const PACK_VALIDITY_DAYS: Record<PackKey, number> = {
  starter: 30,
  growth: 30,
  education: 30,
  business: 30,
};

export const PACK_FEATURE_BLURBS: Record<PackKey, string[]> = {
  starter: ["Core analysis tools", "Basic content support", "Starter dashboard access"],
  growth: ["All starter features", "Automation upgrades", "Growth-grade insights"],
  education: ["Institute workflows", "Bulk reporting", "Classroom-friendly management"],
  business: ["Advanced automation", "Multi-channel sales", "Team-scale workflows", "Everything unlocked"],
};

export type FeatureStatus = "included" | "partial" | "excluded";

export const FEATURE_ROWS = [
  "Business analysis",
  "Competitor analysis",
  "Content creator",
  "Instagram tools",
  "Website AI",
  "SEO & Google Maps",
  "Meta ads",
  "AI Voice Agent",
  "WhatsApp Sales",
  "B2B Network",
  "Daily suggestions",
  "Reports & insights",
];

export const PACK_PRICES: Record<PackKey, string> = {
  starter: "₹2,999",
  growth: "₹9,999",
  education: "₹14,999",
  business: "₹24,999",
};

export const PACK_TAGS: Record<PackKey, string> = {
  starter: "For low-business users",
  growth: "For small businesses",
  education: "Recommended for colleges",
  business: "Recommended for medium business",
};

export const PACK_DESCRIPTIONS: Record<PackKey, string> = {
  starter: "Lightweight essentials for getting started with Saadhyam AI.",
  growth: "Balanced automation for teams that want stronger growth features.",
  education: "Built for colleges, institutes, and training organizations.",
  business: "Full-featured automation for medium-level businesses with all features unlocked.",
};

export const PACK_HIGHLIGHTS: Record<PackKey, string> = {
  starter: "Best for testing the platform",
  growth: "Best value for small businesses",
  education: "Best fit for education workflows",
  business: "Best fit for medium business growth & enterprise features",
};

export const PACK_CTAS: Record<PackKey, string> = {
  starter: "Choose Starter",
  growth: "Choose Growth",
  education: "Choose Education",
  business: "Choose Business",
};

export const PACK_FEATURE_MATRIX: Record<PackKey, Record<string, FeatureStatus>> = {
  starter: {
    "Business analysis": "included",
    "Competitor analysis": "included",
    "Content creator": "partial",
    "Instagram tools": "partial",
    "Website AI": "excluded",
    "SEO & Google Maps": "partial",
    "Meta ads": "excluded",
    "AI Voice Agent": "excluded",
    "WhatsApp Sales": "excluded",
    "B2B Network": "excluded",
    "Daily suggestions": "included",
    "Reports & insights": "partial",
  },
  growth: {
    "Business analysis": "included",
    "Competitor analysis": "included",
    "Content creator": "included",
    "Instagram tools": "included",
    "Website AI": "partial",
    "SEO & Google Maps": "partial",
    "Meta ads": "partial",
    "AI Voice Agent": "excluded",
    "WhatsApp Sales": "partial",
    "B2B Network": "partial",
    "Daily suggestions": "included",
    "Reports & insights": "included",
  },
  education: {
    "Business analysis": "included",
    "Competitor analysis": "included",
    "Content creator": "included",
    "Instagram tools": "included",
    "Website AI": "partial",
    "SEO & Google Maps": "included",
    "Meta ads": "partial",
    "AI Voice Agent": "excluded",
    "WhatsApp Sales": "partial",
    "B2B Network": "partial",
    "Daily suggestions": "included",
    "Reports & insights": "included",
  },
  business: Object.fromEntries(FEATURE_ROWS.map((feature) => [feature, "included"])) as Record<string, FeatureStatus>,
};

export const PACK_CATALOG = PACK_ORDER.map((key) => ({
  key,
  name: PACK_LABELS[key],
  price: PACK_PRICES[key],
  tag: PACK_TAGS[key],
  description: PACK_DESCRIPTIONS[key],
  highlight: PACK_HIGHLIGHTS[key],
  cta: PACK_CTAS[key],
  features: PACK_FEATURE_MATRIX[key],
}));

export function normalizePackKey(value?: string | null): PackKey {
  const normalized = (value || "starter").toLowerCase();
  if (PACK_ORDER.includes(normalized as PackKey)) {
    return normalized as PackKey;
  }

  if (normalized === "premium" || normalized === "pro") {
    return "business";
  }

  return "starter";
}

export function getPackRank(planKey?: string | null) {
  return PACK_ORDER.indexOf(normalizePackKey(planKey)) + 1;
}

export function getNextPackKey(planKey?: string | null): PackKey | null {
  const normalized = normalizePackKey(planKey);
  const index = PACK_ORDER.indexOf(normalized);
  if (index < 0 || index >= PACK_ORDER.length - 1) {
    return null;
  }

  return PACK_ORDER[index + 1];
}

export function getSubscriptionWindow(purchasedAt?: string | null, planKey?: string | null) {
  if (!purchasedAt) {
    return {
      activeDays: null as number | null,
      validityDays: PACK_VALIDITY_DAYS[normalizePackKey(planKey)],
      daysLeft: null as number | null,
      expiresAt: null as Date | null,
    };
  }

  const purchasedDate = new Date(purchasedAt);
  if (Number.isNaN(purchasedDate.getTime())) {
    return {
      activeDays: null as number | null,
      validityDays: PACK_VALIDITY_DAYS[normalizePackKey(planKey)],
      daysLeft: null as number | null,
      expiresAt: null as Date | null,
    };
  }

  const validityDays = PACK_VALIDITY_DAYS[normalizePackKey(planKey)];
  const activeDays = Math.max(1, Math.floor((Date.now() - purchasedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const expiresAt = new Date(purchasedDate);
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  return {
    activeDays,
    validityDays,
    daysLeft: Math.max(0, validityDays - activeDays),
    expiresAt,
  };
}

/**
 * Maps dashboard route segments to their corresponding feature row names
 * from the PACK_FEATURE_MATRIX.
 */
export const ROUTE_FEATURE_MAP: Record<string, string> = {
  "website": "Website AI",
  "content": "Content creator",
  "instagram": "Instagram tools",
  "instagram-analytics": "Instagram tools",
  "voice-agent": "AI Voice Agent",
  "aeo-geo": "SEO & Google Maps",
  "seo-google-maps": "SEO & Google Maps",
  "seo": "SEO & Google Maps",
  "meta-ads": "Meta ads",
  "whatsapp": "WhatsApp Sales",
  "whatsapp-sales": "WhatsApp Sales",
  "b2b-network": "B2B Network",
  "b2b-chat": "B2B Network",
  "business-analysis": "Business analysis",
  "competitor-analysis": "Competitor analysis",
  "competitors": "Competitor analysis",
  "daily-ask": "Daily suggestions",
  "reports": "Reports & insights",
  "insights": "Reports & insights",
  "growth": "Reports & insights",
};

/**
 * Given a dashboard path like "/dashboard/website", resolves the feature name.
 * Returns null for paths that don't map to a gated feature (e.g. /dashboard, /dashboard/pricing).
 */
export function resolveFeatureFromPath(pathname: string): string | null {
  // Extract the segment after /dashboard/
  const match = pathname.match(/^\/dashboard\/([a-z0-9-]+)/);
  if (!match) return null;
  const segment = match[1];
  // Skip non-feature pages
  const skipSegments = ["pricing", "checkout", "settings", "business-details", "actions", "automation", "chat", "messages", "customers", "blogs", "review-reply", "youtube"];
  if (skipSegments.includes(segment)) return null;
  return ROUTE_FEATURE_MAP[segment] || null;
}

/**
 * For a given feature name and the user's current plan, returns the list of
 * plan keys (in order) that include or partially include this feature.
 * This is used to suggest upgrade targets.
 */
export function getUpgradePlansForFeature(featureName: string, currentPlanKey?: string | null): Array<{ key: PackKey; name: string; price: string; status: FeatureStatus }> {
  const currentRank = getPackRank(currentPlanKey);
  const results: Array<{ key: PackKey; name: string; price: string; status: FeatureStatus }> = [];
  for (const packKey of PACK_ORDER) {
    const rank = PACK_ORDER.indexOf(packKey) + 1;
    if (rank <= currentRank) continue; // Skip current and lower plans
    const status = PACK_FEATURE_MATRIX[packKey]?.[featureName];
    if (status === "included" || status === "partial") {
      results.push({
        key: packKey,
        name: PACK_LABELS[packKey],
        price: PACK_PRICES[packKey],
        status,
      });
    }
  }
  return results;
}
