import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";
import { DashboardProvider } from "@/contexts/DashboardContext";
import AssistantWidget from "@/components/AssistantWidget";
import { useState, useCallback } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Saadhyam AI" }],
  }),
  component: DashboardLayout,
  // No context needed here - we'll use DashboardProvider instead
});

function DashboardLayout() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Trigger a refresh by incrementing the counter
      setRefreshTrigger(prev => prev + 1);
      // Wait a bit for components to refresh
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <DashboardProvider 
      refreshDashboard={refreshDashboard} 
      isRefreshing={isRefreshing}
      refreshTrigger={refreshTrigger}
    >
      <div className="flex min-h-screen w-full bg-muted/30">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* AI Assistant Widget - Available on all dashboard pages */}
      <AssistantWidget />
    </DashboardProvider>
  );
}
