import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Pause,
  Play,
  Square,
  PhoneCall,
  PhoneOff,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

export const Route = createFileRoute("/dashboard/voice-agent/campaigns/$campaignId/calling")({
  component: CallingInterfacePage,
});

interface CallProgress {
  campaign_id: number;
  campaign_name: string;
  status: string;
  total_contacts: number;
  completed: number;
  failed: number;
  queued: number;
  in_progress: number;
  progress_percentage: number;
  current_call: {
    call_id: number;
    contact_name: string;
    phone_number: string;
    status: string;
    started_at: string;
    duration_seconds: number;
  } | null;
  stats_by_status: Record<string, number>;
}

function CallingInterfacePage() {
  const { campaignId } = Route.useParams();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(true);

  // Fetch call progress with auto-refresh
  const { data: progressData, isLoading } = useQuery<{ success: boolean; progress: CallProgress }>({
    queryKey: ["voice-campaign-call-progress", campaignId],
    queryFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/voice-agent/campaigns/${campaignId}/call-progress`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch progress");
      return response.json();
    },
    refetchInterval: isPolling ? 2000 : false, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });

  const progress = progressData?.progress;

  // Pause campaign mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/voice-agent/campaigns/${campaignId}/pause-calling`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to pause campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-call-progress", campaignId] });
    },
  });

  // Resume campaign mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `http://localhost:8000/api/voice-agent/campaigns/${campaignId}/resume-calling`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to resume campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-campaign-call-progress", campaignId] });
    },
  });

  // Stop polling when campaign is completed or paused
  useEffect(() => {
    if (progress) {
      if (progress.status === "completed" || progress.status === "paused") {
        setIsPolling(false);
      } else if (progress.status === "active") {
        setIsPolling(true);
      }
    }
  }, [progress?.status]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading calling interface...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-6">
        <div className="text-center">
          <PhoneOff size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Calling Data</h2>
          <p className="text-gray-600 mb-4">Unable to load calling progress.</p>
          <Button onClick={() => (window.location.href = `/dashboard/voice-agent/campaigns/${campaignId}`)}>
            Back to Campaign
          </Button>
        </div>
      </div>
    );
  }

  const isActive = progress.status === "active";
  const isPaused = progress.status === "paused";
  const isCompleted = progress.status === "completed";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = `/dashboard/voice-agent/campaigns/${campaignId}`)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{progress.campaign_name}</h1>
            <p className="text-gray-600 mt-1">Live Calling Interface</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {isActive && (
            <Button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
            >
              <Pause size={16} className="mr-2" />
              Pause Campaign
            </Button>
          )}
          {isPaused && (
            <Button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play size={16} className="mr-2" />
              Resume Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-2 ${
        isActive ? "border-green-500 bg-green-50" :
        isPaused ? "border-yellow-500 bg-yellow-50" :
        isCompleted ? "border-blue-500 bg-blue-50" :
        "border-gray-300"
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive && (
                <>
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </div>
                  <span className="text-lg font-semibold text-green-700">🔴 Calling in Progress</span>
                </>
              )}
              {isPaused && (
                <>
                  <Pause className="text-yellow-600" size={20} />
                  <span className="text-lg font-semibold text-yellow-700">⏸️ Campaign Paused</span>
                </>
              )}
              {isCompleted && (
                <>
                  <CheckCircle className="text-blue-600" size={20} />
                  <span className="text-lg font-semibold text-blue-700">✅ Campaign Completed</span>
                </>
              )}
            </div>
            <Badge className="text-lg px-4 py-2">
              {progress.completed + progress.failed} / {progress.total_contacts} calls
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Campaign Progress</span>
              <span className="font-semibold text-purple-600">{progress.progress_percentage.toFixed(1)}%</span>
            </div>
            <Progress value={progress.progress_percentage} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="mx-auto mb-2 text-red-600" size={24} />
              <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-2xl font-bold text-blue-600">{progress.queued}</p>
              <p className="text-sm text-gray-600">Queued</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <PhoneCall className="mx-auto mb-2 text-purple-600" size={24} />
              <p className="text-2xl font-bold text-purple-600">{progress.in_progress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Call */}
      {progress.current_call && (
        <Card className="border-2 border-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Phone className="text-purple-600 animate-pulse" size={24} />
              Current Call
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contact Name</p>
                  <p className="text-2xl font-bold text-gray-900">{progress.current_call.contact_name}</p>
                </div>
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  {progress.current_call.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-lg font-semibold text-gray-900">{progress.current_call.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Call Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(progress.current_call.duration_seconds)}
                  </p>
                </div>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                <div className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </div>
                <span>Live call in progress...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No active call message */}
      {!progress.current_call && isActive && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Preparing next call...</p>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {isCompleted && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">Campaign Completed!</h3>
            <p className="text-green-700 mb-6">
              All {progress.total_contacts} contacts have been processed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => (window.location.href = `/dashboard/voice-agent/campaigns/${campaignId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <TrendingUp size={16} className="mr-2" />
                View Results
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard/voice-agent")}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Phone className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">About This Interface</h4>
              <p className="text-sm text-gray-600">
                This page shows real-time progress of your voice campaign. Calls are processed automatically
                in the background. You can pause/resume the campaign at any time. The page updates every 2 seconds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
