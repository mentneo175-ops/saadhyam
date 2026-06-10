import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "./BusinessAnalysisLayout";

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 950;
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

const METRICS = [
  {
    key: "strengths",
    label: "Strengths",
    subtitle: "Key advantages identified",
    icon: TrendingUp,
    valueClass: "text-primary",
    iconWrap: "border-primary/25 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_0_20px_-4px_oklch(0.55_0.24_295/0.35)]",
    barGradient: "from-primary via-primary/80 to-[oklch(0.62_0.18_310)]",
    cardTint: "from-primary/[0.07] via-transparent to-transparent",
    ringHover: "group-hover:shadow-[0_0_0_1px_oklch(0.55_0.24_295/0.25)]",
  },
  {
    key: "weaknesses",
    label: "Weaknesses",
    subtitle: "Areas to improve",
    icon: TrendingDown,
    valueClass: "text-secondary",
    iconWrap:
      "border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 text-secondary shadow-[0_0_20px_-4px_oklch(0.68_0.22_350/0.3)]",
    barGradient: "from-secondary via-secondary/75 to-[oklch(0.72_0.16_320)]",
    cardTint: "from-secondary/[0.06] via-transparent to-transparent",
    ringHover: "group-hover:shadow-[0_0_0_1px_oklch(0.68_0.22_350/0.22)]",
  },
  {
    key: "opportunities",
    label: "Opportunities",
    subtitle: "Growth potential",
    icon: Target,
    valueClass: "text-success",
    iconWrap:
      "border-success/25 bg-gradient-to-br from-success/15 to-success/5 text-success shadow-[0_0_18px_-4px_oklch(0.68_0.16_155/0.35)]",
    barGradient: "from-success via-success/80 to-[oklch(0.62_0.14_170)]",
    cardTint: "from-success/[0.06] via-transparent to-transparent",
    ringHover: "group-hover:shadow-[0_0_0_1px_oklch(0.68_0.16_155/0.25)]",
  },
  {
    key: "services",
    label: "Services",
    subtitle: "Offerings available",
    icon: Activity,
    valueClass: "text-foreground",
    iconWrap:
      "border-[oklch(0.55_0.18_270/0.35)] bg-gradient-to-br from-[oklch(0.55_0.12_285/0.2)] to-[oklch(0.58_0.1_300/0.08)] text-[oklch(0.45_0.2_295)] shadow-[0_0_18px_-4px_oklch(0.55_0.18_285/0.25)]",
    barGradient: "from-[oklch(0.55_0.2_295)] via-[oklch(0.58_0.16_280)] to-[oklch(0.62_0.14_265)]",
    cardTint: "from-[oklch(0.55_0.12_295/0.08)] via-transparent to-[oklch(0.65_0.1_320/0.05)]",
    ringHover: "group-hover:shadow-[0_0_0_1px_oklch(0.55_0.18_285/0.2)]",
  },
] as const;

function MetricCard({
  label,
  subtitle,
  value,
  icon: Icon,
  valueClass,
  iconWrap,
  barGradient,
  cardTint,
  ringHover,
  delay,
  maxValue = 10,
}: {
  label: string;
  subtitle: string;
  value: number;
  icon: LucideIcon;
  valueClass: string;
  iconWrap: string;
  barGradient: string;
  cardTint: string;
  ringHover: string;
  delay: number;
  maxValue?: number;
}) {
  const progress = Math.min(100, (value / maxValue) * 100);

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_16px_48px_-20px_rgba(0,0,0,0.5)] hover:ring-1 hover:ring-purple-500/25 md:p-7",
        ringHover,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-300 group-hover:opacity-100",
          cardTint,
        )}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <motion.div
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-sm transition-shadow duration-300 group-hover:shadow-glow",
            iconWrap,
          )}
        >
          <Icon className="h-[22px] w-[22px]" />
        </motion.div>
        <p className={cn("text-4xl font-bold tabular-nums tracking-tight", valueClass)}>
          <AnimatedCounter value={value} delay={delay} />
        </p>
      </div>

      <div className="relative mt-5">
        <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{subtitle}</p>
      </div>

      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-[10px] font-medium text-slate-400">
          <span>Insight depth</span>
          <span className="font-semibold text-slate-200">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-lg bg-slate-950 ring-1 ring-inset ring-slate-800/80 dark:bg-slate-900">
          <motion.div
            className={cn("h-full rounded-lg bg-gradient-to-r", barGradient)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.05, delay: 0.18 + delay, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export function MetricsGrid({
  strengths,
  weaknesses,
  opportunities,
  services,
}: {
  strengths: number;
  weaknesses: number;
  opportunities: number;
  services: number;
}) {
  const values = { strengths, weaknesses, opportunities, services };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      // Default to two columns on small/mobile screens to display a 2x2 layout
      // and expand to four columns on extra-large screens
      className="grid grid-cols-2 gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      {METRICS.map((metric, idx) => (
        <MetricCard
          key={metric.key}
          label={metric.label}
          subtitle={metric.subtitle}
          value={values[metric.key]}
          icon={metric.icon}
          valueClass={metric.valueClass}
          iconWrap={metric.iconWrap}
          barGradient={metric.barGradient}
          cardTint={metric.cardTint}
          ringHover={metric.ringHover}
          delay={idx * 0.07}
        />
      ))}
    </motion.div>
  );
}
