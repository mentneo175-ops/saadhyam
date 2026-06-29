import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Building2,
  Users,
  MapPin,
  Star,
  TrendingUp,
  ExternalLink,
  X,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { formatFollowers } from "../utils/formatters";

interface InfluencerNode {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  followers: number;
  platform: string;
  location: string;
  matchScore: number;
  niche: string;
  profile_url: string;
  whyItWorks?: string;
  suggestedCampaign?: string;
  estimatedCost?: string;
  engagement?: string;
}

interface Props {
  businessName: string;
  industry: string;
  influencers: InfluencerNode[];
  onClose: () => void;
}

// Custom Business Node Component
function BusinessNode({ data }: any) {
  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />

      {/* Node content */}
      <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-purple-200 min-w-[280px] dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-1 break-words max-w-[240px] dark:text-slate-100">
              {data.name}
            </h3>
            <p className="text-base text-purple-600 font-medium capitalize">{data.industry}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">
              {data.connectionCount} Connections
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Influencer Node Component
function InfluencerNode({ data }: any) {
  const [showTooltip, setShowTooltip] = useState(false);

  const color = data.color;

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => data.onSelect(data.influencer)}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity"
        style={{ backgroundColor: color.glow }}
      />

      {/* Node content */}
      <div
        className="relative bg-white backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 transition-all hover:scale-105 dark:bg-slate-900"
        style={{
          borderColor: color.primary,
          minWidth: "160px",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          {/* Profile image placeholder */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
            }}
          >
            {data.influencer.full_name?.[0] || data.influencer.username?.[0] || "?"}
          </div>

          {/* Name */}
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900 truncate max-w-[130px] dark:text-slate-100">
              {data.influencer.full_name || data.influencer.username}
            </p>
            <p className="text-xs text-gray-500 capitalize mt-1">{data.influencer.niche}</p>
          </div>

          {/* Match score */}
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${color.primary}15` }}
          >
            <Star className="w-3 h-3" style={{ color: color.primary, fill: color.primary }} />
            <span className="text-xs font-bold" style={{ color: color.primary }}>
              {data.influencer.matchScore}%
            </span>
          </div>
        </div>

        {/* Hover tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-56 bg-gray-900 text-white rounded-xl p-4 shadow-2xl z-50 animate-fadeIn pointer-events-none dark:bg-slate-900">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-purple-300" />
                <span className="font-semibold">
                  {formatFollowers(data.influencer.followers)} followers
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-purple-300" />
                <span>{data.influencer.engagement || "N/A"} engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-purple-300" />
                <span>{data.influencer.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-purple-300" />
                <span>{data.influencer.platform}</span>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  business: BusinessNode,
  influencer: InfluencerNode,
};

export default function PartnershipNetworkExplorer({
  businessName,
  industry,
  influencers,
  onClose,
}: Props) {
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerNode | null>(null);

  // Limit to top 5 influencers
  const limitedInfluencers = influencers.slice(0, 5);

  // Industry colors
  const industryColors: Record<string, { primary: string; secondary: string; glow: string }> = {
    food: { primary: "#f59e0b", secondary: "#fbbf24", glow: "rgba(245, 158, 11, 0.5)" },
    fashion: { primary: "#ec4899", secondary: "#f472b6", glow: "rgba(236, 72, 153, 0.5)" },
    travel: { primary: "#3b82f6", secondary: "#60a5fa", glow: "rgba(59, 130, 246, 0.5)" },
    fitness: { primary: "#10b981", secondary: "#34d399", glow: "rgba(16, 185, 129, 0.5)" },
    tech: { primary: "#8b5cf6", secondary: "#a78bfa", glow: "rgba(139, 92, 246, 0.5)" },
    beauty: { primary: "#f43f5e", secondary: "#fb7185", glow: "rgba(244, 63, 94, 0.5)" },
    education: { primary: "#06b6d4", secondary: "#22d3ee", glow: "rgba(6, 182, 212, 0.5)" },
    default: { primary: "#a855f7", secondary: "#c084fc", glow: "rgba(168, 85, 247, 0.5)" },
  };

  const getIndustryColor = (niche: string) => {
    const key = niche.toLowerCase();
    return industryColors[key] || industryColors.default;
  };

  // Create nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Business center node
    nodes.push({
      id: "business",
      type: "business",
      position: { x: 400, y: 300 },
      data: {
        name: businessName,
        industry: industry,
        connectionCount: limitedInfluencers.length,
      },
      draggable: false,
    });

    // Influencer nodes in a circle
    const radius = 350;
    const centerX = 400;
    const centerY = 300;

    limitedInfluencers.forEach((influencer, index) => {
      const angle = (index / limitedInfluencers.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const color = getIndustryColor(influencer.niche || industry);

      nodes.push({
        id: influencer.id || influencer.username,
        type: "influencer",
        position: { x: x - 80, y: y - 80 }, // Center the node
        data: {
          influencer,
          color,
          onSelect: setSelectedInfluencer,
        },
        draggable: true,
      });

      // Create edge from business to influencer
      edges.push({
        id: `business-${influencer.id || influencer.username}`,
        source: "business",
        target: influencer.id || influencer.username,
        type: ConnectionLineType.Bezier,
        animated: true,
        style: {
          stroke: color.primary,
          strokeWidth: 2,
          opacity: 0.4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: color.primary,
          width: 20,
          height: 20,
        },
      });
    });

    return { nodes, edges };
  }, [businessName, industry, limitedInfluencers]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event: any, node: Node) => {
    if (node.type === "influencer") {
      setSelectedInfluencer(node.data.influencer);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-50 via-white to-pink-50 md:relative md:inset-auto md:z-auto">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm md:relative dark:border-slate-800">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors dark:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Partnership Network
              </h1>
              <p className="text-sm text-gray-600">
                {limitedInfluencers.length} recommended connections for {businessName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors md:hidden dark:bg-slate-800"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="w-full h-[calc(100vh-80px)] md:h-[600px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e5e7eb" gap={20} size={1} />
          <Controls className="bg-white rounded-xl shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-800" />
          <MiniMap
            className="bg-white rounded-xl shadow-lg border border-gray-200 dark:bg-slate-900 dark:border-slate-800"
            nodeColor={(node) => {
              if (node.type === "business") return "#a855f7";
              return node.data.color?.primary || "#a855f7";
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>
      </div>

      {/* Side Panel for Selected Influencer */}
      {selectedInfluencer && (
        <div className="fixed md:absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white border-l border-gray-200 shadow-2xl overflow-y-auto animate-slideInRight z-20 dark:bg-slate-900 dark:border-slate-800">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-1 dark:text-slate-100">
                  {selectedInfluencer.full_name || selectedInfluencer.username}
                </h3>
                <p className="text-purple-600 font-medium capitalize">
                  {selectedInfluencer.niche || industry} Influencer
                </p>
              </div>
              <button
                onClick={() => setSelectedInfluencer(null)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors dark:bg-slate-800"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  {formatFollowers(selectedInfluencer.followers)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Followers</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="text-xl font-bold text-purple-600">
                  {selectedInfluencer.matchScore}%
                </div>
                <div className="text-xs text-gray-600 mt-1">Match</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="text-xl font-bold text-pink-600">
                  {selectedInfluencer.engagement || "N/A"}
                </div>
                <div className="text-xs text-gray-600 mt-1">Engagement</div>
              </div>
            </div>

            {/* Bio */}
            {selectedInfluencer.bio && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 dark:text-slate-300">
                  About
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedInfluencer.bio}</p>
              </div>
            )}

            {/* Location & Platform */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700 dark:text-slate-300">
                  {selectedInfluencer.location}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700 dark:text-slate-300">
                  {selectedInfluencer.platform}
                </span>
              </div>
            </div>

            {/* Why It Works */}
            {selectedInfluencer.whyItWorks && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">
                  Why This Partnership Works
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed dark:text-slate-300">
                  {selectedInfluencer.whyItWorks}
                </p>
              </div>
            )}

            {/* Campaign Suggestion */}
            {selectedInfluencer.suggestedCampaign && (
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                <h4 className="text-sm font-semibold text-pink-900 mb-2">Suggested Campaign</h4>
                <p className="text-gray-700 text-sm leading-relaxed dark:text-slate-300">
                  {selectedInfluencer.suggestedCampaign}
                </p>
              </div>
            )}

            {/* Estimated Cost */}
            {selectedInfluencer.estimatedCost && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 dark:text-slate-300">
                  Estimated Investment
                </h4>
                <p className="text-purple-600 text-xl font-bold">
                  {selectedInfluencer.estimatedCost}
                </p>
              </div>
            )}

            {/* Action Button */}
            <a
              href={selectedInfluencer.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <span>View Profile</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
