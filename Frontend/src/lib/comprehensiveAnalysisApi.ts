import { env } from "@/config/env";
/**
 * Comprehensive Business Analysis API Client
 * ONE API call populates ALL features - no rate limit issues
 */

const API_BASE_URL = env.apiBaseUrl;

export interface AnalysisStatus {
  status: 'not_started' | 'pending' | 'analyzing' | 'completed' | 'error';
  message: string;
  last_analyzed_at?: string;
}

export interface BusinessDetails {
  business_name: string;
  business_type: string;
  location: string;
  services: string[];
  summary: string;
}

export interface LocalMarketInsights {
  local_demand: string;
  customer_behavior: string;
  competition_level: string;
  trending_services: string[];
}

export interface NearbyCompetitor {
  name: string;
  location: string;
  type: string;
  strengths: string;
  weaknesses: string;
}

export interface CompetitorAnalysis {
  nearby_competitors?: NearbyCompetitor[];
  competitor_patterns: string[];
  market_gaps: string[];
  differentiation_ideas: string[];
}

export interface SEOGoogleMapsTips {
  keywords: string[];
  ranking_tips: string[];
  local_visibility_ideas: string[];
}

export interface ThirtyDayGrowthPlan {
  week_1: string[];
  week_2: string[];
  week_3: string[];
  week_4: string[];
}

export interface BusinessAnalysisData {
  status: string;
  business_details: BusinessDetails;
  strengths: string[];
  weaknesses: string[];
  growth_opportunities: string[];
  local_market_insights: LocalMarketInsights;
  health_score: number;
  last_updated: string;
}

export interface CompetitorAnalysisData {
  status: string;
  competitor_analysis: CompetitorAnalysis;
  last_updated: string;
}

export interface GrowthPlanData {
  status: string;
  thirty_day_growth_plan: ThirtyDayGrowthPlan;
  last_updated: string;
}

export interface DailySuggestionsData {
  status: string;
  daily_suggestions: string[];
  last_updated: string;
}

export interface SEOGoogleMapsData {
  status: string;
  seo_google_maps_tips: SEOGoogleMapsTips;
  last_updated: string;
}

/**
 * Trigger comprehensive business analysis
 * Makes ONE Gemini API call and stores ALL results
 * Takes 2-3 minutes but avoids all rate limit issues
 */
export async function triggerComprehensiveAnalysis(token: string): Promise<{ status: string; message: string; analysis_id?: number }> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/trigger`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to trigger analysis');
  }

  return response.json();
}

/**
 * Get current analysis status
 * Check if analysis is pending, analyzing, completed, or error
 */
export async function getAnalysisStatus(token: string): Promise<AnalysisStatus> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get analysis status');
  }

  return response.json();
}

/**
 * Get Business Analysis data (instant, from database)
 * Shows: strengths, weaknesses, opportunities, local market insights
 */
export async function getBusinessAnalysisData(token: string): Promise<BusinessAnalysisData> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/business-analysis`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get business analysis data');
  }

  return response.json();
}

/**
 * Get Competitor Analysis data (instant, from database)
 * Shows: competitor patterns, market gaps, differentiation ideas
 */
export async function getCompetitorAnalysisData(token: string): Promise<CompetitorAnalysisData> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/competitor-analysis`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get competitor analysis data');
  }

  return response.json();
}

/**
 * Get 30-Day Growth Plan (instant, from database)
 * Shows: week-by-week action plan for Dashboard
 */
export async function getGrowthPlanData(token: string): Promise<GrowthPlanData> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/growth-plan`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get growth plan data');
  }

  return response.json();
}

/**
 * Get Daily Suggestions (instant, from database)
 * Shows: daily action suggestions for Daily Ask feature
 */
export async function getDailySuggestionsData(token: string): Promise<DailySuggestionsData> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/daily-suggestions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get daily suggestions data');
  }

  return response.json();
}

/**
 * Get SEO & Google Maps Tips (instant, from database)
 * Shows: keywords, ranking tips, local visibility ideas
 */
export async function getSEOGoogleMapsData(token: string): Promise<SEOGoogleMapsData> {
  const response = await fetch(`${API_BASE_URL}/api/comprehensive-analysis/seo-google-maps`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get SEO & Google Maps data');
  }

  return response.json();
}

/**
 * Poll analysis status until completed
 * Useful for showing progress during analysis
 */
export async function pollAnalysisStatus(
  token: string,
  onStatusUpdate: (status: AnalysisStatus) => void,
  intervalMs: number = 5000
): Promise<AnalysisStatus> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getAnalysisStatus(token);
        onStatusUpdate(status);

        if (status.status === 'completed') {
          resolve(status);
        } else if (status.status === 'error') {
          reject(new Error(status.message));
        } else {
          // Continue polling
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}
