import { memo } from "react";
import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { Building2, Star, Sparkles, CheckCircle2 } from "lucide-react";
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
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 blur-xl rounded-2xl" />

      {/* Node Container */}
      <motion.button
        onClick={data.onClick}
        whileTap={{ scale: 0.95 }}
        className="relative w-40 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden group cursor-pointer"
      >
        {/* Header */}
        <div className="h-16 bg-gradient-to-br from-cyan-100 via-blue-100 to-purple-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center"
          >
            <Building2 className="w-5 h-5 text-cyan-600" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Name */}
          <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 min-h-[32px]">
            {business.name}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4].map((star) => (
              <Star
                key={star}
                className="w-3 h-3 fill-yellow-400 text-yellow-400"
              />
            ))}
            <Star className="w-3 h-3 text-gray-300" />
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            {business.isVerified && (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Verified</span>
              </div>
            )}
            {business.isPartner && (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Partner</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300 pointer-events-none" />
      </motion.button>

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
    </motion.div>
  );
});

BusinessNode.displayName = "BusinessNode";
