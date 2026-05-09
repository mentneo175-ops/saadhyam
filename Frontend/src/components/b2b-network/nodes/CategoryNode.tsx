import { memo } from "react";
import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CategoryNodeProps {
  data: {
    id: string;
    name: string;
    icon: string;
    count: number;
    gradient: string;
    expanded: boolean;
    onToggle: () => void;
  };
}

export const CategoryNode = memo(({ data }: CategoryNodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      whileHover={{ scale: 1.1 }}
      className="relative"
    >
      {/* Glow Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${data.gradient} opacity-30 blur-2xl rounded-full`}
      />

      {/* Node Container */}
      <motion.button
        onClick={data.onToggle}
        whileTap={{ scale: 0.95 }}
        className="relative w-32 h-32 rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-2 border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden group cursor-pointer"
      >
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${data.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4">
          {/* Icon */}
          <motion.div
            animate={{
              rotate: data.expanded ? [0, -10, 10, -10, 0] : 0,
            }}
            transition={{ duration: 0.5 }}
            className="text-4xl mb-2"
          >
            {data.icon}
          </motion.div>

          {/* Name */}
          <div className="text-xs font-bold text-gray-900 dark:text-white text-center line-clamp-1 mb-1">
            {data.name}
          </div>

          {/* Count */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {data.count}
          </div>

          {/* Expand Indicator */}
          <motion.div
            animate={{ rotate: data.expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-2 right-2"
          >
            {data.expanded ? (
              <ChevronDown className="w-4 h-4 text-purple-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </motion.div>
        </div>

        {/* Pulse Animation */}
        {data.expanded && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 bg-gradient-to-br ${data.gradient} rounded-3xl`}
          />
        )}
      </motion.button>

      {/* Handles for connections */}
      <Handle
        type="source"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </motion.div>
  );
});

CategoryNode.displayName = "CategoryNode";
