import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCooldown, formatCooldownTime } from "@/hooks/useCooldown";
import { useNotificationHelpers } from "@/components/notifications";
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
} from "@/lib/aeoGeoApi";
import { generateBlog, publishBlog, getUserBlogs, deleteBlog, type Blog } from "@/lib/blogApi";

export const Route = createFileRoute("/dashboard/aeo-geo")({
  head: () => ({ meta: [{ title: "AEO & GEO — Saadhyam AI" }] }),
  component: AEOGEOPage,
});

function AEOGEOPage() {
  const [overview, setOverview] = useState<AEOGEOOverview | null>(null);
  const [questions, setQuestions] = useState<AEOQuestion[]>([]);
  const [content, setContent] = useState<AEOContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "content">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [blogTopic, setBlogTopic] = useState("");
  const { notifyWarning } = useNotificationHelpers();

  // Blog management state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogFilter, setBlogFilter] = useState<"all" | "draft" | "published">("all");
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [publishingBlogIds, setPublishingBlogIds] = useState<Set<number>>(new Set());

  // Cooldown for optimization button (2 hours)
  const optimizeCooldown = useCooldown({
    cooldownMinutes: 120,
    storageKey: "aeo-geo-optimize-cooldown",
  });

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
    loadData();
    loadBlogs();
  }, []);

  // Reload blogs when filter changes
  useEffect(() => {
    loadBlogs();
  }, [blogFilter]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();

      // Load overview
      const overviewData = await getAEOGEOOverview(token);
      setOverview(overviewData);

      // Load questions
      const questionsData = await getDiscoveredQuestions(token, undefined, 20);
      setQuestions(questionsData.questions);

      // Load content
      const contentData = await getGeneratedContent(token, 20);
      setContent(contentData.content);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load AEO/GEO data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlogs = async () => {
    try {
      const token = getToken();
      const statusFilter = blogFilter === "all" ? undefined : blogFilter;
      const data = await getUserBlogs(token, statusFilter, 50);
      setBlogs(data.blogs);
    } catch (err: any) {
      console.error("Error loading blogs:", err);
    }
  };

  const handleOptimize = async () => {
    // Check cooldown
    if (!optimizeCooldown.canExecute) {
      notifyWarning(
        "Optimization on Cooldown",
        `Please wait ${formatCooldownTime(optimizeCooldown.remainingTime)} before running optimization again.`,
      );
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const token = getToken();
      await runFullOptimization(token);
      await loadData();

      // Start cooldown ONLY after successfully getting complete data
      optimizeCooldown.execute();
    } catch (err: any) {
      console.error("Error optimizing:", err);
      setError(err.message || "Failed to run optimization");
      // Don't start cooldown if optimization failed - user can retry
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDiscoverQuestions = async () => {
    setIsDiscovering(true);
    setError(null);

    try {
      const token = getToken();
      await discoverQuestions(token, 20);

      // Reload questions
      const questionsData = await getDiscoveredQuestions(token, undefined, 20);
      setQuestions(questionsData.questions);
    } catch (err: any) {
      console.error("Error discovering questions:", err);
      setError(err.message || "Failed to discover questions");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleGenerateContent = async (questionId: number) => {
    try {
      const token = getToken();
      await generateAEOContent(token, questionId);

      // Reload content
      const contentData = await getGeneratedContent(token, 20);
      setContent(contentData.content);
    } catch (err: any) {
      console.error("Error generating content:", err);
      setError(err.message || "Failed to generate content");
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const token = getToken();
      const results = await searchSimilarQuestions(token, searchQuery, 5);
      setSearchResults(results.results);
    } catch (err: any) {
      console.error("Error searching questions:", err);
      setError(err.message || "Failed to search questions");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateBlog = async () => {
    setIsGeneratingBlog(true);
    setError(null);

    try {
      const token = getToken();
      const result = await generateBlog(token, blogTopic || undefined);

      // Clear topic input
      setBlogTopic("");

      // Reload blogs
      await loadBlogs();

      // Show success message (stay on same page)
      toast.success(`Blog "${result.blog.title}" generated successfully!`, {
        duration: 4000,
        position: 'top-right'
      });
    } catch (err: any) {
      console.error("Error generating blog:", err);
      const errorMessage = err.message || "Failed to generate blog post";
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right'
      });
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handlePublishBlog = async (blogId: number) => {
    // Add blog ID to publishing set
    setPublishingBlogIds(prev => new Set(prev).add(blogId));
    
    try {
      const token = getToken();
      await publishBlog(token, blogId);

      // Reload blogs
      await loadBlogs();

      toast.success("Blog published successfully and integrated into your confirmed website!", {
        duration: 4000,
        position: 'top-right'
      });
    } catch (err: any) {
      console.error("Error publishing blog:", err);
      const errorMessage = err.message || "Failed to publish blog";

      // Check if error is about missing website
      if (errorMessage.includes("create a website first") || errorMessage.includes("Website AI")) {
        toast.error("⚠️ Website Required\n\nYou need to create a website first before publishing blogs.\n\nPlease go to 'Website AI' in the sidebar to create your website, then come back to publish your blogs.",
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      // Remove blog ID from publishing set
      setPublishingBlogIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(blogId);
        return newSet;
      });
    }
  };

  const handleDeleteBlog = async (blogId: number) => {
    if (!confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    try {
      const token = getToken();
      await deleteBlog(token, blogId);

      // Reload blogs
      await loadBlogs();

      // Close preview if deleted blog was selected
      if (selectedBlog?.id === blogId) {
        setSelectedBlog(null);
      }
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      setError(err.message || "Failed to delete blog");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="AEO & GEO"
          subtitle="Answer Engine Optimization + Generative Engine Optimization"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  // Onboarding state - if no business analysis has been run yet
  if (overview && overview.business_analysis?.status === "not_started") {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="AEO & GEO"
          subtitle="Answer Engine Optimization + Generative Engine Optimization"
        />
        <div className="bg-blue-50 border-blue-200 border rounded-lg p-8 text-center max-w-2xl mx-auto">
          <Target size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Get Started with AEO & GEO</h2>
          <p className="text-gray-700 mb-6">
            To begin optimizing your business for Answer Engine and Generative Engine Optimization,
            start with a comprehensive business analysis.
          </p>
          <Button variant="hero" size="lg" onClick={handleOptimize}>
            <Zap size={18} />
            Start Optimization
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            This will analyze your business, discover AI-search questions, and generate
            SEO-optimized content.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <PageHeader
          title="AEO & GEO"
          subtitle="Answer Engine Optimization + Generative Engine Optimization"
        />
        <div className="bg-red-50 border-red-200 border rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">Failed to Load</p>
          <p className="text-red-700 mb-4">{error}</p>
          <Button variant="hero" onClick={loadData}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AEO & GEO</h1>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <Sparkles size={14} className="text-purple-600" />
            AI Visibility Engine powered by Gemini with Google Search
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleOptimize}
          disabled={isOptimizing || !optimizeCooldown.canExecute}
          title={
            !optimizeCooldown.canExecute
              ? `Cooldown: ${formatCooldownTime(optimizeCooldown.remainingTime)}`
              : "Run full optimization"
          }
        >
          <Zap size={14} className={isOptimizing ? "animate-spin" : ""} />
          {!optimizeCooldown.canExecute
            ? formatCooldownTime(optimizeCooldown.remainingTime).split(" ")[0]
            : isOptimizing
              ? "Optimizing..."
              : "Run Full Optimization"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "questions"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "content"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Content ({content.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && overview && (
        <div className="space-y-5">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">AEO/GEO Score</h2>
                <p className="text-sm text-gray-600">Your AI visibility performance</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-700">{overview.aeo_geo_score}</div>
                <div className="text-xs text-gray-600">out of 100</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Search size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{overview.questions.total}</div>
                  <div className="text-xs text-gray-600">Questions</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileText size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{overview.content.total}</div>
                  <div className="text-xs text-gray-600">Content Pieces</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Code size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{overview.schemas.total}</div>
                  <div className="text-xs text-gray-600">Schema Markups</div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Eye size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {overview.visibility.total_mentions}
                  </div>
                  <div className="text-xs text-gray-600">AI Mentions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Analysis */}
          {overview.business_analysis && (
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Target size={20} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">Business Analysis for AEO</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Summary</h4>
                  <p className="text-sm text-gray-700">
                    {overview.business_analysis.business_summary}
                  </p>
                </div>
                {overview.business_analysis.authority_topics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Authority Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {overview.business_analysis.authority_topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">AEO Readiness Score:</span>
                  <span className="text-lg font-bold text-purple-700">
                    {overview.business_analysis.aeo_readiness_score}/100
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {/* Semantic Search Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Semantic Search (Powered by Pinecone)
              </h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Search by meaning, not just keywords. Find similar questions even with different
              wording.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSemanticSearch()}
                placeholder="e.g., How to grow my restaurant business?"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                variant="hero"
                size="sm"
                onClick={handleSemanticSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                <Search size={14} className={isSearching ? "animate-spin" : ""} />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Similar Questions Found:</h4>
                {searchResults.map((result, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-purple-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 flex-1">{result.text}</p>
                      <span className="text-xs font-semibold text-purple-700 shrink-0">
                        {Math.round(result.score * 100)}% match
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {result.metadata.category}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {result.metadata.intent}
                      </span>
                      <span>Priority: {result.metadata.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Discovered questions from AI search engines</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscoverQuestions}
              disabled={isDiscovering}
            >
              <Search size={14} className={isDiscovering ? "animate-spin" : ""} />
              {isDiscovering ? "Discovering..." : "Discover More"}
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No questions discovered yet</p>
              <Button variant="hero" onClick={handleDiscoverQuestions}>
                <Search size={16} />
                Discover Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-card rounded-xl border border-border/60 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {question.question}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {question.category}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          {question.intent}
                        </span>
                        <span>Priority: {question.priority}</span>
                        <span
                          className={`px-2 py-0.5 rounded ${
                            question.status === "answered"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {question.status}
                        </span>
                      </div>
                    </div>
                    {question.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateContent(question.id)}
                      >
                        <Sparkles size={14} />
                        Generate Answer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-4">
          {/* Auto Blogger Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <PenTool size={18} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Generate New Blog Post</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              AI generates SEO-optimized blog posts using your business details, web search, and
              latest trends
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={blogTopic}
                onChange={(e) => setBlogTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isGeneratingBlog && handleGenerateBlog()}
                placeholder="Blog topic (optional, e.g., 'Customer retention strategies')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isGeneratingBlog}
              />
              <Button
                variant="hero"
                size="sm"
                onClick={handleGenerateBlog}
                disabled={isGeneratingBlog}
              >
                <PenTool size={14} className={isGeneratingBlog ? "animate-spin" : ""} />
                {isGeneratingBlog ? "Generating..." : "Generate Blog"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Generation takes 30-60 seconds. Blogs will be automatically published to your confirmed website.
            </p>
          </div>

          {/* Blog Filter Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setBlogFilter("all")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  blogFilter === "all"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                All Blogs ({blogs.length})
              </button>
              <button
                onClick={() => setBlogFilter("draft")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  blogFilter === "draft"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Drafts ({blogs.filter((b) => b.status === "draft").length})
              </button>
              <button
                onClick={() => setBlogFilter("published")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  blogFilter === "published"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Published ({blogs.filter((b) => b.status === "published").length})
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={loadBlogs}>
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>

          {/* Blog List */}
          {blogs.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No blogs yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Generate your first AI-powered blog post to get started
              </p>
              <Button
                variant="hero"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[placeholder*="Blog topic"]')
                    ?.focus()
                }
              >
                <PenTool size={16} />
                Generate Blog
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="bg-card rounded-xl border border-border/60 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  {/* Blog Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {blog.meta_description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                        blog.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {blog.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Blog Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {blog.reading_time} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {blog.word_count} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {blog.category}
                    </span>
                  </div>

                  {/* SEO Keywords */}
                  {blog.seo_keywords && blog.seo_keywords.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {blog.seo_keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                        {blog.seo_keywords.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            +{blog.seo_keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  {blog.created_at && (
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                      <Calendar size={12} />
                      Created {new Date(blog.created_at).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBlog(blog)}
                      className="flex-1"
                    >
                      <Eye size={14} />
                      Preview
                    </Button>
                    {!blog.is_published && (
                      <Button 
                        variant="hero" 
                        size="sm" 
                        onClick={() => handlePublishBlog(blog.id)}
                        disabled={publishingBlogIds.has(blog.id)}
                      >
                        {publishingBlogIds.has(blog.id) ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Publish
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBlog(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-invisible"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Blog Preview</h2>
                <p className="text-sm text-gray-600">
                  {selectedBlog.is_published ? "Published" : "Draft"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!selectedBlog.is_published && (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => {
                      handlePublishBlog(selectedBlog.id);
                      setSelectedBlog(null);
                    }}
                    disabled={publishingBlogIds.has(selectedBlog.id)}
                  >
                    {publishingBlogIds.has(selectedBlog.id) ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Publish
                      </>
                    )}
                  </Button>
                )}
                <button
                  onClick={() => setSelectedBlog(null)}
                  className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedBlog.title}</h1>
                <p className="text-gray-600">{selectedBlog.meta_description}</p>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 pb-4 border-b border-gray-200">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {selectedBlog.reading_time} min read
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {selectedBlog.word_count} words
                </span>
                <span className="flex items-center gap-1">
                  <Tag size={14} />
                  {selectedBlog.category}
                </span>
              </div>

              {/* SEO Keywords */}
              {selectedBlog.seo_keywords && selectedBlog.seo_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">SEO Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlog.seo_keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Introduction */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Introduction</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.introduction }}
                />
              </div>

              {/* Main Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Main Content</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.main_content }}
                />
              </div>

              {/* Conclusion */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Conclusion</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.conclusion }}
                />
              </div>

              {/* FAQ */}
              {selectedBlog.faq && selectedBlog.faq.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">FAQ</h3>
                  <div className="space-y-3">
                    {selectedBlog.faq.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {item.question}
                        </h4>
                        <p className="text-sm text-gray-700">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {selectedBlog.cta && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-5 text-center">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    {selectedBlog.cta.text}
                  </p>
                  <Button variant="hero" size="sm">
                    Learn More
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
