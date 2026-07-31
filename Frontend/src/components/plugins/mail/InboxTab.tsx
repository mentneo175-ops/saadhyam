/**
 * InboxTab.tsx
 * Inbox email list with batch toolbar, pagination, and viewer.
 * Single Responsibility: coordinate inbox list + viewer state.
 */

import React, { useEffect, useCallback, useState, memo } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MailCard } from "./MailCard";
import { MailViewer } from "./MailViewer";
import { BatchToolbar } from "./BatchToolbar";
import { PaginationControls } from "./PaginationControls";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState, ErrorState } from "./MailStates";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useMail } from "@/hooks/useMail";
import { useBatchActions } from "@/hooks/useBatchActions";
import { usePagination } from "@/hooks/usePagination";
import type { EmailDetail } from "@/lib/gmailApi";
import * as gmailApi from "@/lib/gmailApi";

interface InboxTabProps {
  onComposeReply?: (email: EmailDetail) => void;
}

export const InboxTab = memo(function InboxTab({ onComposeReply }: InboxTabProps) {
  const mail = useMail();
  const batch = useBatchActions();
  const paging = usePagination();

  const [viewingEmail, setViewingEmail] = useState<EmailDetail | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeletingOne, setIsDeletingOne] = useState(false);

  const cacheKey = `inbox:${paging.currentToken ?? "first"}`;

  const load = useCallback(async () => {
    await mail.fetchEmails(
      () => gmailApi.listEmails({ page_token: paging.currentToken ?? undefined, max_results: 20 }),
      cacheKey
    );
    if (mail.nextPageToken) paging.setNextToken(mail.nextPageToken);
  }, [paging.currentToken]);

  // Load on pagination change
  useEffect(() => {
    load();
  }, [paging.currentToken]);

  // After fetch, update next token
  useEffect(() => {
    if (mail.nextPageToken !== undefined) {
      paging.setNextToken(mail.nextPageToken);
    }
  }, [mail.nextPageToken]);

  const handleRead = useCallback(async (id: string) => {
    setIsLoadingEmail(true);
    try {
      const detail = await gmailApi.getEmail(id);
      setViewingEmail(detail);
      // Optimistic mark-read
      mail.setEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_unread: false } : e))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open email");
    } finally {
      setIsLoadingEmail(false);
    }
  }, [mail]);

  const handleStar = useCallback(async (id: string, starred: boolean) => {
    try {
      if (starred) await gmailApi.starEmail(id);
      else await gmailApi.unstarEmail(id);
    } catch {
      // Rollback via re-fetch on error
      mail.invalidateCache("inbox:");
    }
  }, [mail]);

  const handleMarkRead = useCallback(async (id: string) => {
    await gmailApi.markAsRead(id);
    mail.invalidateCache("inbox:");
  }, [mail]);

  const handleMarkUnread = useCallback(async (id: string) => {
    await gmailApi.markAsUnread(id);
    mail.invalidateCache("inbox:");
  }, [mail]);

  const handleArchive = useCallback(async (id: string) => {
    mail.setEmails((prev) => prev.filter((e) => e.id !== id));
    try {
      await gmailApi.archiveEmail(id);
      toast.success("Email archived");
      mail.invalidateCache("inbox:");
    } catch {
      toast.error("Failed to archive. Refreshing…");
      mail.invalidateCache("inbox:");
      load();
    }
  }, [mail, load]);

  const handleDelete = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeletingOne(true);
    mail.setEmails((prev) => prev.filter((e) => e.id !== deleteTarget));
    try {
      await gmailApi.deleteEmail(deleteTarget);
      toast.success("Email deleted");
      mail.invalidateCache("inbox:");
    } catch {
      toast.error("Failed to delete. Refreshing…");
      mail.invalidateCache("inbox:");
      load();
    } finally {
      setDeleteTarget(null);
      setIsDeletingOne(false);
    }
  }, [deleteTarget, mail, load]);

  // Batch handlers
  const batchAction = useCallback(async (
    action: (ids: string[]) => Promise<gmailApi.BatchResult>,
    label: string
  ) => {
    await batch.executeBatch(
      `batch_${label}` as any,
      action,
      (ok, fail) => {
        if (fail === 0) toast.success(`${label}: ${ok} emails processed`);
        else toast.warning(`${label}: ${ok} succeeded, ${fail} failed`);
        mail.invalidateCache("inbox:");
        load();
      }
    );
  }, [batch, mail, load]);

  if (viewingEmail || isLoadingEmail) {
    return (
      <MailViewer
        email={viewingEmail}
        isLoading={isLoadingEmail}
        onClose={() => setViewingEmail(null)}
        onReply={onComposeReply}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { mail.invalidateCache("inbox:"); load(); }}
          aria-label="Refresh inbox"
          disabled={mail.isLoading}
        >
          {mail.isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            : <RefreshCw className="w-4 h-4" aria-hidden />}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {mail.isLoading && <LoadingSkeleton rows={8} />}
        {!mail.isLoading && mail.error && (
          <ErrorState message={mail.error} onRetry={load} />
        )}
        {!mail.isLoading && !mail.error && mail.emails.length === 0 && (
          <EmptyState
            title="Inbox is empty"
            description="No emails to show. Try refreshing."
            action={{ label: "Refresh", onClick: load }}
          />
        )}
        {!mail.isLoading && !mail.error && mail.emails.map((email) => (
          <MailCard
            key={email.id}
            email={email}
            isSelected={batch.isSelected(email.id)}
            onSelect={batch.toggleSelect}
            onRead={handleRead}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onStar={handleStar}
            onMarkRead={handleMarkRead}
            onMarkUnread={handleMarkUnread}
          />
        ))}
      </div>

      {/* Pagination */}
      {!mail.isLoading && mail.emails.length > 0 && (
        <PaginationControls
          pageIndex={paging.pageIndex}
          canGoBack={paging.canGoBack}
          canGoForward={paging.canGoForward}
          isLoading={mail.isLoading}
          onPrev={paging.goPrev}
          onNext={() => paging.nextToken && paging.goNext(paging.nextToken)}
        />
      )}

      {/* Batch toolbar */}
      <BatchToolbar
        selectedCount={batch.selectedIds.size}
        progress={batch.progress}
        onMarkRead={() => batchAction(gmailApi.batchMarkAsRead, "Mark as read")}
        onMarkUnread={() => batchAction(gmailApi.batchMarkAsUnread, "Mark as unread")}
        onArchive={() => batchAction(gmailApi.batchArchive, "Archive")}
        onDelete={() => batchAction(gmailApi.batchDelete, "Delete")}
        onStar={() => batchAction(gmailApi.batchStar, "Star")}
        onUnstar={() => batchAction(gmailApi.batchUnstar, "Unstar")}
        onClearSelection={batch.clearSelection}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete email?"
        description="This will permanently delete this email. This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeletingOne}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
});
