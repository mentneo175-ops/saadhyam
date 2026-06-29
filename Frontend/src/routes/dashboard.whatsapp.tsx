import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WhatsAppConnect } from "@/components/whatsapp/WhatsAppConnect";
import { OnboardingGuide } from "@/components/whatsapp/OnboardingGuide";
import { ManualSetup } from "@/components/whatsapp/ManualSetup";
import { ChatDashboard } from "@/components/whatsapp/ChatDashboard";
import { CampaignManager } from "@/components/whatsapp/CampaignManager";
import { AutomationSettings } from "@/components/whatsapp/AutomationSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageCircle, Send, Settings, Loader2, Wrench, MoreVertical, Unplug, Trash2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";

export const Route = createFileRoute("/dashboard/whatsapp")({
  head: () => ({ meta: [{ title: "WhatsApp Sales — Saadhyam AI" }] }),
  component: WhatsAppPage,
});

interface ConnectionStatus {
  is_connected: boolean;
  phone_number?: string;
  business_name?: string;
  connected_at?: string;
}

function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState("chats");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-whatsapp-profile",
      title: "WhatsApp Connection",
      heading: "1. Account Integration",
      desc: "Link your WhatsApp Business API or QR code connection to synchronize customer text channels.",
      indicator: 1
    },
    {
      id: "tour-whatsapp-tabs",
      title: "Workspace Navigation",
      heading: "2. Sales Controls",
      desc: "Switch between Live Chats, Broadcast Campaigns, and Auto-reply Automation modules.",
      indicator: 2
    },
    {
      id: "tour-whatsapp-chats",
      title: "Customer Inbox",
      heading: "3. Conversational Workspace",
      desc: "Manage incoming customer messages and leverage AI suggestions to draft quick replies.",
      indicator: 3
    }
  ];

  // Auto-trigger tour for new users once loaded
  useEffect(() => {
    const isCompleted = localStorage.getItem("saadhyam_tour_whatsapp_completed");
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

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/connection-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data);
        
        // Show onboarding if not connected
        if (!data.is_connected) {
          setShowOnboarding(true);
        }
      } else if (response.status === 404) {
        // Endpoint not available - silently set as not connected
        setConnectionStatus({ is_connected: false, phone_number: undefined, business_name: undefined });
        setShowOnboarding(true);
      } else {
        console.error("Failed to check connection status");
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      toast.error("Failed to check WhatsApp connection");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSuccess = () => {
    setShowOnboarding(false);
    checkConnectionStatus();
    toast.success("WhatsApp Business connected successfully!");
  };

  const handleDisconnect = async (permanent: boolean = false) => {
    try {
      setDisconnecting(true);
      const token = localStorage.getItem("saadhyam_token");
      const endpoint = permanent 
        ? `${env.apiBaseUrl}/api/whatsapp/disconnect/permanent`
        : `${env.apiBaseUrl}/api/whatsapp/disconnect`;
      
      const method = permanent ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (permanent && data.deleted) {
          toast.success(
            `WhatsApp disconnected permanently. Deleted: ${data.deleted.messages} messages, ${data.deleted.campaigns} campaigns, ${data.deleted.automations} automations.`,
            { duration: 5000 }
          );
        } else {
          toast.success(data.message || "WhatsApp disconnected successfully");
        }
        
        // Close dialogs first
        setShowDisconnectDialog(false);
        setShowDeleteDialog(false);
        setDisconnecting(false);
        
        // Reset all state to force re-render to connection screen
        setConnectionStatus({ is_connected: false });
        setShowOnboarding(true);
        setActiveTab("chats");
        
        // Force a fresh connection status check after a brief delay
        setTimeout(() => {
          checkConnectionStatus();
        }, 500);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to disconnect WhatsApp");
        setDisconnecting(false);
        setShowDisconnectDialog(false);
        setShowDeleteDialog(false);
      }
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      toast.error("Failed to disconnect WhatsApp");
      setDisconnecting(false);
      setShowDisconnectDialog(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="WhatsApp Sales"
          subtitle="Manage customer conversations, campaigns, and automations"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Show onboarding if not connected
  if (!connectionStatus?.is_connected) {
    if (showManualSetup) {
      return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <PageHeader
            title="WhatsApp Sales"
            subtitle="Manual setup for WhatsApp Business account"
          />
          <ManualSetup
            onSuccess={handleConnectionSuccess}
            onBack={() => setShowManualSetup(false)}
          />
        </div>
      );
    }

    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="WhatsApp Sales"
          subtitle="Connect your WhatsApp Business account to get started"
        />
        
        {showOnboarding && (
          <OnboardingGuide onDismiss={() => setShowOnboarding(false)} />
        )}
        
        <div id="tour-whatsapp-profile">
          <WhatsAppConnect
            onConnectionSuccess={handleConnectionSuccess}
            onShowOnboarding={() => setShowOnboarding(true)}
          />
        </div>

        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setShowManualSetup(true)}
            className="gap-2"
          >
            <Wrench size={16} />
            Manual Setup (Advanced)
          </Button>
        </div>
      </div>
    );
  }

  // Main dashboard with tabs
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="WhatsApp Sales"
          subtitle={`Connected: ${connectionStatus.business_name || connectionStatus.phone_number}`}
        />
        
        {/* Disconnect Menu */}
        <div id="tour-whatsapp-profile" className="flex items-center gap-3">
          <button
            id="tour-btn-whatsapp-help"
            type="button"
            className="p-2 rounded-xl bg-slate-900 border border-slate-805/40 text-slate-400 hover:bg-slate-800 hover:text-purple-400 shadow-xs transition-all cursor-pointer dark:border-slate-800"
            onClick={() => {
              setIsTourActive(true);
              setTourStep(1);
            }}
            title="Start Guided Tour"
          >
            <HelpCircle size={16} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreVertical size={16} />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => setShowDisconnectDialog(true)}
                className="gap-2 text-orange-600 focus:text-orange-600"
              >
                <Unplug size={16} />
                Disconnect (Keep Data)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 size={16} />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList id="tour-whatsapp-tabs" className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="chats" className="flex items-center gap-2">
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Chats</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send size={16} />
            <span className="hidden sm:inline">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Settings size={16} />
            <span className="hidden sm:inline">Automation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent id="tour-whatsapp-chats" value="chats" className="space-y-4">
          <ChatDashboard connectionStatus={connectionStatus} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <AutomationSettings />
        </TabsContent>
      </Tabs>

      {/* Soft Disconnect Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect WhatsApp Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will disconnect your WhatsApp Business account from Saadhyam AI.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                  ✓ Your data will be preserved:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                  <li>• All messages and conversations</li>
                  <li>• Campaign history and analytics</li>
                  <li>• Automation settings</li>
                </ul>
              </div>
              <p className="text-sm">
                You can reconnect anytime and your data will still be available.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDisconnect(false)}
              disabled={disconnecting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {disconnecting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ Permanently Delete WhatsApp Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                This action CANNOT be undone!
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-900 dark:text-red-100 font-medium mb-2">
                  ✗ This will permanently delete:
                </p>
                <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 ml-4">
                  <li>• All messages and conversations</li>
                  <li>• All campaigns and their history</li>
                  <li>• All automation rules</li>
                  <li>• Your WhatsApp account connection</li>
                </ul>
              </div>
              <p className="text-sm font-medium">
                Are you absolutely sure you want to delete everything?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDisconnect(true)}
              disabled={disconnecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {disconnecting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                    <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider animate-pulse">Monitoring WhatsApp Connection</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Settings size={14} className="animate-spin text-purple-400" />
                    <span>Routing Engines Online</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Loading Live Inbox Chats</span>
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
                        localStorage.setItem("saadhyam_tour_whatsapp_completed", "true");
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
