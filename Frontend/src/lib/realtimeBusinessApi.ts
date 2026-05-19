/**
 * Real-time Business Intelligence API Client
 * Handles all Gemini-powered business intelligence API calls with caching
 */

import { apiClient } from "./api";

// Cache duration: 3 hours (in milliseconds)
const CACHE_DURATION = 3 * 60 * 60 * 1000;

// Cache keys
const CACHE_KEYS = {
  DASHBOARD: "realtime_dashboard_cache",
  ANALYSIS: "realtime_analysis_cache",
  COMPETITORS: "realtime_competitors_cache",
  INSIGHTS: "realtime_insights_cache",
};

// Types
export interface BusinessProfile {
  business_name: string;
  business_type: string;
  location: string;
  services?: string[];
  target_audience?: string;
  goals?: string;
  language?: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  business_profile: BusinessProfile;
}

export interface BusinessAnalysisResult {
  status: string;
  source?: string;
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    growth_opportunities: string[];
    local_market_ideas: string[];
    thirty_day_plan: string[];
  };
  message?: string;
}

export interface CompetitorInfo {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  market_position: string;
}

export interface CompetitorAnalysisResult {
  status: string;
  source?: string;
  competitors?: CompetitorInfo[];
  market_gaps?: string[];
  differentiation_ideas?: string[];
  action_plan?: string[];
  message?: string;
}

export interface BusinessInsightsResult {
  status: string;
  source?: string;
  insights?: {
    market_trends: string[];
    seo_ideas: string[];
    offer_ideas: string[];
    customer_acquisition_ideas: string[];
    next_actions: string[];
  };
  message?: string;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid<T>(cached: CachedData<T> | null): boolean {
  if (!cached) return false;
  const now = Date.now();
  return now - cached.timestamp < CACHE_DURATION;
}

/**
 * Get cached data from localStorage
 */
function getCachedData<T>(key: string): CachedData<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    return JSON.parse(cached) as CachedData<T>;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

/**
 * Save data to cache
 */
function setCachedData<T>(key: string, data: T, profile: BusinessProfile): void {
  if (typeof window === "undefined") return;
  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      business_profile: profile,
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error("Error saving cache:", error);
  }
}

/**
 * Clear specific cache
 */
export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(key);
  } else {
    // Clear all realtime caches
    Object.values(CACHE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

/**
 * Get business profile from API or localStorage
 */
export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  try {
    // Try to get from API first
    const profile = await apiClient.getBusinessProfile();
    
    if (profile.business_name && profile.business_type && profile.business_location) {
      return {
        business_name: profile.business_name,
        business_type: profile.business_type,
        location: profile.business_location,
        language: "english",
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching business profile:", error);
    
    // Fallback to localStorage
    try {
      const localProfile = localStorage.getItem("businessProfile");
      if (localProfile) {
        const parsed = JSON.parse(localProfile);
        if (parsed.business_name && parsed.business_type && parsed.location) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading local profile:", e);
    }
    
    return null;
  }
}

/**
 * Generate real-time business analysis
 */
export async function getRealtimeBusinessAnalysis(
  profile: BusinessProfile,
  forceRefresh: boolean = false
): Promise<BusinessAnalysisResult> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedData<BusinessAnalysisResult>(CACHE_KEYS.ANALYSIS);
    if (isCacheValid(cached)) {
      console.log("✅ Using cached business analysis");
      return cached.data;
    }
  }

  console.log("🔄 Fetching fresh business analysis from Gemini...");

  try {
    const result = await apiClient.post<BusinessAnalysisResult>(
      "/api/realtime-business/analysis",
      {
        business_name: profile.business_name,
        business_type: profile.business_type,
        location: profile.location,
        services: profile.services || [],
        target_audience: profile.target_audience || "",
        goals: profile.goals || "",
        language: profile.language || "english",
      }
    );

    // Cache the result
    if (result.status === "success") {
      setCachedData(CACHE_KEYS.ANALYSIS, result, profile);
    }

    return result;
  } catch (error) {
    console.error("Error fetching business analysis:", error);
    
    // Return cached data as fallback
    const cached = getCachedData<BusinessAnalysisResult>(CACHE_KEYS.ANALYSIS);
    if (cached) {
      console.log("⚠️ Using stale cache due to error");
      return cached.data;
    }

    // Return error result
    return {
      status: "error",
      message: "Failed to fetch business analysis. Please try again later.",
    };
  }
}

/**
 * Generate real-time competitor analysis
 */
export async function getRealtimeCompetitorAnalysis(
  profile: BusinessProfile,
  forceRefresh: boolean = false
): Promise<CompetitorAnalysisResult> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedData<CompetitorAnalysisResult>(CACHE_KEYS.COMPETITORS);
    if (isCacheValid(cached)) {
      console.log("✅ Using cached competitor analysis");
      return cached.data;
    }
  }

  console.log("🔄 Fetching fresh competitor analysis from Gemini...");

  try {
    const result = await apiClient.post<CompetitorAnalysisResult>(
      "/api/realtime-business/competitor-analysis",
      {
        business_type: profile.business_type,
        location: profile.location,
        radius_or_area: "5km",
        services: profile.services || [],
        language: profile.language || "english",
      }
    );

    // Cache the result
    if (result.status === "success") {
      setCachedData(CACHE_KEYS.COMPETITORS, result, profile);
    }

    return result;
  } catch (error) {
    console.error("Error fetching competitor analysis:", error);
    
    // Return cached data as fallback
    const cached = getCachedData<CompetitorAnalysisResult>(CACHE_KEYS.COMPETITORS);
    if (cached) {
      console.log("⚠️ Using stale cache due to error");
      return cached.data;
    }

    // Return error result
    return {
      status: "error",
      message: "Failed to fetch competitor analysis. Please try again later.",
    };
  }
}

