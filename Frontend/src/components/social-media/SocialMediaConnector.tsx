import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  Facebook,
  Settings,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { env } from '@/config/env';
import { Link } from '@tanstack/react-router';

interface APIKeyStatus {
  id: number;
  platform: string;
  is_active: boolean;
  is_verified: boolean;
  has_api_key: boolean;
  has_client_id: boolean;
  has_client_secret: boolean;
}

interface SocialAccount {
  id: number;
  platform: string;
  platform_user_id: string;
  username: string;
  is_active: boolean;
  access_token_expires_at: string | null;
}

const platformConfigs = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    description: 'Post content and analyze engagement',
    connectEndpoint: '/auth/user-instagram/connect'
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    description: 'Upload videos and manage channel',
    connectEndpoint: '/auth/user-youtube/connect'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-600',
    description: 'Share professional content',
    connectEndpoint: '/auth/user-linkedin/connect'
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-400',
    description: 'Post tweets and engage',
    connectEndpoint: '/auth/user-twitter/connect'
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-700',
    description: 'Manage pages and post content',
    connectEndpoint: '/auth/user-facebook/connect'
  }
};

export function SocialMediaConnector() {
  const [apiKeys, setApiKeys] = useState<APIKeyStatus[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user's API keys
      const apiResponse = await fetch(`${env.VITE_API_URL}/user-api-keys/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        setApiKeys(apiData);
      }
      
      // Fetch connected social accounts
      const socialResponse = await fetch(`${env.VITE_API_URL}/instagram/social-accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        setSocialAccounts(socialData);
      }
      
    } catch (error) {
      console.error('Error fetching social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    const apiKey = apiKeys.find(k => k.platform === platform);
    
    if (!apiKey) {
      toast.error(`Please configure your ${platformConfigs[platform as keyof typeof platformConfigs].name} API keys first`);
      return;
    }
    
    if (!apiKey.is_verified) {
      toast.error(`Please validate your ${platformConfigs[platform as keyof typeof platformConfigs].name} API keys first`);
      return;
    }
    
    setConnecting(platform);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login again to connect social account");
        return;
      }
      const config = platformConfigs[platform as keyof typeof platformConfigs];
      
      // Open OAuth popup
      const popup = window.open(
        `${env.VITE_API_URL}${config.connectEndpoint}?token=${encodeURIComponent(token)}`,
        'social_oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Listen for popup messages
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === `${platform.toUpperCase()}_OAUTH_SUCCESS`) {
          popup?.close();
          toast.success(`${config.name} connected successfully!`);
          fetchData(); // Refresh data
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === `${platform.toUpperCase()}_OAUTH_ERROR`) {
          popup?.close();
          toast.error(`Failed to connect ${config.name}`);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Check if popup was blocked or closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
      
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error);
      toast.error(`Failed to connect ${platform}`);
      setConnecting(null);
    }
  };

  const getConnectionStatus = (platform: string) => {
    const apiKey = apiKeys.find(k => k.platform === platform);
    const account = socialAccounts.find(a => a.platform === platform);
    
    if (account && account.is_active) {
      return { status: 'connected', account };
    }
    
    if (!apiKey) {
      return { status: 'no-keys' };
    }
    
    if (!apiKey.is_verified) {
      return { status: 'unverified', apiKey };
    }
    
    return { status: 'ready', apiKey };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Social Media Connections</h2>
          <p className="text-muted-foreground">
            Connect your social media accounts using your personal API keys
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link to="/dashboard/settings/api-keys">
            <Key className="h-4 w-4 mr-2" />
            Manage API Keys
          </Link>
        </Button>
      </div>

      {/* API Keys Warning */}
      {apiKeys.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to configure your API keys first before connecting social media accounts.{' '}
            <Link to="/dashboard/settings/api-keys" className="underline">
              Set up API keys now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(platformConfigs).map(([platform, config]) => {
          const Icon = config.icon;
          const connectionStatus = getConnectionStatus(platform);
          
          return (
            <Card key={platform} className="relative">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>{config.name}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {connectionStatus.status === 'connected' && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  {connectionStatus.status === 'ready' && (
                    <Badge variant="secondary">
                      Ready to Connect
                    </Badge>
                  )}
                  {connectionStatus.status === 'unverified' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      API Keys Unverified
                    </Badge>
                  )}
                  {connectionStatus.status === 'no-keys' && (
                    <Badge variant="outline">
                      <Key className="h-3 w-3 mr-1" />
                      No API Keys
                    </Badge>
                  )}
                </div>

                {/* Account Info */}
                {connectionStatus.status === 'connected' && connectionStatus.account && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-medium">@{connectionStatus.account.username}</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex space-x-2">
                  {connectionStatus.status === 'connected' && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button size="sm" variant="destructive">
                        Disconnect
                      </Button>
                    </>
                  )}
                  
                  {connectionStatus.status === 'ready' && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleConnect(platform)}
                      disabled={connecting === platform}
                    >
                      {connecting === platform ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Connect {config.name}
                    </Button>
                  )}
                  
                  {(connectionStatus.status === 'unverified' || connectionStatus.status === 'no-keys') && (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/dashboard/settings/api-keys" search={{ platform }}>
                        <Key className="h-4 w-4 mr-2" />
                        {connectionStatus.status === 'no-keys' ? 'Add API Keys' : 'Verify API Keys'}
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}