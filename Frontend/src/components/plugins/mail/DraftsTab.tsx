/**
 * DraftsTab.tsx
 * List drafts, create a new draft, send or delete existing drafts using React Query.
 */

import React, { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Trash2, Plus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState, ErrorState } from "./MailStates";
import { MailComposer } from "./MailComposer";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import type { Draft, SendEmailPayload } from "@/lib/gmailApi";
import * as gmailApi from "@/lib/gmailApi";

export const DraftsTab = memo(function DraftsTab() {
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Draft | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gmail", "drafts"],
    queryFn: () => gmailApi.listDrafts({ max_results: 20 }),
    refetchOnWindowFocus: false,
  });

  const createDraftMutation = useMutation({
    mutationFn: gmailApi.createDraft,
    onSuccess: () => {
      toast.success("Draft saved");
      setShowCompose(false);
      queryClient.invalidateQueries({ queryKey: ["gmail", "drafts"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    },
  });

  const sendDraftMutation = useMutation({
    mutationFn: gmailApi.sendDraft,
    onSuccess: (_, draftId) => {
      toast.success("Draft sent successfully", { id: `send-${draftId}` });
      queryClient.invalidateQueries({ queryKey: ["gmail", "drafts"] });
    },
    onError: (err, draftId) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to send draft",
        { id: `send-${draftId}` }
      );
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: gmailApi.deleteDraft,
    onSuccess: () => {
      toast.success("Draft deleted");
      queryClient.invalidateQueries({ queryKey: ["gmail", "drafts"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete draft");
    },
  });

  const handleCreateDraft = useCallback(async (payload: SendEmailPayload) => {
    await createDraftMutation.mutateAsync({
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      cc: payload.cc,
    });
  }, [createDraftMutation]);

  const handleSendDraft = useCallback(async (draft: Draft) => {
    setSendingId(draft.id);
    toast.loading(`Sending draft…`, { id: `send-${draft.id}` });
    try {
      await sendDraftMutation.mutateAsync(draft.id);
    } finally {
      setSendingId(null);
    }
  }, [sendDraftMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteDraftMutation.mutateAsync(deleteTarget.id);
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteDraftMutation]);

  if (showCompose) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
            ← Back to Drafts
          </Button>
        </div>
        <MailComposer onSend={handleCreateDraft} onCancel={() => setShowCompose(false)} />
      </div>
    );
  }

  const draftsList = data?.drafts ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Drafts</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh drafts" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <RefreshCw className="w-4 h-4" aria-hidden />}
          </Button>
          <Button size="sm" onClick={() => setShowCompose(true)} className="gap-1" aria-label="New draft">
            <Plus className="w-4 h-4" aria-hidden />
            New Draft
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && <LoadingSkeleton rows={4} />}
        {!isLoading && error && <ErrorState message={error.message || "Failed to load drafts"} onRetry={() => refetch()} />}
        {!isLoading && !error && draftsList.length === 0 && (
          <EmptyState
            title="No drafts"
            description="Start a new draft above."
            icon={<FileText className="w-8 h-8 text-muted-foreground" aria-hidden />}
            action={{ label: "New Draft", onClick: () => setShowCompose(true) }}
          />
        )}
        {!isLoading && draftsList.map((draft) => (
          <div
            key={draft.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors"
          >
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{draft.subject ?? "(No subject)"}</p>
              <p className="text-xs text-muted-foreground truncate">{draft.snippet ?? ""}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => handleSendDraft(draft)}
                disabled={sendingId === draft.id || sendDraftMutation.isPending}
                aria-label={`Send draft: ${draft.subject}`}
              >
                {sendingId === draft.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  : <Send className="w-3.5 h-3.5" aria-hidden />}
                Send
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(draft)}
                disabled={deleteDraftMutation.isPending}
                aria-label={`Delete draft: ${draft.subject}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete draft "${deleteTarget?.subject ?? "(No subject)"}"?`}
        description="This draft will be permanently deleted."
        confirmLabel="Delete Draft"
        isLoading={deleteDraftMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
});
