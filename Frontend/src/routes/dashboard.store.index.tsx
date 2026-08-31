import { createFileRoute } from "@tanstack/react-router";
import { StoreView } from "@/components/store/StoreView";

export const Route = createFileRoute("/dashboard/store/")({
  head: () => ({ meta: [{ title: "Store ΓÇö Saadhyam AI" }] }),
  component: StoreIndexPage,
});

function StoreIndexPage() {
  return <StoreView />;
}