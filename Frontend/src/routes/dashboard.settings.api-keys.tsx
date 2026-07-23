import { createFileRoute } from "@tanstack/react-router";
import { ApiKeysManager } from "@/components/settings/ApiKeysManager";

export const Route = createFileRoute("/dashboard/settings/api-keys")({
  head: () => ({ meta: [{ title: "API Keys — Saadhyam AI" }] }),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  return (
    <div className="container mx-auto py-6">
      <ApiKeysManager />
    </div>
  );
}