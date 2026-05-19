/**
 * Rate Limit Context
 * Global context for managing rate limit state across the application
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RateLimitModal } from '../components/RateLimitModal';
import { ApiRequestError, RateLimitError } from '../utils/api';

interface RateLimitContextType {
  isRateLimited: boolean;
  rateLimitInfo: RateLimitError | null;
  handleApiError: (error: any) => boolean;
  resetRateLimit: () => void;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export const useRateLimit = () => {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit must be used within RateLimitProvider');
  }
  return context;
};

interface RateLimitProviderProps {
  children: React.ReactNode;
}

export const RateLimitProvider: React.FC<RateLimitProviderProps> = ({ children }) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null);
  const [showModal, setShowModal] = useState(false);

  /**
   * Handle API errors and check for rate limiting
   */
  const handleApiError = useCallback((error: any): boolean => {
    if (error instanceof ApiRequestError && error.isRateLimitError) {
      setIsRateLimited(true);
      setRateLimitInfo(error.rateLimitInfo || null);
      setShowModal(true);
      return true; // Indicates rate limit error was handled
    }
    return false; // Not a rate limit error
  }, []);

  /**
   * Reset rate limit state
   */
  const resetRateLimit = useCallback(() => {
    setIsRateLimited(false);
    setRateLimitInfo(null);
    setShowModal(false);
  }, []);

  /**
   * Close modal handler
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  /**
   * Auto-reset after retry period
   */
  useEffect(() => {
    if (isRateLimited && rateLimitInfo) {
      const retryAfter = rateLimitInfo.retry_after_seconds * 1000;
      const timer = setTimeout(() => {
        resetRateLimit();
      }, retryAfter);

      return () => clearTimeout(timer);
    }
  }, [isRateLimited, rateLimitInfo, resetRateLimit]);

  return (
    <RateLimitContext.Provider
      value={{
        isRateLimited,
        rateLimitInfo,
        handleApiError,
        resetRateLimit,
      }}
    >
      {children}
      
      {/* Global Rate Limit Modal */}
      <RateLimitModal
        isOpen={showModal}
        onClose={closeModal}
        retryAfterSeconds={rateLimitInfo?.retry_after_seconds}
        retryAfterTime={rateLimitInfo?.retry_after_time}
        waitTime={rateLimitInfo?.wait_time}
        message={rateLimitInfo?.detail}
      />
    </RateLimitContext.Provider>
  );
};

export default RateLimitProvider;
