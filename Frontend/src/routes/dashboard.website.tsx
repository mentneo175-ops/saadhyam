import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, RefreshCcw, Globe, FileText, Mail, Phone, Download, Eye } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/website")({
  head: () => ({ meta: [{ title: "Website AI — Saadhyam AI" }] }),
  component: WebsiteAIPage,
});

const sections = [
  { key: "about", label: "About Us", icon: Globe },
  { key: "services", label: "Services", icon: FileText },
  { key: "faq", label: "FAQ", icon: FileText },
  { key: "contact", label: "Contact Page", icon: Phone },
];

const templates = [
  { key: "hero-split", label: "Hero Split", desc: "Modern hero section with split layout" },
  { key: "bento-box", label: "Bento Box", desc: "Grid-based modern design" },
  { key: "card-masonry", label: "Card Masonry", desc: "Pinterest-style card layout" },
  { key: "magazine-grid", label: "Magazine Grid", desc: "Editorial magazine style" },
  { key: "parallax-scroll", label: "Parallax Scroll", desc: "Engaging parallax effects" },
  { key: "timeline-vertical", label: "Timeline", desc: "Vertical timeline layout" },
];

function WebsiteAIPage() {
  const [mode, setMode] = useState<"content" | "website">("content");
  const [activeSection, setActiveSection] = useState("about");
  const [businessInfo, setBusinessInfo] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Website generation state
  const [selectedTemplate, setSelectedTemplate] = useState("hero-split");
  const [websiteData, setWebsiteData] = useState({
    business_name: "",
    business_type: "",
    description: "",
    services: "",
    contact_email: "",
    contact_phone: "",
  });
  const [jobId, setJobId] = useState<string | null>(null);
  const [websiteStatus, setWebsiteStatus] = useState<string>("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.generateWebsiteContent(activeSection, businessInfo);
      if (response.success) {
        setGeneratedContent(response.content);
      }
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratedContent(`Generated ${activeSection} content will appear here...`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWebsite = async () => {
    setIsGenerating(true);
    setWebsiteStatus("Starting generation...");
    try {
      const servicesArray = websiteData.services.split(",").map(s => s.trim()).filter(s => s);
      
      const response = await fetch("http://localhost:8000/api/v1/website-ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiClient.getToken()}`,
        },
        body: JSON.stringify({
          business_name: websiteData.business_name,
          business_type: websiteData.business_type,
          description: websiteData.description,
          services: servicesArray,
          contact_email: websiteData.contact_email,
          contact_phone: websiteData.contact_phone,
          theme: selectedTemplate,
        }),
      });

      const data = await response.json();
      
      if (data.job_id) {
        setJobId(data.job_id);
        setWebsiteStatus(`Generation started! Job ID: ${data.job_id}`);
        // Poll for status
        pollJobStatus(data.job_id);
      }
    } catch (error) {
      console.error("Website generation error:", error);
      setWebsiteStatus("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/website-ai/jobs/${jobId}`, {
          headers: {
            "Authorization": `Bearer ${apiClient.getToken()}`,
          },
        });
        const data = await response.json();
        
        setWebsiteStatus(`Status: ${data.status} - Progress: ${data.progress}%`);
        
        if (data.status === "completed") {
          setWebsiteStatus(`✅ Website generated successfully! Website ID: ${data.website_id}`);
        } else if (data.status === "failed") {
          setWebsiteStatus(`❌ Generation failed: ${data.error_message}`);
        } else {
          // Continue polling
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error("Status check error:", error);
      }
    };
    
    checkStatus();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Website AI"
        subtitle="Generate instant website content or complete websites for your business"
        actions={
          <div className="flex gap-2">
            <Button 
              variant={mode === "content" ? "hero" : "outline"} 
              size="sm"
              onClick={() => setMode("content")}
            >
              <FileText size={14} /> Content Only
            </Button>
            <Button 
              variant={mode === "website" ? "hero" : "outline"} 
              size="sm"
              onClick={() => setMode("website")}
            >
              <Globe size={14} /> Full Website
            </Button>
          </div>
        }
      />

      {mode === "content" ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Content Generation - Original */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold mb-3">Select Section</p>
              <div className="grid grid-cols-2 gap-2">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition ${
                        activeSection === s.key
                          ? "bg-gradient-primary text-primary-foreground border-transparent shadow-sm"
                          : "border-border hover:bg-accent/40"
                      }`}
                    >
                      <Icon size={14} /> {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Business Information</p>
              <textarea
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                rows={8}
                placeholder="Enter your business details, services, location..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none"
              />
            </div>

            <Button
              variant="hero"
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Content
                </>
              )}
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Generated Content</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-success/10 text-success">
                <Sparkles size={10} /> Ready
              </span>
            </div>

            <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 mb-4 min-h-[300px] overflow-auto">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {generatedContent || "Click 'Generate Content' to create your website content"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!generatedContent}
                onClick={() => navigator.clipboard?.writeText(generatedContent)}
              >
                <Copy size={13} /> Copy
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={!generatedContent}>
                <RefreshCcw size={13} /> Regenerate
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Full Website Generation */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold mb-3">Select Template</p>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs border transition ${
                      selectedTemplate === t.key
                        ? "bg-gradient-primary text-primary-foreground border-transparent shadow-sm"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Business Details</p>
              <input
                type="text"
                placeholder="Business Name *"
                value={websiteData.business_name}
                onChange={(e) => setWebsiteData({...websiteData, business_name: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <input
                type="text"
                placeholder="Business Type (e.g., Restaurant, Spa) *"
                value={websiteData.business_type}
                onChange={(e) => setWebsiteData({...websiteData, business_type: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <textarea
                placeholder="Business Description"
                value={websiteData.description}
                onChange={(e) => setWebsiteData({...websiteData, description: e.target.value})}
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none"
              />
              <input
                type="text"
                placeholder="Services (comma-separated)"
                value={websiteData.services}
                onChange={(e) => setWebsiteData({...websiteData, services: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={websiteData.contact_email}
                onChange={(e) => setWebsiteData({...websiteData, contact_email: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={websiteData.contact_phone}
                onChange={(e) => setWebsiteData({...websiteData, contact_phone: e.target.value})}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              />
            </div>

            <Button
              variant="hero"
              className="w-full"
              size="lg"
              onClick={handleGenerateWebsite}
              disabled={isGenerating || !websiteData.business_name || !websiteData.business_type}
            >
              {isGenerating ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" /> Generating Website...
                </>
              ) : (
                <>
                  <Globe size={16} /> Generate Full Website
                </>
              )}
            </Button>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Generation Status</p>
              {jobId && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  <Sparkles size={10} /> Processing
                </span>
              )}
            </div>

            <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 mb-4 min-h-[300px]">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {websiteStatus || "Fill in the business details and click 'Generate Full Website' to create your complete website with the selected template."}
              </p>
              
              {jobId && (
                <div className="mt-4 p-3 bg-background/50 rounded-lg">
                  <p className="text-xs font-mono text-muted-foreground">Job ID: {jobId}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!jobId}
              >
                <Eye size={13} /> View Website
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled={!jobId}
              >
                <Download size={13} /> Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
