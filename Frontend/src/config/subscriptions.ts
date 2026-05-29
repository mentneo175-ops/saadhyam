export const PACK_ORDER = ["starter", "growth", "premium"] as const;

export type PackKey = (typeof PACK_ORDER)[number];

export const PACK_LABELS: Record<PackKey, string> = {
  starter: "Starter Pack",
  growth: "Growth Pack",
  premium: "Premium Pack",
};

export const PACK_VALIDITY_DAYS: Record<PackKey, number> = {
  starter: 30,
  growth: 30,
  premium: 30,
};

export const PACK_FEATURE_BLURBS: Record<PackKey, string[]> = {
  starter: ["Core analysis tools", "Basic content support", "Starter dashboard access"],
  growth: ["All starter features", "Automation upgrades", "Growth-grade insights"],
  premium: ["Everything unlocked", "Priority support", "Full platform access"],
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
  starter: "₹499",
  growth: "₹2,999",
  premium: "₹4,999",
};

export const PACK_TAGS: Record<PackKey, string> = {
  starter: "For solo founders",
  growth: "Most popular",
  premium: "All features",
};

export const PACK_DESCRIPTIONS: Record<PackKey, string> = {
  starter: "Lightweight essentials for getting started with Saadhyam AI.",
  growth: "Balanced automation for teams that want stronger growth features.",
  premium: "Full access for businesses that want the complete platform.",
};

export const PACK_HIGHLIGHTS: Record<PackKey, string> = {
  starter: "Best for testing the platform",
  growth: "Best value for growing businesses",
  premium: "Everything unlocked",
};

export const PACK_CTAS: Record<PackKey, string> = {
  starter: "Start Starter",
  growth: "Choose Growth",
  premium: "Go Premium",
};

export const PACK_FEATURE_MATRIX: Record<PackKey, Record<string, FeatureStatus>> = {
  starter: {
    "Business analysis": "included",
    "Competitor analysis": "included",
    "Content creator": "partial",
    "Instagram tools": "partial",
    "Website AI": "excluded",
    "SEO & Google Maps": "excluded",
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
  premium: Object.fromEntries(FEATURE_ROWS.map((feature) => [feature, "included"])) as Record<string, FeatureStatus>,
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
  return PACK_ORDER.includes(normalized as PackKey) ? (normalized as PackKey) : "starter";
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
