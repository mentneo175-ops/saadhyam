import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, RefreshCcw, Globe, FileText, Mail, Phone } from "lucide-react";
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

function WebsiteAIPage() {
  const [activeSection, setActiveSection] = useState("about");
  const [businessInfo, setBusinessInfo] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Website AI"
        subtitle="Generate instant website content for your business"
        actions={
          <Button variant="hero" size="sm">
            <Sparkles size={14} /> Quick Generate
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Input Panel */}
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

        {/* Output Panel */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Generated Content</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-success/10 text-success">
              <Sparkles size={10} /> Ready
            </span>
          </div>

          <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 mb-4 min-h-[300px]">
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
    </div>
  );
}
