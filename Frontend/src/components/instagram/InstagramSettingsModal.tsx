import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Instagram,
  Settings,
  Unlink,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";

interface InstagramConnectionStatus {
  is_connected: boolean;
  account_username?: string;
  page_name?: string;
  connection_error?: string;
}

interface InstagramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: InstagramConnectionStatus;
  onDisconnect: () => void;
  onReconnect: () => void;
  isLoading?: boolean;
}

interface AutomationSettings {
  instagram_enabled: boolean;
  instagram_auto_publish: boolean;
  instagram_auto_reply: boolean;
  instagram_save_drafts: boolean;
}

interface PostingPreferences {
  preferred_posting_time: string;
  posting_frequency: string;
  auto_generate_captions: boolean;
  weekly_day: string;
  custom_date: string;
}

export const InstagramSettingsModal: React.FC<InstagramSettingsModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  onDisconnect,
  onReconnect,
  isLoading = false,
}) => {
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    instagram_enabled: false,
    instagram_auto_publish: false,
    instagram_auto_reply: false,
    instagram_save_drafts: true,
  });

  const [postingPreferences, setPostingPreferences] = useState<PostingPreferences>({
    preferred_posting_time: "09:00",
    posting_frequency: "daily",
    auto_generate_captions: false,
    weekly_day: "monday",
    custom_date: "",
  });

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    if (isOpen && connectionStatus.is_connected) {
      loadSettings();
    }
  }, [isOpen, connectionStatus.is_connected]);

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      
      const response = await fetch(`${env.apiBaseUrl}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.instagram_automation) {
          setAutomationSettings({
            instagram_enabled: data.instagram_automation.instagram_enabled || false,
            instagram_auto_publish: data.instagram_automation.instagram_auto_publish || false,
            instagram_auto_reply: data.instagram_automation.instagram_auto_reply || false,
            instagram_save_drafts: data.instagram_automation.instagram_save_drafts !== false,
          });
        }

        if (data.posting_preferences) {
          setPostingPreferences({
            preferred_posting_time: data.posting_preferences.preferred_posting_time || "09:00",
            posting_frequency: data.posting_preferences.posting_frequency || "daily",
            auto_generate_captions: data.posting_preferences.auto_generate_captions || false,
            weekly_day: data.posting_preferences.weekly_day || "monday",
            custom_date: data.posting_preferences.custom_date || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load Instagram settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateAutomationSettings = async (key: keyof AutomationSettings, value: boolean) => {
    const previousSettings = { ...automationSettings };
    
    try {
      const updatedSettings = { ...automationSettings, [key]: value };
      setAutomationSettings(updatedSettings);

      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/settings/instagram/automation`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        setAutomationSettings(previousSettings);
        toast.error("Failed to update automation settings");
      } else {
        toast.success("Automation settings updated");
      }
    } catch (error) {
      setAutomationSettings(previousSettings);
      console.error("Error updating automation settings:", error);
      toast.error("Failed to update automation settings");
    }
  };

  const updatePostingPreferences = async (key: keyof PostingPreferences, value: string | boolean) => {
    const previousPreferences = { ...postingPreferences };
    
    try {
      const updatedPreferences = { ...postingPreferences, [key]: value };
      setPostingPreferences(updatedPreferences);

      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(`${env.apiBaseUrl}/settings/posting-preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPreferences),
      });

      if (!response.ok) {
        setPostingPreferences(previousPreferences);
        toast.error("Failed to update posting preferences");
      } else {
        toast.success("Posting preferences updated");
      }
    } catch (error) {
      setPostingPreferences(previousPreferences);
      console.error("Error updating posting preferences:", error);
      toast.error("Failed to update posting preferences");
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectDialog(false);
    onDisconnect();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" />
              Instagram Settings
            </DialogTitle>
            <DialogDescription>
              Manage your Instagram connection and automation preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Account Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">@{connectionStatus.account_username}</p>
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus.page_name}
                    </p>
                    <Badge variant="secondary" className="mt-2 bg-green-50 text-green-700">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onReconnect}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                      Reconnect
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDisconnectDialog(true)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Unlink className="w-4 h-4" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading settings...</span>
              </div>
            ) : (
              <>
                {/* Automation Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Automation
                    </CardTitle>
                    <CardDescription>
                      Configure automated posting and engagement features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="instagram-enabled">Enable Instagram Automation</Label>
                        <p className="text-sm text-muted-foreground">
                          Master switch for all Instagram automation features
                        </p>
                      </div>
                      <Switch
                        id="instagram-enabled"
                        checked={automationSettings.instagram_enabled}
                        onCheckedChange={(checked) => updateAutomationSettings("instagram_enabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-publish">Auto-publish Scheduled Posts</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically publish posts at scheduled times
                        </p>
                      </div>
                      <Switch
                        id="auto-publish"
                        checked={automationSettings.instagram_auto_publish}
                        onCheckedChange={(checked) => updateAutomationSettings("instagram_auto_publish", checked)}
                        disabled={!automationSettings.instagram_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-reply">Auto-reply to DMs</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically respond to direct messages
                        </p>
                      </div>
                      <Switch
                        id="auto-reply"
                        checked={automationSettings.instagram_auto_reply}
                        onCheckedChange={(checked) => updateAutomationSettings("instagram_auto_reply", checked)}
                        disabled={!automationSettings.instagram_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="save-drafts">Save as Drafts</Label>
                        <p className="text-sm text-muted-foreground">
                          Save posts as drafts instead of publishing immediately
                        </p>
                      </div>
                      <Switch
                        id="save-drafts"
                        checked={automationSettings.instagram_save_drafts}
                        onCheckedChange={(checked) => updateAutomationSettings("instagram_save_drafts", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Posting Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Posting Schedule
                    </CardTitle>
                    <CardDescription>
                      Set your preferred posting times and frequency
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="posting-time">Preferred Posting Time</Label>
                        <input
                          id="posting-time"
                          type="time"
                          value={postingPreferences.preferred_posting_time}
                          onChange={(e) => updatePostingPreferences("preferred_posting_time", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="posting-frequency">Posting Frequency</Label>
                        <select
                          id="posting-frequency"
                          value={postingPreferences.posting_frequency}
                          onChange={(e) => updatePostingPreferences("posting_frequency", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    {postingPreferences.posting_frequency === "weekly" && (
                      <div>
                        <Label htmlFor="weekly-day">Weekly Day</Label>
                        <select
                          id="weekly-day"
                          value={postingPreferences.weekly_day}
                          onChange={(e) => updatePostingPreferences("weekly_day", e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                        >
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-captions">Auto-generate Captions</Label>
                        <p className="text-sm text-muted-foreground">
                          Use AI to generate captions for your posts
                        </p>
                      </div>
                      <Switch
                        id="auto-captions"
                        checked={postingPreferences.auto_generate_captions}
                        onCheckedChange={(checked) => updatePostingPreferences("auto_generate_captions", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Disconnect Instagram Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your Instagram account? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Stop all automated posting and scheduling</li>
                <li>Remove access to your Instagram data</li>
                <li>Cancel any pending scheduled posts</li>
                <li>Disable Instagram-related features</li>
              </ul>
              <p className="mt-2 font-medium">You can reconnect anytime, but you'll need to go through the setup process again.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700"
            >
              Disconnect Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};