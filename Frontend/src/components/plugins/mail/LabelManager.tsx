/**
 * LabelManager.tsx
 * Displays Gmail labels as chips, with Create / Delete / Apply / Remove actions.
 * Uses ConfirmModal for deletions.
 */

import React, { useState, useCallback, memo } from "react";
import { Tag, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import type { Label } from "@/lib/gmailApi";

export interface LabelManagerProps {
  labels: Label[];
  isLoading?: boolean;
  onCreateLabel: (name: string) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
  selectedEmailId?: string;
  onApplyLabel?: (labelId: string) => Promise<void>;
  onRemoveLabel?: (labelId: string) => Promise<void>;
}

// System labels that cannot be deleted
const SYSTEM_LABEL_TYPES = new Set(["system"]);

export const LabelManager = memo(function LabelManager({
  labels,
  isLoading = false,
  onCreateLabel,
  onDeleteLabel,
  selectedEmailId,
  onApplyLabel,
  onRemoveLabel,
}: LabelManagerProps) {
  const [newLabelName, setNewLabelName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Label | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    const name = newLabelName.trim();
    if (!name) {
      toast.error("Label name cannot be empty");
      return;
    }
    setIsCreating(true);
    try {
      await onCreateLabel(name);
      setNewLabelName("");
    } finally {
      setIsCreating(false);
    }
  }, [newLabelName, onCreateLabel]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      await onDeleteLabel(confirmDelete.id);
    } finally {
      setDeletingId(null);
    }
  }, [confirmDelete, onDeleteLabel]);

  const handleApply = useCallback(
    async (labelId: string) => {
      if (!onApplyLabel) return;
      setActionId(labelId);
      try {
        await onApplyLabel(labelId);
      } finally {
        setActionId(null);
      }
    },
    [onApplyLabel]
  );

  const handleRemove = useCallback(
    async (labelId: string) => {
      if (!onRemoveLabel) return;
      setActionId(labelId);
      try {
        await onRemoveLabel(labelId);
      } finally {
        setActionId(null);
      }
    },
    [onRemoveLabel]
  );

  return (
    <section aria-label="Label manager" className="space-y-4">
      {/* Create new label */}
      <div className="flex gap-2">
        <Input
          id="new-label-input"
          placeholder="New label name…"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          aria-label="New label name"
          disabled={isCreating}
          className="flex-1"
        />
        <Button
          onClick={handleCreate}
          disabled={isCreating || !newLabelName.trim()}
          className="gap-1"
          aria-label="Create label"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="w-4 h-4" aria-hidden />
          )}
          Create
        </Button>
      </div>

      {/* Labels list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          <span>Loading labels…</span>
        </div>
      ) : labels.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No custom labels found. Create one above.
        </p>
      ) : (
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Email labels"
        >
          {labels.map((label) => {
            const isSystem = SYSTEM_LABEL_TYPES.has(label.type ?? "");
            const isDeleting = deletingId === label.id;
            const isActing = actionId === label.id;

            return (
              <div
                key={label.id}
                role="listitem"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary text-sm hover:bg-secondary/80 transition-colors"
              >
                <Tag className="w-3 h-3 text-muted-foreground" aria-hidden />
                <span>{label.name}</span>

                {selectedEmailId && onApplyLabel && (
                  <button
                    className="text-xs text-blue-600 hover:underline ml-1"
                    onClick={() => handleApply(label.id)}
                    disabled={isActing}
                    aria-label={`Apply label ${label.name}`}
                  >
                    {isActing ? "…" : "Apply"}
                  </button>
                )}

                {selectedEmailId && onRemoveLabel && (
                  <button
                    className="text-xs text-amber-600 hover:underline ml-1"
                    onClick={() => handleRemove(label.id)}
                    disabled={isActing}
                    aria-label={`Remove label ${label.name}`}
                  >
                    {isActing ? "…" : "Remove"}
                  </button>
                )}

                {!isSystem && (
                  <button
                    className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setConfirmDelete(label)}
                    disabled={isDeleting}
                    aria-label={`Delete label ${label.name}`}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="w-3 h-3" aria-hidden />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete label "${confirmDelete?.name}"?`}
        description="This will permanently remove the label. Emails with this label will not be deleted."
        confirmLabel="Delete Label"
        variant="destructive"
        isLoading={!!deletingId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </section>
  );
});
