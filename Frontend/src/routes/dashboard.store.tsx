import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/store")({
  component: StoreLayout,
});

function StoreLayout() {
  return <Outlet />;
}