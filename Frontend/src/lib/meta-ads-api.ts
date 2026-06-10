/**
 * Meta Ads API Client
 */

import { apiClient } from "./api";
import type {
  MetaConnectionStatus,
  AudienceRecommendation,
  BudgetRecommendation,
  Campaign,
  CampaignAnalytics,
  DashboardSummary,
  PromotePostRequest,
  PromotePostResponse,
  CampaignStatus,
} from "@/types/meta-ads";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Get Meta connection status
 */
export async function getMetaConnectionStatus(): Promise<MetaConnectionStatus> {
  return apiClient.get<MetaConnectionStatus>("/auth/meta/status");
}

/**
 * Connect Meta account (opens OAuth popup)
 */
export function connectMetaAccount(): void {
  const token = localStorage.getItem("saadhyam_token");
  const popup = window.open(
    `${BASE_URL}/auth/meta/connect?token=${token}`,
    "meta-connect",
    "width=600,height=700,scrollbars=yes,resizable=yes"
  );

  if (!popup) {
    throw new Error("Popup blocked. Please allow popups and try again.");
  }
}

/**
 * Disconnect Meta account
 */
export async function disconnectMetaAccount(): Promise<void> {
  return apiClient.post("/auth/meta/disconnect");
}

/**
 * Get AI audience recommendations
 */
export async function getAudienceRecommendations(
  postCaption?: string,
  postHashtags?: string[],
  campaignObjective: string = "OUTCOME_ENGAGEMENT"
): Promise<{ success: boolean; recommendations: AudienceRecommendation }> {
  return apiClient.post("/meta-ads/ai/audience-recommendations", {
    post_caption: postCaption,
    post_hashtags: postHashtags,
    campaign_objective: campaignObjective,
  });
}

/**
 * Get AI budget recommendations
 */
export async function getBudgetRecommendations(
  campaignObjective: string = "OUTCOME_ENGAGEMENT",
  targetAudienceSize?: number
): Promise<{ success: boolean; recommendations: BudgetRecommendation; currency: string }> {
  return apiClient.post("/meta-ads/ai/budget-recommendations", {
    campaign_objective: campaignObjective,
    target_audience_size: targetAudienceSize,
  });
}

/**
 * Promote Instagram post
 */
export async function promotePost(request: PromotePostRequest): Promise<PromotePostResponse> {
  return apiClient.post("/meta-ads/promote-post", request);
}

/**
 * Get all campaigns
 */
export async function getCampaigns(): Promise<{ success: boolean; campaigns: Campaign[] }> {
  return apiClient.get("/meta-ads/campaigns");
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(campaignId: number): Promise<{ success: boolean; campaign: Campaign }> {
  return apiClient.get(`/meta-ads/campaigns/${campaignId}`);
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: number,
  status: CampaignStatus
): Promise<{ success: boolean; message: string }> {
  return apiClient.post(`/meta-ads/campaigns/${campaignId}/status`, { status });
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: number,
  datePreset: string = "last_7d"
): Promise<{ success: boolean; campaign_id: number; analytics: CampaignAnalytics }> {
  return apiClient.get(`/meta-ads/campaigns/${campaignId}/analytics?date_preset=${datePreset}`);
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(): Promise<{
  success: boolean;
  summary: DashboardSummary;
  recent_campaigns: Campaign[];
}> {
  return apiClient.get("/meta-ads/dashboard/summary");
}
