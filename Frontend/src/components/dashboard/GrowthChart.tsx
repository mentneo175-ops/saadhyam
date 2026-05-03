import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { label: "Jan", value: 32, marker: "Past" },
  { label: "Feb", value: 38 },
  { label: "Mar", value: 45 },
  { label: "Apr", value: 52 },
  { label: "May", value: 61 },
  { label: "Jun", value: 70, marker: "Today" },
  { label: "Jul", value: 78 },
  { label: "Aug", value: 85 },
  { label: "Sep", value: 92, marker: "Goal" },
];

export function GrowthChart() {
  return (
    <div className="h-64 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.55 0.24 295)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 290)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "oklch(0.5 0.03 280)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "oklch(0.5 0.03 280)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid oklch(0.92 0.01 290)",
              boxShadow: "0 12px 40px -12px oklch(0.3 0.05 280 / 0.18)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="oklch(0.55 0.24 295)"
            strokeWidth={2.5}
            fill="url(#growthFill)"
            dot={{ r: 4, fill: "oklch(0.55 0.24 295)", strokeWidth: 2, stroke: "white" }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
