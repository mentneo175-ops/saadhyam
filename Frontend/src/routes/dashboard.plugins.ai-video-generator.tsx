import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/plugins/ai-video-generator")({
  component: () => <Outlet />,
});
