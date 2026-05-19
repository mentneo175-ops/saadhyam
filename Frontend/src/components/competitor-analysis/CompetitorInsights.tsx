import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  Sparkles,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./CompetitorShared";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function AIInsightsPanel({ patterns }: { patterns: string[] }) {
  return (
    <motion.section
      {...fadeUp}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] md:p-7 p-6"
    >
      <div className="space-y-5">
        <SectionHeader
          title="AI competitor patterns"
          subtitle="Intelligence synthesized from your competitive landscape"
          icon={Brain}
          badge="Insights"
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/20 px-4 py-3.5"
        >
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/5"
          >
            <Zap className="h-4 w-4 text-primary" />
          </motion.div>
          <div className="flex-1">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Patterns detected
            </p>
            <p className="text-xl font-semibold tabular-nums text-foreground">{patterns.length}</p>
          </div>
          <div className="hidden h-8 w-px bg-border/70 sm:block" />
          <p className="hidden max-w-[200px] text-xs leading-relaxed text-muted-foreground sm:block">
            Recurring strategies identified across nearby competitors in your market.
          </p>
        </motion.div>

        <div className="space-y-2.5">
          {patterns.map((pattern, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + idx * 0.05 }}
              whileHover={{ x: 2 }}
              className="group flex items-start gap-3 rounded-lg border border-border/50 bg-background/80 px-4 py-3.5 transition-all duration-200 hover:border-border hover:bg-muted/20 hover:shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-[10px] font-semibold text-muted-foreground transition-colors group-hover:border-primary/15 group-hover:text-primary">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-[1.65] text-foreground">{pattern}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium tracking-wider text-primary/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Sparkles className="h-3 w-3" />
                  AI insight
                </span>
              </div>
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary/60" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function MarketGapsPanel({ gaps }: { gaps: string[] }) {
  return (
    <motion.section
      {...fadeUp}
      transition={{ delay: 0.14, duration: 0.35 }}
      className="rounded-xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] md:p-7"
    >
      <SectionHeader
        title="Market gaps"
        subtitle="Opportunities your competitors are missing"
        icon={Target}
        badge="Opportunity"
      />
      <div className="mt-5 space-y-2.5">
        {gaps.map((gap, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 + idx * 0.04 }}
            whileHover={{ y: -2 }}
            className="group flex items-start gap-3 rounded-lg border border-border/50 border-l-2 border-l-success/40 bg-muted/15 px-4 py-3.5 transition-all duration-200 hover:bg-muted/25"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-success/10">
              <Sparkles className="h-3.5 w-3.5 text-success" />
            </div>
            <p className="text-[13px] leading-[1.65] text-muted-foreground">{gap}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function DifferentiationPanel({ ideas }: { ideas: string[] }) {
  return (
    <motion.section
      {...fadeUp}
      transition={{ delay: 0.18, duration: 0.35 }}
      className="overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] md:p-7"
    >
      <SectionHeader
        title="Differentiation ideas"
        subtitle="How to stand out from the competition"
        icon={Lightbulb}
        badge="Strategy"
      />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {ideas.map((idea, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.04 }}
            whileHover={{ y: -3 }}
            className="group rounded-lg border border-border/50 bg-muted/10 p-4 transition-all duration-200 hover:border-border hover:bg-muted/20 hover:shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors duration-200 group-hover:border-primary/15 group-hover:text-primary">
                <Lightbulb className="h-3.5 w-3.5" />
              </div>
              <p className="text-[13px] leading-[1.65] text-muted-foreground">{idea}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export function DifferentiationCTA({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.35 }}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/15 p-6 md:p-7"
    >
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5"
          >
            <Lightbulb className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Ready to differentiate?</h3>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Use these insights to craft a unique value proposition that sets you apart from
              competitors.
            </p>
          </div>
        </div>
        <Button
          variant="hero"
          className="shrink-0 gap-2 shadow-soft transition-shadow hover:shadow-glow"
          onClick={onNavigate}
        >
          View full analysis
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
