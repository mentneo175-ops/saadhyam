import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  delta?: string;
  deltaUp?: boolean;
}

export function StatCard({ label, value, icon: Icon, gradient, delta, deltaUp }: StatCardProps) {
  return (
    <div className="premium-card">
      <div className="card-inner p-4">
        {/* Icon */}
        <div
          className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}
        >
          <Icon size={18} className="text-white" />
        </div>

        {/* Label */}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
          {label}
        </p>

        {/* Value */}
        <p className="text-2xl font-bold text-gray-900 leading-none mb-2">{value}</p>

        {/* Delta */}
        {delta && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              deltaUp !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
            }`}
          >
            {deltaUp !== false ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
    </div>
  );
}
