import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/agents")({
  component: AgentsLayout,
});

function AgentsLayout() {
  return <Outlet />;
}
