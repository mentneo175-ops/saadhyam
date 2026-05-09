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
import { MessageCircle, Send, Settings, Loader2, Wrench } from "lucide-react";
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
      <PageHeader
        title="WhatsApp Sales"
        subtitle={`Connected: ${connectionStatus.business_name || connectionStatus.phone_number}`}
      />

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
    </div>
  );
}
