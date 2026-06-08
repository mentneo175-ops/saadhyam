import { Menu } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
  business_location?: string;
  business_description?: string;
  business_setup_completed: boolean;
}

function ResponsiveHeaderContent() {
  const location = useLocation();
  const { toggleMobileMenu } = useSidebar();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  // Check if we're on dashboard pages
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isLandingPage = location.pathname === "/" || location.pathname === "/main" || location.pathname === "/landing-admin";

  // Only show on non-dashboard pages, excluding the landing page, and mobile devices
  const shouldShow = !isDashboardPage && !isLandingPage && isMobile;

  useEffect(() => {
    if (shouldShow) {
      loadBusinessProfile();
    }
  }, [shouldShow]);

  const loadBusinessProfile = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const profile = await apiClient.getBusinessProfile();
        setBusinessProfile(profile);
      }
    } catch (error) {
      console.error("Failed to load business profile:", error);
      // Fallback to localStorage
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
    }
  };

  // Don't render if conditions aren't met
  if (!shouldShow) {
    return null;
  }

  // Get company name - prioritize business name, fallback to user name or default
  const getCompanyName = () => {
    if (businessProfile?.business_name) {
      return businessProfile.business_name;
    }
    if (user?.name) {
      return user.name;
    }
    return "Saadhyam AI";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Logo */}
        <div className="w-10 flex justify-start">
          <Logo size="sm" showText={false} />
        </div>

        {/* Center - Company name */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
            {getCompanyName()}
          </h1>
        </div>

        {/* Right side - Theme toggle + Hamburger menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function ResponsiveHeader() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Check if we're on dashboard pages
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isLandingPage = location.pathname === "/" || location.pathname === "/main" || location.pathname === "/landing-admin";

  // Only show on non-dashboard pages, excluding the landing page, and mobile devices
  const shouldShow = !isDashboardPage && !isLandingPage && isMobile;

  // Don't render if conditions aren't met
  if (!shouldShow) {
    return null;
  }

  // Wrap with SidebarProvider only for non-dashboard pages
  return (
    <SidebarProvider>
      <ResponsiveHeaderContent />
    </SidebarProvider>
  );
}
