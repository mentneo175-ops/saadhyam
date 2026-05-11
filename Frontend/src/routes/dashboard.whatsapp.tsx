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
import { MessageCircle, Send, Settings, Loader2, Wrench, MoreVertical, Unplug, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("saadhyam_token");

      const response = await fetch(
        "http://localhost:8000/api/whatsapp/connection-status",
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
        ? "http://localhost:8000/api/whatsapp/disconnect/permanent"
        : "http://localhost:8000/api/whatsapp/disconnect";
      
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
        
        <WhatsAppConnect
          onConnectionSuccess={handleConnectionSuccess}
          onShowOnboarding={() => setShowOnboarding(true)}
        />

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
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

        <TabsContent value="chats" className="space-y-4">
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
    </div>
  );
}
