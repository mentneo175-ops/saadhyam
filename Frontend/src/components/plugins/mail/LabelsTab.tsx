/**
 * LabelsTab.tsx
 * Displays and manages Gmail labels powered by React Query.
 */

import React, { useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LabelManager } from "./LabelManager";
import { ErrorState } from "./MailStates";
import * as gmailApi from "@/lib/gmailApi";

export const LabelsTab = memo(function LabelsTab() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gmail", "labels"],
    queryFn: gmailApi.listLabels,
    refetchOnWindowFocus: false,
  });

  const createLabelMutation = useMutation({
    mutationFn: gmailApi.createLabel,
    onSuccess: (result) => {
      toast.success(`Label "${result.label.name}" created`);
      queryClient.invalidateQueries({ queryKey: ["gmail", "labels"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create label");
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: gmailApi.deleteLabel,
    onSuccess: (_, labelId) => {
      const deletedLabel = data?.labels?.find((l) => l.id === labelId);
      toast.success(`Label "${deletedLabel?.name || "Custom label"}" deleted`);
      queryClient.invalidateQueries({ queryKey: ["gmail", "labels"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete label");
    },
  });

  const handleCreateLabel = useCallback(async (name: string) => {
    await createLabelMutation.mutateAsync(name);
  }, [createLabelMutation]);

  const handleDeleteLabel = useCallback(async (labelId: string) => {
    await deleteLabelMutation.mutateAsync(labelId);
  }, [deleteLabelMutation]);

  if (error) {
    return <ErrorState message={error.message || "Failed to load labels"} onRetry={() => refetch()} />;
  }

  const labelsList = data?.labels ?? [];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Labels</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your Gmail labels. System labels cannot be deleted.
        </p>
      </div>
      <LabelManager
        labels={labelsList}
        isLoading={isLoading || createLabelMutation.isPending || deleteLabelMutation.isPending}
        onCreateLabel={handleCreateLabel}
        onDeleteLabel={handleDeleteLabel}
      />
    </div>
  );
});
