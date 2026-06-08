import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Lightbulb,
  MapPin,
  Building2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  Send,
  Trash2,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Megaphone,
  History,
  MessageSquareText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SectionCard,
  MetricCard,
  TabContentWrapper,
  EmptyInsightsState,
} from "./SEOShared";
import {
  SearchPerformanceChart,
  WebsiteAuditPanel,
  KeywordRankingList,
  KeywordPills,
  ReviewsOverview,
  MapsLocationInsights,
} from "./SEOVisualizations";
import { computeMapsScore, computeSEOScore, type SEOTipsData } from "./utils";
import {
  getGoogleBusinessAuthUrl,
  handleGoogleBusinessCallback,
  getConnectedAccounts,
  disconnectAccount,
  getConnectedLocations,
  syncLocationReviews,
  getLocationReviews,
  generateAiReply,
  submitReviewReply,
  publishLocalPost,
  getLocationPosts,
  type GoogleBusinessAccount,
  type GoogleBusinessLocation,
  type GoogleBusinessReview,
  type GoogleBusinessPost,
} from "@/lib/googleBusinessApi";

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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
              title="Target keywords"
              subtitle="Keywords being tracked for your business"
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
          <div className="grid gap-6 lg:grid-cols-1">
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
  const token = localStorage.getItem("saadhyam_token") || "";
  const ideas = data.local_visibility_ideas ?? [];
  const tips = data.ranking_tips ?? [];
  const keywords = data.keywords ?? [];
  const mapsScore = computeMapsScore(data);

  // Connection state
  const [accounts, setAccounts] = useState<GoogleBusinessAccount[]>([]);
  const [locations, setLocations] = useState<GoogleBusinessLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GoogleBusinessLocation | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<GoogleBusinessReview[]>([]);
  const [isSyncingReviews, setIsSyncingReviews] = useState(false);
  const [reviewTones, setReviewTones] = useState<Record<number, string>>({}); // review.id -> tone
  const [aiReplies, setAiReplies] = useState<Record<number, string>>({}); // review.id -> draft reply
  const [isGeneratingReply, setIsGeneratingReply] = useState<Record<number, boolean>>({}); // review.id -> loading
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<number, boolean>>({}); // review.id -> loading

  // Posting state
  const [postSummary, setPostSummary] = useState("");
  const [postCTA, setPostCTA] = useState("LEARN_MORE");
  const [postActionUrl, setPostActionUrl] = useState("");
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [postsHistory, setPostsHistory] = useState<GoogleBusinessPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    if (token) {
      fetchGbConnection();
    }
  }, [token]);

  useEffect(() => {
    if (selectedLocation) {
      fetchReviewsAndPosts(selectedLocation.id);
    } else {
      setReviews([]);
      setPostsHistory([]);
    }
  }, [selectedLocation]);

  const fetchGbConnection = async () => {
    setIsLoadingAccount(true);
    setErrorMsg(null);
    try {
      const accs = await getConnectedAccounts(token);
      setAccounts(accs.accounts);

      if (accs.accounts.length > 0) {
        const locs = await getConnectedLocations(token);
        setLocations(locs.locations);
        if (locs.locations.length > 0) {
          setSelectedLocation(locs.locations[0]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching Google Business setup:", err);
      setErrorMsg(err.message || "Failed to load Google Business accounts");
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const fetchReviewsAndPosts = async (locId: number) => {
    setIsLoadingPosts(true);
    try {
      const revs = await getLocationReviews(token, locId);
      setReviews(revs.reviews);

      const postsRes = await getLocationPosts(token, locId);
      setPostsHistory(postsRes.posts);
    } catch (err) {
      console.error("Error loading reviews/posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const authRes = await getGoogleBusinessAuthUrl(token);
      
      // Calculate popup dimensions
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authRes.oauth_url,
        "GoogleBusinessOAuth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=no`
      );

      if (!popup) {
        throw new Error("Popup blocked by browser. Please enable popups to connect.");
      }

      // Listen for message from popup
      const handleOAuthMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === "google-business-oauth-success") {
          window.removeEventListener("message", handleOAuthMessage);
          try {
            await handleGoogleBusinessCallback(token, event.data.data.code, event.data.data.state);
            popup.close();
            await fetchGbConnection();
          } catch (callbackErr: any) {
            setErrorMsg(callbackErr.message || "OAuth validation failed on the backend");
            setIsConnecting(false);
          }
        } else if (event.data?.type === "google-business-oauth-error") {
          window.removeEventListener("message", handleOAuthMessage);
          setErrorMsg(event.data.error || "Google authorization failed");
          setIsConnecting(false);
          popup.close();
        }
      };

      window.addEventListener("message", handleOAuthMessage);
    } catch (err: any) {
      console.error("Error starting oauth:", err);
      setErrorMsg(err.message || "Failed to initiate Google connection");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm("Are you sure you want to disconnect this Google Business account?")) return;
    setIsDisconnecting(true);
    try {
      await disconnectAccount(token, accountId);
      setAccounts([]);
      setLocations([]);
      setSelectedLocation(null);
    } catch (err: any) {
      console.error("Error disconnecting:", err);
      setErrorMsg(err.message || "Failed to disconnect account");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncReviews = async () => {
    if (!selectedLocation) return;
    setIsSyncingReviews(true);
    try {
      const syncRes = await syncLocationReviews(token, selectedLocation.id);
      setReviews(syncRes.reviews);
    } catch (err: any) {
      alert("Failed to sync reviews: " + (err.message || err));
    } finally {
      setIsSyncingReviews(false);
    }
  };

  const handleGenerateAiReply = async (review: GoogleBusinessReview) => {
    const tone = reviewTones[review.id] || "friendly";
    setIsGeneratingReply(prev => ({ ...prev, [review.id]: true }));
    try {
      const genRes = await generateAiReply(
        token,
        review.reviewer_name,
        review.comment || "",
        review.rating,
        tone
      );
      setAiReplies(prev => ({ ...prev, [review.id]: genRes.reply }));
    } catch (err: any) {
      alert("Failed to generate AI response: " + (err.message || err));
    } finally {
      setIsGeneratingReply(prev => ({ ...prev, [review.id]: false }));
    }
  };

  const handleSubmitReply = async (review: GoogleBusinessReview) => {
    const replyText = aiReplies[review.id];
    if (!replyText || !replyText.trim()) {
      alert("Please enter a reply before publishing.");
      return;
    }

    setIsSubmittingReply(prev => ({ ...prev, [review.id]: true }));
    try {
      const updatedRev = await submitReviewReply(token, review.id, replyText);
      setReviews(prev =>
        prev.map(r => (r.id === review.id ? { ...r, reply_comment: updatedRev.reply_comment, reply_submitted_at: updatedRev.reply_submitted_at } : r))
      );
      // Clear draft reply input
      setAiReplies(prev => {
        const copy = { ...prev };
        delete copy[review.id];
        return copy;
      });
    } catch (err: any) {
      alert("Failed to submit review reply: " + (err.message || err));
    } finally {
      setIsSubmittingReply(prev => ({ ...prev, [review.id]: false }));
    }
  };

  const handlePublishPost = async () => {
    if (!selectedLocation) return;
    if (!postSummary || !postSummary.trim()) {
      alert("Please write the post update content.");
      return;
    }

    setIsPublishingPost(true);
    try {
      const published = await publishLocalPost(
        token,
        selectedLocation.id,
        postSummary,
        postCTA,
        postActionUrl || undefined
      );

      setPostsHistory(prev => [published, ...prev]);
      setPostSummary("");
      setPostActionUrl("");
      alert("Post published successfully on Google Maps!");
    } catch (err: any) {
      alert("Failed to publish Google maps post: " + (err.message || err));
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleUseIdea = (idea: string) => {
    // Transform recommendations into an engaging post copy
    const businessName = selectedLocation ? selectedLocation.location_name.split("-")[0].trim() : "our business";
    const postDraft = `🌟 Google Maps Update from ${businessName} 🌟\n\nWe are implementing improvements for our local community! Specifically: ${idea.replace(/\.$/, "")}.\n\nVisit us to see what's new or learn more on our website. We look forward to seeing you soon!`;
    setPostSummary(postDraft);
    setPostCTA("LEARN_MORE");
    setPostActionUrl(selectedLocation?.website || "");
    
    // Smooth scroll to publisher
    document.getElementById("post-publisher-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const isConnected = accounts.length > 0;

  return (
    <TabContentWrapper tabKey="maps-panel">
      <div className="space-y-6">
        
        {/* Metric Cards Top Section */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
            label="Sync status"
            value={isConnected ? "Active" : "Offline"}
            delta={isConnected ? "Synced" : undefined}
            icon={Building2}
            delay={0.15}
          />
        </div>


        {/* Connection Block: Integrated & Premium */}
        {isLoadingAccount ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Checking Google Business connection status...</span>
          </div>
        ) : !isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.08),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.06),_transparent_28%)] p-6 md:p-8"
          >
            <div className="absolute inset-0 bg-noise opacity-5" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" /> Exclusive Marketing Pro Feature
                </div>
                <h3 className="text-xl font-bold text-foreground">Sync your Google Business Profile</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Connect your business listings with Saadhyam to enable one-click AI updates on Google Maps, manage reviews instantly with custom-tone AI replies, and sync local visibility performance data.
                </p>
                {errorMsg && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-xl mt-2 max-w-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
              <Button
                variant="hero"
                size="lg"
                disabled={isConnecting}
                onClick={handleConnect}
                className="gap-2.5 shadow-lg shadow-primary/15 whitespace-nowrap self-start md:self-center"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                Link Google Business
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-foreground">
                      {accounts[0]?.account_name || "Synced Google Account"}
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-500/15">
                      <Check className="h-2.5 w-2.5" /> Synced Active
                    </span>
                  </div>
                  {selectedLocation && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground/75" />
                      {selectedLocation.location_name} • {selectedLocation.primary_category}
                    </p>
                  )}
                  {locations.length > 1 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-muted-foreground">Select listing:</span>
                      <select
                        value={selectedLocation?.id || ""}
                        onChange={(e) => {
                          const found = locations.find(l => l.id === Number(e.target.value));
                          if (found) setSelectedLocation(found);
                        }}
                        className="text-xs rounded-lg border border-border bg-background px-2 py-1 outline-none text-foreground cursor-pointer focus:border-primary"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(accounts[0].id)}
                disabled={isDisconnecting}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/5 border-red-500/20 hover:border-red-500/30 font-medium text-xs rounded-xl transition-all ml-auto sm:ml-0"
              >
                {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                Disconnect Google Account
              </Button>
            </div>
            
            {/* Show selected location address details */}
            {selectedLocation && (
              <div className="mt-4 pt-4 border-t border-border/50 grid gap-3 sm:grid-cols-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Storefront Address</span>
                  <span className="text-foreground font-semibold leading-relaxed">{selectedLocation.address || "No address listed"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Business Contact</span>
                  <span className="text-foreground font-semibold">{selectedLocation.phone || "No phone listed"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-medium">Website Link</span>
                  {selectedLocation.website ? (
                    <a
                      href={selectedLocation.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      Visit site <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span className="text-foreground font-semibold">No website listed</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Map Ranking Recommendations & Local Ideas */}
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
            subtitle="Draft direct maps updates from these suggestions"
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
                  className="group rounded-xl border border-border/50 bg-gradient-soft/50 p-4 transition-all hover:border-primary/25 hover:shadow-soft flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{idea}</p>
                  </div>
                  
                  {isConnected && (
                    <button
                      onClick={() => handleUseIdea(idea)}
                      className="mt-3 text-xs text-primary font-semibold flex items-center gap-1 hover:underline self-end"
                    >
                      Use this Concept <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Sync features console: Reviews replying and Google post publisher */}
        {isConnected && selectedLocation && (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            
            {/* Reviews console: left column */}
            <div className="lg:col-span-7 space-y-6">
              <SectionCard
                title="Reviews Management Console"
                subtitle="Respond instantly to Google Maps customers reviews"
                icon={MessageSquareText}
                headerActions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncReviews}
                    disabled={isSyncingReviews}
                    className="h-8 gap-1 text-xs rounded-xl"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingReviews ? 'animate-spin' : ''}`} />
                    Sync reviews
                  </Button>
                }
              >
                {reviews.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                    No maps reviews loaded yet. Click 'Sync reviews' to retrieve your business customer reviews.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {reviews.map((rev) => {
                      const currentTone = reviewTones[rev.id] || "friendly";
                      const draftReplyText = aiReplies[rev.id] || "";
                      const isGenerating = isGeneratingReply[rev.id] || false;
                      const isSubmitting = isSubmittingReply[rev.id] || false;

                      return (
                        <div
                          key={rev.id}
                          className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3 transition-colors hover:bg-muted/20"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {rev.reviewer_photo ? (
                                <img
                                  src={rev.reviewer_photo}
                                  alt={rev.reviewer_name}
                                  className="h-8 w-8 rounded-full border border-border/80"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                  {rev.reviewer_name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h5 className="font-semibold text-sm text-foreground leading-tight">{rev.reviewer_name}</h5>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(rev.review_created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {/* Stars rating display */}
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < rev.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs leading-relaxed text-muted-foreground font-medium italic">
                            "{rev.comment || "Left star rating only"}"
                          </p>

                          {/* Response State details */}
                          {rev.reply_comment ? (
                            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-green-600 flex items-center gap-1.5">
                                  <Check className="h-3 w-3 stroke-[3]" /> Replied to Google Maps
                                </span>
                                {rev.reply_submitted_at && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(rev.reply_submitted_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground leading-relaxed leading-relaxed">{rev.reply_comment}</p>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-border/40 space-y-3">
                              
                              {/* Response tone selector */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-medium">Select Tone:</span>
                                {["friendly", "professional", "thankful", "apologetic"].map((tone) => (
                                  <button
                                    key={tone}
                                    onClick={() => setReviewTones(prev => ({ ...prev, [rev.id]: tone }))}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                                      currentTone === tone
                                        ? "bg-primary/10 border-primary/20 text-primary"
                                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted/10"
                                    }`}
                                  >
                                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                                  </button>
                                ))}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateAiReply(rev)}
                                  disabled={isGenerating}
                                  className="h-8 text-xs gap-1 border-primary/25 hover:bg-primary/5 hover:border-primary/35 rounded-xl font-medium"
                                >
                                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                                  AI Suggested Reply
                                </Button>
                              </div>

                              {draftReplyText && (
                                <div className="space-y-2 mt-2">
                                  <Textarea
                                    value={draftReplyText}
                                    onChange={(e) => setAiReplies(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                    placeholder="Review the AI suggestion and customize..."
                                    className="text-xs p-2.5 rounded-xl border-border bg-background max-h-[100px] leading-relaxed"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitReply(rev)}
                                    disabled={isSubmitting}
                                    className="h-8 text-xs gap-1 shadow-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                                  >
                                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                    Publish Reply to Maps
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Google Posts Hub: right column */}
            <div id="post-publisher-section" className="lg:col-span-5 space-y-6">
              <SectionCard
                title="Google Posts Hub"
                subtitle="Publish updates, sales, and announcements"
                icon={Megaphone}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Post Update Message</label>
                    <Textarea
                      value={postSummary}
                      onChange={(e) => setPostSummary(e.target.value)}
                      placeholder="🌾 Fresh organic harvest arrived at our storefront! Visit us for clean food. #organic #wellness"
                      className="text-xs p-3 rounded-xl border-border bg-background min-h-[120px] leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Call-to-Action (CTA)</label>
                      <select
                        value={postCTA}
                        onChange={(e) => setPostCTA(e.target.value)}
                        className="w-full text-xs h-9 rounded-lg border border-border bg-background px-2.5 outline-none text-foreground cursor-pointer focus:border-primary"
                      >
                        <option value="NONE">None</option>
                        <option value="LEARN_MORE">Learn More</option>
                        <option value="BOOK">Book Now</option>
                        <option value="ORDER">Order Online</option>
                        <option value="SHOP">Shop Now</option>
                        <option value="SIGN_UP">Sign Up</option>
                        <option value="CALL">Call Store</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">CTA Target Link</label>
                      <Input
                        type="url"
                        value={postActionUrl}
                        onChange={(e) => setPostActionUrl(e.target.value)}
                        placeholder="https://saadhyamorganic.com"
                        className="h-9 text-xs rounded-lg border border-border bg-background px-2.5"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handlePublishPost}
                    disabled={isPublishingPost}
                    className="w-full gap-2 font-semibold shadow-md bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-700 hover:to-sky-700 text-xs h-9 rounded-xl"
                  >
                    {isPublishingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Publish Update to Google Maps
                  </Button>
                </div>
              </SectionCard>

              {/* History list of published updates */}
              <SectionCard
                title="Posting History"
                subtitle="Updates previously published via Saadhyam"
                icon={History}
              >
                {postsHistory.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                    No posts published yet. Compose a message above to post directly to Maps.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {postsHistory.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-lg border border-border/50 bg-muted/5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              post.status === "published"
                                ? "bg-green-500/10 text-green-600 border-green-500/15"
                                : post.status === "failed"
                                ? "bg-red-500/10 text-red-500 border-red-500/15"
                                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/15"
                            }`}
                          >
                            {post.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-medium line-clamp-3 leading-relaxed">
                          {post.summary}
                        </p>
                        {post.error_message && (
                          <p className="text-[10px] text-red-500 italic bg-red-500/5 p-1 px-2 rounded">
                            Error: {post.error_message}
                          </p>
                        )}
                        {post.action_type !== "NONE" && post.action_url && (
                          <div className="text-[10px] text-primary flex items-center gap-0.5 font-semibold">
                            Button: {post.action_type} → {post.action_url.slice(0, 30)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

          </div>
        )}

        {/* Local Keywords Section */}
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
