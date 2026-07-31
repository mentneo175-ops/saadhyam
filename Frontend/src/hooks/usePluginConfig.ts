/**
 * usePluginConfig.ts
 * Loads, saves, and deletes Gmail plugin configuration using React Query.
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as gmailApi from "@/lib/gmailApi";
import type { GmailConfigPayload } from "@/lib/gmailApi";

export type ConfigStatus = "loading" | "configured" | "not_configured" | "error";

export interface UsePluginConfigReturn {
  status: ConfigStatus;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveConfig: (payload: GmailConfigPayload) => Promise<boolean>;
  deleteConfig: () => Promise<boolean>;
}

export function usePluginConfig(): UsePluginConfigReturn {
  const queryClient = useQueryClient();

  const { data, isLoading: isQueryLoading, error: queryError, refetch } = useQuery({
    queryKey: ["gmail", "config"],
    queryFn: gmailApi.getConfig,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: gmailApi.saveConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail", "config"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gmailApi.deleteConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail", "config"] });
    },
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const saveConfig = useCallback(
    async (payload: GmailConfigPayload): Promise<boolean> => {
      try {
        await saveMutation.mutateAsync(payload);
        return true;
      } catch {
        return false;
      }
    },
    [saveMutation]
  );

  const deleteConfig = useCallback(async (): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [deleteMutation]);

  let status: ConfigStatus = "loading";
  const isLoading = isQueryLoading || saveMutation.isPending || deleteMutation.isPending;

  if (isLoading) {
    status = "loading";
  } else if (queryError || saveMutation.error || deleteMutation.error) {
    status = "error";
  } else if (data?.configured) {
    status = "configured";
  } else {
    status = "not_configured";
  }

  const error = (queryError?.message || saveMutation.error?.message || deleteMutation.error?.message) ?? null;

  return { status, isLoading, error, refresh, saveConfig, deleteConfig };
}
