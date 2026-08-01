import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/plugins/google-ads")({
  component: () => <Outlet />,
});
