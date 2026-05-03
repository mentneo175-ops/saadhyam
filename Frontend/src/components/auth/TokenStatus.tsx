/**
 * TokenStatus - Shows token refresh status (for development/debugging)
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export function TokenStatus() {
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    expiresIn: number | null;
    isExpiringSoon: boolean;
  }>({
    hasToken: false,
    expiresIn: null,
    isExpiringSoon: false,
  });

  const updateTokenInfo = () => {
    const token = apiClient.getToken();
    
    if (!token) {
      setTokenInfo({
        hasToken: false,
        expiresIn: null,
        isExpiringSoon: false,
      });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - currentTime;
      const isExpiringSoon = expiresIn < 600; // Less than 10 minutes

      setTokenInfo({
        hasToken: true,
        expiresIn,
        isExpiringSoon,
      });
    } catch (error) {
      console.error('Error parsing token:', error);
      setTokenInfo({
        hasToken: true,
        expiresIn: null,
        isExpiringSoon: true,
      });
    }
  };

  useEffect(() => {
    updateTokenInfo();
    
    // Update every 30 seconds
    const interval = setInterval(updateTokenInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!tokenInfo.hasToken) {
    return null; // Don't show anything if not authenticated
  }

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}h`;
    } else {
      return `${Math.floor(seconds / 86400)}d`;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={tokenInfo.isExpiringSoon ? "destructive" : "secondary"}
        className="text-xs"
      >
        Token: {tokenInfo.expiresIn ? formatTimeRemaining(tokenInfo.expiresIn) : 'Invalid'}
      </Badge>
    </div>
  );
}