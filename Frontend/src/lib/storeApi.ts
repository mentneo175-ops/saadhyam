// Dedicated Store API service for Store solutions (Completely independent from Plugins API)
import { env } from "@/config/env";
import { getApiBaseUrl } from "./runtimeUrls";
import * as PluginAPI from "@/lib/pluginsApi";

const API_BASE_URL = getApiBaseUrl();

// ==============================================================================
// Store AI Email Assistant Types & Client
// ==============================================================================

export interface StoreEmailAssistantGeneratePayload {
  recipient: string;
  subject: string;
  purpose?: string;
  tone?: string;
  length?: string;
  key_points?: string[];
  signature?: string;
}

export interface StoreEmailAssistantGenerateResponse {
  success: boolean;
  subject: string;
  body: string;
  word_count: number;
  template_type: string;
  message?: string;
  error?: string;
}

/**
 * Generate email using dedicated Store AI Email Assistant endpoint:
 * POST /api/store/email-assistant/generate
 *
 * Does NOT call /api/plugins/execute.
 */
export async function generateStoreEmailAssistant(
  payload: StoreEmailAssistantGeneratePayload
): Promise<StoreEmailAssistantGenerateResponse> {
  const token = localStorage.getItem("saadhyam_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}/api/store/email-assistant/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail ?? data?.error ?? `Generation failed with status ${response.status}`);
  }

  return response.json();
}


// ==============================================================================
// Store Email Marketing Types & Client
// ==============================================================================

export interface StoreEmailMarketingAIGeneratePayload {
  mode: "subject" | "body" | "full";
  prompt: string;
  recipient?: string;
  existing_subject?: string;
  tone?: string;
  length?: string;
}

export interface StoreEmailMarketingAIGenerateResponse {
  success: boolean;
  subject: string;
  body: string;
  message: string;
  error?: string | null;
}

/**
 * Generate AI subject, body, or full email for Store Email Marketing endpoint:
 * POST /api/store/email-marketing/generate-ai
 *
 * Uses local FLAN-T5 model exclusively.
 */
