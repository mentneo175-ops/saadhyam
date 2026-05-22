/**
 * Meta Ads API Client
 */

import { apiClient } from "./api";
import { env } from "@/config/env";
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

const BASE_URL = env.apiBaseUrl;

/**
 * Get Meta connection status
 */
export async function getMetaConnectionStatus(): Promise<MetaConnectionStatus> {
  const response = await fetch(`${BASE_URL}/auth/meta/status`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Meta connection status");
  }

  return response.json();
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
  const response = await fetch(`${BASE_URL}/auth/meta/disconnect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to disconnect Meta account");
  }
}

/**
 * Get AI audience recommendations
 */
export async function getAudienceRecommendations(
  postCaption?: string,
  postHashtags?: string[],
  campaignObjective: string = "OUTCOME_ENGAGEMENT"
): Promise<{ success: boolean; recommendations: AudienceRecommendation }> {
  const response = await fetch(`${BASE_URL}/meta-ads/ai/audience-recommendations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_caption: postCaption,
      post_hashtags: postHashtags,
      campaign_objective: campaignObjective,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get audience recommendations");
  }

  return response.json();
}

/**
 * Get AI budget recommendations
 */
export async function getBudgetRecommendations(
  campaignObjective: string = "OUTCOME_ENGAGEMENT",
  targetAudienceSize?: number
): Promise<{ success: boolean; recommendations: BudgetRecommendation; currency: string }> {
  const response = await fetch(`${BASE_URL}/meta-ads/ai/budget-recommendations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      campaign_objective: campaignObjective,
      target_audience_size: targetAudienceSize,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get budget recommendations");
  }

  return response.json();
}

/**
 * Promote Instagram post
 */
export async function promotePost(request: PromotePostRequest): Promise<PromotePostResponse> {
  const response = await fetch(`${BASE_URL}/meta-ads/promote-post`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to promote post");
  }

  return response.json();
}

/**
 * Get all campaigns
 */
export async function getCampaigns(): Promise<{ success: boolean; campaigns: Campaign[] }> {
  const response = await fetch(`${BASE_URL}/meta-ads/campaigns`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get campaigns");
  }

  return response.json();
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(campaignId: number): Promise<{ success: boolean; campaign: Campaign }> {
  const response = await fetch(`${BASE_URL}/meta-ads/campaigns/${campaignId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get campaign details");
  }

  return response.json();
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: number,
  status: CampaignStatus
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${BASE_URL}/meta-ads/campaigns/${campaignId}/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update campaign status");
  }

  return response.json();
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: number,
  datePreset: string = "last_7d"
): Promise<{ success: boolean; campaign_id: number; analytics: CampaignAnalytics }> {
  const response = await fetch(
    `${BASE_URL}/meta-ads/campaigns/${campaignId}/analytics?date_preset=${datePreset}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get campaign analytics");
  }

  return response.json();
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(): Promise<{
  success: boolean;
  summary: DashboardSummary;
  recent_campaigns: Campaign[];
}> {
  const response = await fetch(`${BASE_URL}/meta-ads/dashboard/summary`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get dashboard summary");
  }

  return response.json();
}
