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
import { SectionHeader } from "./CompetitorShared";
import { buildLandscapeRadarData, buildIntelligenceDistribution, CHART_COLORS } from "./utils";

export function CompetitorAnalyticsSection({
  competitors,
  patterns,
  gaps,
  ideas,
}: {
  competitors: number;
  patterns: number;
  gaps: number;
  ideas: number;
}) {
  const radarData = buildLandscapeRadarData({ competitors, patterns, gaps, ideas });
  const distributionData = buildIntelligenceDistribution({ competitors, patterns, gaps, ideas });

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Competitive analytics"
        subtitle="Visual overview of your market intelligence"
        icon={BarChart3}
        badge="Analytics"
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          whileHover={{ y: -2 }}
          className="rounded-xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] transition-shadow duration-300 hover:shadow-soft md:p-7"
        >
          <SectionHeader title="Landscape metrics" icon={BarChart3} badge="Radar" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.94 0.01 290)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "oklch(0.5 0.03 280)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fill: "oklch(0.55 0.03 280)", fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="oklch(0.55 0.24 295)"
                  fill="oklch(0.55 0.24 295)"
                  fillOpacity={0.18}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid oklch(0.92 0.01 290)",
                    boxShadow: "var(--shadow-sm)",
                    fontSize: 12,
                    background: "oklch(1 0 0)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35 }}
          whileHover={{ y: -2 }}
          className="rounded-xl border border-border/60 bg-card p-6 shadow-[0_1px_3px_oklch(0.3_0.05_280/0.04)] transition-shadow duration-300 hover:shadow-soft md:p-7"
        >
          <SectionHeader title="Intelligence distribution" icon={PieChartIcon} badge="Overview" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.22, duration: 0.45 }}
            className="h-[280px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="oklch(1 0 0)"
                  strokeWidth={2}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid oklch(0.92 0.01 290)",
                    boxShadow: "var(--shadow-sm)",
                    fontSize: 12,
                    background: "oklch(1 0 0)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {distributionData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color || CHART_COLORS[idx] }}
                />
                <span>
                  {item.name}: <span className="font-medium text-foreground">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
