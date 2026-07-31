import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Download, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { usePluginConfig } from "@/hooks/usePluginConfig";
import { GmailConfigPage } from "@/components/gmail/GmailConfigPage";
import * as PluginAPI from "@/lib/pluginsApi";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/plugins/gmail/")({
  head: () => ({
    meta: [{ title: "Gmail Configuration — Saadhyam AI" }],
  }),
  component: GmailIndexPage,
});

function GmailIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = usePluginConfig();

  // 1. Fetch installed plugins using React Query
  const { data: installedPlugins = [], isLoading: isInstalledLoading, refetch: refetchInstalled } = useQuery({
    queryKey: ["installed-plugins"],
    queryFn: PluginAPI.getInstalledPlugins,
    refetchOnWindowFocus: false,
  });

  const isInstalled = installedPlugins.includes("gmail");

  // 2. Install mutation using React Query
  const installMutation = useMutation({
    mutationFn: PluginAPI.installPlugin,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || "Gmail plugin installed successfully");
        queryClient.invalidateQueries({ queryKey: ["installed-plugins"] });
        refetchInstalled();
      } else {
        toast.error(result.message || "Failed to install Gmail plugin");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to install plugin");
    },
  });

  // 3. Auto-redirect to dashboard when configured
  useEffect(() => {
    if (isInstalled && config.status === "configured") {
      navigate({ to: "/dashboard/plugins/gmail/mail" as any });
    }
  }, [isInstalled, config.status, navigate]);

  const handleInstall = async () => {
    await installMutation.mutateAsync("gmail");
  };

  // Loading state
  if (isInstalledLoading || config.status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          <span>Checking Gmail plugin status…</span>
        </div>
      </div>
    );
  }

  // Not Installed View
  if (!isInstalled) {
    return (
      <div className="container mx-auto py-6 max-w-2xl space-y-6">
        <div className="mb-4">
          <Link to="/dashboard/plugins" aria-label="Back to Plugin Marketplace">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Plugin Marketplace
            </Button>
          </Link>
        </div>

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-purple-50/10 to-pink-50/10 dark:from-slate-900 dark:via-purple-950/5 dark:to-pink-950/5 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto text-6xl mb-4">📧</div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gmail Integration
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Integrate Gmail with Saadhyam to send, search and manage emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Key Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Read, list and search inbox messages",
                  "Create, send and discard drafts",
                  "Manage custom/system labels",
                  "Multi-file attachments (PDF, DOCX, TXT, etc.)",
                  "Batch actions (archive, delete, star, read)",
                  "Conversational AI assistant commands",
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-2.5 p-2 bg-muted/40 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-center">
              <Button
                size="lg"
                onClick={handleInstall}
                disabled={installMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 shadow-lg hover:shadow-purple-500/20"
              >
                {installMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Installing…
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Install Gmail Plugin
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Installed & Config Error
  if (config.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <p className="text-destructive mb-4">{config.error ?? "Failed to load configuration"}</p>
        <Button variant="outline" onClick={config.refresh}>Retry</Button>
      </div>
    );
  }

  // Installed & Not Configured — show Configuration Page
  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Link to="/dashboard/plugins" aria-label="Back to Plugin Marketplace">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Plugin Marketplace
          </Button>
        </Link>
      </div>

      <ErrorBoundary fallbackTitle="Gmail configuration error">
        <GmailConfigPage
          onConfigured={() => {
            config.refresh();
          }}
        />
      </ErrorBoundary>
    </div>
  );
}
