import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/blogs")({
  beforeLoad: () => {
    // Redirect to AEO & GEO page Content tab
    throw redirect({
      to: "/dashboard/aeo-geo",
      replace: true,
    });
  },
});
