import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Loader2 } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/instagram")({
  head: () => ({ meta: [{ title: "Instagram — Saadhyam AI" }] }),
  component: InstagramPage,
});

interface InstagramConnectionStatus {
  is_connected: boolean;
  account_username?: string;
  page_name?: string;
  connection_error?: string;
}

function InstagramPage() {
  const [connectionStatus, setConnectionStatus] = useState<InstagramConnectionStatus>({
    is_connected: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void checkConnection();

    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram") === "success") {
      toast.success("Instagram connected successfully");
      window.history.replaceState({}, document.title, window.location.pathname);
      void checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch(
        "http://localhost:8000/settings/instagram/connection-status",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        throw new Error("Failed to check Instagram connection");
      }

      const data = (await response.json()) as InstagramConnectionStatus;
      setConnectionStatus(data);
    } catch (error) {
      console.error("Failed to check connection:", error);
      toast.error("Could not load Instagram connection status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    const token = localStorage.getItem("saadhyam_token");
    if (!token) {
      toast.error("Please log in before connecting Instagram");
      return;
    }

    window.open(
      `http://localhost:8000/auth/instagram/connect?token=${token}`,
      "instagram-connect",
      "width=600,height=700",
    );
  };

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="Instagram" description="Loading..." />
        <LoadingIndicator />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title="Instagram" description="Manage your Instagram account" />

      <div className="mt-8 max-w-4xl">
        {!connectionStatus.is_connected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-6 w-6" />
                Connect Instagram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Connect your Instagram Business account to schedule posts and view analytics.
              </p>
              <Button onClick={handleConnect}>Connect Instagram Account</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-6 w-6" />
                Instagram Connected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Connected as{" "}
                <strong>@{connectionStatus.account_username ?? "unknown"}</strong>
                {connectionStatus.page_name ? ` · ${connectionStatus.page_name}` : null}
              </p>
              {connectionStatus.connection_error ? (
                <p className="text-sm text-destructive">{connectionStatus.connection_error}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleConnect}>
                  Reconnect account
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/dashboard/instagram-analytics">Open analytics</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="p-8">{children}</div>;
}

function LoadingIndicator() {
  return (
    <div className="mt-8 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Checking connection...
    </div>
  );
}
