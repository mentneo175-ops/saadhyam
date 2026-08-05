import { createFileRoute } from "@tanstack/react-router";
import { Widget } from "@/components/plugins/live-chat-widget/Widget";

export const Route = createFileRoute("/live-chat/widget")({
  validateSearch: (search: Record<string, unknown>) => ({
    plugin_key: typeof search.plugin_key === "string" ? search.plugin_key : "",
  }),
  head: () => ({
    meta: [{ title: "Live Chat Support" }],
  }),
  component: WidgetRouteComponent,
});

function WidgetRouteComponent() {
  const { plugin_key } = Route.useSearch();

  if (!plugin_key) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4 text-sm text-destructive font-medium bg-transparent">
        Error: Missing plugin key
      </div>
    );
  }

  return <Widget pluginKey={plugin_key} />;
}
