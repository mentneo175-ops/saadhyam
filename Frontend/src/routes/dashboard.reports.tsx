import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart3, TrendingUp, Users, Megaphone } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports — Saadhyam AI" }] }),
  component: ReportsPage,
});

const reports = [
  {
    icon: BarChart3,
    name: "Monthly business review",
    date: "Aug 2025 · 24 pages",
    color: "from-purple-500 to-fuchsia-500",
  },
  {
    icon: Megaphone,
    name: "Campaign performance",
    date: "Diwali campaign · 12 pages",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    name: "Customer cohort analysis",
    date: "Q3 2025 · 18 pages",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: TrendingUp,
    name: "Growth & LTV report",
    date: "Last 90 days · 9 pages",
    color: "from-emerald-500 to-teal-500",
  },
];

const trafficData = [
  { d: "Mon", v: 240 },
  { d: "Tue", v: 320 },
  { d: "Wed", v: 280 },
  { d: "Thu", v: 410 },
  { d: "Fri", v: 520 },
  { d: "Sat", v: 480 },
  { d: "Sun", v: 380 },
];
const conversionData = [
  { d: "Mon", v: 2.4 },
  { d: "Tue", v: 3.1 },
  { d: "Wed", v: 2.9 },
  { d: "Thu", v: 3.6 },
  { d: "Fri", v: 4.2 },
  { d: "Sat", v: 4.8 },
  { d: "Sun", v: 4.1 },
];

function ReportsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Auto-generated reports · Download anytime"
        actions={
          <Button variant="hero" size="sm">
            <FileText size={14} /> New report
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reports.map((r) => (
          <div
            key={r.name}
            className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 hover-lift"
          >
            <div
              className={`h-10 w-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4`}
            >
              <r.icon size={18} className="text-white" />
            </div>
            <p className="font-semibold text-sm mb-1">{r.name}</p>
            <p className="text-xs text-muted-foreground mb-4">{r.date}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                View
              </Button>
              <Button variant="hero" size="sm" className="flex-1 text-xs">
                <Download size={12} /> PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
          <p className="font-semibold mb-3">Weekly traffic</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trafficData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.01 290)"
                  vertical={false}
                />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="v" fill="oklch(0.68 0.22 350)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
          <p className="font-semibold mb-3">Conversion rate %</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={conversionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.01 290)"
                  vertical={false}
                />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.55 0.24 295)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "oklch(0.55 0.24 295)", strokeWidth: 2, stroke: "white" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
