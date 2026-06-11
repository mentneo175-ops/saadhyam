import { useState } from "react";
import { 
  Sparkles, Video, Calendar, Clock, 
  Eye, AlertCircle, Loader2, Wand2, Tag, Upload
} from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VideoUploadFormProps {
  channelDbId: number;
  onSubmit: (data: any) => Promise<void>;
}

export function VideoUploadForm({ channelDbId, onSubmit }: VideoUploadFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("public");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadHelpMessage, setUploadHelpMessage] = useState<string | null>(null);

  // AI assistant loading states
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [showTitlesModal, setShowTitlesModal] = useState(false);
  
  const MAX_UPLOAD_MB = 10; // Keep in sync with backend MAX_REQUEST_SIZE_MB

  const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      const sizeMb = bytesToMB(f.size);
      if (sizeMb > MAX_UPLOAD_MB) {
        setUploadHelpMessage(
          `Video file too large. Compress it here: ${env.instagramVideoCompressorUrl}`,
        );
        setVideoFile(null);
        e.currentTarget.value = "";
        return;
      }
    }
    setUploadHelpMessage(null);
    setVideoFile(f);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      const sizeMb = bytesToMB(f.size);
      if (sizeMb > MAX_UPLOAD_MB) {
        toast.error(`Selected image is ${sizeMb.toFixed(2)} MB — maximum allowed is ${MAX_UPLOAD_MB} MB. Please choose a smaller image.`);
        setThumbnailFile(null);
        e.currentTarget.value = "";
        return;
      }
    }
    setThumbnailFile(f);
  };

  const buildYoutubeApiUrls = (path: string) => {
    const baseUrl = env.apiBaseUrl.replace(/\/+$/, "");
    const rootUrl = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
    return [
      `${baseUrl}${path}`,
      `${rootUrl}${path}`,
      path,
    ];
  };

  const readErrorDetail = async (response: Response) => {
    const responseText = await response.text();
    try {
      const parsed = JSON.parse(responseText);
      return ([parsed?.message, parsed?.detail, parsed?.suggestion].filter(Boolean).join(" ") || parsed?.error || responseText);
    } catch {
      return responseText;
    }
  };

  const uploadToCloudinary = async (file: File, resourceType: "image" | "video") => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      throw new Error("Please sign in again before uploading media.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("resource_type", resourceType);

    let lastError: string | null = null;
    for (const uploadUrl of buildYoutubeApiUrls("/api/youtube/media/upload")) {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          secureUrl: data.secure_url as string,
          publicId: data.public_id as string,
        };
      }
      lastError = await readErrorDetail(response);
      if (response.status !== 404) {
        break;
      }
    }
    throw new Error(lastError || `Failed to upload ${resourceType}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Video title is required");
      return;
    }
    if (!videoUrl.trim() && !videoFile) {
      toast.error("Video URL is required (please paste a video file link or use demo link)");
      return;
    }
    if (isScheduled && !scheduledTime) {
      toast.error("Scheduled time is required for scheduling");
      return;
    }

    setIsSubmitting(true);
    try {
      if (videoFile && videoFile.size > MAX_UPLOAD_MB * 1024 * 1024) {
        setUploadHelpMessage(`Video file too large. Compress it here: ${env.instagramVideoCompressorUrl}`);
        setIsSubmitting(false);
        return;
      }
      if (thumbnailFile && thumbnailFile.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(`Selected image is ${bytesToMB(thumbnailFile.size).toFixed(2)} MB — maximum allowed is ${MAX_UPLOAD_MB} MB. Please choose a smaller image.`);
        setIsSubmitting(false);
        return;
      }

      const uploadedVideo = videoFile ? await uploadToCloudinary(videoFile, "video") : null;
      const uploadedThumbnail = thumbnailFile ? await uploadToCloudinary(thumbnailFile, "image") : null;

      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload: any = {
        channel_id: channelDbId,
        title,
        description,
        tags: parsedTags,
        privacy_status: privacyStatus,
        video_url: uploadedVideo?.secureUrl || videoUrl,
        thumbnail_url: uploadedThumbnail?.secureUrl || thumbnailUrl.trim() || undefined,
        video_public_id: uploadedVideo?.publicId,
        thumbnail_public_id: uploadedThumbnail?.publicId,
      };

      if (isScheduled) {
        payload.scheduled_time = new Date(scheduledTime).toISOString();
      }

      await onSubmit(payload);
      toast.success(isScheduled ? "Video scheduled successfully" : "Video uploaded successfully");
      
      // Reset form
      setTitle("");
      setDescription("");
      setTags("");
      setVideoUrl("");
      setThumbnailUrl("");
      setVideoFile(null);
      setThumbnailFile(null);
      setIsScheduled(false);
      setScheduledTime("");
      setUploadHelpMessage(null);
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.detail || "Failed to process video upload");
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Actions
  const handleGenerateTitles = async () => {
    if (!title.trim() && !description.trim()) {
      toast.error("Please enter a draft title or description first to give Gemini context");
      return;
    }
    setIsGeneratingTitles(true);
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/youtube/ai/generate-titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: title || "business growth",
          description: description || "SEO marketing tips",
        }),
      });
      const data = await response.json();
      if (data.titles && data.titles.length > 0) {
        setAiTitles(data.titles);
        setShowTitlesModal(true);
        toast.success("AI generated title options!");
      } else {
        toast.error("Failed to generate titles");
      }
    } catch (err) {
      toast.error("Error communicating with AI");
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      toast.error("Please enter a video title first to give Gemini context");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/youtube/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          cta_link: "https://www.sadhyam.com",
        }),
      });
      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
        toast.success("SEO description generated!");
      } else {
        toast.error("Failed to generate description");
      }
    } catch (err) {
      toast.error("Error communicating with AI");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!title.trim()) {
      toast.error("Please enter a video title first to give Gemini context");
      return;
    }
    setIsGeneratingTags(true);
    try {
      const response = await fetch(`${env.apiBaseUrl}/api/youtube/ai/generate-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          description: description,
        }),
      });
      const data = await response.json();
      if (data.tags) {
        setTags(data.tags.join(", "));
        toast.success("Keywords generated!");
      } else {
        toast.error("Failed to generate tags");
      }
    } catch (err) {
      toast.error("Error communicating with AI");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const useDemoVideo = () => {
    setVideoUrl("https://res.cloudinary.com/demo/video/upload/dog.mp4");
    toast.success("Using high-quality demo video!");
  };

  return (
    <Card className="border border-purple-100 shadow-xs bg-white rounded-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 w-full" />
      <CardContent className="p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 dark:text-slate-300 dark:border-slate-700">
          <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Upload & Publish Video
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Link */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Video URL / Path</span>
              <button
                type="button"
                onClick={useDemoVideo}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 hover:underline"
              >
                Use Demo MP4 Link
              </button>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste public video URL (e.g. Cloudinary, S3) or local file path"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300"
            />
            <div className="mt-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3.5 dark:bg-slate-900 dark:border-slate-800">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-purple-700 file:font-semibold file:text-xs cursor-pointer file:shadow-xs file:transition-colors"
              />
              {videoFile && <p className="mt-2.5 text-[11px] text-slate-500 font-medium">Selected: {videoFile.name}</p>}
            </div>
            {uploadHelpMessage && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Video file too large. Compress it here:{" "}
                <a
                  href={env.instagramVideoCompressorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2 hover:text-amber-700"
                >
                  open the compressor link
                </a>
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Thumbnail URL
            </label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="Paste a thumbnail image URL (optional)"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300"
            />
            <div className="mt-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3.5 dark:bg-slate-900 dark:border-slate-800">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-purple-700 file:font-semibold file:text-xs cursor-pointer file:shadow-xs file:transition-colors"
              />
              {thumbnailFile && <p className="mt-2.5 text-[11px] text-slate-500 font-medium">Selected: {thumbnailFile.name}</p>}
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Title (max 100 characters)
              </label>
              <button
                 type="button"
                 onClick={handleGenerateTitles}
                 disabled={isGeneratingTitles}
                 className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/70 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/30"
               >
                 {isGeneratingTitles ? (
                   <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                 ) : (
                   <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                 )}
                 AI Titles
               </button>
             </div>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title for your video"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Description (max 5000 characters)
              </label>
              <button
                 type="button"
                 onClick={handleGenerateDescription}
                 disabled={isGeneratingDesc}
                 className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/70 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/30"
               >
                 {isGeneratingDesc ? (
                   <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                 ) : (
                   <Wand2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                 )}
                 AI SEO Description
               </button>
             </div>
            <textarea
              maxLength={5000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed video description including timestamps, links, and hashtags..."
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-y dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Keywords / Tags
              </label>
              <button
                 type="button"
                 onClick={handleGenerateTags}
                 disabled={isGeneratingTags}
                 className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/70 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/30"
               >
                 {isGeneratingTags ? (
                   <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                 ) : (
                   <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                 )}
                 AI Keywords
               </button>
             </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="marketing, business, guide, ai (comma separated)"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300"
            />
          </div>

          {/* Privacy & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Privacy Status
              </label>
              <select
                value={privacyStatus}
                onChange={(e) => setPrivacyStatus(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-300"
              >
                <option value="public">Public (Everyone can watch)</option>
                <option value="unlisted">Unlisted (Anyone with link)</option>
                <option value="private">Private (Only you can watch)</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center gap-2.5 mt-6 bg-slate-50 border border-slate-100 p-3.5 rounded-xl w-full cursor-pointer select-none dark:bg-slate-900 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="isScheduled"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 shrink-0 cursor-pointer dark:border-slate-700"
                />
                <label htmlFor="isScheduled" className="text-sm font-bold text-slate-600 cursor-pointer">
                  Schedule this upload
                </label>
              </div>
            </div>
          </div>

          {/* Date Time Picker if scheduled */}
          {isScheduled && (
            <div className="p-4 bg-purple-50/30 border border-purple-100/50 rounded-xl space-y-2 dark:bg-purple-950/10 dark:border-purple-900/30">
              <label className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 dark:text-purple-400">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Scheduled Time (Local/UTC)
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-white border border-purple-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:bg-slate-950/30 dark:border-purple-900/30 dark:text-slate-300"
              />
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-6 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-purple-100 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isScheduled ? "Scheduling Upload..." : "Uploading to YouTube..."}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                {isScheduled ? "Schedule Upload" : "Publish to YouTube Now"}
              </>
            )}
          </Button>
        </form>

        {/* AI Titles Selector Modal */}
        {showTitlesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg bg-white border border-slate-100 rounded-2xl p-6 shadow-2xl flex flex-col dark:bg-slate-900 dark:border-slate-800">
              <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-3 dark:text-slate-300 dark:border-slate-700">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Select an AI Generated Title
              </h4>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {aiTitles.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(t);
                      setShowTitlesModal(false);
                    }}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-purple-300 text-sm text-slate-700 hover:bg-purple-50/20 hover:text-purple-900 transition-all font-medium dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-purple-950/30 dark:hover:text-purple-300 dark:text-slate-300"
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <button
                type="button"
                onClick={() => setShowTitlesModal(false)}
                className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 transition-colors dark:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
