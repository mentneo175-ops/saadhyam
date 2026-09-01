import { getApiBaseUrl } from "./runtimeUrls";
import {
  ProblemSummaryItem,
  ProblemDetail,
  ProblemRootCause,
  ProblemSolution,
  SolutionExecutionPlan,
  ProblemOutcome,
  ROIAssessment,
} from "../types/problems";

const API_URL = import.meta.env.VITE_API_URL || getApiBaseUrl();

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("saadhyam_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const problemsApi = {
  // Sync Business Context
  async syncContext(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_URL}/api/problems/context/sync`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to synchronize business context");
    return res.json();
  },

  // Trigger Problem Detection
  async detectProblems(): Promise<{ success: boolean; problems_created: number; problems: any[] }> {
    const res = await fetch(`${API_URL}/api/problems/detect`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to run problem detection");
    return res.json();
  },

  // List Problems with filtering
  async listProblems(params?: {
    category?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; count: number; problems: ProblemSummaryItem[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.severity) query.append("severity", params.severity);
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());

    const url = `${API_URL}/api/problems${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch problems");
    return res.json();
  },

  // Get Problem 360-degree Detail
  async getProblemDetail(problemId: number): Promise<{ success: boolean; problem: ProblemDetail }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch problem #${problemId}`);
    return res.json();
  },

  // Trigger Root Cause Analysis
  async analyzeRootCause(problemId: number): Promise<{ success: boolean; root_causes_count: number }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/analyze`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to analyze root cause");
    return res.json();
  },

  // Generate Solution Candidates
  async generateSolutions(problemId: number): Promise<{ success: boolean; solutions_count: number }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/solutions/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to generate solutions");
    return res.json();
  },

  // Select Solution for Execution
  async selectSolution(problemId: number, solutionId: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/solutions/${solutionId}/select`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to select solution");
    return res.json();
  },

  // Calculate / Get ROI Assessment
  async getROI(problemId: number, solutionId?: number): Promise<ROIAssessment> {
    const url = `${API_URL}/api/problems/${problemId}/roi${solutionId ? `?solution_id=${solutionId}` : ""}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to compute ROI");
    return res.json();
  },

  // Create Execution Plan
  async createExecutionPlan(problemId: number, solutionId: number): Promise<{ success: boolean; plan_id: number; approval_status: string }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/executions/plan`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ solution_id: solutionId }),
    });
    if (!res.ok) throw new Error("Failed to create execution plan");
    return res.json();
  },

  // Approve Execution Plan
  async approvePlan(problemId: number, planId: number): Promise<{ success: boolean; approval_status: string }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/executions/${planId}/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to approve execution plan");
    return res.json();
  },

  // Reject Execution Plan
  async rejectPlan(problemId: number, planId: number, reason: string): Promise<{ success: boolean; approval_status: string }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/executions/${planId}/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error("Failed to reject execution plan");
    return res.json();
  },

  // Run Execution Plan
  async runExecutionPlan(problemId: number, planId: number): Promise<{ success: boolean; execution_state: string; steps: any[] }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/executions/${planId}/run`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to execute resolution plan");
    return res.json();
  },

  // Verify Outcome
  async verifyOutcome(problemId: number, currentData?: Record<string, any>): Promise<{ success: boolean; status: string; improvement_pct: number; revenue_recovered_inr: number }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/outcomes/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ current_data: currentData }),
    });
    if (!res.ok) throw new Error("Failed to verify outcome");
    return res.json();
  },
};
