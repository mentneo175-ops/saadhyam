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

  // ==========================================
  // Opportunities API (Phase 9)
  // ==========================================

  // List Opportunities
  async listOpportunities(params?: {
    category?: string;
    status?: string;
    min_priority?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; count: number; opportunities: ProblemSummaryItem[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.status) query.append("status", params.status);
    if (params?.min_priority !== undefined) query.append("min_priority", params.min_priority.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());

    const url = `${API_URL}/api/opportunities${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch opportunities");
    return res.json();
  },

  // Detect Opportunities
  async detectOpportunities(): Promise<{ success: boolean; count: number; opportunities: any[] }> {
    const res = await fetch(`${API_URL}/api/opportunities/detect`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to detect opportunities");
    return res.json();
  },

  // Get Opportunity Detail
  async getOpportunityDetail(oppId: number): Promise<{ success: boolean; opportunity: ProblemDetail }> {
    const res = await fetch(`${API_URL}/api/opportunities/${oppId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch opportunity #${oppId}`);
    return res.json();
  },

  // Generate Opportunity Solutions
  async generateOpportunitySolutions(oppId: number): Promise<{ success: boolean; solutions: ProblemSolution[] }> {
    const res = await fetch(`${API_URL}/api/opportunities/${oppId}/solutions`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to generate opportunity solutions");
    return res.json();
  },

  // Calculate Opportunity ROI
  async getOpportunityROI(oppId: number, solutionId?: number): Promise<{ success: boolean; roi_assessment: ROIAssessment }> {
    const query = solutionId ? `?solution_id=${solutionId}` : "";
    const res = await fetch(`${API_URL}/api/opportunities/${oppId}/roi${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to calculate opportunity ROI");
    return res.json();
  },

  // ==========================================
  // Phase 10: Natural-Language Investigation
  // ==========================================

  // Investigate Problem
  async investigateProblem(problemId: number, question: string): Promise<{ success: boolean; investigation: any }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/investigate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Failed to run problem investigation");
    return res.json();
  },

  // Investigate Opportunity
  async investigateOpportunity(oppId: number, question: string): Promise<{ success: boolean; investigation: any }> {
    const res = await fetch(`${API_URL}/api/opportunities/${oppId}/investigate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Failed to run opportunity investigation");
    return res.json();
  },

  // ==========================================
  // Phase 11: Closed-Loop Learning & Replanning
  // ==========================================

  // Get Learning Record
  async getProblemLearning(problemId: number): Promise<{ success: boolean; has_learning_record: boolean; learning_record?: any; message?: string }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/learning`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch problem learning record");
    return res.json();
  },

  // Replan Problem
  async replanProblem(problemId: number): Promise<{ success: boolean; problem_id: number; revised_solutions_count: number; recommended_solution: any; safety_notice: string }> {
    const res = await fetch(`${API_URL}/api/problems/${problemId}/replan`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to trigger closed-loop replanning");
    return res.json();
  },

  // Get Learning Insights
  async getLearningInsights(category?: string): Promise<{ success: boolean; insights: any }> {
    const query = category ? `?category=${category}` : "";
    const res = await fetch(`${API_URL}/api/problems/learning/insights${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch learning insights");
    return res.json();
  },
};
