import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Trash2, 
  ExternalLink,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { env } from '@/config/env';

interface APIKey {
  id: number;
  platform: string;
  is_active: boolean;
  is_verified: boolean;
  last_verified_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  has_api_key: boolean;
  has_client_id: boolean;
  has_client_secret: boolean;
}

interface PlatformTemplate {
  platform: string;
  display_name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  field_descriptions: Record<string, string>;
  setup_instructions: string;
  documentation_url: string;
}

interface APIKeyFormData {
  platform: string;
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  config?: Record<string, any>;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <div className="w-6 h-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">IG</div>,
  youtube: <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">YT</div>,
  linkedin: <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">IN</div>,
  twitter: <div className="w-6 h-6 bg-blue-400 rounded-lg flex items-center justify-center text-white text-xs font-bold">TW</div>,
  facebook: <div className="w-6 h-6 bg-blue-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">FB</div>,
  tiktok: <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">TT</div>
};

export function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [platforms, setPlatforms] = useState<PlatformTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformTemplate | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFieldValues, setShowFieldValues] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<APIKeyFormData>({
    platform: '',
    api_key: '',
    client_id: '',
    client_secret: '',
    config: {}
  });
  const [validating, setValidating] = useState<string | null>(null);

  // Fetch user's API keys and platform templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch user's existing API keys
        const keysResponse = await fetch(`${env.VITE_API_URL}/user-api-keys/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setApiKeys(keysData);
        }
        
        // Fetch supported platforms
        const platformsResponse = await fetch(`${env.VITE_API_URL}/user-api-keys/platforms`);
        if (platformsResponse.ok) {
          const platformsData = await platformsResponse.json();
          setPlatforms(platformsData);
        }
        
      } catch (error) {
        console.error('Error fetching API keys data:', error);
        toast.error('Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddApiKeys = (platform: PlatformTemplate) => {
    setSelectedPlatform(platform);
    setFormData({
      platform: platform.platform,
      api_key: '',
      client_id: '',
      client_secret: '',
      config: {}
    });
    setShowAddDialog(true);
  };

  const handleSaveApiKeys = async () => {
    if (!selectedPlatform) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Validate required fields
      for (const field of selectedPlatform.required_fields) {
        const fieldValue = formData[field as keyof APIKeyFormData] as string;
        if (!fieldValue || fieldValue.trim() === '') {
          toast.error(`${field} is required`);
          return;
        }
      }
      
      const response = await fetch(`${env.VITE_API_URL}/user-api-keys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const newKey = await response.json();
        setApiKeys(prev => {
          const existing = prev.find(k => k.platform === formData.platform);
          if (existing) {
            return prev.map(k => k.platform === formData.platform ? newKey : k);
          } else {
            return [...prev, newKey];
          }
        });
        
        setShowAddDialog(false);
        toast.success(`API keys saved for ${selectedPlatform.display_name}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to save API keys');
      }
      
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error('Failed to save API keys');
    }
  };

  const handleValidateKeys = async (platform: string) => {
    setValidating(platform);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${env.VITE_API_URL}/user-api-keys/${platform}/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update the API key status
        setApiKeys(prev => prev.map(key => 
          key.platform === platform 
            ? { ...key, is_verified: result.is_valid, error_message: result.error_message }
            : key
        ));
        
        if (result.is_valid) {
          toast.success(`${platform} API keys validated successfully`);
        } else {
          toast.error(`Validation failed: ${result.error_message}`);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Validation failed');
      }
      
    } catch (error) {
      console.error('Error validating API keys:', error);
      toast.error('Failed to validate API keys');
    } finally {
      setValidating(null);
    }
  };

  const handleDeleteKeys = async (platform: string) => {
    if (!confirm(`Are you sure you want to delete ${platform} API keys?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${env.VITE_API_URL}/user-api-keys/${platform}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.platform !== platform));
        toast.success(`${platform} API keys deleted`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to delete API keys');
      }
      
    } catch (error) {
      console.error('Error deleting API keys:', error);
      toast.error('Failed to delete API keys');
    }
  };

  const toggleFieldVisibility = (field: string) => {
    setShowFieldValues(prev => ({ ...prev, [field]: !prev[field] }));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your personal API credentials for social media platforms
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Platforms</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.is_verified).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Needs Setup</p>
                <p className="text-2xl font-bold">{platforms.length - apiKeys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Tabs */}
      <Tabs defaultValue="configured" className="w-full">
        <TabsList>
          <TabsTrigger value="configured">Configured ({apiKeys.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({platforms.length - apiKeys.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configured" className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No API keys configured</p>
                <p className="text-muted-foreground text-center">
                  Add your first API keys to start automating your social media
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((apiKey) => {
                const platform = platforms.find(p => p.platform === apiKey.platform);
                if (!platform) return null;
                
                return (
                  <Card key={apiKey.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {platformIcons[apiKey.platform]}
                          <div>
                            <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                            <CardDescription>{platform.description}</CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={apiKey.is_verified ? 'default' : 'secondary'}>
                            {apiKey.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidateKeys(apiKey.platform)}
                            disabled={validating === apiKey.platform}
                          >
                            {validating === apiKey.platform ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Validate
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddApiKeys(platform)}
                          >
                            Edit
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteKeys(apiKey.platform)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-muted-foreground">Status:</span>
                          {apiKey.is_verified ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center text-orange-600">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Unverified
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-muted-foreground">Keys:</span>
                          <div className="flex space-x-2">
                            {apiKey.has_api_key && <Badge variant="outline">API Key</Badge>}
                            {apiKey.has_client_id && <Badge variant="outline">Client ID</Badge>}
                            {apiKey.has_client_secret && <Badge variant="outline">Client Secret</Badge>}
                          </div>
                        </div>
                        
                        {apiKey.error_message && (
                          <div className="flex items-start text-sm">
                            <span className="w-20 text-muted-foreground">Error:</span>
                            <span className="text-red-600">{apiKey.error_message}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-muted-foreground">Updated:</span>
                          <span>{new Date(apiKey.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4">
            {platforms
              .filter(platform => !apiKeys.find(k => k.platform === platform.platform))
              .map((platform) => (
                <Card key={platform.platform} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {platformIcons[platform.platform]}
                        <div>
                          <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                          <CardDescription>{platform.description}</CardDescription>
                        </div>
                      </div>
                      
                      <Button onClick={() => handleAddApiKeys(platform)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Keys
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Required: </span>
                        {platform.required_fields.join(', ')}
                      </div>
                      
                      {platform.documentation_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={platform.documentation_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Docs
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit API Keys Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedPlatform && platformIcons[selectedPlatform.platform]}
              <span>Configure {selectedPlatform?.display_name} API Keys</span>
            </DialogTitle>
            <DialogDescription>
              {selectedPlatform?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlatform && (
            <div className="space-y-6">
              {/* Setup Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Textarea 
                      value={selectedPlatform.setup_instructions} 
                      readOnly 
                      className="min-h-[100px] text-sm"
                    />
                    {selectedPlatform.documentation_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedPlatform.documentation_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Documentation
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* API Keys Form */}
              <div className="space-y-4">
                {[...selectedPlatform.required_fields, ...selectedPlatform.optional_fields].map((field) => {
                  const isRequired = selectedPlatform.required_fields.includes(field);
                  const description = selectedPlatform.field_descriptions[field];
                  const fieldValue = formData[field as keyof APIKeyFormData] as string || '';
                  const showValue = showFieldValues[field] || false;
                  
                  return (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field} className="flex items-center space-x-1">
                        <span className="capitalize">{field.replace('_', ' ')}</span>
                        {isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      
                      <div className="relative">
                        <Input
                          id={field}
                          type={showValue ? 'text' : 'password'}
                          value={fieldValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                          placeholder={`Enter your ${field.replace('_', ' ')}`}
                          className="pr-10"
                        />
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleFieldVisibility(field)}
                        >
                          {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKeys}>
              <Shield className="h-4 w-4 mr-2" />
              Save API Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}