import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { problemsApi } from "@/lib/problemsApi";
import { ProblemSummaryItem, ProblemSeverity, ProblemStatus } from "@/types/problems";

export function ProblemsCommandCenter() {
  const [problems, setProblems] = useState<ProblemSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const loadProblems = async () => {
    try {
      setLoading(true);
      const res = await problemsApi.listProblems({ limit: 100 });
      setProblems(res.problems || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load detected business problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleScan = async () => {
    try {
      setScanning(true);
      toast.info("Ingesting multi-channel business context & evaluating detection rules...");
      await problemsApi.syncContext();
      const res = await problemsApi.detectProblems();
      toast.success(`Scan complete! ${res.problems_created} business problem(s) detected.`);
      await loadProblems();
    } catch (err: any) {
      toast.error(err.message || "Problem discovery scan failed");
    } finally {
      setScanning(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = problems.length;
    const critical = problems.filter((p) => p.severity === "CRITICAL").length;
    const high = problems.filter((p) => p.severity === "HIGH").length;
    const active = problems.filter((p) => !["SOLVED", "PARTIALLY_SOLVED"].includes(p.status)).length;
    const solved = problems.filter((p) => p.status === "SOLVED").length;
    const totalImpact = problems
      .filter((p) => p.status !== "SOLVED" && p.estimated_impact_inr)
      .reduce((sum, p) => sum + (p.estimated_impact_inr || 0), 0);

    return { total, critical, high, active, solved, totalImpact };
  }, [problems]);

  // Filtered List
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSeverity = selectedSeverity === "ALL" || p.severity === selectedSeverity;
      const matchStatus = selectedStatus === "ALL" || p.status === selectedStatus;
      const matchCategory = selectedCategory === "ALL" || p.category === selectedCategory;

      return matchSearch && matchSeverity && matchStatus && matchCategory;
    });
  }, [problems, searchQuery, selectedSeverity, selectedStatus, selectedCategory]);

  const getSeverityBadge = (severity: ProblemSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "LOW":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    }
  };

  const getStatusBadge = (status: ProblemStatus) => {
    switch (status) {
      case "SOLVED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "EXECUTING":
      case "VERIFYING":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse";
      case "WAITING_FOR_APPROVAL":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "INVESTIGATING":
      case "PLANNING":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
              Problem Discovery & Resolution Engine
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Find the problem. Understand the problem. Solve the problem. Prove the result.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning Business Health..." : "Scan & Discover Problems"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-6">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Active Issues</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100">{kpis.active}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Requiring action</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-rose-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Critical</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{kpis.critical}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Immediate priority</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-amber-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>High Severity</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{kpis.high}</div>
          <div className="text-[11px] text-zinc-500 mt-1">High attention</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total Discovered</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-100">{kpis.total}</div>
          <div className="text-[11px] text-zinc-500 mt-1">All time</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Certified Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{kpis.solved}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Verified outcome</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
            <span>Revenue at Risk</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-200">
            {kpis.totalImpact > 0 ? `₹${kpis.totalImpact.toLocaleString("en-IN")}` : "₹0"}
          </div>
          <div className="text-[11px] text-indigo-400/70 mt-1">Recoverable sum</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search problems or symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DETECTED">Detected</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="PLANNING">Planning</option>
            <option value="WAITING_FOR_APPROVAL">Waiting Approval</option>
            <option value="EXECUTING">Executing</option>
            <option value="VERIFYING">Verifying</option>
            <option value="SOLVED">Solved</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="REVENUE_LEAKAGE">Revenue Leakage</option>
            <option value="CUSTOMER_CHURN">Customer Churn</option>
            <option value="BOTTLENECK">Bottleneck</option>
            <option value="PRODUCTIVITY">Productivity</option>
            <option value="ANOMALY">Anomaly</option>
            <option value="RISK">Risk</option>
            <option value="GOAL_DEVIATION">Goal Deviation</option>
          </select>
        </div>
      </div>

      {/* Problem Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
          <p className="mt-3 text-sm text-zinc-400">Loading business problem discovery pipeline...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
          <h3 className="mt-3 text-lg font-semibold text-zinc-200">No active business problems match your filter</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Click "Scan & Discover Problems" to analyze your connected data streams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProblems.map((prob) => (
            <Link
              key={prob.id}
              to={`/dashboard/problems/${prob.id}` as any}
              className="group p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all shadow-md block"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(
                        prob.severity
                      )}`}
                    >
                      {prob.severity}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        prob.status
                      )}`}
                    >
                      {prob.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {prob.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                    {prob.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">{prob.summary}</p>
                </div>

                <div className="flex items-center gap-6 self-end lg:self-center">
                  {/* Priority Meter */}
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Priority Score</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                          style={{ width: `${prob.priority_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-zinc-200">{prob.priority_score}/100</span>
                    </div>
                  </div>

                  {/* Impact INR if available */}
                  {prob.estimated_impact_inr && prob.estimated_impact_inr > 0 ? (
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Est. Impact</div>
                      <div className="text-sm font-bold text-rose-400">
                        ₹{prob.estimated_impact_inr.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ) : null}

                  <div className="p-2 rounded-xl bg-zinc-800 group-hover:bg-indigo-600 text-zinc-400 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
