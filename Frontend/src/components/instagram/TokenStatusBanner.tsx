/**
 * Instagram Token Status Banner
 * Shows token expiry status and allows manual refresh
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TokenStatus {
  connected: boolean;
  status?: 'healthy' | 'warning' | 'critical' | 'expired' | 'unknown';
  days_until_expiry?: number;
  expires_at?: string;
  message?: string;
  needs_refresh?: boolean;
}

export function TokenStatusBanner() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTokenStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('saadhyam_token');
      const response = await fetch('http://localhost:8000/api/instagram/tokens/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTokenStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch token status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('saadhyam_token');
      const response = await fetch('http://localhost:8000/api/instagram/tokens/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Token refreshed successfully! Valid for ${data.expires_in_days} more days.`);
        fetchTokenStatus(); // Reload status
      } else {
        const error = await response.json();
        alert(`Failed to refresh token: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      alert('Failed to refresh token. Please try reconnecting your Instagram account.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTokenStatus();
    // Check status every hour
    const interval = setInterval(fetchTokenStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !tokenStatus || !tokenStatus.connected) {
    return null;
  }

  // Don't show banner if token is healthy
  if (tokenStatus.status === 'healthy') {
    return null;
  }

  const getStatusConfig = () => {
    switch (tokenStatus.status) {
      case 'expired':
        return {
          icon: XCircle,
          color: 'bg-red-50 border-red-200 text-red-800',
          iconColor: 'text-red-600',
          title: 'Instagram Token Expired',
          showRefresh: false,
        };
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          iconColor: 'text-orange-600',
          title: 'Instagram Token Expiring Soon',
          showRefresh: true,
        };
      case 'warning':
        return {
          icon: Clock,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconColor: 'text-yellow-600',
          title: 'Instagram Token Expiring',
          showRefresh: true,
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          iconColor: 'text-gray-600',
          title: 'Instagram Token Status Unknown',
          showRefresh: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-4 mb-4 ${config.color}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{config.title}</h3>
          <p className="text-sm mb-3">{tokenStatus.message}</p>
          
          <div className="flex gap-2">
            {config.showRefresh && (
              <Button
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh Token
                  </>
                )}
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={() => (window.location.href = '/dashboard/settings')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Reconnect Instagram
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
