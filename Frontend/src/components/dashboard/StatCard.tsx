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
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
      {/* Glow Effect on Hover */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300 blur-xl`} />
      
      <div className="flex items-center justify-between mb-4">
        {/* Icon */}
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm text-white`}>
          <Icon size={18} />
        </div>
        
        {/* Delta */}
        {delta && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              deltaUp !== false 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {deltaUp !== false ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
        {value}
      </p>
    </div>
  );
}
