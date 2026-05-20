/**
 * API Service - Handles all backend API communication
 * Includes authentication, error handling, and token management
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_STORAGE_KEY = "saadhyam_token";
const USER_STORAGE_KEY = "saadhyam_user";
const FEATURE_BLOCKS_STORAGE_KEY = "saadhyam_feature_blocks";

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  auth_provider?: string;
  profile_picture?: string;
  business_name?: string;
  business_type?: string;
  business_location?: string;
  business_description?: string;
  business_setup_completed?: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
    message?: string,
  ) {
    super(message || `API Error: ${status}`);
    this.name = "ApiError";
  }
}

const normalizeFeatureKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const resolveFeatureKeyFromEndpoint = (endpoint: string): string | null => {
  const normalizedEndpoint = normalizeFeatureKey(endpoint);
  const aliases: Array<[string, string[]]> = [
    ["website_ai", ["website", "website_ai", "website-ai", "dashboard/website"]],
    ["content_scheduler", ["content", "content_creator", "content_scheduler", "content-scheduler", "dashboard/content"]],
    ["voice_agent", ["voice_agent", "voice-agent", "dashboard/voice-agent"]],
    ["aeo_geo", ["aeo_geo", "aeo-geo", "dashboard/aeo-geo"]],
  ];

  for (const [featureKey, candidates] of aliases) {
    if (normalizedEndpoint.includes(normalizeFeatureKey(featureKey))) {
      return featureKey;
    }

    if (candidates.some((candidate) => normalizedEndpoint.includes(normalizeFeatureKey(candidate)))) {
      return featureKey;
    }
  }

  return null;
};

const persistBlockedFeature = (detail: Record<string, any>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existing = localStorage.getItem(FEATURE_BLOCKS_STORAGE_KEY);
    const entries = existing ? (JSON.parse(existing) as Array<Record<string, any>>) : [];
    const featureKey = detail.feature_key || resolveFeatureKeyFromEndpoint(String(detail.endpoint || ""));
    const nextEntry = {
      feature_key: featureKey || detail.feature || detail.module_key || null,
      endpoint: detail.endpoint || null,
      mode: detail.mode || null,
      timestamp: Date.now(),
    };

    const filtered = entries.filter((entry) => {
      const sameFeature = entry.feature_key && nextEntry.feature_key && normalizeFeatureKey(String(entry.feature_key)) === normalizeFeatureKey(String(nextEntry.feature_key));
      const sameEndpoint = entry.endpoint && nextEntry.endpoint && normalizeFeatureKey(String(entry.endpoint)) === normalizeFeatureKey(String(nextEntry.endpoint));
      return !sameFeature && !sameEndpoint;
    });

    filtered.unshift(nextEntry);
    localStorage.setItem(FEATURE_BLOCKS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 25)));
  } catch {
    // Ignore storage failures.
  }
};

// API Client Class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private abortControllers: Map<string, AbortController> = new Map();
  private defaultTimeout: number = 30000; // 30 seconds

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
    this.token = this.getStoredToken();
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Cancel specific request by key
   */
  cancelRequest(key: string) {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  /**
   * Get or create abort controller for a request
   */
  private getAbortController(key: string): AbortController {
    // Cancel previous request with same key
    this.cancelRequest(key);
    
    // Create new controller
    const controller = new AbortController();
    this.abortControllers.set(key, controller);
    
    return controller;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get stored authentication token from localStorage
   */
  private getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  }

  /**
   * Check if token is expired or about to expire
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // Check if token expires within the next 5 minutes
      return payload.exp < (currentTime + 300);
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  /**
   * Refresh the authentication token
   */
  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const newToken = data.access_token;
        
        this.setToken(newToken);
        return newToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear invalid token
        this.setToken(null);
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Save user to localStorage
   */
  private saveUser(user: User) {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  }

  /**
   * Construct authorization header with automatic token refresh
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    if (!this.token) return {};

    // Check if token needs refresh
    if (this.isTokenExpired(this.token)) {
      console.log('Token expired or about to expire, refreshing...');
      try {
        this.token = await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return {};
      }
    }

    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Fetch wrapper with error handling and automatic token refresh
   */
  private async fetchJson(
    endpoint: string, 
    options?: RequestInit,
    requestKey?: string,
    timeout: number = this.defaultTimeout
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get or create abort controller
    const abortController = requestKey 
      ? this.getAbortController(requestKey)
      : new AbortController();
    
    // Get auth header (with potential token refresh)
    const authHeader = await this.getAuthHeader();
    
    const headers = {
      "Content-Type": "application/json",
      ...authHeader,
      ...((options?.headers as Record<string, string>) || {}),
    };

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          abortController.abort();
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
        
        // Clear timeout if request completes
        abortController.signal.addEventListener('abort', () => clearTimeout(timer));
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, {
          ...options,
          headers,
          signal: abortController.signal,
        }),
        timeoutPromise
      ]);

      // Clean up abort controller
      if (requestKey) {
        this.abortControllers.delete(requestKey);
      }

      // Handle 401 errors with token refresh retry
      if (response.status === 401 && this.token && !endpoint.includes('/auth/')) {
        console.log('Received 401, checking error message...');
        
        // Check if it's a session invalidation (logged in from another device)
        const errorData = response.headers.get("content-type")?.includes("application/json")
          ? await response.json()
          : { detail: await response.text() };
        
        if (errorData.detail && errorData.detail.includes('logged in from another')) {
          console.log('Session invalidated - user logged in from another device');
          // Clear token and redirect to login immediately
          this.setToken(null);
          if (typeof window !== 'undefined') {
            alert('Your account has been logged in from another device or browser. Please login again.');
            window.location.href = '/login';
          }
          throw new ApiError(401, errorData, 'Session invalidated');
        }
        
        // Otherwise, try token refresh
        console.log('Attempting token refresh...');
        try {
          this.token = await this.refreshToken();
          
          // Retry the request with new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${this.token}`,
          };
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          if (!retryResponse.ok) {
            const retryData = retryResponse.headers.get("content-type")?.includes("application/json")
              ? await retryResponse.json()
              : await retryResponse.text();
            throw new ApiError(retryResponse.status, retryData);
          }

          const retryData = retryResponse.headers.get("content-type")?.includes("application/json")
            ? await retryResponse.json()
            : await retryResponse.text();

          return retryData;
        } catch (refreshError) {
          console.error('Token refresh failed on 401 retry:', refreshError);
          // Clear token and redirect to login
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new ApiError(401, null, 'Authentication failed');
        }
      }

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      let data: any;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        if (response.status === 503 && typeof window !== "undefined") {
          try {
            const featureKey = resolveFeatureKeyFromEndpoint(endpoint);
            const eventDetail = {
              endpoint,
              feature_key: featureKey,
              status: response.status,
              ...data,
            };

            persistBlockedFeature(eventDetail);
            window.dispatchEvent(new CustomEvent("feature-blocked", {
              detail: eventDetail,
            }));
          } catch (eventError) {
            // Ignore event dispatch failures
          }
        }
        throw new ApiError(response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, null, error instanceof Error ? error.message : "Network error");
    }
  }

  /**
   * Authenticate with Google Firebase token
   */
  async googleAuth(idToken: string): Promise<{ user: User; token: string }> {
    const data = await this.fetchJson("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      auth_provider: data.auth_provider || 'google',
      profile_picture: data.profile_picture,
      business_name: data.business_name,
      business_type: data.business_type,
      business_location: data.business_location,
      business_description: data.business_description,
      business_setup_completed: data.business_setup_completed,
      created_at: data.created_at,
    };

    this.setToken(data.access_token);
    this.saveUser(user);

    return { user, token: data.access_token };
  }

  /**
   * Register a new user with email/password
   */
  async register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    const data = await this.fetchJson("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      auth_provider: data.auth_provider || 'email',
      profile_picture: data.profile_picture,
      business_name: data.business_name,
      business_type: data.business_type,
      business_location: data.business_location,
      business_description: data.business_description,
      business_setup_completed: data.business_setup_completed,
      created_at: data.created_at,
    };

    this.setToken(data.access_token);
    this.saveUser(user);

    return { user, token: data.access_token };
  }

  /**
   * Login user with email/password
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.fetchJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      auth_provider: data.auth_provider || 'email',
      profile_picture: data.profile_picture,
      business_name: data.business_name,
      business_type: data.business_type,
      business_location: data.business_location,
      business_description: data.business_description,
      business_setup_completed: data.business_setup_completed,
      created_at: data.created_at,
    };

    this.setToken(data.access_token);
    this.saveUser(user);

    return { user, token: data.access_token };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const data = await this.fetchJson("/me", {
      method: "GET",
    });

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      auth_provider: data.auth_provider,
      profile_picture: data.profile_picture,
      business_name: data.business_name,
      business_type: data.business_type,
      business_location: data.business_location,
      business_description: data.business_description,
      business_setup_completed: data.business_setup_completed,
      created_at: data.created_at,
    };

    this.saveUser(user);
    return user;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.fetchJson("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      // Still clear local token even if logout fails
      console.error("Logout error:", error);
    }
    this.clearAuth();
  }

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    this.setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      // Clear other business-related data
      localStorage.removeItem("businessInfo");
      localStorage.removeItem("businessAnalysis");
      localStorage.removeItem("businessProfile");
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.fetchJson(endpoint, { method: "GET" });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.fetchJson(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.fetchJson(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchJson(endpoint, { method: "DELETE" });
  }

  // AI Feature Methods

  /**
   * Business Analysis AI
   */
  async analyzeBusinessAsync(businessType: string, location: string): Promise<any> {
    return this.post("/ai/business-analysis", { business_type: businessType, location });
  }

  /**
   * Generate Content (New Content Creator API)
   */
  async generateContent(payload: {
    content_type: string;
    tone: string;
    language: string;
    prompt: string;
    business_type?: string;
  }): Promise<any> {
    // Map content_type to platform
    const platformMap: Record<string, string> = {
      instagram: "instagram",
      email: "facebook",
      ad: "instagram",
      whatsapp: "reels",
    };

    // Map content_type to goal
    const goalMap: Record<string, string> = {
      instagram: "promotion",
      email: "engagement",
      ad: "promotion",
      whatsapp: "engagement",
    };

    const platform = platformMap[payload.content_type] || "instagram";
    const goal = goalMap[payload.content_type] || "promotion";

    // Get business type from payload, localStorage, or use default
    let businessType = payload.business_type;
    if (!businessType) {
      try {
        const profile = localStorage.getItem("businessProfile");
        if (profile) {
          const parsed = JSON.parse(profile);
          businessType = parsed.business_name || parsed.business_type || "Business";
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    if (!businessType) {
      businessType = "Business";
    }

    const response = await this.post("/content/generate", {
      business_type: businessType,
      platform: platform,
      goal: goal,
      tone: payload.tone,
      language: payload.language.toLowerCase(),
    });

    // Transform response to match expected format
    if (response.status === "success" && response.content) {
      const { caption, hashtags, script } = response.content;
      
      // Format output based on content type
      let formattedContent = "";
      
      if (payload.content_type === "instagram") {
        formattedContent = `${caption}\n\n${hashtags.join(" ")}\n\n${script}`;
      } else if (payload.content_type === "email") {
        formattedContent = `Subject: ${caption}\n\n${script}\n\n${hashtags.join(" ")}`;
      } else if (payload.content_type === "ad") {
        formattedContent = `${caption}\n\n${script}\n\n${hashtags.slice(0, 5).join(" ")}`;
      } else if (payload.content_type === "whatsapp") {
        formattedContent = `${caption}\n\n${script}`;
      }

      return {
        success: true,
        content: formattedContent,
        note: response.note,
      };
    }

    return response;
  }

  /**
   * Generate WhatsApp Message
   */
  async generateWhatsAppMessage(payload: {
    message_type: string;
    customer_name: string;
    service: string;
    language: string;
    tone: string;
  }): Promise<any> {
    return this.post("/ai/generate-whatsapp", payload);
  }

  /**
   * Generate Website Content
   */
  async generateWebsiteContent(section: string, businessInfo: string): Promise<any> {
    return this.post("/ai/generate-website", { section, business_info: businessInfo });
  }

  /**
   * Get Pricing Suggestion
   */
  async getPricingSuggestion(payload: {
    service_type: string;
    location: string;
    experience: string;
  }): Promise<any> {
    return this.post("/ai/pricing-suggestion", payload);
  }

  /**
   * Generate Review Reply
   */
  async generateReviewReply(reviewText: string, rating: number): Promise<any> {
    return this.post("/ai/generate-review-reply", { review_text: reviewText, rating });
  }

  // ============= INSTAGRAM INTEGRATION =============

  /**
   * Schedule Instagram post
   */
  async scheduleInstagramPost(imageFile: File, caption: string, scheduledTime: string): Promise<any> {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("caption", caption);
    formData.append("scheduled_time", scheduledTime);

    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}/instagram/schedule-post`, {
      method: "POST",
      headers: {
        ...authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to schedule Instagram post");
    }

    return response.json();
  }

  /**
   * Get Instagram posts
   */
  async getInstagramPosts(status?: string, limit: number = 20, page: number = 1): Promise<any> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("limit", limit.toString());
    params.append("page", page.toString());

    return this.get(`/instagram/posts?${params.toString()}`, "instagram-posts");
  }

  /**
   * Check Instagram connection status
   */
  async getInstagramStatus(): Promise<any> {
    return this.get("/settings/instagram/connection-status", "instagram-status");
  }

  // ============= END INSTAGRAM INTEGRATION =============

  /**
   * Analyze Business
   */
  async analyzeBusiness(description: string): Promise<any> {
    return this.post("/api/business/analyze", { description });
  }

  /**
   * Analyze Multiple Businesses (Batch)
   */
  async analyzeBusinessBatch(descriptions: string[]): Promise<any> {
    return this.post("/api/business/analyze-batch", { descriptions });
  }

  /**
   * Get Business Analysis History
   */
  async getBusinessAnalysisHistory(limit: number = 10): Promise<any> {
    return this.get(`/api/business/history?limit=${limit}`);
  }

  /**
   * Get Latest Business Analysis
   */
  async getLatestBusinessAnalysis(): Promise<any> {
    return this.get("/api/business/latest");
  }

  /**
   * Get SEO Keywords
   */
  async getSEOKeywords(businessType: string, location: string): Promise<any> {
    return this.post("/ai/seo-keywords", { business_type: businessType, location });
  }

  // ============= CRUD Operations (Non-AI) =============

  /**
   * Tasks Management
   */
  async getTasks(): Promise<any> {
    return this.get("/api/tasks");
  }

  async createTask(task: {
    title: string;
    impact: string;
    time: string;
    done?: boolean;
    ai?: boolean;
    icon?: string;
  }): Promise<any> {
    return this.post("/api/tasks", task);
  }

  async updateTask(taskId: number, task: any): Promise<any> {
    return this.put(`/api/tasks/${taskId}`, task);
  }

  async deleteTask(taskId: number): Promise<any> {
    return this.delete(`/api/tasks/${taskId}`);
  }

  /**
   * Competitors Management
   */
  async getCompetitors(): Promise<any> {
    return this.get("/api/competitors");
  }

  async createCompetitor(competitor: {
    name: string;
    handle: string;
    score?: number;
    followers?: string;
    posts?: number;
    engagement?: string;
    trend?: string;
    insight?: string;
    color?: string;
  }): Promise<any> {
    return this.post("/api/competitors", competitor);
  }

  async updateCompetitor(competitorId: number, competitor: any): Promise<any> {
    return this.put(`/api/competitors/${competitorId}`, competitor);
  }

  async deleteCompetitor(competitorId: number): Promise<any> {
    return this.delete(`/api/competitors/${competitorId}`);
  }

  /**
   * Automation Workflows Management
   */
  async getWorkflows(): Promise<any> {
    return this.get("/api/workflows");
  }

  async createWorkflow(workflow: {
    name: string;
    desc: string;
    on?: boolean;
    icon?: string;
    runs?: string;
    steps?: string[];
    color?: string;
  }): Promise<any> {
    return this.post("/api/workflows", workflow);
  }

  async updateWorkflow(workflowId: number, workflow: any): Promise<any> {
    return this.put(`/api/workflows/${workflowId}`, workflow);
  }

  async deleteWorkflow(workflowId: number): Promise<any> {
    return this.delete(`/api/workflows/${workflowId}`);
  }

  /**
   * User Settings Management
   */
  async getSettings(): Promise<any> {
    return this.get("/api/settings");
  }

  async updateSettings(settings: {
    full_name: string;
    email: string;
    phone: string;
    timezone: string;
    business_name: string;
    industry: string;
    description: string;
    brand_voice: string;
    target_audience: string;
  }): Promise<any> {
    return this.put("/api/settings", settings);
  }

  // ============= Profile Management =============

  /**
   * Get complete user profile including business information
   */
  async getProfile(): Promise<any> {
    return this.get("/api/profile/");
  }

  /**
   * Get business profile information only
   */
  async getBusinessProfile(): Promise<any> {
    return this.get("/api/profile/business");
  }

  /**
   * Update business profile information
   */
  async updateBusinessProfile(profile: {
    business_name: string;
    business_type: string;
    business_location: string;
    business_description: string;
  }): Promise<any> {
    return this.put("/api/profile/business", profile);
  }

  /**
   * Check if business setup is completed
   */
  async getBusinessSetupStatus(): Promise<any> {
    return this.get("/api/profile/business/setup-status");
  }

  // ============= Business Input Engine =============

  /**
   * Upload PDF and extract business description
   */
  async uploadPDF(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}/api/business/upload-pdf`, {
      method: "POST",
      headers: {
        ...authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(response.status, errorData, errorData.detail || "PDF upload failed");
    }

    return response.json();
  }



  /**
   * Import business information from website
   */
  async importWebsite(url: string): Promise<any> {
    return this.post("/api/business/import-website", { url });
  }

  /**
   * Get business input profile
   */
  async getBusinessInputProfile(): Promise<any> {
    return this.get("/api/business/profile");
  }

  /**
   * Update business description manually
   */
  async updateBusinessDescription(description: string): Promise<any> {
    const formData = new FormData();
    formData.append("business_description", description);

    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}/api/business/profile`, {
      method: "PUT",
      headers: {
        ...authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(response.status, errorData, errorData.detail || "Update failed");
    }

    return response.json();
  }

  /**
   * Delete uploaded file (PDF or audio)
   */
  async deleteBusinessFile(fileType: "pdf" | "audio"): Promise<any> {
    const formData = new FormData();
    formData.append("file_type", fileType);

    const authHeader = await this.getAuthHeader();
    
    const response = await fetch(`${this.baseUrl}/api/business/profile/file`, {
      method: "DELETE",
      headers: {
        ...authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(response.status, errorData, errorData.detail || "Delete failed");
    }

    return response.json();
  }

  // ============= HTTP METHOD WRAPPERS =============

  /**
   * GET request with automatic cancellation support
   */
  async get(endpoint: string, requestKey?: string): Promise<any> {
    return this.fetchJson(endpoint, { method: "GET" }, requestKey);
  }

  /**
   * POST request with automatic cancellation support
   */
  async post(endpoint: string, data?: any, requestKey?: string): Promise<any> {
    return this.fetchJson(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      requestKey
    );
  }

  /**
   * PUT request with automatic cancellation support
   */
  async put(endpoint: string, data?: any, requestKey?: string): Promise<any> {
    return this.fetchJson(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      requestKey
    );
  }

  /**
   * DELETE request with automatic cancellation support
   */
  async delete(endpoint: string, requestKey?: string): Promise<any> {
    return this.fetchJson(endpoint, { method: "DELETE" }, requestKey);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;
