import { memo } from "react";
import { Handle, Position } from "reactflow";
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
    <div className="relative">
      {/* Node Container */}
      <button
        onClick={data.onToggle}
        className="relative w-32 h-32 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-purple-400 transition-all overflow-hidden cursor-pointer"
      >
        {/* Subtle Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${data.gradient} opacity-5 hover:opacity-10 transition-opacity`}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4">
          {/* Icon */}
          <div className="text-4xl mb-2">
            {data.icon}
          </div>

          {/* Name */}
          <div className="text-xs font-bold text-gray-900 dark:text-white text-center line-clamp-1 mb-1">
            {data.name}
          </div>

          {/* Count */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {data.count}
          </div>

          {/* Expand Indicator */}
          <div className="absolute bottom-2 right-2">
            {data.expanded ? (
              <ChevronDown className="w-4 h-4 text-purple-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

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
    </div>
  );
});

CategoryNode.displayName = "CategoryNode";
