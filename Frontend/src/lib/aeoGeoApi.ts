import { env } from "@/config/env";
/**
 * AEO/GEO API Client
 * Answer Engine Optimization + Generative Engine Optimization
 */

const API_BASE_URL = env.apiBaseUrl;

export interface AEOGEOOverview {
  status: string;
  aeo_geo_score: number;
  business_analysis: BusinessAnalysisForAEO;
  questions: {
    total: number;
    recent: AEOQuestion[];
  };
  content: {
    total: number;
    recent: AEOContent[];
  };
  schemas: {
    total: number;
    types: string[];
  };
  visibility: VisibilityOverview;
}

export interface BusinessAnalysisForAEO {
  status: string;
  business_summary: string;
  authority_topics: string[];
  trust_signals: string[];
  semantic_entities: {
    brand: string[];
    service: string[];
    industry: string[];
    location: string[];
    user_intent: string[];
  };
  aeo_readiness_score: number;
  recommendations: string[];
}

export interface AEOQuestion {
  id: number;
  question: string;
  category: string;
  intent: string;
  source: string;
  search_volume?: number;
  difficulty?: number;
  priority: number;
  status: string;
  created_at?: string;
}

export interface AEOContent {
  id: number;
  title: string;
  question: string;
  direct_answer: string;
  detailed_explanation?: string;
  bullet_points?: string[];
  cta?: string;
  aeo_score: number;
  geo_score: number;
  is_published: boolean;
  created_at?: string;
}

export interface SchemaMarkup {
  id: number;
  schema_type: string;
  schema_json: any;
  is_valid: boolean;
  created_at?: string;
}

export interface VisibilityOverview {
  total_checks: number;
  total_mentions: number;
  total_citations: number;
  avg_visibility_score: number;
  mention_rate: number;
}

/**
 * Get AEO/GEO overview dashboard
 */
export async function getAEOGEOOverview(token: string): Promise<AEOGEOOverview> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/overview`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get AEO/GEO overview');
  }

  return response.json();
}

/**
 * Run full AEO/GEO optimization
 */
export async function runFullOptimization(token: string): Promise<{ status: string; steps_completed: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/optimize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run optimization');
  }

  return response.json();
}

/**
 * Get business analysis for AEO
 */
export async function getBusinessAnalysisForAEO(token: string): Promise<BusinessAnalysisForAEO> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/business-analysis`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get business analysis');
  }

  return response.json();
}

/**
 * Discover AI-search questions
 */
export async function discoverQuestions(token: string, limit: number = 20): Promise<{ status: string; questions: AEOQuestion[]; new_questions_count: number }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/questions/discover?limit=${limit}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to discover questions');
  }

  return response.json();
}

/**
 * Get discovered questions
 */
export async function getDiscoveredQuestions(token: string, category?: string, limit: number = 50): Promise<{ status: string; questions: AEOQuestion[]; total: number }> {
  let url = `${API_BASE_URL}/api/aeo-geo/questions?limit=${limit}`;
  if (category) {
    url += `&category=${category}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get questions');
  }

  return response.json();
}

/**
 * Generate AEO content for a question
 */
export async function generateAEOContent(token: string, questionId: number): Promise<{ status: string; content_id: number; content: AEOContent }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/content/generate/${questionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate content');
  }

  return response.json();
}

/**
 * Get generated AEO content
 */
export async function getGeneratedContent(token: string, limit: number = 20): Promise<{ status: string; content: AEOContent[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/content?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get content');
  }

  return response.json();
}

/**
 * Generate FAQ schema for content
 */
export async function generateFAQSchema(token: string, contentId: number): Promise<{ status: string; schema_id: number; schema: any }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/schema/faq/${contentId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate FAQ schema');
  }

  return response.json();
}

/**
 * Generate LocalBusiness schema
 */
export async function generateLocalBusinessSchema(token: string): Promise<{ status: string; schema_id: number; schema: any }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/schema/local-business`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate LocalBusiness schema');
  }

  return response.json();
}

/**
 * Get all schema markups
 */
export async function getAllSchemas(token: string): Promise<{ status: string; schemas: SchemaMarkup[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/schema`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get schemas');
  }

  return response.json();
}

/**
 * Track AI visibility
 */
export async function trackAIVisibility(token: string): Promise<{ status: string; visibility_data: any[]; total_mentions: number }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/visibility/track`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to track visibility');
  }

  return response.json();
}

/**
 * Get visibility dashboard
 */
export async function getVisibilityDashboard(token: string): Promise<{ status: string; overview: VisibilityOverview; engine_stats: any; top_content: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/visibility/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get visibility dashboard');
  }

  return response.json();
}

/**
 * Search similar questions using Pinecone semantic search
 */
export async function searchSimilarQuestions(token: string, query: string, topK: number = 5): Promise<{ status: string; query: string; results: any[]; total: number; pinecone_enabled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/questions/search?query=${encodeURIComponent(query)}&top_k=${topK}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to search questions');
  }

  return response.json();
}

