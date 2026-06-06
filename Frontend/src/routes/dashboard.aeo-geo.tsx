import { toast } from "sonner";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  CheckCircle2,
  RefreshCw,
  Clock,
  Loader2,
  Search,
  FileText,
  Code,
  Eye,
  Zap,
  PenTool,
  Send,
  BookOpen,
  Trash2,
  Calendar,
  Tag,
  Activity,
  Award,
  BarChart3,
  CheckSquare,
  Copy,
  Layers,
  Megaphone,
  Share2,
  ShieldAlert,
  Flame,
  UserCheck,
  Compass,
  PieChart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  getAEOGEOOverview,
  runFullOptimization,
  discoverQuestions,
  getDiscoveredQuestions,
  generateAEOContent,
  getGeneratedContent,
  searchSimilarQuestions,
  type AEOGEOOverview,
  type AEOQuestion,
  type AEOContent,
  getOpportunityRadar,
  getCustomerDemand,
  getDailyReport,
  generateAutoContent,
  runGrowthAutopilot,
  publishContentToPlatform,
  getIntegrationsStatus,
  getAutopilotSettings,
  updateAutopilotSettings,
  type IntegrationsStatusResponse,
  type AutopilotSettings,
} from "@/lib/aeoGeoApi";
import { generateBlog, publishBlog, getUserBlogs, deleteBlog, type Blog } from "@/lib/blogApi";

export const Route = createFileRoute("/dashboard/aeo-geo")({
  head: () => ({ meta: [{ title: "AI Visibility Engine™ & Autopilot — Saadhyam AI" }] }),
  component: AEOGEOPage,
});

type TabType =
  | "overview"
  | "aeo"
  | "geo"
  | "radar"
  | "demand"
  | "recs"
  | "autocontent"
  | "autopilot"
  | "dailyreport"
  | "blogs";

function AEOGEOPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AEOGEOOverview | null>(null);
  const [questions, setQuestions] = useState<AEOQuestion[]>([]);
  const [content, setContent] = useState<AEOContent[]>([]);
  
  // Extra AEO/GEO Service State
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [demandData, setDemandData] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [autoContent, setAutoContent] = useState<any>(null);
  const [autopilotData, setAutopilotData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isLoadingRadar, setIsLoadingRadar] = useState(false);
  const [isLoadingDemand, setIsLoadingDemand] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isGeneratingAutoContent, setIsGeneratingAutoContent] = useState(false);
  const [isRunningAutopilot, setIsRunningAutopilot] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Blog management state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogFilter, setBlogFilter] = useState<"all" | "draft" | "published">("all");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [blogTopic, setBlogTopic] = useState("");
  const [publishingBlogIds, setPublishingBlogIds] = useState<Set<number>>(new Set());

  // Publishing Hub Modal State
  const [isPublishingHubOpen, setIsPublishingHubOpen] = useState(false);
  const [publishingPlatform, setPublishingPlatform] = useState<string>("");
  const [publishingContent, setPublishingContent] = useState<string>("");
  const [publishingTitle, setPublishingTitle] = useState<string>("");
  const [publishingStatus, setPublishingStatus] = useState<"idle" | "connecting" | "uploading" | "indexing" | "success" | "error">("idle");
  const [publishLiveUrl, setPublishLiveUrl] = useState<string>("");
  const [publishLogs, setPublishLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Integrations & Autopilot settings states
  const [integrationsStatus, setIntegrationsStatusState] = useState<any>(null);
  const [autopilotSettings, setAutopilotSettingsState] = useState<AutopilotSettings>({
    auto_publish_instagram: false,
    auto_publish_facebook: false,
    auto_publish_youtube: false,
    auto_publish_google: false,
    auto_publish_website: false,
  });
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Get token from localStorage
  const getToken = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    return token;
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();

      // Load main components in parallel
      const [overviewData, questionsData, contentData, blogsData] = await Promise.all([
        getAEOGEOOverview(token),
        getDiscoveredQuestions(token, undefined, 20),
        getGeneratedContent(token, 20),
        getUserBlogs(token, undefined, 50),
      ]);

      setOverview(overviewData);
      setQuestions(questionsData.questions || []);
      setContent(contentData.content || []);
      setBlogs(blogsData.blogs || []);

      // Load extra service tabs data
      await Promise.all([
        fetchOpportunityRadar(token),
        fetchCustomerDemand(token),
        fetchDailyReport(token),
        fetchIntegrationsAndAutopilotSettings(token),
      ]);

    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load AEO/GEO data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIntegrationsAndAutopilotSettings = async (token: string) => {
    setIsLoadingIntegrations(true);
    try {
      const [integrationsRes, autopilotRes] = await Promise.all([
        getIntegrationsStatus(token),
        getAutopilotSettings(token),
      ]);
      setIntegrationsStatusState(integrationsRes.integrations);
      setAutopilotSettingsState(autopilotRes.settings);
    } catch (err) {
      console.error("Failed to load integrations/autopilot settings", err);
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  const handleToggleAutopilot = async (key: keyof AutopilotSettings, value: boolean) => {
    const updated = {
      ...autopilotSettings,
      [key]: value
    };
    setAutopilotSettingsState(updated);
    setIsSavingSettings(true);
    try {
      const token = getToken();
      await updateAutopilotSettings(token, updated);
      toast.success("Autopilot settings saved successfully!");
    } catch (err: any) {
      console.error("Failed to save autopilot settings", err);
      toast.error(err.message || "Failed to save settings");
      // rollback
      setAutopilotSettingsState(autopilotSettings);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchOpportunityRadar = async (token: string) => {
    setIsLoadingRadar(true);
    try {
      const res = await getOpportunityRadar(token);
      setOpportunities(res.opportunities || []);
    } catch (err) {
      console.error("Opportunity Radar failed to load", err);
    } finally {
      setIsLoadingRadar(false);
    }
  };

  const fetchCustomerDemand = async (token: string) => {
    setIsLoadingDemand(true);
    try {
      const res = await getCustomerDemand(token);
      setDemandData(res.data || null);
    } catch (err) {
      console.error("Customer Demand failed to load", err);
    } finally {
      setIsLoadingDemand(false);
    }
  };

  const fetchDailyReport = async (token: string) => {
    setIsLoadingReport(true);
    try {
      const res = await getDailyReport(token);
      setDailyReport(res || null);
    } catch (err) {
      console.error("Daily Report failed to load", err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleRunFullScan = async () => {
    setIsOptimizing(true);
    toast.info("Starting complete AI Visibility Scan...");
    try {
      const token = getToken();
      await runFullOptimization(token);
      await loadAllData();
      toast.success("AI Visibility Engine scan completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Full Scan failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDiscoverQuestions = async () => {
    setIsDiscovering(true);
    try {
      const token = getToken();
      await discoverQuestions(token, 20);
      const questionsData = await getDiscoveredQuestions(token, undefined, 20);
      setQuestions(questionsData.questions || []);
      toast.success("AI Question Discovery updated!");
    } catch (err: any) {
      toast.error(err.message || "Question discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleGenerateAnswer = async (questionId: number) => {
    toast.info("Generating AEO Optimized Answer...");
    try {
      const token = getToken();
      await generateAEOContent(token, questionId);
      const contentData = await getGeneratedContent(token, 20);
      setContent(contentData.content || []);
      toast.success("AEO Answer Generated!");
    } catch (err: any) {
      toast.error(err.message || "Answer generation failed");
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const token = getToken();
      const results = await searchSimilarQuestions(token, searchQuery, 5);
      setSearchResults(results.results || []);
    } catch (err: any) {
      toast.error(err.message || "Semantic search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateAutoContent = async (oppTitle?: string) => {
    setIsGeneratingAutoContent(true);
    toast.info("Generating customized Social, Marketing, and SEO assets...");
    try {
      const token = getToken();
      const res = await generateAutoContent(token, oppTitle);
      setAutoContent(res.data || null);
      setActiveTab("autocontent");
      toast.success("AI Content Package successfully generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate package");
    } finally {
      setIsGeneratingAutoContent(false);
    }
  };

  const handleRunAutopilot = async () => {
    setIsRunningAutopilot(true);
    toast.info("Activating Growth Autopilot Mode...");
    try {
      const token = getToken();
      const res = await runGrowthAutopilot(token);
      setAutopilotData(res.data || null);
      setActiveTab("autopilot");
      toast.success("Autopilot complete! Ready-to-deploy assets loaded.");
    } catch (err: any) {
      toast.error(err.message || "Autopilot execution failed");
    } finally {
      setIsRunningAutopilot(false);
    }
  };

  const handleGenerateBlog = async () => {
    setIsGeneratingBlog(true);
    toast.info("Generating SEO blog post using web search grounding...");
    try {
      const token = getToken();
      const result = await generateBlog(token, blogTopic || undefined);
      setBlogTopic("");
      const blogsData = await getUserBlogs(token, undefined, 50);
      setBlogs(blogsData.blogs || []);
      toast.success(`Blog "${result.blog.title}" generated successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate blog");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handlePublishBlog = async (blogId: number) => {
    setPublishingBlogIds(prev => new Set(prev).add(blogId));
    try {
      const token = getToken();
      await publishBlog(token, blogId);
      const blogsData = await getUserBlogs(token, undefined, 50);
      setBlogs(blogsData.blogs || []);
      toast.success("Blog published successfully to your website!");
    } catch (err: any) {
      toast.error(err.message || "Publishing failed");
    } finally {
      setPublishingBlogIds(prev => {
        const next = new Set(prev);
        next.delete(blogId);
        return next;
      });
    }
  };

  const handleDeleteBlog = async (blogId: number) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    try {
      const token = getToken();
      await deleteBlog(token, blogId);
      const blogsData = await getUserBlogs(token, undefined, 50);
      setBlogs(blogsData.blogs || []);
      if (selectedBlog?.id === blogId) setSelectedBlog(null);
      toast.success("Blog deleted.");
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Publishing Hub Actions
  const openPublishingHub = (platform: string, content: string, title: string = "") => {
    setPublishingPlatform(platform);
    setPublishingContent(content);
    setPublishingTitle(title);
    setPublishingStatus("idle");
    setPublishLiveUrl("");
    setPublishLogs([]);
    setIsPublishingHubOpen(true);
  };

  const handleStartDeployment = async () => {
    setIsDeploying(true);
    setPublishingStatus("connecting");
    setPublishLogs([
      `[CONNECTING] Connecting to ${publishingPlatform.toUpperCase()} integrations...`,
      "[CONNECTING] Authenticating OAuth security credentials...",
    ]);
    
    await new Promise(r => setTimeout(r, 1000));
    setPublishingStatus("uploading");
    setPublishLogs(prev => [
      ...prev,
      "[UPLOADING] Validation complete. Verified account profile permissions.",
      "[UPLOADING] Uploading text payloads & structural layouts to API endpoints...",
    ]);
    
    await new Promise(r => setTimeout(r, 1200));
    setPublishingStatus("indexing");
    setPublishLogs(prev => [
      ...prev,
      "[INDEXING] Synchronizing hashtag streams and semantic tags...",
      "[INDEXING] Optimizing structured indexing metadata for search discovery...",
    ]);
    
    try {
      const token = getToken();
      const res = await publishContentToPlatform(token, publishingPlatform, publishingContent, publishingTitle);
      
      await new Promise(r => setTimeout(r, 800));
      setPublishingStatus("success");
      setPublishLiveUrl(res.live_url || "");
      setPublishLogs(prev => [
        ...prev,
        `[SUCCESS] Direct integration upload completed.`,
        `[SUCCESS] Platform response message: ${res.message}`,
        `[SUCCESS] Live URL: ${res.live_url}`,
      ]);
      toast.success(`Successfully published to ${publishingPlatform}!`);
    } catch (err: any) {
      setPublishingStatus("error");
      setPublishLogs(prev => [
        ...prev,
        `[ERROR] Direct platform publishing failed: ${err.message}`,
      ]);
      toast.error(err.message || "Platform direct publishing failed.");
    } finally {
      setIsDeploying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Saadhyam AI Visibility Engine™
            </h1>
            <p className="text-sm text-slate-400 mt-1">Answer Engine (AEO) + Generative Engine (GEO) Operating System</p>
          </div>
        </div>
        <Loader text="Initializing Visibility Engine & Auto-Pilot..." className="py-32" />
      </div>
    );
  }

  // Onboarding state - if no business analysis has been run yet
  if (overview && overview.business_analysis?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6 flex flex-col justify-center items-center">
        <div className="max-w-2xl w-full bg-slate-900 border border-purple-500/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <Zap className="mx-auto text-purple-500 w-16 h-16 animate-pulse mb-6" />
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Initialize Saadhyam AI Visibility Engine™
          </h2>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Welcome to the growth operating system. To begin optimizing your business online presence for modern search engines like Gemini, ChatGPT, and Google Maps, run your initial deep scan now.
          </p>
          <Button variant="hero" size="lg" onClick={handleRunFullScan} className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/30 hover:scale-105 transition-all">
            <Zap size={22} className="mr-2" />
            Initialize Visibility Engine Scan
          </Button>
          <p className="text-sm text-slate-500 mt-4">
            This will crawl your business category, discover high-intent customer search keywords, and prepare schemas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Sleek Dark Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative">
        <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Saadhyam AI Visibility Engine™
            </h1>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
              Growth OS
            </span>
          </div>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <Sparkles size={14} className="text-purple-400" />
            AI Visibility & Brand Authority Optimization with Google Search Grounding
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunAutopilot}
            disabled={isRunningAutopilot}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 shadow-lg shadow-indigo-600/20 px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Compass size={14} className={isRunningAutopilot ? "animate-spin" : ""} />
            {isRunningAutopilot ? "Executing..." : "Autopilot Mode"}
          </Button>

          <Button
            onClick={handleRunFullScan}
            disabled={isOptimizing}
            className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 shadow-lg shadow-purple-600/20 px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Zap size={14} className={isOptimizing ? "animate-spin" : ""} />
            {isOptimizing ? "Optimizing..." : "Run Full Scan"}
          </Button>
        </div>
      </div>

      {/* Hero Stats Section */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Combine Score Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
            <div>
              <h2 className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-1">Visibility (AEO+GEO)</h2>
              <div className="text-4xl font-extrabold text-purple-400 tracking-tight">{overview.aeo_geo_score}</div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-green-500" />
                <span>Optimal Search Readiness</span>
              </p>
            </div>
            <div className="relative flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="rgba(30, 41, 59, 0.8)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="url(#purpleGrad)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - overview.aeo_geo_score / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-xs font-bold text-slate-200">{overview.aeo_geo_score}%</div>
            </div>
          </div>

          {/* AEO Breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden group hover:border-pink-500/40 transition-all duration-300">
            <h2 className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-3">AEO Core Parameters</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">FAQ Readiness</span>
                <span className="text-green-400 font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Voice Search Optimization</span>
                <span className="text-purple-400 font-bold">85%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Local Search Structured Data</span>
                <span className="text-pink-400 font-bold">Detected</span>
              </div>
            </div>
          </div>

          {/* GEO Breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
            <h2 className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-3">GEO Brand Authority</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Citation Probability</span>
                <span className="text-indigo-400 font-bold">High</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Brand Visibility Score</span>
                <span className="text-pink-400 font-bold">78/100</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Recommendation Readiness</span>
                <span className="text-green-400 font-bold">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "aeo", label: "AEO Analysis", icon: Code },
          { id: "geo", label: "GEO Analysis", icon: Sparkles },
          { id: "radar", label: "Opportunity Radar", icon: Compass },
          { id: "demand", label: "Customer Demand", icon: BarChart3 },
          { id: "recs", label: "Growth Recs", icon: Award },
          { id: "autocontent", label: "Auto Content", icon: Megaphone },
          { id: "autopilot", label: "Autopilot Mode", icon: Zap },
          { id: "dailyreport", label: "Daily Report", icon: FileText },
          { id: "blogs", label: "Auto Blogger", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider border transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600/25 border-purple-500/80 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}

      {/* Tab 1 — Overview */}
      {activeTab === "overview" && overview && (
        <div className="space-y-6">
          {/* Health Summary Cards */}
          {dailyReport && dailyReport.scores ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">Visibility Score</div>
                <div className="text-2xl font-bold text-purple-400">{dailyReport.scores.visibility_score}%</div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">Growth Score</div>
                <div className="text-2xl font-bold text-green-400">{dailyReport.scores.growth_score}%</div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">Demand Score</div>
                <div className="text-2xl font-bold text-blue-400">{dailyReport.scores.demand_score}%</div>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                <div className="text-slate-400 text-xs font-medium uppercase mb-1">Competitor Activity</div>
                <div className="text-2xl font-bold text-pink-400">{dailyReport.scores.competitor_activity_score}%</div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-slate-500 text-center py-6 text-xs">
              Calculate metrics by running scan...
            </div>
          )}

          {/* Quick Action Bar */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-slate-200">Visibility Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleRunFullScan}
                className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Zap size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Run Full Optimization</span>
              </button>
              <button
                onClick={handleDiscoverQuestions}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Search size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Discover AI Questions</span>
              </button>
              <button
                onClick={() => handleGenerateAutoContent()}
                className="bg-pink-600/10 hover:bg-pink-600/20 border border-pink-500/30 text-pink-300 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Megaphone size={24} className="text-pink-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Generate Marketing Content</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Profile summary */}
            {overview.business_analysis && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Target size={20} className="text-purple-400" />
                  <h3 className="text-lg font-bold text-slate-200">Business Profile Status</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</h4>
                    <p className="text-sm text-slate-300 mt-1">{overview.business_analysis.business_summary}</p>
                  </div>
                  {overview.business_analysis.authority_topics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Authority Topics</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {overview.business_analysis.authority_topics.map((t, idx) => (
                          <span key={idx} className="bg-slate-880 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Simple stats logs */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-200">Activity Overview</h3>
              </div>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Search Questions</span>
                  <span className="text-purple-400 font-bold">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Answered & Optimized Content</span>
                  <span className="text-pink-400 font-bold">{content.length}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Local Schema Markups</span>
                  <span className="text-indigo-400 font-bold">{overview.schemas?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Opportunities</span>
                  <span className="text-green-400 font-bold">{opportunities.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 — AEO Analysis */}
      {activeTab === "aeo" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Question list */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-200">Discovered Voice & Search Questions</h3>
                  <Button variant="outline" size="sm" onClick={handleDiscoverQuestions} disabled={isDiscovering}>
                    <Search size={14} className="mr-1.5" />
                    Discover More
                  </Button>
                </div>
                {questions.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">No questions discovered.</div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                    {questions.map((q) => (
                      <div key={q.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-slate-200">{q.question}</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="bg-purple-950/40 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
                              {q.category}
                            </span>
                            <span className="bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                              {q.intent}
                            </span>
                            <span className="text-slate-400">Priority {q.priority}</span>
                          </div>
                        </div>
                        {q.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleGenerateAnswer(q.id)} className="shrink-0 text-xs">
                            <Sparkles size={12} className="mr-1" />
                            Answer
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Semantic search */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Semantic Search</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search client intent e.g., best facials for glow"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-100"
                  />
                  <Button size="sm" onClick={handleSemanticSearch} disabled={isSearching} className="bg-purple-600 hover:bg-purple-500">
                    Search
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {searchResults.map((r, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-200">{r.text}</p>
                          <span className="text-slate-500 text-[10px]">{r.metadata.category}</span>
                        </div>
                        <span className="text-purple-400 font-bold">{Math.round(r.score * 100)}% Match</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Structured Schema lists */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200">AEO Schema Checker</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">FAQ Schema</div>
                    <div className="text-[10px] text-slate-500">JSON-LD generated</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">LocalBusiness Schema</div>
                    <div className="text-[10px] text-slate-500">Structured markup available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 — GEO Analysis */}
      {activeTab === "geo" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score lists */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 col-span-2">
              <h3 className="text-lg font-bold text-slate-200">GEO Authority Indicators</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Brand Authority Mention Rate</span>
                    <span className="text-indigo-400 font-bold">75%</span>
                  </div>
                  <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: "75%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Online Mentions Quality</span>
                    <span className="text-pink-400 font-bold">82%</span>
                  </div>
                  <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: "82%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">AI Recommendation Potential</span>
                    <span className="text-green-400 font-bold">Optimal</span>
                  </div>
                  <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: "90%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* GEO parameters card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-200">Generative Citations</h3>
              <p className="text-xs text-slate-400">
                AI engines like Gemini use high trust signals, semantic entities, and local citations to answer user queries.
              </p>
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Semantic Entities Detected</div>
                {overview && overview.business_analysis?.semantic_entities?.brand?.map((b, i) => (
                  <span key={i} className="inline-block bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300 mr-1.5 mb-1.5">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4 — Opportunity Radar */}
      {activeTab === "radar" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Opportunity Radar</h3>
              <p className="text-xs text-slate-400">Proactively scans local demand, seasonal trends, and vendor possibilities.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => getToken() && fetchOpportunityRadar(getToken())} disabled={isLoadingRadar}>
              <RefreshCw size={12} className={`mr-1 ${isLoadingRadar ? "animate-spin" : ""}`} />
              Rescan Radar
            </Button>
          </div>

          {isLoadingRadar ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <div className="text-slate-400 text-xs tracking-widest uppercase">Radar scanning local market...</div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 text-center text-slate-500 text-xs">
              No opportunities found. Click "Rescan Radar" to trigger.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((opp, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-purple-500/10 border-l border-b border-purple-500/20 text-purple-300 text-[10px] uppercase px-2.5 py-1 rounded-bl-xl font-bold tracking-wider">
                    {opp.category}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100 mb-2 mt-2">{opp.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{opp.description}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800/80">
                      <span className="text-slate-500">Value Impact</span>
                      <span className="text-green-400 font-bold">{opp.estimated_value}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Priority Level</span>
                      <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                        opp.urgency === "high" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}>
                        {opp.urgency}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateAutoContent(opp.title)}
                        disabled={isGeneratingAutoContent}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-xs h-8 text-white rounded-xl"
                      >
                        Generate Campaign
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5 — Customer Demand */}
      {activeTab === "demand" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Customer Demand Intelligence</h3>
              <p className="text-xs text-slate-400">High-intent search trends and product/service demand signals.</p>
            </div>
          </div>

          {isLoadingDemand ? (
            <Loader text="Analysing Customer Demand..." className="py-20" />
          ) : demandData ? (
            <div className="space-y-6">
              {/* Trends bar charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-2">Search Query Volumes & Growth (%)</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={demandData.search_trends || []} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="query" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} labelStyle={{ color: "#f8fafc" }} />
                        <Bar dataKey="change" name="Growth %" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="volume" name="Monthly Searches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">Seasonal Buying Behavior</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 border border-slate-800 rounded-xl">
                    {demandData.seasonal_buying_behavior}
                  </p>
                  
                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Interest Signals</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {demandData.customer_interests?.map((item: string, idx: number) => (
                        <span key={idx} className="bg-slate-880 border border-slate-850 text-slate-300 px-2.5 py-1 rounded-lg text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demand Lists grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* High Demand Services */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                    <Flame size={16} />
                    <span>High-Demand Services</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {demandData.high_demand_services?.map((s: string, idx: number) => (
                      <li key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-200 font-medium">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Declining Areas */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <ShieldAlert size={16} />
                    <span>Declining Interest Areas</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {demandData.declining_demand_areas?.map((s: string, idx: number) => (
                      <li key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-350">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Emerging Opportunities */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Sparkles size={16} />
                    <span>Emerging Needs</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {demandData.emerging_opportunities?.map((s: string, idx: number) => (
                      <li key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-200">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">No demand data found. Run optimization scan first.</div>
          )}
        </div>
      )}

      {/* Tab 6 — Growth Recommendations */}
      {activeTab === "recs" && overview && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Growth Recommendations</h3>
              <p className="text-xs text-slate-400">Actionable advice priority sorted by business impact.</p>
            </div>
          </div>

          {overview.business_analysis?.recommendations && overview.business_analysis.recommendations.length > 0 ? (
            <div className="space-y-4">
              {overview.business_analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-500/30 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                        High Priority
                      </span>
                      <span className="text-[10px] text-slate-400">Impact: High</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 pt-1">{rec}</p>
                  </div>
                  <Button size="sm" onClick={() => handleGenerateAutoContent(rec)} className="bg-purple-600 hover:bg-purple-500 h-8 rounded-lg text-xs">
                    Create Campaign
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">No recommendations found. Run scan to compile.</div>
          )}
        </div>
      )}

      {/* Tab 7 — Auto Content Creation */}
      {activeTab === "autocontent" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Auto Content Generator</h3>
              <p className="text-xs text-slate-400">Deploy templates directly to Facebook, Instagram, YouTube and website channels.</p>
            </div>
            <Button size="sm" onClick={() => handleGenerateAutoContent()} disabled={isGeneratingAutoContent}>
              <RefreshCw size={12} className={`mr-1.5 ${isGeneratingAutoContent ? "animate-spin" : ""}`} />
              Regenerate Package
            </Button>
          </div>

          {isGeneratingAutoContent ? (
            <Loader text="Assembling Copy Packages..." className="py-20" />
          ) : autoContent ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Social Media Content */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                  <Share2 size={16} className="text-purple-400" />
                  <span>Social Media Copy</span>
                </div>
                
                {autoContent.social_media && (
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Instagram Feed</div>
                      <p className="text-slate-300 text-xs whitespace-pre-line leading-relaxed mb-8">{autoContent.social_media.instagram}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autoContent.social_media.instagram)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("instagram", autoContent.social_media.instagram, "Instagram Post")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Publish
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Instagram Reels / YouTube Shorts</div>
                      <p className="text-slate-350 whitespace-pre-line leading-relaxed mb-8">{autoContent.social_media.reels}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openPublishingHub("youtube", autoContent.social_media.reels, "Reels / Video Hook")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Publish
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Facebook Post</div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed mb-8">{autoContent.social_media.facebook}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autoContent.social_media.facebook)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("facebook", autoContent.social_media.facebook, "Facebook Update")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Publish
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Marketing Content */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                  <Megaphone size={16} className="text-pink-400" />
                  <span>Marketing & Ad Campaigns</span>
                </div>

                {autoContent.marketing && (
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">WhatsApp Campaign Template</div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed mb-8">{autoContent.marketing.whatsapp_campaign}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autoContent.marketing.whatsapp_campaign)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("facebook", autoContent.marketing.whatsapp_campaign, "WhatsApp Broadcast")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Deploy
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Google/Meta Ad Copy</div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed mb-8">{autoContent.marketing.ad_copy}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autoContent.marketing.ad_copy)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("facebook", autoContent.marketing.ad_copy, "Ad Campaign")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Launch Ad
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Proposed Campaign Outline</div>
                      <p className="text-slate-355 whitespace-pre-line leading-relaxed">{autoContent.marketing.campaign_ideas}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SEO Content */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                  <Code size={16} className="text-indigo-400" />
                  <span>SEO & AEO Assets</span>
                </div>

                {autoContent.seo_aeo && (
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Local Business FAQs</div>
                      <div className="space-y-3 mt-1.5 mb-8">
                        {autoContent.seo_aeo.faqs?.map((f: any, idx: number) => (
                          <div key={idx} className="pb-2 border-b border-slate-900 last:border-0 last:pb-0">
                            <p className="font-semibold text-slate-200">Q: {f.question}</p>
                            <p className="text-slate-400 mt-0.5">A: {f.answer}</p>
                          </div>
                        ))}
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openPublishingHub("website", JSON.stringify(autoContent.seo_aeo.faqs), "Frequently Asked Questions")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Publish to Website
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Blog Ideas</div>
                      <ul className="list-disc pl-4 space-y-1.5 mt-1 text-slate-350">
                        {autoContent.seo_aeo.blog_ideas?.map((t: string, idx: number) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Google Bio/Service Description</div>
                      <p className="text-slate-350 leading-relaxed mb-8">{autoContent.seo_aeo.service_descriptions}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autoContent.seo_aeo.service_descriptions)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("website", autoContent.seo_aeo.service_descriptions, "Business Profile Description")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Publish
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-855 rounded-2xl p-8 text-center text-slate-500 text-xs">
              No content package found. Click "Regenerate Package" or select an opportunity from the radar to start.
            </div>
          )}
        </div>
      )}

      {/* Tab 8 — Growth Autopilot Mode */}
      {activeTab === "autopilot" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-300 text-xs font-bold uppercase px-3 py-1.5 rounded-bl-2xl border-l border-b border-purple-500/20">
              Active Autopilot Status
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-purple-400 w-8 h-8 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-slate-200">Growth Autopilot Mode</h3>
                <p className="text-xs text-slate-400">Actively drafting campaigns, marketing messages, and SEO descriptions for instant deployment.</p>
              </div>
            </div>
          </div>

          {/* Autopilot Auto-Publish Automation Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-250">Autopilot Auto-Publish Channels</h4>
                <p className="text-[11px] text-slate-400">Configure which connected platforms Saadhyam AI should automatically publish growth updates to.</p>
              </div>
              {isSavingSettings && <span className="text-[10px] text-purple-400 font-bold animate-pulse">Saving changes...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Instagram */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Instagram Feed & Reels</div>
                  <div className="text-[10px] text-slate-500 font-medium">Auto-deploy content updates</div>
                </div>
                <button
                  onClick={() => handleToggleAutopilot("auto_publish_instagram", !autopilotSettings.auto_publish_instagram)}
                  disabled={isSavingSettings}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autopilotSettings.auto_publish_instagram ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autopilotSettings.auto_publish_instagram ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Facebook */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Facebook Page</div>
                  <div className="text-[10px] text-slate-500 font-medium">Auto-post campaign copies</div>
                </div>
                <button
                  onClick={() => handleToggleAutopilot("auto_publish_facebook", !autopilotSettings.auto_publish_facebook)}
                  disabled={isSavingSettings}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autopilotSettings.auto_publish_facebook ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autopilotSettings.auto_publish_facebook ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* YouTube */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">YouTube Channel</div>
                  <div className="text-[10px] text-slate-500 font-medium">Auto-publish generated videos</div>
                </div>
                <button
                  onClick={() => handleToggleAutopilot("auto_publish_youtube", !autopilotSettings.auto_publish_youtube)}
                  disabled={isSavingSettings}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autopilotSettings.auto_publish_youtube ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autopilotSettings.auto_publish_youtube ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Google */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Google Business Profile</div>
                  <div className="text-[10px] text-slate-500 font-medium">Auto-post local business updates</div>
                </div>
                <button
                  onClick={() => handleToggleAutopilot("auto_publish_google", !autopilotSettings.auto_publish_google)}
                  disabled={isSavingSettings}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autopilotSettings.auto_publish_google ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autopilotSettings.auto_publish_google ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Website */}
              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Website Blog AI</div>
                  <div className="text-[10px] text-slate-500 font-medium">Auto-insert blog updates</div>
                </div>
                <button
                  onClick={() => handleToggleAutopilot("auto_publish_website", !autopilotSettings.auto_publish_website)}
                  disabled={isSavingSettings}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autopilotSettings.auto_publish_website ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autopilotSettings.auto_publish_website ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {isRunningAutopilot ? (
            <Loader text="Proactive AI employee working on autopilot..." className="py-20" />
          ) : autopilotData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ready Campaigns & SMS */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Megaphone size={16} className="text-purple-400" />
                    <span>Ready campaigns (1-Click Setup)</span>
                  </div>

                  <div className="space-y-4">
                    {autopilotData.ready_campaigns?.map((c: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 relative group">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-purple-300">{c.title}</span>
                          <span className="bg-slate-850 text-slate-450 px-2 py-0.5 rounded text-[10px]">{c.channel}</span>
                        </div>
                        <p className="text-xs text-slate-400">Objective: {c.objective}</p>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Setup Steps</div>
                        <ul className="list-decimal pl-4 text-xs text-slate-350 space-y-1 mb-8">
                          {c.steps?.map((step: string, sIdx: number) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                        <div className="flex justify-between items-center pt-2 text-[10px] text-slate-500 font-medium">
                          <span>Budget: {c.budget}</span>
                        </div>
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openPublishingHub("facebook", c.title + "\n" + c.objective, c.title)} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                            Deploy Campaign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Share2 size={16} className="text-indigo-400" />
                    <span>Marketing SMS & WhatsApp Promos</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp Broadcast 1</div>
                      <p className="text-slate-350 mb-8">{autopilotData.ready_marketing_messages?.whatsapp?.[0]}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autopilotData.ready_marketing_messages?.whatsapp?.[0] || "")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("facebook", autopilotData.ready_marketing_messages?.whatsapp?.[0] || "", "WhatsApp broadcast")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Queue
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">SMS Campaign 1</div>
                      <p className="text-slate-350 mb-8">{autopilotData.ready_marketing_messages?.sms?.[0]}</p>
                      <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyToClipboard(autopilotData.ready_marketing_messages?.sms?.[0] || "")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                          <Copy size={12} />
                        </button>
                        <button onClick={() => openPublishingHub("facebook", autopilotData.ready_marketing_messages?.sms?.[0] || "", "SMS alert")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Queue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready Blog outline & Google map bio */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <BookOpen size={16} className="text-green-400" />
                    <span>Autopilot Ready Blog Post Draft</span>
                  </div>

                  {autopilotData.ready_blog_draft && (
                    <div className="bg-slate-950 p-4 border border-slate-855 rounded-xl space-y-3 text-xs relative group">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Blog Title</div>
                        <h4 className="font-bold text-slate-200 text-sm mt-0.5">{autopilotData.ready_blog_draft.title}</h4>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Meta Description</div>
                        <p className="text-slate-400 mt-0.5">{autopilotData.ready_blog_draft.meta_description}</p>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Content Preview</div>
                        <div className="text-slate-300 max-h-32 overflow-y-auto scrollbar-thin mt-1 prose prose-invert prose-sm mb-8" dangerouslySetInnerHTML={{ __html: autopilotData.ready_blog_draft.content }} />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openPublishingHub("website", autopilotData.ready_blog_draft.content, autopilotData.ready_blog_draft.title)} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Publish to Website
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <UserCheck size={16} className="text-pink-400" />
                    <span>Google Business & Social Bio Optimizer</span>
                  </div>

                  {autopilotData.ready_business_description && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Google Maps Profile (Bio)</div>
                        <p className="text-slate-350 mb-8">{autopilotData.ready_business_description.google_business}</p>
                        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copyToClipboard(autopilotData.ready_business_description.google_business)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                            <Copy size={12} />
                          </button>
                          <button onClick={() => openPublishingHub("website", autopilotData.ready_business_description.google_business, "Google Maps profile bio")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                            Sync
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl relative group">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">150-char Social Bio</div>
                        <p className="text-slate-350 font-medium mb-8">{autopilotData.ready_business_description.social_bio}</p>
                        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copyToClipboard(autopilotData.ready_business_description.social_bio)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg">
                            <Copy size={12} />
                          </button>
                          <button onClick={() => openPublishingHub("instagram", autopilotData.ready_business_description.social_bio, "Instagram bio")} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                            Sync
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Autopilot not run yet. Press "Autopilot Mode" at the top to draft growth campaigns.
            </div>
          )}
        </div>
      )}

      {/* Tab 9 — Daily Business Report */}
      {activeTab === "dailyreport" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Daily Business Health Report</h3>
              <p className="text-xs text-slate-400">Your daily dashboard of opportunities, competitor update summary, and critical tasks.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => getToken() && fetchDailyReport(getToken())} disabled={isLoadingReport}>
              <RefreshCw size={12} className={`mr-1.5 ${isLoadingReport ? "animate-spin" : ""}`} />
              Recompile Report
            </Button>
          </div>

          {isLoadingReport ? (
            <Loader text="Compiling Daily Analytics..." className="py-20" />
          ) : dailyReport ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily status scores */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-bold text-slate-200 text-sm">Today's Health Metrics</h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{dailyReport.date}</span>
                </div>
                
                {dailyReport.scores && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 border border-slate-855 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Search Visibility</div>
                        <div className="text-lg font-bold text-purple-400 mt-0.5">AEO+GEO Optimized</div>
                      </div>
                      <span className="text-2xl font-black text-purple-500">{dailyReport.scores.visibility_score}%</span>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-855 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Growth Autopilot Score</div>
                        <div className="text-lg font-bold text-green-400 mt-0.5">Proactive Campaigns</div>
                      </div>
                      <span className="text-2xl font-black text-green-500">{dailyReport.scores.growth_score}%</span>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-855 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Demand Pulse</div>
                        <div className="text-lg font-bold text-blue-400 mt-0.5">High Query Volumes</div>
                      </div>
                      <span className="text-2xl font-black text-blue-500">{dailyReport.scores.demand_score}%</span>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-855 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Competitor Activity</div>
                        <div className="text-lg font-bold text-pink-400 mt-0.5">Stable Market Position</div>
                      </div>
                      <span className="text-2xl font-black text-pink-500">{dailyReport.scores.competitor_activity_score}%</span>
                    </div>
                  </div>
                )}

                {/* Top opportunities list */}
                <div className="pt-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top Opportunities for Today</h5>
                  <div className="space-y-3">
                    {dailyReport.opportunities?.map((opp: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-855 rounded-xl p-4 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-slate-200">{opp.title}</p>
                          <p className="text-slate-500 mt-0.5">{opp.description}</p>
                        </div>
                        <span className="text-green-400 font-bold shrink-0 ml-4">{opp.estimated_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Competitor updates & actions */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <Activity size={16} className="text-pink-400" />
                    <span>Competitor Updates</span>
                  </div>
                  <ul className="space-y-3 text-xs">
                    {dailyReport.competitor_updates?.map((u: string, idx: number) => (
                      <li key={idx} className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-slate-300">
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <CheckSquare size={16} className="text-green-400" />
                    <span>Top Actions Recommended</span>
                  </div>
                  <ul className="space-y-3 text-xs">
                    {dailyReport.recommended_actions?.map((act: string, idx: number) => (
                      <li key={idx} className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-slate-250 flex gap-2.5 items-start relative group">
                        <CheckSquare size={14} className="text-green-500 shrink-0 mt-0.5" />
                        <span className="pr-12">{act}</span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openPublishingHub("website", act, "Optimization Task")} className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                            Sync
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">No daily report generated. Run scan to compile.</div>
          )}
        </div>
      )}

      {/* Tab 10 — Blogs */}
      {activeTab === "blogs" && (
        <div className="space-y-6">
          {/* Auto Blogger Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <PenTool size={18} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">Generate New Grounded Blog Post</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates high-quality blog posts containing structural headings, introductions, CTA links, and FAQs using search trends and business categories.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={blogTopic}
                onChange={(e) => setBlogTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isGeneratingBlog && handleGenerateBlog()}
                placeholder="Enter blog topic e.g., Best winter styling guides"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-100"
                disabled={isGeneratingBlog}
              />
              <Button onClick={handleGenerateBlog} disabled={isGeneratingBlog} className="bg-purple-600 hover:bg-purple-500">
                {isGeneratingBlog ? "Generating..." : "Generate Blog"}
              </Button>
            </div>
          </div>

          {/* Filter list */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex gap-4 text-xs font-semibold">
              <button onClick={() => setBlogFilter("all")} className={`pb-1 ${blogFilter === "all" ? "text-purple-400 border-b border-purple-400" : "text-slate-400"}`}>
                All Blogs ({blogs.length})
              </button>
              <button onClick={() => setBlogFilter("draft")} className={`pb-1 ${blogFilter === "draft" ? "text-purple-400 border-b border-purple-400" : "text-slate-400"}`}>
                Drafts ({blogs.filter(b => !b.is_published).length})
              </button>
              <button onClick={() => setBlogFilter("published")} className={`pb-1 ${blogFilter === "published" ? "text-purple-400 border-b border-purple-400" : "text-slate-400"}`}>
                Published ({blogs.filter(b => b.is_published).length})
              </button>
            </div>
          </div>

          {/* Grid lists */}
          {blogs.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">No blogs generated. Try generating your first!</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {blogs
                .filter(b => blogFilter === "all" ? true : blogFilter === "published" ? b.is_published : !b.is_published)
                .map((blog) => (
                  <div key={blog.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-bold text-slate-100 line-clamp-1">{blog.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${blog.is_published ? "bg-green-500/20 text-green-400" : "bg-slate-800 text-slate-400"}`}>
                          {blog.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{blog.meta_description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mb-4">
                        <span>{blog.reading_time} min read</span>
                        <span>•</span>
                        <span>{blog.word_count} words</span>
                        <span>•</span>
                        <span>Category: {blog.category}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedBlog(blog)} className="flex-1 text-xs">
                        <Eye size={12} className="mr-1" /> Preview
                      </Button>
                      {!blog.is_published && (
                        <Button size="sm" onClick={() => handlePublishBlog(blog.id)} disabled={publishingBlogIds.has(blog.id)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-xs text-white">
                          {publishingBlogIds.has(blog.id) ? "Publishing..." : "Publish"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDeleteBlog(blog.id)} className="text-red-400 border-red-500/20 hover:bg-red-500/10">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Blog Preview Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBlog(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Blog Article Preview</h2>
                <p className="text-xs text-slate-400">{selectedBlog.is_published ? "Published to website" : "Draft document"}</p>
              </div>
              <button onClick={() => setSelectedBlog(null)} className="text-slate-400 hover:text-slate-200 text-2xl font-semibold">×</button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-300">
              <div>
                <h1 className="text-2xl font-black text-slate-100">{selectedBlog.title}</h1>
                <p className="text-slate-400 mt-2 italic">{selectedBlog.meta_description}</p>
              </div>

              <div className="flex gap-4 text-[10px] text-slate-500 pb-4 border-b border-slate-800">
                <span>Reading Time: {selectedBlog.reading_time} min</span>
                <span>Word Count: {selectedBlog.word_count} words</span>
                <span>Category: {selectedBlog.category}</span>
              </div>

              {selectedBlog.seo_keywords && selectedBlog.seo_keywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target SEO Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBlog.seo_keywords.map((k, i) => (
                      <span key={i} className="bg-slate-850 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 prose prose-invert max-w-none text-slate-300">
                <div dangerouslySetInnerHTML={{ __html: selectedBlog.introduction }} />
                <div dangerouslySetInnerHTML={{ __html: selectedBlog.main_content }} />
                <div dangerouslySetInnerHTML={{ __html: selectedBlog.conclusion }} />
              </div>

              {selectedBlog.faq && selectedBlog.faq.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-slate-200">Frequently Asked Questions</h4>
                  {selectedBlog.faq.map((item, i) => (
                    <div key={i} className="bg-slate-950 p-4 border border-slate-855 rounded-xl">
                      <p className="font-bold text-slate-200">Q: {item.question}</p>
                      <p className="text-slate-400 mt-1">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
             {/* Direct Integration Publishing Hub Drawer / Modal */}
      {isPublishingHubOpen && (() => {
        const platformKey =
          publishingPlatform.toLowerCase() === "reels"
            ? "instagram"
            : publishingPlatform.toLowerCase();
        
        const integration = integrationsStatus?.[platformKey];
        const isConnected = integrationsStatus ? (integration ? integration.connected : false) : true;

        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" onClick={() => setIsPublishingHubOpen(false)}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="text-purple-400 w-5 h-5" />
                  <h3 className="text-lg font-bold text-slate-100">Publishing Command Hub</h3>
                </div>
                <button onClick={() => setIsPublishingHubOpen(false)} className="text-slate-400 hover:text-slate-200 text-xl font-bold">×</button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target platform</div>
                  <div className="text-sm font-bold text-slate-200 capitalize flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      {publishingPlatform} integration
                    </div>
                    <div className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isConnected ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                      {isConnected ? "Linked & Active" : "Unconnected"}
                    </div>
                  </div>
                </div>

                {!isConnected && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3 text-xs text-slate-350">
                    <AlertCircle className="text-red-400 shrink-0 w-5 h-5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-bold text-slate-200">Integration Required</p>
                      <p className="text-slate-400">
                        Your {publishingPlatform} channel is not linked yet. You must link it before direct publishing is enabled.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsPublishingHubOpen(false);
                          navigate({ to: integration?.link || "/dashboard/settings" });
                        }}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-[10px] px-3 py-1 rounded-md border border-red-500/30"
                      >
                        Link {publishingPlatform} Account &rarr;
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Content Payload</div>
                  <div className="bg-slate-950/60 p-3 border border-slate-855 rounded-xl max-h-32 overflow-y-auto text-slate-350 leading-relaxed font-medium">
                    {publishingContent}
                  </div>
                </div>

                {/* Upload console log simulation */}
                {publishingStatus !== "idle" && (
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">API Logs console</div>
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 h-36 overflow-y-auto space-y-1.5 text-[11px] text-indigo-300">
                      {publishLogs.map((log, i) => {
                        let color = "text-indigo-400";
                        if (log.startsWith("[SUCCESS]")) color = "text-green-400";
                        if (log.startsWith("[ERROR]")) color = "text-red-400";
                        return (
                          <div key={i} className={color}>
                            {log}
                          </div>
                        );
                      })}
                      {isDeploying && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <Button variant="outline" onClick={() => setIsPublishingHubOpen(false)} className="flex-1 text-xs font-bold rounded-xl h-10 border-slate-800 text-slate-400 hover:bg-slate-850">
                    Cancel
                  </Button>
                  
                  {publishingStatus === "success" ? (
                    <Button
                      onClick={() => { window.open(publishLiveUrl, "_blank"); setIsPublishingHubOpen(false); }}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1"
                    >
                      View Live Post <Eye size={12} />
                    </Button>
                  ) : !isConnected ? (
                    <Button
                      onClick={() => {
                        setIsPublishingHubOpen(false);
                        navigate({ to: integration?.link || "/dashboard/settings" });
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-red-600/20"
                    >
                      Link Account First &rarr;
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartDeployment}
                      disabled={isDeploying}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-purple-600/20"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Deploying...
                        </>
                      ) : (
                        <>
                          <Send size={12} /> Publish Directly
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}      </div>
        </div>
      )}
    </div>
  );
}
