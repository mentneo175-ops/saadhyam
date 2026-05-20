import { useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

/**
 * Hook to preserve the current dashboard route when the page is refreshed
 * This prevents users from being redirected to /dashboard when refreshing
 * on pages like /dashboard/business-analysis
 * 
 * Safe for SSR - only uses sessionStorage on client side
 */
export function useRoutePreservation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Store current route in sessionStorage when it changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }

    try {
      const currentPath = location.pathname;
      
      // Don't store dashboard root paths - only specific feature routes
      if (currentPath !== "/dashboard" && currentPath !== "/dashboard/" && currentPath.startsWith("/dashboard")) {
        sessionStorage.setItem("lastDashboardRoute", currentPath);
        console.log("💾 Saved route:", currentPath);
      }
    } catch (error) {
      // Silently fail if sessionStorage is not available
      console.warn("Could not save route to sessionStorage:", error);
    }
  }, [location.pathname]);

  // This function can be called to restore the last route if needed
  const restoreLastRoute = () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return false;
      }

      const lastRoute = sessionStorage.getItem("lastDashboardRoute");
      if (lastRoute) {
        console.log("🔄 Restoring route:", lastRoute);
        navigate({ to: lastRoute as any, replace: true });
        return true;
      }
    } catch (error) {
      console.warn("Could not restore route from sessionStorage:", error);
    }
    return false;
  };

  return { restoreLastRoute };
}