/**
 * Generate blog post (Auto Blogger)
 */
export async function generateBlogPost(token: string, topic?: string, keywords?: string[]): Promise<{ status: string; blog_post: any; generated_at: string }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/blog/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      keywords
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate blog post');
  }

  return response.json();
}

/**
 * Publish blog post to website
 */
export async function publishBlogPost(token: string, blogPost: any, websiteUrl: string): Promise<{ status: string; message: string; blog_data: any }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/blog/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blog_post: blogPost,
      website_url: websiteUrl
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to publish blog post');
  }

  return response.json();
}

/**
 * Get Opportunity Radar
 */
export async function getOpportunityRadar(token: string): Promise<{ status: string; opportunities: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/opportunity-radar`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get Opportunity Radar');
  }

  return response.json();
}

/**
 * Get Customer Demand Intelligence
 */
export async function getCustomerDemand(token: string): Promise<{ status: string; data: any }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/customer-demand`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get Customer Demand Insights');
  }

  return response.json();
}

/**
 * Get Daily Business Health Report
 */
export async function getDailyReport(token: string): Promise<{ status: string; date: string; scores: any; opportunities: any[]; competitor_updates: string[]; recommended_actions: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/daily-report`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get Daily Business Report');
  }

  return response.json();
}

/**
 * Generate Auto Content Package
 */
export async function generateAutoContent(token: string, opportunityTitle?: string): Promise<{ status: string; data: any }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/auto-content/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ opportunity_title: opportunityTitle }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate auto content package');
  }

  return response.json();
}

/**
 * Run Growth Autopilot Mode
 */
export async function runGrowthAutopilot(token: string): Promise<{ status: string; data: any }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/autopilot/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run growth autopilot mode');
  }

  return response.json();
}

/**
 * Direct Publish Content to Social / Website platforms
 */
export async function publishContentToPlatform(
  token: string,
  platform: string,
  content: string,
  title?: string,
  mediaUrl?: string
): Promise<{ status: string; platform: string; live_url: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/publish/platform`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform,
      content,
      title,
      media_url: mediaUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Direct publishing failed');
  }

  return response.json();
}

export interface IntegrationInfo {
  connected: boolean;
  detail: string;
  link: string;
}

export interface IntegrationsStatusResponse {
  status: string;
  integrations: {
    instagram: IntegrationInfo;
    facebook: IntegrationInfo;
    youtube: IntegrationInfo;
    google: IntegrationInfo;
    website: IntegrationInfo;
  };
}

export interface AutopilotSettings {
  auto_publish_instagram: boolean;
  auto_publish_facebook: boolean;
  auto_publish_youtube: boolean;
  auto_publish_google: boolean;
  auto_publish_website: boolean;
  google_connected?: boolean;
}

export interface AutopilotSettingsResponse {
  status: string;
  settings: AutopilotSettings;
}

/**
 * Get linked status of social channels and website
 */
export async function getIntegrationsStatus(token: string): Promise<IntegrationsStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/integrations/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch integrations status');
  }

  return response.json();
}

/**
 * Get Growth Autopilot switches/settings
 */
export async function getAutopilotSettings(token: string): Promise<AutopilotSettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/autopilot/settings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch autopilot settings');
  }

  return response.json();
}

/**
 * Update Growth Autopilot switches/settings
 */
export async function updateAutopilotSettings(
  token: string,
  settings: AutopilotSettings
): Promise<AutopilotSettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/autopilot/settings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update autopilot settings');
  }

  return response.json();
}

/**
 * Get Google API metrics (Search Console, Analytics, Business Profile)
 */
export async function getGoogleApiMetrics(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/google-api/metrics`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch Google API metrics');
  }

  return response.json();
}

/**
 * Get Installed Plugin IDs
 */
export async function getInstalledPlugins(token: string): Promise<{ status: string; installed: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/plugins/installed`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch installed plugins');
  }

  return response.json();
}

/**
 * Install a Plugin
 */
export async function installPlugin(token: string, pluginId: string): Promise<{ status: string; installed: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/plugins/install`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plugin_id: pluginId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to install plugin');
  }

  return response.json();
}

/**
 * Uninstall a Plugin
 */
export async function uninstallPlugin(token: string, pluginId: string): Promise<{ status: string; installed: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/plugins/uninstall`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plugin_id: pluginId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to uninstall plugin');
  }

  return response.json();
}

export interface AutomationLog {
  timestamp: string;
  step: string;
  message: string;
}

export async function runPluginFlow(
  token: string, 
  steps?: string[] | null, 
  prompt?: string
): Promise<{ status: string; logs: AutomationLog[] }> {
  const response = await fetch(`${API_BASE_URL}/api/aeo-geo/plugins/run-flow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      steps: steps || undefined, 
      prompt: prompt || undefined 
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run automation flow');
  }

  return response.json();
}




