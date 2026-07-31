import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/plugins/email-assistant")({
  component: () => <Outlet />,
});
