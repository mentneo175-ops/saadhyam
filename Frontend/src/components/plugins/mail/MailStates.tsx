/**
 * EmptyState.tsx & ErrorState.tsx
 * Shared empty / error UI for mail tabs.
 */

import React, { memo } from "react";
import { Inbox, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── EmptyState ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = memo(function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="p-4 rounded-full bg-muted mb-4">
        {icon ?? <Inbox className="w-8 h-8 text-muted-foreground" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
});

// ── ErrorState ────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = memo(function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="p-4 rounded-full bg-destructive/10 mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
});

// ── ConnectionBanner ──────────────────────────────────────────────────────────

interface ConnectionBannerProps {
  email?: string;
  totalMessages?: number;
}

export const ConnectionBanner = memo(function ConnectionBanner({
  email,
  totalMessages,
}: ConnectionBannerProps) {
  if (!email) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 border-b border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-300"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden />
      <span>
        Connected as <strong>{email}</strong>
        {totalMessages != null && (
          <> · {totalMessages.toLocaleString()} messages</>
        )}
      </span>
    </div>
  );
});
