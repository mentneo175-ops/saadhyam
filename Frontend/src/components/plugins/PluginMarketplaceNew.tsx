import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Star, Download, Sparkles, TrendingUp, Zap, CheckCircle, ArrowRight, X, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plugin } from "@/config/pluginsData";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import "@/styles/plugins.css";
import * as PluginAPI from "@/lib/pluginsApi";

/**
 * Registry of plugins that have a dedicated configuration dashboard.
 * To add a new plugin dashboard: add one entry here.
 * The marketplace rendering logic requires NO changes.
 */
const PLUGIN_CONFIG_PAGES: Record<string, string> = {
  gmail: "/dashboard/plugins/gmail",
  ai_productivity_email_assistant: "/dashboard/plugins/email-assistant",
  sales_email_marketing: "/dashboard/plugins/email-marketing",
  marketing_linkedin: "/dashboard/plugins/linkedin-marketing",
  hr_employee_attendance: "/dashboard/plugins/employee-attendance",
  marketing_google_ads: "/dashboard/plugins/google-ads",
  marketing_ai_video_generator: "/dashboard/plugins/ai-video-generator",
  // outlook: "/dashboard/plugins/outlook",
  // drive: "/dashboard/plugins/drive",
};

// Map backend plugin to frontend plugin format
// Handles both the real backend PluginResponse (flat is_premium/pricing_tier)
// and the mock-data fallback shape (nested pricing object).
function mapBackendPlugin(backendPlugin: PluginAPI.BackendPlugin): Plugin {
  // Determine the canonical key (real backend uses plugin_key, mock fallback uses key)
  const id = backendPlugin.plugin_key || backendPlugin.key || "";

  // Intercept and update ONLY the LinkedIn Marketing plugin metadata
  if (id === "marketing_linkedin" || id === "linkedin-marketing") {
    return {
      id,
      name: "LinkedIn Marketing",
      category: "Marketing",
      icon: "💼",
      description: "Create professional LinkedIn posts with AI, generate industry-specific hashtags, and manage your content from one place.",
      pricing: "Free",
      rating: 5.0,
      installs: 1200,
      aiPowered: true,
    };
  }

  // Build pricing string from whichever shape the data arrived in
  let pricingStr: string;
  if (backendPlugin.pricing) {
    // Mock-data fallback path: nested { free, monthly_price }
    pricingStr = backendPlugin.pricing.free
      ? "Free"
      : `₹${backendPlugin.pricing.monthly_price || 0}/mo`;
  } else {
    // Real backend path: flat is_premium / pricing_tier
    pricingStr = backendPlugin.is_premium
      ? `₹${backendPlugin.pricing_tier || "Premium"}/mo`
      : "Free";
  }

  return {
    id,
    name: backendPlugin.name,
    category: backendPlugin.category,
    icon: backendPlugin.icon || "🔌",
    description: backendPlugin.description,
    pricing: pricingStr,
    rating: backendPlugin.rating || 4.5,
    installs: backendPlugin.installs ?? backendPlugin.install_count ?? 0,
    aiPowered: backendPlugin.ai_powered || backendPlugin.is_ai_powered || false,
  };
}

