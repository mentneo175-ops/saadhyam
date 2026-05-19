import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'ai';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, title, message, action, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-cyan-500" />;
      case 'ai':
        return <Sparkles className="w-5 h-5 text-violet-500" />;
    }
  };

  const getStyles = () => {
    const base = "relative backdrop-blur-xl border shadow-2xl rounded-2xl";
    
    switch (type) {
      case 'success':
        return `${base} bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/50 shadow-emerald-500/10`;
      case 'error':
        return `${base} bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/50 shadow-rose-500/10`;
      case 'warning':
        return `${base} bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/50 shadow-amber-500/10`;
      case 'info':
        return `${base} bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200/50 dark:border-cyan-800/50 shadow-cyan-500/10`;
      case 'ai':
        return `${base} bg-violet-50/90 dark:bg-violet-950/40 border-violet-200/50 dark:border-violet-800/50 shadow-violet-500/10`;
    }
  };

  return (
    <div
      className={`
        ${getStyles()}
        pointer-events-auto
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        hover:scale-[1.02] hover:shadow-2xl
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
            {title}
          </h4>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-gray-900 dark:text-white hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Progress Bar (if not paused) */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full ${
              type === 'success' ? 'bg-emerald-500' :
              type === 'error' ? 'bg-rose-500' :
              type === 'warning' ? 'bg-amber-500' :
              type === 'info' ? 'bg-cyan-500' :
              'bg-violet-500'
            } animate-progress`}
          />
        </div>
      )}
    </div>
  );
};
