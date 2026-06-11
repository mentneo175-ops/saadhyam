/**
 * Promote Post Modal
 * AI-powered modal for promoting Instagram posts to Meta Ads
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, TrendingUp, Users, DollarSign, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  getAudienceRecommendations,
  getBudgetRecommendations,
  promotePost,
} from "@/lib/meta-ads-api";
import type { AudienceRecommendation, BudgetRecommendation, CampaignObjective, CallToAction } from "@/types/meta-ads";

interface PromotePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: number;
    media_id?: string;  // Instagram media ID (for analytics posts)
    image_url: string;
    caption: string;
  };
  onSuccess?: () => void;
}

export function PromotePostModal({ isOpen, onClose, post, onSuccess }: PromotePostModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [audienceRec, setAudienceRec] = useState<AudienceRecommendation | null>(null);
  const [budgetRec, setBudgetRec] = useState<BudgetRecommendation | null>(null);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("OUTCOME_ENGAGEMENT" as CampaignObjective);
  const [dailyBudget, setDailyBudget] = useState<number | undefined>();
  const [duration, setDuration] = useState<number | undefined>();
  const [callToAction, setCallToAction] = useState<CallToAction | undefined>();
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadAIRecommendations();
    }
  }, [isOpen]);

  const loadAIRecommendations = async () => {
    setLoadingAI(true);
    try {
      console.log("🤖 Loading AI recommendations for post:", post);
      // Extract hashtags from caption
      const hashtags = post.caption?.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];

      console.log("🤖 Extracted hashtags:", hashtags);

      // Get AI recommendations in parallel
      const [audienceResult, budgetResult] = await Promise.all([
        getAudienceRecommendations(post.caption || "", hashtags, objective),
        getBudgetRecommendations(objective),
      ]);

      console.log("🤖 Audience Result:", audienceResult);
      console.log("🤖 Budget Result:", budgetResult);

      if (audienceResult && audienceResult.success) {
        setAudienceRec(audienceResult.recommendations);
      } else {
        console.warn("⚠️ Audience recommendations success is false or result is empty:", audienceResult);
        toast.warning("Audience recommendations could not be loaded");
      }

      if (budgetResult && budgetResult.success) {
        setBudgetRec(budgetResult.recommendations);
        // Set default values from AI
        setDailyBudget(budgetResult.recommendations.recommended_daily_budget);
        setDuration(budgetResult.recommendations.recommended_duration_days);
      } else {
        console.warn("⚠️ Budget recommendations success is false or result is empty:", budgetResult);
        toast.warning("Budget recommendations could not be loaded");
      }

      toast.success("🤖 AI recommendations generated!");
    } catch (error: any) {
      console.error("❌ Failed to get AI recommendations:", error);
      toast.error(`Failed to get AI recommendations: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePromote = async () => {
    // Validate budget and duration
    if (!dailyBudget || !duration) {
      toast.error("Please set budget and duration");
      return;
    }

    // Validate minimum budget (Meta requirement: ₹95.31 minimum)
    const MIN_BUDGET_INR = 100;  // Safe minimum above Meta's ₹95.31 requirement
    if (dailyBudget < MIN_BUDGET_INR) {
      toast.error(`Daily budget must be at least ₹${MIN_BUDGET_INR} (Meta requirement: ₹95.31)`);
      return;
    }

    setLoading(true);
    try {
      const result = await promotePost({
        // Use instagram_media_id if available (for analytics posts), otherwise use post_id (for scheduled posts)
        ...(post.media_id ? { instagram_media_id: post.media_id } : { post_id: post.id }),
        campaign_name: campaignName || undefined,
        objective,
        daily_budget: dailyBudget,
        duration_days: duration,
        call_to_action: callToAction,
        whatsapp_number: whatsappNumber || undefined,
      });

      if (result.success) {
        toast.success("🎉 Campaign created successfully!");
        toast.info("Campaign is paused. Review and activate when ready.", {
          duration: 5000,
        });
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Promote Post with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Preview */}
          <div className="flex gap-4 p-4 rounded-xl bg-linear-to-br from-purple-50 to-pink-50 dark:bg-none dark:bg-slate-950 border border-purple-200 dark:border-slate-800">
            <img
              src={post.image_url}
              alt="Post"
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600 line-clamp-3 dark:text-slate-400">{post.caption}</p>
            </div>
          </div>

          {/* AI Recommendations Loading */}
          {loadingAI && (
            <div className="p-6 rounded-xl bg-linear-to-br from-purple-100 to-pink-100 dark:bg-none dark:bg-slate-950 border-2 border-purple-300 dark:border-slate-800 text-center shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <p className="text-purple-900 font-semibold dark:text-purple-300">AI is analyzing your post...</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">Generating audience and budget recommendations</p>
            </div>
          )}

          {/* AI Audience Recommendations */}
          {audienceRec && !loadingAI && (
            <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:bg-none dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 dark:text-slate-100">
                    AI Audience Recommendations
                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs">
                      {Math.round(audienceRec.confidence_score * 100)}% confident
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300">{audienceRec.reasoning}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Age Range</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {audienceRec.recommended_age_min}-{audienceRec.recommended_age_max}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Gender</p>
                  <p className="font-semibold text-gray-900 capitalize dark:text-slate-100">
                    {Array.isArray(audienceRec.recommended_genders)
                      ? audienceRec.recommended_genders.join(", ")
                      : String(audienceRec.recommended_genders || "all")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Est. Reach</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {audienceRec.estimated_reach_min.toLocaleString()}-
                    {audienceRec.estimated_reach_max.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Engagement</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {(audienceRec.estimated_engagement_rate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {audienceRec.recommended_interests.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Recommended Interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {audienceRec.recommended_interests.slice(0, 5).map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-sm"
                      >
                        {interest.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Budget Recommendations */}
          {budgetRec && !loadingAI && (
            <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-emerald-50 dark:bg-none dark:bg-green-950/20 border-2 border-green-200 dark:border-green-900/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">AI Budget Recommendations</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300">{budgetRec.reasoning}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Daily Budget</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    ₹{budgetRec.recommended_daily_budget}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Duration</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {budgetRec.recommended_duration_days} days
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Total Budget</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    ₹{budgetRec.recommended_total_budget}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                  <p className="text-xs text-gray-600 dark:text-slate-400">Est. Clicks</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {budgetRec.estimated_clicks_min}-{budgetRec.estimated_clicks_max}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 dark:text-slate-100">
              <Target className="w-5 h-5 text-purple-600" />
              Campaign Configuration
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Name (Optional)</Label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className="space-y-2">
                <Label>Objective</Label>
                <Select value={objective} onValueChange={(v) => setObjective(v as CampaignObjective)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                    <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                    <SelectItem value="OUTCOME_AWARENESS">Awareness</SelectItem>
                    <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                    <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Daily Budget (₹)</Label>
                <Input
                  type="number"
                  value={dailyBudget || ""}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  placeholder="500"
                />
                {budgetRec && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    AI suggests: ₹{budgetRec.recommended_daily_budget}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <Input
                  type="number"
                  value={duration || ""}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  placeholder="7"
                />
                {budgetRec && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    AI suggests: {budgetRec.recommended_duration_days} days
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Call to Action (Optional)</Label>
                <Select value={callToAction} onValueChange={(v) => setCallToAction(v as CallToAction)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CTA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                    <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                    <SelectItem value="SEND_MESSAGE">Send Message</SelectItem>
                    <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                    <SelectItem value="BOOK_NOW">Book Now</SelectItem>
                    <SelectItem value="CONTACT_US">Contact Us</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>WhatsApp Number (Optional)</Label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+919876543210"
                />
              </div>
            </div>
          </div>

          {/* Total Budget Display */}
          {dailyBudget && duration && (
            <div className="p-4 rounded-xl bg-linear-to-r from-purple-100 to-pink-100 dark:bg-none dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Total Campaign Budget</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    ₹{(dailyBudget * duration).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-slate-300">Estimated Reach</p>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-300">
                    {budgetRec
                      ? `${budgetRec.estimated_reach_min.toLocaleString()}-${budgetRec.estimated_reach_max.toLocaleString()}`
                      : "Calculating..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={loading || loadingAI || !dailyBudget || !duration}
              className="flex-1 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Campaign will be created in PAUSED state. Review and activate when ready.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
