import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle,
  Download,
  Trash2,
  Save,
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/plugins/linkedin-marketing/")({
  head: () => ({
    meta: [{ title: "LinkedIn Marketing Wizard — Saadhyam AI" }],
  }),
  component: LinkedInMarketingPage,
});

interface LinkedinConfig {
  companyName: string;
  brandName: string;
  industry: string;
  targetAudience: string;
  tone: string;
}

interface GeneratedPost {
  id: string;
  text: string;
  timestamp: string;
  topic: string;
  goal: string;
  tone: string;
  hashtags?: string[];
}

function LinkedInMarketingPage() {
  // Wizard state (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Config states
  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("Professional");

  // Generator states
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("Brand Awareness");
  const [template, setTemplate] = useState("Thought Leadership");
  const [hashtagCount, setHashtagCount] = useState<string>("5");
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor states
  const [generatedText, setGeneratedText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [isHashtagsCopied, setIsHashtagsCopied] = useState(false);

  // History states
  const [recentPosts, setRecentPosts] = useState<GeneratedPost[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("saadhyam_linkedin_config");
      if (savedConfig) {
        const config: LinkedinConfig = JSON.parse(savedConfig);
        setCompanyName(config.companyName || "");
        setBrandName(config.brandName || "");
        setIndustry(config.industry || "");
        setTargetAudience(config.targetAudience || "");
        setTone(config.tone || "Professional");
      }

      const savedPosts = localStorage.getItem("saadhyam_linkedin_recent_posts");
      if (savedPosts) {
        setRecentPosts(JSON.parse(savedPosts));
      }
    } catch (e) {
      console.error("Failed to load LinkedIn Marketing plugin storage:", e);
    }
  }, []);

  const handleSaveConfig = (silent = false) => {
    try {
      const config: LinkedinConfig = {
        companyName,
        brandName,
        industry,
        targetAudience,
        tone,
      };
      localStorage.setItem("saadhyam_linkedin_config", JSON.stringify(config));
      if (!silent) {
        toast.success("LinkedIn configuration saved successfully!");
      }
      // Automatically advance to step 3 on successful save
      setCurrentStep(3);
    } catch (e) {
      toast.error("Failed to save configuration.");
    }
  };

  const handleGeneratePost = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for the post.");
      return;
    }

    setIsGenerating(true);
    try {
      const introStyles = [
        "Bold statement (start with a strong, contrarian, or impactful assertion about the topic)",
        "Industry insight (start with an acute observation about a shift in this business domain)",
        "Statistic (start with a shocking, surprising, or highly relevant industry data point or percentage)",
        "Customer pain point (start by calling out a specific day-to-day frustration faced by the target audience)",
        "Success story (start with an anecdotal snapshot or real-world achievement related to this topic)",
        "Future prediction (start with a bold outlook or foresight into how this topic will look by 2030)",
        "Question (start with a deep, thought-provoking question instead of a generic yes/no question - use occasionally)",
        "Myth vs Reality (start by debunking a common misconception or myth related to this topic)"
      ];

      const randomIntroStyle = introStyles[Math.floor(Math.random() * introStyles.length)];

      const configPrompt = `Generate a unique LinkedIn post.
Every generation should have a different title and opening.
Avoid repeating previous wording.
Vary the introduction naturally using one of:
- Bold statement
- Industry insight
- Statistic
- Customer pain point
- Success story
- Future prediction
- Question (occasionally)
- Myth vs Reality

Create a fresh headline every time.

Topic: "${topic}".
The goal of the post is: ${goal}.
Business details for context:
- Brand Name: ${brandName || "Our Brand"}
- Company Name: ${companyName || "Our Company"}
- Industry: ${industry || "Industry"}
- Target Audience: ${targetAudience || "Professional Network"}
- Tone: ${tone}
- Template type: ${template}

Structure the LinkedIn post beautifully:
1. Start with an attention-grabbing headline.
   CRITICAL CONSTRAINT: You MUST start the hook/headline specifically using this style: ${randomIntroStyle}. Ensure the headline is completely unique. Do not start with generic questions or templated statements. Never reuse standard headlines. Never hardcode any title. Never start with "Elevate Your B2B Strategy".
2. Provide 2-3 short paragraphs explaining the value or concept.
3. Use professional bullet points to break down key takeaways.
4. Conclude with a strong call-to-action (CTA) matching the goal.
5. End with exactly ${hashtagCount} relevant, trending professional hashtags (e.g. #Business, #Innovation).`;

      const response = await apiClient.post<any>("/content/generate", {
        business_type: industry || "B2B Business",
        platform: "instagram",
        goal: "promotion",
        tone: tone.toLowerCase(),
        language: "english",
        user_input: configPrompt,
      });

      let formattedPost = "";
      let postHashtags: string[] = [];

      if (response && response.success && response.content) {
        const { headline, caption, subtext, cta, hashtags } = response.content;

        if (headline) formattedPost += `💼 ${headline}\n\n`;
        if (caption) formattedPost += `${caption}\n\n`;
        if (subtext) formattedPost += `${subtext}\n\n`;
        if (cta) formattedPost += `👉 ${cta}\n\n`;

        if (hashtags && Array.isArray(hashtags)) {
          postHashtags = hashtags
            .map((h: string) => {
              const clean = h.trim().replace(/#/g, "").replace(/[^a-zA-Z0-9_]/g, "");
              return clean ? `#${clean}` : "";
            })
            .filter(Boolean);
        }
      }

      // Remove duplicates
      postHashtags = Array.from(new Set(postHashtags));

      const targetCount = parseInt(hashtagCount, 10);

      // Pad fallback B2B tags if we have fewer than targetCount
      if (postHashtags.length < targetCount) {
        const fallbackPool = [
          "#B2BMarketing",
          "#LinkedInTips",
          "#BusinessGrowth",
          "#ProfessionalNetworking",
          "#Networking",
          "#Management",
          "#Strategy",
          "#Leadership",
          "#Innovation",
          "#Marketing",
          "#SaaS",
          "#TechStartup",
          "#DigitalTransformation",
          "#CareerDevelopment",
          "#SalesOutreach",
          "#ProductLaunch",
          "#Entrepreneurship",
          "#EmployeeEngagement"
        ];
        for (const tag of fallbackPool) {
          if (postHashtags.length >= targetCount) break;
          if (!postHashtags.includes(tag)) {
            postHashtags.push(tag);
          }
        }
      }

      // Slice to match requested count exactly
      if (postHashtags.length > targetCount) {
        postHashtags = postHashtags.slice(0, targetCount);
      }

      const fallbackHeadlines = [
        `Innovating in ${industry || "our space"}: Key considerations for ${targetAudience || "industry leaders"}`,
        `Addressing "${topic}": How ${brandName || "Saadhyam AI"} drives efficiency`,
        `Solving the "${topic}" puzzle: A playbook for B2B success`,
        `The Future of B2B: Why ${topic} matters today`
      ];
      const selectedFallbackHeadline = fallbackHeadlines[Math.floor(Math.random() * fallbackHeadlines.length)];

      if (!formattedPost.trim()) {
        formattedPost = `💼 ${selectedFallbackHeadline}\n\nHow is your organization addressing "${topic}"? In today's dynamic ${industry || "business"} environment, reaching the right stakeholders with precision is essential for driving growth.\n\nHere is how we are helping ${targetAudience || "industry leaders"} succeed:\n• AI-driven content scaling and optimization\n• Actionable insight extraction\n• Enterprise-grade automation workflows\n\n👉 Learn more by visiting our company page at ${companyName || "Saadhyam"}.\n\n`;
      }

      // Append clean hashtags to post content
      if (postHashtags.length > 0) {
        formattedPost += `${postHashtags.join(" ")}`;
      }

      setGeneratedText(formattedPost);
      setGeneratedHashtags(postHashtags);

      // Save to recent posts
      const newPost: GeneratedPost = {
        id: Date.now().toString(),
        text: formattedPost,
        timestamp: new Date().toLocaleString(),
        topic,
        goal,
        tone,
        hashtags: postHashtags,
      };

      const updatedPosts = [newPost, ...recentPosts].slice(0, 10);
      setRecentPosts(updatedPosts);
      localStorage.setItem("saadhyam_linkedin_recent_posts", JSON.stringify(updatedPosts));

      toast.success("LinkedIn post generated successfully!");
      // Automatically advance to step 4 on successful generation
      setCurrentStep(4);
    } catch (error: any) {
      console.error("Failed to generate LinkedIn post:", error);
      toast.info("Using high-fidelity local template generation...");

      const targetCount = parseInt(hashtagCount, 10);
      const fallbackPool = [
        "#B2BMarketing",
        `#${goal.replace(/\s+/g, "")}`,
        "#Innovation",
        "#SaaS",
        "#AI",
        "#SaadhyamAI",
        "#Networking",
        "#BusinessGrowth",
        "#DigitalTransformation",
        "#ProductLaunch",
        "#Strategy",
        "#Leadership",
        "#ProfessionalNetworking",
        "#TechStartup",
        "#Management"
      ];

      const fallbackTags = Array.from(new Set(fallbackPool.slice(0, targetCount)));

      const fallbackHeadlines = [
        `Innovating in ${industry || "our space"}: Key considerations for ${targetAudience || "industry leaders"}`,
        `Addressing "${topic}": How ${brandName || "Saadhyam AI"} drives efficiency`,
        `Solving the "${topic}" puzzle: A playbook for B2B success`,
        `The Future of B2B: Why ${topic} matters today`
      ];
      const selectedFallbackHeadline = fallbackHeadlines[Math.floor(Math.random() * fallbackHeadlines.length)];

      const baseText = `💼 ${selectedFallbackHeadline}\n\nHow is your organization addressing "${topic}"? In today's dynamic ${industry || "business"} environment, reaching the right stakeholders with precision is essential for driving growth.\n\nHere is how we are helping ${targetAudience || "industry leaders"} succeed:\n• AI-driven content scaling and optimization\n• Actionable insight extraction\n• Enterprise-grade automation workflows\n\n👉 Learn more by visiting our company page at ${companyName || "Saadhyam"}.\n\n`;

      const fallbackPost = baseText + fallbackTags.join(" ");

      setGeneratedText(fallbackPost);
      setGeneratedHashtags(fallbackTags);

      const newPost: GeneratedPost = {
        id: Date.now().toString(),
        text: fallbackPost,
        timestamp: new Date().toLocaleString(),
        topic,
        goal,
        tone,
        hashtags: fallbackTags,
      };

      const updatedPosts = [newPost, ...recentPosts].slice(0, 10);
      setRecentPosts(updatedPosts);
      localStorage.setItem("saadhyam_linkedin_recent_posts", JSON.stringify(updatedPosts));

      // Automatically advance to step 4 on fallback generation too
      setCurrentStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy text.");
    }
  };

  const handleCopyHashtags = async () => {
    if (generatedHashtags.length === 0) return;
    try {
      const hashtagsText = generatedHashtags.join(" ");
      await navigator.clipboard.writeText(hashtagsText);
      setIsHashtagsCopied(true);
      toast.success("Hashtags copied to clipboard!");
      setTimeout(() => setIsHashtagsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy hashtags.");
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedText) return;
    try {
      const element = document.createElement("a");
      const file = new Blob([generatedText], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `linkedin-post-${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("TXT file downloaded!");
    } catch (e) {
      toast.error("Download failed.");
    }
  };

  const handleClear = () => {
    setGeneratedText("");
    setGeneratedHashtags([]);
    toast.info("Editor cleared.");
  };

  const handleLoadRecentPost = (post: GeneratedPost) => {
    setGeneratedText(post.text);
    setTopic(post.topic);
    setGoal(post.goal);
    setTone(post.tone);
    if (post.hashtags) {
      setGeneratedHashtags(post.hashtags);
    } else {
      const matches = post.text.match(/#[a-zA-Z0-9_]+/g) || [];
      setGeneratedHashtags(matches);
    }
    toast.success("Recent post loaded into editor!");
    // Automatically transition to Step 4 to preview/edit the loaded draft
    setCurrentStep(4);
  };

  return (
    <div className="dark bg-slate-950 text-slate-100 min-h-[calc(100vh-64px)] py-8 px-4 md:px-8 space-y-6 flex flex-col">
      {/* Back navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/plugins"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Back to plugins"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                LinkedIn Marketing
              </h1>
              <span className="bg-purple-900/50 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-800/50 font-semibold animate-pulse-slow">
                AI Onboarding Wizard
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Create professional LinkedIn content with AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 max-w-max">
          <Info className="h-4 w-4 text-purple-400" />
          <span>Onboarding Progress Saved Locally</span>
        </div>
      </div>

      {/* Sleek Progress Indicator */}
      <div className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 md:p-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-purple-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping"></span>
            Step {currentStep} of 5: {
              currentStep === 1 ? "Welcome & Overview" :
                currentStep === 2 ? "Brand Profile Setup" :
                  currentStep === 3 ? "AI Content Generator" :
                    currentStep === 4 ? "Review & Export Draft" :
                      "Recent Posts History"
            }
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {Math.round((currentStep / 5) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar & Node Tracker */}
        <div className="relative flex items-center justify-between mt-2">
          {/* Connector Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          ></div>

          {/* Step nodes */}
          {[1, 2, 3, 4, 5].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            let stepLabel = "";
            if (stepNum === 1) stepLabel = "Welcome";
            else if (stepNum === 2) stepLabel = "Profile";
            else if (stepNum === 3) stepLabel = "Create";
            else if (stepNum === 4) stepLabel = "Review";
            else if (stepNum === 5) stepLabel = "History";

            return (
              <div key={stepNum} className="flex flex-col items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    // Allow navigation to previously completed steps or jumping forward if fields filled
                    if (stepNum < currentStep || isCompleted || stepNum === 1 || (stepNum === 3 && brandName) || (stepNum === 4 && generatedText) || stepNum === 5) {
                      setCurrentStep(stepNum);
                    } else {
                      toast.info(`Please complete the flow to unlock Step ${stepNum}.`);
                    }
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${isCompleted
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : isActive
                        ? "bg-slate-950 border-pink-500 text-pink-400 scale-110 shadow-lg shadow-pink-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                    }`}
                >
                  {isCompleted ? "✓" : stepNum}
                </button>
                <span className={`text-[10px] hidden md:inline font-semibold ${isActive ? "text-pink-400" : isCompleted ? "text-purple-400" : "text-slate-600"}`}>
                  {stepLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Card container for Steps */}
      <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full">
        <div className="flex-1 min-h-[380px]">
          {/* STEP 1: WELCOME SCREEN */}
          {currentStep === 1 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative h-full animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-900/40 text-purple-400 border border-purple-800/40 mb-3 text-3xl">
                  💼
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to LinkedIn Marketing
                </CardTitle>
                <CardDescription className="text-slate-400 text-base max-w-xl mx-auto mt-2">
                  Create high-quality, professional B2B posts optimized for LinkedIn engagement using enterprise AI assistant features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 md:px-12 pb-8">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Key Features</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: "Smart Brand Alignment", desc: "Saves company & brand context for high-converting posts" },
                      { title: "B2B Goal Settings", desc: "Select specific objectives from hiring to product launches" },
                      { title: "Advanced Hashtagging", desc: "Generate 5-10 tags tailored directly to LinkedIn's feed" },
                      { title: "Persistent History Logs", desc: "Drafts are logged locally for future access and templates" },
                    ].map((feat, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{feat.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-10 py-6 text-base rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                  >
                    Get Started <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: CONFIGURATION */}
          {currentStep === 2 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>🏢 Brand Profile Configuration</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Set up your LinkedIn company credentials and branding guidelines to align generative prompts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-300">
                      LinkedIn Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="brandName" className="text-sm font-semibold text-slate-300">
                      Brand Name
                    </Label>
                    <Input
                      id="brandName"
                      placeholder="e.g. Acme"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="industry" className="text-sm font-semibold text-slate-300">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      placeholder="e.g. SaaS / HR Tech"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tone" className="text-sm font-semibold text-slate-300">
                      Tone
                    </Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone" className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Professional" className="focus:bg-slate-800 focus:text-slate-100">Professional</SelectItem>
                        <SelectItem value="Friendly" className="focus:bg-slate-800 focus:text-slate-100">Friendly</SelectItem>
                        <SelectItem value="Technical" className="focus:bg-slate-800 focus:text-slate-100">Technical</SelectItem>
                        <SelectItem value="Sales" className="focus:bg-slate-800 focus:text-slate-100">Sales</SelectItem>
                        <SelectItem value="Startup" className="focus:bg-slate-800 focus:text-slate-100">Startup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="targetAudience" className="text-sm font-semibold text-slate-300">
                    Target Audience
                  </Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g. B2B Decision Makers, Tech Leads, HR Leaders"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(false)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: GENERATOR */}
          {currentStep === 3 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>✨ AI Post Content Builder</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Provide your target post subject context and campaign goal. AI will process inputs dynamically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="template" className="text-sm font-semibold text-slate-300">
                    Template
                  </Label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger id="template" className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="Thought Leadership" className="focus:bg-slate-800 focus:text-slate-100">Thought Leadership</SelectItem>
                      <SelectItem value="Product Launch" className="focus:bg-slate-800 focus:text-slate-100">Product Launch</SelectItem>
                      <SelectItem value="Hiring" className="focus:bg-slate-800 focus:text-slate-100">Hiring</SelectItem>
                      <SelectItem value="Customer Success Story" className="focus:bg-slate-800 focus:text-slate-100">Customer Success Story</SelectItem>
                      <SelectItem value="Company Update" className="focus:bg-slate-800 focus:text-slate-100">Company Update</SelectItem>
                      <SelectItem value="Event Promotion" className="focus:bg-slate-800 focus:text-slate-100">Event Promotion</SelectItem>
                      <SelectItem value="Industry Insights" className="focus:bg-slate-800 focus:text-slate-100">Industry Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="topic" className="text-sm font-semibold text-slate-300">
                    Topic *
                  </Label>
                  <Textarea
                    id="topic"
                    placeholder="Enter what this post should be about. For example: Promoting our local business optimization platform that enables sales teams to save 12 hours a week."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-purple-500 min-h-[120px]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="goal" className="text-sm font-semibold text-slate-300">
                      Goal
                    </Label>
                    <Select value={goal} onValueChange={setGoal}>
                      <SelectTrigger id="goal" className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Brand Awareness" className="focus:bg-slate-800 focus:text-slate-100">Brand Awareness</SelectItem>
                        <SelectItem value="Lead Generation" className="focus:bg-slate-800 focus:text-slate-100">Lead Generation</SelectItem>
                        <SelectItem value="Product Launch" className="focus:bg-slate-800 focus:text-slate-100">Product Launch</SelectItem>
                        <SelectItem value="Hiring" className="focus:bg-slate-800 focus:text-slate-100">Hiring</SelectItem>
                        <SelectItem value="Customer Story" className="focus:bg-slate-800 focus:text-slate-100">Customer Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hashtagCount" className="text-sm font-semibold text-slate-300">
                      Hashtag Count
                    </Label>
                    <Select value={hashtagCount} onValueChange={setHashtagCount}>
                      <SelectTrigger id="hashtagCount" className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500">
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="5" className="focus:bg-slate-800 focus:text-slate-100">5 hashtags</SelectItem>
                        <SelectItem value="10" className="focus:bg-slate-800 focus:text-slate-100">10 hashtags</SelectItem>
                        <SelectItem value="15" className="focus:bg-slate-800 focus:text-slate-100">15 hashtags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Profile
                  </Button>

                  <div className="flex gap-2">
                    {generatedText && (
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentStep(4)}
                        className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        Skip to Draft
                      </Button>
                    )}
                    <Button
                      onClick={handleGeneratePost}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Draft...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: REVIEW DRAFT */}
          {currentStep === 4 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-100">Review & Export Draft</CardTitle>
                  <CardDescription className="text-slate-400">
                    Review and finalize your generated post. You can edit the text directly in the editor below.
                  </CardDescription>
                </div>
                {generatedText && (
                  <div className="text-xs bg-slate-950 border border-slate-800 px-3 py-1 rounded-full font-mono text-slate-300">
                    {generatedText.length} characters
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedText ? (
                  <>
                    <Textarea
                      value={generatedText}
                      onChange={(e) => setGeneratedText(e.target.value)}
                      className="w-full bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500 min-h-[220px] font-sans text-sm leading-relaxed p-4 resize-y"
                    />

                    {generatedHashtags.length > 0 && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Suggested LinkedIn Hashtags ({generatedHashtags.length})
                          </Label>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCopyHashtags}
                            className="h-7 text-xs bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 hover:bg-slate-800 flex items-center gap-1.5"
                          >
                            {isHashtagsCopied ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Hashtags
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedHashtags.map((tag, idx) => (
                            <span
                              key={idx}
                              onClick={() => handleCopyText(tag)}
                              className="text-xs font-semibold bg-purple-950/40 border border-purple-900/30 text-purple-300 px-2.5 py-1 rounded-full hover:bg-purple-900/60 hover:border-purple-800/40 cursor-pointer transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 border-t border-slate-800/50 pt-4 mt-2">
                      <Button
                        onClick={() => handleCopyText(generatedText)}
                        className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Post Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-purple-400" />
                            Copy post text
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleDownloadTxt}
                        className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4 text-purple-400" />
                        Download TXT
                      </Button>

                      <Button
                        onClick={handleClear}
                        variant="ghost"
                        className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[260px] text-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-8">
                    <Sparkles className="w-12 h-12 stroke-[1] text-slate-700 mb-3 animate-pulse-slow" />
                    <p className="font-semibold text-slate-400">No Draft Generated Yet</p>
                    <p className="text-xs max-w-sm mt-1">
                      Your post is currently empty. Go back to Step 3 and click "Generate Post" to create content.
                    </p>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800/50 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Generator
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(5)}
                    className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5"
                  >
                    View History <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: RECENT POSTS */}
          {currentStep === 5 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📁 Recent Posts History</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Access your previously generated posts. Clicking a card will load it back into the step 4 previewer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.length > 0 ? (
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {recentPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleLoadRecentPost(post)}
                        className="bg-slate-950 border border-slate-800 hover:border-purple-900/50 hover:bg-slate-900/80 p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold bg-purple-950/60 border border-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                              {post.goal}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {post.timestamp}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-400 truncate">
                            Topic: {post.topic}
                          </p>
                          <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed font-sans">
                            {post.text}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-purple-400 hover:bg-slate-850 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(post.text);
                          }}
                          title="Copy post content"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500">
                    <Clock className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="font-semibold text-slate-400">No History Logged</p>
                    <p className="text-xs mt-1">Generated posts will accumulate here for easy reuse.</p>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800/50 pt-4 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
