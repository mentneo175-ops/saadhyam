import { TrendingUp, Sparkles, BarChart3, Users } from "lucide-react";

/** Floating dashboard preview shown in hero. */
export function HeroPreview() {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Glow background */}
      <div className="absolute inset-0 -z-10 bg-mesh blur-3xl opacity-70" />

      {/* Main card */}
      <div className="glass rounded-3xl shadow-floating p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Business Health</p>
            <p className="text-2xl font-bold">87 / 100</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <BarChart3 size={18} className="text-white" />
          </div>
        </div>
        {/* Mini chart */}
        <svg viewBox="0 0 200 60" className="w-full h-16">
          <defs>
            <linearGradient id="hg1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.24 295)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.55 0.24 295)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 C30,30 50,45 80,25 C110,5 140,30 170,15 L200,20 L200,60 L0,60 Z"
            fill="url(#hg1)"
          />
          <path
            d="M0,40 C30,30 50,45 80,25 C110,5 140,30 170,15 L200,20"
            fill="none"
            stroke="oklch(0.55 0.24 295)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
            <TrendingUp size={12} /> +12.4%
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      </div>

      {/* Floating card top-right */}
      <div
        className="absolute -top-6 -right-4 md:-right-10 w-56 glass rounded-2xl shadow-elevated p-4 animate-float"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-secondary flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">AI Generated</p>
            <p className="text-[11px] text-muted-foreground truncate">5 new posts ready</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-4/5 bg-gradient-secondary rounded-full" />
          </div>
          <p className="text-[10px] text-muted-foreground">80% engagement boost</p>
        </div>
      </div>

      {/* Floating card bottom-left */}
      <div
        className="absolute -bottom-8 -left-4 md:-left-10 w-52 glass rounded-2xl shadow-elevated p-4 animate-float"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} className="text-secondary" />
          <p className="text-xs font-semibold">New customers</p>
        </div>
        <p className="text-2xl font-bold">+247</p>
        <p className="text-[10px] text-muted-foreground">this week</p>
      </div>
    </div>
  );
}
