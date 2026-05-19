import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

interface GlobalBannerProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'ai';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
}

export const GlobalBanner: React.FC<GlobalBannerProps> = ({
  type,
  title,
  message,
  action,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'ai':
        return <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
      case 'error':
        return 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
      case 'info':
        return 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800';
      case 'ai':
        return 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
      <div className={`${getStyles()} border-b backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {title}
                </p>
                {message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {action && (
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:underline whitespace-nowrap"
                >
                  {action.label}
                </button>
              )}
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
