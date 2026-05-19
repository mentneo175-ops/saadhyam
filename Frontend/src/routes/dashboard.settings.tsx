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
  Crown,
  Zap,
  Lock,
  Key,
  Palette,
  Target,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

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
      if (!token) {
        setInitialLoading(false);
        return;
      }

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
          // Update user settings from profile data with safe defaults
          setSettings({
            full_name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            timezone: "Asia/Kolkata (IST)",
            business_name: profileData.business_profile?.business_name || "",
            industry: profileData.business_profile?.business_type || "",
            business_location: profileData.business_profile?.business_location || "",
            description: profileData.business_profile?.business_description || "",
            brand_voice: "",
            target_audience: "",
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
      // Set default values on error
      setSettings({
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
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    } finally {
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
      <div className="min-h-screen bg-gradient-to-br from-violet-50/40 via-white to-purple-50/30 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-purple-600 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Settings</h3>
              <p className="text-sm text-gray-600">Preparing your account preferences...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-purple-50/40"
    >
      {/* Premium Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-purple-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">Manage your account and preferences</p>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="h-10 px-6 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 rounded-xl font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT AREA - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Profile Section */}
            <motion.div
              variants={cardVariants}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-purple-100/50 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500"
            >
              <div className="px-8 py-6 border-b border-purple-50/80 bg-gradient-to-r from-purple-50/30 via-transparent to-fuchsia-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/30">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Account Profile</h2>
                    <p className="text-sm text-gray-600">Your personal information</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Profile Header with Avatar */}
                <div className="flex items-start gap-6 pb-8 border-b border-purple-50/80">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
                      <span className="text-2xl font-bold text-white">
                        {settings.full_name ? settings.full_name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-2 bg-white rounded-xl shadow-xl border-2 border-purple-100 hover:bg-purple-50 hover:border-purple-300 hover:scale-110 transition-all duration-200">
                      <Camera size={14} className="text-purple-600" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{settings.full_name || "Your Name"}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{settings.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 px-3 py-1.5 rounded-lg font-semibold border border-purple-200/60 shadow-sm">
                        <Crown size={11} />
                        Free Plan
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold border border-emerald-200/60 shadow-sm">
                        <CheckCircle size={11} />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal Information Form */}
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User size={14} className="text-purple-600" />
                        Full Name
                      </Label>
                      <Input
                        value={settings.full_name}
                        onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        className="h-11 rounded-xl border-purple-100/60 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail size={14} className="text-purple-600" />
                        Email Address
                      </Label>
                      <Input
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        placeholder="your@email.com"
                        className="h-11 rounded-xl border-purple-100/60 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-200"
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Phone size={14} className="text-purple-600" />
                        Phone Number
                      </Label>
                      <Input
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="h-11 rounded-xl border-purple-100/60 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Globe size={14} className="text-purple-600" />
                        Timezone
                      </Label>
                      <Input
                        value={settings.timezone}
                        className="h-11 rounded-xl border-purple-100/60 bg-gradient-to-r from-gray-50 to-purple-50/30 text-gray-600 shadow-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Business Information Section */}
            <motion.div
              variants={cardVariants}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-purple-100/50 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-purple-50/80 bg-gradient-to-r from-purple-50/30 via-transparent to-fuchsia-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/30">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Business Information</h3>
                    <p className="text-sm text-gray-600">Your business details and profile</p>
                  </div>
                </div>
              </div>

              {/* Business Form */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 size={14} className="text-purple-600" />
                      Business Name
                    </Label>
                    <Input
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      placeholder="Your business name"
                      className="h-12 rounded-xl border-gray-200/60 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <ShoppingBag size={14} className="text-purple-600" />
                      Industry
                    </Label>
                    <Input
                      value={settings.industry}
                      onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                      placeholder="e.g., Restaurant, Retail"
                      className="h-12 rounded-xl border-gray-200/60 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2.5 md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin size={14} className="text-purple-600" />
                      Location
                    </Label>
                    <Input
                      value={settings.business_location || ""}
                      onChange={(e) => setSettings({ ...settings, business_location: e.target.value })}
                      placeholder="City, State, Country"
                      className="h-12 rounded-xl border-gray-200/60 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2.5 md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-700">Business Description</Label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      placeholder="Describe your business, services, challenges, and goals..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all bg-white resize-none text-sm shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      {settings.description.length}/5,000 characters
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-700">Brand Voice</Label>
                    <Input
                      value={settings.brand_voice}
                      onChange={(e) => setSettings({ ...settings, brand_voice: e.target.value })}
                      placeholder="Warm, premium, playful"
                      className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-gray-700">Target Audience</Label>
                    <Input
                      value={settings.target_audience}
                      onChange={(e) => setSettings({ ...settings, target_audience: e.target.value })}
                      placeholder="Women 25-40, urban India"
                      className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Enhanced Info Banner */}
                <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Advanced Profile Editing
                      </p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Visit the{" "}
                        <a
                          href="/dashboard/business-details"
                          className="underline font-semibold hover:text-blue-900 transition-colors"
                        >
                          Business Details
                        </a>{" "}
                        page to import your profile from PDF, Voice, or Website.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR - Quick Actions & Integrations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions Card */}
            <motion.div
              variants={cardVariants}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-purple-100/50 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden sticky top-24"
            >
              <div className="px-6 py-5 border-b border-purple-50/80 bg-gradient-to-r from-purple-50/30 via-transparent to-fuchsia-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/30">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">Quick Actions</h3>
                    <p className="text-xs text-gray-600">Manage your account</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <Button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-purple-700 text-white shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save All Changes
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-11 border-2 border-purple-200/60 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-fuchsia-50 transition-all duration-300 rounded-xl font-medium text-sm shadow-sm hover:shadow-lg hover:scale-[1.02]"
                  onClick={() => (window.location.href = "/dashboard/business-details")}
                >
                  <Building2 size={16} className="mr-2" />
                  Edit Business Profile
                </Button>

                <Button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="w-full h-11 bg-gradient-to-r from-red-500 via-red-600 to-red-500 hover:from-red-600 hover:via-red-700 hover:to-red-600 text-white shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold text-sm"
                >
                  {logoutLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Integrations Card */}
            <motion.div
              variants={cardVariants}
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-purple-100/50 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-purple-50/80 bg-gradient-to-r from-purple-50/30 via-transparent to-fuchsia-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-purple-500/30">
                    <Globe size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">Integrations</h3>
                    <p className="text-xs text-gray-600">Connected services</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.name}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-purple-100/60 hover:border-purple-300/80 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-fuchsia-50/50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-lg hover:scale-[1.02]"
                        onClick={() => handleIntegrationClick(integration.name)}
                      >
                        <div
                          className={`h-12 w-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                        >
                          <integration.icon size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">
                            {integration.name}
                          </p>
                          <p className="text-xs text-gray-600">{integration.desc}</p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition-all duration-200 ${
                            integration.name === "Instagram" && instagramStatus.is_connected
                              ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60"
                              : integration.name === "WhatsApp Business" &&
                                whatsappStatus.is_connected
                              ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border border-gray-200/60"
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
                          <button className="p-1.5 hover:bg-purple-100/50 rounded-lg transition-all duration-200">
                            {expandedIntegration === "Instagram" ? (
                              <ChevronUp size={18} className="text-gray-600" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Instagram Settings - Expanded */}
                      {integration.name === "Instagram" &&
                        expandedIntegration === "Instagram" && (
                          <div className="mt-4 ml-16 p-6 rounded-2xl bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 border-2 border-purple-200/60 space-y-5 shadow-sm">
                            {!instagramStatus.is_connected && !instagramLoading ? (
                              <div className="space-y-4">
                                <div className="p-5 rounded-xl bg-amber-50 border-2 border-amber-200/60 shadow-sm">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                      <AlertCircle size={18} className="text-amber-700" />
                                    </div>
                                    <p className="text-sm font-bold text-amber-900">
                                      Instagram Not Connected
                                    </p>
                                  </div>
                                  <p className="text-xs text-amber-800 leading-relaxed ml-11">
                                    Connect your Instagram Business account to enable automation
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    size="sm"
                                    onClick={handleConnectInstagram}
                                    disabled={instagramLoading}
                                    className="h-11 bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-md"
                                  >
                                    <Instagram size={16} className="mr-2" />
                                    Connect Instagram
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleLoadInstagramData}
                                    disabled={instagramLoading}
                                    className="h-11 border-2"
                                  >
                                    Check Status
                                  </Button>
                                </div>
                              </div>
                            ) : instagramLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 size={20} className="animate-spin text-purple-600 mr-3" />
                                <span className="text-sm font-medium text-gray-700">Loading settings...</span>
                              </div>
                            ) : instagramStatus.is_connected ? (
                              <div className="space-y-5">
                                <div className="p-5 rounded-xl bg-emerald-50 border-2 border-emerald-200/60 shadow-sm">
                                  <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                      <CheckCircle size={18} className="text-emerald-700" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-900">
                                      Connected as @{instagramStatus.account_username}
                                    </p>
                                  </div>
                                  {instagramStatus.page_name && (
                                    <p className="text-xs text-emerald-800 ml-11">
                                      Page: {instagramStatus.page_name}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-bold text-sm text-gray-900 mb-4">
                                    Automation Settings
                                  </h4>

                                  <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-all shadow-sm">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        Enable Instagram Automation
                                      </p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Master switch for all features
                                      </p>
                                    </div>
                                    <Switch
                                      checked={instagramSettings.instagram_enabled}
                                      onCheckedChange={(checked) =>
                                        handleInstagramToggle("instagram_enabled", checked)
                                      }
                                      disabled={instagramLoading}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-all shadow-sm">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        Auto-publish Posts
                                      </p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Automatically publish scheduled posts
                                      </p>
                                    </div>
                                    <Switch
                                      checked={instagramSettings.instagram_auto_publish}
                                      onCheckedChange={(checked) =>
                                        handleInstagramToggle("instagram_auto_publish", checked)
                                      }
                                      disabled={
                                        instagramLoading || !instagramSettings.instagram_enabled
                                      }
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-all shadow-sm">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        Auto-reply to DMs
                                      </p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Respond to direct messages automatically
                                      </p>
                                    </div>
                                    <Switch
                                      checked={instagramSettings.instagram_auto_reply}
                                      onCheckedChange={(checked) =>
                                        handleInstagramToggle("instagram_auto_reply", checked)
                                      }
                                      disabled={
                                        instagramLoading || !instagramSettings.instagram_enabled
                                      }
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-all shadow-sm">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        Save as Drafts
                                      </p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Save posts as drafts by default
                                      </p>
                                    </div>
                                    <Switch
                                      checked={instagramSettings.instagram_save_drafts}
                                      onCheckedChange={(checked) =>
                                        handleInstagramToggle("instagram_save_drafts", checked)
                                      }
                                      disabled={instagramLoading}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-purple-200 transition-all shadow-sm">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        Auto-generate Captions
                                      </p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Use AI to automatically generate captions
                                      </p>
                                    </div>
                                    <Switch
                                      checked={instagramSettings.auto_generate_captions}
                                      onCheckedChange={(checked) =>
                                        handleInstagramToggle("auto_generate_captions", checked)
                                      }
                                      disabled={instagramLoading}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-sm text-gray-600">
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
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
