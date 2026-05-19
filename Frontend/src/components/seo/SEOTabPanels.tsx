import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Lightbulb,
  MapPin,
  Building2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  SectionCard,
  MetricCard,
  TabContentWrapper,
  EmptyInsightsState,
} from "./SEOShared";
import {
  SEOScoreGauge,
  SearchPerformanceChart,
  WebsiteAuditPanel,
  KeywordRankingList,
  KeywordPills,
  ReviewsOverview,
  MapsLocationInsights,
} from "./SEOVisualizations";
import { computeMapsScore, computeSEOScore, type SEOTipsData } from "./utils";

interface SEOTabPanelProps {
  data: SEOTipsData;
}

export function SEOTabPanel({ data }: SEOTabPanelProps) {
  const [keywordSearch, setKeywordSearch] = useState("");
  const keywords = data.keywords ?? [];
  const tips = data.ranking_tips ?? [];
  const score = computeSEOScore(data);

  const hasContent = keywords.length > 0 || tips.length > 0;

  if (!hasContent) {
    return <EmptyInsightsState message="No SEO data available yet. Run analysis to generate keyword and ranking insights." />;
  }

  return (
    <TabContentWrapper tabKey="seo-panel">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Target keywords"
            value={String(keywords.length)}
            delta={keywords.length > 0 ? "Active" : undefined}
            icon={Search}
            delay={0}
          />
          <MetricCard
            label="SEO score"
            value={`${score}`}
            delta={score >= 70 ? "Strong" : "Growing"}
            icon={Star}
            delay={0.05}
          />
          <MetricCard
            label="Ranking tips"
            value={String(tips.length)}
            icon={Lightbulb}
            delay={0.1}
          />
          <MetricCard
            label="Weekly trend"
            value="+18%"
            delta="Est."
            icon={Search}
            delay={0.15}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SEOScoreGauge score={score} label="SEO health score" />
          </div>
          <div className="lg:col-span-2">
            <SearchPerformanceChart keywordCount={keywords.length} delay={0.08} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {keywords.length > 0 && (
            <SectionCard
              title="Target keywords"
              subtitle="Optimize your content for these search terms"
              icon={Search}
              delay={0.12}
            >
              <KeywordPills keywords={keywords} />
            </SectionCard>
          )}

          {keywords.length > 0 && (
            <SectionCard
              title="Keyword rankings"
              subtitle="Estimated positions for your target terms"
              icon={Star}
              delay={0.14}
            >
              <div className="mb-4">
                <Input
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  placeholder="Filter keywords…"
                  className="h-10 rounded-xl border-border bg-background"
                />
              </div>
              <KeywordRankingList
                keywords={keywords}
                searchQuery={keywordSearch}
                delay={0.16}
              />
            </SectionCard>
          )}
        </div>

        {tips.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <WebsiteAuditPanel tips={tips} delay={0.18} />
            <SectionCard
              title="Ranking recommendations"
              subtitle="Actions to improve search visibility"
              icon={Star}
              delay={0.2}
            >
              <div className="space-y-3">
                {tips.map((tip, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22 + idx * 0.05 }}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 transition-colors hover:border-primary/15 hover:bg-primary/5"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                  </motion.div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </TabContentWrapper>
  );
}

export function MapsTabPanel({ data }: SEOTabPanelProps) {
  const ideas = data.local_visibility_ideas ?? [];
  const tips = data.ranking_tips ?? [];
  const keywords = data.keywords ?? [];
  const mapsScore = computeMapsScore(data);

  const hasContent = ideas.length > 0 || tips.length > 0 || keywords.length > 0;

  if (!hasContent) {
    return (
      <EmptyInsightsState message="No Google Maps insights yet. Complete business analysis for local visibility recommendations." />
    );
  }

  return (
    <TabContentWrapper tabKey="maps-panel">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Maps score"
            value={`${mapsScore}`}
            delta={mapsScore >= 65 ? "Healthy" : "Building"}
            icon={MapPin}
            delay={0}
          />
          <MetricCard
            label="Visibility ideas"
            value={String(ideas.length)}
            icon={Lightbulb}
            delay={0.05}
          />
          <MetricCard
            label="Local keywords"
            value={String(keywords.length)}
            icon={Search}
            delay={0.1}
          />
          <MetricCard
            label="Optimization tips"
            value={String(tips.length)}
            icon={Building2}
            delay={0.15}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SEOScoreGauge score={mapsScore} label="Local presence score" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:col-span-2"
          >
            <MapsLocationInsights
              ideasCount={ideas.length}
              tipsCount={tips.length}
              delay={0.1}
            />
          </motion.div>
        </div>

        <ReviewsOverview delay={0.14} />

        {tips.length > 0 && (
          <SectionCard
            title="Google Maps ranking tips"
            subtitle="Improve your Business Profile visibility"
            icon={Star}
            delay={0.16}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {tips.map((tip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.18 + idx * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:border-primary/20 hover:shadow-soft"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18 + idx * 0.04 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </motion.div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        )}

        {ideas.length > 0 && (
          <SectionCard
            title="Local visibility ideas"
            subtitle="Strategies to increase your local presence"
            icon={MapPin}
            delay={0.2}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {ideas.map((idea, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 + idx * 0.05 }}
                  whileHover={{ y: -3 }}
                  className="group rounded-xl border border-border/50 bg-gradient-soft/50 p-4 transition-all hover:border-primary/25 hover:shadow-soft"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{idea}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        )}

        {keywords.length > 0 && (
          <SectionCard
            title="Local search terms"
            subtitle="Keywords customers use to find you on Maps"
            icon={Search}
            delay={0.24}
          >
            <KeywordPills keywords={keywords} />
          </SectionCard>
        )}
      </div>
    </TabContentWrapper>
  );
}

export function PostIdeasSection({
  posts,
}: {
  posts: Array<{ title: string; desc: string }>;
}) {
  if (!posts.length) return null;

  return (
    <SectionCard
      title="Google Posts ideas"
      subtitle="Engage your audience with these post concepts"
      icon={Lightbulb}
      className="mt-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.06 }}
            whileHover={{ y: -3 }}
            className="group rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground">{post.title}</h4>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{post.desc}</p>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}
