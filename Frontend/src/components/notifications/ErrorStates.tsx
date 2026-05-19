import React from 'react';
import { WifiOff, ServerCrash, ShieldAlert, FileQuestion, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  type: 'network' | 'server' | 'permission' | 'notfound' | 'session';
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ type, onRetry, className = '' }) => {
  const getContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Connection Lost',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          color: 'from-rose-500/20 to-orange-500/20',
        };
      case 'server':
        return {
          icon: ServerCrash,
          title: 'Server Unavailable',
          description: 'Our servers are temporarily unavailable. We are working to fix this. Please try again in a moment.',
          color: 'from-rose-500/20 to-pink-500/20',
        };
      case 'permission':
        return {
          icon: ShieldAlert,
          title: 'Access Denied',
          description: 'You do not have permission to access this resource. Please contact your administrator.',
          color: 'from-amber-500/20 to-orange-500/20',
        };
      case 'notfound':
        return {
          icon: FileQuestion,
          title: 'Page Not Found',
          description: 'The page you are looking for does not exist or has been moved.',
          color: 'from-gray-500/20 to-slate-500/20',
        };
      case 'session':
        return {
          icon: ShieldAlert,
          title: 'Session Expired',
          description: 'Your session has expired for security reasons. Please sign in again to continue.',
          color: 'from-cyan-500/20 to-blue-500/20',
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] px-4 ${className}`}>
      {/* Icon Container */}
      <div className="relative mb-8">
        <div className={`absolute inset-0 bg-gradient-to-br ${content.color} rounded-full blur-3xl`}></div>
        <div className="relative bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <Icon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Content */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
        {content.title}
      </h2>
      <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        {content.description}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};
