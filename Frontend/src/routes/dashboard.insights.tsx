import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/insights")({
  head: () => ({ meta: [{ title: "Insights — Saadhyam AI" }] }),
  component: InsightsPage,
});

const revenue = [
  { m: "Jan", v: 32 },
  { m: "Feb", v: 38 },
  { m: "Mar", v: 42 },
  { m: "Apr", v: 51 },
  { m: "May", v: 58 },
  { m: "Jun", v: 67 },
  { m: "Jul", v: 74 },
  { m: "Aug", v: 82 },
];
const channel = [
  { c: "Instagram", v: 38 },
  { c: "WhatsApp", v: 28 },
  { c: "Email", v: 18 },
  { c: "Website", v: 16 },
];
const split = [
  { name: "Returning", value: 62, color: "oklch(0.55 0.24 295)" },
  { name: "New", value: 28, color: "oklch(0.68 0.22 350)" },
  { name: "Referral", value: 10, color: "oklch(0.78 0.16 65)" },
];

const kpis = [
  { label: "Revenue", v: "₹4.82L", d: "+18.4%" },
  { label: "Orders", v: "1,284", d: "+12.1%" },
  { label: "Avg order value", v: "₹3,752", d: "+5.6%" },
  { label: "Customer LTV", v: "₹14,200", d: "+8.9%" },
];

function InsightsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Insights"
        subtitle="Performance overview · last 30 days"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Calendar size={14} /> Last 30 days
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} /> Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 hover-lift"
          >
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{k.v}</p>
            <p className="text-xs text-success font-semibold mt-1">{k.d}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-soft p-5">
          <p className="font-semibold mb-3">Revenue trend</p>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.22 350)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.68 0.22 350)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.01 290)"
                  vertical={false}
                />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.68 0.22 350)"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
          <p className="font-semibold mb-3">Customer split</p>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={split}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {split.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
        <p className="font-semibold mb-3">Revenue by channel</p>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={channel}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 290)" vertical={false} />
              <XAxis dataKey="c" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="v" fill="oklch(0.55 0.24 295)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
