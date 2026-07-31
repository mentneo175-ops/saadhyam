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
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { env } from '@/config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  masked_api_key?: string | null;
  masked_client_id?: string | null;
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

// ─── Platform icon chips ───────────────────────────────────────────────────────

const platformIcons: Record<string, React.ReactNode> = {
  instagram: (
    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
      IG
    </div>
  ),
  youtube: (
    <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
      YT
    </div>
  ),
  linkedin: (
    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
      IN
    </div>
  ),
  twitter: (
    <div className="w-8 h-8 bg-sky-400 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
      TW
    </div>
  ),
  facebook: (
    <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
      FB
    </div>
  ),
  tiktok: (
    <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
      TT
    </div>
  ),
};

const defaultIcon = (platform: string) => (
  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow">
    {platform.slice(0, 2).toUpperCase()}
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    config: {},
  });
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // platform to delete

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [keysRes, platformsRes] = await Promise.all([
        fetch(`${env.apiBaseUrl}/user-api-keys/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${env.apiBaseUrl}/user-api-keys/platforms`),
      ]);

      if (keysRes.ok) setApiKeys(await keysRes.json());
      if (platformsRes.ok) setPlatforms(await platformsRes.json());
    } catch (err) {
      console.error('Error fetching API keys data:', err);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddApiKeys = (platform: PlatformTemplate) => {
    setSelectedPlatform(platform);
    setFormData({ platform: platform.platform, api_key: '', client_id: '', client_secret: '', config: {} });
    setShowFieldValues({});
    setShowAddDialog(true);
  };

  const handleSaveApiKeys = async () => {
    if (!selectedPlatform) return;

    // Client-side required field validation
    for (const field of selectedPlatform.required_fields) {
      const val = formData[field as keyof APIKeyFormData] as string;
      if (!val || val.trim() === '') {
        toast.error(`"${field.replace(/_/g, ' ')}" is required`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${env.apiBaseUrl}/user-api-keys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const saved: APIKey = await res.json();
        setApiKeys((prev) => {
          const exists = prev.find((k) => k.platform === formData.platform);
          return exists
            ? prev.map((k) => (k.platform === formData.platform ? saved : k))
            : [...prev, saved];
        });
        setShowAddDialog(false);
        toast.success(`API keys saved for ${selectedPlatform.display_name}`);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to save API keys');
      }
    } catch (err) {
      console.error('Error saving API keys:', err);
      toast.error('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateKeys = async (platform: string) => {
    setValidating(platform);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${env.apiBaseUrl}/user-api-keys/${platform}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const result = await res.json();
        setApiKeys((prev) =>
          prev.map((k) =>
            k.platform === platform
              ? { ...k, is_verified: result.is_valid, error_message: result.error_message }
              : k
          )
        );
        result.is_valid
          ? toast.success(`${platform} connection verified ✓`)
          : toast.error(`Validation failed: ${result.error_message}`);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Validation failed');
      }
    } catch (err) {
      console.error('Error validating API keys:', err);
      toast.error('Failed to validate API keys');
    } finally {
      setValidating(null);
    }
  };

  const handleDeleteKeys = async (platform: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${env.apiBaseUrl}/user-api-keys/${platform}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.platform !== platform));
        toast.success(`${platform} API keys removed`);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to delete API keys');
      }
    } catch (err) {
      console.error('Error deleting API keys:', err);
      toast.error('Failed to delete API keys');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleFieldVisibility = (field: string) =>
    setShowFieldValues((prev) => ({ ...prev, [field]: !prev[field] }));

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading API keys…</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Securely manage credentials for connected platforms. Keys are stored encrypted and never shown in full.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Key className="h-5 w-5 text-violet-500" />, label: 'Connected', value: apiKeys.length },
          {
            icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
            label: 'Verified',
            value: apiKeys.filter((k) => k.is_verified).length,
          },
          {
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
            label: 'Needs Setup',
            value: platforms.filter((p) => !apiKeys.find((k) => k.platform === p.platform)).length,
          },
        ].map(({ icon, label, value }) => (
          <Card key={label} className="border border-border/60 shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">{icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold leading-none mt-0.5">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configured" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="configured">Configured ({apiKeys.length})</TabsTrigger>
          <TabsTrigger value="available">
            Available ({platforms.filter((p) => !apiKeys.find((k) => k.platform === p.platform)).length})
          </TabsTrigger>
        </TabsList>

        {/* ── Configured tab ─────────────────────────────────────────────────── */}
        <TabsContent value="configured" className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Key className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-semibold text-muted-foreground">No API keys configured yet</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Switch to the <strong>Available</strong> tab to connect your first platform.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((apiKey) => {
                const platform = platforms.find((p) => p.platform === apiKey.platform);
                const displayName = platform?.display_name ?? apiKey.platform;
                const icon = platformIcons[apiKey.platform] ?? defaultIcon(apiKey.platform);

                return (
                  <Card key={apiKey.id} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          {icon}
                          <div>
                            <CardTitle className="text-base leading-tight">{displayName}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{platform?.description}</CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={apiKey.is_verified ? 'default' : 'secondary'}
                            className={
                              apiKey.is_verified
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : ''
                            }
                          >
                            {apiKey.is_verified ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {apiKey.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>

                          <Button
                            id={`validate-${apiKey.platform}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidateKeys(apiKey.platform)}
                            disabled={validating === apiKey.platform}
                          >
                            {validating === apiKey.platform ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            Test
                          </Button>

                          {platform && (
                            <Button
                              id={`edit-${apiKey.platform}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddApiKeys(platform)}
                            >
                              Edit
                            </Button>
                          )}

                          <Button
                            id={`delete-${apiKey.platform}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget(apiKey.platform)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        {/* Credentials row */}
                        <div className="flex items-start gap-2">
                          <span className="w-28 shrink-0 text-muted-foreground">Credentials</span>
                          <div className="flex flex-wrap gap-1.5">
                            {apiKey.has_api_key && (
                              <Badge variant="outline" className="font-mono text-xs gap-1">
                                <Key className="h-3 w-3" />
                                {apiKey.masked_api_key ?? 'API Key'}
                              </Badge>
                            )}
                            {apiKey.has_client_id && (
                              <Badge variant="outline" className="font-mono text-xs gap-1">
                                <Key className="h-3 w-3" />
                                Client ID {apiKey.masked_client_id ? `· ${apiKey.masked_client_id}` : ''}
                              </Badge>
                            )}
                            {apiKey.has_client_secret && (
                              <Badge variant="outline" className="font-mono text-xs">
                                Client Secret · ****
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Verified at */}
                        {apiKey.last_verified_at && (
                          <div className="flex items-center gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Last tested</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {fmtDate(apiKey.last_verified_at)}
                            </span>
                          </div>
                        )}

                        {/* Error */}
                        {apiKey.error_message && (
                          <div className="flex items-start gap-2">
                            <span className="w-28 shrink-0 text-muted-foreground">Error</span>
                            <span className="text-destructive">{apiKey.error_message}</span>
                          </div>
                        )}

                        {/* Updated */}
                        <div className="flex items-center gap-2">
                          <span className="w-28 shrink-0 text-muted-foreground">Last updated</span>
                          <span className="text-muted-foreground">{fmtDate(apiKey.updated_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Available tab ───────────────────────────────────────────────────── */}
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4">
            {platforms
              .filter((p) => !apiKeys.find((k) => k.platform === p.platform))
              .map((platform) => (
                <Card key={platform.platform} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        {platformIcons[platform.platform] ?? defaultIcon(platform.platform)}
                        <div>
                          <CardTitle className="text-base leading-tight">{platform.display_name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{platform.description}</CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {platform.documentation_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={platform.documentation_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Docs
                            </a>
                          </Button>
                        )}
                        <Button
                          id={`connect-${platform.platform}`}
                          size="sm"
                          onClick={() => handleAddApiKeys(platform)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      <strong>Required: </strong>
                      {platform.required_fields.map((f) => f.replace(/_/g, ' ')).join(', ')}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlatform && (platformIcons[selectedPlatform.platform] ?? defaultIcon(selectedPlatform.platform))}
              Configure {selectedPlatform?.display_name}
            </DialogTitle>
            <DialogDescription>{selectedPlatform?.description}</DialogDescription>
          </DialogHeader>

          {selectedPlatform && (
            <div className="space-y-6 py-2">
              {/* Setup Instructions */}
              <Card className="bg-muted/40 border-dashed">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm">Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <Textarea
                    value={selectedPlatform.setup_instructions}
                    readOnly
                    className="min-h-[90px] text-xs font-mono resize-none bg-background"
                  />
                  {selectedPlatform.documentation_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedPlatform.documentation_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        View Documentation
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Fields */}
              <div className="space-y-4">
                {[...selectedPlatform.required_fields, ...selectedPlatform.optional_fields].map((field) => {
                  const isRequired = selectedPlatform.required_fields.includes(field);
                  const description = selectedPlatform.field_descriptions[field];
                  const fieldValue = (formData[field as keyof APIKeyFormData] as string) || '';
                  const showValue = showFieldValues[field] ?? false;

                  return (
                    <div key={field} className="space-y-1.5">
                      <Label htmlFor={`field-${field}`} className="flex items-center gap-1">
                        <span className="capitalize">{field.replace(/_/g, ' ')}</span>
                        {isRequired && <span className="text-destructive text-xs">*</span>}
                        {!isRequired && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                            optional
                          </Badge>
                        )}
                      </Label>

                      <div className="relative">
                        <Input
                          id={`field-${field}`}
                          type={showValue ? 'text' : 'password'}
                          value={fieldValue}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                          className="pr-10 font-mono text-sm"
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => toggleFieldVisibility(field)}
                        >
                          {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button id="save-api-keys-btn" onClick={handleSaveApiKeys} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving…' : 'Save API Keys'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove API keys?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all stored credentials for{' '}
              <strong>{deleteTarget}</strong>. You will need to re-enter them to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-api-key"
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteKeys(deleteTarget)}
            >
              Remove Keys
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}