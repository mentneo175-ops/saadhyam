import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  Map,
  CheckCircle2,
  RefreshCw,
  Clock,
  Building2,
  MapPin,
  Briefcase,
  Loader2,
  TrendingDown,
  Users,
  BarChart3,
  Activity,
  Download,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  getBusinessAnalysisData,
  getAnalysisStatus,
  triggerComprehensiveAnalysis,
  pollAnalysisStatus,
  type BusinessAnalysisData,
  type AnalysisStatus,
} from "@/lib/comprehensiveAnalysisApi";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard/business-analysis")({
  head: () => ({ meta: [{ title: "Business Analysis — Saadhyam AI" }] }),
  component: BusinessAnalysisPage,
});

function BusinessAnalysisPage() {
  const [analysis, setAnalysis] = useState<BusinessAnalysisData | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare chart data - MUST be at top level before any returns
  const businessMetricsData = useMemo(() => {
    if (!analysis) return [];
    
    return [
      {
        category: "Strengths",
        value: analysis.strengths?.length || 0,
        fullMark: 10,
      },
      {
        category: "Opportunities",
        value: analysis.growth_opportunities?.length || 0,
        fullMark: 10,
      },
      {
        category: "Market Fit",
        value: analysis.health_score ? Math.floor(analysis.health_score / 10) : 5,
        fullMark: 10,
      },
      {
        category: "Services",
        value: analysis.business_details?.services?.length || 0,
        fullMark: 10,
      },
    ];
  }, [analysis]);

  const swotData = useMemo(() => {
    if (!analysis) return [];
    
    return [
      { name: "Strengths", value: analysis.strengths?.length || 0, color: "#10b981" },
      { name: "Weaknesses", value: analysis.weaknesses?.length || 0, color: "#ef4444" },
      { name: "Opportunities", value: analysis.growth_opportunities?.length || 0, color: "#8b5cf6" },
    ];
  }, [analysis]);

  const COLORS = ["#10b981", "#ef4444", "#8b5cf6"];

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  // Load analysis status and data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();

      // Check status first
      const statusResult = await getAnalysisStatus(token);
      setStatus(statusResult);

      // If completed, load the data
      if (statusResult.status === "completed") {
        const data = await getBusinessAnalysisData(token);
        setAnalysis(data);
      } else if (statusResult.status === "analyzing") {
        // If analyzing, start polling
        setIsAnalyzing(true);
        pollAnalysisStatus(token, (updatedStatus) => {
          setStatus(updatedStatus);
        })
          .then(async () => {
            // Analysis completed, load data
            const data = await getBusinessAnalysisData(token);
            setAnalysis(data);
            setIsAnalyzing(false);
          })
          .catch((err) => {
            setError(err.message);
            setIsAnalyzing(false);
          });
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load business analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const token = getToken();

      // Trigger analysis
      await triggerComprehensiveAnalysis(token);

      // Start polling for status
      await pollAnalysisStatus(token, (updatedStatus) => {
        setStatus(updatedStatus);
      });

      // Load the completed analysis
      const data = await getBusinessAnalysisData(token);
      setAnalysis(data);
    } catch (err: any) {
      console.error("Error analyzing:", err);
      setError(err.message || "Failed to analyze business");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!analysis) return;

    // Create a new window with the report content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF report');
      return;
    }

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Business Analysis Report - ${analysis.business_details?.business_name || 'Business'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 40px;
              background: white;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              font-weight: bold;
              color: rgba(139, 92, 246, 0.08);
              z-index: -1;
              pointer-events: none;
              white-space: nowrap;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #8b5cf6;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #8b5cf6;
              margin-bottom: 10px;
            }
            .report-title {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .report-date {
              color: #6b7280;
              font-size: 14px;
            }
            .business-overview {
              background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .business-overview h2 {
              font-size: 24px;
              margin-bottom: 15px;
            }
            .business-info {
              display: flex;
              gap: 20px;
              flex-wrap: wrap;
              margin-top: 15px;
            }
            .business-info-item {
              background: rgba(255, 255, 255, 0.2);
              padding: 10px 15px;
              border-radius: 8px;
              font-size: 14px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .metric-card {
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .metric-value {
              font-size: 36px;
              font-weight: bold;
              color: #8b5cf6;
              margin-bottom: 5px;
            }
            .metric-label {
              font-size: 14px;
              color: #6b7280;
              font-weight: 600;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e5e7eb;
            }
            .section-icon {
              display: inline-block;
              width: 24px;
              height: 24px;
              margin-right: 10px;
              vertical-align: middle;
            }
            .list-item {
              background: #f9fafb;
              padding: 12px 15px;
              margin-bottom: 10px;
              border-radius: 8px;
              border-left: 4px solid #8b5cf6;
            }
            .strengths .list-item { border-left-color: #10b981; }
            .weaknesses .list-item { border-left-color: #ef4444; }
            .opportunities .list-item { border-left-color: #8b5cf6; }
            .insights-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .insight-box {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .insight-title {
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .insight-content {
              color: #4b5563;
              font-size: 13px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .footer-logo {
              font-size: 18px;
              font-weight: bold;
              color: #8b5cf6;
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 20px; }
              .watermark { font-size: 100px; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">MENTNEO</div>
          
          <div class="header">
            <div class="logo">MENTNEO</div>
            <div class="report-title">Business Analysis Report</div>
            <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

          <div class="business-overview">
            <h2>${analysis.business_details?.business_name || 'Business'}</h2>
            <div class="business-info">
              <div class="business-info-item">📍 ${analysis.business_details?.location || 'N/A'}</div>
              <div class="business-info-item">🏢 ${analysis.business_details?.business_type || 'N/A'}</div>
              ${analysis.health_score ? `<div class="business-info-item">💯 Health Score: ${analysis.health_score}/100</div>` : ''}
            </div>
            ${analysis.business_details?.summary ? `<p style="margin-top: 15px; font-size: 14px; line-height: 1.6;">${analysis.business_details.summary}</p>` : ''}
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${analysis.strengths?.length || 0}</div>
              <div class="metric-label">Strengths</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analysis.weaknesses?.length || 0}</div>
              <div class="metric-label">Weaknesses</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analysis.growth_opportunities?.length || 0}</div>
              <div class="metric-label">Opportunities</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analysis.business_details?.services?.length || 0}</div>
              <div class="metric-label">Services</div>
            </div>
          </div>

          ${analysis.strengths && analysis.strengths.length > 0 ? `
          <div class="section strengths">
            <h3 class="section-title">✅ Strengths</h3>
            ${analysis.strengths.map(item => `<div class="list-item">${item}</div>`).join('')}
          </div>
          ` : ''}

          ${analysis.weaknesses && analysis.weaknesses.length > 0 ? `
          <div class="section weaknesses">
            <h3 class="section-title">⚠️ Weaknesses</h3>
            ${analysis.weaknesses.map(item => `<div class="list-item">${item}</div>`).join('')}
          </div>
          ` : ''}

          ${analysis.growth_opportunities && analysis.growth_opportunities.length > 0 ? `
          <div class="section opportunities">
            <h3 class="section-title">🎯 Growth Opportunities</h3>
            ${analysis.growth_opportunities.map(item => `<div class="list-item">${item}</div>`).join('')}
          </div>
          ` : ''}

          ${analysis.local_market_insights ? `
          <div class="section">
            <h3 class="section-title">🗺️ Local Market Insights</h3>
            <div class="insights-grid">
              ${analysis.local_market_insights.local_demand ? `
              <div class="insight-box">
                <div class="insight-title">Local Demand</div>
                <div class="insight-content">${analysis.local_market_insights.local_demand}</div>
              </div>
              ` : ''}
              ${analysis.local_market_insights.customer_behavior ? `
              <div class="insight-box">
                <div class="insight-title">Customer Behavior</div>
                <div class="insight-content">${analysis.local_market_insights.customer_behavior}</div>
              </div>
              ` : ''}
              ${analysis.local_market_insights.competition_level ? `
              <div class="insight-box">
                <div class="insight-title">Competition Level</div>
                <div class="insight-content">${analysis.local_market_insights.competition_level}</div>
              </div>
              ` : ''}
              ${analysis.local_market_insights.trending_services && analysis.local_market_insights.trending_services.length > 0 ? `
              <div class="insight-box">
                <div class="insight-title">Trending Services</div>
                <div class="insight-content">${analysis.local_market_insights.trending_services.join(', ')}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <div class="footer-logo">MENTNEO</div>
            <div>AI-Powered Business Intelligence Platform</div>
            <div style="margin-top: 5px;">This report was generated using real-time market data and AI analysis</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  // Analyzing state
  if (isAnalyzing || status?.status === "analyzing") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={48} className="animate-spin text-purple-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Analyzing your business...</p>
          <p className="text-sm text-gray-600 mt-2">This may take 2-3 minutes</p>
          <p className="text-xs text-gray-500 mt-1">Using Google AI Studio Gemini with Search Grounding</p>
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <p className="text-sm text-blue-900 text-center">
              💡 We're making ONE comprehensive API call to gather all your business insights.
              After this, all pages will load instantly with no rate limits!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not started state
  if (!analysis && status?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
            <Sparkles size={40} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Analyze Your Business?</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Get comprehensive AI-powered insights including strengths, weaknesses, opportunities, and local market analysis.
          </p>
          <Button variant="hero" size="lg" onClick={handleAnalyze}>
            <Sparkles size={20} />
            Analyze My Business
          </Button>
          <p className="text-xs text-gray-500 mt-4">Takes 2-3 minutes • Powered by Google AI Studio Gemini</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="Business Analysis"
          subtitle="AI-powered insights for your business"
        />
        <div className="bg-red-50 border-red-200 border rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</p>
          <p className="text-red-700 mb-4">{error}</p>
          <Button variant="hero" onClick={handleAnalyze}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Success state - show interactive dashboard
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Analysis</h1>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600 flex-shrink-0" />
              <span>AI-powered insights from Google Search grounding</span>
            </p>
            {analysis?.last_updated && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock size={12} className="flex-shrink-0" />
                <span>Last updated: {new Date(analysis.last_updated).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={16} />
            <span>Download Report</span>
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw size={14} className={isAnalyzing ? "animate-spin" : ""} />
            <span>Re-analyze</span>
          </Button>
        </div>
      </div>

      {/* Business Overview Card - Full Width */}
      {analysis?.business_details && (
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Building2 size={32} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-2 break-words">{analysis.business_details.business_name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <Briefcase size={16} className="flex-shrink-0" />
                    <span>{analysis.business_details.business_type}</span>
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span>{analysis.business_details.location}</span>
                  </span>
                </div>
              </div>
            </div>
            {analysis.health_score !== undefined && (
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 flex-shrink-0">
                <div className="text-4xl font-bold leading-none">{analysis.health_score}</div>
                <div className="text-xs text-white/80 mt-1 whitespace-nowrap">Health Score</div>
              </div>
            )}
          </div>
          {analysis.business_details.services && analysis.business_details.services.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-white/80 mb-2">Services Offered</p>
              <div className="flex flex-wrap gap-2">
                {analysis.business_details.services.map((service, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium whitespace-nowrap">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.business_details.summary && (
            <p className="text-sm text-white/90 leading-relaxed mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              {analysis.business_details.summary}
            </p>
          )}
        </div>
      )}

      {/* Key Metrics Grid - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Strengths Count */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-emerald-700 leading-none">
                {analysis?.strengths?.length || 0}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-900 mb-1">Strengths</h3>
            <p className="text-xs text-emerald-700">Key advantages identified</p>
          </div>
        </div>

        {/* Weaknesses Count */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={24} className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-red-700 leading-none">
                {analysis?.weaknesses?.length || 0}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900 mb-1">Weaknesses</h3>
            <p className="text-xs text-red-700">Areas to improve</p>
          </div>
        </div>

        {/* Opportunities Count */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
              <Target size={24} className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-700 leading-none">
                {analysis?.growth_opportunities?.length || 0}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-purple-900 mb-1">Opportunities</h3>
            <p className="text-xs text-purple-700">Growth potential</p>
          </div>
        </div>

        {/* Services Count */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Activity size={24} className="text-white" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-700 leading-none">
                {analysis?.business_details?.services?.length || 0}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-900 mb-1">Services</h3>
            <p className="text-xs text-blue-700">Offerings available</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Metrics Radar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Business Metrics</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={businessMetricsData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* SWOT Distribution Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Activity size={20} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">SWOT Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={swotData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {swotData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis Grid - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {analysis?.strengths && analysis.strengths.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">Strengths</h3>
            </div>
            <div className="space-y-3">
              {analysis.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {analysis?.weaknesses && analysis.weaknesses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Weaknesses</h3>
            </div>
            <div className="space-y-3">
              {analysis.weaknesses.map((weakness, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Opportunities */}
        {analysis?.growth_opportunities && analysis.growth_opportunities.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target size={20} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Growth Opportunities</h3>
            </div>
            <div className="space-y-3">
              {analysis.growth_opportunities.map((opportunity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{opportunity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Market Insights */}
        {analysis?.local_market_insights && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Map size={20} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Local Market Insights</h3>
            </div>
            <div className="space-y-4">
              {analysis.local_market_insights.local_demand && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <Users size={14} />
                    Local Demand
                  </h4>
                  <p className="text-sm text-gray-700">{analysis.local_market_insights.local_demand}</p>
                </div>
              )}
              {analysis.local_market_insights.customer_behavior && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <Activity size={14} />
                    Customer Behavior
                  </h4>
                  <p className="text-sm text-gray-700">{analysis.local_market_insights.customer_behavior}</p>
                </div>
              )}
              {analysis.local_market_insights.competition_level && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Competition Level
                  </h4>
                  <p className="text-sm text-gray-700">{analysis.local_market_insights.competition_level}</p>
                </div>
              )}
              {analysis.local_market_insights.trending_services && analysis.local_market_insights.trending_services.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Sparkles size={14} />
                    Trending Services
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.local_market_insights.trending_services.map((service, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
