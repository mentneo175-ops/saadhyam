/**
 * Rate Limit Handler Hook
 * Global hook to handle rate limit errors across the application
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiRequestError, RateLimitError } from '../utils/api';

interface RateLimitState {
  isRateLimited: boolean;
  rateLimitInfo: RateLimitError | null;
  showModal: boolean;
}

export const useRateLimitHandler = () => {
  const [state, setState] = useState<RateLimitState>({
    isRateLimited: false,
    rateLimitInfo: null,
    showModal: false,
  });

  /**
   * Handle API errors and check for rate limiting
   */
  const handleApiError = useCallback((error: any) => {
    if (error instanceof ApiRequestError && error.isRateLimitError) {
      setState({
        isRateLimited: true,
        rateLimitInfo: error.rateLimitInfo || null,
        showModal: true,
      });
      return true; // Indicates rate limit error was handled
    }
    return false; // Not a rate limit error
  }, []);

  /**
   * Close the rate limit modal
   */
  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showModal: false,
    }));
  }, []);

  /**
   * Reset rate limit state
   */
  const resetRateLimit = useCallback(() => {
    setState({
      isRateLimited: false,
      rateLimitInfo: null,
      showModal: false,
    });
  }, []);

  /**
   * Auto-reset after retry period
   */
  useEffect(() => {
    if (state.isRateLimited && state.rateLimitInfo) {
      const retryAfter = state.rateLimitInfo.retry_after_seconds * 1000;
      const timer = setTimeout(() => {
        resetRateLimit();
      }, retryAfter);

      return () => clearTimeout(timer);
    }
  }, [state.isRateLimited, state.rateLimitInfo, resetRateLimit]);

  return {
    isRateLimited: state.isRateLimited,
    rateLimitInfo: state.rateLimitInfo,
    showModal: state.showModal,
    handleApiError,
    closeModal,
    resetRateLimit,
  };
};

export default useRateLimitHandler;
