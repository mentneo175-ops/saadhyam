import { YouTubeVideo } from "@/types/youtube";
import {
  Eye, ThumbsUp, MessageSquare, Calendar,
  Clock, AlertCircle, ExternalLink, Trash2, Play
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface VideoCardProps {
  video: YouTubeVideo;
  onDelete: (videoDbId: number) => Promise<void>;
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this video record? If published, it will also be deleted from YouTube.")) {
      setIsDeleting(true);
      try {
        await onDelete(video.id);
        toast.success("Video deleted successfully");
      } catch (err) {
        toast.error("Failed to delete video");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusBadge = () => {
    switch (video.status) {
      case "posted":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">Published</span>;
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-2.5 h-2.5" /> Scheduled
          </span>
        );
      case "publishing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <LoaderIcon className="w-2.5 h-2.5 animate-spin" /> Processing
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-2.5 h-2.5" /> Failed
          </span>
        );
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800">{video.status}</span>;
    }
  };

  const formattedDate = () => {
    if (video.posted_time) {
      return format(new Date(video.posted_time), "MMM d, yyyy");
    }
    if (video.scheduled_time) {
      return `Sched · ${format(new Date(video.scheduled_time), "MMM d, yyyy")}`;
    }
    return format(new Date(video.created_at), "MMM d, yyyy");
  };

  return (
    <Card className="border border-slate-100/80 shadow-xs hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden flex flex-col h-full bg-white group dark:bg-slate-900">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0 dark:bg-slate-800">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 dark:bg-slate-900">
            <Play className="w-8 h-8 opacity-45" />
          </div>
        )}

        {/* Watch Link Overlay */}
        {video.status === "posted" && video.video_id && (
          <a
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white"
            title="Watch on YouTube"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
              <ExternalLink className="w-4 h-4 text-white" />
            </div>
          </a>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug mb-3 group-hover:text-purple-700 transition-colors dark:text-slate-300" title={video.title}>
          {video.title}
        </h4>
        
        <div className="flex items-center justify-between gap-2 mt-auto mb-3">
          {getStatusBadge()}
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate()}
          </span>
        </div>

        {/* Error message */}
        {video.status === "failed" && video.error_message && (
          <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600 flex items-start gap-1.5 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{video.error_message}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          {video.status === "posted" ? (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1" title="Views">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {video.view_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1" title="Likes">
                <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                {video.like_count.toLocaleString()}
              </span>
              <span className="flex items-center gap-1" title="Comments">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                {video.comment_count.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">Stats Pending</span>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            title="Delete video record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
