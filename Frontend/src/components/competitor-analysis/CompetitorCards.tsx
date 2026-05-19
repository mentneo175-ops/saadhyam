import { useId } from "react";
import { motion } from "framer-motion";
import { MapPin, Shield, AlertTriangle, Building2, TrendingUp } from "lucide-react";
import type { NearbyCompetitor } from "@/lib/comprehensiveAnalysisApi";
import { deriveThreatScore } from "./utils";
import { staggerItem } from "./CompetitorLayout";
import { cn } from "@/lib/utils";

function ThreatScoreRing({ score, gradientId }: { score: number; gradientId: string }) {
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="relative h-[52px] w-[52px] shrink-0"
    >
      <svg width="52" height="52" className="-rotate-90">
        <circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted/60"
        />
        <motion.circle
          cx="26"
          cy="26"
          r="22"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.55 0.24 295)" />
            <stop offset="100%" stopColor="oklch(0.55 0.24 295 / 0.6)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-semibold leading-none text-foreground tabular-nums">
          {score}
        </span>
        <span className="mt-0.5 text-[8px] font-medium tracking-wider text-muted-foreground uppercase">
          Threat
        </span>
      </div>
    </motion.div>
  );
}

function InsightBlock({
  type,
  content,
}: {
  type: "strength" | "weakness";
  content: string;
}) {
  const isStrength = type === "strength";

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/20 px-4 py-3.5 transition-colors duration-200",
        isStrength ? "border-l-2 border-l-success/50" : "border-l-2 border-l-warning/50",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            isStrength ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
          )}
        >
          {isStrength ? (
            <Shield className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-foreground uppercase">
          {isStrength ? "Strengths" : "Weaknesses"}
        </span>
      </div>
      <p className="text-[13px] leading-[1.65] text-muted-foreground">{content}</p>
    </div>
  );
}

export function CompetitorCard({
  competitor,
  index,
}: {
  competitor: NearbyCompetitor;
  index: number;
}) {
  const gradientId = useId().replace(/:/g, "") + `-threat-${index}`;
  const score = deriveThreatScore(competitor, index);
  const threatLabel = score >= 75 ? "High" : score >= 60 ? "Medium" : "Moderate";
  const threatStyles =
    score >= 75
      ? "border-destructive/20 bg-destructive/[0.04] text-destructive"
      : score >= 60
        ? "border-warning/25 bg-warning/[0.06] text-amber-700"
        : "border-success/20 bg-success/[0.04] text-success";

  return (
    <motion.article
      variants={staggerItem}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="group relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-xl bg-primary/[0.06] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] transition-all duration-300 group-hover:border-border group-hover:shadow-soft">
        <div className="border-b border-border/40 px-5 py-5 md:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground transition-colors duration-300 group-hover:border-primary/20 group-hover:text-primary">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                    {competitor.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0 opacity-60" />
                    <span className="truncate">{competitor.location}</span>
                  </p>
                </div>
                <ThreatScoreRing score={score} gradientId={gradientId} />
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <Building2 className="h-3 w-3 opacity-60" />
                  {competitor.type}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                    threatStyles,
                  )}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                  {threatLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-5 py-4 md:px-6">
          <InsightBlock type="strength" content={competitor.strengths} />
          <InsightBlock type="weakness" content={competitor.weaknesses} />
        </div>

        <div className="border-t border-border/40 bg-muted/10 px-5 py-4 md:px-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <TrendingUp className="h-3 w-3 opacity-50" />
              Competitive pressure
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-foreground">{score}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted/70">
            <motion.div
              className="h-full rounded-full bg-primary/75"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.9, delay: 0.15 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function CompetitorGrid({ competitors }: { competitors: NearbyCompetitor[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.07 } },
      }}
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {competitors.map((competitor, idx) => (
        <CompetitorCard key={`${competitor.name}-${idx}`} competitor={competitor} index={idx} />
      ))}
    </motion.div>
  );
}
