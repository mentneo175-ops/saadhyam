import { createFileRoute } from "@tanstack/react-router";
// import { createFileRoute } from "@tantml:router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Camera,
  Save,
  Instagram,
  MessageCircle,
  Mail,
  ShoppingBag,
  Loader2,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Saadhyam AI" }] }),
  component: SettingsPage,
});

const integrations = [
  {
    name: "Instagram",
    desc: "Post and analyze",
    icon: Instagram,
    color: "from-pink-500 to-fuchsia-500",
  },
  {
    name: "WhatsApp Business",
    desc: "Send and receive messages",
    icon: MessageCircle,
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Email (Gmail)",
    desc: "Campaigns and automations",
    icon: Mail,
    color: "from-blue-500 to-indigo-500",
  },
  {
    name: "Shopify",
    desc: "Orders and customers",
    icon: ShoppingBag,
    color: "from-emerald-500 to-green-500",
  },
];

function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [instagramConnectionLoading, setInstagramConnectionLoading] = useState(false);
  const { logout } = useAuthContext();
  const router = useRouter();
  const [instagramStatus, setInstagramStatus] = useState({
    is_connected: false,
    account_username: null as string | null,
    automation_enabled: false,
    auto_publish_enabled: false,
    last_post_time: null as string | null,
  });
  const [instagramSettings, setInstagramSettings] = useState({
    instagram_enabled: false,
    instagram_auto_publish: false,
    instagram_auto_reply: false,
    instagram_save_drafts: true,
  });
  const [postingPreferences, setPostingPreferences] = useState({
    preferred_posting_time: "09:00",
    posting_frequency: "daily",
    auto_generate_captions: false,
    weekly_day: "monday",
    custom_date: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    notify_on_post: true,
    notify_on_engagement: true,
    notify_on_error: true,
  });
  const [settings, setSettings] = useState({
    full_name: "",
    email: "",
    phone: "",
    timezone: "Asia/Kolkata (IST)",
    business_name: "",
    industry: "",
    description: "",
    brand_voice: "",
    target_audience: "",
  });

  useEffect(() => {
    setMounted(true);
    loadSettings();
    loadInstagramStatus();

    // Check if user just returned from Instagram OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram") === "success") {
      toast.success("Instagram connected successfully!");
      // Reload Instagram status
      setTimeout(() => {
        loadInstagramStatus();
      }, 1000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.getSettings();
      if (response.success && response.settings) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const loadInstagramStatus = async () => {
    try {
      setInstagramConnectionLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch("http://localhost:8000/settings/instagram/connection-status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setInstagramStatus(data);

      // Load automation settings
      const settingsResponse = await fetch("http://localhost:8000/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const settingsData = await settingsResponse.json();
      if (settingsData) {
        setInstagramSettings({
          instagram_enabled: settingsData.instagram_automation?.instagram_enabled || false,
          instagram_auto_publish:
            settingsData.instagram_automation?.instagram_auto_publish || false,
          instagram_auto_reply: settingsData.instagram_automation?.instagram_auto_reply || false,
          instagram_save_drafts: settingsData.instagram_automation?.instagram_save_drafts || true,
        });
        setPostingPreferences({
          preferred_posting_time:
            settingsData.posting_preferences?.preferred_posting_time || "09:00",
          posting_frequency: settingsData.posting_preferences?.posting_frequency || "daily",
          auto_generate_captions: settingsData.posting_preferences?.auto_generate_captions || false,
          weekly_day: settingsData.posting_preferences?.weekly_day || "monday",
          custom_date: settingsData.posting_preferences?.custom_date || "",
        });
        setNotificationSettings({
          notify_on_post: settingsData.notification_settings?.notify_on_post || true,
          notify_on_engagement: settingsData.notification_settings?.notify_on_engagement || true,
          notify_on_error: settingsData.notification_settings?.notify_on_error || true,
        });
      }
    } catch (error) {
      console.error("Failed to load Instagram status:", error);
      toast.error("Failed to load Instagram settings");
    } finally {
      setInstagramConnectionLoading(false);
    }
  };

  const handleInstagramAutomationToggle = async (
    key: keyof typeof instagramSettings,
    value: boolean,
  ) => {
    try {
      setInstagramConnectionLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      const updatedSettings = { ...instagramSettings, [key]: value };

      const response = await fetch("http://localhost:8000/settings/instagram/automation", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();
      if (response.ok) {
        setInstagramSettings(updatedSettings);
        toast.success("Instagram automation settings updated!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Failed to update Instagram automation:", error);
      toast.error("Failed to update settings");
    } finally {
      setInstagramConnectionLoading(false);
    }
  };

  const handlePostingPreferencesChange = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch("http://localhost:8000/settings/posting-preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postingPreferences),
      });

      if (response.ok) {
        toast.success("Posting preferences updated!");
      } else {
        toast.error("Failed to update preferences");
      }
    } catch (error) {
      console.error("Failed to update posting preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch("http://localhost:8000/settings/notifications", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        toast.success("Notification settings updated!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Failed to update notifications:", error);
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllInstagramSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      // Save automation settings
      const automationResponse = await fetch("http://localhost:8000/settings/instagram/automation", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(instagramSettings),
      });

      // Save posting preferences
      const preferencesResponse = await fetch("http://localhost:8000/settings/posting-preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postingPreferences),
      });

      // Save notification settings
      const notificationsResponse = await fetch("http://localhost:8000/settings/notifications", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationSettings),
      });

      // Check if all requests were successful
      if (automationResponse.ok && preferencesResponse.ok && notificationsResponse.ok) {
        toast.success("All Instagram settings saved successfully!");
        // Reload Instagram status to reflect changes
        loadInstagramStatus();
      } else {
        toast.error("Some settings failed to save. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save Instagram settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (!token) {
        toast.error("Not logged in. Please login first.");
        return;
      }
      
      // Open Facebook OAuth in a new window/tab
      const oauthUrl = `http://localhost:8000/auth/instagram/connect?token=${token}`;
      
      // Open in new window
      const popup = window.open(
        oauthUrl,
        'instagram-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      // Listen for the popup to close or for a message from the popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Refresh the Instagram status when popup closes
          setTimeout(() => {
            loadInstagramStatus();
          }, 1000);
        }
      }, 1000);
      
      // Also listen for messages from the popup (if callback sends a message)
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'INSTAGRAM_OAUTH_SUCCESS') {
          popup?.close();
          clearInterval(checkClosed);
          toast.success("Instagram connected successfully!");
          loadInstagramStatus();
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'INSTAGRAM_OAUTH_ERROR') {
          popup?.close();
          clearInterval(checkClosed);
          toast.error("Failed to connect Instagram. Please try again.");
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'INSTAGRAM_OAUTH_RETRY') {
          popup?.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          // Retry the connection
          setTimeout(() => {
            handleConnectInstagram();
          }, 500);
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Clean up listener after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', messageListener);
      }, 300000);
      
    } catch (error) {
      console.error("Failed to initiate Instagram connection:", error);
      toast.error("Failed to connect Instagram");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiClient.updateSettings(settings);
      if (response.success) {
        toast.success("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      toast.success("Logged out successfully!");
      router.navigate({ to: "/login" });
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error("Failed to logout. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, business and integrations"
        actions={
          <Button variant="hero" size="sm" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save changes
              </>
            )}
          </Button>
        }
      />

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Profile</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {logoutLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Logging out...
              </>
            ) : (
              <>
                <LogOut size={14} /> Logout
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-brand text-white flex items-center justify-center text-2xl font-bold shadow-glow">
              {settings.full_name ? settings.full_name[0].toUpperCase() : "U"}
            </div>
            <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shadow-soft hover:bg-accent/40">
              <Camera size={13} />
            </button>
          </div>
          <div>
            <p className="font-semibold">{settings.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">Pro plan · Member since Jan 2024</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={settings.full_name}
              onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Business info */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6">
        <h3 className="font-semibold mb-4">Business info</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              placeholder="My Business"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input
              value={settings.industry}
              onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
              placeholder="Fashion & Lifestyle"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              placeholder="Describe your business..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand voice</Label>
            <Input
              value={settings.brand_voice}
              onChange={(e) => setSettings({ ...settings, brand_voice: e.target.value })}
              placeholder="Warm, premium, slightly playful"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Target audience</Label>
            <Input
              value={settings.target_audience}
              onChange={(e) => setSettings({ ...settings, target_audience: e.target.value })}
              placeholder="Women 25-40, urban India"
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6">
        <h3 className="font-semibold mb-4">Integrations</h3>
        <div className="space-y-3">
          {integrations.map((it) => (
            <div key={it.name}>
              <div
                className="flex items-center gap-4 p-3 rounded-xl border border-border/60 hover:bg-muted/30 transition cursor-pointer"
                onClick={() => {
                  if (it.name === "Instagram") {
                    setExpandedIntegration(
                      expandedIntegration === "Instagram" ? null : "Instagram",
                    );
                  }
                }}
              >
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${it.color} flex items-center justify-center shrink-0`}
                >
                  <it.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.desc}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    it.name === "Instagram" && instagramStatus.is_connected
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {it.name === "Instagram"
                    ? instagramStatus.is_connected
                      ? "Connected"
                      : "Not connected"
                    : it.name === "WhatsApp Business"
                      ? "Connected"
                      : it.name === "Email (Gmail)"
                        ? "Connected"
                        : "Not connected"}
                </span>
                {it.name === "Instagram" && (
                  <button className="p-1">
                    {expandedIntegration === "Instagram" ? (
                      <ChevronUp size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>

              {/* Instagram Automation Settings - Expanded */}
              {mounted && it.name === "Instagram" && expandedIntegration === "Instagram" && (
                <div className="mt-3 ml-14 p-4 rounded-xl bg-muted/30 border border-border/40 space-y-4">
                  {instagramConnectionLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading settings...
                      </span>
                    </div>
                  ) : (
                    <>
                      {instagramStatus.is_connected && (
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-sm font-medium text-success">
                            ✓ Connected as @{instagramStatus.account_username || "username"}
                          </p>
                          {instagramStatus.last_post_time && (
                            <p className="text-xs text-success/80 mt-1">
                              Last post:{" "}
                              {new Date(instagramStatus.last_post_time).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {!instagramStatus.is_connected && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <p className="text-sm font-medium text-amber-700">
                            ⚠️ Instagram not connected
                          </p>
                          <p className="text-xs text-amber-700/80 mt-1">
                            Connect your Instagram account to enable automation
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-8"
                            onClick={handleConnectInstagram}
                          >
                            Connect Instagram
                          </Button>
                        </div>
                      )}

                      {instagramStatus.is_connected && (
                        <>
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Automation Settings</h4>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                              <div>
                                <p className="text-sm font-medium">Enable Automation</p>
                                <p className="text-xs text-muted-foreground">
                                  Turn on all Instagram automation features
                                </p>
                              </div>
                              <Switch
                                checked={instagramSettings.instagram_enabled}
                                onCheckedChange={(checked) =>
                                  handleInstagramAutomationToggle("instagram_enabled", checked)
                                }
                                disabled={instagramConnectionLoading}
                              />
                            </div>

                            {instagramSettings.instagram_enabled && (
                              <>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                  <div>
                                    <p className="text-sm font-medium">Auto-Publish Posts</p>
                                    <p className="text-xs text-muted-foreground">
                                      Automatically publish scheduled posts
                                    </p>
                                  </div>
                                  <Switch
                                    checked={instagramSettings.instagram_auto_publish}
                                    onCheckedChange={(checked) =>
                                      handleInstagramAutomationToggle(
                                        "instagram_auto_publish",
                                        checked,
                                      )
                                    }
                                    disabled={instagramConnectionLoading}
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                  <div>
                                    <p className="text-sm font-medium">Auto-Reply to DMs</p>
                                    <p className="text-xs text-muted-foreground">
                                      Send automatic replies to new messages
                                    </p>
                                  </div>
                                  <Switch
                                    checked={instagramSettings.instagram_auto_reply}
                                    onCheckedChange={(checked) =>
                                      handleInstagramAutomationToggle(
                                        "instagram_auto_reply",
                                        checked,
                                      )
                                    }
                                    disabled={instagramConnectionLoading}
                                  />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                                  <div>
                                    <p className="text-sm font-medium">Save as Drafts</p>
                                    <p className="text-xs text-muted-foreground">
                                      Review before publishing
                                    </p>
                                  </div>
                                  <Switch
                                    checked={instagramSettings.instagram_save_drafts}
                                    onCheckedChange={(checked) =>
                                      handleInstagramAutomationToggle(
                                        "instagram_save_drafts",
                                        checked,
                                      )
                                    }
                                    disabled={instagramConnectionLoading}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Posting Schedule</h4>

                            <div className="space-y-2">
                              <Label className="text-xs">Preferred Posting Time</Label>
                              <Input
                                type="time"
                                value={postingPreferences.preferred_posting_time}
                                onChange={(e) =>
                                  setPostingPreferences({
                                    ...postingPreferences,
                                    preferred_posting_time: e.target.value,
                                  })
                                }
                                className="h-8 rounded-lg text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Posting Frequency</Label>
                              <select
                                value={postingPreferences.posting_frequency}
                                onChange={(e) =>
                                  setPostingPreferences({
                                    ...postingPreferences,
                                    posting_frequency: e.target.value,
                                  })
                                }
                                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            {/* Weekly Day Selector */}
                            {postingPreferences.posting_frequency === "weekly" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Select Day</Label>
                                <select
                                  value={postingPreferences.weekly_day || "monday"}
                                  onChange={(e) =>
                                    setPostingPreferences({
                                      ...postingPreferences,
                                      weekly_day: e.target.value,
                                    })
                                  }
                                  className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                                >
                                  <option value="monday">Monday</option>
                                  <option value="tuesday">Tuesday</option>
                                  <option value="wednesday">Wednesday</option>
                                  <option value="thursday">Thursday</option>
                                  <option value="friday">Friday</option>
                                  <option value="saturday">Saturday</option>
                                  <option value="sunday">Sunday</option>
                                </select>
                              </div>
                            )}

                            {/* Custom Date Selector */}
                            {postingPreferences.posting_frequency === "custom" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Custom Schedule</Label>
                                <Input
                                  type="date"
                                  value={postingPreferences.custom_date || ""}
                                  onChange={(e) =>
                                    setPostingPreferences({
                                      ...postingPreferences,
                                      custom_date: e.target.value,
                                    })
                                  }
                                  min={new Date().toISOString().split('T')[0]}
                                  className="h-8 rounded-lg text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Select a specific date for posting
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                              <div>
                                <p className="text-sm font-medium">AI Generated Captions</p>
                                <p className="text-xs text-muted-foreground">
                                  Auto-generate captions using AI
                                </p>
                              </div>
                              <Switch
                                checked={postingPreferences.auto_generate_captions}
                                onCheckedChange={(checked) =>
                                  setPostingPreferences({
                                    ...postingPreferences,
                                    auto_generate_captions: checked,
                                  })
                                }
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Notifications</h4>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                              <div>
                                <p className="text-sm font-medium">Notify on Post</p>
                                <p className="text-xs text-muted-foreground">
                                  When posts are published
                                </p>
                              </div>
                              <Switch
                                checked={notificationSettings.notify_on_post}
                                onCheckedChange={(checked) =>
                                  setNotificationSettings({
                                    ...notificationSettings,
                                    notify_on_post: checked,
                                  })
                                }
                                disabled={loading}
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                              <div>
                                <p className="text-sm font-medium">Engagement Alerts</p>
                                <p className="text-xs text-muted-foreground">
                                  Likes, comments, and follows
                                </p>
                              </div>
                              <Switch
                                checked={notificationSettings.notify_on_engagement}
                                onCheckedChange={(checked) =>
                                  setNotificationSettings({
                                    ...notificationSettings,
                                    notify_on_engagement: checked,
                                  })
                                }
                                disabled={loading}
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                              <div>
                                <p className="text-sm font-medium">Error Notifications</p>
                                <p className="text-xs text-muted-foreground">
                                  When automation encounters issues
                                </p>
                              </div>
                              <Switch
                                checked={notificationSettings.notify_on_error}
                                onCheckedChange={(checked) =>
                                  setNotificationSettings({
                                    ...notificationSettings,
                                    notify_on_error: checked,
                                  })
                                }
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Single Save Button for All Instagram Settings */}
                          <Button
                            size="sm"
                            onClick={handleSaveAllInstagramSettings}
                            disabled={loading}
                            className="w-full h-10 bg-gradient-primary text-primary-foreground hover:brightness-110"
                          >
                            {loading ? (
                              <>
                                <Loader2 size={16} className="animate-spin mr-2" />
                                Saving Instagram Settings...
                              </>
                            ) : (
                              <>
                                <Save size={16} className="mr-2" />
                                Save Instagram Settings
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
