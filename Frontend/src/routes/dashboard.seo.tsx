import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { SEOLayout } from "@/components/seo/SEOLayout";
import {
  SEOPageHeader,
  SEOTabSwitcher,
  AnalyzeBusinessForm,
  QuickActionsGrid,
  ProTipsBanner,
  type SEOTabId,
} from "@/components/seo/SEOShared";
import { SEOTabPanel, MapsTabPanel, PostIdeasSection } from "@/components/seo/SEOTabPanels";

export const Route = createFileRoute("/dashboard/seo")({
  head: () => ({ meta: [{ title: "SEO & Google Maps — Saadhyam AI" }] }),
  component: SEOPage,
});

function SEOPage() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [postIdeas, setPostIdeas] = useState<Array<{ title: string; desc: string }>>([]);
  const [activeTab, setActiveTab] = useState<SEOTabId>("seo");
  const [hasResults, setHasResults] = useState(false);

  const handleOptimize = async () => {
    if (!businessType.trim() || !location.trim()) {
      toast.error("Please enter business type and location");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.getSEOKeywords(businessType, location);

      if (response.success) {
        setKeywords(response.keywords);
        setTips(response.tips);
        setPostIdeas(response.post_ideas);
        setHasResults(true);
        toast.success("SEO insights generated!");
      } else {
        toast.error("Failed to generate SEO insights");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate SEO insights";
      console.error("SEO generation error:", error);
      toast.error(message);

      setKeywords([
        `best ${businessType} ${location}`,
        `${businessType} near me`,
        `top ${businessType} ${location}`,
        `affordable ${businessType}`,
        `${businessType} services`,
      ]);
      setTips([
        "Complete your Google Business Profile 100%",
        "Get at least 50+ positive reviews",
        "Post weekly updates with photos",
        "Respond to all reviews within 24 hours",
      ]);
      setPostIdeas([
        { title: "Special Offer", desc: "30% off this week" },
        { title: "New Service", desc: "Introducing new services" },
        { title: "Customer Success", desc: "See our latest transformations" },
        { title: "Health Tip", desc: "Expert tips for you" },
      ]);
      setHasResults(true);
    } finally {
      setLoading(false);
    }
  };

  const tipsData = {
    keywords,
    ranking_tips: tips,
    local_visibility_ideas: postIdeas.map((p) => `${p.title}: ${p.desc}`),
  };

  const handleQuickAction = (title: string) => {
    if (title === "Google Business Profile") {
      setActiveTab("maps");
      return;
    }

    setActiveTab("seo");
  };

  return (
    <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-background p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" aria-hidden />
      <SEOLayout>
        <SEOPageHeader
          title="SEO & Google Maps"
          subtitle="Boost your local search ranking with AI-powered insights"
        />

        <AnalyzeBusinessForm
          businessType={businessType}
          location={location}
          loading={loading}
          onBusinessTypeChange={setBusinessType}
          onLocationChange={setLocation}
          onSubmit={handleOptimize}
        />

        {hasResults && (
          <>
            <SEOTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "seo" ? (
              <>
                <SEOTabPanel data={tipsData} />
                <PostIdeasSection posts={postIdeas} />
              </>
            ) : (
              <MapsTabPanel data={tipsData} />
            )}
          </>
        )}

        <QuickActionsGrid delay={hasResults ? 0.35 : 0.2} onAction={handleQuickAction} />
        <ProTipsBanner delay={hasResults ? 0.42 : 0.28} />
      </SEOLayout>
    </div>
  );
}
