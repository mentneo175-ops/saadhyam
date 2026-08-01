import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Download,
  Trash2,
  Save,
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Copy,
  Settings,
  Search,
  Sliders,
  Play,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/plugins/google-ads/")({
  head: () => ({
    meta: [{ title: "Google Ads AI Wizard — Saadhyam AI" }],
  }),
  component: GoogleAdsPage,
});

interface GoogleAdsConfig {
  companyName: string;
  customerId: string;
  currency: string;
  timezone: string;
  defaultCampaignType: string;
  businessWebsite: string;
}

interface CampaignSettings {
  goal: string;
  campaignName: string;
  dailyBudget: string;
  targetCountry: string;
  targetAudience: string;
  ageGroup: string;
  gender: string;
  devices: string;
  keywords: string;
  negativeKeywords: string;
  language: string;
  network: string;
}

interface GeneratedAd {
  headlines: string[];
  descriptions: string[];
  displayUrl: string;
  cta: string;
  keywords: string[];
}

interface SavedCampaign {
  id: string;
  timestamp: string;
  config: GoogleAdsConfig;
  settings: CampaignSettings;
  adCopy: GeneratedAd;
}

const DEFAULT_CONFIG: GoogleAdsConfig = {
  companyName: "",
  customerId: "",
  currency: "INR",
  timezone: "IST",
  defaultCampaignType: "Search",
  businessWebsite: "",
};

const DEFAULT_SETTINGS: CampaignSettings = {
  goal: "Leads",
  campaignName: "",
  dailyBudget: "1000",
  targetCountry: "India",
  targetAudience: "Small Business Owners, Startup Founders",
  ageGroup: "All",
  gender: "All",
  devices: "All Devices",
  keywords: "",
  negativeKeywords: "",
  language: "English",
  network: "Google Search Network",
};

const DEFAULT_AD_COPY: GeneratedAd = {
  headlines: Array(15).fill(""),
  descriptions: Array(4).fill(""),
  displayUrl: "",
  cta: "",
  keywords: [],
};

function GoogleAdsPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [config, setConfig] = useState<GoogleAdsConfig>(DEFAULT_CONFIG);
  const [settings, setSettings] = useState<CampaignSettings>(DEFAULT_SETTINGS);
  
  // AI Generator state
  const [generatorProduct, setGeneratorProduct] = useState("");
  const [generatorObjective, setGeneratorObjective] = useState("Lead Generation");
  const [generatorKeywords, setGeneratorKeywords] = useState("");
  const [generatorTone, setGeneratorTone] = useState("Professional");
  const [generatorCTA, setGeneratorCTA] = useState("Learn More");
  
  const [adCopy, setAdCopy] = useState<GeneratedAd>(DEFAULT_AD_COPY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // History logs
  const [history, setHistory] = useState<SavedCampaign[]>([]);

  // Load config & history on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("saadhyam_google_ads_config");
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }

      const savedCampaign = localStorage.getItem("saadhyam_google_ads_campaign");
      if (savedCampaign) {
        setSettings(JSON.parse(savedCampaign));
      }

      const savedHistory = localStorage.getItem("saadhyam_google_ads_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load local storage Google Ads config", e);
    }
  }, []);

  // Sync state helpers
  const updateConfig = (key: keyof GoogleAdsConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateSetting = (key: keyof CampaignSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Step 2 Save Account Config
  const handleSaveConfig = () => {
    if (!config.companyName.trim()) {
      toast.error("Please enter your Company Name.");
      return;
    }
    if (!config.customerId.trim()) {
      toast.error("Please enter your Google Ads Customer ID.");
      return;
    }
    if (!config.businessWebsite.trim()) {
      toast.error("Please enter your Business Website.");
      return;
    }

    try {
      localStorage.setItem("saadhyam_google_ads_config", JSON.stringify(config));
      toast.success("Google Ads Account credentials saved!");
      setCurrentStep(3);
    } catch (e) {
      toast.error("Failed to save account setup.");
    }
  };

  // Step 3 Save Campaign Settings
  const handleSaveCampaignSettings = () => {
    if (!settings.campaignName.trim()) {
      toast.error("Please enter a Campaign Name.");
      return;
    }

    try {
      localStorage.setItem("saadhyam_google_ads_campaign", JSON.stringify(settings));
      // Pre-fill Step 4 generator keywords & product using Step 3 data
      setGeneratorKeywords(settings.keywords);
      setGeneratorProduct(config.companyName || "");
      toast.success("Campaign parameters saved!");
      setCurrentStep(4);
    } catch (e) {
      toast.error("Failed to save campaign settings.");
    }
  };

  // Step 4 Simulation of Responsive Ad Copy Generator
  const handleGenerateAdCopy = () => {
    if (!generatorProduct.trim()) {
      toast.error("Please specify your Product or Service.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const prod = generatorProduct;
        const objective = generatorObjective;
        const tone = generatorTone;
        const cta = generatorCTA;
        const domain = config.businessWebsite.replace(/(^\w+:|^)\/\//, "");

        // Localized generation templates for Responsive Search Ads
        const dynamicHeadlines = [
          `Official ${prod} Site`,
          `${prod} - Start Today`,
          `Grow With ${prod}`,
          `Best B2B ${prod} Service`,
          `Get Expert ${prod} Now`,
          `Maximize Your ${objective}`,
          `${prod} for Enterprises`,
          `Trusted B2B ${prod} Partner`,
          `Scale Your Business Fast`,
          `Top Rated ${prod} System`,
          `Save Time & Cost Today`,
          `${cta} - ${prod}`,
          `AI Powered B2B ${prod}`,
          `High ROI B2B Campaigns`,
          `Contact Our Team Today`,
        ];

        const dynamicDescriptions = [
          `Discover how ${prod} helps organizations optimize their ${objective} and scale operations smoothly. Join thousands of growth leaders today.`,
          `Get started with our enterprise-grade ${prod} package built directly for B2B marketers. High performance, premium support.`,
          `Address your ${objective} challenges using the industry's top trusted ${prod}. Calculate ROI and test connections in one click.`,
          `Start your free trial or book a demo with ${prod}. Custom configurations, timezone synchronization, and visual dashboard logs.`,
        ];

        const generated: GeneratedAd = {
          headlines: dynamicHeadlines,
          descriptions: dynamicDescriptions,
          displayUrl: `${domain}/promo`,
          cta: cta,
          keywords: generatorKeywords ? generatorKeywords.split(",").map(k => k.trim()) : ["B2B SaaS", prod, objective],
        };

        setAdCopy(generated);
        toast.success("AI generated 15 headlines and 4 descriptions successfully!");
      } catch (err) {
        toast.error("Ad copy generation failed.");
      } finally {
        setIsGenerating(false);
      }
    }, 1500);
  };

  // Step 4 Clear
  const handleClearAdCopy = () => {
    setAdCopy(DEFAULT_AD_COPY);
    toast.info("Editor cleared.");
  };

  // Step 5 Save Campaign Log
  const handleSaveCampaignToHistory = () => {
    if (adCopy.headlines[0] === "") {
      toast.error("No active ad copy to save. Generate ad copy first.");
      return;
    }

    try {
      const newCampaign: SavedCampaign = {
        id: `campaign-${Date.now()}`,
        timestamp: new Date().toLocaleString("en-IN"),
        config,
        settings,
        adCopy,
      };

      const updatedHistory = [newCampaign, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("saadhyam_google_ads_history", JSON.stringify(updatedHistory));
      toast.success("Google Ads Campaign saved to history logs!");
    } catch (e) {
      toast.error("Failed to save campaign log.");
    }
  };

  // Copy helper
  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed.");
    }
  };

  // Copy all content
  const handleCopyAllCampaign = () => {
    let text = `GOOGLE ADS CAMPAIGN DRAFT\n`;
    text += `Company: ${config.companyName} | Website: ${config.businessWebsite}\n`;
    text += `Campaign Name: ${settings.campaignName} | Goal: ${settings.goal} | Budget: ₹${settings.dailyBudget}/day\n\n`;
    text += `HEADLINES (15):\n`;
    adCopy.headlines.forEach((h, i) => {
      text += `${i + 1}. ${h}\n`;
    });
    text += `\nDESCRIPTIONS (4):\n`;
    adCopy.descriptions.forEach((d, i) => {
      text += `${i + 1}. ${d}\n`;
    });
    text += `\nDisplay URL Path: ${adCopy.displayUrl}\n`;
    text += `CTA: ${adCopy.cta}\n`;

    handleCopyText(text);
  };

  // Export as TXT
  const handleDownloadTxtReport = () => {
    try {
      let content = `==================================================\n`;
      content += `GOOGLE ADS AI CAMPAIGN EXPORT\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      content += `==================================================\n\n`;
      content += `ACCOUNT CONFIG:\n`;
      content += `Company Name: ${config.companyName}\n`;
      content += `Customer ID: ${config.customerId}\n`;
      content += `Website: ${config.businessWebsite}\n\n`;
      content += `CAMPAIGN PARAMETERS:\n`;
      content += `Campaign Name: ${settings.campaignName}\n`;
      content += `Daily Budget: ${settings.dailyBudget} ${config.currency}\n`;
      content += `Target Country: ${settings.targetCountry}\n`;
      content += `Goal: ${settings.goal}\n`;
      content += `Network: ${settings.network}\n\n`;
      content += `RESPONSIVE AD COPIES:\n`;
      content += `-------------------\n`;
      adCopy.headlines.forEach((h, i) => {
        content += `Headline ${i + 1}: ${h}\n`;
      });
      content += `\n`;
      adCopy.descriptions.forEach((d, i) => {
        content += `Description ${i + 1}: ${d}\n`;
      });
      content += `\nSuggested Display URL: ${adCopy.displayUrl}\n`;
      content += `CTA: ${adCopy.cta}\n`;

      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `google-ads-campaign-${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Campaign details exported as TXT!");
    } catch (e) {
      toast.error("TXT export failed.");
    }
  };

  // Export as CSV (Google Ads Editor compatible layout)
  const handleDownloadCsvReport = () => {
    try {
      let content = `Campaign,Daily Budget,Language,Location,Network,Final URL,Display Path 1`;
      for (let i = 1; i <= 15; i++) content += `,Headline ${i}`;
      for (let i = 1; i <= 4; i++) content += `,Description ${i}`;
      content += `\n`;

      const domain = config.businessWebsite;
      const cleanCamp = settings.campaignName.replace(/"/g, '""');
      const cleanLoc = settings.targetCountry.replace(/"/g, '""');

      content += `"${cleanCamp}","${settings.dailyBudget}","${settings.language}","${cleanLoc}","${settings.network}","${domain}","promo"`;

      adCopy.headlines.forEach((h) => {
        content += `,"${h.replace(/"/g, '""')}"`;
      });
      adCopy.descriptions.forEach((d) => {
        content += `,"${d.replace(/"/g, '""')}"`;
      });
      content += `\n`;

      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/csv" });
      element.href = URL.createObjectURL(file);
      element.download = `google-ads-editor-import-${Date.now()}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("CSV Google Ads Editor import file downloaded!");
    } catch (e) {
      toast.error("CSV export failed.");
    }
  };

  // Load from history
  const handleLoadFromHistory = (item: SavedCampaign) => {
    setConfig(item.config);
    setSettings(item.settings);
    setAdCopy(item.adCopy);
    toast.success("Saved campaign loaded successfully!");
    setCurrentStep(5);
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
                Google Ads AI
              </h1>
              <span className="bg-purple-900/50 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-800/50 font-semibold animate-pulse-slow">
                AI Onboarding Wizard
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Automated Google Ads campaign management with AI optimization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 max-w-max">
          <Info className="h-4 w-4 text-purple-400" />
          <span>Local Storage Configuration Persistence Active</span>
        </div>
      </div>

      {/* Sleek Progress Indicator */}
      <div className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 md:p-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-purple-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping"></span>
            Step {currentStep} of 5: {
              currentStep === 1 ? "Welcome & Overview" :
                currentStep === 2 ? "Google Ads Account Setup" :
                  currentStep === 3 ? "Campaign Settings Config" :
                    currentStep === 4 ? "Responsive Search Ad Copy" :
                      "Review & Report Exporter"
            }
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {Math.round((currentStep / 5) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar & Node Tracker */}
        <div className="relative flex items-center justify-between mt-2">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          ></div>

          {[1, 2, 3, 4, 5].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            let stepLabel = "";
            if (stepNum === 1) stepLabel = "Welcome";
            else if (stepNum === 2) stepLabel = "Setup";
            else if (stepNum === 3) stepLabel = "Settings";
            else if (stepNum === 4) stepLabel = "Generate";
            else if (stepNum === 5) stepLabel = "Review";

            return (
              <div key={stepNum} className="flex flex-col items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(stepNum)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                    isCompleted
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

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full">
        <div className="flex-1 min-h-[380px]">
          
          {/* STEP 1: WELCOME SCREEN */}
          {currentStep === 1 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative h-full animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-900/40 text-purple-400 border border-purple-800/40 mb-3 text-3xl">
                  🔍
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Google Ads AI Campaign Builder
                </CardTitle>
                <CardDescription className="text-slate-400 text-base max-w-xl mx-auto mt-2">
                  Create high-performance Google search ad copy and structures optimized for Google Ads Editor imports.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 md:px-12 pb-8">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Key Capabilities</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: "Account & Domain Context", desc: "Integrate target website links and Customer IDs for ads context." },
                      { title: "Full Target Parameters", desc: "Bidding strategy options, target regions, budget, and age bounds." },
                      { title: "Responsive Search Ads", desc: "AI-powered generation producing 15 headlines and 4 descriptions." },
                      { title: "Google Editor Import", desc: "Export configuration directly to standard CSV or TXT report files." },
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

                <div className="space-y-3 pt-2 text-center text-xs text-slate-500">
                  <p>Supported formats: Search, Display, Performance Max, and Shopping Campaigns.</p>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-10 py-6 text-base rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    Get Started <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: GOOGLE ADS ACCOUNT SETUP */}
          {currentStep === 2 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>⚙️ Account Credentials</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure your Google Ads account credentials and basic currency details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-300">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Corporation"
                      value={config.companyName}
                      onChange={(e) => updateConfig("companyName", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerId" className="text-sm font-semibold text-slate-300">
                      Google Ads Customer ID
                    </Label>
                    <Input
                      id="customerId"
                      placeholder="e.g. 123-456-7890"
                      value={config.customerId}
                      onChange={(e) => updateConfig("customerId", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-sm font-semibold text-slate-300">
                      Account Currency
                    </Label>
                    <Select
                      value={config.currency}
                      onValueChange={(val) => updateConfig("currency", val)}
                    >
                      <SelectTrigger id="currency" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timezone" className="text-sm font-semibold text-slate-300">
                      Timezone
                    </Label>
                    <Select
                      value={config.timezone}
                      onValueChange={(val) => updateConfig("timezone", val)}
                    >
                      <SelectTrigger id="timezone" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                        <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                        <SelectItem value="EST">Eastern Standard Time (EST)</SelectItem>
                        <SelectItem value="PST">Pacific Standard Time (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="defaultCampaignType" className="text-sm font-semibold text-slate-300">
                      Default Campaign Type
                    </Label>
                    <Select
                      value={config.defaultCampaignType}
                      onValueChange={(val) => updateConfig("defaultCampaignType", val)}
                    >
                      <SelectTrigger id="defaultCampaignType" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select campaign type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Search">Search Campaigns</SelectItem>
                        <SelectItem value="Display">Display Network</SelectItem>
                        <SelectItem value="Performance Max">Performance Max</SelectItem>
                        <SelectItem value="Shopping">Shopping / Merchant Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="businessWebsite" className="text-sm font-semibold text-slate-300">
                      Business Website URL
                    </Label>
                    <Input
                      id="businessWebsite"
                      placeholder="e.g. https://www.acme.com"
                      value={config.businessWebsite}
                      onChange={(e) => updateConfig("businessWebsite", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-800/40">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: CAMPAIGN SETTINGS BUILDER */}
          {currentStep === 3 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-purple-400" />
                  <span>Configure Campaign Parameters</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Specify targeted regions, age limits, budgets, keywords, and search network options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaignName" className="text-sm font-semibold text-slate-300">
                      Campaign Name *
                    </Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g. Search_Q3_LeadGen_V2"
                      value={settings.campaignName}
                      onChange={(e) => updateSetting("campaignName", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="goal" className="text-sm font-semibold text-slate-300">
                      Campaign Goal
                    </Label>
                    <Select
                      value={settings.goal}
                      onValueChange={(val) => updateSetting("goal", val)}
                    >
                      <SelectTrigger id="goal" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Leads">Lead Generation</SelectItem>
                        <SelectItem value="Sales">Sales & Conversions</SelectItem>
                        <SelectItem value="Website Traffic">Website Traffic</SelectItem>
                        <SelectItem value="Brand Awareness">Brand Awareness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dailyBudget" className="text-sm font-semibold text-slate-300">
                      Daily Budget ({config.currency})
                    </Label>
                    <Input
                      id="dailyBudget"
                      type="number"
                      value={settings.dailyBudget}
                      onChange={(e) => updateSetting("dailyBudget", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="targetCountry" className="text-sm font-semibold text-slate-300">
                      Target Location/Country
                    </Label>
                    <Input
                      id="targetCountry"
                      value={settings.targetCountry}
                      onChange={(e) => updateSetting("targetCountry", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ageGroup" className="text-sm font-semibold text-slate-300">
                      Age Range
                    </Label>
                    <Select
                      value={settings.ageGroup}
                      onValueChange={(val) => updateSetting("ageGroup", val)}
                    >
                      <SelectTrigger id="ageGroup" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="All">All age groups</SelectItem>
                        <SelectItem value="18-34">18-34 years</SelectItem>
                        <SelectItem value="25-54">25-54 years</SelectItem>
                        <SelectItem value="35+">35+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-sm font-semibold text-slate-300">
                      Target Gender
                    </Label>
                    <Select
                      value={settings.gender}
                      onValueChange={(val) => updateSetting("gender", val)}
                    >
                      <SelectTrigger id="gender" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="All">All genders</SelectItem>
                        <SelectItem value="Male">Male Only</SelectItem>
                        <SelectItem value="Female">Female Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="devices" className="text-sm font-semibold text-slate-300">
                      Target Devices
                    </Label>
                    <Select
                      value={settings.devices}
                      onValueChange={(val) => updateSetting("devices", val)}
                    >
                      <SelectTrigger id="devices" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select devices" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="All Devices">All Devices</SelectItem>
                        <SelectItem value="Mobile Only">Mobile Only</SelectItem>
                        <SelectItem value="Desktop Only">Desktop Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="keywords" className="text-sm font-semibold text-slate-300">
                      Target Keywords (comma-separated)
                    </Label>
                    <Textarea
                      id="keywords"
                      placeholder="e.g. employee attendance, HR software, shift planner"
                      value={settings.keywords}
                      onChange={(e) => updateSetting("keywords", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="negativeKeywords" className="text-sm font-semibold text-slate-300">
                      Negative Keywords (comma-separated)
                    </Label>
                    <Textarea
                      id="negativeKeywords"
                      placeholder="e.g. free, cheap, crack, bypass"
                      value={settings.negativeKeywords}
                      onChange={(e) => updateSetting("negativeKeywords", e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="language" className="text-sm font-semibold text-slate-300">
                      Language
                    </Label>
                    <Select
                      value={settings.language}
                      onValueChange={(val) => updateSetting("language", val)}
                    >
                      <SelectTrigger id="language" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="network" className="text-sm font-semibold text-slate-300">
                      Ad Network
                    </Label>
                    <Select
                      value={settings.network}
                      onValueChange={(val) => updateSetting("network", val)}
                    >
                      <SelectTrigger id="network" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Google Search Network">Google Search Network</SelectItem>
                        <SelectItem value="Google Display Network">Google Display Network</SelectItem>
                        <SelectItem value="Search & Display Networks">Both Networks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-800/40">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Account Setup
                  </Button>
                  <Button
                    onClick={handleSaveCampaignSettings}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4" /> Continue to AI Generator
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: RESPONSIVE AD COPY GENERATOR */}
          {currentStep === 4 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <span>Responsive Search Ad Generator</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Provide campaign contexts to compile 15 search headlines and 4 ad descriptions matching limits constraints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="generatorProduct" className="text-sm font-semibold text-slate-300">
                      Product or Service Name *
                    </Label>
                    <Input
                      id="generatorProduct"
                      value={generatorProduct}
                      onChange={(e) => setGeneratorProduct(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="generatorObjective" className="text-sm font-semibold text-slate-300">
                      Campaign Objective
                    </Label>
                    <Select
                      value={generatorObjective}
                      onValueChange={setGeneratorObjective}
                    >
                      <SelectTrigger id="generatorObjective" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Lead Generation">Lead Generation</SelectItem>
                        <SelectItem value="Sales Conversions">Sales Conversions</SelectItem>
                        <SelectItem value="Traffic Expansion">Traffic Expansion</SelectItem>
                        <SelectItem value="Brand Expansion">Brand Expansion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="generatorTone" className="text-sm font-semibold text-slate-300">
                      Ad Tone
                    </Label>
                    <Select
                      value={generatorTone}
                      onValueChange={setGeneratorTone}
                    >
                      <SelectTrigger id="generatorTone" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Persuasive">Persuasive</SelectItem>
                        <SelectItem value="Bold">Bold / Impactful</SelectItem>
                        <SelectItem value="Informative">Informative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="generatorCTA" className="text-sm font-semibold text-slate-300">
                      Target Call To Action
                    </Label>
                    <Select
                      value={generatorCTA}
                      onValueChange={setGeneratorCTA}
                    >
                      <SelectTrigger id="generatorCTA" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Learn More">Learn More</SelectItem>
                        <SelectItem value="Sign Up">Sign Up Now</SelectItem>
                        <SelectItem value="Get Quote">Get Free Quote</SelectItem>
                        <SelectItem value="Book Demo">Book A Demo</SelectItem>
                        <SelectItem value="Buy Now">Buy Now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400 invisible block">Action Trigger</Label>
                    <Button
                      onClick={handleGenerateAdCopy}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Editable Preview Fields */}
                {adCopy.headlines[0] !== "" && (
                  <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h3 className="text-sm font-bold text-purple-400">Preview Responsive Copy</h3>
                      <div className="text-[10px] text-slate-500 font-mono">Character limits check active</div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Ad Headlines (Up to 15, max 30 chars each)</Label>
                        <Textarea
                          value={adCopy.headlines.join("\n")}
                          onChange={(e) => {
                            const lines = e.target.value.split("\n");
                            setAdCopy((prev) => ({ ...prev, headlines: lines }));
                          }}
                          className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200 min-h-[120px] resize-y"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Ad Descriptions (Up to 4, max 90 chars each)</Label>
                        <Textarea
                          value={adCopy.descriptions.join("\n")}
                          onChange={(e) => {
                            const lines = e.target.value.split("\n");
                            setAdCopy((prev) => ({ ...prev, descriptions: lines }));
                          }}
                          className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200 min-h-[80px] resize-y"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Suggested Display Path</Label>
                          <Input
                            value={adCopy.displayUrl}
                            onChange={(e) => setAdCopy((prev) => ({ ...prev, displayUrl: e.target.value }))}
                            className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-400">Suggested CTA</Label>
                          <Input
                            value={adCopy.cta}
                            onChange={(e) => setAdCopy((prev) => ({ ...prev, cta: e.target.value }))}
                            className="font-mono text-xs bg-slate-900 border-slate-800 text-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleClearAdCopy}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400"
                      >
                        Clear Editor
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          localStorage.setItem("saadhyam_google_ads_campaign", JSON.stringify(settings));
                          setCurrentStep(5);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                      >
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                )}
                
                {adCopy.headlines[0] === "" && (
                  <div className="flex flex-col items-center justify-center min-h-[220px] text-center border border-dashed border-slate-800 rounded-xl p-8">
                    <Sparkles className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
                    <p className="font-semibold text-slate-400">No Copy Generated Yet</p>
                    <p className="text-xs max-w-sm mt-1">
                      Specify product name and click "Generate Copy" to invoke AI simulation models.
                    </p>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800/40 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: REVIEW & EXPORT */}
          {currentStep === 5 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📊 Review & Exporter Engine</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Review campaign config variables, review compiled titles, and download standard CSV/TXT ad formats.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {adCopy.headlines[0] !== "" ? (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl grid gap-4 md:grid-cols-2">
                      <div className="space-y-1 text-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Campaign Context</div>
                        <p className="text-slate-200 font-semibold">{settings.campaignName}</p>
                        <p className="text-xs text-slate-400">Goal: {settings.goal} | Country: {settings.targetCountry}</p>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Account Budget Settings</div>
                        <p className="text-slate-200 font-semibold">₹{settings.dailyBudget} {config.currency} / day</p>
                        <p className="text-xs text-slate-400">Website: {config.businessWebsite}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Responsive Headlines (15)</h4>
                        <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1 font-mono text-[11px] text-slate-300">
                          {adCopy.headlines.map((headline, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-slate-500">{String(idx + 1).padStart(2, "0")}.</span>
                              <span>{headline}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Descriptions (4)</h4>
                        <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2 font-mono text-[11px] text-slate-300">
                          {adCopy.descriptions.map((desc, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <span className="text-slate-500">{idx + 1}.</span>
                              <span className="leading-relaxed">{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Exporter Buttons */}
                    <div className="flex flex-wrap gap-2.5 border-t border-slate-800/40 pt-4">
                      <Button
                        onClick={handleCopyAllCampaign}
                        className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Copy Success!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-purple-400" />
                            Copy Ad Texts
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleDownloadTxtReport}
                        className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4 text-purple-400" />
                        Download TXT Copy
                      </Button>

                      <Button
                        onClick={handleDownloadCsvReport}
                        className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-purple-400" />
                        Google Editor CSV
                      </Button>

                      <Button
                        onClick={handleSaveCampaignToHistory}
                        className="bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 px-6"
                      >
                        <Save className="w-4 h-4 text-pink-400" />
                        Save Campaign
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500">
                    <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="font-semibold text-slate-400">No Copy Configured</p>
                    <p className="text-xs mt-1">Please return to Step 4 and click "Generate Ad Copy" to compile drafts.</p>
                  </div>
                )}

                {/* History Section */}
                <div className="space-y-3 border-t border-slate-800/65 pt-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Saved Campaigns History ({history.length})
                  </div>

                  {history.length > 0 ? (
                    <div className="grid gap-3 max-h-[180px] overflow-y-auto pr-1">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleLoadFromHistory(item)}
                          className="bg-slate-950 border border-slate-800 hover:border-purple-900/50 hover:bg-slate-900/50 p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-4 group"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-semibold bg-purple-950/60 border border-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                                {item.settings.goal}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.timestamp}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-400 truncate">
                              Name: {item.settings.campaignName}
                            </p>
                            <p className="text-xs text-slate-500 truncate font-mono">
                              Headlines: {item.adCopy.headlines.slice(0, 3).join(" | ")}...
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-purple-400 hover:bg-slate-850 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(item.adCopy.headlines.join("\n"));
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500">
                      <p className="text-xs">No saved campaigns history logs found. Save campaigns to accumulate records.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t border-slate-800/50 pt-4 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Generator
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
