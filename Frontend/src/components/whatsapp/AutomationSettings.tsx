import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Zap, 
  Loader2,
  Settings,
  Trash2,
  Edit,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { AutomationForm } from "./AutomationForm";
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
  triggered_count: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  last_triggered_at?: string;
  created_at: string;
}

interface AutomationStats {
  total_automations: number;
  enabled_automations: number;
  total_triggered: number;
  total_sent: number;
  success_rate: number;
}

export function AutomationSettings() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    loadAutomations();
    loadStats();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/automation?limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations || []);
      } else {
        toast.error("Failed to load automations");
      }
    } catch (error) {
      console.error("Error loading automations:", error);
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/automation/stats/overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const toggleAutomation = async (automationId: number) => {
    try {
      setToggling(automationId);
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/automation/${automationId}/toggle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadAutomations();
        loadStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to toggle automation");
      }
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast.error("Failed to toggle automation");
    } finally {
      setToggling(null);
    }
  };

  const deleteAutomation = async (automationId: number) => {
    if (!confirm("Are you sure you want to delete this automation?")) {
      return;
    }

    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/automation/${automationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Automation deleted successfully");
        loadAutomations();
        loadStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete automation");
      }
    } catch (error) {
      console.error("Error deleting automation:", error);
      toast.error("Failed to delete automation");
    }
  };

  const getAutomationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      auto_reply: "Auto Reply",
      follow_up: "Follow-up",
      welcome_message: "Welcome Message",
      away_message: "Away Message",
      keyword_response: "Keyword Response",
    };
    return labels[type] || type;
  };

  const getTriggerEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      new_message: "New Message",
      no_reply: "No Reply",
      keyword_match: "Keyword Match",
      first_message: "First Message",
      after_hours: "After Hours",
    };
    return labels[event] || event;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (showForm) {
    return (
      <AutomationForm
        automation={selectedAutomation}
        onClose={() => {
          setShowForm(false);
          setSelectedAutomation(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setSelectedAutomation(null);
          loadAutomations();
          loadStats();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure automated responses and follow-ups
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          New Automation
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Automations</p>
                  <p className="text-2xl font-bold">{stats.total_automations}</p>
                </div>
                <Settings size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.enabled_automations}</p>
                </div>
                <Zap size={24} className="text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Triggered</p>
                  <p className="text-2xl font-bold">{stats.total_triggered}</p>
                </div>
                <MessageCircle size={24} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.success_rate}%</p>
                </div>
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Automations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading automations...</span>
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create your first automation to automatically respond to customers and save time
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus size={16} className="mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid gap-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <Badge variant={automation.is_enabled ? "default" : "secondary"}>
                          {automation.is_enabled ? "Active" : "Inactive"}
                        </Badge>
                        {automation.use_ai && (
                          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20">
                            AI Powered
                          </Badge>
                        )}
                      </div>
                      {automation.description && (
                        <CardDescription>{automation.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.is_enabled}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                        disabled={toggling === automation.id}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAutomation(automation);
                          setShowForm(true);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAutomation(automation.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Type and Trigger */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        Type: {getAutomationTypeLabel(automation.automation_type)}
                      </Badge>
                      <Badge variant="outline">
                        Trigger: {getTriggerEventLabel(automation.trigger_event)}
                      </Badge>
                      {automation.delay_minutes > 0 && (
                        <Badge variant="outline">
                          Delay: {automation.delay_minutes} min
                        </Badge>
                      )}
                    </div>

                    {/* Keywords */}
                    {automation.trigger_keywords && automation.trigger_keywords.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {automation.trigger_keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Template */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Message Template:</p>
                      <p className="text-sm bg-muted p-2 rounded-md line-clamp-2">
                        {automation.message_template}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Triggered</p>
                        <p className="text-sm font-semibold">{automation.triggered_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="text-sm font-semibold">{automation.sent_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Success</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {automation.success_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Failed</p>
                        <p className="text-sm font-semibold text-red-600">
                          {automation.failed_count}
                        </p>
                      </div>
                    </div>

                    {/* Last Triggered */}
                    <div className="text-xs text-muted-foreground">
                      Last triggered: {formatDate(automation.last_triggered_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
