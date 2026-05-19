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
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-300/50 hover:border-purple-300/50 transition-all duration-300">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-fuchsia-50/0 group-hover:from-purple-50/50 group-hover:to-fuchsia-50/30 rounded-2xl transition-all duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all duration-300">
            <Icon size={20} className="text-white" />
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor[status]} shadow-sm`}
          >
            {status}
          </span>
        </div>
        <p className="text-xs text-gray-600 font-semibold mb-1">{title}</p>
        <div className="flex items-end justify-between mt-2 mb-3">
          <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
          <div
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
              trend === "up" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta}
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 mt-2">
          <polyline
            points={points}
            fill="none"
            stroke={trend === "up" ? "#10b981" : "#ef4444"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
