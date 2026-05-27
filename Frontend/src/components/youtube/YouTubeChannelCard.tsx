import { YouTubeChannel } from "@/types/youtube";
import { Link2Off, RefreshCw, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface YouTubeChannelCardProps {
  channel: YouTubeChannel;
  onDisconnect: (channelId: number) => Promise<void>;
  onRefresh: () => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function YouTubeChannelCard({ channel, onDisconnect, onRefresh }: YouTubeChannelCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [channel.thumbnail_url]);

  const fallbackInitial = (channel.channel_title || "U").trim().charAt(0).toUpperCase() || "U";

  const handleDisconnect = async () => {
    if (confirm(`Are you sure you want to disconnect channel: ${channel.channel_title}?`)) {
      setIsDisconnecting(true);
      try {
        await onDisconnect(channel.id);
        toast.success("YouTube channel disconnected successfully");
      } catch (err) {
        toast.error("Failed to disconnect YouTube channel");
      } finally {
        setIsDisconnecting(false);
      }
    }
  };

  return (
    <Card className="border border-purple-100/80 shadow-xs overflow-hidden bg-white">
      {/* Banner gradient */}
      <div className="h-20 bg-gradient-to-r from-[#5D2F8F] via-[#7C3AED] to-[#A855F7] relative" />

      {/* Avatar + Info */}
      <CardContent className="p-5 pt-0 flex flex-col items-center text-center relative -mt-9">
        {channel.thumbnail_url && !imageFailed ? (
          <img
            src={channel.thumbnail_url}
            alt={channel.channel_title}
            className="w-18 h-18 rounded-full border-4 border-white shadow-md bg-white object-cover shrink-0 select-none"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-18 h-18 rounded-full border-4 border-white shadow-md bg-purple-50 flex items-center justify-center font-bold text-xl text-purple-700 shrink-0 select-none">
            {fallbackInitial}
          </div>
        )}

        <div className="mt-3 w-full">
          <h3 className="font-bold text-base text-slate-800 truncate px-2" title={channel.channel_title}>
            {channel.channel_title}
          </h3>
          
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold rounded-full mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Connected
          </div>

          {channel.channel_description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-3 px-1 leading-relaxed" title={channel.channel_description}>
              {channel.channel_description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full py-4 border-t border-b border-slate-100 my-4 text-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subs</p>
            <p className="text-sm font-extrabold text-slate-700 mt-0.5">{formatCount(channel.subscriber_count)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Views</p>
            <p className="text-sm font-extrabold text-slate-700 mt-0.5">{formatCount(channel.view_count)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Videos</p>
            <p className="text-sm font-extrabold text-slate-700 mt-0.5">{formatCount(channel.video_count)}</p>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex flex-col gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            className="w-full text-xs border-purple-100 text-purple-700 hover:bg-purple-50 hover:text-purple-800 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Stats
          </Button>
          
          {channel.channel_id && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className="w-full text-xs border-purple-100 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
            >
              <a
                href={`https://www.youtube.com/channel/${channel.channel_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Channel
              </a>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="w-full text-xs text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center gap-1.5 mt-1"
          >
            <Link2Off className="w-3.5 h-3.5" />
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
