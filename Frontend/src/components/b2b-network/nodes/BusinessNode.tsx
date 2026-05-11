import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Building2, Sparkles, CheckCircle2, MapPin } from "lucide-react";
import type { Business } from "../types";

interface BusinessNodeProps {
  data: {
    business: Business;
    onClick: () => void;
  };
}

export const BusinessNode = memo(({ data }: BusinessNodeProps) => {
  const { business } = data;

  return (
    <div className="relative">
      {/* Node Container - No glow effects */}
      <button
        onClick={data.onClick}
        className="relative w-40 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden hover:shadow-xl hover:border-purple-400 transition-all cursor-pointer"
      >
        {/* Header - Special gradient for Saadhyam partners */}
        <div className={`h-16 flex items-center justify-center ${
          business.source === "saadhyam"
            ? "bg-gradient-to-br from-purple-200 via-pink-200 to-purple-200 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-purple-900/50"
            : "bg-gradient-to-br from-cyan-100 via-blue-100 to-purple-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-purple-900/30"
        }`}>
          <div
            className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center ${
              business.source === "saadhyam"
                ? "bg-gradient-to-br from-purple-600 to-pink-600"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            <Building2 className={`w-5 h-5 ${
              business.source === "saadhyam" ? "text-white" : "text-cyan-600"
            }`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Name */}
          <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 min-h-[32px]">
            {business.name}
          </div>

          {/* Category & Info */}
          <div className="mb-2 space-y-1">
            {/* Category */}
            <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
              {business.category}
            </div>
            
            {/* Distance */}
            {business.distance_km !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                <MapPin className="w-3 h-3" />
                <span>
                  {business.distance_km < 1 
                    ? `${Math.round(business.distance_km * 1000)}m`
                    : `${business.distance_km}km`
                  }
                </span>
              </div>
            )}
            
            {/* Primary Service (if available) */}
            {business.services && business.services.length > 0 && (
              <div className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                {business.services[0]}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            {business.source === "saadhyam" && (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold shadow-lg">
                <Sparkles className="w-2.5 h-2.5" />
                <span>SAADHYAM</span>
              </div>
            )}
            {business.isVerified && business.source !== "saadhyam" && (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Verified</span>
              </div>
            )}
            {business.isPartner && business.source !== "saadhyam" && (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Partner</span>
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Handle for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-cyan-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-2 h-2 bg-cyan-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="w-2 h-2 bg-cyan-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-cyan-500 border-2 border-white"
      />
    </div>
  );
});

BusinessNode.displayName = "BusinessNode";
