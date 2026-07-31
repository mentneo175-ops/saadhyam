import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { usePluginConfig } from "@/hooks/usePluginConfig";
import { MailDashboard } from "@/components/plugins/mail/MailDashboard";
import * as gmailApi from "@/lib/gmailApi";

export const Route = createFileRoute("/dashboard/plugins/gmail/mail")({
  head: () => ({
    meta: [{ title: "Gmail Inbox — Saadhyam AI" }],
  }),
  component: GmailMailPage,
});

function GmailMailPage() {
  const navigate = useNavigate();
  const config = usePluginConfig();

  // Test connection query using React Query
  const { data: connection, isLoading: isConnecting } = useQuery({
    queryKey: ["gmail", "connection"],
    queryFn: gmailApi.testConnection,
    enabled: config.status === "configured",
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Redirect to configuration page if not configured
  useEffect(() => {
    if (config.status === "not_configured" || config.status === "error") {
      navigate({ to: "/dashboard/plugins/gmail" as any });
    }
  }, [config.status, navigate]);

  if (config.status === "loading" || (config.status === "configured" && isConnecting)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          <span>Connecting to Gmail account…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 112px)" }}
    >
      <ErrorBoundary fallbackTitle="Gmail dashboard error">
        <MailDashboard
          provider="gmail"
          providerLabel="Gmail"
          providerIcon="📧"
          connectedEmail={connection?.email}
          totalMessages={connection?.total_messages}
          isConnected={!!connection?.success}
          onOpenConfig={() => navigate({ to: "/dashboard/plugins/gmail" as any })}
        />
      </ErrorBoundary>
    </div>
  );
}
