import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeSlideUp } from "./BusinessAnalysisLayout";
import { Loader } from "@/components/ui/loader";

export function BusinessPageHeader({
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <motion.div {...fadeSlideUp}>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/12 via-primary/6 to-secondary/12 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary shadow-[0_0_24px_-8px_oklch(0.55_0.24_295/0.4)]">
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.span>
          AI Business Intelligence
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-[2rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
        {lastUpdated && (
          <p className="mt-3.5 flex items-center gap-2 text-xs text-muted-foreground/80">
            <Clock className="h-3.5 w-3.5" />
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

export function HeaderActions({
  onDownload,
  onReanalyze,
  isAnalyzing,
}: {
  onDownload: () => void;
  onReanalyze: () => void;
  isAnalyzing?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex shrink-0 flex-wrap items-center gap-3"
    >
      <Button
        variant="outline"
        size="lg"
        className="gap-2.5 rounded-xl border-slate-800 bg-slate-900/60 text-slate-200 px-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
        onClick={onDownload}
      >
        <Download className="h-4.5 w-4.5" />
        Download Report
      </Button>
      <Button
        variant="hero"
        size="lg"
        className="gap-2.5 rounded-xl px-6 shadow-glow transition-all duration-200 hover:shadow-[0_16px_48px_-8px_oklch(0.55_0.24_295/0.55)] hover:brightness-[1.05] active:scale-[0.98]"
        onClick={onReanalyze}
        disabled={isAnalyzing}
      >
        <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
        Re-analyze
      </Button>
    </motion.div>
  );
}

export function SectionHeader({
  title,
  icon: Icon,
  badge,
  subtitle,
  tone = "default",
}: {
  title: string;
  icon: LucideIcon;
  badge?: string;
  subtitle?: string;
  tone?: "default" | "premium";
}) {
  const isPremium = tone === "premium";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38 }}
      className="mb-6 flex items-start gap-3.5"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-shadow duration-300",
          isPremium
            ? "border-primary/20 bg-gradient-to-br from-primary/15 to-secondary/10 text-primary shadow-[0_0_24px_-6px_oklch(0.55_0.24_295/0.35)]"
            : "border-slate-800 bg-slate-950/60 text-slate-400",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-200">{title}</h3>
          {badge && (
            <span
              className={cn(
                "rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                isPremium
                  ? "border border-primary/20 bg-primary/8 text-primary"
                  : "border border-slate-800 bg-slate-950 text-slate-400",
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

export function SectionDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="h-px origin-left bg-gradient-to-r from-primary/35 via-secondary/30 to-transparent"
    />
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader text={message ?? "Loading business insights"} />
    </div>
  );
}

export function AnalyzingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader text={message ?? "Analyzing your business"} />
      <p className="mt-2 text-xs text-muted-foreground">This may take 2–3 minutes</p>
      <div className="mt-6 max-w-md bg-slate-900/40 border border-slate-800/80 rounded-xl px-5 py-4 text-center backdrop-blur-md">
        <p className="text-xs leading-relaxed text-slate-400">
          We&apos;re making one comprehensive API call to gather all your business insights. After
          this, all pages load instantly.
        </p>
      </div>
    </div>
  );
}

export function NotStartedState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-20 text-center backdrop-blur-md"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80">
        <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
      </div>
      <h2 className="text-lg font-semibold text-slate-100">Ready to analyze your business?</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
        Get comprehensive AI-powered insights including strengths, weaknesses, opportunities, and
        local market analysis.
      </p>
      <Button variant="hero" size="lg" className="mt-6 gap-2" onClick={onAnalyze}>
        <Sparkles className="h-4 w-4" />
        Analyze My Business
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">Takes 2–3 minutes · Powered by AI</p>
    </motion.div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-10 text-center backdrop-blur-sm"
    >
      <AlertCircle className="mx-auto mb-5 h-12 w-12 text-destructive/80" />
      <p className="text-lg font-semibold text-foreground">Analysis failed</p>
      <p className="mt-2.5 text-sm text-muted-foreground">{error}</p>
      <Button variant="outline" className="mt-7 gap-2.5 rounded-xl" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </motion.div>
  );
}
