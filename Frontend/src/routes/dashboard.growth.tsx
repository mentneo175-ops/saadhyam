import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/growth")({
  head: () => ({ meta: [{ title: "Growth Plan — Saadhyam AI" }] }),
  component: GrowthPage,
});

const weeks = [
  {
    week: "Week 1 · Foundations",
    progress: 100,
    items: [
      { t: "Connect Instagram & WhatsApp accounts", done: true },
      { t: "Import customer list from Shopify", done: true },
      { t: "Set brand voice and target audience", done: true },
      { t: "Generate first 7 Instagram posts", done: true },
    ],
  },
  {
    week: "Week 2 · Engagement",
    progress: 75,
    items: [
      { t: "Launch WhatsApp re-engagement campaign", done: true },
      { t: "Run first AI-suggested offer", done: true },
      { t: "Collect 30 new Google reviews", done: true },
      { t: "A/B test 3 ad creatives", done: false },
    ],
  },
  {
    week: "Week 3 · Acceleration",
    progress: 25,
    items: [
      { t: "Scale top-performing ad by 2×", done: true },
      { t: "Build 14-day email nurture sequence", done: false },
      { t: "Launch loyalty program", done: false },
      { t: "Reach 5,000 Instagram followers", done: false },
    ],
  },
  {
    week: "Week 4 · Scale",
    progress: 0,
    items: [
      { t: "Activate cross-sell automations", done: false },
      { t: "Launch limited-time festive collection", done: false },
      { t: "Onboard partner brand for collab", done: false },
      { t: "Hit ₹5L monthly revenue target 🎯", done: false },
    ],
  },
];

function GrowthPage() {
  const totalDone = weeks.reduce((s, w) => s + w.items.filter((i) => i.done).length, 0);
  const total = weeks.reduce((s, w) => s + w.items.length, 0);
  const pct = Math.round((totalDone / total) * 100);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Your 30-day growth plan"
        subtitle="AI-curated roadmap to your goals"
        actions={
          <Button variant="hero" size="sm">
            <Sparkles size={14} /> Regenerate plan
          </Button>
        }
      />

      <div className="bg-gradient-primary rounded-3xl p-6 text-primary-foreground shadow-glow">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm opacity-90">Overall progress</p>
            <p className="text-4xl font-bold mt-1">{pct}%</p>
            <p className="text-sm opacity-90 mt-1">
              {totalDone} of {total} milestones complete
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Goal: ₹5L monthly revenue</p>
            <p className="text-2xl font-bold">₹3.62L / ₹5L</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {weeks.map((w) => (
          <div key={w.week} className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold">{w.week}</p>
              <span className="text-xs font-semibold text-primary">{w.progress}% complete</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-primary rounded-full"
                style={{ width: `${w.progress}%` }}
              />
            </div>
            <ul className="space-y-2">
              {w.items.map((it) => (
                <li key={it.t} className="flex items-center gap-3 text-sm">
                  {it.done ? (
                    <CheckCircle2 size={18} className="text-success shrink-0" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground shrink-0" />
                  )}
                  <span className={it.done ? "line-through text-muted-foreground" : ""}>
                    {it.t}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
