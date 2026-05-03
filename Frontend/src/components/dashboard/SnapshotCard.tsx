import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface SnapshotCardProps {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  status: "Good" | "Excellent" | "Needs Improvement";
  icon: LucideIcon;
  gradient: string;
  data: number[];
}

const statusColor = {
  Good: "bg-success/10 text-success",
  Excellent: "bg-primary/10 text-primary",
  "Needs Improvement": "bg-warning/15 text-amber-700",
};

export function SnapshotCard({
  title,
  value,
  delta,
  trend,
  status,
  icon: Icon,
  gradient,
  data,
}: SnapshotCardProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const w = 100;
  const h = 30;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`)
    .join(" ");

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-soft hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-soft`}
        >
          <Icon size={18} className="text-white" />
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[status]}`}
        >
          {status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <div
          className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
            trend === "up" ? "text-success" : "text-destructive"
          }`}
        >
          {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 mt-2">
        <polyline
          points={points}
          fill="none"
          stroke={trend === "up" ? "oklch(0.68 0.16 155)" : "oklch(0.6 0.24 27)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
