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
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <motion.div {...fadeSlideUp}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary shadow-[0_0_20px_-8px_oklch(0.55_0.24_295/0.4)]">
          <motion.span
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3 w-3" />
          </motion.span>
          AI Business Intelligence
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
      className="flex shrink-0 flex-wrap items-center gap-2.5"
    >
      <Button
        variant="outline"
        size="lg"
        className="gap-2 border-border/70 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/35 hover:bg-primary/[0.04] hover:shadow-[0_0_24px_-8px_oklch(0.55_0.2_295/0.25)]"
        onClick={onDownload}
      >
        <Download className="h-4 w-4" />
        Download Report
      </Button>
      <Button
        variant="hero"
        size="lg"
        className="gap-2 shadow-glow transition-all duration-200 hover:shadow-[0_12px_40px_-8px_oklch(0.55_0.24_295/0.5)] hover:brightness-[1.05] active:scale-[0.98]"
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
      className="mb-5 flex items-start gap-3"
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-shadow duration-300",
          isPremium
            ? "border-primary/20 bg-gradient-to-br from-primary/15 to-secondary/10 text-primary shadow-[0_0_20px_-6px_oklch(0.55_0.24_295/0.35)]"
            : "border-border/60 bg-muted/30 text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {badge && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                isPremium
                  ? "border border-primary/20 bg-primary/8 text-primary"
                  : "border border-border/70 bg-background text-muted-foreground",
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
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
      className="h-px origin-left bg-gradient-to-r from-primary/30 via-secondary/25 to-transparent"
    />
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/60 py-28">
      <Loader2 className="mb-4 h-9 w-9 animate-spin text-primary/70" />
      <p className="text-sm font-medium text-foreground">
        {message ?? "Loading business insights…"}
      </p>
    </div>
  );
}

export function AnalyzingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/60 py-28">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/15 bg-primary/5"
      >
        <Sparkles className="h-6 w-6 text-primary" />
      </motion.div>
      <p className="text-sm font-medium text-foreground">
        {message ?? "Analyzing your business…"}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">This may take 2–3 minutes</p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 max-w-md rounded-lg border border-border/60 bg-muted/20 px-5 py-4 text-center"
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          We&apos;re making one comprehensive API call to gather all your business insights. After
          this, all pages load instantly.
        </p>
      </motion.div>
    </div>
  );
}

export function NotStartedState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-muted/15 px-6 py-20 text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-card">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Ready to analyze your business?</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
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
