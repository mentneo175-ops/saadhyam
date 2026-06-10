import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { env } from "@/config/env";
import {
  Users,
  Upload,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Heart,
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  Download,
  BarChart3,
  Mail,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/agents/customer-retention")({
  head: () => ({ meta: [{ title: "Customer Retention Agent — Saadhyam AI" }] }),
  component: CustomerRetentionAgentPage,
});

interface CustomerAnalysis {
  retention_score: number;
  total_customers: number;
  loyal_customers: number;
  inactive_customers: number;
  churn_risk_customers: number;
  high_value_customers: number;
  churn_risk_percentage: number;
  segments: {
    loyal: Customer[];
    inactive: Customer[];
    churn_risk: Customer[];
    high_value: Customer[];
  };
  recommendations: string[];
  insights: string[];
}

interface Customer {
  name: string;
  email: string;
  phone?: string;
  last_purchase_date: string;
  total_spent: number;
  visit_count: number;
  inactive_days: number;
  segment: string;
  risk_score?: number;
  email_status?: "pending" | "sending" | "sent" | "failed";
}

function CustomerRetentionAgentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CustomerAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSendOffer = async (customer: Customer) => {
    if (customer.inactive_days < 30) {
      showToast("error", "Customer must be inactive for at least 30 days");
      return;
    }

    setSendingEmail(customer.email);

    try {
      const response = await fetch(`${env.apiBaseUrl}/api/customer-retention/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customer.name,
          customer_email: customer.email,
          inactive_days: customer.inactive_days,
          visit_count: customer.visit_count,
          total_spent: customer.total_spent,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update customer status
        if (analysis) {
          const updatedAnalysis = { ...analysis };
          const inactiveCustomer = updatedAnalysis.segments.inactive.find(
            (c) => c.email === customer.email
          );
          if (inactiveCustomer) {
            inactiveCustomer.email_status = "sent";
          }
          setAnalysis(updatedAnalysis);
        }
        showToast("success", `Retention email sent successfully to ${customer.name}!`);
      } else {
        throw new Error(data.detail || "Failed to send email");
      }
    } catch (err: any) {
      console.error("Error sending email:", err);
      showToast("error", err.message || "Failed to send retention email");
      
      // Update customer status to failed
      if (analysis) {
        const updatedAnalysis = { ...analysis };
        const inactiveCustomer = updatedAnalysis.segments.inactive.find(
          (c) => c.email === customer.email
        );
        if (inactiveCustomer) {
          inactiveCustomer.email_status = "failed";
        }
        setAnalysis(updatedAnalysis);
      }
    } finally {
      setSendingEmail(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a CSV file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${env.apiBaseUrl}/api/customer-retention/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError("Failed to analyze customer data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `customer_name,email,phone,last_purchase_date,total_spent,visit_count,inactive_days
John Doe,john@example.com,+919876543210,2024-01-15,15000,12,120
Jane Smith,jane@example.com,+919876543211,2024-04-20,8500,8,15
Mike Johnson,mike@example.com,+919876543212,2023-08-10,25000,25,240
Sarah Williams,sarah@example.com,+919876543213,2024-05-01,12000,15,5`;

    const blob = new Blob([sampleData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_customers.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Customer Retention Agent</h1>
            <p className="text-gray-600 mt-1">
              Analyze customer behavior, reduce churn, and increase repeat business using AI
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {!analysis && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 dark:bg-slate-900 dark:border-slate-800">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Instructions */}
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <Upload size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Upload Customer Data</h2>
              <p className="text-gray-600">
                Upload a CSV file with your customer data to get AI-powered retention insights
              </p>
            </div>

            {/* CSV Format Info */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 dark:text-slate-100">
                <FileText size={18} className="text-emerald-600" />
                Required CSV Columns
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>customer_name</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>email</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>last_purchase_date</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>total_spent</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>visit_count</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>inactive_days</span>
                </div>
              </div>
              <button
                onClick={downloadSampleCSV}
                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
              >
                <Download size={14} />
                Download Sample CSV
              </button>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer dark:border-slate-700">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1 dark:text-slate-100">
                    {file ? file.name : "Click to upload CSV file"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file ? `${(file.size / 1024).toFixed(2)} KB` : "or drag and drop"}
                  </p>
                </div>
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Retention Analysis</h2>
            <button
              onClick={() => {
                setAnalysis(null);
                setFile(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Analyze New Data
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-100 text-sm font-medium">Retention Score</span>
                <TrendingUp size={20} className="text-emerald-100" />
              </div>
              <div className="text-3xl font-bold">{analysis.retention_score}%</div>
              <p className="text-emerald-100 text-sm mt-1">Overall health score</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Loyal Customers</span>
                <Heart size={20} className="text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{analysis.loyal_customers}</div>
              <p className="text-gray-500 text-sm mt-1">
                {((analysis.loyal_customers / analysis.total_customers) * 100).toFixed(1)}% of total
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Inactive Customers</span>
                <TrendingDown size={20} className="text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{analysis.inactive_customers}</div>
              <p className="text-gray-500 text-sm mt-1">Need re-engagement</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Churn Risk</span>
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                {analysis.churn_risk_percentage}%
              </div>
              <p className="text-gray-500 text-sm mt-1">{analysis.churn_risk_customers} customers</p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center">
                <Sparkles size={20} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">AI Recommendations</h3>
            </div>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white/60 rounded-xl p-4 border border-purple-100">
                  <p className="text-gray-800 leading-relaxed dark:text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inactive Customers Table - NEW SECTION */}
          {analysis.segments.inactive.length > 0 && (
            <div className="bg-white rounded-2xl border border-orange-200 p-6 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Mail size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Inactive Customers</h3>
                  <p className="text-sm text-gray-600">
                    Send AI-powered retention emails to win them back
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Customer Name
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Email
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Inactive Days
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Visit Count
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Total Spent
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Churn Risk
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.segments.inactive.map((customer, idx) => {
                      const churnRisk =
                        customer.inactive_days >= 180
                          ? "Critical"
                          : customer.inactive_days >= 120
                          ? "High"
                          : "Medium";
                      const riskColor =
                        churnRisk === "Critical"
                          ? "bg-red-100 text-red-700"
                          : churnRisk === "High"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700";

                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900 dark:text-slate-100">{customer.name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {customer.inactive_days}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm text-gray-600">{customer.visit_count}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              ₹{customer.total_spent.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${riskColor}`}
                            >
                              {churnRisk}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {customer.email_status === "sent" ? (
                              <div className="flex items-center justify-center gap-2 text-emerald-600">
                                <CheckCircle size={16} />
                                <span className="text-xs font-medium">Sent</span>
                              </div>
                            ) : customer.email_status === "failed" ? (
                              <div className="flex items-center justify-center gap-2 text-red-600">
                                <XCircle size={16} />
                                <span className="text-xs font-medium">Failed</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSendOffer(customer)}
                                disabled={sendingEmail === customer.email}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 mx-auto"
                              >
                                {sendingEmail === customer.email ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    Send Offer
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  <strong>💡 Tip:</strong> Click "Send Offer" to automatically generate and send a
                  personalized retention email with an exclusive discount offer using AI.
                </p>
              </div>
            </div>
          )}

          {/* Customer Segments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Risk Customers */}
            <div className="bg-white rounded-2xl border border-red-200 p-6 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={20} className="text-red-600" />
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Churn Risk Customers</h3>
                <span className="ml-auto text-sm text-gray-500">
                  {analysis.segments.churn_risk.length} customers
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysis.segments.churn_risk.slice(0, 5).map((customer, idx) => (
                  <div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      {customer.risk_score && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                          {customer.risk_score}% risk
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Inactive: {customer.inactive_days} days</div>
                      <div>Spent: ₹{customer.total_spent.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Loyal Customers */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <Heart size={20} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 dark:text-slate-100">Loyal Customers</h3>
                <span className="ml-auto text-sm text-gray-500">
                  {analysis.segments.loyal.length} customers
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysis.segments.loyal.slice(0, 5).map((customer, idx) => (
                  <div key={idx} className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        VIP
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Visits: {customer.visit_count}</div>
                      <div>Spent: ₹{customer.total_spent.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 dark:text-slate-100">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-800 dark:text-slate-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
