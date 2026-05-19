import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertCircle,
  Target,
  Map,
  Users,
  Activity,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { LocalMarketInsights } from "@/lib/comprehensiveAnalysisApi";
import { SectionHeader } from "./BusinessAnalysisShared";
import { renderMarkdown } from "./markdown";
import { scaleReveal } from "./BusinessAnalysisLayout";

function InsightListPanel({
  title,
  icon: Icon,
  items,
  accent,
  delay,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: string[];
  accent: "success" | "warning" | "primary";
  delay: number;
}) {
  const accentStyles = {
    success: {
      border: "border-l-success/55",
      icon: "text-success",
      iconBg: "bg-success/12 ring-1 ring-success/20",
      panelGlow: "from-success/[0.06] via-transparent to-primary/[0.04]",
    },
    warning: {
      border: "border-l-warning/55",
      icon: "text-warning",
      iconBg: "bg-warning/12 ring-1 ring-warning/25",
      panelGlow: "from-warning/[0.06] via-transparent to-secondary/[0.04]",
    },
    primary: {
      border: "border-l-primary/50",
      icon: "text-primary",
      iconBg: "bg-primary/12 ring-1 ring-primary/20",
      panelGlow: "from-primary/[0.07] via-transparent to-secondary/[0.05]",
    },
  }[accent];

  const ItemIcon =
    accent === "success" ? CheckCircle2 : accent === "warning" ? AlertCircle : Sparkles;

  return (
    <motion.div
      variants={scaleReveal}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card via-card to-muted/20 p-6 shadow-soft backdrop-blur-sm transition-shadow duration-300 hover:border-primary/15 hover:shadow-[0_20px_48px_-24px_oklch(0.45_0.18_295/0.12)] md:p-7"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${accentStyles.panelGlow}`}
      />
      <div className="relative">
        <SectionHeader title={title} icon={Icon} tone="premium" />
        <div className="space-y-2">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: delay + 0.08 + idx * 0.05,
                duration: 0.42,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ x: 2 }}
              className={`group/item flex items-start gap-3 rounded-xl border border-border/40 border-l-[3px] bg-card/60 px-4 py-3.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-card/90 hover:shadow-md ${accentStyles.border}`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accentStyles.iconBg}`}
              >
                <ItemIcon className={`h-3.5 w-3.5 ${accentStyles.icon}`} />
              </div>
              <span className="text-[13px] leading-[1.65] text-muted-foreground">
                {renderMarkdown(item)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MarketInsightBlock({
  title,
  icon: Icon,
  children,
  delay,
}: {
  title: string;
  icon: typeof Users;
  children: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.42 }}
      whileHover={{ y: -1 }}
      className="rounded-xl border border-border/45 bg-gradient-to-br from-card/90 to-primary/[0.04] p-4 shadow-sm backdrop-blur-sm transition-shadow hover:border-primary/15 hover:shadow-soft"
    >
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
      </h4>
      <div className="text-[13px] leading-[1.65] text-muted-foreground">{children}</div>
    </motion.div>
  );
}

export function InsightPanels({
  strengths,
  weaknesses,
  opportunities,
  localMarket,
}: {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  localMarket?: LocalMarketInsights;
}) {
  const hasLists =
    strengths.length > 0 || weaknesses.length > 0 || opportunities.length > 0 || localMarket;

  if (!hasLists) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {strengths.length > 0 && (
        <InsightListPanel
          title="Strengths"
          icon={TrendingUp}
          items={strengths}
          accent="success"
          delay={0.06}
        />
      )}
      {weaknesses.length > 0 && (
        <InsightListPanel
          title="Weaknesses"
          icon={AlertCircle}
          items={weaknesses}
          accent="warning"
          delay={0.1}
        />
      )}
      {opportunities.length > 0 && (
        <InsightListPanel
          title="Growth Opportunities"
          icon={Target}
          items={opportunities}
          accent="primary"
          delay={0.14}
        />
      )}
      {localMarket && (
        <motion.div
          variants={scaleReveal}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.18 }}
          whileHover={{ y: -2 }}
          className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card via-card to-secondary/[0.06] p-6 shadow-soft backdrop-blur-sm transition-shadow duration-300 hover:border-primary/15 hover:shadow-[0_20px_48px_-24px_oklch(0.45_0.18_295/0.12)] md:p-7 lg:col-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
          />
          <SectionHeader title="Local Market Insights" icon={Map} badge="Market" tone="premium" />
          <div className="grid gap-3 md:grid-cols-2">
            {localMarket.local_demand && (
              <MarketInsightBlock title="Local Demand" icon={Users} delay={0.22}>
                {renderMarkdown(localMarket.local_demand)}
              </MarketInsightBlock>
            )}
            {localMarket.customer_behavior && (
              <MarketInsightBlock title="Customer Behavior" icon={Activity} delay={0.26}>
                {renderMarkdown(localMarket.customer_behavior)}
              </MarketInsightBlock>
            )}
            {localMarket.competition_level && (
              <MarketInsightBlock title="Competition Level" icon={TrendingUp} delay={0.3}>
                {renderMarkdown(localMarket.competition_level)}
              </MarketInsightBlock>
            )}
            {localMarket.trending_services && localMarket.trending_services.length > 0 && (
              <MarketInsightBlock title="Trending Services" icon={Sparkles} delay={0.34}>
                <div className="flex flex-wrap gap-2">
                  {localMarket.trending_services.map((service, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.36 + idx * 0.04 }}
                      whileHover={{ scale: 1.03 }}
                      className="rounded-md border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {service}
                    </motion.span>
                  ))}
                </div>
              </MarketInsightBlock>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
