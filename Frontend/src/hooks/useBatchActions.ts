/**
 * useBatchActions.ts
 * Manages email selection and batch mutations powered by React Query.
 */

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type BatchAction =
  | "batch_mark_as_read"
  | "batch_mark_as_unread"
  | "batch_archive"
  | "batch_delete"
  | "batch_star"
  | "batch_unstar";

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  isRunning: boolean;
}

export interface UseBatchActionsReturn {
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  progress: BatchProgress;
  executeBatch: (
    action: BatchAction,
    fetcher: (ids: string[]) => Promise<{
      success_count: number;
      failed_count: number;
      failures: Array<{ email_id: string; error: string }>;
    }>,
    onSuccess?: (successCount: number, failedCount: number) => void
  ) => Promise<void>;
}

export function useBatchActions(): UseBatchActionsReturn {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isRunning: false,
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const batchMutation = useMutation({
    mutationFn: async ({
      fetcher,
      ids,
    }: {
      fetcher: (ids: string[]) => Promise<any>;
      ids: string[];
    }) => {
      setProgress({ total: ids.length, completed: 0, failed: 0, isRunning: true });
      return fetcher(ids);
    },
    onSuccess: (result, variables) => {
      setProgress({
        total: variables.ids.length,
        completed: result.success_count,
        failed: result.failed_count,
        isRunning: false,
      });
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
      clearSelection();
    },
    onError: () => {
      setProgress((prev) => ({ ...prev, isRunning: false }));
    },
  });

  const executeBatch = useCallback(
    async (
      _action: BatchAction,
      fetcher: (ids: string[]) => Promise<any>,
      onSuccess?: (successCount: number, failedCount: number) => void
    ) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      try {
        const result = await batchMutation.mutateAsync({ fetcher, ids });
        onSuccess?.(result.success_count, result.failed_count);
      } catch (err) {
        console.error("Batch mutation failed:", err);
      }
    },
    [selectedIds, batchMutation]
  );

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    progress,
    executeBatch,
  };
}
