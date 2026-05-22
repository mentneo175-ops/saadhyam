import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";

interface WhatsAppConnectProps {
  onConnectionSuccess: () => void;
  onShowOnboarding: () => void;
}

export function WhatsAppConnect({ onConnectionSuccess, onShowOnboarding }: WhatsAppConnectProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const token = localStorage.getItem("saadhyam_token");

      // Get the embedded signup URL
      const response = await fetch(
        `${env.apiBaseUrl}/api/whatsapp/embedded-signup`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.signup_url) {
          // Open Meta signup in popup
          const popup = window.open(
            data.signup_url,
            "whatsapp-signup",
            "width=600,height=700,scrollbars=yes,resizable=yes"
          );

          if (!popup) {
            toast.error("Popup blocked. Please allow popups and try again.");
            setConnecting(false);
            return;
          }

          // Listen for messages from popup
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== env.apiBaseUrl) return;

            if (event.data.type === "WHATSAPP_OAUTH_SUCCESS") {
              // Check if we have account data to save
              if (event.data.data) {
                // Save account details
                saveAccountDetails(event.data.data);
              } else {
                toast.success("WhatsApp connected successfully!");
                onConnectionSuccess();
              }
              window.removeEventListener("message", handleMessage);
            } else if (event.data.type === "WHATSAPP_OAUTH_ERROR") {
              toast.error(event.data.error || "Failed to connect WhatsApp");
              setConnecting(false);
              window.removeEventListener("message", handleMessage);
            }
          };

          const saveAccountDetails = async (accountData: any) => {
            try {
              const token = localStorage.getItem("saadhyam_token");
              const response = await fetch(
                `${env.apiBaseUrl}/api/whatsapp/connect-manual`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(accountData),
                }
              );

              if (response.ok) {
                toast.success("WhatsApp account saved successfully!");
                onConnectionSuccess();
              } else {
                const error = await response.json();
                toast.error(error.detail || "Failed to save account details");
                setConnecting(false);
              }
            } catch (error) {
              console.error("Error saving account:", error);
              toast.error("Failed to save account details");
              setConnecting(false);
            }
          };

          window.addEventListener("message", handleMessage);

          // Check if popup was closed
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setConnecting(false);
              window.removeEventListener("message", handleMessage);
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            if (!popup.closed) {
              popup.close();
            }
            clearInterval(checkClosed);
            setConnecting(false);
            window.removeEventListener("message", handleMessage);
          }, 5 * 60 * 1000);
        } else {
          toast.error(data.error || "Failed to get signup URL");
          setConnecting(false);
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to initiate connection");
        setConnecting(false);
      }
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      toast.error("Failed to connect WhatsApp");
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Connection Card */}
      <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-emerald-500 rounded-full w-fit">
            <MessageCircle size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl">Connect WhatsApp Business</CardTitle>
          <CardDescription className="text-base">
            Start managing customer conversations, send campaigns, and automate responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={handleConnect}
              disabled={connecting}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            >
              {connecting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <MessageCircle size={20} className="mr-2" />
                  Connect WhatsApp Business
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={onShowOnboarding}
              className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              What do I need to connect? →
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageCircle size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Customer Chats</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage all customer conversations in one place with a CRM-style interface
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CheckCircle size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Campaigns</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send bulk messages, schedule broadcasts, and track delivery rates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">Automation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Auto-replies, follow-ups, and AI-powered responses to save time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requirements Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requirements</CardTitle>
          <CardDescription>What you need before connecting</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>WhatsApp Business account (not personal WhatsApp)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Facebook Business account</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Phone number not already connected to WhatsApp API</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Business verification (may be required by Meta)</span>
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Use a dedicated business phone number. Personal numbers already on WhatsApp cannot be used.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={14} />
            WhatsApp Cloud API Documentation
          </a>
          <a
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={14} />
            Create Facebook Business Account
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
