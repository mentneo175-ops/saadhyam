import { Star, Activity, Tag, ArrowRight, Video, Sparkles } from "lucide-react";

interface InsightsPanelProps {
  businessAnalysis?: any;
}

const insights = [
  {
    icon: Star,
    title: "Reviews vs competitors",
    metric: "4.8 / 5.0",
    detail: "+0.3 above market average",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: Activity,
    title: "Posting activity",
    metric: "12 posts",
    detail: "this week — 3× more than last",
    accent: "from-purple-500 to-fuchsia-500",
  },
  {
    icon: Tag,
    title: "Offer performance",
    metric: "247 redeems",
    detail: "Diwali offer driving 38% lift",
    accent: "from-pink-500 to-rose-500",
  },
];

export function InsightsPanel({ businessAnalysis }: InsightsPanelProps) {
  return (
    <aside className="hidden xl:flex flex-col gap-5 w-80 shrink-0 border-l border-border/60 bg-background p-5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Updated 2 min ago</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <div className="space-y-3">
          {insights.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-border/60 p-4 bg-card hover-lift"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-9 w-9 rounded-xl bg-gradient-to-br ${it.accent} flex items-center justify-center`}
                >
                  <it.icon size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{it.title}</p>
                  <p className="text-sm font-bold">{it.metric}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{it.detail}</p>
            </div>
          ))}
        </div>
        <button className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-accent/40 transition flex items-center justify-center gap-1">
          View all insights <ArrowRight size={14} />
        </button>
      </div>

      {/* Business Analysis Section - Replaces Quick Call */}
      {businessAnalysis ? (
        <div className="rounded-2xl bg-gradient-soft border border-border/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-purple-600" />
            <p className="text-sm font-semibold">AI Business Analysis</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Personalized insights for your business</p>
          
          <div className="space-y-3">
            {/* Strengths */}
            <div className="bg-card rounded-lg p-3 border border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">💪</span>
                <h4 className="text-xs font-semibold text-foreground">Strengths</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.strengths?.slice(0, 2).map((strength: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground">• {strength}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-card rounded-lg p-3 border border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⚠️</span>
                <h4 className="text-xs font-semibold text-foreground">Weaknesses</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.weaknesses?.slice(0, 2).map((weakness: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground">• {weakness}</li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-card rounded-lg p-3 border border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🚀</span>
                <h4 className="text-xs font-semibold text-foreground">Opportunities</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.opportunities?.slice(0, 2).map((opportunity: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground">• {opportunity}</li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="bg-card rounded-lg p-3 border border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⚡</span>
                <h4 className="text-xs font-semibold text-foreground">Threats</h4>
              </div>
              <ul className="space-y-1">
                {businessAnalysis.threats?.slice(0, 2).map((threat: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground">• {threat}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback: Original Quick Call Section */
        <div className="rounded-2xl bg-gradient-soft border border-border/60 p-4">
          <p className="text-sm font-semibold">Quick call</p>
          <p className="text-xs text-muted-foreground mb-3">Talk to your AI specialist</p>
          <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center gap-1.5 hover:brightness-110 transition">
            <Video size={14} /> Start video call
          </button>
          <div className="flex -space-x-2 mt-3 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full bg-gradient-brand border-2 border-card"
                style={{ filter: `hue-rotate(${i * 50}deg)` }}
              />
            ))}
            <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-semibold">
              +4
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
