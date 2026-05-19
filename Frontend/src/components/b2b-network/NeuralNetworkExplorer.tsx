import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { CategoryNode } from "./nodes/CategoryNode";
import { BusinessNode } from "./nodes/BusinessNode";
import { AnimatedBackground } from "./AnimatedBackground";
import { PremiumSearchBar } from "./PremiumSearchBar";
import { FilterPanel } from "./FilterPanel";
import { BusinessDetailPanel } from "./BusinessDetailPanel";
import { AINetworkLoadingAnimation } from "./AINetworkLoadingAnimation";
import { useBusiness } from "@/hooks/useBusiness";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { Sparkles, Building2 } from "lucide-react";
import type { Business } from "./types";

const nodeTypes = {
  category: CategoryNode,
  business: BusinessNode,
};

// Category configuration - Move outside component to prevent re-creation
const categoryConfig: Record<string, { icon: string; gradient: string }> = {
  Technology: { icon: "💻", gradient: "from-blue-500 to-cyan-500" },
  Marketing: { icon: "📢", gradient: "from-pink-500 to-rose-500" },
  Consulting: { icon: "💼", gradient: "from-purple-500 to-indigo-500" },
  Healthcare: { icon: "🏥", gradient: "from-red-500 to-pink-500" },
  Education: { icon: "📚", gradient: "from-green-500 to-emerald-500" },
  Retail: { icon: "🛍️", gradient: "from-yellow-500 to-orange-500" },
  Finance: { icon: "💰", gradient: "from-emerald-500 to-teal-500" },
  Hospitality: { icon: "🏨", gradient: "from-orange-500 to-red-500" },
  Other: { icon: "🏢", gradient: "from-gray-500 to-slate-500" },
};

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  count: number;
  gradient: string;
  expanded: boolean;
}

