import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Star,
  Download,
  Sparkles,
  Zap,
  CheckCircle,
  ArrowRight,
  X,
  Loader2,
  Settings,
  ShoppingBag,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { STORE_PRODUCTS, StoreProduct } from "@/config/storeProducts";
import * as PluginAPI from "@/lib/pluginsApi";
import "@/styles/plugins.css";

export function StoreView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"discover" | "installed">("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // Installation state
  const [installedKeys, setInstalledKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  // Fetch installed plugins on mount
  useEffect(() => {
    loadInstalledStatus();
  }, []);

  async function loadInstalledStatus() {
    setIsLoading(true);
    try {
      const installed = await PluginAPI.getInstalledPlugins();
      setInstalledKeys(installed || []);
    } catch (error) {
      console.warn("Could not load installed status for Store:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Categories derived from STORE_PRODUCTS
  const categories = useMemo(() => {
    const cats = Array.from(new Set(STORE_PRODUCTS.map((p) => p.category)));
    return [
      { id: "all", name: "All Products", icon: "Γ£¿", count: STORE_PRODUCTS.length },
      ...cats.map((cat) => ({
        id: cat,
        name: cat,
        icon: "≡ƒºá",
        count: STORE_PRODUCTS.filter((p) => p.category === cat).length,
      })),
    ];
  }, []);

  // Filtered store products for Discover tab
  const filteredProducts = useMemo(() => {
    let result = STORE_PRODUCTS;

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    return result;
  }, [searchQuery, selectedCategory]);

  // Installed store products for Installed tab
  const installedStoreProducts = useMemo(() => {
    return STORE_PRODUCTS.filter((p) => installedKeys.includes(p.pluginKey));
  }, [installedKeys]);

  const handleInstall = async (product: StoreProduct) => {
    setActionLoadingKey(product.pluginKey);
    toast.loading(`Installing ${product.name}...`, { id: `store-install-${product.id}` });
    try {
      const res = await PluginAPI.installPlugin(product.pluginKey);
      if (res.success) {
        toast.success(res.message || `${product.name} installed successfully!`, {
          id: `store-install-${product.id}`,
          description: "Product is active and ready to use.",
        });
        const updatedInstalled = await PluginAPI.getInstalledPlugins();
        setInstalledKeys(updatedInstalled || []);
      } else {
        toast.error(res.message || `Failed to install ${product.name}`, {
          id: `store-install-${product.id}`,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Installation failed. Please try again.", {
        id: `store-install-${product.id}`,
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleUninstall = async (product: StoreProduct) => {
    setActionLoadingKey(product.pluginKey);
    toast.loading(`Uninstalling ${product.name}...`, { id: `store-uninstall-${product.id}` });
    try {
      const res = await PluginAPI.uninstallPlugin(product.pluginKey);
      if (res.success) {
        toast.success(res.message || `${product.name} uninstalled successfully.`, {
          id: `store-uninstall-${product.id}`,
        });
        const updatedInstalled = await PluginAPI.getInstalledPlugins();
        setInstalledKeys(updatedInstalled || []);
        if (selectedProduct?.id === product.id) {
          setSelectedProduct(null);
        }
      } else {
        toast.error(res.message || `Failed to uninstall ${product.name}`, {
          id: `store-uninstall-${product.id}`,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uninstallation failed.", {
        id: `store-uninstall-${product.id}`,
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleOpen = (product: StoreProduct) => {
    navigate({ to: product.dashboardRoute as any });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 -m-6 p-6">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-200/10 to-pink-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Hero Header matching Plugins Store */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-10 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Saadhyam Store</h1>
                <p className="text-purple-100 text-lg">
                  Explore, install, and manage specialized AI products and enterprise tools.
                </p>
              </div>
            </div>

            {/* Quick Stats Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold">{STORE_PRODUCTS.length}</div>
                <div className="text-purple-200 text-sm">Store Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold flex items-center gap-1">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  {STORE_PRODUCTS.filter((p) => p.aiPowered).length}
                </div>
                <div className="text-purple-200 text-sm">AI-Powered Tools</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 col-span-2 sm:col-span-1">
                <div className="text-3xl font-bold">{installedStoreProducts.length}</div>
                <div className="text-purple-200 text-sm">Installed Products</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Discover vs Installed */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("discover")}
              className={`pb-2 font-semibold text-lg transition-all relative flex items-center gap-2 ${
                activeTab === "discover"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Discover
              <span
                className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "discover"
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {STORE_PRODUCTS.length}
              </span>
              {activeTab === "discover" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("installed")}
              className={`pb-2 font-semibold text-lg transition-all relative flex items-center gap-2 ${
                activeTab === "installed"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Installed
              <span
                className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "installed"
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {installedStoreProducts.length}
              </span>
              {activeTab === "installed" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
              )}
            </button>
          </div>

          {/* View Mode Toggle */}
          {activeTab === "discover" && (
            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <LayoutGrid className="w-4 h-4 mr-1.5" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="w-4 h-4 mr-1.5" />
                List
              </Button>
            </div>
          )}
        </div>

        {/* DISCOVER TAB CONTENT */}
        {activeTab === "discover" && (
          <div className="space-y-6">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search Store products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Category Pill Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl whitespace-nowrap h-10 px-4 transition-all ${
                      selectedCategory === cat.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                        : "hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    }`}
                  >
                    <span className="mr-1.5">{cat.icon}</span>
                    {cat.name}
                    <span className="ml-1.5 text-xs opacity-75">({cat.count})</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Product Cards Container matching exact PluginMarketplaceNew card layout */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                <p className="text-muted-foreground font-medium">Loading Store products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {filteredProducts.map((product) => {
                  const isInstalled = installedKeys.includes(product.pluginKey);
                  const isActionLoading = actionLoadingKey === product.pluginKey;

                  if (viewMode === "list") {
                    return (
                      <div
                        key={product.id}
                        className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 dark:border-slate-700/50 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
                      >
                        <div className="flex items-start gap-6">
                          {/* Icon */}
                          <div className="relative">
                            <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                              {product.icon}
                            </div>
                            {product.aiPowered && (
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
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {product.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  {product.pricing || "Free"}
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {product.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-6 mb-4">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {product.rating || 4.9}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Download className="w-4 h-4" />
                                <span className="text-sm">
                                  {(product.installs || 820).toLocaleString()} installs
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                              {isInstalled ? (
                                <Button
                                  onClick={() => handleOpen(product)}
                                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                                >
                                  Open Assistant
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleInstall(product)}
                                  disabled={isActionLoading}
                                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isActionLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Installing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Install Now
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                onClick={() => setSelectedProduct(product)}
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

                  // EXACT GRID CARD MATCHING PluginMarketplaceNew
                  return (
                    <div
                      key={product.id}
                      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 dark:border-slate-700/50 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

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
                              {product.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                            </div>
                          </div>
                          {product.aiPowered && (
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                              <Sparkles className="w-3 h-3" />
                              AI
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                          {product.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {product.rating || 4.9}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Download className="w-4 h-4" />
                            <span>{(product.installs || 820).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {product.pricing || "Free"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">per month</div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {isInstalled ? (
                            <Button
                              onClick={() => handleOpen(product)}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                              size="sm"
                            >
                              Open Assistant
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleInstall(product)}
                              disabled={isActionLoading}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              size="sm"
                            >
                              {isActionLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Installing...
                                </>
                              ) : (
                                "Install"
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => setSelectedProduct(product)}
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
                })}
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border-2 border-gray-200/50 dark:border-slate-700/50 space-y-4">
                <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No products found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No Store products matched your current search or category filter.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  variant="outline"
                  className="rounded-xl border-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* INSTALLED TAB CONTENT (Matching Plugins Store Installed Tab) */}
        {activeTab === "installed" && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                <p className="text-muted-foreground font-medium">Checking installed products...</p>
              </div>
            ) : installedStoreProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {installedStoreProducts.map((product) => {
                  const isActionLoading = actionLoadingKey === product.pluginKey;

                  return (
                    <div
                      key={product.id}
                      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 dark:border-slate-700/50 p-6 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                {product.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                              </div>
                            </div>

                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                              ≡ƒƒó Active
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                            {product.description}
                          </p>

                          {/* Info */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 mb-4 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Installed & Ready</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Category:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{product.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pricing:</span>
                              <span className="font-medium text-purple-600 dark:text-purple-400">{product.pricing || "Free"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 flex-wrap">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg"
                            onClick={() => handleOpen(product)}
                          >
                            <Settings className="w-3.5 h-3.5 mr-1.5" />
                            Open Assistant
                          </Button>
                          <Button
                            onClick={() => handleUninstall(product)}
                            disabled={isActionLoading}
                            variant="destructive"
                            size="sm"
                            className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-transparent px-4"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Uninstall"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-12 text-center border-2 border-gray-200/50 dark:border-slate-700/50 max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-3xl mx-auto">
                  ≡ƒöî
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Installed Products</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Browse the Store to find AI tools and solutions to supercharge your business workflow.
                </p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg hover:shadow-purple-500/20 px-8 py-3 rounded-xl transition-all hover:scale-105"
                >
                  Browse Store Products
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRODUCT DETAILS MODAL matching PluginMarketplaceNew PluginDetailsModal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isInstalled={installedKeys.includes(selectedProduct.pluginKey)}
          isLoading={actionLoadingKey === selectedProduct.pluginKey}
          onClose={() => setSelectedProduct(null)}
          onInstall={() => handleInstall(selectedProduct)}
          onUninstall={() => handleUninstall(selectedProduct)}
          onOpen={() => {
            setSelectedProduct(null);
            handleOpen(selectedProduct);
          }}
        />
      )}
    </div>
  );
}

// Modal Component matching PluginMarketplaceNew modal styling exactly
interface ProductDetailsModalProps {
  product: StoreProduct;
  isInstalled: boolean;
  isLoading: boolean;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
}

function ProductDetailsModal({
  product,
  isInstalled,
  isLoading,
  onClose,
  onInstall,
  onUninstall,
  onOpen,
}: ProductDetailsModalProps) {
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
                <div className="text-7xl">{product.icon}</div>
                {product.aiPowered && (
                  <div className="absolute -bottom-2 -right-2 bg-white text-purple-600 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg font-semibold">
                    <Sparkles className="w-3 h-3" />
                    AI-Powered
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
                <p className="text-purple-100 text-lg">{product.category}</p>
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
                  {product.rating || 4.9}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Rating</span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {(product.installs || 820).toLocaleString()}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Installs</span>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span className="font-bold text-2xl text-gray-900 dark:text-white">
                  {isInstalled ? "Active" : "Ready"}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              About This Product
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Key Features */}
          <div className="mb-8">
            <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              Key Capabilities & Features
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {product.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing CTA */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {product.pricing || "Free"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Included in your Saadhyam AI account
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isInstalled ? (
                  <>
                    <Button
                      onClick={onUninstall}
                      disabled={isLoading}
                      variant="destructive"
                      size="lg"
                      className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-transparent px-6"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Uninstall"
                      )}
                    </Button>
                    <Button
                      onClick={onOpen}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/50 px-8"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Open Assistant
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={onInstall}
                    disabled={isLoading}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/50 px-8"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Install Product
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}