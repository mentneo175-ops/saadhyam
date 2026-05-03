import { type LucideIcon } from "lucide-react";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  impact: "High" | "Medium" | "Low";
  bg: string;
  iconColor: string;
}

const impactColor = {
  High: "bg-secondary/15 text-secondary",
  Medium: "bg-accent/20 text-amber-700",
  Low: "bg-muted text-muted-foreground",
};

export function ActionCard({ icon: Icon, title, desc, impact, bg, iconColor }: ActionCardProps) {
  return (
    <div
      className={`min-w-[260px] snap-start rounded-2xl border border-border/40 p-5 ${bg} hover-lift cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`h-10 w-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-soft`}
        >
          <Icon size={18} className={iconColor} />
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${impactColor[impact]}`}
        >
          {impact} impact
        </span>
      </div>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      <button className="mt-4 text-xs font-semibold text-foreground hover:text-primary transition">
        Take action →
      </button>
    </div>
  );
}
