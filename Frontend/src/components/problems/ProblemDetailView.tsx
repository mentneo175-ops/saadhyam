import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  TrendingUp,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  Eye,
  FileText,
  DollarSign,
  Activity,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { problemsApi } from "@/lib/problemsApi";
import {
  ProblemDetail,
  ProblemRootCause,
  ProblemSolution,
  SolutionExecutionPlan,
  ProblemOutcome,
  ROIAssessment,
} from "@/types/problems";

interface ProblemDetailViewProps {
  problemId: number;
}

export function ProblemDetailView({ problemId }: ProblemDetailViewProps) {
  const navigate = useNavigate();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [roi, setRoi] = useState<ROIAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await problemsApi.getProblemDetail(problemId);
      setProblem(res.problem);

      try {
        const roiRes = await problemsApi.getROI(problemId);
        setRoi(roiRes);
      } catch (e) {
        // ROI optional or computed later
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch problem detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (problemId) {
      loadData();
    }
  }, [problemId]);

  // Actions
  const handleAnalyzeRootCause = async () => {
    try {
      setBusyAction("diagnosing");
      toast.info("Analyzing context graph topology and empirical evidence...");
      const res = await problemsApi.analyzeRootCause(problemId);
      toast.success(`Root cause investigation complete: ${res.root_causes_count} cause(s) identified.`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze root cause");
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateSolutions = async () => {
    try {
      setBusyAction("solutions");
      toast.info("Synthesizing solution candidates mapped to Saadhyam capabilities...");
      const res = await problemsApi.generateSolutions(problemId);
      toast.success(`Synthesized ${res.solutions_count} candidate solution(s).`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate solutions");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSelectSolution = async (solutionId: number) => {
    try {
      setBusyAction(`select_${solutionId}`);
      await problemsApi.selectSolution(problemId, solutionId);
      await problemsApi.createExecutionPlan(problemId, solutionId);
      toast.success("Solution selected and execution plan synthesized!");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to select solution");
    } finally {
      setBusyAction(null);
    }
  };

  const handleApprovePlan = async (planId: number) => {
    try {
      setBusyAction(`approve_${planId}`);
      await problemsApi.approvePlan(problemId, planId);
      toast.success("Execution plan approved.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve execution plan");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRejectPlan = async (planId: number) => {
    try {
      setBusyAction(`reject_${planId}`);
      await problemsApi.rejectPlan(problemId, planId, rejectReason || "Rejected by administrator");
      toast.info("Execution plan rejected; returned to planning.");
      setShowRejectModal(null);
      setRejectReason("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject execution plan");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunExecution = async (planId: number) => {
    try {
      setBusyAction(`run_${planId}`);
      toast.info("Dispatching execution steps safely...");
      const res = await problemsApi.runExecutionPlan(problemId, planId);
      toast.success(`Execution completed successfully (${res.steps?.length || 0} steps completed).`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to run execution plan");
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyOutcome = async () => {
    try {
      setBusyAction("verifying");
      toast.info("Measuring before vs after metrics from real business state...");
      const res = await problemsApi.verifyOutcome(problemId);
      toast.success(`Outcome verified: Status '${res.status}' with ${res.improvement_pct}% relative improvement!`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to verify outcome");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex items-center justify-center p-8">
        <div className="text-center">
          <RotateCcw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
          <p className="mt-3 text-sm text-zinc-400">Loading problem command center...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-zinc-100 p-8">
        <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <h2 className="text-lg font-bold text-zinc-200">Problem Not Found</h2>
          <Link
            to="/dashboard/problems"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Problems Command Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/problems"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">PROBLEM #{problem.id}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
                {problem.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">{problem.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {problem.status !== "SOLVED" && (
            <button
              onClick={handleVerifyOutcome}
              disabled={busyAction === "verifying"}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {busyAction === "verifying" ? "Verifying..." : "Verify Outcome"}
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
          <span>Lifecycle Progress</span>
          <span className="text-indigo-400 font-mono">{problem.status}</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {["DETECTED", "INVESTIGATING", "PLANNING", "CONFIRMED", "EXECUTING", "SOLVED"].map((st, idx) => {
            const isCurrent = problem.status === st;
            const isPast =
              ["DETECTED", "INVESTIGATING", "PLANNING", "CONFIRMED", "EXECUTING", "SOLVED"].indexOf(problem.status) >=
              idx;
            return (
              <div key={st} className="space-y-1">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCurrent
                      ? "bg-indigo-500 animate-pulse"
                      : isPast
                      ? "bg-indigo-600"
                      : "bg-zinc-800"
                  }`}
                />
                <div className="text-[10px] text-zinc-500 truncate text-center">{st}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evidence, Observations, Root Causes, Solutions, Executions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Observations */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h3>Observations & Operational Friction</h3>
            </div>

            {problem.observations && problem.observations.length > 0 ? (
              <div className="space-y-3">
                {problem.observations.map((obs) => (
                  <div key={obs.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                    <p className="text-sm text-zinc-200">{obs.observation_text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50 text-xs">
                      <div>
                        <span className="text-zinc-500">Business Impact:</span>{" "}
                        <span className="text-zinc-300">{obs.impact_summary}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Initial Working Theory:</span>{" "}
                        <span className="text-zinc-300">{obs.hypothesis}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No formal observation recorded.</p>
            )}
          </div>

          {/* Section 2: Empirical Evidence */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3>Empirical Evidence Ledger ({problem.evidence?.length || 0})</h3>
              </div>
              <span className="text-[11px] text-zinc-500">Grounded in actual logs & states</span>
            </div>

            <div className="space-y-2">
              {problem.evidence && problem.evidence.length > 0 ? (
                problem.evidence.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                          {ev.source_system.toUpperCase()}
                        </span>
                        <span className="text-zinc-400">{ev.evidence_type}</span>
                      </div>
                      {ev.value_current && (
                        <span className="font-mono text-amber-400">
                          {ev.value_before ? `${ev.value_before} → ` : ""}
                          {ev.value_current}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300">{ev.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic">No evidence items attached.</p>
              )}
            </div>
          </div>

          {/* Section 3: Root Cause Diagnosis */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3>Root Cause Diagnosis</h3>
              </div>

              <button
                onClick={handleAnalyzeRootCause}
                disabled={busyAction === "diagnosing"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-medium transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {busyAction === "diagnosing" ? "Diagnosing..." : "Run AI Diagnosis"}
              </button>
            </div>

            {problem.root_causes && problem.root_causes.length > 0 ? (
              <div className="space-y-3">
                {problem.root_causes.map((rc) => (
                  <div
                    key={rc.id}
                    className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">
                        {rc.is_primary ? "PRIMARY ROOT CAUSE" : "CONTRIBUTING FACTOR"}
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-400">
                        Confidence: {(rc.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-sm font-medium text-zinc-100">{rc.diagnosis}</p>

                    {rc.alternative_causes && rc.alternative_causes.length > 0 && (
                      <div className="pt-2 border-t border-purple-900/40 text-xs text-zinc-400">
                        <span className="text-zinc-500">Alternative Hypotheses:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-zinc-400">
                          {rc.alternative_causes.map((alt, idx) => (
                            <li key={idx}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
                <p className="text-xs text-zinc-500">No root cause diagnosed yet.</p>
                <button
                  onClick={handleAnalyzeRootCause}
                  className="mt-2 text-xs text-purple-400 hover:underline font-medium"
                >
                  Click to investigate root cause
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Recommended Solutions */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3>Actionable Solutions & Capability Matching</h3>
              </div>

              <button
                onClick={handleGenerateSolutions}
                disabled={busyAction === "solutions"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-medium transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {busyAction === "solutions" ? "Generating..." : "Generate Solutions"}
              </button>
            </div>

            {problem.solutions && problem.solutions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {problem.solutions.map((sol) => (
                  <div
                    key={sol.id}
                    className={`p-4 rounded-xl border transition-all ${
                      sol.is_recommended
                        ? "bg-indigo-950/30 border-indigo-500/50"
                        : "bg-zinc-950/60 border-zinc-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sol.is_recommended && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold text-[10px]">
                            RECOMMENDED
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {sol.strategy_type}
                        </span>
                        <span className="text-xs font-medium text-zinc-400">Risk: {sol.risk_level}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">Est. ROI:</span>
                        <span className="font-bold text-emerald-400">{sol.expected_roi_multiplier}x</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-100 mt-2">{sol.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{sol.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-zinc-800/80">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>Required:</span>
                        {sol.required_plugin_keys?.map((pk) => (
                          <span key={pk} className="font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                            {pk}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleSelectSolution(sol.id)}
                        disabled={busyAction === `select_${sol.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                      >
                        {busyAction === `select_${sol.id}` ? "Selecting..." : "Select & Plan Execution"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
                <p className="text-xs text-zinc-500">No solutions generated yet.</p>
                <button
                  onClick={handleGenerateSolutions}
                  className="mt-2 text-xs text-indigo-400 hover:underline font-medium"
                >
                  Click to generate solutions
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Execution Plans & Approvals */}
          {problem.execution_plans && problem.execution_plans.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Play className="w-4 h-4 text-emerald-400" />
                <h3>Execution Plans & Safe Dispatch</h3>
              </div>

              <div className="space-y-4">
                {problem.execution_plans.map((plan) => (
                  <div key={plan.id} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-400">EXECUTION PLAN #{plan.id}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            plan.approval_status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : plan.approval_status === "REJECTED"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                          }`}
                        >
                          {plan.approval_status}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          State: {plan.execution_state}
                        </span>
                      </div>
                    </div>

                    {/* Action Steps */}
                    <div className="space-y-1.5">
                      {plan.execution_steps?.map((step) => (
                        <div
                          key={step.step_id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[10px]">
                              {step.step_id}
                            </span>
                            <span className="text-zinc-200 font-medium">{step.name}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Approval and Run Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                      {plan.approval_status === "PENDING" && (
                        <>
                          <button
                            onClick={() => setShowRejectModal(plan.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-xs font-medium"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprovePlan(plan.id)}
                            disabled={busyAction === `approve_${plan.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Plan
                          </button>
                        </>
                      )}

                      {plan.approval_status === "APPROVED" && plan.execution_state !== "COMPLETED" && (
                        <button
                          onClick={() => handleRunExecution(plan.id)}
                          disabled={busyAction === `run_${plan.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {busyAction === `run_${plan.id}` ? "Executing..." : "Run Execution Plan"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: ROI, Metrics, Outcome Verification Ledger */}
        <div className="space-y-6">
          {/* Priority & Severity Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">Assessment Telemetry</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Priority Score</span>
                  <span className="font-bold text-zinc-100">{problem.priority_score}/100</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                    style={{ width: `${problem.priority_score}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Evidence Confidence</span>
                  <span className="font-bold text-zinc-100">{(problem.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: `${problem.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block">Severity</span>
                  <span className="font-bold text-zinc-200">{problem.severity}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Urgency</span>
                  <span className="font-bold text-zinc-200">{problem.time_sensitivity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROI Assessment Card */}
          {roi && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-zinc-900/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">FINANCIAL ROI ENGINE</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-200">
                  {roi.data_certainty}
                </span>
              </div>

              {roi.total_impact_inr ? (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Total Leaked / Impact:</span>
                    <span className="font-bold text-rose-400">₹{roi.total_impact_inr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Target Recoverable:</span>
                    <span className="font-bold text-emerald-400">₹{roi.recoverable_amount_inr?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Implementation Cost:</span>
                    <span className="font-mono text-zinc-300">₹{roi.implementation_cost_inr?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-indigo-900/50">
                    <span className="font-bold text-zinc-200">Estimated Net Benefit:</span>
                    <span className="font-bold text-emerald-400">₹{roi.net_benefit_inr?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">{roi.explanation}</p>
              )}
            </div>
          )}

          {/* Outcome Verification Ledger */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">Outcome Verification</h3>
              {problem.outcome && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {problem.outcome.status}
                </span>
              )}
            </div>

            {problem.outcome ? (
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Relative Improvement:</span>
                  <span className="font-bold text-emerald-400">{problem.outcome.relative_improvement_pct}%</span>
                </div>
                {problem.outcome.revenue_recovered_inr > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Revenue Recovered:</span>
                    <span className="font-bold text-emerald-400">
                      ₹{problem.outcome.revenue_recovered_inr.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Hours Saved:</span>
                  <span className="font-mono text-zinc-300">{problem.outcome.hours_saved} hrs</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-zinc-400">
                  <p>{problem.outcome.verification_notes}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-zinc-500">
                <p>Outcome not verified yet.</p>
                <button
                  onClick={handleVerifyOutcome}
                  className="mt-2 text-indigo-400 hover:underline font-medium"
                >
                  Verify post-execution outcome
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-zinc-100">Reject Execution Plan</h3>
            <p className="text-xs text-zinc-400">
              Please specify the reason for rejecting this resolution plan to audit the decision.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter audit rejection reason..."
              className="w-full h-24 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectPlan(showRejectModal)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
