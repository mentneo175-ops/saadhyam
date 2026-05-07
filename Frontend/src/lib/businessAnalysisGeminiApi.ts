/**
 * Business Analysis API Client (Gemini-powered)
 * Uses Google AI Studio Gemini with Google Search grounding
 * REPLACES old TinyLlama local model
 */

import { apiClient } from "./api";

// Cache duration: 3 hours
const CACHE_DURATION = 3 * 60 * 60 * 1000;
const CACHE_KEY = "business_analysis_gemini_cache";

export interface BusinessAnalysisResult {
  status: string;
  source: string;
  business_details?: {
    business_name: string;
    business_type: string;
    location: string;
    services: string[];
    summary: string;
  };
  strengths?: string[];
  weaknesses?: string[];
  growth_opportunities?: string[];
  local_market_insights?: {
    local_demand: string;
    customer_behavior: string;
    competition_level: string;
    trending_services: string[];
  };
  competitor_analysis?: {
    competitor_patterns: string[];
    market_gaps: string[];
    differentiation_ideas: string[];
  };
  seo_google_maps_tips?: {
    keywords: string[];
    ranking_tips: string[];
    local_visibility_ideas: string[];
  };
  thirty_day_growth_plan?: {
    week_1: string[];
    week_2: string[];
    week_3: string[];
    week_4: string[];
  };
  daily_suggestions?: string[];
  health_score?: number;
  last_updated?: string;
  message?: string;
}

interface CachedAnalysis {
  data: BusinessAnalysisResult;
  timestamp: number;
}

/**
 * Check if cached data is valid
 */
function isCacheValid(cached: CachedAnalysis | null): boolean {
  if (!cached) return false;
  const now = Date.now();
  return now - cached.timestamp < CACHE_DURATION;
}

/**
 * Get cached analysis
 */
function getCachedAnalysis(): CachedAnalysis | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as CachedAnalysis;
  } catch (error) {
    console.error("Error reading analysis cache:", error);
    return null;
  }
}

/**
 * Save analysis to cache
 */
function setCachedAnalysis(data: BusinessAnalysisResult): void {
  try {
    const cached: CachedAnalysis = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error("Error saving analysis cache:", error);
  }
}

/**
 * Clear analysis cache
 */
export function clearAnalysisCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Get real-time business analysis using Gemini AI
 * Uses logged-in user's business profile automatically
 */
export async function getRealtimeBusinessAnalysis(
  forceRefresh: boolean = false
): Promise<BusinessAnalysisResult> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedAnalysis();
    if (isCacheValid(cached)) {
      console.log("✅ [BusinessAnalysis] Using cached analysis");
      return cached.data;
    }
  }

  console.log("🔄 [BusinessAnalysis] Fetching fresh analysis from Gemini...");
  console.log("🔍 [BusinessAnalysis] Using Google AI Studio Gemini Search Grounding");

  try {
    const result = await apiClient.get<BusinessAnalysisResult>(
      "/business/analysis/realtime"
    );

    console.log(`✅ [BusinessAnalysis] Analysis completed`);
    console.log(`📊 [BusinessAnalysis] Source: ${result.source}`);
    console.log(`💯 [BusinessAnalysis] Health Score: ${result.health_score}`);

    // Cache successful results
    if (result.status === "success") {
      setCachedAnalysis(result);
    }

    return result;
  } catch (error: any) {
    console.error("❌ [BusinessAnalysis] Error fetching analysis:", error);

    // Try to return cached data as fallback
    const cached = getCachedAnalysis();
    if (cached) {
      console.log("⚠️ [BusinessAnalysis] Using stale cache due to error");
      return cached.data;
    }

    // Return error result
    return {
      status: "error",
      source: "google_ai_studio_gemini_search_grounding",
      message: error.message || "Failed to fetch business analysis. Please try again later.",
    };
  }
}

/**
 * Get cache age for display
 */
export function getCacheAge(): string | null {
  const cached = getCachedAnalysis();
  if (!cached) return null;

  const ageMs = Date.now() - cached.timestamp;
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
