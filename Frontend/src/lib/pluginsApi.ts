// API service for fetching real plugin data from backend
import { env } from "@/config/env";
import { ALL_PLUGINS as pluginsData } from "@/config/pluginsData";

const API_BASE_URL = env.apiBaseUrl || "http://localhost:8001";

export interface BackendPlugin {
  key: string;
  name: string;
  category: string;
  description: string;
  pricing: {
    free: boolean;
    monthly_price?: number;
    currency?: string;
  };
  ai_powered: boolean;
  rating: number;
  installs: number;
  icon?: string;
  features?: string[];
  status?: string;
}

export interface PluginCategory {
  name: string;
  key: string;
  count: number;
  icon?: string;
}

export interface PluginStats {
  total_plugins: number;
  ai_powered_count: number;
  categories_count: number;
  total_installs: number;
  average_rating: number;
}

// Get all available plugins from backend
export async function getAvailablePlugins(category?: string): Promise<BackendPlugin[]> {
  try {
    const url = new URL(`${API_BASE_URL}/plugins/available`);
    if (category && category !== "all") {
      url.searchParams.append("category", category);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`Backend returned ${response.status}, using mock data`);
      return convertMockDataToBackendFormat();
    }
    
    const data = await response.json();
    const plugins = data.plugins || [];
    
    // If backend returns empty, use mock data as fallback
    if (plugins.length === 0) {
      console.log("Backend returned no plugins, using mock data as fallback");
      return convertMockDataToBackendFormat();
    }
    
    return plugins;
  } catch (error) {
    console.error("Error fetching plugins, using mock data:", error);
    return convertMockDataToBackendFormat();
  }
}

// Convert mock data to backend format
function convertMockDataToBackendFormat(): BackendPlugin[] {
  return pluginsData.map(plugin => ({
    key: plugin.id,
    name: plugin.name,
    category: plugin.category,
    description: plugin.description,
    pricing: {
      free: plugin.pricing.toLowerCase().includes("free"),
      monthly_price: plugin.pricing.match(/₹(\d+)/)?.[1] ? parseInt(plugin.pricing.match(/₹(\d+)/)?.[1] || "0") : undefined,
      currency: "INR"
    },
    ai_powered: plugin.aiPowered,
    rating: plugin.rating,
    installs: plugin.installs,
    icon: plugin.icon,
    features: [],
    status: "active"
  }));
}

// Get plugin categories
export async function getPluginCategories(): Promise<PluginCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/plugins/categories`);
    if (!response.ok) {
      console.warn(`Backend returned ${response.status}, using mock categories`);
      return generateMockCategories();
    }
    
    const data = await response.json();
    const categories = data.categories || [];
    
    // If backend returns empty, generate from mock data
    if (categories.length === 0) {
      console.log("Backend returned no categories, using mock data");
      return generateMockCategories();
    }
    
    return categories.map((cat: any) => ({
      name: cat.name,
      key: cat.key,
      count: cat.count || 0,
      icon: cat.icon
    }));
  } catch (error) {
    console.error("Error fetching categories, using mock data:", error);
    return generateMockCategories();
  }
}

// Generate categories from mock data
function generateMockCategories(): PluginCategory[] {
  const categoryMap = new Map<string, { count: number; icon: string }>();
  
  pluginsData.forEach(plugin => {
    const existing = categoryMap.get(plugin.category) || { count: 0, icon: plugin.icon };
    categoryMap.set(plugin.category, {
      count: existing.count + 1,
      icon: existing.icon
    });
  });
  
  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    name: category,
    key: category.toLowerCase().replace(/\s+/g, "_"),
    count: data.count,
    icon: data.icon
  }));
}

// Search plugins
export async function searchPlugins(query: string, filters?: {
  category?: string;
  ai_only?: boolean;
  free_only?: boolean;
}): Promise<BackendPlugin[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/plugins/search`);
    url.searchParams.append("q", query);
    
    if (filters?.category && filters.category !== "all") {
      url.searchParams.append("category", filters.category);
    }
    if (filters?.ai_only) {
      url.searchParams.append("ai_only", "true");
    }
    if (filters?.free_only) {
      url.searchParams.append("free_only", "true");
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to search plugins: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching plugins:", error);
    return [];
  }
}

// Get plugin statistics
export async function getPluginStats(): Promise<PluginStats | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/plugins/stats`);
    if (!response.ok) {
      console.warn("Backend stats not available, generating from mock data");
      return generateMockStats();
    }
    
    const data = await response.json();
    return data || generateMockStats();
  } catch (error) {
    console.error("Error fetching plugin stats, using mock data:", error);
    return generateMockStats();
  }
}

// Generate stats from mock data
function generateMockStats(): PluginStats {
  const aiPlugins = pluginsData.filter(p => p.aiPowered).length;
  const categories = new Set(pluginsData.map(p => p.category)).size;
  const totalInstalls = pluginsData.reduce((sum, p) => sum + p.installs, 0);
  const avgRating = pluginsData.reduce((sum, p) => sum + p.rating, 0) / pluginsData.length;
  
  return {
    total_plugins: pluginsData.length,
    ai_powered_count: aiPlugins,
    categories_count: categories,
    total_installs: totalInstalls,
    average_rating: Math.round(avgRating * 10) / 10
  };
}

// Get installed plugins
export async function getInstalledPlugins(): Promise<string[]> {
  try {
    const token = localStorage.getItem("saadhyam_token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/plugins/installed`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch installed plugins: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.plugins?.map((p: any) => p.key || p.plugin_key) || [];
  } catch (error) {
    console.error("Error fetching installed plugins:", error);
    return [];
  }
}

// Install a plugin
export async function installPlugin(pluginKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = localStorage.getItem("saadhyam_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/plugins/install`, {
      method: "POST",
      headers,
      body: JSON.stringify({ plugin_key: pluginKey }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.message || "Failed to install plugin");
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || "Plugin installed successfully",
    };
  } catch (error) {
    console.error("Error installing plugin:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to install plugin",
    };
  }
}

// Get plugin recommendations
export async function getPluginRecommendations(): Promise<BackendPlugin[]> {
  try {
    const token = localStorage.getItem("saadhyam_token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/plugins/recommendations`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}

// Get detailed plugin info
export async function getPluginInfo(pluginKey: string): Promise<BackendPlugin | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/plugins/${pluginKey}/info`);
    if (!response.ok) {
      throw new Error(`Failed to fetch plugin info: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.plugin || null;
  } catch (error) {
    console.error("Error fetching plugin info:", error);
    return null;
  }
}
