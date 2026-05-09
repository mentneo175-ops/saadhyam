import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Send, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: number;
  title: string;
  description?: string;
  message_content: string;
  recipient_list: string[];
  scheduled_time?: string;
  status: string;
}

interface CampaignFormProps {
  campaign?: Campaign | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CampaignForm({ campaign, onClose, onSuccess }: CampaignFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title);
      setDescription(campaign.description || "");
      setMessageContent(campaign.message_content);
      setRecipients(campaign.recipient_list || []);
      if (campaign.scheduled_time) {
        // Convert ISO to datetime-local format
        const date = new Date(campaign.scheduled_time);
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setScheduledTime(localDateTime);
      }
    }
  }, [campaign]);

  const addRecipient = () => {
    const phone = recipientInput.trim();
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }

    // Basic validation
    if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("Invalid phone number format. Use international format (e.g., +1234567890)");
      return;
    }

    if (recipients.includes(phone)) {
      toast.error("This number is already in the list");
      return;
    }

    setRecipients([...recipients, phone]);
    setRecipientInput("");
  };

  const removeRecipient = (phone: string) => {
    setRecipients(recipients.filter((r) => r !== phone));
  };

  const bulkAddRecipients = (text: string) => {
    const phones = text
      .split(/[\n,;]/)
      .map((p) => p.trim())
      .filter((p) => p && /^\+?\d{10,15}$/.test(p.replace(/\s/g, "")));

    const newRecipients = [...new Set([...recipients, ...phones])];
    setRecipients(newRecipients);
    toast.success(`Added ${newRecipients.length - recipients.length} recipients`);
  };

  const saveCampaign = async (executeNow: boolean = false) => {
    if (!title.trim()) {
      toast.error("Please enter a campaign title");
      return;
    }

    if (!messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    try {
      if (executeNow) {
        setExecuting(true);
      } else {
        setSaving(true);
      }

      const token = localStorage.getItem("saadhyam_token");
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        message_content: messageContent.trim(),
        recipient_list: recipients,
        scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
      };

      // Create or update campaign
      const url = campaign
        ? `http://localhost:8000/api/whatsapp/campaigns/${campaign.id}`
        : "http://localhost:8000/api/whatsapp/campaigns";

      const response = await fetch(url, {
        method: campaign ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to save campaign");
      }

      const data = await response.json();
      const campaignId = campaign?.id || data.campaign.id;

      // Execute immediately if requested
      if (executeNow) {
        const executeResponse = await fetch(
          `http://localhost:8000/api/whatsapp/campaigns/${campaignId}/execute`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!executeResponse.ok) {
          const error = await executeResponse.json();
          throw new Error(error.detail || "Failed to execute campaign");
        }

        const executeData = await executeResponse.json();
        toast.success(
          `Campaign executed! Sent: ${executeData.sent_count}, Failed: ${executeData.failed_count}`
        );
      } else {
        toast.success(campaign ? "Campaign updated successfully" : "Campaign created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setSaving(false);
      setExecuting(false);
    }
  };

  const isViewOnly = campaign && !["draft", "scheduled"].includes(campaign.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {campaign ? (isViewOnly ? "View Campaign" : "Edit Campaign") : "Create Campaign"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isViewOnly
              ? "Campaign details (read-only)"
              : "Send messages to multiple customers at once"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Configure your campaign settings and message content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Summer Sale Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isViewOnly}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of this campaign"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isViewOnly}
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">Message Content *</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="min-h-[120px]"
              disabled={isViewOnly}
            />
            <p className="text-xs text-muted-foreground">
              Character count: {messageContent.length}
            </p>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients * ({recipients.length})</Label>
            {!isViewOnly && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter phone number (e.g., +1234567890)"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                />
                <Button onClick={addRecipient} variant="outline">
                  <Plus size={16} />
                </Button>
              </div>
            )}

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {recipients.map((phone) => (
                    <div
                      key={phone}
                      className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                    >
                      <span>{phone}</span>
                      {!isViewOnly && (
                        <button
                          onClick={() => removeRecipient(phone)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isViewOnly && (
              <div className="space-y-2">
                <Label htmlFor="bulk">Bulk Add (paste multiple numbers)</Label>
                <Textarea
                  id="bulk"
                  placeholder="Paste phone numbers separated by commas or new lines"
                  className="min-h-[80px]"
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text");
                    bulkAddRecipients(text);
                  }}
                />
              </div>
            )}
          </div>

          {/* Scheduled Time */}
          {!isViewOnly && (
            <div className="space-y-2">
              <Label htmlFor="scheduled">Schedule (Optional)</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to save as draft. Set a time to schedule for later.
              </p>
            </div>
          )}

          {/* Actions */}
          {!isViewOnly && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => saveCampaign(false)}
                disabled={saving || executing}
                variant="outline"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
              <Button
                onClick={() => saveCampaign(true)}
                disabled={saving || executing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {executing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
