/**
 * API Service - Handles all backend API communication
 * Includes authentication, error handling, and token management
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_STORAGE_KEY = "saadhyam_token";
const USER_STORAGE_KEY = "saadhyam_user";

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

// API Client Class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
    this.token = this.getStoredToken();
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
  private async fetchJson(endpoint: string, options?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth header (with potential token refresh)
    const authHeader = await this.getAuthHeader();
    
    const headers = {
      "Content-Type": "application/json",
      ...authHeader,
      ...((options?.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 errors with token refresh retry
      if (response.status === 401 && this.token && !endpoint.includes('/auth/')) {
        console.log('Received 401, attempting token refresh...');
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
            window.location.href = '/auth/login';
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
   * Register a new user
   */
  async register(payload: RegisterRequest): Promise<{ user: User; token: string }> {
    const data = await this.fetchJson("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const user: User = {
      id: data.id,
      email: data.email,
      created_at: data.created_at,
    };

    this.setToken(data.access_token);
    this.saveUser(user);

    return { user, token: data.access_token };
  }

  /**
   * Login user
   */
  async login(payload: LoginRequest): Promise<{ user: User; token: string }> {
    const data = await this.fetchJson("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const user: User = {
      id: data.id,
      email: data.email,
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
    this.setToken(null);
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
   * Generate Content
   */
  async generateContent(payload: {
    content_type: string;
    tone: string;
    language: string;
    prompt: string;
  }): Promise<any> {
    return this.post("/ai/generate-content", payload);
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
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;
