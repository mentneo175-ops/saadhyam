import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useSidebar } from "@/contexts/SidebarContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
}

export function ResponsiveFeatureHeader() {
  const { user } = useAuth();
  const { toggleMobileMenu, isMobileMenuOpen } = useSidebar();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
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
        });
      }
    }
  };

  const displayName = isHydrated 
    ? businessProfile?.business_name || user?.name || "Business"
    : "Business";

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-4">
      {/* Hamburger Menu - LEFT */}
      <button
        onClick={toggleMobileMenu}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Business Name - CENTER */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-white font-semibold text-sm">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{businessProfile?.business_type || "Business"}</span>
        </div>
      </div>

      {/* Theme Toggle - RIGHT */}
      <ThemeToggle />
    </div>
  );
}
