import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";

interface Automation {
  id: number;
  name: string;
  description?: string;
  automation_type: string;
  trigger_event: string;
  trigger_keywords?: string[];
  message_template: string;
  use_ai: boolean;
  delay_minutes: number;
  working_hours?: any;
  is_enabled: boolean;
}

interface AutomationFormProps {
  automation?: Automation | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AutomationForm({ automation, onClose, onSuccess }: AutomationFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [automationType, setAutomationType] = useState("auto_reply");
  const [triggerEvent, setTriggerEvent] = useState("new_message");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description || "");
      setAutomationType(automation.automation_type);
      setTriggerEvent(automation.trigger_event);
      setMessageTemplate(automation.message_template);
      setUseAi(automation.use_ai);
      setDelayMinutes(automation.delay_minutes);
      setKeywords(automation.trigger_keywords || []);
    }
  }, [automation]);

  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (!keyword) {
      toast.error("Please enter a keyword");
      return;
    }

    if (keywords.includes(keyword)) {
      toast.error("This keyword is already in the list");
      return;
    }

    setKeywords([...keywords, keyword]);
    setKeywordInput("");
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const saveAutomation = async () => {
    if (!name.trim()) {
      toast.error("Please enter an automation name");
      return;
    }

    if (!messageTemplate.trim()) {
      toast.error("Please enter a message template");
      return;
    }

    if (triggerEvent === "keyword_match" && keywords.length === 0) {
      toast.error("Please add at least one keyword for keyword match trigger");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("saadhyam_token");
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        automation_type: automationType,
        trigger_event: triggerEvent,
        trigger_keywords: triggerEvent === "keyword_match" ? keywords : null,
        message_template: messageTemplate.trim(),
        use_ai: useAi,
        delay_minutes: delayMinutes,
      };

      const url = automation
        ? `${env.apiBaseUrl}/api/whatsapp/automation/${automation.id}`
        : `${env.apiBaseUrl}/api/whatsapp/automation`;

      const response = await fetch(url, {
        method: automation ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to save automation");
      }

      toast.success(automation ? "Automation updated successfully" : "Automation created successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving automation:", error);
      toast.error(error.message || "Failed to save automation");
    } finally {
      setSaving(false);
    }
  };

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
            {automation ? "Edit Automation" : "Create Automation"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure automated responses and follow-ups
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Details</CardTitle>
          <CardDescription>
            Set up rules for automatic message responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Automation Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Welcome New Customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of this automation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Automation Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Automation Type *</Label>
            <Select value={automationType} onValueChange={setAutomationType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_reply">Auto Reply</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="welcome_message">Welcome Message</SelectItem>
                <SelectItem value="away_message">Away Message</SelectItem>
                <SelectItem value="keyword_response">Keyword Response</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trigger Event */}
          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger Event *</Label>
            <Select value={triggerEvent} onValueChange={setTriggerEvent}>
              <SelectTrigger id="trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_message">New Message</SelectItem>
                <SelectItem value="no_reply">No Reply (after delay)</SelectItem>
                <SelectItem value="keyword_match">Keyword Match</SelectItem>
                <SelectItem value="first_message">First Message from Customer</SelectItem>
                <SelectItem value="after_hours">After Business Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keywords (only for keyword_match trigger) */}
          {triggerEvent === "keyword_match" && (
            <div className="space-y-2">
              <Label>Trigger Keywords *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword (e.g., price, help, info)"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button onClick={addKeyword} variant="outline">
                  <Plus size={16} />
                </Button>
              </div>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword}
                      className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delay (only for no_reply and follow_up) */}
          {(triggerEvent === "no_reply" || automationType === "follow_up") && (
            <div className="space-y-2">
              <Label htmlFor="delay">Delay (minutes)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Wait this many minutes before sending the automated message
              </p>
            </div>
          )}

          {/* Message Template */}
          <div className="space-y-2">
            <Label htmlFor="message">Message Template *</Label>
            <Textarea
              id="message"
              placeholder="Enter your automated message here..."
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              You can use variables like {"{customer_name}"}, {"{business_name}"}
            </p>
          </div>

          {/* AI Enhancement */}
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-1">
              <Label htmlFor="ai">AI Enhancement</Label>
              <p className="text-xs text-muted-foreground">
                Use AI to personalize and improve the message based on context
              </p>
            </div>
            <Switch
              id="ai"
              checked={useAi}
              onCheckedChange={setUseAi}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAutomation}
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Automation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
