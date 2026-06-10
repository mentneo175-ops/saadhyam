import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  MessageCircle,
  Copy,
  RefreshCcw,
  Send,
  Phone,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/whatsapp-sales")({
  head: () => ({ meta: [{ title: "WhatsApp Sales AI — Saadhyam AI" }] }),
  component: WhatsAppSalesPage,
});

function WhatsAppSalesPage() {
  const [activeTab, setActiveTab] = useState("follow-up");
  const [customerName, setCustomerName] = useState("Priya");
  const [service, setService] = useState("Teeth Whitening");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.generateWhatsAppMessage({
        message_type: activeTab,
        customer_name: customerName,
        service: service,
        language: "English",
        tone: "Friendly",
      });
      if (response.success) {
        setGeneratedMessage(response.message);
      }
    } catch (error) {
      console.error("Generation error:", error);
      // Fallback message
      setGeneratedMessage(
        `Hi ${customerName}! 👋\n\nThank you for your interest in our ${service} service.`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="WhatsApp Sales AI"
        subtitle="Convert leads and close sales through WhatsApp"
        actions={
          <Button variant="hero" size="sm">
            <Sparkles size={14} /> Bulk Generate
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Messages Sent"
          value="1,248"
          icon={MessageCircle}
          gradient="from-emerald-300 to-teal-300"
        />
        <StatCard
          label="Response Rate"
          value="68%"
          icon={Target}
          gradient="from-blue-300 to-indigo-300"
        />
        <StatCard
          label="Conversions"
          value="156"
          icon={Zap}
          gradient="from-amber-300 to-orange-300"
        />
        <StatCard
          label="Pending Follow-ups"
          value="23"
          icon={Clock}
          gradient="from-purple-300 to-fuchsia-300"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl grid grid-cols-4 w-full">
          <TabsTrigger value="follow-up" className="rounded-lg text-xs">
            <Phone size={14} /> Follow-up
          </TabsTrigger>
          <TabsTrigger value="lead-closing" className="rounded-lg text-xs">
            <Target size={14} /> Lead Closing
          </TabsTrigger>
          <TabsTrigger value="reminder" className="rounded-lg text-xs">
            <Clock size={14} /> Reminders
          </TabsTrigger>
          <TabsTrigger value="offer" className="rounded-lg text-xs">
            <Sparkles size={14} /> Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Input Panel */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Service/Product</label>
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                    placeholder="Enter service"
                  />
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Message
                  </>
                )}
              </Button>
            </div>

            {/* Output Panel */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Generated WhatsApp Message</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-success/10 text-success">
                  <MessageCircle size={10} /> Ready
                </span>
              </div>

              <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border-2 border-green-200 min-h-[250px]">
                <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-slate-900">
                  {generatedMessage ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {generatedMessage}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Click "Generate Message" to create your WhatsApp message
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={!generatedMessage}
                  onClick={() => navigator.clipboard?.writeText(generatedMessage)}
                >
                  <Copy size={13} /> Copy
                </Button>
                <Button variant="hero" size="sm" className="flex-1" disabled={!generatedMessage}>
                  <Send size={13} /> Send
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
