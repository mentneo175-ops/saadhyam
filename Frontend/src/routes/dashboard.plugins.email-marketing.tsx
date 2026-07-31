import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/plugins/email-marketing")({
  component: () => <Outlet />,
});
