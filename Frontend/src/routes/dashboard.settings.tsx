import { createFileRoute } from "@tanstack/react-router";
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
  Settings,
  Link2,
  Palette,
  ChevronRight,
  ExternalLink,
  Zap,
  Lock,
  Eye,
  Crown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { toast } from "sonner";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Saadhyam AI" }] }),
  component: SettingsPage,
});

const integrations = [
  {
    name: "Instagram",
    desc: "Post and analyze your content",
    icon: Instagram,
    gradient: "from-pink-500 via-rose-500 to-fuchsia-500",
    bgLight: "bg-pink-50",
    iconColor: "text-pink-600",
  },
  {
    name: "WhatsApp Business",
    desc: "Send and receive messages",
    icon: MessageCircle,
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    name: "Email (Gmail)",
    desc: "Campaigns and automations",
    icon: Mail,
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

type SettingsTab = "profile" | "business" | "integrations" | "preferences";

const tabs: { id: SettingsTab; label: string; icon: typeof User; desc: string }[] = [
  { id: "profile", label: "Profile", icon: User, desc: "Account information" },
  { id: "business", label: "Business", icon: Building2, desc: "Company details" },
  { id: "integrations", label: "Integrations", icon: Link2, desc: "Connected services" },
  { id: "preferences", label: "Preferences", icon: Palette, desc: "App settings" },
];

function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
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
      if (event.origin !== env.apiBaseUrl) return;

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
      const profileResponse = await fetch(`${env.apiBaseUrl}/api/profile`, {
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
      const settingsResponse = await fetch(`${env.apiBaseUrl}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData) {
          // Update additional settings fields if they exist
          setSettings((prev) => ({
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

      const response = await fetch(`${env.apiBaseUrl}/settings/instagram/connection-status`, {
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
        setInstagramStatus((prev) => {
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
          const settingsResponse = await fetch(`${env.apiBaseUrl}/settings`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            if (settingsData?.instagram_automation) {
              setInstagramSettings((prev) => {
                const newSettings = {
                  instagram_enabled: settingsData.instagram_automation.instagram_enabled || false,
                  instagram_auto_publish:
                    settingsData.instagram_automation.instagram_auto_publish || false,
                  instagram_auto_reply:
                    settingsData.instagram_automation.instagram_auto_reply || false,
                  instagram_save_drafts:
                    settingsData.instagram_automation.instagram_save_drafts !== false,
                  auto_generate_captions:
                    settingsData.posting_preferences?.auto_generate_captions || false,
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

      const response = await fetch(`${env.apiBaseUrl}/api/whatsapp/connection-status`, {
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

      const oauthUrl = `${env.apiBaseUrl}/auth/instagram/connect?token=${token}`;
      const popup = window.open(
        oauthUrl,
        "instagram-oauth",
        "width=600,height=700,scrollbars=yes,resizable=yes",
      );

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

      setTimeout(
        () => {
          if (!popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
        },
        5 * 60 * 1000,
      );
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
      let endpoint = `${env.apiBaseUrl}/settings/instagram/automation`;
      let requestBody: any = newSettings;

      if (key === "auto_generate_captions") {
        // Use posting preferences endpoint for auto-generate captions
        endpoint = `${env.apiBaseUrl}/settings/posting-preferences`;
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

      const businessResponse = await fetch(`${env.apiBaseUrl}/api/profile/business`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(businessData),
      });

      if (businessResponse.ok) {
        toast.success("Settings saved successfully!");
      } else {
        console.error("Failed to save business settings:", businessResponse.status);
        toast.error("Failed to save some settings");
      }
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

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      "This will permanently delete your account and all associated data. Type DELETE to confirm.",
    );

    if (confirmation !== "DELETE") {
      if (confirmation !== null) {
        toast.error("Delete account cancelled. Confirmation did not match.");
      }
      return;
    }

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch(`${env.apiBaseUrl}/api/profile/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let message = "Failed to delete account";
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch (error) {}
        throw new Error(message);
      }

      await logout();
      toast.success("Your account was deleted.");
      window.location.href = "/signup";
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setDeleteLoading(false);
    }
  };

  const handleIntegrationClick = (integrationName: string) => {
    if (integrationName === "Instagram") {
      const isExpanding = expandedIntegration !== "Instagram";
      setExpandedIntegration((prev) => (prev === "Instagram" ? null : "Instagram"));

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
      <div className="flex flex-1 bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Settings
                  size={28}
                  className="text-white animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
            </div>
            <p className="text-gray-700 font-semibold text-lg">Loading settings...</p>
            <p className="text-gray-400 text-sm mt-1">Preparing your preferences</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tab Content Renderers ─────────────────────────────────────────

  const renderProfileTab = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/40 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
        {/* Gradient Banner */}
        <div className="h-28 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTI0IDI0aDEydjJIMjR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-white/5 rounded-full" />
        </div>

        {/* Avatar + Info — avatar overlaps banner, text stays in white zone */}
        <div className="px-8 pb-6">
          {/* Avatar row — pulls up into the banner */}
          <div className="flex items-end gap-5 -mt-10">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30 border-4 border-white ring-2 ring-purple-100">
                <span className="text-2xl font-bold text-white">
                  {settings.full_name ? settings.full_name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-all duration-200 group-hover:scale-110">
                <Camera size={12} className="text-gray-600" />
              </button>
            </div>
            {/* Badges sit at the bottom of avatar — inside the white area */}
            <div className="flex items-center gap-2 pb-1">
              <span className="inline-flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                <Sparkles size={12} />
                Free Plan
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                <CheckCircle size={12} />
                Active
              </span>
            </div>
          </div>

          {/* Name + Email — fully in white area, never overlaps gradient */}
          <div className="mt-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {settings.full_name || "Your Name"}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5 truncate">{settings.email}</p>
          </div>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <User size={16} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <p className="text-xs text-gray-500">Update your personal details</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={13} className="text-gray-400" />
                Full name
              </Label>
              <Input
                value={settings.full_name}
                onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                placeholder="Your full name"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail size={13} className="text-gray-400" />
                Email
              </Label>
              <Input
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="your@email.com"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone size={13} className="text-gray-400" />
                Phone number
              </Label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe size={13} className="text-gray-400" />
                Timezone
              </Label>
              <Input
                value={settings.timezone}
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Shield size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Security</h3>
            <p className="text-xs text-gray-500">Protect your account</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Lock size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Password</p>
                <p className="text-xs text-gray-500">Last changed 30 days ago</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200 text-gray-700 hover:bg-white"
            >
              Change
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Shield size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Add an extra layer of security</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Business Details */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Building2 size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Business Details</h3>
              <p className="text-xs text-gray-500">Your company information</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-white"
            onClick={() => (window.location.href = "/dashboard/business-details")}
          >
            <ExternalLink size={14} className="mr-1.5" />
            Advanced Edit
          </Button>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 size={13} className="text-gray-400" />
                Business name
              </Label>
              <Input
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                placeholder="Your business name"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ShoppingBag size={13} className="text-gray-400" />
                Industry
              </Label>
              <Input
                value={settings.industry}
                onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                placeholder="e.g., Restaurant, Retail, SaaS"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin size={13} className="text-gray-400" />
                Business location
              </Label>
              <Input
                value={settings.business_location || ""}
                onChange={(e) => setSettings({ ...settings, business_location: e.target.value })}
                placeholder="City, State, Country"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Business description</Label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                placeholder="Describe your business, services, challenges, and goals..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-50 outline-none transition-all duration-200 bg-white resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-gray-400">
                {settings.description.length}/5,000 characters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-fuchsia-100 rounded-xl">
            <Palette size={16} className="text-fuchsia-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Brand Identity</h3>
            <p className="text-xs text-gray-500">Define how your brand communicates</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Brand voice</Label>
              <Input
                value={settings.brand_voice}
                onChange={(e) => setSettings({ ...settings, brand_voice: e.target.value })}
                placeholder="e.g., Warm, premium, playful"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
              <p className="text-xs text-gray-400">Helps AI generate content in your tone</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Target audience</Label>
              <Input
                value={settings.target_audience}
                onChange={(e) => setSettings({ ...settings, target_audience: e.target.value })}
                placeholder="e.g., Women 25-40, urban India"
                className="h-11 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-100 transition-all"
              />
              <p className="text-xs text-gray-400">Personalizes recommendations for your market</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Card */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 border border-purple-100 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-white rounded-xl shadow-sm shrink-0">
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Power up your business profile</p>
            <p className="text-xs text-purple-700/80 mt-1 leading-relaxed">
              Visit the{" "}
              <a
                href="/dashboard/business-details"
                className="underline font-semibold hover:text-purple-800 transition-colors"
              >
                Business Details
              </a>{" "}
              page for advanced import options including PDF upload, voice input, and website
              scanning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Integration Cards */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div
              className="flex items-center gap-4 p-5 cursor-pointer"
              onClick={() => handleIntegrationClick(integration.name)}
            >
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${integration.gradient} flex items-center justify-center shrink-0 shadow-lg`}
              >
                <integration.icon size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{integration.name}</p>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                      integration.name === "Instagram" && instagramStatus.is_connected
                        ? "bg-emerald-100 text-emerald-700"
                        : integration.name === "WhatsApp Business" && whatsappStatus.is_connected
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {integration.name === "Instagram"
                      ? instagramStatus.is_connected
                        ? "● Connected"
                        : "Not connected"
                      : integration.name === "WhatsApp Business"
                        ? whatsappStatus.is_connected
                          ? "● Connected"
                          : "Not Connected"
                        : "Not connected"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{integration.desc}</p>
              </div>
              {integration.name === "Instagram" && (
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  {expandedIntegration === "Instagram" ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </button>
              )}
            </div>

            {/* Instagram Settings - Expanded */}
            {integration.name === "Instagram" && expandedIntegration === "Instagram" && (
              <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                {!instagramStatus.is_connected && !instagramLoading ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-amber-600" />
                        <p className="text-sm font-semibold text-amber-800">
                          Instagram not connected
                        </p>
                      </div>
                      <p className="text-xs text-amber-700/80 mt-1.5 ml-7">
                        Connect your Instagram Business account to enable content posting and
                        analytics automation.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/20 rounded-xl"
                        onClick={handleConnectInstagram}
                        disabled={instagramLoading}
                      >
                        <Instagram size={14} className="mr-1.5" />
                        Connect Instagram
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-gray-200"
                        onClick={handleLoadInstagramData}
                        disabled={instagramLoading}
                      >
                        Check Status
                      </Button>
                    </div>
                  </div>
                ) : instagramLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-purple-500" />
                    <span className="ml-2.5 text-sm text-gray-500">Loading settings...</span>
                  </div>
                ) : instagramStatus.is_connected ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/60">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle size={18} className="text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-800">
                          Connected as @{instagramStatus.account_username}
                        </p>
                      </div>
                      {instagramStatus.page_name && (
                        <p className="text-xs text-emerald-600 mt-1 ml-7">
                          Page: {instagramStatus.page_name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3">
                        Automation Settings
                      </h4>

                      {[
                        {
                          key: "instagram_enabled",
                          label: "Enable Instagram Automation",
                          desc: "Master switch for all features",
                          icon: Zap,
                          alwaysEnabled: true,
                        },
                        {
                          key: "instagram_auto_publish",
                          label: "Auto-publish Posts",
                          desc: "Automatically publish scheduled posts",
                          icon: Instagram,
                          alwaysEnabled: false,
                        },
                        {
                          key: "instagram_auto_reply",
                          label: "Auto-reply to DMs",
                          desc: "Respond to direct messages automatically",
                          icon: MessageCircle,
                          alwaysEnabled: false,
                        },
                        {
                          key: "instagram_save_drafts",
                          label: "Save as Drafts",
                          desc: "Save posts as drafts by default",
                          icon: Eye,
                          alwaysEnabled: true,
                        },
                        {
                          key: "auto_generate_captions",
                          label: "Auto-generate Captions",
                          desc: "Use AI to generate captions automatically",
                          icon: Sparkles,
                          alwaysEnabled: true,
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                              <item.icon size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.label}</p>
                              <p className="text-xs text-gray-400">{item.desc}</p>
                            </div>
                          </div>
                          <Switch
                            checked={instagramSettings[item.key as keyof typeof instagramSettings]}
                            onCheckedChange={(checked) => handleInstagramToggle(item.key, checked)}
                            disabled={
                              instagramLoading ||
                              (!item.alwaysEnabled && !instagramSettings.instagram_enabled)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">
                      Click "Check Status" to load Instagram settings
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Bell size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-xs text-gray-500">Manage how you receive updates</p>
          </div>
        </div>
        <div className="p-6 space-y-1">
          {[
            {
              label: "Email notifications",
              desc: "Receive important updates via email",
              enabled: true,
            },
            {
              label: "Push notifications",
              desc: "Browser push notifications for real-time alerts",
              enabled: false,
            },
            {
              label: "Weekly report",
              desc: "Get a summary of your business performance",
              enabled: true,
            },
            { label: "Marketing tips", desc: "AI-generated marketing suggestions", enabled: true },
          ].map((pref, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                <p className="text-xs text-gray-400">{pref.desc}</p>
              </div>
              <Switch defaultChecked={pref.enabled} />
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200/60 shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <AlertCircle size={16} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
            <p className="text-xs text-red-500">Irreversible actions</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 border border-red-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete account</p>
              <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
            </div>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              variant="outline"
              size="sm"
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              {deleteLoading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-1 bg-white">
      <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your account, business profile, and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 rounded-xl transition-all duration-300"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="rounded-xl border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
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
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <div className="space-y-3">
            {/* Tab Navigation */}
            <nav className="bg-white rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-100/50 overflow-hidden p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group mb-1 last:mb-0 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25"
                        : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive ? "text-white" : "text-gray-400 group-hover:text-purple-500"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isActive ? "text-white" : ""}`}>
                        {tab.label}
                      </p>
                      <p className={`text-[11px] ${isActive ? "text-white/70" : "text-gray-400"}`}>
                        {tab.desc}
                      </p>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-white/70" />}
                  </button>
                );
              })}
            </nav>

            {/* Upgrade Card */}
            <div className="bg-gradient-to-br from-[#5D2F8F] via-purple-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-xl shadow-purple-500/25 overflow-hidden relative">
              {/* Decorative element */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-sm" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Go Pro</h3>
                    <p className="text-[11px] text-white/60">Unlock everything</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {["Unlimited AI generations", "Advanced analytics", "Priority support"].map(
                    (feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-white/80 shrink-0" />
                        <p className="text-xs text-white/80">{feature}</p>
                      </div>
                    ),
                  )}
                </div>

                <Button className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-lg rounded-xl h-10">
                  <CreditCard size={14} className="mr-2" />
                  Upgrade — ₹999/mo
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-w-0">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "business" && renderBusinessTab()}
            {activeTab === "integrations" && renderIntegrationsTab()}
            {activeTab === "preferences" && renderPreferencesTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
