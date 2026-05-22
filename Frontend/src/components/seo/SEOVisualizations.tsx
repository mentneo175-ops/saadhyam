import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Star, MessageSquare, Eye, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SEOShared";
import { auditItemsFromTips, buildSearchTrend, deriveKeywordRank } from "./utils";

export function SEOScoreGauge({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-5 shadow-soft md:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mt-4"
      >
        <svg width="128" height="128" className="-rotate-90">
          <circle
            cx="64"
            cy="64"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted/80"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="52"
            fill="none"
            stroke="url(#seoScoreGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="seoScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.55 0.24 295)" />
              <stop offset="100%" stopColor="oklch(0.68 0.22 350)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </motion.div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Based on your AI-generated insights
      </p>
    </motion.div>
  );
}

export function SearchPerformanceChart({
  keywordCount,
  delay = 0.1,
}: {
  keywordCount: number;
  delay?: number;
}) {
  const data = buildSearchTrend(keywordCount);

  return (
    <SectionCard
      title="Search performance"
      subtitle="Estimated weekly search visibility trend"
      icon={Eye}
      delay={delay}
    >
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="searchPerfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "oklch(0.5 0.03 280)" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid oklch(0.92 0.01 290)",
                boxShadow: "var(--shadow-md)",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}`, "Impressions"]}
            />
            <Area
              type="monotone"
              dataKey="impressions"
              stroke="oklch(0.55 0.24 295)"
              strokeWidth={2}
              fill="url(#searchPerfFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function WebsiteAuditPanel({
  tips,
  delay = 0.15,
}: {
  tips: string[];
  delay?: number;
}) {
  const items = auditItemsFromTips(tips);

  return (
    <SectionCard
      title="Website audit"
      subtitle="Priority areas from your AI recommendations"
      icon={Star}
      delay={delay}
    >
      <div className="space-y-4">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + idx * 0.05 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + idx * 0.05 }}
              className="mb-1.5 flex items-center justify-between gap-2"
            >
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-xs font-semibold text-primary">{item.progress}%</span>
            </motion.div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.8, delay: delay + 0.1 + idx * 0.08 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

export function KeywordRankingList({
  keywords,
  searchQuery,
  delay = 0.1,
}: {
  keywords: string[];
  searchQuery: string;
  delay?: number;
}) {
  const filtered = keywords.filter((k) =>
    k.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!filtered.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No keywords match your search.</p>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((keyword, idx) => (
        <motion.div
          key={`${keyword}-${idx}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + idx * 0.04 }}
          whileHover={{ x: 2 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-primary/5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{keyword}</p>
            <p className="text-xs text-muted-foreground">Target keyword</p>
          </div>
          <span className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary">
            Tracked
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export function KeywordPills({ keywords }: { keywords: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword, idx) => (
        <motion.span
          key={idx}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.04 }}
          whileHover={{ scale: 1.03 }}
          className="cursor-default rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-sm font-medium text-primary"
        >
          {keyword}
        </motion.span>
      ))}
    </div>
  );
}

export function ReviewsOverview({ delay = 0.2 }: { delay?: number }) {
  // Removed demo data - this component is now disabled
  // To enable real reviews data, integrate with Google My Business API
  return null;
}

export function MapsLocationInsights({
  ideasCount,
  tipsCount,
  delay = 0.15,
}: {
  ideasCount: number;
  tipsCount: number;
  delay?: number;
}) {
  const items = [
    { label: "Local visibility", value: Math.min(95, 40 + ideasCount * 12), color: "primary" },
    { label: "Maps ranking potential", value: Math.min(92, 35 + tipsCount * 10), color: "secondary" },
    { label: "Profile completeness", value: Math.min(88, 50 + (ideasCount + tipsCount) * 5), color: "primary" },
  ];

  return (
    <SectionCard
      title="Location performance"
      subtitle="How your business shows up in local search"
      icon={Navigation}
      delay={delay}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="space-y-5"
      >
        {items.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + idx * 0.06 }}
          >
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-foreground">{item.label}</span>
              <span className="font-semibold text-primary">{item.value}%</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + idx * 0.06 }}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.9, delay: 0.15 + idx * 0.1 }}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </SectionCard>
  );
}