/**
 * Generate real-time business insights
 */
export async function getRealtimeBusinessInsights(
  profile: BusinessProfile,
  forceRefresh: boolean = false
): Promise<BusinessInsightsResult> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedData<BusinessInsightsResult>(CACHE_KEYS.INSIGHTS);
    if (isCacheValid(cached)) {
      console.log("✅ Using cached business insights");
      return cached.data;
    }
  }

  console.log("🔄 Fetching fresh business insights from Gemini...");

  try {
    const result = await apiClient.post<BusinessInsightsResult>(
      "/api/realtime-business/insights",
      {
        business_name: profile.business_name,
        business_type: profile.business_type,
        location: profile.location,
        services: profile.services || [],
        target_audience: profile.target_audience || "",
        language: profile.language || "english",
      }
    );

    // Cache the result
    if (result.status === "success") {
      setCachedData(CACHE_KEYS.INSIGHTS, result, profile);
    }

    return result;
  } catch (error) {
    console.error("Error fetching business insights:", error);
    
    // Return cached data as fallback
    const cached = getCachedData<BusinessInsightsResult>(CACHE_KEYS.INSIGHTS);
    if (cached) {
      console.log("⚠️ Using stale cache due to error");
      return cached.data;
    }

    // Return error result
    return {
      status: "error",
      message: "Failed to fetch business insights. Please try again later.",
    };
  }
}

/**
 * Get cache status for UI display
 */
export function getCacheStatus(): {
  analysis: { cached: boolean; age?: number };
  competitors: { cached: boolean; age?: number };
  insights: { cached: boolean; age?: number };
} {
  const now = Date.now();
  
  const analysisCached = getCachedData<BusinessAnalysisResult>(CACHE_KEYS.ANALYSIS);
  const competitorsCached = getCachedData<CompetitorAnalysisResult>(CACHE_KEYS.COMPETITORS);
  const insightsCached = getCachedData<BusinessInsightsResult>(CACHE_KEYS.INSIGHTS);

  return {
    analysis: {
      cached: isCacheValid(analysisCached),
      age: analysisCached ? now - analysisCached.timestamp : undefined,
    },
    competitors: {
      cached: isCacheValid(competitorsCached),
      age: competitorsCached ? now - competitorsCached.timestamp : undefined,
    },
    insights: {
      cached: isCacheValid(insightsCached),
      age: insightsCached ? now - insightsCached.timestamp : undefined,
    },
  };
}

/**
 * Format cache age for display
 */
export function formatCacheAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "just now";
  }
}
