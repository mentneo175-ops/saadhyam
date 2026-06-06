import { env } from "@/config/env";

const API_BASE_URL = env.apiBaseUrl || "http://localhost:8000";

export interface CompetitorRecommendation {
  title: string;
  description: string;
  action: string;
  priority: "High" | "Medium" | "Low";
  category: "Campaign" | "Pricing" | "Customer Experience" | "Content";
  threat_level?: "High" | "Medium" | "Low";
}

export interface CompetitorAdsData {
  facebook_ads: string[];
  instagram_promotions: string[];
  google_ads: string[];
  local_promotions: string[];
  summary: string;
}

export interface CompetitorOffersData {
  discount_campaigns: string[];
  bundle_offers: string[];
  limited_time_deals: string[];
  summary: string;
}

export interface CompetitorReviewsData {
  sources: string[];
  positive_patterns: string[];
  negative_patterns: string[];
  summary: string;
}

export interface CompetitorSocialData {
  channels: string[];
  engagement_trends: string;
  follower_growth: string;
  summary: string;
}

export interface CompetitorPricingData {
  level: string;
  price_changes: string[];
  summary: string;
}

export interface CompetitorDemandData {
  search_trends: string;
  buying_behavior: string;
  market_demand_signals: string[];
  summary: string;
}

export interface CompetitorIntelligence {
  id: number;
  name: string;
  location?: string;
  website_or_social?: string;
  activity_score: number;
  trending_offers: string[];
  review_sentiment?: string;
  pricing_trend?: string;
  ads_data: CompetitorAdsData;
  offers_data: CompetitorOffersData;
  reviews_data: CompetitorReviewsData;
  social_data: CompetitorSocialData;
  pricing_data: CompetitorPricingData;
  demand_data: CompetitorDemandData;
  recommendations: CompetitorRecommendation[];
  created_at?: string;
  updated_at?: string;
}

export async function getMonitoredCompetitors(
  token: string
): Promise<{ status: string; competitors: CompetitorIntelligence[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/competitor-intelligence/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to fetch monitored competitors");
  }

  return response.json();
}

export async function getCompetitorDetails(
  token: string,
  id: number
): Promise<{ status: string; competitor: CompetitorIntelligence }> {
  const response = await fetch(`${API_BASE_URL}/api/competitor-intelligence/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to fetch competitor details");
  }

  return response.json();
}

export async function addCompetitor(
  token: string,
  payload: { name: string; location?: string; website_or_social?: string }
): Promise<{ status: string; source: string; competitor: CompetitorIntelligence }> {
  const response = await fetch(`${API_BASE_URL}/api/competitor-intelligence/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.json();
    throw new Error(errText.detail || "Failed to add competitor");
  }

  return response.json();
}

export async function deleteCompetitor(
  token: string,
  id: number
): Promise<{ status: string; competitor_id: number }> {
  const response = await fetch(`${API_BASE_URL}/api/competitor-intelligence/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to remove competitor");
  }

  return response.json();
}

export async function getCompetitorSuggestions(
  token: string,
  query: string = ""
): Promise<{ status: string; suggestions: string[]; business_type: string }> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);

  const response = await fetch(
    `${API_BASE_URL}/api/competitor-intelligence/suggestions/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to fetch competitor suggestions");
  }

  return response.json();
}

