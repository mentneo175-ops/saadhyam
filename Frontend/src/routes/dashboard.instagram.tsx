import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

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

function InstagramPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Separate date and time for better control
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledHour, setScheduledHour] = useState("12");
  const [scheduledMinute, setScheduledMinute] = useState("00");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    loadPosts(false);
    triggerScheduledPostsProcessing();
    
    console.log("🧪 Testing toast system...");
    setTimeout(() => {
      toast.info("Instagram page loaded successfully", {
        duration: 2000,
      });
    }, 500);

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        loadPosts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      const token = localStorage.getItem("saadhyam_token");
      
      if (!token) {
        console.error("No auth token found");
        setPosts([]);
        return;
      }
      
      const response = await fetch("http://localhost:8000/instagram/posts", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("Posts response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
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
      } else {
        console.error("Failed to load posts:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData);
        setPosts([]);
        
        if (response.status === 401) {
          console.error("Authentication failed - token may be expired");
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
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file too large. Maximum size is 10MB.");
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!selectedImage) {
      toast.error("Please select an image to post");
      return;
    }

    console.log("🚀 Starting Instagram post...");
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("caption", caption);

      let endpoint = "/instagram/upload-and-post";
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
        
        endpoint = "/instagram/schedule-post";
        
        // Convert IST to UTC
        const utcIsoString = convertISTtoUTC(scheduledDate, scheduledHour, scheduledMinute);
        
        console.log(`📅 IST time (local): ${formatTimeDisplay()}`);
        console.log(`🌍 UTC time (for backend): ${utcIsoString}`);
        
        formData.append("scheduled_time", utcIsoString);
      }

      console.log(`📤 Posting to: ${endpoint}`);
      console.log(`📝 Caption: ${caption}`);
      console.log(`🖼️ Image: ${selectedImage.name} (${selectedImage.size} bytes)`);

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("saadhyam_token")}`,
        },
        body: formData,
      });

      console.log(`📥 Response status: ${response.status}`);
      
      const data = await response.json();
      console.log("📥 Response data:", data);

      if (response.ok) {
        console.log("✅ Post successful, showing success toast");
        
        // Always show a basic success message first
        toast.success("🎉 Posted to Instagram successfully!", {
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
                  "Your post is now live on Instagram!"
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
      } else {
        console.log("❌ Post failed, showing error toast");
        const errorMessage = data.detail || data.message || "Failed to post to Instagram";
        toast.error(errorMessage);
        console.error("Post failed:", data);
      }
    } catch (error) {
      console.error("❌ Network error during post:", error);
      toast.error("Network error: Failed to post to Instagram");
    } finally {
      console.log("🏁 Post attempt finished");
      setLoading(false);
    }
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
      const token = localStorage.getItem("saadhyam_token");
      
      if (!token) return;
      
      const response = await fetch("http://localhost:8000/instagram/process-scheduled", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
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
      } else {
        console.error("Failed to process scheduled posts:", response.status);
      }
    } catch (error) {
      console.error("Error triggering scheduled posts processing:", error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl">
      <PageHeader
        title="Instagram"
        subtitle="Post and schedule content to your Instagram account"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Post Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={20} />
              Create Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Image</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG up to 10MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your Instagram caption..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {caption.length}/2200 characters
              </p>
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
                <Label className="text-base font-semibold text-gray-700">Schedule Post</Label>
                
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Time (IST)</label>
                  <div className="flex gap-2 items-center">
                    {/* Hour */}
                    <div className="flex-1">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
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
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
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
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
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
        <Card>
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
                        <p className="text-xs text-green-600">
                          Posted: {formatDate(post.posted_time)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}