export function NeuralNetworkExplorer() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filter states - Multiple categories support
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showSaadhyamOnly, setShowSaadhyamOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const { business: userBusiness, loading: businessLoading } = useBusiness();
  const { businesses: nearbyBusinesses, loading: businessesLoading, error } = useNearbyBusinesses(
    undefined,
    undefined,
    50000,
    showSaadhyamOnly
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const isLoading = businessLoading || businessesLoading;
  
  // Track initial load completion
  useEffect(() => {
    if (!isLoading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoading, initialLoadComplete]);

  // Filter businesses FIRST (before categories)
  const filteredBusinesses = useMemo(() => {
    let filtered = nearbyBusinesses;

    console.log('🔍 Filtering businesses:', {
      total: nearbyBusinesses.length,
      searchQuery,
      selectedCategories,
      showSaadhyamOnly,
      showVerifiedOnly
    });

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.services.some((s) => s.toLowerCase().includes(query))
      );
      console.log('  After search:', filtered.length);
    }

    // Apply category filter - Multiple categories (OR logic)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((b) => selectedCategories.includes(b.category));
      console.log('  After category filter:', filtered.length, 'categories:', selectedCategories);
    }

    // Apply Saadhyam only filter
    if (showSaadhyamOnly) {
      filtered = filtered.filter((b) => b.source === "saadhyam");
      console.log('  After Saadhyam filter:', filtered.length);
    }

    // Apply verified only filter
    if (showVerifiedOnly) {
      filtered = filtered.filter((b) => b.isVerified);
      console.log('  After verified filter:', filtered.length);
    }

    console.log('✅ Final filtered:', filtered.length);
    return filtered;
  }, [nearbyBusinesses, searchQuery, selectedCategories, showSaadhyamOnly, showVerifiedOnly]);

  // Group businesses by category - Use filtered businesses
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();

    // Use filteredBusinesses to show accurate counts
    filteredBusinesses.forEach((business) => {
      const category = business.category || "Other";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        id: name,
        name,
        count,
        icon: categoryConfig[name]?.icon || categoryConfig.Other.icon,
        gradient: categoryConfig[name]?.gradient || categoryConfig.Other.gradient,
        expanded: expandedCategories.has(name),
      }))
      .filter((cat) => cat.count > 0) // Only show categories with businesses
      .sort((a, b) => b.count - a.count);
  }, [filteredBusinesses, expandedCategories]);

  // Generate network nodes and edges
  useEffect(() => {
    if (categories.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Calculate circular layout for categories
    const centerX = 500;
    const centerY = 400;
    const radius = 300;
    const angleStep = (2 * Math.PI) / categories.length;

    categories.forEach((category, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Add category node
      newNodes.push({
        id: `category-${category.id}`,
        type: "category",
        position: { x, y },
        data: {
          ...category,
          onToggle: () => toggleCategory(category.id),
        },
      });

      // Add business nodes if category is expanded
      if (category.expanded) {
        const categoryBusinesses = filteredBusinesses.filter(
          (b) => b.category === category.id
        );

        const businessRadius = 200;
        const businessAngleStep = (2 * Math.PI) / Math.max(categoryBusinesses.length, 1);

        categoryBusinesses.slice(0, 12).forEach((business, bizIndex) => {
          const bizAngle = angle + (bizIndex * businessAngleStep);
          const bizX = x + businessRadius * Math.cos(bizAngle);
          const bizY = y + businessRadius * Math.sin(bizAngle);

          // Add business node
          newNodes.push({
            id: `business-${business.id}`,
            type: "business",
            position: { x: bizX, y: bizY },
            data: {
              business,
              onClick: () => setSelectedBusiness(business),
            },
          });

          // Add edge from category to business
          newEdges.push({
            id: `edge-${category.id}-${business.id}`,
            source: `category-${category.id}`,
            target: `business-${business.id}`,
            type: ConnectionLineType.Bezier,
            animated: true,
            style: {
              stroke: `url(#gradient-${category.id})`,
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#a855f7",
            },
          });
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [categories, filteredBusinesses, expandedCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Only show full loading animation on initial load
  if (isLoading && !initialLoadComplete) {
    return <AINetworkLoadingAnimation />;
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <Building2 className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Location Not Set
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (window.location.href = "/dashboard/profile")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Update Profile
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatedBackground />

      {/* Subtle Loading Overlay for Filter Changes */}
      {isLoading && initialLoadComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-5 h-5 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Updating...
            </span>
          </div>
        </motion.div>
      )}

      {/* Premium Search Bar */}
      <div className="relative z-10">
        <PremiumSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          activeFilterCount={selectedCategories.length + (showSaadhyamOnly ? 1 : 0) + (showVerifiedOnly ? 1 : 0)}
        />
      </div>

      {/* Filter Panel - Rendered at top level with high z-index */}
      <FilterPanel
        show={showFilters}
        onClose={() => setShowFilters(false)}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        showSaadhyamOnly={showSaadhyamOnly}
        onSaadhyamOnlyChange={setShowSaadhyamOnly}
        showVerifiedOnly={showVerifiedOnly}
        onVerifiedOnlyChange={setShowVerifiedOnly}
      />

      {/* Neural Network Visualization */}
      <div className="relative h-[calc(100%-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.Bezier}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          className="bg-transparent"
        >
          <Background
            gap={20}
            size={1}
            color="#e5e7eb"
            className="opacity-20 dark:opacity-10"
          />
          <Controls className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg" />

          {/* SVG Gradients for edges */}
          <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
              {categories.map((category) => (
                <linearGradient
                  key={category.id}
                  id={`gradient-${category.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                </linearGradient>
              ))}
            </defs>
          </svg>
        </ReactFlow>
      </div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-8 left-8 p-6 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-sm"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Business Network
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {filteredBusinesses.length} businesses • {categories.length} categories
        </p>
        
        {/* Active Filters */}
        {(showSaadhyamOnly || showVerifiedOnly || selectedCategories.length > 0) && (
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Active Filters:
            </p>
            <div className="flex flex-wrap gap-2">
              {showSaadhyamOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  Saadhyam Only
                </span>
              )}
              {showVerifiedOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  Verified
                </span>
              )}
              {selectedCategories.map((category) => (
                <span key={category} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            <span>Click category to expand</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <span>Click business for details</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Scroll to zoom • Drag to pan</span>
          </div>
        </div>
      </motion.div>

      {/* Business Detail Panel */}
      <AnimatePresence>
        {selectedBusiness && (
          <BusinessDetailPanel
            business={selectedBusiness}
            onClose={() => setSelectedBusiness(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
