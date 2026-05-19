import { createFileRoute } from "@tanstack/react-router";
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
  CheckCircle,
  AlertCircle,
  Building2,
  MapPin,
  User,
  Phone,
  Globe,
  Shield,
  Bell,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/AuthContext";
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
  // {
  //   name: "Shopify",
  //   desc: "Orders and customers",
  //   icon: ShoppingBag,
  //   color: "from-emerald-500 to-green-500",
  // },
];

function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const { logout } = useAuthContext();
  
  // Ref to track if Instagram status has been loaded
  const instagramStatusLoadedRef = useRef(false);

  // User settings
  const [settings, setSettings] = useState({
    full_name: "",
    email: "",
    phone: "",
    timezone: "Asia/Kolkata (IST)",
    business_name: "",
    industry: "",
    business_location: "",
    description: "",
    brand_voice: "",
    target_audience: "",
  });

  // Instagram state
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState({
    is_connected: false,
    account_username: null as string | null,
    page_name: null as string | null,
  });

  const [instagramSettings, setInstagramSettings] = useState({
    instagram_enabled: false,
    instagram_auto_publish: false,
    instagram_auto_reply: false,
    instagram_save_drafts: true,
    auto_generate_captions: false,
  });

  // WhatsApp state
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({
    is_connected: false,
    phone_number: null as string | null,
    business_name: null as string | null,
  });

  // Simple useEffect - no dependencies to avoid loops
  useEffect(() => {
    setMounted(true);
    
    // Load user settings on mount
    loadUserSettings();
    
    // Load WhatsApp status on mount
    loadWhatsAppStatus();
    
    // Check for Instagram OAuth success
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram") === "success") {
      toast.success("Instagram connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Add message listener for OAuth popup
    const handleOAuthMessage = (event: MessageEvent) => {
      // Only accept messages from our backend
      if (event.origin !== "http://localhost:8000") return;
      
      if (event.data.type === "INSTAGRAM_OAUTH_SUCCESS") {
        toast.success("Instagram connected successfully!");
        // Reload Instagram status after a short delay
        setTimeout(() => {
          loadInstagramStatus();
        }, 1000);
      } else if (event.data.type === "INSTAGRAM_OAUTH_ERROR") {
        toast.error(event.data.message || "Failed to connect Instagram");
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    
    // Cleanup
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []); // Empty dependency array

  const loadUserSettings = async () => {
    try {
      setInitialLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      if (!token) return;

      // Load user profile data
      const profileResponse = await fetch("http://localhost:8000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData) {
          // Update user settings from profile data
          setSettings({
            full_name: profileData.name || "",
            email: profileData.email || "",
            phone: "", // Not in profile, will need to add this field
            timezone: "Asia/Kolkata (IST)", // Default timezone
            business_name: profileData.business_profile?.business_name || "",
            industry: profileData.business_profile?.business_type || "",
            business_location: profileData.business_profile?.business_location || "",
            description: profileData.business_profile?.business_description || "",
            brand_voice: "", // Not in profile, will need to add this field
            target_audience: "", // Not in profile, will need to add this field
          });
        }
      } else {
        console.error("Failed to load user profile:", profileResponse.status);
      }

      // Also load settings data for additional fields
      const settingsResponse = await fetch("http://localhost:8000/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData) {
          // Update additional settings fields if they exist
          setSettings(prev => ({
            ...prev,
            // Add any additional fields from settings if available
          }));
        }
      }

    } catch (error) {
      console.error("Error loading user settings:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadInstagramStatus = async () => {
    // Prevent concurrent calls
    if (instagramLoading) {
      console.log("Instagram status already loading, skipping...");
      return;
    }
    
    try {
      setInstagramLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      
      if (!token) {
        console.log("No token found, skipping Instagram status load");
        setInstagramLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/settings/instagram/connection-status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mark as loaded
        instagramStatusLoadedRef.current = true;
        
        // Only update state if data has actually changed
        setInstagramStatus(prev => {
          const hasChanged = 
            prev.is_connected !== (data.is_connected || false) ||
            prev.account_username !== (data.account_username || null) ||
            prev.page_name !== (data.page_name || null);
          
          if (hasChanged) {
            return {
              is_connected: data.is_connected || false,
              account_username: data.account_username || null,
              page_name: data.page_name || null,
            };
          }
          return prev;
        });

        if (data.is_connected) {
          const settingsResponse = await fetch("http://localhost:8000/settings", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            if (settingsData?.instagram_automation) {
              setInstagramSettings(prev => {
                const newSettings = {
                  instagram_enabled: settingsData.instagram_automation.instagram_enabled || false,
                  instagram_auto_publish: settingsData.instagram_automation.instagram_auto_publish || false,
                  instagram_auto_reply: settingsData.instagram_automation.instagram_auto_reply || false,
                  instagram_save_drafts: settingsData.instagram_automation.instagram_save_drafts !== false,
                  auto_generate_captions: settingsData.posting_preferences?.auto_generate_captions || false,
                };
                
                // Only update if changed
                const hasChanged = JSON.stringify(prev) !== JSON.stringify(newSettings);
                return hasChanged ? newSettings : prev;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load Instagram status:", error);
    } finally {
      setInstagramLoading(false);
    }
  };

  const loadWhatsAppStatus = async () => {
    if (whatsappLoading) {
      console.log("WhatsApp status already loading, skipping...");
      return;
    }
    
    try {
      setWhatsappLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      
      if (!token) {
        console.log("No token found, skipping WhatsApp status load");
        setWhatsappLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/whatsapp/connection-status", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        setWhatsappStatus({
          is_connected: data.is_connected || false,
          phone_number: data.phone_number || null,
          business_name: data.business_name || null,
        });
      } else if (response.status === 404) {
        // Endpoint not available - silently set as not connected
        setWhatsappStatus({
          is_connected: false,
          phone_number: null,
          business_name: null,
        });
      }
    } catch (error) {
      console.error("Failed to load WhatsApp status:", error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (!token) {
        toast.error("Not logged in. Please login first.");
        return;
      }
      
      const oauthUrl = `http://localhost:8000/auth/instagram/connect?token=${token}`;
      const popup = window.open(oauthUrl, 'instagram-oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        toast.error("Popup blocked. Please allow popups and try again.");
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            loadInstagramStatus();
          }, 1000);
        }
      }, 1000);

      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Error connecting Instagram:", error);
      toast.error("Failed to connect Instagram");
    }
  };

  const handleInstagramToggle = async (key: string, value: boolean) => {
    if (instagramLoading) return;

    const previousSettings = { ...instagramSettings };
    
    try {
      setInstagramLoading(true);
      
      const newSettings = { ...instagramSettings, [key]: value };
      setInstagramSettings(newSettings);

      const token = localStorage.getItem("saadhyam_token");
      
      // Determine which endpoint to use based on the setting
      let endpoint = "http://localhost:8000/settings/instagram/automation";
      let requestBody: any = newSettings;
      
      if (key === "auto_generate_captions") {
        // Use posting preferences endpoint for auto-generate captions
        endpoint = "http://localhost:8000/settings/posting-preferences";
        requestBody = { auto_generate_captions: value };
      } else {
        // Use Instagram automation endpoint for other settings
        requestBody = {
          instagram_enabled: newSettings.instagram_enabled,
          instagram_auto_publish: newSettings.instagram_auto_publish,
          instagram_auto_reply: newSettings.instagram_auto_reply,
          instagram_save_drafts: newSettings.instagram_save_drafts,
        };
      }
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success("Settings updated!");
      } else {
        setInstagramSettings(previousSettings);
        toast.error("Failed to update settings");
      }
    } catch (error) {
      setInstagramSettings(previousSettings);
      console.error("Failed to update Instagram settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setInstagramLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("saadhyam_token");
      
      // Save business profile data
      const businessData = {
        business_name: settings.business_name,
        business_type: settings.industry, // Map industry to business_type
        business_location: "", // Not currently captured in UI
        business_description: settings.description,
      };

      const businessResponse = await fetch("http://localhost:8000/api/profile/business", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(businessData),
      });

      if (businessResponse.ok) {
        toast.success("Business settings saved successfully!");
      } else {
        console.error("Failed to save business settings:", businessResponse.status);
        toast.error("Failed to save some settings");
      }

      // Note: User profile fields (name, email, phone) would need a separate endpoint
      // For now, we'll just show success for business fields
      
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      // Redirect to login page after successful logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setLogoutLoading(false);
    }
  };

  const handleIntegrationClick = (integrationName: string) => {
    if (integrationName === "Instagram") {
      const isExpanding = expandedIntegration !== "Instagram";
      setExpandedIntegration(prev => prev === "Instagram" ? null : "Instagram");
      
      // Load Instagram status only when expanding and not already loaded
      if (isExpanding && !instagramStatusLoadedRef.current && !instagramLoading) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          loadInstagramStatus();
        }, 0);
      }
    }
  };

  const handleLoadInstagramData = () => {
    // Reset the loaded flag and reload
    instagramStatusLoadedRef.current = false;
    // Only call this when user explicitly wants to load Instagram data
    if (!instagramLoading) {
      loadInstagramStatus();
    }
  };

  if (!mounted || initialLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and integration preferences"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your account, business profile, and integration preferences"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Profile & Business (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 px-6 py-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <User size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Account Profile</h3>
                  <p className="text-sm text-muted-foreground">Your personal information</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/60">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {settings.full_name ? settings.full_name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border-2 border-card hover:bg-gray-50 transition-colors">
                    <Camera size={14} className="text-gray-600" />
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-xl">{settings.full_name || "Your Name"}</h3>
                  <p className="text-muted-foreground text-sm">{settings.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                      Free Plan
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle size={12} />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    Full name
                  </Label>
                  <Input
                    value={settings.full_name}
                    onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                    placeholder="Your full name"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="your@email.com"
                    className="h-11 rounded-xl border-2"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground" />
                    Phone
                  </Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Globe size={14} className="text-muted-foreground" />
                    Timezone
                  </Label>
                  <Input
                    value={settings.timezone}
                    className="h-11 rounded-xl border-2 bg-muted/30"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-6 py-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Building2 size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Business Information</h3>
                  <p className="text-sm text-muted-foreground">Your business details and profile</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building2 size={14} className="text-muted-foreground" />
                    Business name
                  </Label>
                  <Input
                    value={settings.business_name}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                    placeholder="Your business name"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ShoppingBag size={14} className="text-muted-foreground" />
                    Industry
                  </Label>
                  <Input
                    value={settings.industry}
                    onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                    placeholder="e.g., Restaurant, Retail"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin size={14} className="text-muted-foreground" />
                    Location
                  </Label>
                  <Input
                    value={settings.business_location || ""}
                    onChange={(e) => setSettings({ ...settings, business_location: e.target.value })}
                    placeholder="City, State, Country"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Business description</Label>
                  <div className="relative">
                    <textarea
                      value={settings.description}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      placeholder="Describe your business, services, challenges, and goals..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-background resize-none text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {settings.description.length}/5,000 characters
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Brand voice</Label>
                  <Input
                    value={settings.brand_voice}
                    onChange={(e) => setSettings({ ...settings, brand_voice: e.target.value })}
                    placeholder="Warm, premium, playful"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target audience</Label>
                  <Input
                    value={settings.target_audience}
                    onChange={(e) => setSettings({ ...settings, target_audience: e.target.value })}
                    placeholder="Women 25-40, urban India"
                    className="h-11 rounded-xl border-2"
                  />
                </div>
              </div>
              
              {/* Note about editing */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Need to update your business profile?</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Visit the <a href="/dashboard/business-details" className="underline font-medium">Business Details</a> page to edit your profile with advanced import options (PDF, Voice, Website).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Quick Actions & Integrations (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 px-6 py-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Shield size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Actions</h3>
                  <p className="text-xs text-muted-foreground">Account management</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 hover:from-purple-600 hover:via-purple-700 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Save All Changes
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-2"
                onClick={() => window.location.href = "/dashboard/business-details"}
              >
                <Building2 size={16} className="mr-2" />
                Edit Business Profile
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full"
              >
                {logoutLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <LogOut size={16} className="mr-2" />
                )}
                Logout
              </Button>
            </div>
          </div>

          {/* Upgrade to Pro Card */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-[#5D2F8F] to-[#A855F7]">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Upgrade to Pro</h3>
                  <p className="text-xs text-white/80">Unlock premium features</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle size={14} className="text-white flex-shrink-0" />
                  <p className="text-sm">Unlimited AI generations</p>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle size={14} className="text-white flex-shrink-0" />
                  <p className="text-sm">Advanced analytics & insights</p>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle size={14} className="text-white flex-shrink-0" />
                  <p className="text-sm">Priority support</p>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle size={14} className="text-white flex-shrink-0" />
                  <p className="text-sm">Custom integrations</p>
                </div>
              </div>
              
              <Button className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg">
                <CreditCard size={16} className="mr-2" />
                Upgrade Now
              </Button>
              
              <p className="text-xs text-white/70 text-center mt-3">
                Starting at ₹999/month
              </p>
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 via-fuchsia-50 to-purple-50 px-6 py-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Globe size={18} className="text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Integrations</h3>
                  <p className="text-xs text-muted-foreground">Connected services</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name}>
              <div
                className="flex items-center gap-4 p-3 rounded-xl border border-border/60 hover:bg-muted/30 transition cursor-pointer"
                onClick={() => handleIntegrationClick(integration.name)}
              >
                <div
                  className={`h-10 w-10 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center shrink-0`}
                >
                  <integration.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">{integration.desc}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    integration.name === "Instagram" && instagramStatus.is_connected
                      ? "bg-success/15 text-success"
                      : integration.name === "WhatsApp Business" && whatsappStatus.is_connected
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {integration.name === "Instagram"
                    ? instagramStatus.is_connected
                      ? "Connected"
                      : "Not connected"
                    : integration.name === "WhatsApp Business"
                    ? whatsappStatus.is_connected
                      ? "Connected"
                      : "Not Connected"
                    : "Not connected"}
                </span>
                {integration.name === "Instagram" && (
                  <button className="p-1">
                    {expandedIntegration === "Instagram" ? (
                      <ChevronUp size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>

              {/* Instagram Settings - Expanded */}
              {integration.name === "Instagram" && expandedIntegration === "Instagram" && (
                <div className="mt-3 ml-14 p-4 rounded-xl bg-muted/30 border border-border/40 space-y-4">
                  {!instagramStatus.is_connected && !instagramLoading ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-amber-600" />
                          <p className="text-sm font-medium text-amber-700">
                            Instagram not connected
                          </p>
                        </div>
                        <p className="text-xs text-amber-700/80 mt-1">
                          Connect your Instagram Business account to enable automation
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={handleConnectInstagram}
                          disabled={instagramLoading}
                        >
                          Connect Instagram
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={handleLoadInstagramData}
                          disabled={instagramLoading}
                        >
                          Check Status
                        </Button>
                      </div>
                    </div>
                  ) : instagramLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading settings...
                      </span>
                    </div>
                  ) : instagramStatus.is_connected ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-success" />
                          <p className="text-sm font-medium text-success">
                            Connected as @{instagramStatus.account_username}
                          </p>
                        </div>
                        {instagramStatus.page_name && (
                          <p className="text-xs text-success/80 mt-1">
                            Page: {instagramStatus.page_name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Automation Settings</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Enable Instagram Automation</p>
                            <p className="text-xs text-muted-foreground">Master switch for all features</p>
                          </div>
                          <Switch
                            checked={instagramSettings.instagram_enabled}
                            onCheckedChange={(checked) => handleInstagramToggle("instagram_enabled", checked)}
                            disabled={instagramLoading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Auto-publish Posts</p>
                            <p className="text-xs text-muted-foreground">Automatically publish scheduled posts</p>
                          </div>
                          <Switch
                            checked={instagramSettings.instagram_auto_publish}
                            onCheckedChange={(checked) => handleInstagramToggle("instagram_auto_publish", checked)}
                            disabled={instagramLoading || !instagramSettings.instagram_enabled}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Auto-reply to DMs</p>
                            <p className="text-xs text-muted-foreground">Respond to direct messages automatically</p>
                          </div>
                          <Switch
                            checked={instagramSettings.instagram_auto_reply}
                            onCheckedChange={(checked) => handleInstagramToggle("instagram_auto_reply", checked)}
                            disabled={instagramLoading || !instagramSettings.instagram_enabled}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Save as Drafts</p>
                            <p className="text-xs text-muted-foreground">Save posts as drafts by default</p>
                          </div>
                          <Switch
                            checked={instagramSettings.instagram_save_drafts}
                            onCheckedChange={(checked) => handleInstagramToggle("instagram_save_drafts", checked)}
                            disabled={instagramLoading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Auto-generate Captions</p>
                            <p className="text-xs text-muted-foreground">Use AI to automatically generate captions</p>
                          </div>
                          <Switch
                            checked={instagramSettings.auto_generate_captions}
                            onCheckedChange={(checked) => handleInstagramToggle("auto_generate_captions", checked)}
                            disabled={instagramLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Click "Check Status" to load Instagram settings</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}