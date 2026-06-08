import { motion } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Users,
  Globe,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Share2,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Business } from "./types";
import { env } from "@/config/env";
import { apiClient } from "@/lib/api";

interface BusinessDetailPanelProps {
  business: Business;
  onClose: () => void;
}

export function BusinessDetailPanel({
  business,
  onClose,
}: BusinessDetailPanelProps) {
  const aiScore = business.aiScore ?? (business as any).ai_score;
  const isVerified = business.isVerified ?? (business as any).is_verified;
  const isPartner = business.isPartner ?? (business as any).is_partner;

  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    pending: boolean;
    roomId?: string;
    requestId?: string;
    sentByMe?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    if (business.source === "saadhyam") {
      checkConnection();
    }
  }, [business.id]);

  const checkConnection = async () => {
    try {
      // Extract numeric ID from "saadhyam-29" format
      const numericId = business.id.replace("saadhyam-", "");
      const data = await apiClient.get(`/api/b2b-chat/check-connection/${numericId}`);
      setConnectionStatus(data);
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      // If already connected, open chat
      if (connectionStatus?.connected && connectionStatus.roomId) {
        window.location.href = `/dashboard/b2b-chat?room=${connectionStatus.roomId}`;
        return;
      }

      // If request is pending and sent by me, don't allow resending
      if (connectionStatus?.pending && connectionStatus.sentByMe) {
        // Just show info, don't send again
        return;
      }

      // Extract numeric ID from "saadhyam-29" format
      let numericId = business.id;
      if (business.id.includes("saadhyam-")) {
        numericId = business.id.replace("saadhyam-", "");
      }

      console.log("Sending connection request:", {
        businessId: business.id,
        numericId,
        businessName: business.name
      });

      // Send connection request using apiClient
      try {
        await apiClient.post("/api/b2b-chat/connections/request", {
          receiver_id: numericId,
          message: `Hi! I'd like to connect with ${business.name}.`,
        });
        await checkConnection();
      } catch (error: any) {
        console.error("Connection request error:", error);
        const detail = error.data?.detail || error.message;
        
        // Handle specific error cases - still refresh to update UI
        if (detail === "Connection request already sent" || detail === "Already connected") {
          await checkConnection();
        } else {
          toast.error("Error", {
            description: detail || "Failed to send connection request",
          });
        }
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast.error("Error", {
        description: "Failed to send connection request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    // Generate invite link
    const link = `${window.location.origin}/signup?ref=b2b&business=${encodeURIComponent(business.name)}`;
    setInviteLink(link);

    // Copy to clipboard
    navigator.clipboard.writeText(link);
    toast.success("Link Copied!", {
      description: "Sadhyam invite link copied to clipboard",
    });
  };

  const getConnectButtonContent = () => {
    if (loading) {
      return (
        <>
          <Clock className="w-4 h-4 mr-2 animate-spin" />
          Sending...
        </>
      );
    }

    if (connectionStatus?.connected) {
      return (
        <>
          <MessageCircle className="w-4 h-4 mr-2" />
          Open Chat
        </>
      );
    }

    if (connectionStatus?.pending) {
      if (connectionStatus.sentByMe) {
        return (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Request Sent
          </>
        );
      } else {
        return (
          <>
            <Send className="w-4 h-4 mr-2" />
            Accept Request
          </>
        );
      }
    }

    return (
      <>
        <Send className="w-4 h-4 mr-2" />
        Send Request
      </>
    );
  };
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {business.name}
                </h2>
                <p className="text-sm text-muted-foreground">{business.category}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {isVerified && (
              <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  Verified
                </span>
              </div>
            )}
            {isPartner && (
              <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  Saadhyam Partner
                </span>
              </div>
            )}
            {business.source === "external" && (
              <div className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">
                  External
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {business.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                About
              </h3>
              <div className="relative">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {isDescriptionExpanded 
                    ? business.description 
                    : business.description.length > 200
                      ? `${business.description.substring(0, 200)}...`
                      : business.description
                  }
                </p>
                {business.description.length > 200 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Read more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {business.employees && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/60">
                <Users className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {business.employees}
                </p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
            )}
            {aiScore !== undefined && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 shadow-sm animate-pulse">
                <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {aiScore}%
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-300">Synergy Match</p>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {business.services.map((service, index) => (
                <div
                  key={index}
                  className="px-3 py-1 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 text-sm"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Location
            </h3>
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>
                {business.location.lat.toFixed(4)},{" "}
                {business.location.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Website */}
          {business.website && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Website
              </h3>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>{business.website}</span>
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {/* Only show chat for Sadhyam users */}
            {business.source === "saadhyam" ? (
              <>
                {connectionStatus?.connected ? (
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleConnect}
                    disabled={loading}
                  >
                    {getConnectButtonContent()}
                  </Button>
                ) : connectionStatus?.pending && connectionStatus.sentByMe ? (
                  <Button
                    variant="outline"
                    className="flex-1 cursor-not-allowed opacity-60"
                    disabled
                  >
                    {getConnectButtonContent()}
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleConnect}
                    disabled={loading}
                  >
                    {getConnectButtonContent()}
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                <MessageCircle className="w-4 h-4 mr-2" />
                Not on Sadhyam
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Invite to Sadhyam (for external businesses) */}
          {business.source === "external" && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
              <p className="text-sm text-purple-900 mb-3 font-medium">
                This business is not on Sadhyam yet. Invite them to connect!
              </p>
              <Button variant="hero" className="w-full" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Sadhyam Invite
              </Button>
              {inviteLink && (
                <p className="text-xs text-purple-700 mt-2 break-all">
                  {inviteLink}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
