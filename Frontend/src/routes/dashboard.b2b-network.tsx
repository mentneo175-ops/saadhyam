import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { B2BNetwork } from "@/components/b2b-network/B2BNetwork";

export const Route = createFileRoute("/dashboard/b2b-network")({
  head: () => ({ meta: [{ title: "B2B Network — Saadhyam AI" }] }),
  component: B2BNetworkPage,
});

function B2BNetworkPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6">
        <PageHeader
          title="B2B Network"
          subtitle="Discover and connect with nearby businesses"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <B2BNetwork />
      </div>
    </div>
  );
}
