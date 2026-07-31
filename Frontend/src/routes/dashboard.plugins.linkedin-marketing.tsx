import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/plugins/linkedin-marketing")({
  component: () => <Outlet />,
});
