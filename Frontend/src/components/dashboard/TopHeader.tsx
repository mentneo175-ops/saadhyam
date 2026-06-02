import {
  ChevronDown,
  Sparkles,
  Building2,
  Settings,
  LogOut,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { apiClient } from "@/lib/api";
import { useNavigate, useRouter, useLocation } from "@tanstack/react-router";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationCenter } from "@/components/notifications";

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
  business_location?: string;
  business_description?: string;
  business_setup_completed: boolean;
}

export function TopHeader() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();
  const { refreshDashboard, isRefreshing: contextRefreshing } = useDashboardContext();
  const { toggleMinimized } = useSidebar();

  const [isHydrated, setIsHydrated] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [businessAnalysis, setBusinessAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLocalRefreshing, setIsLocalRefreshing] = useState(false);

  const isRefreshing = contextRefreshing || isLocalRefreshing;

  // Only show TopHeader on main dashboard page
  const isMainDashboard = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  useEffect(() => {
    setIsHydrated(true);
    loadBusinessData(); // Load data for all dashboard pages
  }, []);

  // Show on all dashboard pages

  const loadBusinessData = async () => {
    try {
      setIsLoading(true);

      // Load business profile from API
      if (apiClient.isAuthenticated?.()) {
        const profile = await apiClient.getBusinessProfile?.();
        if (profile) {
          setBusinessProfile(profile);
        }

        // Load latest business analysis from API
        try {
          const analysis = await apiClient.getLatestBusinessAnalysis?.();
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
      const stored = localStorage.getItem("businessProfile");
      if (stored) {
        try {
          setBusinessProfile(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored business profile");
        }
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
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always navigate to login, even if logout fails
      navigate({ to: "/login", replace: true });
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

  // Generate avatar letter from business name or user name
  const getAvatarLetter = () => {
    if (businessProfile?.business_name) {
      return businessProfile.business_name.charAt(0).toUpperCase();
    }
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  const displayName = isHydrated
    ? businessProfile?.business_name || user?.name || "Business"
    : "Business";
  const displayEmail = isHydrated ? user?.email || "user@example.com" : "user@example.com";
  const avatarLetter = getAvatarLetter();

  // Display business name in profile dropdown if available, otherwise user name
  const profileDisplayName = businessProfile?.business_name || user?.name || "User";
  const profileDisplaySubtext = businessProfile?.business_type || "E-commerce";

  // Only render on main dashboard page
  if (!isMainDashboard) {
    return null;
  }

  return (
    <header className="h-16 border-b border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 hidden lg:flex items-center justify-between px-4 lg:px-6">
      {/* Left: Greeting Message (Desktop Only) */}
      <div className="flex items-center">
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 17
                ? "Afternoon"
                : "Evening"}
            !
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back to your dashboard</p>
        </div>
      </div>

      {/* Center: Empty space */}
      <div className="flex-1"></div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh Data"
          className="h-9 px-3 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title="Refresh all dashboard data"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "animate-spin text-purple-600" : "text-purple-600"}
          />
          <span className="hidden lg:inline text-sm font-medium text-gray-900 dark:text-gray-100">Refresh</span>
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition min-w-0 shadow-sm"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5D2F8F] to-[#A855F7] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {avatarLetter}
            </div>
            <div className="hidden sm:block text-left leading-tight min-w-0 max-w-32">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profileDisplayName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{profileDisplaySubtext}</p>
            </div>
            <ChevronDown size={12} className="text-purple-600 shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />

              {/* Menu */}
              <div className="absolute right-0 top-12 z-50 w-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-2xl dark:shadow-black/40 py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#5D2F8F] to-[#A855F7] text-white flex items-center justify-center text-sm font-bold">
                      {avatarLetter}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{profileDisplayName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{profileDisplaySubtext}</p>
                      {businessProfile?.business_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{displayEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate({ to: "/dashboard/business-details" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                  >
                    <Building2 size={16} className="text-purple-600" />
                    Business Details
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate({ to: "/dashboard/settings" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                  >
                    <Settings size={16} className="text-purple-600" />
                    Settings & Preferences
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                  >
                    <LogOut size={16} className="text-red-600" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
