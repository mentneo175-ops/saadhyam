/**
 * MailDashboard.tsx
 * Provider-agnostic mail dashboard coordinator.
 * Manages tab state; delegates all data/UI work to tab components.
 * Kept intentionally thin – single responsibility: tab routing.
 */

import React, { useState, useCallback, lazy, Suspense, memo } from "react";
import {
  Inbox,
  Search,
  PenSquare,
  FileText,
  Tag,
  Settings,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConnectionBanner } from "./MailStates";
import { LoadingSkeleton } from "./LoadingSkeleton";
import type { EmailDetail } from "@/lib/gmailApi";

// Lazy-load heavy tab components
const InboxTab = lazy(() =>
  import("./InboxTab").then((m) => ({ default: m.InboxTab }))
);
const SearchTab = lazy(() =>
  import("./SearchTab").then((m) => ({ default: m.SearchTab }))
);
const DraftsTab = lazy(() =>
  import("./DraftsTab").then((m) => ({ default: m.DraftsTab }))
);
const LabelsTab = lazy(() =>
  import("./LabelsTab").then((m) => ({ default: m.LabelsTab }))
);
const MailComposer = lazy(() =>
  import("./MailComposer").then((m) => ({ default: m.MailComposer }))
);

// ─────────────────────────────────────────────

type TabId = "inbox" | "search" | "compose" | "drafts" | "labels";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode; ariaLabel: string }> = [
  { id: "inbox",   label: "Inbox",   icon: <Inbox className="w-4 h-4" />,     ariaLabel: "Open inbox" },
  { id: "search",  label: "Search",  icon: <Search className="w-4 h-4" />,    ariaLabel: "Search emails" },
  { id: "compose", label: "Compose", icon: <PenSquare className="w-4 h-4" />, ariaLabel: "Compose new email" },
  { id: "drafts",  label: "Drafts",  icon: <FileText className="w-4 h-4" />,  ariaLabel: "View drafts" },
  { id: "labels",  label: "Labels",  icon: <Tag className="w-4 h-4" />,       ariaLabel: "Manage labels" },
];

// ─────────────────────────────────────────────

export interface MailDashboardProps {
  /** e.g. "gmail" – used only to display provider name */
  provider: string;
  providerLabel: string;
  providerIcon: string;
  connectedEmail?: string;
  totalMessages?: number;
  isConnected?: boolean;
  onOpenConfig?: () => void;
}

export const MailDashboard = memo(function MailDashboard({
  providerLabel,
  providerIcon,
  connectedEmail,
  totalMessages,
  isConnected = true,
  onOpenConfig,
}: MailDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("inbox");
  const [composeReplyTo, setComposeReplyTo] = useState<EmailDetail | null>(null);

  const handleReply = useCallback((email: EmailDetail) => {
    setComposeReplyTo(email);
    setActiveTab("compose");
  }, []);

  const handleSendEmail = useCallback(async (payload: Parameters<typeof import("@/lib/gmailApi").sendEmail>[0]) => {
    const { toast } = await import("sonner");
    const gmailApi = await import("@/lib/gmailApi");
    const id = "send-mail";
    toast.loading("Sending email…", { id });
    try {
      await gmailApi.sendEmail(payload);
      toast.success("Email sent successfully!", { id });
      setActiveTab("inbox");
      setComposeReplyTo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email", { id });
      throw err;
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{providerIcon}</span>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">
              {providerLabel}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isConnected ? (
                <><Wifi className="w-3 h-3 text-green-500" aria-hidden /> Connected</>
              ) : (
                <><WifiOff className="w-3 h-3 text-destructive" aria-hidden /> Disconnected</>
              )}
            </p>
          </div>
        </div>
        {onOpenConfig && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenConfig}
            aria-label="Open Gmail configuration"
          >
            <Settings className="w-4 h-4" aria-hidden />
          </Button>
        )}
      </header>

      {/* Connection banner */}
      <ConnectionBanner email={connectedEmail} totalMessages={totalMessages} />

      {/* Tab bar */}
      <nav
        role="tablist"
        aria-label="Mail sections"
        className="flex border-b border-border bg-background flex-shrink-0 overflow-x-auto scrollbar-hide"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            aria-label={tab.ariaLabel}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap",
              "border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab panels */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-hidden min-h-0"
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden />
            </div>
          }
        >
          {activeTab === "inbox" && <InboxTab onComposeReply={handleReply} />}
          {activeTab === "search" && <SearchTab />}
          {activeTab === "compose" && (
            <div className="overflow-y-auto h-full">
              <MailComposer
                initialTo={composeReplyTo?.from ?? ""}
                initialSubject={
                  composeReplyTo?.subject
                    ? `Re: ${composeReplyTo.subject}`
                    : ""
                }
                onSend={handleSendEmail}
                onCancel={() => {
                  setActiveTab("inbox");
                  setComposeReplyTo(null);
                }}
              />
            </div>
          )}
          {activeTab === "drafts" && <DraftsTab />}
          {activeTab === "labels" && <LabelsTab />}
        </Suspense>
      </div>
    </div>
  );
});
