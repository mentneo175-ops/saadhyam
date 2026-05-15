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

type ViewMode = 'daily' | 'monthly';

export function GrowthChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [userTenure, setUserTenure] = useState<number>(0);

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

      const response = await fetch("http://localhost:8000/api/tasks/growth/chart-data?days=90", {
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
        // Calculate user tenure (days since first metric)
        const firstMetricDate = new Date(data.metrics[0].metric_date);
        const today = new Date();
        const tenure = Math.floor((today.getTime() - firstMetricDate.getTime()) / (1000 * 60 * 60 * 24));
        setUserTenure(tenure);
        
        // Determine view mode based on tenure
        const mode: ViewMode = tenure >= 30 ? 'monthly' : 'daily';
        setViewMode(mode);
        console.log(`User tenure: ${tenure} days, View mode: ${mode}`);
        
        // Transform data based on view mode
        const transformedData = mode === 'monthly' 
          ? transformMetricsToMonthlyData(data.metrics)
          : transformMetricsToDailyData(data.metrics);
        
        console.log("Transformed chart data:", transformedData);
        setChartData(transformedData);
      } else {
        // No data yet, show default
        console.log("No metrics data, showing empty state");
        setChartData(getDefaultData());
        setViewMode('daily');
        setUserTenure(0);
      }
    } catch (error) {
      console.error("Error fetching growth data:", error);
      // Fallback to default data on error
      setChartData(getDefaultData());
    } finally {
      setLoading(false);
    }
  };

  const transformMetricsToDailyData = (metrics: GrowthMetric[]): ChartDataPoint[] => {
    const chartPoints: ChartDataPoint[] = [];

    // Show daily data with "Day X" labels
    metrics.forEach((metric, index) => {
      const dayNumber = index + 1;
      
      chartPoints.push({
        label: `Day ${dayNumber}`,
        value: Math.round(metric.growth_score),
        date: metric.metric_date,
        marker: index === metrics.length - 1 ? "Today" : undefined,
      });
    });

    return chartPoints;
  };

  const transformMetricsToMonthlyData = (metrics: GrowthMetric[]): ChartDataPoint[] => {
    // Group metrics by month and calculate average
    const monthlyData: { [key: string]: { scores: number[], date: string } } = {};
    
    metrics.forEach((metric) => {
      const date = new Date(metric.metric_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { scores: [], date: metric.metric_date };
      }
      
      monthlyData[monthKey].scores.push(metric.growth_score);
    });

    // Convert to chart points with month labels
    const chartPoints: ChartDataPoint[] = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, data], index, array) => {
        const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
        const date = new Date(data.date);
        const monthLabel = formatMonthLabel(date);
        
        return {
          label: monthLabel,
          value: Math.round(avgScore),
          date: data.date,
          marker: index === array.length - 1 ? "This Month" : undefined,
        };
      });

    return chartPoints;
  };

  const formatMonthLabel = (date: Date): string => {
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
    <div className="space-y-2">
      {/* View Mode Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-gray-600">
            {viewMode === 'daily' ? '📅 Daily View' : '📊 Monthly View'}
          </div>
          <div className="text-xs text-gray-500">
            {viewMode === 'daily' 
              ? `${userTenure} day${userTenure !== 1 ? 's' : ''} of progress`
              : `${Math.floor(userTenure / 30)} month${Math.floor(userTenure / 30) !== 1 ? 's' : ''} of progress`
            }
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                fontSize: 12,
                backgroundColor: "white",
              }}
              formatter={(value: number) => [`${value}`, "Growth Score"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1e3a8a"
              strokeWidth={2.5}
              fill="url(#growthFill)"
              dot={{ r: 4, fill: "#1e3a8a", strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
