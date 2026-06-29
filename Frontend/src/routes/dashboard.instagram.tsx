import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Image as ImageIcon,
  Calendar,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Instagram,
  Settings,
  Sparkles,
  Wand2,
  BarChart3,
  TrendingUp,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { InstagramConnectionWizard } from "@/components/instagram/InstagramConnectionWizard";
import { InstagramSettingsModal } from "@/components/instagram/InstagramSettingsModal";
import { InstagramConnectionSuccess } from "@/components/instagram/InstagramConnectionSuccess";
import { InstagramAnalyticsDashboard } from "@/components/instagram/InstagramAnalyticsDashboard";
import { PromotePostModal } from "@/components/meta-ads/PromotePostModal";
import { InstagramLoader } from "@/components/instagram/InstagramLoader";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/instagram")({
  head: () => ({ meta: [{ title: "Instagram — Saadhyam AI" }] }),
  component: InstagramPage,
});

interface InstagramPost {
  id: number;
  image_url: string;
  caption: string;
  status: string;
  scheduled_time?: string;
  posted_time?: string;
  instagram_post_id?: string;
  created_at: string;
  ai_generated: boolean;
}

interface InstagramConnectionStatus {
  is_connected: boolean;
  account_username?: string;
  page_name?: string;
  connection_error?: string;
}

function InstagramPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadHelpMessage, setUploadHelpMessage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<InstagramConnectionStatus>({
    is_connected: false,
  });
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-insta-profile",
      title: "Instagram Connection",
      heading: "1. Account Integration",
      desc: "Connect your Instagram Business account to automate posts, sync campaigns, and track metrics.",
      indicator: 1
    },
    {
      id: "tour-insta-composer",
      title: "Media Publisher",
      heading: "2. Post Composer",
      desc: "Upload images/videos, generate descriptions, configure times, and schedule items for publishing.",
      indicator: 2
    },
    {
      id: "tour-insta-queue",
      title: "Content Queue",
      heading: "3. Post Status Tracker",
      desc: "Monitor recent posts, view live statuses, or run ad boosts to reach target audiences.",
      indicator: 3
    }
  ];

  // Auto-trigger tour for new users once loaded
  useEffect(() => {
    const isCompleted = localStorage.getItem("saadhyam_tour_insta_completed");
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
        setTourStep(1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Filter active steps based on DOM presence
  useEffect(() => {
    if (isTourActive) {
      const active = tourStepsConfig.filter(step => !!document.getElementById(step.id));
      setActiveTourSteps(active);
      if (tourStep > active.length && active.length > 0) {
        setTourStep(1);
      }
    }
  }, [isTourActive]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (currentStepConfig) {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }
    }
  }, [tourStep, isTourActive, activeTourSteps]);

  // Position tracking logic supporting scrolling and window resizing
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (!currentStepConfig) return;

    const updatePosition = () => {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        setHighlightStyle({
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          position: "fixed",
          borderRadius: "16px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 4px rgba(139, 92, 246, 0.4)",
          border: "2px solid #8B5CF6",
          zIndex: 9999,
          pointerEvents: "none",
          transition: "all 0.15s ease-out",
        });

        const spaceBelow = window.innerHeight - rect.bottom;
        const placeBelow = spaceBelow > 260 || rect.top < 260;

        setTooltipStyle({
          top: placeBelow ? rect.bottom + 12 : rect.top - 280,
          left: Math.max(16, Math.min(window.innerWidth - 340, rect.left + rect.width / 2 - 160)),
          position: "fixed",
          zIndex: 10000,
          width: "320px",
          transition: "all 0.15s ease-out",
        });
      }
    };

    updatePosition();
    const timer1 = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 400);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [tourStep, isTourActive, activeTourSteps]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  
  // Promote Post Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedPostForPromotion, setSelectedPostForPromotion] = useState<InstagramPost | null>(null);
  
  // AI Caption Generation State
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("casual");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false);
  
  // Separate date and time for better control
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledHour, setScheduledHour] = useState("12");
  const [scheduledMinute, setScheduledMinute] = useState("00");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCheckingStatusRef = useRef(false);

  // Helper function to convert IST to UTC
  const convertISTtoUTC = (date: string, hour: string, minute: string): string => {
    // date format: "2026-04-29"
    // hour: "15", minute: "30"
    // These represent IST time (Asia/Kolkata timezone)
    // IST = UTC + 5:30, so UTC = IST - 5:30
    
    const [year, month, day] = date.split('-').map(Number);
    const hourNum = Number(hour);
    const minuteNum = Number(minute);
    
    console.log(`📅 IST time selected: ${date} ${hour}:${minute}`);
    console.log(`   Year: ${year}, Month: ${month}, Day: ${day}, Hour: ${hourNum}, Minute: ${minuteNum}`);
    
    // CORRECT METHOD:
    // 1. Treat the input (year, month, day, hour, minute) as IST time
    // 2. Create a UTC date by subtracting 5:30 hours from the IST values
    // 3. This gives us the equivalent UTC time
    
    // Create a date treating the input as UTC first (this is just a reference point)
    const istAsUtcDate = new Date(Date.UTC(year, month - 1, day, hourNum, minuteNum, 0));
    
    // Now subtract 5:30 hours to convert from IST to UTC
    // IST is 5:30 hours ahead of UTC, so we subtract to go backwards
    const utcDate = new Date(istAsUtcDate.getTime() - (5.5 * 60 * 60 * 1000));
    const utcIsoString = utcDate.toISOString();
    
    console.log(`🌍 UTC converted: ${utcIsoString}`);
    console.log(`   Calculation: IST ${hourNum}:${minuteNum} - 5:30 hours = UTC ${utcDate.getUTCHours()}:${String(utcDate.getUTCMinutes()).padStart(2, '0')}`);
    console.log(`   Verification: ${utcDate.toISOString()}`);
    
    return utcIsoString;
  };

  // Helper function to get minimum date (today)
  const getMinDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get current time in IST
  const getCurrentTimeIST = () => {
    const now = new Date();
    // Add 5:30 to get IST
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const hour = String(istTime.getHours()).padStart(2, '0');
    const minute = String(istTime.getMinutes()).padStart(2, '0');
    return { hour, minute };
  };

  // Helper function to validate time is in future
  const isTimeInFuture = (date: string, hour: string, minute: string): boolean => {
    if (!date) return false;
    
    const [year, month, day] = date.split('-').map(Number);
    const selectedTime = new Date(year, month - 1, day, Number(hour), Number(minute), 0);
    const now = new Date();
    
    return selectedTime > now;
  };

  // Helper function to format time display
  const formatTimeDisplay = (): string => {
    if (!scheduledDate) return "Select date & time";
    const hour12 = Number(scheduledHour) % 12 || 12;
    const ampm = Number(scheduledHour) >= 12 ? "PM" : "AM";
    return `${scheduledDate} at ${String(hour12).padStart(2, '0')}:${scheduledMinute} ${ampm}`;
  };

  useEffect(() => {
    setMounted(true);
    checkConnectionStatus();
    
    // Check if user just returned from Instagram OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram") === "success") {
      setShowSuccessPage(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-hide success page after 5 seconds
      setTimeout(() => {
        setShowSuccessPage(false);
        checkConnectionStatus();
      }, 5000);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (connectionStatus.is_connected) {
          loadPosts(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const checkConnectionStatus = async () => {
    if (isCheckingStatusRef.current) return;
    isCheckingStatusRef.current = true;
    const startTime = Date.now();
    let isAborted = false;
    try {
      setConnectionLoading(true);
      setConnectionError(null);
      const data = await apiClient.getInstagramStatus();
      setConnectionStatus(data);
      
      // If connected, load posts and trigger processing
      if (data.is_connected) {
        await loadPosts(false);
        triggerScheduledPostsProcessing();
        
        // Load AI settings
        loadAISettings();
      }
    } catch (error: any) {
      if (error?.message?.includes("aborted") || error?.name === "AbortError") {
        console.log("ℹ️ Instagram connection check request was aborted. Ignoring.");
        isAborted = true;
        return;
      }
      console.error("Failed to check Instagram connection:", error);
      setConnectionError(
        error?.message || "Failed to check Instagram connection status. Please verify the backend is running."
      );
      setConnectionStatus({ is_connected: false, connection_error: "Failed to check connection" });
    } finally {
      if (!isAborted) {
        // Ensure minimum loading duration of 800ms
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 800 - elapsedTime);
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }
        setConnectionLoading(false);
      }
      isCheckingStatusRef.current = false;
    }
  };

  const loadAISettings = async () => {
    try {
      const data = await apiClient.get<any>("/settings");
      if (data?.posting_preferences?.auto_generate_captions) {
        setAutoGenerateEnabled(data.posting_preferences.auto_generate_captions);
      }
    } catch (error) {
      console.error("Failed to load AI settings:", error);
    }
  };

  const generateAICaption = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic for the caption");
      return;
    }

    try {
      setGeneratingCaption(true);
      
      const data = await apiClient.post<any>("/instagram/generate-caption", {
        topic: aiTopic,
        tone: aiTone,
      });

      setCaption(data.caption);
      setShowAIDialog(false);
      setAiTopic("");
      toast.success("🤖 AI caption generated successfully!");
    } catch (error: any) {
      console.error("Error generating AI caption:", error);
      const errorMessage = error?.data?.detail || error?.message || "Failed to generate caption";
      toast.error(errorMessage);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      setConnectionLoading(true);
      
      const token = localStorage.getItem("saadhyam_token");
      const popup = window.open(
        `${env.apiBaseUrl}/auth/instagram/connect?token=${token}`,
        "instagram-connect",
        "width=600,height=700,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        toast.error("Popup blocked. Please allow popups and try again.");
        return;
      }

      // Listen for popup closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check connection status after popup closes
          setTimeout(() => {
            checkConnectionStatus();
          }, 1000);
        }
      }, 1000);

      // Listen for messages from popup
      const messageListener = (event: MessageEvent) => {
        const allowedOrigins = [
          window.location.origin,
          env.apiBaseUrl.replace(/\/+$/, "")
        ];
        if (!allowedOrigins.includes(event.origin)) return;
        
        const type = event.data?.type;
        if (type === "instagram-auth-success" || type === "INSTAGRAM_OAUTH_SUCCESS") {
          popup.close();
          toast.success("Instagram connected successfully!");
          checkConnectionStatus();
          window.removeEventListener("message", messageListener);
        } else if (type === "instagram-auth-error" || type === "INSTAGRAM_OAUTH_ERROR") {
          popup.close();
          toast.error(event.data.message || "Failed to connect Instagram");
          window.removeEventListener("message", messageListener);
        }
      };

      window.addEventListener("message", messageListener);

      // Cleanup after 5 minutes
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Error connecting Instagram:", error);
      toast.error("Failed to connect Instagram");
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      setConnectionLoading(true);
      
      await apiClient.post("/settings/instagram/disconnect");

      toast.success("Instagram account disconnected successfully");
      setConnectionStatus({ is_connected: false });
      setPosts([]);
    } catch (error: any) {
      console.error("Error disconnecting Instagram:", error);
      const errorMessage = error?.data?.detail || error?.message || "Failed to disconnect Instagram";
      toast.error(errorMessage);
    } finally {
      setConnectionLoading(false);
    }
  };

  // Auto-set time when schedule toggle is checked
  useEffect(() => {
    if (isScheduled && !scheduledDate) {
      const today = getMinDate();
      setScheduledDate(today);
      
      // Set time to current time + 30 minutes
      const now = new Date();
      let futureTime = new Date(now.getTime() + (30 * 60 * 1000)); // +30 minutes
      
      const hour = String(futureTime.getHours()).padStart(2, '0');
      const minute = String(futureTime.getMinutes()).padStart(2, '0');
      
      console.log(`⏰ Auto-set time to: ${hour}:${minute} (current + 30 min)`);
      
      setScheduledHour(hour);
      setScheduledMinute(minute);
    }
  }, [isScheduled]);

  const loadPosts = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      }
      
      console.log("Loading Instagram posts...");
      const data = await apiClient.get<any>("/instagram/posts");
      console.log("Posts data received:", data);
      
      // Check if posts array exists (backend returns posts directly, not wrapped in success)
      if (Array.isArray(data.posts)) {
        // Sort posts by created_at descending (newest first)
        const sortedPosts = data.posts.sort((a: InstagramPost, b: InstagramPost) => {
          const dateA = new Date(a.created_at || a.posted_time || 0);
          const dateB = new Date(b.created_at || b.posted_time || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setPosts(sortedPosts);
        console.log(`Loaded ${sortedPosts.length} posts successfully`);
        
        // Show success feedback for manual refresh
        if (showRefreshLoader) {
          toast.success(`Refreshed! Found ${sortedPosts.length} posts`, {
            duration: 2000,
          });
        }
        
        if (sortedPosts.length === 0) {
          console.log("No posts found for this user");
        }
      } else {
        console.warn("Invalid response format:", data);
        setPosts([]);
        
        if (data.error) {
          console.error("Backend error:", data.error);
        }
      }
    } catch (error) {
      console.error("Network error loading posts:", error);
      setPosts([]);
    } finally {
      if (showRefreshLoader) {
        setRefreshing(false);
      }
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (images and videos)
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      if (!isImage && !isVideo) {
        toast.error("Please select an image or video file");
        return;
      }

      // Validate file size
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
      if (file.size > maxSize) {
        const maxSizeMB = isVideo ? 100 : 10;
        if (isVideo) {
          setUploadHelpMessage(`Video file too large. Compress it here: ${env.instagramVideoCompressorUrl}`);
        } else {
          setUploadHelpMessage(`Image file too large. Maximum size is ${maxSizeMB}MB.`);
          toast.error(`Image file too large. Maximum size is ${maxSizeMB}MB.`);
        }
        return;
      }

      setUploadHelpMessage(null);

      // Validate video duration (if video)
      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          const duration = video.duration;
          
          if (duration < 3 || duration > 60) {
            toast.error("Video must be between 3 and 60 seconds long");
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            setUploadHelpMessage(null);
            return;
          }
          
          toast.success(`${isVideo ? 'Video' : 'Image'} selected (${Math.round(duration)}s)`);
        };
        
        video.src = URL.createObjectURL(file);
      } else {
        toast.success("Image selected");
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Auto-generate caption if enabled and no caption exists
      if (autoGenerateEnabled && !caption.trim()) {
        autoGenerateCaption(file.name);
      }
    }
  };

  const autoGenerateCaption = async (imageName: string) => {
    try {
      // Extract topic from image name or use generic topic
      let topic = imageName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/[-_]/g, ' ');
      if (topic.length < 3) {
        topic = "new post";
      }

      const response = await fetch(`${env.apiBaseUrl}/instagram/generate-caption`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          tone: "casual",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCaption(data.caption);
        toast.success("🤖 AI caption auto-generated!", {
          description: "You can edit it or generate a new one",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Auto-generate caption failed:", error);
      // Silently fail for auto-generation
    }
  };

  const handlePost = async () => {
    if (!selectedImage) {
      toast.error("Please select an image or video to post");
      return;
    }

    const isVideo = selectedImage.type.startsWith("video/");
    console.log(`🚀 Starting Instagram ${isVideo ? 'video' : 'image'} post...`);
    setLoading(true);
    
    try {
      let data: any;

      if (isScheduled) {
        if (!scheduledDate) {
          toast.error("Please select a scheduled date and time");
          setLoading(false);
          return;
        }
        
        // Validate time is in future
        if (!isTimeInFuture(scheduledDate, scheduledHour, scheduledMinute)) {
          toast.error("Scheduled time must be in the future (at least 5 minutes from now)");
          setLoading(false);
          return;
        }
        
        // Convert IST to UTC
        const utcIsoString = convertISTtoUTC(scheduledDate, scheduledHour, scheduledMinute);
        
        console.log(`📅 IST time (local): ${formatTimeDisplay()}`);
        console.log(`🌍 UTC time (for backend): ${utcIsoString}`);
        
        if (isVideo) {
          toast.info("Uploading video... This may take a moment", {
            duration: 5000,
          });
        }
        
        data = await apiClient.scheduleInstagramPost(selectedImage, caption, utcIsoString);
      } else {
        if (isVideo) {
          toast.info("Uploading video... This may take a moment", {
            duration: 5000,
          });
        }
        
        data = await apiClient.uploadAndPostInstagram(selectedImage, caption);
      }

      console.log("📥 Response data:", data);

      console.log("✅ Post successful, showing success toast");
      
      // Always show a basic success message first
      toast.success(`🎉 ${isVideo ? 'Video' : 'Image'} posted to Instagram successfully!`, {
        duration: 4000,
      });
      
      // Then show detailed message if available
      if (data && data.message) {
        setTimeout(() => {
          toast.success(data.message, {
            duration: 6000,
            description: data.details ? 
              `Posted to ${data.details.account} • ${data.details.posted_at}` : 
              data.post?.instagram_post_id ? 
                `Post ID: ${data.post.instagram_post_id}` : 
                `Your ${isVideo ? 'video' : 'post'} is now live on Instagram!`
          });
        }, 500);
      }
      
      console.log("Post successful:", data);
      
      // Show Instagram URL if available
      if (data.post?.instagram_url) {
        console.log("📱 Showing Instagram link toast");
        setTimeout(() => {
          toast.info("View your post on Instagram", {
            duration: 8000,
            description: "Click to open Instagram",
            action: {
              label: "Open Instagram",
              onClick: () => window.open(data.post.instagram_url, '_blank')
            }
          });
        }, 2000);
      }
      
      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setUploadHelpMessage(null);
      setCaption("");
      setScheduledDate("");
      setScheduledHour("12");
      setScheduledMinute("00");
      setIsScheduled(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Reload posts with a small delay to ensure backend has processed
      setTimeout(() => {
        console.log("🔄 Reloading posts...");
        loadPosts(false); // Don't show refresh loader for automatic reload
      }, 1500);
    } catch (error: any) {
      console.error("❌ Error during post:", error);
      const errorMessage = error?.data?.detail || error?.message || `Failed to post ${isVideo ? 'video' : 'image'} to Instagram`;
      toast.error(errorMessage);
    } finally {
      console.log("🏁 Post attempt finished");
      setLoading(false);
    }
  };

  const handlePromotePost = (post: InstagramPost) => {
    setSelectedPostForPromotion(post);
    setShowPromoteModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20"><CheckCircle size={12} className="mr-1" />Posted</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20"><Clock size={12} className="mr-1" />Scheduled</Badge>;
      case "failed":
        return <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/20"><AlertCircle size={12} className="mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // The dateString is in UTC (from backend)
      // Convert UTC to IST by adding 5:30 hours
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Format as 12-hour with AM/PM (without seconds)
      return istDate.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const triggerScheduledPostsProcessing = async () => {
    try {
      console.log("🔄 Triggering scheduled posts processing...");
      const data = await apiClient.post<any>("/instagram/process-scheduled");
      console.log("✅ Scheduled posts processed:", data);
      
      if (data.posted_count > 0) {
        toast.success(`🎉 ${data.posted_count} scheduled post(s) posted!`, {
          duration: 3000,
        });
        
        // Reload posts after processing
        setTimeout(() => {
          loadPosts(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error triggering scheduled posts processing:", error);
    }
  };

  if (!mounted) {
    return <InstagramLoader />;
  }

  // Show full-page loader while checking connection status
  if (connectionLoading) {
    return <InstagramLoader />;
  }

  // Show connection error screen if check failed (e.g. backend offline)
  if (connectionError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-5xl mx-auto flex flex-col justify-center min-h-[70vh]">
        <PageHeader
          title="Instagram"
          subtitle="Manage your Instagram business account, publish posts, and view live analytics."
        />
        <Card className="border border-red-200/50 dark:border-red-950/40 shadow-xl max-w-xl mx-auto w-full overflow-hidden bg-white/70 dark:bg-slate-950/40 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-red-600 to-orange-600" />
          <CardContent className="py-12 px-6 md:px-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-50/50 dark:ring-red-900/30">
              <AlertCircle className="w-9 h-9 text-red-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
              Connection Check Failed
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
              {connectionError}
            </p>

            <Button
              onClick={checkConnectionStatus}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg px-8 py-6 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry Connection Check
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success page after connection
  if (showSuccessPage) {
    return (
      <InstagramConnectionSuccess
        accountUsername={connectionStatus.account_username}
        pageName={connectionStatus.page_name}
        onContinue={() => {
          setShowSuccessPage(false);
          checkConnectionStatus();
        }}
        onGoToSettings={() => {
          setShowSuccessPage(false);
          setShowSettingsModal(true);
          checkConnectionStatus();
        }}
      />
    );
  }

  // Show connection wizard if not connected or if explicitly requested
  if (!connectionStatus.is_connected || showConnectionWizard) {
    return (
      <div id="tour-insta-profile" className="min-h-full bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <InstagramConnectionWizard
          onConnect={handleConnectInstagram}
          onCancel={() => setShowConnectionWizard(false)}
          isLoading={connectionLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Instagram"
          subtitle={`Connected as @${connectionStatus.account_username || 'Unknown'}`}
        />
        <div id="tour-insta-profile" className="flex items-center gap-3">
          <button
            id="tour-btn-insta-help"
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-805/40 text-slate-450 hover:bg-slate-800 hover:text-purple-400 shadow-xs transition-all cursor-pointer dark:border-slate-800"
            onClick={() => {
              setIsTourActive(true);
              setTourStep(1);
            }}
            title="Start Guided Tour"
          >
            <HelpCircle size={16} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Connected</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs for Posting and Analytics */}
      <Tabs defaultValue="posting" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="posting" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Posting
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Posting Tab - Existing Functionality */}
        <TabsContent value="posting" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
        {/* Post Creation */}
        <Card id="tour-insta-composer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={20} />
              Create Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Image or Video</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-2">
                    {selectedImage?.type.startsWith("video/") ? (
                      <video
                        src={imagePreview}
                        controls
                        className="max-w-full max-h-48 mx-auto rounded-lg"
                      />
                    ) : (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
                      />
                    )}
                    <p className="text-sm text-muted-foreground">
                      Click to change {selectedImage?.type.startsWith("video/") ? "video" : "image"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image or video
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Images: JPEG, PNG up to 10MB<br />
                      Videos: MP4, MOV (3-60s) up to 100MB
                    </p>
                  </div>
                )}
              </div>
              {uploadHelpMessage && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {uploadHelpMessage.includes("Compress it here:") ? (
                    <>
                      Video file too large. Compress it here:{" "}
                      <a
                        href={env.instagramVideoCompressorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline underline-offset-2 hover:text-amber-700"
                      >
                        open the compressor link
                      </a>
                    </>
                  ) : (
                    uploadHelpMessage
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Caption</Label>
                <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
                    >
                      <Sparkles size={14} className="mr-1.5 text-purple-600" />
                      Generate AI Caption
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Wand2 size={20} className="text-purple-600" />
                        Generate AI Caption
                      </DialogTitle>
                      <DialogDescription>
                        Let AI create an engaging caption for your Instagram post
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ai-topic">What's your post about?</Label>
                        <Input
                          id="ai-topic"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g., new product launch, Diwali offer, weekend special"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ai-tone">Tone</Label>
                        <Select value={aiTone} onValueChange={setAiTone}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casual">Casual & Friendly</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="funny">Fun & Playful</SelectItem>
                            <SelectItem value="inspirational">Inspirational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={generateAICaption}
                          disabled={generatingCaption || !aiTopic.trim()}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {generatingCaption ? (
                            <>
                              <Loader2 size={16} className="animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} className="mr-2" />
                              Generate Caption
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAIDialog(false)}
                          disabled={generatingCaption}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your Instagram caption... or use AI to generate one!"
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {caption.length}/2200 characters
                </p>
                {autoGenerateEnabled && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    <Sparkles size={12} />
                    AI Auto-generate enabled
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="schedule"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="schedule">Schedule for later</Label>
            </div>

            {/* Scheduled Time - Professional Date/Time Picker */}
            {isScheduled && (
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <Label className="text-base font-semibold text-gray-700 dark:text-slate-300">Schedule Post</Label>
                
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-700"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Time (IST)</label>
                  <div className="flex gap-2 items-center">
                    {/* Hour */}
                    <div className="flex-1">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            const h = (Number(scheduledHour) - 1 + 24) % 24;
                            setScheduledHour(String(h).padStart(2, '0'));
                          }}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={scheduledHour}
                          onChange={(e) => {
                            let h = Number(e.target.value);
                            if (h > 23) h = 23;
                            if (h < 0) h = 0;
                            setScheduledHour(String(h).padStart(2, '0'));
                          }}
                          className="flex-1 text-center py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const h = (Number(scheduledHour) + 1) % 24;
                            setScheduledHour(String(h).padStart(2, '0'));
                          }}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">Hour</p>
                    </div>

                    {/* Separator */}
                    <div className="text-2xl font-bold text-gray-400">:</div>

                    {/* Minute */}
                    <div className="flex-1">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            const m = (Number(scheduledMinute) - 5 + 60) % 60;
                            setScheduledMinute(String(m).padStart(2, '0'));
                          }}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="5"
                          value={scheduledMinute}
                          onChange={(e) => {
                            let m = Number(e.target.value);
                            if (m > 59) m = 59;
                            if (m < 0) m = 0;
                            setScheduledMinute(String(m).padStart(2, '0'));
                          }}
                          className="flex-1 text-center py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const m = (Number(scheduledMinute) + 5) % 60;
                            setScheduledMinute(String(m).padStart(2, '0'));
                          }}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">Minute</p>
                    </div>
                  </div>
                </div>

                {/* Display Preview */}
                {scheduledDate && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200 dark:bg-slate-900">
                    <p className="text-sm text-gray-600">
                      <Clock size={14} className="inline mr-2" />
                      <span className="font-semibold">{formatTimeDisplay()}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Timezone: Asia/Calcutta (IST)
                    </p>
                    
                    {/* Validation message */}
                    {!isTimeInFuture(scheduledDate, scheduledHour, scheduledMinute) && (
                      <p className="text-xs text-red-600 mt-2">
                         This time is in the past. Please select a future time.
                      </p>
                    )}
                    {isTimeInFuture(scheduledDate, scheduledHour, scheduledMinute) && (
                      <p className="text-xs text-green-600 mt-2">
                         This time is in the future. Ready to schedule!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Post Button */}
            <Button
              onClick={handlePost}
              disabled={loading || !selectedImage}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {isScheduled ? "Scheduling..." : "Posting..."}
                </>
              ) : (
                <>
                  {isScheduled ? (
                    <Calendar size={16} className="mr-2" />
                  ) : (
                    <Send size={16} className="mr-2" />
                  )}
                  {isScheduled ? "Schedule Post" : "Post Now"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card id="tour-insta-queue">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Posts</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadPosts(true)}
                      disabled={refreshing}
                      className="h-8 px-3 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      {refreshing ? (
                        <Loader2 size={16} className="animate-spin mr-1 text-blue-500" />
                      ) : (
                        <svg 
                          className="w-4 h-4 mr-1 transition-transform duration-200 hover:rotate-180" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      <span className={refreshing ? "text-blue-500" : ""}>
                        {refreshing ? "Refreshing..." : "Refresh"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh posts (Ctrl+R)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`space-y-4 max-h-96 overflow-y-auto transition-opacity duration-200 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No posts yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first Instagram post to see it here!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        console.error("Failed to load image:", post.image_url);
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjI4IiBjeT0iMjgiIHI9IjMiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDM2TDI4IDI4TDM2IDM2TDQ0IDI4VjQ0SDIwVjM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        {getStatusBadge(post.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.created_at || post.posted_time || new Date().toISOString())}
                          <span className="ml-1 text-xs text-muted-foreground/70">
                            ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                          </span>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {post.caption || "No caption"}
                      </p>
                      {post.instagram_post_id && (
                        <p className="text-xs text-green-600 mb-1">
                          Instagram ID: {post.instagram_post_id}
                        </p>
                      )}
                      {post.scheduled_time && (
                        <p className="text-xs text-blue-600 mb-1">
                          Scheduled: {formatDate(post.scheduled_time)}
                        </p>
                      )}
                      {post.posted_time && (
                        <p className="text-xs text-green-600 mb-2">
                          Posted: {formatDate(post.posted_time)}
                        </p>
                      )}
                      {/* Promote Post Button */}
                      {post.status === "posted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePromotePost(post)}
                          className="mt-2 w-full bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:text-purple-900"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Promote Post
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* Analytics Tab - New Feature */}
        <TabsContent value="analytics" className="mt-6">
          <InstagramAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <InstagramSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        connectionStatus={connectionStatus}
        onDisconnect={handleDisconnectInstagram}
        onReconnect={handleConnectInstagram}
        isLoading={connectionLoading}
      />

      {/* Promote Post Modal */}
      {selectedPostForPromotion && (
        <PromotePostModal
          isOpen={showPromoteModal}
          onClose={() => {
            setShowPromoteModal(false);
            setSelectedPostForPromotion(null);
          }}
          post={selectedPostForPromotion}
          onSuccess={() => {
            loadPosts(false);
          }}
        />
      )}

      {/* Interactive Guided Tour Overlay */}
      {isTourActive && (
        <div className="fixed inset-0 z-[9998] pointer-events-none text-slate-100">
          {/* Highlight element mask */}
          {highlightStyle.top !== undefined && (
            <div
              style={highlightStyle}
              className="fixed transition-all duration-200 ease-out pointer-events-none"
            />
          )}

          {/* Full-screen click interceptor mask for everything EXCEPT the highlighted area */}
          <div className="fixed inset-0 bg-transparent pointer-events-auto z-[998]" onClick={() => setIsTourActive(false)} />

          {/* Interactive Tooltip popup */}
          {tooltipStyle.top !== undefined && activeTourSteps[tourStep - 1] && (
            <div
              style={tooltipStyle}
              className="bg-slate-900 border border-purple-500/30 p-5 z-[10000] w-[320px] shadow-2xl rounded-2xl animate-fade-in pointer-events-auto flex flex-col gap-4 text-white"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {activeTourSteps[tourStep - 1].title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {tourStep} / {activeTourSteps.length}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <h3 className="font-extrabold text-white text-sm">
                  {activeTourSteps[tourStep - 1].heading}
                </h3>
                <p className="text-slate-300 leading-normal text-[11px]">
                  {activeTourSteps[tourStep - 1].desc}
                </p>
              </div>

              {/* Animated visual indicators */}
              <div className="h-16 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden relative">
                {activeTourSteps[tourStep - 1].indicator === 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                    </span>
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider animate-pulse">Monitoring Instagram Auth API</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <TrendingUp size={14} className="animate-bounce text-purple-400" />
                    <span>Upload Buffer Ready</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Syncing Post Feeds</span>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white transition-all border border-transparent hover:bg-white/5 rounded cursor-pointer"
                  onClick={() => setIsTourActive(false)}
                >
                  Skip
                </button>
                <div className="flex items-center gap-1.5">
                  {tourStep > 1 && (
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] text-slate-300 hover:text-white border border-white/10 rounded cursor-pointer"
                      onClick={() => setTourStep(tourStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-3 py-1 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold cursor-pointer"
                    onClick={() => {
                      if (tourStep < activeTourSteps.length) {
                        setTourStep(tourStep + 1);
                      } else {
                        setIsTourActive(false);
                        localStorage.setItem("saadhyam_tour_insta_completed", "true");
                      }
                    }}
                  >
                    {tourStep === activeTourSteps.length ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
