import { createFileRoute } from "@tanstack/react-router";
import { PluginMarketplaceNew } from "@/components/plugins/PluginMarketplaceNew";

export const Route = createFileRoute("/dashboard/plugins")({
  head: () => ({ meta: [{ title: "Plugin Marketplace — Saadhyam AI" }] }),
  component: PluginsPage,
});

function PluginsPage() {
  return (
    <div className="container mx-auto p-6">
      <PluginMarketplaceNew />
    </div>
  );
}
