export const FEATURE_KEYS = {
  WEBSITE_AI: "website_ai",
  CONTENT_CREATOR: "content_scheduler",
  VOICE_AGENT: "voice_agent",
  AEO_GEO: "aeo_geo",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

const FEATURE_ALIASES: Record<FeatureKey, string[]> = {
  [FEATURE_KEYS.WEBSITE_AI]: ["website", "website_ai", "website-ai", "dashboard/website"],
  [FEATURE_KEYS.CONTENT_CREATOR]: [
    "content",
    "content_creator",
    "content_scheduler",
    "content-scheduler",
    "dashboard/content",
  ],
  [FEATURE_KEYS.VOICE_AGENT]: ["voice_agent", "voice-agent", "dashboard/voice-agent"],
  [FEATURE_KEYS.AEO_GEO]: ["aeo_geo", "aeo-geo", "dashboard/aeo-geo"],
};

const FEATURE_BLOCKS_STORAGE_KEY = "saadhyam_feature_blocks";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export const resolveFeatureKeyFromEndpoint = (endpoint: string): FeatureKey | null => {
  const normalizedEndpoint = normalize(endpoint);

  for (const [featureKey, aliases] of Object.entries(FEATURE_ALIASES) as [FeatureKey, string[]][]) {
    if (normalizedEndpoint.includes(normalize(featureKey))) {
      return featureKey;
    }

    if (aliases.some((alias) => normalizedEndpoint.includes(normalize(alias)))) {
      return featureKey;
    }
  }

  return null;
};

export const featureEventMatches = (featureKey: FeatureKey, detail: any) => {
  const candidates = [detail?.feature_key, detail?.feature, detail?.module_key, detail?.endpoint].filter(Boolean);

  return candidates.some((candidate) => {
    const normalizedCandidate = normalize(String(candidate));
    if (normalizedCandidate.includes(normalize(featureKey))) {
      return true;
    }

    return FEATURE_ALIASES[featureKey].some((alias) => normalizedCandidate.includes(normalize(alias)));
  });
};

export const isFeatureBlockedLocally = (featureKey: FeatureKey) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const stored = localStorage.getItem(FEATURE_BLOCKS_STORAGE_KEY);
    if (!stored) {
      return false;
    }

    const entries = JSON.parse(stored) as Array<{ feature_key?: string; endpoint?: string }>;
    return entries.some((entry) => featureEventMatches(featureKey, entry));
  } catch {
    return false;
  }
};

export const persistBlockedFeature = (detail: any, featureKey?: FeatureKey | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existing = localStorage.getItem(FEATURE_BLOCKS_STORAGE_KEY);
    const entries = existing ? (JSON.parse(existing) as Array<Record<string, any>>) : [];
    const resolvedFeatureKey = featureKey || detail?.feature_key || resolveFeatureKeyFromEndpoint(String(detail?.endpoint || ""));
    const nextEntry = {
      feature_key: resolvedFeatureKey || detail?.feature_key || detail?.feature || detail?.module_key || null,
      endpoint: detail?.endpoint || null,
      mode: detail?.mode || null,
      timestamp: Date.now(),
    };

    const filtered = entries.filter((entry) => {
      const sameFeature = entry.feature_key && nextEntry.feature_key && normalize(String(entry.feature_key)) === normalize(String(nextEntry.feature_key));
      const sameEndpoint = entry.endpoint && nextEntry.endpoint && normalize(String(entry.endpoint)) === normalize(String(nextEntry.endpoint));
      return !sameFeature && !sameEndpoint;
    });

    filtered.unshift(nextEntry);
    localStorage.setItem(FEATURE_BLOCKS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 25)));
  } catch {
    // Ignore storage failures.
  }
};
