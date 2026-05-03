import { Bell, ChevronDown, Sparkles, User, Building2, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
  business_location?: string;
  business_description?: string;
  business_setup_completed: boolean;
}

export function TopHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isHydrated, setIsHydrated] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [businessAnalysis, setBusinessAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);
      
      // Load business profile from API
      if (apiClient.isAuthenticated()) {
        const profile = await apiClient.getBusinessProfile();
        setBusinessProfile(profile);
        
        // Load latest business analysis from API
        try {
          const analysis = await apiClient.getLatestBusinessAnalysis();
          if (analysis) {
            setBusinessAnalysis(analysis);
          }
        } catch (analysisError) {
          console.error("Failed to load business analysis:", analysisError);
          // Fallback to localStorage for business analysis
          const localAnalysis = localStorage.getItem("businessAnalysis");
          if (localAnalysis) {
            setBusinessAnalysis(JSON.parse(localAnalysis));
          }
        }
      }
    } catch (error) {
      console.error("Failed to load business data:", error);
      // Fallback to localStorage for business info if API fails
      const info = localStorage.getItem("businessInfo");
      if (info) {
        const parsedInfo = JSON.parse(info);
        setBusinessProfile({
          business_name: parsedInfo.businessName,
          business_type: parsedInfo.businessType,
          business_location: parsedInfo.location,
          business_description: parsedInfo.description,
          business_setup_completed: true,
        });
      }
      
      // Fallback to localStorage for business analysis
      const analysis = localStorage.getItem("businessAnalysis");
      if (analysis) {
        setBusinessAnalysis(JSON.parse(analysis));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get greeting based on time of day
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 18) greeting = "Good afternoon";
  if (hour >= 18) greeting = "Good evening";

  // Get user name (extract first name if full name)
  const firstName = user?.name?.split(" ")[0] || "User";

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const displayName = isHydrated ? user?.name || "User" : "User";
  const displayEmail = isHydrated ? user?.email || "user@example.com" : "user@example.com";
  const initials = getInitials(displayName);

  return (
    <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 lg:px-8 gap-3">
      <div className="flex-1 justify-between">
        <div className="relative">
          {/* Business Greeting or Default Greeting */}
          {!isLoading && businessProfile?.business_setup_completed && businessProfile.business_name ? (
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                Welcome back, {businessProfile.business_name}! 👋
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-600">
                  {businessProfile.business_type} • {businessProfile.business_location}
                </p>
                {businessAnalysis && (
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-600" />
                    <p className="text-xs text-purple-700 font-medium">
                      AI Analysis Complete - {businessAnalysis.recommendations?.length || 0} recommendations ready
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                {greeting}, {isHydrated ? firstName : "User"} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here's what's happening with your business today.
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        aria-label="Notifications"
        className="relative h-10 w-10 rounded-xl border border-border hover:bg-accent/40 flex items-center justify-center transition"
      >
        <Bell size={18} />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
      </button>

      {/* Profile Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-full border border-border hover:bg-accent/40 transition"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-semibold">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{displayEmail}</p>
          </div>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        {/* Dropdown Menu */}
        {showProfileMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowProfileMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-12 z-50 w-64 bg-white rounded-lg border border-gray-200 shadow-lg py-2">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-600">{displayEmail}</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate({ to: "/dashboard/business-details" });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Building2 size={16} />
                  Business Details
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate({ to: "/dashboard/settings" });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
