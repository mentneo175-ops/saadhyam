/**
 * API Configuration
 * Central configuration for API endpoints
 */

import { env } from "./env";

// Backend API base URL
export const API_BASE_URL = env.apiBaseUrl;

// API endpoints
export const API_ENDPOINTS = {
  // Voice Agent V1
  voiceAgent: {
    campaigns: `${API_BASE_URL}/api/voice-agent/campaigns`,
    campaignById: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}`,
    campaignAnalytics: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/analytics`,
    campaignContacts: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/contacts`,
    campaignCalls: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/calls`,
    campaignLeads: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/leads`,
    updateCampaignStatus: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/status`,
    startCalling: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/start-calling`,
    pauseCalling: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/pause-calling`,
    resumeCalling: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/resume-calling`,
    callProgress: (id: number) => `${API_BASE_URL}/api/voice-agent/campaigns/${id}/call-progress`,
    addContactsBulk: (id: number) =>
      `${API_BASE_URL}/api/voice-agent/campaigns/${id}/contacts/bulk`,
    dashboardOverview: `${API_BASE_URL}/api/voice-agent/dashboard/overview`,
  },

  // Voice Agent V2
  voiceAgentV2: {
    campaigns: `${API_BASE_URL}/api/v2/voice-agent/campaigns`,
    campaignById: (id: number) => `${API_BASE_URL}/api/v2/voice-agent/campaigns/${id}`,
    campaignLeads: (id: number) => `${API_BASE_URL}/api/v2/voice-agent/campaigns/${id}/leads`,
    uploadLeads: (id: number) => `${API_BASE_URL}/api/v2/voice-agent/campaigns/${id}/leads/upload`,
    dashboardStats: `${API_BASE_URL}/api/v2/voice-agent/dashboard/stats`,
    generateScript: `${API_BASE_URL}/api/v2/voice-agent/script/generate`,
    simulateConversation: `${API_BASE_URL}/api/v2/voice-agent/conversation/simulate`,
  },
};

export default API_ENDPOINTS;
