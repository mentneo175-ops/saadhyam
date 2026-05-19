import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
          <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-6">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 hover:scale-105"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
