import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2"></div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-5/6"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-4/6"></div>
    </div>
  </div>
);

export const ShimmerLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
  </div>
);

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-cyan-500 animate-spin`} />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
};

interface AILoadingProps {
  message?: string;
}

export const AILoading: React.FC<AILoadingProps> = ({ message = 'AI is generating...' }) => (
  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl border border-violet-200 dark:border-violet-800">
    <div className="relative">
      <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
      <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
      <div className="flex gap-1 mt-2">
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

interface ProgressBarProps {
  progress: number;
  message?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message }) => (
  <div className="space-y-2">
    {message && (
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    )}
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-500 text-right">{progress}%</p>
  </div>
);
