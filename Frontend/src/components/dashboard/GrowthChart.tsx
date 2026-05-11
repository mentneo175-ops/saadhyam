import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiClient } from "@/lib/api";

interface GrowthMetric {
  metric_date: string;
  growth_score: number;
  tasks_completed: number;
  tasks_assigned: number;
  completion_rate: number;
  streak_days: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  marker?: string;
  date?: string;
}

export function GrowthChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();

    // Listen for task completion events to refresh chart
    const handleTaskCompleted = () => {
      console.log("Task completed - refreshing growth chart");
      fetchGrowthData();
    };

    window.addEventListener("taskCompleted", handleTaskCompleted);

    return () => {
      window.removeEventListener("taskCompleted", handleTaskCompleted);
    };
  }, []);

  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      
      if (!token) {
        // Use default data if not authenticated
        setChartData(getDefaultData());
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/tasks/growth/chart-data?days=30", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch growth data");
      }

      const data = await response.json();
      console.log("Growth chart data received:", data);
      
      if (data.metrics && data.metrics.length > 0) {
        // Transform real data into chart format
        const transformedData = transformMetricsToChartData(data.metrics);
        console.log("Transformed chart data:", transformedData);
        setChartData(transformedData);
      } else {
        // No data yet, show default
        console.log("No metrics data, showing empty state");
        setChartData(getDefaultData());
      }
    } catch (error) {
      console.error("Error fetching growth data:", error);
      // Fallback to default data on error
      setChartData(getDefaultData());
    } finally {
      setLoading(false);
    }
  };

  const transformMetricsToChartData = (metrics: GrowthMetric[]): ChartDataPoint[] => {
    const today = new Date();
    const chartPoints: ChartDataPoint[] = [];

    // Process historical data (last 30 days)
    metrics.forEach((metric, index) => {
      const date = new Date(metric.metric_date);
      const label = formatDateLabel(date);
      
      chartPoints.push({
        label,
        value: Math.round(metric.growth_score),
        date: metric.metric_date,
        marker: index === metrics.length - 1 ? "Today" : undefined,
      });
    });

    // Add projection for next 30 days if we have enough data
    if (metrics.length >= 7) {
      const recentMetrics = metrics.slice(-7);
      const avgGrowth = recentMetrics.reduce((sum, m, i, arr) => {
        if (i === 0) return 0;
        return sum + (m.growth_score - arr[i - 1].growth_score);
      }, 0) / (recentMetrics.length - 1);

      const lastScore = metrics[metrics.length - 1].growth_score;
      const projectionDays = 30;
      
      for (let i = 1; i <= projectionDays; i += 5) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + i);
        
        const projectedScore = Math.min(
          100,
          Math.max(0, lastScore + (avgGrowth * i))
        );
        
        chartPoints.push({
          label: formatDateLabel(futureDate),
          value: Math.round(projectedScore),
          marker: i === projectionDays ? "Goal" : undefined,
        });
      }
    }

    return chartPoints;
  };

  const formatDateLabel = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[date.getMonth()];
  };

  const getDefaultData = (): ChartDataPoint[] => {
    // Return empty array - no dummy data
    return [];
  };

  if (loading) {
    return (
      <div className="h-64 -mx-2 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading growth data...</div>
      </div>
    );
  }

  // If no data, show empty state
  if (chartData.length === 0) {
    return (
      <div className="h-64 -mx-2 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">No growth data yet</p>
          <p className="text-xs text-gray-500">Complete daily tasks to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
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
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid oklch(0.92 0.01 290)",
              boxShadow: "0 12px 40px -12px oklch(0.3 0.05 280 / 0.18)",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}`, "Growth Score"]}
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
