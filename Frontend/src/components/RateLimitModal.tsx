/**
 * Rate Limit Modal Component
 * Displays a user-friendly message when rate limit is exceeded
 * Similar to ChatGPT's "Too many requests" modal
 */

import React from 'react';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  retryAfterSeconds?: number;
  retryAfterTime?: string;
  waitTime?: string;
  message?: string;
}

export const RateLimitModal: React.FC<RateLimitModalProps> = ({
  isOpen,
  onClose,
  retryAfterSeconds = 60,
  retryAfterTime,
  waitTime = 'a few moments',
  message = "Our intelligence engine is currently compiling results and optimizing resources. Insights are being computed, please check back shortly."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Optimizing
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
            {message}
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Optimization time:</span>
              <span className="font-medium text-gray-900 dark:text-white">{waitTime}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Insights are being updated. You can safely close this or check back in {waitTime}.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitModal;
