import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Download, Settings, Play, Pause } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Plugin {
  id: number;
  plugin_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  version: string;
  is_premium: boolean;
  is_ai_powered: boolean;
  pricing_tier: string;
  rating: number;
  install_count: number;
}

interface UserPlugin {
  id: number;
  is_enabled: boolean;
  installed_version: string;
  usage_count: number;
  last_used: string;
  plugin: Plugin;
}

export function PluginMarketplace() {
  const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<UserPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('marketplace');

  const categories = [
    { key: 'all', name: 'All Categories' },
    { key: 'sales_crm', name: '🏢 Sales & CRM' },
    { key: 'marketing', name: '📢 Marketing' },
    { key: 'finance', name: '💰 Finance' },
    { key: 'hr', name: '👨‍💼 HR' },
    { key: 'inventory', name: '📦 Inventory' },
    { key: 'ecommerce', name: '🛒 E-Commerce' },
    { key: 'documents', name: '📄 Documents' },
    { key: 'legal', name: '⚖️ Legal' },
    { key: 'analytics', name: '📊 Analytics' },
    { key: 'ai_agents', name: '🤖 AI Agents' },
    { key: 'website', name: '🌐 Website' },
    { key: 'communication', name: '📱 Communication' },
    { key: 'education', name: '🎓 Education' },
    { key: 'industry_specific', name: '🏥 Industry-Specific' },
    { key: 'ai_productivity', name: '🧠 AI Productivity' }
  ];

  useEffect(() => {
    fetchAvailablePlugins();
    fetchInstalledPlugins();
  }, [selectedCategory]);

  const fetchAvailablePlugins = async () => {
    try {
      const token = localStorage.getItem('token');
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      
      const response = await fetch(`/api/plugins/available${categoryParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailablePlugins(data.plugins);
      }
    } catch (error) {
      console.error('Failed to fetch available plugins:', error);
      toast({
        title: "Error",
        description: "Failed to load available plugins",
        variant: "destructive"
      });
    }
  };

  const fetchInstalledPlugins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      
      const response = await fetch(`/api/plugins/installed${categoryParam}&enabled_only=false`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInstalledPlugins(data.plugins);
      }
    } catch (error) {
      console.error('Failed to fetch installed plugins:', error);
      toast({
        title: "Error",
        description: "Failed to load installed plugins",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const installPlugin = async (pluginKey: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/plugins/install', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plugin_key: pluginKey })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Plugin installed successfully"
        });
        fetchInstalledPlugins();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to install plugin",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
      toast({
        title: "Error",
        description: "Failed to install plugin",
        variant: "destructive"
      });
    }
  };

  const togglePlugin = async (pluginKey: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/plugins/${pluginKey}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message
        });
        fetchInstalledPlugins();
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      toast({
        title: "Error",
        description: "Failed to toggle plugin",
        variant: "destructive"
      });
    }
  };

  const filteredAvailablePlugins = availablePlugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInstalledPlugins = installedPlugins.filter(userPlugin =>
    userPlugin.plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userPlugin.plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPluginInstalled = (pluginKey: string) => {
    return installedPlugins.some(up => up.plugin.plugin_key === pluginKey);
  };

  const PluginCard = ({ plugin, isInstalled, userPlugin }: { 
    plugin: Plugin, 
    isInstalled: boolean, 
    userPlugin?: UserPlugin 
  }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{plugin.icon}</span>
            <div>
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <CardDescription className="text-sm">v{plugin.version}</CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            {plugin.is_ai_powered && (
              <Badge variant="secondary" className="text-xs">🤖 AI</Badge>
            )}
            {plugin.is_premium && (
              <Badge variant="outline" className="text-xs">💎 Premium</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {plugin.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{plugin.rating}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{plugin.install_count}</span>
            </div>
          </div>
          
          {plugin.pricing_tier && (
            <Badge variant="outline" className="text-xs">
              {plugin.pricing_tier}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isInstalled ? (
            <Button 
              onClick={() => installPlugin(plugin.plugin_key)}
              className="flex-1"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          ) : (
            <div className="flex gap-2 flex-1">
              <Button 
                onClick={() => togglePlugin(plugin.plugin_key)}
                variant={userPlugin?.is_enabled ? "default" : "outline"}
                size="sm"
                className="flex-1"
              >
                {userPlugin?.is_enabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Enable
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {isInstalled && userPlugin && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              Used {userPlugin.usage_count} times
              {userPlugin.last_used && (
                <span className="ml-2">
                  Last used: {new Date(userPlugin.last_used).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plugin Marketplace</h1>
        <p className="text-gray-600">
          Discover and install powerful plugins to extend your Saadhyam AI experience
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.key} value={category.key}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="marketplace">
            Marketplace ({filteredAvailablePlugins.length})
          </TabsTrigger>
          <TabsTrigger value="installed">
            Installed ({filteredInstalledPlugins.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailablePlugins.map(plugin => (
              <PluginCard 
                key={plugin.id} 
                plugin={plugin} 
                isInstalled={isPluginInstalled(plugin.plugin_key)}
                userPlugin={installedPlugins.find(up => up.plugin.plugin_key === plugin.plugin_key)}
              />
            ))}
          </div>
          
          {filteredAvailablePlugins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No plugins found matching your criteria</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="installed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstalledPlugins.map(userPlugin => (
              <PluginCard 
                key={userPlugin.id} 
                plugin={userPlugin.plugin} 
                isInstalled={true}
                userPlugin={userPlugin}
              />
            ))}
          </div>
          
          {filteredInstalledPlugins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No installed plugins found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}