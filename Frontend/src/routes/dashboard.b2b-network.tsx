import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { B2BNetwork } from "@/components/b2b-network/B2BNetwork";

export const Route = createFileRoute("/dashboard/b2b-network")({
  head: () => ({ meta: [{ title: "B2B Network — Saadhyam AI" }] }),
  component: B2BNetworkPage,
});

function B2BNetworkPage() {
  return (
    <div className="p-4 md:p-6 space-y-5 h-full">
      <PageHeader
        title="B2B Network"
        subtitle="Discover and connect with nearby businesses"
      />
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <B2BNetwork />
      </div>
    </div>
  );
}
