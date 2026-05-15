/**
 * Meta Ads TypeScript Types
 */

export enum CampaignObjective {
  OUTCOME_TRAFFIC = "OUTCOME_TRAFFIC",
  OUTCOME_ENGAGEMENT = "OUTCOME_ENGAGEMENT",
  OUTCOME_AWARENESS = "OUTCOME_AWARENESS",
  OUTCOME_LEADS = "OUTCOME_LEADS",
  OUTCOME_SALES = "OUTCOME_SALES",
}

export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  ARCHIVED = "ARCHIVED",
}

export enum CallToAction {
  LEARN_MORE = "LEARN_MORE",
  SHOP_NOW = "SHOP_NOW",
  SEND_MESSAGE = "SEND_MESSAGE",
  SIGN_UP = "SIGN_UP",
  BOOK_NOW = "BOOK_NOW",
  CONTACT_US = "CONTACT_US",
  DOWNLOAD = "DOWNLOAD",
  GET_OFFER = "GET_OFFER",
  APPLY_NOW = "APPLY_NOW",
}

export interface MetaAccount {
  id: number;
  ad_account_id: string;
  ad_account_name?: string;
  page_name?: string;
  instagram_username?: string;
  business_name?: string;
  is_active: boolean;
  last_synced_at?: string;
}

export interface MetaConnectionStatus {
  is_connected: boolean;
  ad_account_id?: string;
  ad_account_name?: string;
  page_name?: string;
  instagram_username?: string;
  business_name?: string;
  last_synced_at?: string;
}

export interface AudienceLocation {
  type: "city" | "region" | "country";
  name: string;
  radius_km?: number;
}

export interface AudienceInterest {
  name: string;
  category: string;
  relevance: "high" | "medium" | "low";
}

export interface AudienceRecommendation {
  recommended_age_min: number;
  recommended_age_max: number;
  recommended_genders: string[];
  recommended_locations: AudienceLocation[];
  recommended_interests: AudienceInterest[];
  estimated_reach_min: number;
  estimated_reach_max: number;
  estimated_engagement_rate: number;
  confidence_score: number;
  reasoning: string;
}

export interface BudgetRecommendation {
  recommended_daily_budget: number;
  recommended_duration_days: number;
  recommended_total_budget: number;
  estimated_impressions_min: number;
  estimated_impressions_max: number;
  estimated_clicks_min: number;
  estimated_clicks_max: number;
  estimated_reach_min: number;
  estimated_reach_max: number;
  estimated_cpc: number;
  estimated_cpm: number;
  reasoning: string;
}

export interface Campaign {
  id: number;
  campaign_id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget?: number;
  lifetime_budget?: number;
  created_at: string;
  updated_at: string;
  ai_recommendations?: {
    audience?: AudienceRecommendation;
    budget?: BudgetRecommendation;
    performance?: any;
  };
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  reach: number;
  spend: number;
  cpc: number;
  cpm: number;
  ctr: number;
  actions?: any[];
  conversions?: number;
  roas?: number;
}

export interface DashboardSummary {
  total_campaigns: number;
  active_campaigns: number;
  paused_campaigns: number;
  total_daily_spend: number;
}

export interface PromotePostRequest {
  post_id?: number;  // For scheduled posts created through system
  instagram_media_id?: string;  // For any Instagram post (from analytics)
  campaign_name?: string;
  objective?: CampaignObjective;
  daily_budget?: number;
  duration_days?: number;
  call_to_action?: CallToAction;
  whatsapp_number?: string;
}

export interface PromotePostResponse {
  success: boolean;
  campaign: Campaign;
  ad_set: any;
  creative: any;
  ad: any;
  ai_recommendations: {
    audience: AudienceRecommendation;
    budget: BudgetRecommendation;
  };
  message: string;
}
