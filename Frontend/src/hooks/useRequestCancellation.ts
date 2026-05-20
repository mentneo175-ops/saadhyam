/**
 * Hook for automatic request cancellation on navigation
 * Prevents slow page loads when navigating away from pages with pending requests
 */

import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { apiClient } from '../lib/api';

export function useRequestCancellation() {
  const location = useLocation();

  useEffect(() => {
    // Cancel all pending requests when route changes
    return () => {
      apiClient.cancelAllRequests();
    };
  }, [location.pathname]);

  // Return cancellation functions for manual use
  return {
    cancelAllRequests: () => apiClient.cancelAllRequests(),
    cancelRequest: (key: string) => apiClient.cancelRequest(key),
  };
}

/**
 * Hook for canceling specific request types
 */
export function usePageRequestCancellation(requestKeys: string[]) {
  const location = useLocation();

  useEffect(() => {
    // Cancel specific requests when leaving the page
    return () => {
      requestKeys.forEach(key => {
        apiClient.cancelRequest(key);
      });
    };
  }, [location.pathname, requestKeys]);
}

/**
 * Hook for Instagram page - cancels Instagram requests when navigating away
 */
export function useInstagramRequestCancellation() {
  return usePageRequestCancellation([
    'instagram-posts',
    'instagram-status',
    'instagram-analytics',
    'instagram-media'
  ]);
}

/**
 * Hook for Settings page - cancels settings requests when navigating away
 */
export function useSettingsRequestCancellation() {
  return usePageRequestCancellation([
    'user-settings',
    'update-settings',
    'user-profile'
  ]);
}