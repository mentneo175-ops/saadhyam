import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { ResponsiveFeatureHeader } from "@/components/dashboard/ResponsiveFeatureHeader";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AssistantWidget from "@/components/AssistantWidget";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeatureDisabledBanner } from "@/components/FeatureDisabledBanner";
import { useRoutePreservation } from "@/hooks/useRoutePreservation";
import { useAuthContext } from "@/lib/AuthContext";
import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Saadhyam AI" }],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isLoading: isAuthLoading } = useAuthContext();

  // Preserve current route on page refresh
  useRoutePreservation();

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Trigger a refresh by incrementing the counter
      setRefreshTrigger((prev) => prev + 1);
      // Wait a bit for components to refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <DashboardProvider
          refreshDashboard={refreshDashboard}
          isRefreshing={isRefreshing}
          refreshTrigger={refreshTrigger}
        >
          <div className="flex min-h-screen w-full">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              <TopHeader />
              <ResponsiveFeatureHeader />
              <main className="flex-1 min-w-0 pt-14 lg:pt-0 relative">
                <Outlet />

                {/* Feature-blocked full-page overlay */}
                <FeatureDisabledBanner />

                {/* Subtle auth verification indicator - shows during page refresh */}
                {isAuthLoading && (
                  <div className="fixed top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-gray-200/50 z-40">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-xs text-gray-600 font-medium">Verifying...</span>
                  </div>
                )}
              </main>
            </div>
          </div>

          {/* AI Assistant Widget - Available on all dashboard pages */}
          <AssistantWidget />
        </DashboardProvider>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