export function PluginMarketplaceNew() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Backend data states
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string; count: number }>>([
    { id: "all", name: "All Plugins", icon: "🔌", count: 0 }
  ]);
  const [stats, setStats] = useState({
    totalPlugins: 0,
    aiPowered: 0,
    categoriesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [installedPlugins, setInstalledPlugins] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"marketplace" | "installed">("marketplace");
  const [installedPluginsDetailed, setInstalledPluginsDetailed] = useState<PluginAPI.UserPluginDetail[]>([]);

  // Fetch data from backend on mount
  useEffect(() => {
    loadPluginData();
  }, []);

  async function loadPluginData() {
    setIsLoading(true);
    try {
      // Fetch plugins, categories and stats in parallel (no auth needed)
      const [pluginsData, categoriesData, statsData] = await Promise.all([
        PluginAPI.getAvailablePlugins(),
        PluginAPI.getPluginCategories(),
        PluginAPI.getPluginStats(),
      ]);

      // Map backend plugins to frontend format
      const mappedPlugins = pluginsData.map(mapBackendPlugin);
      setPlugins(mappedPlugins);

      // Map categories
      const mappedCategories = [
        { id: "all", name: "All Plugins", icon: "🔌", count: mappedPlugins.length },
        ...categoriesData.map(cat => ({
          id: cat.key,
          name: cat.name,
          icon: cat.icon || "📦",
          count: cat.count,
        }))
      ];
      setCategories(mappedCategories);

      // Set stats
      if (statsData) {
        setStats({
          totalPlugins: statsData.total_plugins,
          aiPowered: statsData.ai_powered_count,
          categoriesCount: statsData.categories_count,
        });
      } else {
        setStats({
          totalPlugins: mappedPlugins.length,
          aiPowered: mappedPlugins.filter(p => p.aiPowered).length,
          categoriesCount: categoriesData.length,
        });
      }
    } catch (error) {
      console.error("Error loading plugin data:", error);
      toast.error("Failed to load plugins. Please try again.");
    } finally {
      setIsLoading(false);
    }

    // Fetch auth-gated data separately so a 401 cannot freeze the loading spinner
    try {
      const installedData = await PluginAPI.getInstalledPlugins();
      setInstalledPlugins(installedData);
    } catch (error) {
      console.warn("Could not fetch installed plugins (user may not be logged in):", error);
    }
    try {
      const installedDetailedData = await PluginAPI.getInstalledPluginsDetailed();
      setInstalledPluginsDetailed(installedDetailedData);
    } catch (error) {
      console.warn("Could not fetch installed plugins detail (user may not be logged in):", error);
    }
  }

  // Refetch plugins when category changes
  useEffect(() => {
    async function fetchPluginsByCategory() {
      try {
        const pluginsData = await PluginAPI.getAvailablePlugins(
          selectedCategory === "all" ? undefined : selectedCategory
        );
        const mappedPlugins = pluginsData.map(mapBackendPlugin);
        setPlugins(mappedPlugins);
      } catch (error) {
        console.error("Error fetching plugins by category:", error);
      }
    }

    if (!isLoading && selectedCategory !== "all") {
      fetchPluginsByCategory();
    }
  }, [selectedCategory]);

  // Search functionality using backend API
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const results = await PluginAPI.searchPlugins(searchQuery, {
            category: selectedCategory !== "all" ? selectedCategory : undefined,
          });
          const mappedResults = results.map(mapBackendPlugin);
          setPlugins(mappedResults);
        } catch (error) {
          console.error("Error searching plugins:", error);
        }
      } else {
        // Reset to category view when search is cleared
        const pluginsData = await PluginAPI.getAvailablePlugins(
          selectedCategory === "all" ? undefined : selectedCategory
        );
        const mappedPlugins = pluginsData.map(mapBackendPlugin);
        setPlugins(mappedPlugins);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, selectedCategory]);

  const filteredPlugins = plugins;

  const handleInstall = async (plugin: Plugin) => {
    try {
      toast.loading(`Installing ${plugin.name}...`, { id: `install-${plugin.id}` });
      
      const result = await PluginAPI.installPlugin(plugin.id);
      
      if (result.success) {
        toast.success(result.message, { 
          id: `install-${plugin.id}`,
          description: "Plugin is now active and ready to use",
        });
        
        // Refresh installed plugins list
        const installed = await PluginAPI.getInstalledPlugins();
        const detailed = await PluginAPI.getInstalledPluginsDetailed();
        setInstalledPlugins(installed);
        setInstalledPluginsDetailed(detailed);
      } else {
        toast.error(result.message, { 
          id: `install-${plugin.id}`,
        });
      }
    } catch (error) {
      toast.error("Failed to install plugin", { 
        id: `install-${plugin.id}`,
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleToggle = async (pluginKey: string) => {
    try {
      toast.loading("Updating plugin status...", { id: `toggle-${pluginKey}` });
      const result = await PluginAPI.togglePlugin(pluginKey);
      if (result.success) {
        toast.success(result.message, { id: `toggle-${pluginKey}` });
        // Refresh installed plugins detailed list
        const detailed = await PluginAPI.getInstalledPluginsDetailed();
        setInstalledPluginsDetailed(detailed);
      } else {
        toast.error(result.message, { id: `toggle-${pluginKey}` });
      }
    } catch (error) {
      toast.error("Failed to update plugin status", {
        id: `toggle-${pluginKey}`,
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleUninstall = async (pluginKey: string) => {
    try {
      toast.loading("Uninstalling plugin...", { id: `uninstall-${pluginKey}` });
      const result = await PluginAPI.uninstallPlugin(pluginKey);
      if (result.success) {
        toast.success(result.message, { id: `uninstall-${pluginKey}` });
        // Refresh installed lists
        const installed = await PluginAPI.getInstalledPlugins();
        const detailed = await PluginAPI.getInstalledPluginsDetailed();
        setInstalledPlugins(installed);
        setInstalledPluginsDetailed(detailed);
      } else {
        toast.error(result.message, { id: `uninstall-${pluginKey}` });
      }
    } catch (error) {
      toast.error("Failed to uninstall plugin", {
        id: `uninstall-${pluginKey}`,
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 -m-6 p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-200/10 to-pink-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-10 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Plugin Marketplace</h1>
                <p className="text-purple-100 mt-1">Supercharge your business with AI-powered automation</p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {isLoading ? "..." : `${stats.totalPlugins}+`}
                    </div>
                    <div className="text-sm text-purple-100">Plugins Available</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {isLoading ? "..." : stats.categoriesCount}
                    </div>
                    <div className="text-sm text-purple-100">Categories</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {isLoading ? "..." : `${stats.aiPowered}+`}
                    </div>
                    <div className="text-sm text-purple-100">AI-Powered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`pb-4 px-2 font-semibold text-lg transition-all border-b-2 ${
              activeTab === "marketplace"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            🧩 Browse Marketplace
          </button>
          <button
            onClick={() => setActiveTab("installed")}
            className={`pb-4 px-2 font-semibold text-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "installed"
                ? "border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            ⚙️ My Plugins
            {installedPluginsDetailed.length > 0 && (
              <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {installedPluginsDetailed.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "marketplace" ? (
          <>
            {/* Search and Filters */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for plugins, features, or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                
                {/* View Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      viewMode === "grid"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      viewMode === "list"
                        ? "bg-purple-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {isLoading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-200 dark:bg-slate-700 w-32 h-11"></div>
                    </div>
                  ))}
                </>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap font-medium transition-all transform hover:scale-105 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                        : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedCategory === category.id
                        ? "bg-white/20"
                        : "bg-gray-100 dark:bg-slate-700"
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCategory === "all" ? "All Plugins" : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {isLoading ? "Loading..." : `${filteredPlugins.length} plugin${filteredPlugins.length !== 1 ? "s" : ""} available`}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading plugins...</p>
                </div>
              </div>
            )}

            {/* Plugin Grid/List */}
            {!isLoading && (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredPlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onInstall={() => handleInstall(plugin)}
                    onViewDetails={() => setSelectedPlugin(plugin)}
                    viewMode={viewMode}
                    isInstalled={installedPlugins.includes(plugin.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredPlugins.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-block p-6 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No plugins found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or select a different category
                </p>
              </div>
            )}
          </>
        ) : (
          /* My Plugins Tab View */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Installed Plugins
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your active integrations and automations
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading installed plugins...</p>
                </div>
              </div>
            ) : installedPluginsDetailed.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-10 border border-gray-200/50 dark:border-slate-800">
                <div className="inline-block p-6 bg-purple-50 dark:bg-purple-950/20 rounded-full mb-4">
                  <Download className="w-12 h-12 text-purple-500 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No plugins installed yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Browse the marketplace to find tools and extensions to supercharge your business workflow.
                </p>
                <Button 
                  onClick={() => setActiveTab("marketplace")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg hover:shadow-purple-500/20 px-8 py-3 rounded-xl transition-all hover:scale-105"
                >
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {installedPluginsDetailed.map((up) => {
                  const mappedPlugin = mapBackendPlugin(up.plugin);
                  const installDate = up.installation_date 
                    ? new Date(up.installation_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "Unknown";

                  return (
                    <div 
                      key={up.id} 
                      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 dark:border-slate-700/50 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                {mappedPlugin.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {mappedPlugin.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{mappedPlugin.category}</p>
                              </div>
                            </div>
                            
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              up.is_enabled 
                                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400"
                            }`}>
                              {up.is_enabled ? "🟢 Active" : "🔴 Disabled"}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                            {mappedPlugin.description}
                          </p>

                          {/* Installation Info */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 mb-4 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                            <div className="flex justify-between">
                              <span>Installed on:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{installDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Version:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{up.installed_version || "1.0.0"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Usage:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{up.usage_count} calls</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 flex-wrap">
                          <Button 
                            onClick={() => handleToggle(up.plugin_key)}
                            variant={up.is_enabled ? "outline" : "default"}
                            className={`flex-1 font-medium transition-all ${
                              up.is_enabled
                                ? "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                            }`}
                            size="sm"
                          >
                            {up.is_enabled ? "Disable" : "Enable"}
                          </Button>
                          {/* Configure button — rendered automatically for plugins that have a config page */}
                          {PLUGIN_CONFIG_PAGES[up.plugin_key] && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400"
                              onClick={() => navigate({ to: PLUGIN_CONFIG_PAGES[up.plugin_key] as any })}
                              aria-label={`Configure ${mappedPlugin.name}`}
                            >
                              <Settings className="w-3.5 h-3.5" aria-hidden />
                              Configure
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleUninstall(up.plugin_key)}
                            variant="destructive"
                            size="sm"
                            className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-transparent px-4"
                          >
                            Uninstall
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Plugin Details Modal */}
        {selectedPlugin && (
          <PluginDetailsModal
            plugin={selectedPlugin}
            onClose={() => setSelectedPlugin(null)}
            onInstall={() => handleInstall(selectedPlugin)}
          />
        )}
      </div>
    </div>
  );
}


// Plugin Card Component
interface PluginCardProps {
  plugin: Plugin;
  onInstall: () => void;
  onViewDetails: () => void;
  viewMode?: "grid" | "list";
  isInstalled?: boolean;
}

function PluginCard({ plugin, onInstall, onViewDetails, viewMode = "grid", isInstalled = false }: PluginCardProps) {
  if (viewMode === "list") {
    return (
      <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 dark:border-slate-700/50 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div className="relative">
            <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
              {plugin.icon}
            </div>
            {plugin.aiPowered && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3" />
                AI
              </div>
            )}
            {isInstalled && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <CheckCircle className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {plugin.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{plugin.category}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {plugin.pricing}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {plugin.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-white">{plugin.rating}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Download className="w-4 h-4" />
                <span className="text-sm">{plugin.installs.toLocaleString()} installs</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={onInstall}
                disabled={isInstalled}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalled ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Installed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Install Now
                  </>
                )}
              </Button>
              <Button 
                onClick={onViewDetails}
                variant="outline"
                className="px-6 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 dark:border-slate-700/50 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Installed Badge */}
      {isInstalled && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg z-10">
          <CheckCircle className="w-3 h-3" />
          Installed
        </div>
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
              {plugin.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {plugin.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{plugin.category}</p>
            </div>
          </div>
          {plugin.aiPowered && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
              <Sparkles className="w-3 h-3" />
              AI
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
          {plugin.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-gray-900 dark:text-white">{plugin.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Download className="w-4 h-4" />
            <span>{plugin.installs.toLocaleString()}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {plugin.pricing}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">per month</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={onInstall}
            disabled={isInstalled}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            size="sm"
          >
            {isInstalled ? "Installed" : "Install"}
          </Button>
          <Button 
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="flex-1 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}

// Plugin Details Modal Component
interface PluginDetailsModalProps {
  plugin: Plugin;
  onClose: () => void;
  onInstall: () => void;
}

function PluginDetailsModal({ plugin, onClose, onInstall }: PluginDetailsModalProps) {
  const isEmailMarketingPlugin =
    plugin.id === "sales_email_marketing" ||
    plugin.id === "email-marketing" ||
    plugin.name === "Email Marketing";

  const isLinkedInMarketingPlugin =
    plugin.id === "linkedin-marketing" ||
    plugin.name === "LinkedIn Marketing";

  const isEmployeeAttendancePlugin =
    plugin.id === "hr_employee_attendance" ||
    plugin.id === "employee-attendance" ||
    plugin.name === "Employee Attendance" ||
    plugin.name.includes("Employee Attendance");

  const isGoogleAdsPlugin =
    plugin.id === "marketing_google_ads" ||
    plugin.id === "google-ads" ||
    plugin.name === "Google Ads AI" ||
    plugin.name.includes("Google Ads AI");

  const isAiVideoGeneratorPlugin =
    plugin.id === "marketing_ai_video_generator" ||
    plugin.id === "ai-video-generator" ||
    plugin.name === "AI Video Generator" ||
    plugin.name.includes("AI Video Generator");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white p-8">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative z-10">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="text-7xl">{plugin.icon}</div>
                {plugin.aiPowered && (
                  <div className="absolute -bottom-2 -right-2 bg-white text-purple-600 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg font-semibold">
                    <Sparkles className="w-3 h-3" />
                    AI-Powered
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{plugin.name}</h2>
                <p className="text-purple-100 text-lg">{plugin.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "5.0" : isEmailMarketingPlugin || isLinkedInMarketingPlugin || isEmployeeAttendancePlugin ? "New" : plugin.rating}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {isEmailMarketingPlugin || isLinkedInMarketingPlugin || isEmployeeAttendancePlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "Installed" : plugin.installs.toLocaleString()}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Installs</span>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {isEmailMarketingPlugin || isLinkedInMarketingPlugin || isEmployeeAttendancePlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "Ready" : "Top"}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isEmailMarketingPlugin || isLinkedInMarketingPlugin || isEmployeeAttendancePlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "Production Ready" : "Trending"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              About this plugin
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {isEmailMarketingPlugin
                ? "Send emails through your own SMTP server using AI-powered conversational commands. Configure SMTP once and let the AI send professional emails automatically."
                : isLinkedInMarketingPlugin
                ? "LinkedIn Marketing helps businesses, startups, and professionals create engaging LinkedIn content using AI. Configure your brand profile once, generate professional posts for different marketing goals, receive relevant hashtag suggestions, and manage your post history."
                : isEmployeeAttendancePlugin
                ? "Employee Attendance is a smart workforce management solution that allows organizations to import employee records, manage daily attendance, monitor employee status, and generate attendance reports through a modern onboarding workflow.\n\nThe plugin supports employee import using CSV and Excel files and stores employee information locally, providing a solid foundation for future HR modules."
                : isGoogleAdsPlugin
                ? "Google Ads AI helps businesses plan, generate, and organize professional Google Ads campaigns using AI. Build campaign configurations, generate responsive search ad copy, manage keywords, review campaigns, and export campaign assets—all from a guided step-by-step workflow. Version 1.0 focuses on campaign planning and AI-assisted content generation without requiring Google Ads account integration."
                : isAiVideoGeneratorPlugin
                ? "AI Video Generator helps businesses create high-quality marketing and promotional videos using AI. Build your brand identity, configure platforms and video dimensions, generate script narratives, arrange storyboard layouts, select voice styles, edit captions, preview mock renders, and export project structures—all from a guided step-by-step wizard."
                : plugin.description}
            </p>
          </div>

          {/* Features Section */}
          <div className="mb-8">
            <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              Key Features
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(isEmailMarketingPlugin
                ? [
                    "AI Conversational Email Sending",
                    "SMTP Configuration",
                    "Gmail App Password Support",
                    "HTML & Plain Text Emails",
                    "SMTP Connection Testing",
                    "Secure Credential Storage",
                  ]
                : isLinkedInMarketingPlugin
                ? [
                    "AI-powered LinkedIn post generation",
                    "Multiple post templates",
                    "Smart hashtag suggestions",
                    "Brand profile configuration",
                    "Recent posts history",
                    "Copy generated posts",
                    "Download TXT",
                    "Step-by-step onboarding wizard",
                    "Local configuration persistence",
                  ]
                : isEmployeeAttendancePlugin
                ? [
                    "Employee Import (CSV & Excel)",
                    "Employee Data Preview",
                    "Attendance Dashboard",
                    "Clock In / Clock Out",
                    "Attendance Register",
                    "Employee Search",
                    "Attendance Reports",
                    "CSV Export",
                    "TXT Export",
                    "Local Employee Database",
                    "Step-by-Step Setup Wizard",
                  ]
                : isGoogleAdsPlugin
                ? [
                    "Five-Step Campaign Wizard",
                    "Google Ads Account Setup",
                    "Campaign Builder",
                    "Responsive Search Ad Generator",
                    "AI Headlines Generator",
                    "AI Descriptions Generator",
                    "Keyword Planning",
                    "Negative Keywords Support",
                    "Campaign Review",
                    "Campaign History",
                    "Copy Campaign Assets",
                    "Export TXT",
                    "Export CSV",
                    "Local Storage Persistence",
                  ]
                : isAiVideoGeneratorPlugin
                ? [
                    "Ten-Step Video Wizard",
                    "Brand Setup & Styling",
                    "Platform & Video Configuration",
                    "AI Script Generator",
                    "Storyboard Builder",
                    "AI Image Generator",
                    "AI Voice Generator",
                    "Smart Caption Generator",
                    "Interactive Timeline Preview",
                    "Project Exporter (TXT, CSV, JSON)",
                    "MP4 Placeholder Rendering",
                    "Local Storage Persistence",
                  ]
                : [
                    "Easy Integration",
                    "Customizable",
                    "Secure & Reliable",
                    "Flexible Automation",
                    "Quick Setup",
                    "Reliable Performance",
                  ]
              ).map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {isEmailMarketingPlugin && (
            <>
              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Providers
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Gmail", "Outlook", "Yahoo Mail", "Custom SMTP"].map((provider, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{provider}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Plugin Capabilities
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Send Emails", "AI Conversation Support", "SMTP Authentication", "Save Configuration", "Test SMTP Connection", "HTML Email Support"].map((capability, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isLinkedInMarketingPlugin && (
            <>
              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Use Cases
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Brand Awareness",
                    "Product Launch",
                    "Hiring",
                    "Customer Success Story",
                    "Event Promotion",
                    "Thought Leadership",
                    "Industry Insights",
                  ].map((useCase, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{useCase}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Platforms
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "LinkedIn Personal Profile",
                    "LinkedIn Company Page (Manual Posting)",
                  ].map((platform, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isEmployeeAttendancePlugin && (
            <>
              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Formats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {["CSV (.csv)", "Excel (.xlsx)"].map((format, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{format}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Plugin Capabilities
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Import Employee Directory",
                    "Employee Preview",
                    "Attendance Tracking",
                    "Clock In / Clock Out",
                    "Attendance Register",
                    "Search Employees",
                    "Attendance Reports",
                    "CSV Export",
                    "TXT Export",
                    "Local Data Storage",
                  ].map((capability, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Workflow
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "1. Welcome",
                    "2. Company Configuration",
                    "3. Employee Data Setup",
                    "4. Attendance Dashboard",
                    "5. Reports",
                  ].map((workflowStep, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{workflowStep}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isGoogleAdsPlugin && (
            <>
              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Campaign Types
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Search Campaign",
                    "Display Campaign",
                    "Performance Max",
                    "Shopping Campaign",
                  ].map((type, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Plugin Capabilities
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Campaign Configuration",
                    "AI Ad Copy Generation",
                    "Responsive Search Ads",
                    "Keyword Suggestions",
                    "Campaign History",
                    "TXT Export",
                    "CSV Export",
                    "Local Data Storage",
                  ].map((capability, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Workflow
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "1. Welcome",
                    "2. Account Setup",
                    "3. Campaign Builder",
                    "4. AI Ad Generator",
                    "5. Review & Export",
                  ].map((workflowStep, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{workflowStep}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Exports
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "TXT (.txt)",
                    "CSV (.csv)",
                  ].map((format, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{format}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isAiVideoGeneratorPlugin && (
            <>
              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Platforms
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Instagram (Reels / Posts)",
                    "YouTube (Shorts / Videos)",
                    "TikTok Videos",
                    "Facebook (Reels / Feed)",
                    "LinkedIn Video Promos",
                  ].map((platform, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Plugin Capabilities
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Brand Style Mapping",
                    "Aspect Ratio Sizing",
                    "AI Script generation",
                    "Editable Storyboard",
                    "AI Voice Synthesis",
                    "Caption Customization",
                    "Music Track selection",
                    "Local Storage Persistence",
                  ].map((capability, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Workflow Steps
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "1. Welcome & Introduction",
                    "2. Brand Style Setup",
                    "3. Platform Configuration",
                    "4. AI Script Generation",
                    "5. Storyboard Editor",
                    "6. AI Image Generator",
                    "7. AI Voice Synthesis",
                    "8. Subtitles & Captions",
                    "9. Timeline & Preview",
                    "10. Exporter Engine",
                  ].map((workflowStep, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{workflowStep}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Supported Exports
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "TXT (.txt) - Audio script",
                    "CSV (.csv) - Storyboard sheet",
                    "JSON (.json) - Full timeline",
                    "MP4 (.mp4) - Video render",
                  ].map((format, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{format}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pricing CTA */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Free
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No subscription required</p>
              </div>
              <Button
                onClick={() => {
                  onInstall();
                  onClose();
                }}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/50 px-8"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Install Plugin
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category</p>
              <p className="font-semibold text-gray-900 dark:text-white">{plugin.category}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Version</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {isEmailMarketingPlugin || isLinkedInMarketingPlugin || isEmployeeAttendancePlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "v1.0" : plugin.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {isEmailMarketingPlugin || isLinkedInMarketingPlugin || isEmployeeAttendancePlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "Production Ready" : "Active"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Developer</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {isLinkedInMarketingPlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "Saadhyam AI" : "Saadhyam"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Installation</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {isLinkedInMarketingPlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin ? "One Click Install" : "Standard"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plugin ID</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">{plugin.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">AI Powered</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {isLinkedInMarketingPlugin || isGoogleAdsPlugin || isAiVideoGeneratorPlugin || plugin.aiPowered ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {isLinkedInMarketingPlugin && (
            <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3 text-amber-500">
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">
                Direct publishing to LinkedIn is not included in Version 1.0. Generate, copy, and publish manually.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
