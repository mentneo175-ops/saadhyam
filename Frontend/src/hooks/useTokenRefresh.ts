/**
 * useTokenRefresh Hook - Automatically refreshes tokens before expiration
 * Runs in the background to keep user sessions active
 */

import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';

const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000; // 10 minutes before expiry

export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isTokenExpiringSoon = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = payload.exp;
      
      // Check if token expires within the buffer time
      return (expiryTime * 1000) - Date.now() < TOKEN_EXPIRY_BUFFER;
    } catch (error) {
      console.error('Error parsing token for expiry check:', error);
      return true; // Assume expired if we can't parse
    }
  };

  const refreshTokenIfNeeded = async () => {
    const token = apiClient.getToken();
    
    if (!token) {
      return; // No token to refresh
    }

    if (isTokenExpiringSoon(token)) {
      try {
        console.log('Token expiring soon, refreshing...');
        
        const response = await fetch('http://localhost:8000/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          apiClient.setToken(data.access_token);
          console.log('Token refreshed successfully');
        } else {
          console.error('Token refresh failed:', response.status);
          // If refresh fails, clear token and redirect to login
          apiClient.setToken(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // Clear token on error
        apiClient.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
  };

  useEffect(() => {
    // Only run if user is authenticated
    if (apiClient.isAuthenticated()) {
      // Initial check
      refreshTokenIfNeeded();

      // Set up periodic refresh
      intervalRef.current = setInterval(refreshTokenIfNeeded, TOKEN_REFRESH_INTERVAL);

      // Cleanup on unmount
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}