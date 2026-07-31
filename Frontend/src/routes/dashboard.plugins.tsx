import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/plugins")({
  component: PluginsLayout,
});

function PluginsLayout() {
  return <Outlet />;
}
