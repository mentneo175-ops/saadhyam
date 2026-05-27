import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Sparkles,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeSlideUp } from "./CompetitorLayout";
import { Loader } from "@/components/ui/loader";

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 700;
      const startTime = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{count}</span>;
}

export function CompetitorPageHeader({
  title,
  subtitle,
  lastUpdated,
  actions,
}: {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <motion.div {...fadeSlideUp}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <Sparkles className="h-3 w-3 text-primary" />
          AI Competitive Intelligence
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        {lastUpdated && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <Clock className="h-3 w-3" />
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        )}
      </motion.div>
      {actions}
    </div>
  );
}

export function ReanalyzeButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 }}
      className="flex shrink-0 items-center gap-2"
    >
      <Button
        variant="hero"
        size="lg"
        className="gap-2 shadow-soft transition-shadow hover:shadow-glow"
        onClick={onClick}
        disabled={disabled}
      >
        <RefreshCw className={cn("h-4 w-4", disabled && "animate-spin")} />
        Re-analyze
      </Button>
    </motion.div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start justify-between gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
            {badge && (
              <span className="rounded-md border border-border/80 bg-background px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const METRIC_ACCENTS = {
  competitors: "text-primary",
  patterns: "text-foreground",
  gaps: "text-success",
  ideas: "text-secondary",
} as const;

export function SummaryMetric({
  label,
  value,
  icon: Icon,
  delay = 0,
  metricKey = "competitors",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delay?: number;
  metricKey?: keyof typeof METRIC_ACCENTS;
}) {
  const numericValue = typeof value === "number" ? value : parseInt(String(value), 10) || 0;
  const progress = Math.min(100, numericValue * 12 + 28);
  const accentClass = METRIC_ACCENTS[metricKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] transition-all duration-300 hover:border-border hover:shadow-soft md:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground transition-colors duration-300 group-hover:border-primary/15 group-hover:text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <p className={cn("text-2xl font-semibold tracking-tight tabular-nums", accentClass)}>
          {typeof value === "number" ? (
            <AnimatedCounter value={value} delay={delay} />
          ) : (
            value
          )}
        </p>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
            <span>Intelligence depth</span>
            <span className="text-foreground/70">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted/80">
            <motion.div
              className="h-full rounded-full bg-primary/70"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.85, delay: 0.12 + delay, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-28">
      <Loader text={message ?? "Loading competitive insights"} />
    </div>
  );
}

export function AnalyzingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28">
      <Loader text={message ?? "Analyzing competitors"} />
      <p className="mt-1.5 text-xs text-muted-foreground">This may take 2–3 minutes</p>
    </div>
  );
}

export function NotStartedState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-20 text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-card">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">No analysis found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Run a business analysis first to unlock AI-powered competitor intelligence.
      </p>
      <Button variant="hero" size="lg" className="mt-6 gap-2" onClick={onNavigate}>
        <Sparkles className="h-4 w-4" />
        Go to Business Analysis
      </Button>
    </motion.div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-destructive/20 bg-destructive/[0.03] p-8 text-center"
    >
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive/80" />
      <p className="text-base font-semibold text-foreground">Analysis failed</p>
      <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      <Button variant="outline" className="mt-6 gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </motion.div>
  );
}

export function EmptyInsightsState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center"
    >
      <Users className="mb-4 h-9 w-9 text-muted-foreground/40" />
      <p className="font-medium text-foreground">No competitor data yet</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Run a business analysis to generate competitive landscape insights.
      </p>
    </motion.div>
  );
}

export function SectionDivider() {
  return (
    <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-border/80 to-transparent" />
  );
}
