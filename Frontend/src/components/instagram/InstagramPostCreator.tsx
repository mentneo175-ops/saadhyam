import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Send, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PostCreatorProps {
  accountId: number;
  onPostNow: (data: PostData) => void;
  onSchedule: (data: ScheduleData) => void;
  onGenerateCaption: (topic: string, tone: string) => void;
  generatedCaption?: string;
  isLoading?: boolean;
  isGenerating?: boolean;
}

interface PostData {
  image_url: string;
  caption: string;
}

interface ScheduleData extends PostData {
  scheduled_time: string;
}

export const InstagramPostCreator: React.FC<PostCreatorProps> = ({
  accountId,
  onPostNow,
  onSchedule,
  onGenerateCaption,
  generatedCaption = "",
  isLoading = false,
  isGenerating = false,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  const tones = ["casual", "professional", "funny", "inspirational"];

  const handleGenerateCaption = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    onGenerateCaption(topic, tone);
    setShowAIPrompt(false);
  };

  const handlePostNow = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    onPostNow({ image_url: imageUrl, caption });
    resetForm();
  };

  const handleSchedule = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    if (!scheduledTime) {
      toast.error("Please select a time to schedule");
      return;
    }
    onSchedule({ image_url: imageUrl, caption, scheduled_time: scheduledTime });
    resetForm();
  };

  const resetForm = () => {
    setImageUrl("");
    setCaption("");
    setScheduledTime("");
    setShowSchedule(false);
    setTopic("");
  };

  const canPost = imageUrl.trim().length > 0;
  const canSchedule = canPost && scheduledTime;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          Create Post
        </CardTitle>
        <CardDescription>Post immediately or schedule for later</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Image URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isLoading}
            />
            {imageUrl && (
              <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-md"
                  onError={() => console.log("Image failed to load")}
                />
              </div>
            )}
          </div>

          {/* Caption Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Caption</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIPrompt(!showAIPrompt)}
                className="text-purple-600 hover:text-purple-700"
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Generate with AI
              </Button>
            </div>

            {showAIPrompt && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <Input
                    placeholder="e.g., coffee, coding, travel"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <div className="flex gap-2 flex-wrap">
                    {tones.map((t) => (
                      <Badge
                        key={t}
                        variant={tone === t ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setTone(t)}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleGenerateCaption}
                  disabled={isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Caption
                </Button>
              </div>
            )}

            {generatedCaption && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Generated Caption:</p>
                <p className="text-green-800 italic">{generatedCaption}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCaption(generatedCaption);
                    setShowAIPrompt(false);
                  }}
                  className="mt-2"
                >
                  Use this caption
                </Button>
              </div>
            )}

            <Textarea
              placeholder="Write your caption here..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">Max 2200 characters</p>
          </div>

          {/* Schedule Toggle */}
          {!showSchedule ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSchedule(true)}
              disabled={!canPost || isLoading}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Instead
            </Button>
          ) : (
            <>
              {/* Schedule Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={isLoading}
                />
                {scheduledTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Scheduled for: {format(new Date(scheduledTime), "PPp")}
                  </p>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => setShowSchedule(false)}>
                Post Now Instead
              </Button>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!showSchedule ? (
              <>
                <Button
                  onClick={handlePostNow}
                  disabled={!canPost || isLoading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post Now
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                  Clear
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSchedule}
                  disabled={!canSchedule || isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Post
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
