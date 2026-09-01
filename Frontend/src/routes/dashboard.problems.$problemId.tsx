import { createFileRoute } from "@tanstack/react-router";
import { ProblemDetailView } from "@/components/problems/ProblemDetailView";

export const Route = createFileRoute("/dashboard/problems/$problemId")({
  head: () => ({ meta: [{ title: "Problem Investigation — Saadhyam AI" }] }),
  component: ProblemDetailPage,
});

function ProblemDetailPage() {
  const { problemId } = Route.useParams();
  return <ProblemDetailView problemId={parseInt(problemId, 10)} />;
}
