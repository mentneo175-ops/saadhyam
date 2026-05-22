import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import PartnershipWizard from "../components/PartnershipWizard";
import PartnershipNetworkExplorer from "../components/PartnershipNetworkExplorer";
import { parseFollowers, parseEngagement, formatFollowers, formatEngagement } from "../utils/formatters";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/agents/partnership")({
  head: () => ({ meta: [{ title: "Partnership Agent — Saadhyam AI" }] }),
  component: PartnershipAgentPage,
});

interface FormData {
  businessName: string;
  industry: string;
  targetAudience: string;
  collaborationGoal: string;
  partnershipType: string;
  budget: string;
  timeline: string;
  location: string;
}

interface InfluencerNode {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  followers: number;
  platform: string;
  location: string;
  matchScore: number;
  niche: string;
  profile_url: string;
  whyItWorks?: string;
  suggestedCampaign?: string;
  estimatedCost?: string;
  engagement?: string;
}

const loadingMessages = [
  "Analyzing your business niche...",
  "Searching across Instagram, YouTube, and more...",
  "Finding relevant creators in your area...",
  "Analyzing engagement metrics...",
  "Calculating match scores...",
  "Building your partnership ecosystem...",
];

function PartnershipAgentPage() {
  const [showWizard, setShowWizard] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [influencers, setInfluencers] = useState<InfluencerNode[]>([]);

  const handleWizardComplete = async (data: FormData) => {
    setFormData(data);
    setIsLoading(true);
    setShowWizard(false);

    // Cycle through loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

    try {
      console.log("🚀 Submitting partnership request:", data);

      const response = await fetch(`${env.apiBaseUrl}/api/partnership/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch partnership recommendations");
      }

      const apiData = await response.json();
      console.log("📦 API Response:", apiData);

      if (apiData.success && apiData.results) {
        // Transform and validate API response
        const transformedInfluencers: InfluencerNode[] = apiData.results.map((item: any) => {
          console.log("🔍 Processing influencer:", item);

          // Parse followers with multiple fallbacks
          const followersCount = parseFollowers(item);
          console.log(`  👥 Followers: ${followersCount} (raw: ${item.followers})`);

          // Parse engagement
          const engagementRate = parseEngagement(item);
          console.log(`  📊 Engagement: ${engagementRate} (raw: ${item.engagement})`);

          return {
            id: item.username || item.id || Math.random().toString(),
            username: item.username || item.name || "Unknown",
            full_name: item.full_name || item.name || item.username || "Unknown Creator",
            bio: item.bio || item.whyItWorks || item.collaborationFit || "Influencer profile",
            followers: followersCount,
            platform: item.platform || "Instagram",
            location: item.location || data.location,
            matchScore: item.matchScore || item.match_score || 75,
            niche: item.niche || data.industry,
            profile_url: item.profile_url || `https://instagram.com/${item.username || item.name}`,
            whyItWorks:
              item.whyItWorks || item.why_it_works || item.collaborationFit || "Great match for your business",
            suggestedCampaign: item.suggestedCampaign || item.suggested_campaign || "Collaboration campaign",
            estimatedCost: item.estimatedCost || item.estimated_cost || "₹10,000 - ₹30,000",
            engagement: formatEngagement(engagementRate),
          };
        });

        console.log("✅ Transformed influencers:", transformedInfluencers);
        setInfluencers(transformedInfluencers);
      } else {
        throw new Error(apiData.message || "No results found");
      }
    } catch (error) {
      console.error("❌ Partnership API error:", error);
      toast.error("Error fetching influencers. Please check your API configuration and try again.");
      setShowWizard(true);
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
    }
  };

  const handleBackToWizard = () => {
    setShowWizard(true);
    setInfluencers([]);
    setFormData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <AnimatePresence mode="wait">
        {showWizard ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto"
          >
            <PartnershipWizard onComplete={handleWizardComplete} isLoading={isLoading} />
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[600px] flex items-center justify-center"
          >
            <div className="text-center">
              {/* Animated Logo */}
              <motion.div
                className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>

              {/* Loading Spinner */}
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-6" />

              {/* Loading Message */}
              <motion.h2
                key={loadingMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                {loadingMessage}
              </motion.h2>
              <p className="text-gray-600">This may take a few moments...</p>

              {/* Progress Dots */}
              <div className="flex gap-2 justify-center mt-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-purple-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="network"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <PartnershipNetworkExplorer
              businessName={formData?.businessName || "Your Business"}
              industry={formData?.industry || "business"}
              influencers={influencers}
              onClose={handleBackToWizard}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