export async function generateStoreEmailMarketingAI(
  payload: StoreEmailMarketingAIGeneratePayload
): Promise<StoreEmailMarketingAIGenerateResponse> {
  const token = localStorage.getItem("saadhyam_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}/api/store/email-marketing/generate-ai`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail ?? data?.error ?? `Generation failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Save SMTP Configuration for Email Marketing
 */
export async function saveStoreEmailMarketingConfig(
  config: Record<string, unknown>
): Promise<{ success: boolean; message: string; config?: Record<string, unknown> }> {
  return PluginAPI.saveEmailMarketingConfig(config);
}

/**
 * Test SMTP Connection for Email Marketing
 */
export async function testStoreEmailMarketingConnection(): Promise<{ success: boolean; message: string }> {
  return PluginAPI.testEmailMarketingConnection();
}

/**
 * Get Email Marketing Configuration Details & Status
 */
export async function getStoreEmailMarketingDetails(): Promise<PluginAPI.EmailMarketingDetails> {
  return PluginAPI.getEmailMarketingDetails();
}

/**
 * Execute Campaign Sending using proven SMTP transport
 */
export async function sendStoreEmailCampaign(params: {
  subject: string;
  body: string;
  recipients: string[];
  is_html?: boolean;
}): Promise<PluginAPI.PluginActionResult<{ success: boolean; emails_sent?: number; failed?: number }>> {
  return PluginAPI.executePluginAction<{ success: boolean; emails_sent?: number; failed?: number }>(
    "sales_email_marketing",
    "send_campaign",
    params
  );
}

// ==============================================================================
// Store Interview Scheduler Types & Client (Reusing existing /api/interview-scheduler)
// ==============================================================================

import { apiClient } from "@/lib/api";

export interface StoreInterview {
  id: number;
  user_id: number;
  candidate_name: string;
  candidate_email?: string | null;
  interviewer_name: string;
  job_role: string;
  interview_date: string;
  interview_time: string;
  meeting_link?: string | null;
  interview_status: "scheduled" | "completed" | "cancelled" | "rescheduled" | "no_show";
  notes?: string | null;
  confirmation_sent?: boolean;
  reminder_sent?: boolean;
  google_calendar_event_id?: string | null;
  google_calendar_event_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreInterviewSlot {
  id: number;
  user_id: number;
  interview_id?: number | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

export async function getStoreInterviews(): Promise<StoreInterview[]> {
  const res: any = await apiClient.get("/api/interview-scheduler/interviews");
  return res.interviews || res.data || res || [];
}

export async function createStoreInterview(payload: {
  candidate_name: string;
  candidate_email?: string;
  interviewer_name: string;
  job_role: string;
  interview_date: string;
  interview_time: string;
  meeting_link?: string;
  notes?: string;
}): Promise<StoreInterview> {
  return apiClient.post("/api/interview-scheduler/interviews", payload);
}

export async function updateStoreInterview(
  id: number,
  payload: Partial<StoreInterview>
): Promise<StoreInterview> {
  return apiClient.put(`/api/interview-scheduler/interviews/${id}`, payload);
}

export async function deleteStoreInterview(id: number): Promise<void> {
  return apiClient.delete(`/api/interview-scheduler/interviews/${id}`);
}

export async function triggerStoreInterviewReminder(id: number): Promise<{ success: boolean; message: string }> {
  return apiClient.post(`/api/interview-scheduler/interviews/${id}/trigger-reminder`, {});
}

export async function getStoreInterviewSlots(): Promise<StoreInterviewSlot[]> {
  const res: any = await apiClient.get("/api/interview-scheduler/slots");
  return res.slots || res.data || res || [];
}

export async function createStoreInterviewSlot(payload: {
  slot_date: string;
  start_time: string;
  end_time: string;
}): Promise<StoreInterviewSlot> {
  return apiClient.post("/api/interview-scheduler/slots", payload);
}

export async function deleteStoreInterviewSlot(id: number): Promise<void> {
  return apiClient.delete(`/api/interview-scheduler/slots/${id}`);
}

export async function getStoreGoogleCalendarStatus(): Promise<{ connected: boolean; email?: string }> {
  return apiClient.get("/api/interview-scheduler/google-calendar/status");
}

export async function getStoreGoogleCalendarAuthUrl(): Promise<{ auth_url: string }> {
  return apiClient.get("/api/interview-scheduler/google-calendar/auth-url");
}

export async function disconnectStoreGoogleCalendar(): Promise<void> {
  return apiClient.delete("/api/interview-scheduler/google-calendar/disconnect");
}

export async function callbackStoreGoogleCalendar(payload: {
  code: string;
  redirect_uri?: string;
}): Promise<{ success: boolean; message: string }> {
  return apiClient.post("/api/interview-scheduler/google-calendar/callback", payload);
}

// ==============================================================================
// Store Order Management Types & Client (Reusing existing /api/orders)
// ==============================================================================

export type StoreOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export type StorePaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface StoreOrderItem {
  id: number;
  order_id: number;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface StoreOrder {
  id: number;
  user_id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_address: string;
  total_amount: number;
  payment_status: StorePaymentStatus;
  order_status: StoreOrderStatus;
  carrier_name?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  inventory_reserved?: boolean;
  status_history?: any[];
  created_at: string;
  updated_at: string;
  items: StoreOrderItem[];
}

export interface StoreOrderListResponse {
  success: boolean;
  total: number;
  orders: StoreOrder[];
}

export interface StoreOrderStatistics {
  total_orders: number;
  pending_orders: number;
  active_shipments: number;
  completed_orders: number;
  cancelled_orders: number;
  todays_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface StoreOrderConfig {
  success: boolean;
  setup_completed: boolean;
  email_notifications_enabled: boolean;
  email_enabled: boolean;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_username?: string;
  is_password_configured: boolean;
  from_email: string;
  sender_email?: string;
  business_name: string;
  store_name?: string;
  currency: string;
  contact_email?: string;
  templates?: Record<string, { subject: string; body: string }>;
}

export interface StoreInventoryItem {
  id: number;
  user_id: number;
  product_name: string;
  sku?: string | null;
  available_stock: number;
  reserved_stock: number;
  created_at: string;
  updated_at: string;
}

export async function getStoreOrders(params?: {
  status?: string;
  query?: string;
  skip?: number;
  limit?: number;
}): Promise<StoreOrderListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status && params.status !== "all") queryParams.append("status", params.status);
  if (params?.query && params.query.trim()) queryParams.append("query", params.query.trim());
  if (params?.skip !== undefined) queryParams.append("skip", String(params.skip));
  if (params?.limit !== undefined) queryParams.append("limit", String(params.limit));

  const queryString = queryParams.toString();
  const url = `/api/orders${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<StoreOrderListResponse>(url);
}

export async function getStoreOrder(id: number): Promise<StoreOrder> {
  return apiClient.get<StoreOrder>(`/api/orders/${id}`);
}

export async function createStoreOrder(payload: {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address: string;
  items: Array<{
    product_name: string;
    sku?: string;
    quantity: number;
    unit_price: number;
  }>;
  total_amount?: number;
  payment_status?: StorePaymentStatus;
  order_status?: StoreOrderStatus;
  carrier_name?: string;
  tracking_number?: string;
  notes?: string;
}): Promise<StoreOrder> {
  return apiClient.post<StoreOrder>("/api/orders", payload);
}

export async function updateStoreOrder(
  id: number,
  payload: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address?: string;
    payment_status?: StorePaymentStatus;
    order_status?: StoreOrderStatus;
    carrier_name?: string;
    tracking_number?: string;
    notes?: string;
  }
): Promise<StoreOrder> {
  return apiClient.put<StoreOrder>(`/api/orders/${id}`, payload);
}

export async function updateStoreOrderStatus(
  id: number,
  payload: {
    order_status: StoreOrderStatus;
    payment_status?: StorePaymentStatus;
    carrier_name?: string;
    tracking_number?: string;
    notes?: string;
  }
): Promise<StoreOrder> {
  return apiClient.put<StoreOrder>(`/api/orders/${id}/status`, payload);
}

export async function deleteStoreOrder(id: number): Promise<{ success: boolean; message: string; id: number; is_deleted: boolean }> {
  return apiClient.delete(`/api/orders/${id}`);
}

export async function getStoreOrderStatistics(): Promise<{ success: boolean; data: StoreOrderStatistics }> {
  return apiClient.get<{ success: boolean; data: StoreOrderStatistics }>("/api/orders/statistics");
}

export async function getStoreOrderConfig(): Promise<StoreOrderConfig> {
  return apiClient.get<StoreOrderConfig>("/api/orders/config");
}

export async function saveStoreOrderConfig(payload: Partial<StoreOrderConfig> & { smtp_password?: string }): Promise<StoreOrderConfig> {
  return apiClient.post<StoreOrderConfig>("/api/orders/config", payload);
}

export async function testStoreOrderSMTP(payload: {
  provider?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
}): Promise<{ success: boolean; message: string; details?: string }> {
  return apiClient.post("/api/orders/config/test-smtp", payload);
}

export async function getStoreInventory(): Promise<{ success: boolean; total: number; inventory: StoreInventoryItem[] }> {
  return apiClient.get("/api/orders/inventory");
}

export async function updateStoreInventory(
  itemId: number,
  payload: { available_stock?: number; sku?: string }
): Promise<StoreInventoryItem> {
  return apiClient.put(`/api/orders/inventory/${itemId}`, payload);
}

/**
 * Export orders to CSV matching current search & status filters.
 * Returns binary Blob representing CSV file.
 */
export async function exportStoreOrdersCSV(params?: {
  status?: string;
  query?: string;
}): Promise<Blob> {
  const queryParams = new URLSearchParams();
  queryParams.append("format", "csv");
  if (params?.status && params.status !== "all") queryParams.append("status", params.status);
  if (params?.query && params.query.trim()) queryParams.append("query", params.query.trim());

  const baseUrl = getApiBaseUrl();
  const token = apiClient.getToken() || (typeof window !== "undefined" ? localStorage.getItem("saadhyam_token") : null);
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${baseUrl}/api/orders/export?${queryParams.toString()}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.detail || `Export failed with status ${response.status}`);
  }

  return response.blob();
}

// ==============================================================================
// Store LinkedIn Marketing Types & Client (Official OAuth & Posts REST API)
// ==============================================================================

export interface LinkedInConnectionStatus {
  connected: boolean;
  is_active: boolean;
  member_name: string | null;
  member_email: string | null;
  member_id: string | null;
  profile_picture: string | null;
  connected_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
}

export interface LinkedInPostHistoryItem {
  id: number;
  post_urn: string | null;
  content: string;
  topic: string | null;
  status: "draft" | "publishing" | "published" | "failed";
  error_message: string | null;
  published_at: string | null;
  created_at: string | null;
}

export interface LinkedInPublishPostResponse {
  success: boolean;
  message: string;
  post_urn?: string;
  post_id?: number;
  published_at?: string;
  error?: string;
}

export interface LinkedInGeneratePostPayload {
  topic: string;
  goal?: string;
  tone?: string;
  company_name?: string;
  brand_name?: string;
  industry?: string;
  target_audience?: string;
  key_points?: string;
  call_to_action?: string;
  desired_length?: string;
  template?: string;
  hashtag_count?: number;
}


export interface LinkedInGeneratePostResponse {
  success: boolean;
  formatted_post: string;
  headline?: string;
  body?: string;
  hashtags: string[];
  message?: string;
}

/**
 * Check LinkedIn connection status (safe, no secret tokens returned)
 */
export async function getLinkedInConnectionStatus(): Promise<LinkedInConnectionStatus> {
  return apiClient.get<LinkedInConnectionStatus>("/api/linkedin/oauth/status");
}

/**
 * Retrieve official LinkedIn OAuth 2.0 3-legged authorization URL
 */
export async function getLinkedInAuthorizationUrl(): Promise<{ success: boolean; auth_url: string }> {
  return apiClient.get<{ success: boolean; auth_url: string }>("/api/linkedin/oauth/authorize");
}

/**
 * Disconnect user's LinkedIn account
 */
export async function disconnectLinkedIn(): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>("/api/linkedin/oauth/disconnect", {});
}

/**
 * Publish post directly to member's LinkedIn feed via official REST API
 */
export async function publishLinkedInPost(payload: {
  content: string;
  topic?: string;
  hashtags?: string[];
}): Promise<LinkedInPublishPostResponse> {
  return apiClient.post<LinkedInPublishPostResponse>("/api/linkedin/posts", payload);
}

/**
 * Retrieve user's LinkedIn post publishing history
 */
export async function getLinkedInPostHistory(limit: number = 50): Promise<LinkedInPostHistoryItem[]> {
  const res: any = await apiClient.get(`/api/linkedin/posts/history?limit=${limit}`);
  return Array.isArray(res) ? res : res?.data || [];
}

export interface LinkedInPluginConfigStatus {
  configured: boolean;
  plugin_key: string;
  client_id?: string | null;
  redirect_uri?: string | null;
  is_active: boolean;
  is_secret_set: boolean;
  updated_at?: string | null;
  message?: string | null;
}

/**
 * Retrieve safe status of the LinkedIn OAuth application configuration (Admin)
 */
export async function getLinkedInPluginConfig(): Promise<LinkedInPluginConfigStatus> {
  return apiClient.get<LinkedInPluginConfigStatus>("/api/linkedin/config");
}

/**
 * Save or update LinkedIn OAuth application credentials (Admin Only)
 */
export async function saveLinkedInPluginConfig(payload: {
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  is_active?: boolean;
}): Promise<LinkedInPluginConfigStatus> {
  return apiClient.post<LinkedInPluginConfigStatus>("/api/linkedin/config", payload);
}
export async function generateLinkedInPost(
  payload: LinkedInGeneratePostPayload
): Promise<LinkedInGeneratePostResponse> {
  return apiClient.post<LinkedInGeneratePostResponse>("/api/linkedin/generate", payload);
}