import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { SectionHeader } from "./BusinessAnalysisShared";
import { CHART_COLORS } from "./utils";
import { scaleReveal } from "./BusinessAnalysisLayout";

type MetricsPoint = { category: string; value: number; fullMark: number };
type SwotPoint = { name: string; value: number; color: string };

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid oklch(0.28 0.02 260 / 0.8)",
  boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.5)",
  fontSize: 12,
  background: "oklch(0.18 0.02 260 / 0.95)",
  backdropFilter: "blur(8px)",
  color: "#f8fafc",
};

function ChartShell({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      variants={scaleReveal}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/40 p-7 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-shadow duration-300 hover:border-purple-500/30 hover:shadow-[0_24px_56px_-24px_rgba(0,0,0,0.5)] md:p-8 dark:border-slate-700"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-8 h-48 w-48 rounded-full bg-secondary/8 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-60"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-primary/6 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-50"
      />
      {children}
    </motion.div>
  );
}

export function AnalyticsSection({
  businessMetricsData,
  swotData,
}: {
  businessMetricsData: MetricsPoint[];
  swotData: SwotPoint[];
}) {
  const radarFillId = useId().replace(/:/g, "") + "-radarFill";
  const radarStrokeId = useId().replace(/:/g, "") + "-radarStroke";

  return (
    // Ensure explicit 1x2 layout on small screens (one column, two rows)
    // and side-by-side (2 columns) on large screens
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartShell delay={0.08}>
        <SectionHeader title="Business Metrics" icon={BarChart3} badge="Radar" tone="premium" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="h-[240px] md:h-[340px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={businessMetricsData}>
              <defs>
                <linearGradient id={radarFillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="oklch(0.68 0.2 320)" stopOpacity={0.12} />
                </linearGradient>
                <linearGradient id={radarStrokeId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.52 0.24 295)" />
                  <stop offset="100%" stopColor="oklch(0.65 0.2 330)" />
                </linearGradient>
              </defs>
              <PolarGrid stroke="oklch(0.28 0.02 260)" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "oklch(0.85 0.01 260)", fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fill: "oklch(0.65 0.01 260)", fontSize: 10 }}
                axisLine={false}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke={`url(#${radarStrokeId})`}
                fill={`url(#${radarFillId})`}
                fillOpacity={1}
                strokeWidth={2}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </ChartShell>

      <ChartShell delay={0.12}>
        <SectionHeader
          title="SWOT Distribution"
          icon={PieChartIcon}
          badge="Overview"
          tone="premium"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="h-[240px] md:h-[340px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={swotData}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={96}
                paddingAngle={2.5}
                dataKey="value"
                stroke="oklch(0.18 0.02 260)"
                strokeWidth={2}
              >
                {swotData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2"
        >
          {swotData.map((item, idx) => (
            <div
              key={item.name}
              className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-400 dark:border-slate-700"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-slate-900/50"
                style={{ backgroundColor: item.color || CHART_COLORS[idx] }}
              />
              <span>
                {item.name}: <span className="font-semibold text-slate-200">{item.value}</span>
              </span>
            </div>
          ))}
        </motion.div>
      </ChartShell>
    </div>
  );
}
