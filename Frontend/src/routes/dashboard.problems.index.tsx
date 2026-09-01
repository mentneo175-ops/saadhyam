import { createFileRoute } from "@tanstack/react-router";
import { ProblemsCommandCenter } from "@/components/problems/ProblemsCommandCenter";

export const Route = createFileRoute("/dashboard/problems/")({
  head: () => ({ meta: [{ title: "Problems Command Center — Saadhyam AI" }] }),
  component: ProblemsIndexPage,
});

function ProblemsIndexPage() {
  return <ProblemsCommandCenter />;
}
