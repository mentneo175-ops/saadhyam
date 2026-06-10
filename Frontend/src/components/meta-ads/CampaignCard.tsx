/**
 * Campaign Card Component
 * Beautiful card for displaying campaign information
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, Trash2, MoreVertical, TrendingUp, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCampaignStatus } from "@/lib/meta-ads-api";
import type { Campaign, CampaignStatus } from "@/types/meta-ads";

interface CampaignCardProps {
  campaign: Campaign;
  onUpdate?: () => void;
  onViewDetails?: (campaign: Campaign) => void;
}

export function CampaignCard({ campaign, onUpdate, onViewDetails }: CampaignCardProps) {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/15 text-green-700 border-green-200";
      case "PAUSED":
        return "bg-yellow-500/15 text-yellow-700 border-yellow-200";
      case "DELETED":
        return "bg-red-500/15 text-red-700 border-red-200";
      default:
        return "bg-gray-500/15 text-gray-700 border-gray-200";
    }
  };

  const getObjectiveLabel = (objective: string) => {
    const labels: Record<string, string> = {
      OUTCOME_TRAFFIC: "Traffic",
      OUTCOME_ENGAGEMENT: "Engagement",
      OUTCOME_AWARENESS: "Awareness",
      OUTCOME_LEADS: "Leads",
      OUTCOME_SALES: "Sales",
    };
    return labels[objective] || objective;
  };

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    if (newStatus === "DELETED") {
      if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
        return;
      }
    }

    setLoading(true);
    try {
      await updateCampaignStatus(campaign.id, newStatus);
      toast.success(`Campaign ${newStatus.toLowerCase()} successfully`);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1 dark:text-slate-100">
                {campaign.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {getObjectiveLabel(campaign.objective)}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreVertical className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {campaign.status === "PAUSED" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE" as CampaignStatus)}>
                    <Play className="w-4 h-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                )}
                {campaign.status === "ACTIVE" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("PAUSED" as CampaignStatus)}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleStatusChange("DELETED" as CampaignStatus)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Budget */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
            <div>
              <p className="text-xs text-gray-600">Daily Budget</p>
              <p className="text-lg font-bold text-purple-900">
                ₹{campaign.daily_budget?.toLocaleString() || "0"}
              </p>
            </div>
            {campaign.ai_recommendations?.budget && (
              <div className="text-right">
                <p className="text-xs text-gray-600">Est. Reach</p>
                <p className="text-sm font-semibold text-purple-900">
                  {campaign.ai_recommendations.budget.estimated_reach_min.toLocaleString()}-
                  {campaign.ai_recommendations.budget.estimated_reach_max.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* AI Confidence Score */}
          {campaign.ai_recommendations?.audience && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700">
                AI Confidence: {Math.round(campaign.ai_recommendations.audience.confidence_score * 100)}%
              </span>
            </div>
          )}

          {/* Created Date */}
          <div className="text-xs text-gray-500">
            Created {new Date(campaign.created_at).toLocaleDateString()}
          </div>

          {/* View Details Button */}
          <Button
            variant="outline"
            className="w-full group-hover:bg-purple-50 group-hover:border-purple-300 transition-colors"
            onClick={() => onViewDetails && onViewDetails(campaign)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
