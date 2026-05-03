import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopHeader } from "@/components/dashboard/TopHeader";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Saadhyam AI" }],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
