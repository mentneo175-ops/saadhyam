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
  waitTime = '1 minute',
  message = "You're making requests too quickly. We've temporarily limited access to protect our systems."
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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-orange-600 dark:text-orange-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Too many requests
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Wait time:</span>
              <span className="font-medium text-gray-900 dark:text-white">{waitTime}</span>
            </div>
            {retryAfterTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Try again at:</span>
                <span className="font-medium text-gray-900 dark:text-white">{retryAfterTime}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please wait {waitTime} before trying again.
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
