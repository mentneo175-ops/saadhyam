import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ExternalLink, Plus, Trash2, Zap, Users, BarChart3, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/competitors")({
  head: () => ({ meta: [{ title: "Competitors — Saadhyam AI" }] }),
  component: CompetitorsPage,
});

const initialCompetitors = [
  {
    id: 1,
    name: "Lumen Studio",
    handle: "@lumenstudio",
    score: 78,
    followers: "48.2K",
    posts: 18,
    engagement: "4.2%",
    trend: "up",
    insight: "Posting 3× more reels than last month — driving 28% follower growth.",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    name: "Crisp Foods",
    handle: "@crispfoods",
    score: 65,
    followers: "32.1K",
    posts: 9,
    engagement: "3.1%",
    trend: "down",
    insight: "Engagement dipped 12% after switching to product-only posts.",
    color: "from-orange-500 to-red-500",
  },
  {
    id: 3,
    name: "Bloom Decor",
    handle: "@bloomdecor",
    score: 84,
    followers: "62.4K",
    posts: 22,
    engagement: "5.8%",
    trend: "up",
    insight: "User-generated content strategy paying off — strongest in category.",
    color: "from-emerald-500 to-teal-500",
  },
];

const yourMetrics = { followers: "21.8K", posts: 12, engagement: "4.6%", score: 72 };

function CompetitorsPage() {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ name: "", handle: "" });

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    try {
      const response = await apiClient.getCompetitors();
      if (response.success && response.competitors && response.competitors.length > 0) {
        setCompetitors(response.competitors);
      }
    } catch (error) {
      console.error("Failed to load competitors:", error);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name.trim() || !newCompetitor.handle.trim()) {
      toast.error("Please enter name and handle");
      return;
    }

    try {
      const response = await apiClient.createCompetitor({
        name: newCompetitor.name,
        handle: newCompetitor.handle,
        score: 0,
        followers: "0",
        posts: 0,
        engagement: "0%",
        trend: "up",
        insight: "Analyzing competitor data...",
        color: "from-blue-500 to-cyan-500",
      });

      if (response.success && response.competitor) {
        setCompetitors([...competitors, response.competitor]);
        toast.success("Competitor added successfully!");
        setNewCompetitor({ name: "", handle: "" });
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error("Failed to add competitor:", error);
      toast.error("Failed to add competitor");
    }
  };

  const handleDeleteCompetitor = async (id: number) => {
    try {
      await apiClient.deleteCompetitor(id);
      setCompetitors(competitors.filter((c) => c.id !== id));
      toast.success("Competitor removed");
    } catch (error) {
      console.error("Failed to delete competitor:", error);
      toast.error("Failed to delete competitor");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Competitors"
        subtitle={`Tracking ${competitors.length} competitors · refreshed hourly`}
        actions={
          <Button variant="hero" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus size={14} /> Add competitor
          </Button>
        }
      />

      {/* Add Competitor Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Competitor</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Business Name</label>
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  placeholder="E.g., Lumen Studio"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Social Handle</label>
                <input
                  type="text"
                  value={newCompetitor.handle}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, handle: e.target.value })}
                  placeholder="@lumenstudio"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button variant="hero" className="flex-1" onClick={handleAddCompetitor}>
                  Add Competitor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-soft rounded-2xl border border-border/60 p-5">
        <p className="text-sm font-semibold mb-3">You vs market</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Your score", v: yourMetrics.score, sub: "+5 vs avg" },
            { l: "Followers", v: yourMetrics.followers, sub: "Below market" },
            { l: "Posts/week", v: yourMetrics.posts, sub: "Above market" },
            { l: "Engagement", v: yourMetrics.engagement, sub: "+0.3% vs avg" },
          ].map((m) => (
            <div key={m.l} className="bg-card rounded-xl p-4 border border-border/40">
              <p className="text-xs text-muted-foreground">{m.l}</p>
              <p className="text-xl font-bold mt-1">{m.v}</p>
              <p className="text-xs text-primary font-medium mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {competitors.map((c) => (
          <div
            key={c.id}
            className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 hover-lift relative"
          >
            <button
              onClick={() => handleDeleteCompetitor(c.id)}
              className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center transition"
            >
              <Trash2 size={14} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold`}
              >
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.handle}</p>
              </div>
              <button className="h-8 w-8 rounded-lg hover:bg-accent/40 inline-flex items-center justify-center">
                <ExternalLink size={14} />
              </button>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">AI score</p>
                <p className="text-3xl font-bold">{c.score}</p>
              </div>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  c.trend === "up" ? "text-success" : "text-destructive"
                }`}
              >
                {c.trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {c.trend === "up" ? "Rising" : "Slowing"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: "Followers", v: c.followers },
                { l: "Posts/wk", v: c.posts },
                { l: "Engage", v: c.engagement },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">{s.l}</p>
                  <p className="text-sm font-semibold mt-0.5">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
              <p className="text-[11px] font-semibold text-primary mb-1">AI insight</p>
              <p className="text-xs leading-relaxed">{c.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


