import { Bell, ChevronDown, Sparkles, Building2, Settings, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useNavigate, useRouter, useLocation } from "@tanstack/react-router";
import { useDashboardContext } from "@/contexts/DashboardContext";

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
  const router = useRouter();
  const location = useLocation();
  const { refreshDashboard, isRefreshing: contextRefreshing } = useDashboardContext();
  const [isHydrated, setIsHydrated] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [businessAnalysis, setBusinessAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLocalRefreshing, setIsLocalRefreshing] = useState(false);

  const isRefreshing = contextRefreshing || isLocalRefreshing;

  // Only show TopHeader on the main dashboard page
  const isMainDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  useEffect(() => {
    setIsHydrated(true);
    if (isMainDashboard) {
      loadBusinessData();
    }
  }, [isMainDashboard]);
  
  // Don't render if not on main dashboard
  if (!isMainDashboard) {
    return null;
  }

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
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleRefresh = async () => {
    setIsLocalRefreshing(true);
    try {
      // Reload TopHeader's business data
      await loadBusinessData();
      // Trigger dashboard-wide refresh via context
      await refreshDashboard();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsLocalRefreshing(false);
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
    <header className="h-12 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-2.5 lg:px-4 gap-2">
      <div className="flex-1 justify-between">
        <div className="relative">
          {/* Business Greeting or Default Greeting */}
          {!isLoading && businessProfile?.business_setup_completed && businessProfile.business_name ? (
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-gray-900">
                Welcome back, {businessProfile.business_name}! 👋
              </h1>
              <div className="flex items-center gap-2.5 mt-0.5">
                <p className="text-[11px] text-gray-600">
                  {businessProfile.business_type} • {businessProfile.business_location}
                </p>
                {businessAnalysis && (
                  <div className="flex items-center gap-1">
                    <Sparkles size={10} className="text-purple-600" />
                    <p className="text-[11px] text-purple-700 font-medium">
                      AI Analysis Complete - {businessAnalysis.recommendations?.length || 0} recommendations ready
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight">
                {greeting}, {isHydrated ? firstName : "User"} 👋
              </h1>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Here's what's happening with your business today.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        aria-label="Refresh Data"
        className="h-7 px-2 rounded-lg border border-border hover:bg-accent/40 flex items-center justify-center gap-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh all dashboard data"
      >
        <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
        <span className="hidden md:inline text-[11px] font-medium">Refresh</span>
      </button>

      <button
        aria-label="Notifications"
        className="relative h-7 w-7 rounded-lg border border-border hover:bg-accent/40 flex items-center justify-center transition"
      >
        <Bell size={14} />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-secondary ring-2 ring-background" />
      </button>

      {/* Profile Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-1 h-7 pl-0.5 pr-2 rounded-full border border-border hover:bg-accent/40 transition"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-brand text-white flex items-center justify-center text-[10px] font-bold">
            {initials}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-[11px] font-semibold">{displayName}</p>
            <p className="text-[9px] text-muted-foreground">{displayEmail}</p>
          </div>
          <ChevronDown size={10} className="text-muted-foreground" />
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
            <div className="absolute right-0 top-10 z-50 w-56 bg-white rounded-lg border border-gray-200 shadow-lg py-1.5">
              {/* User Info */}
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-600">{displayEmail}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate({ to: "/dashboard/business-details" });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Building2 size={14} />
                  Business Details
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate({ to: "/dashboard/settings" });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-1.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={14} />
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
