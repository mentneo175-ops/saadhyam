/**
 * useMail.ts
 * Gmail email list loader powered by React Query.
 * Supports inbox, search, caching, pagination, and optimistic updates.
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EmailSummary, EmailListResult } from "@/lib/gmailApi";

export interface UseMailReturn {
  emails: EmailSummary[];
  isLoading: boolean;
  error: string | null;
  nextPageToken: string | null;
  hasMore: boolean;
  fetchEmails: (
    fetcher: () => Promise<EmailListResult>,
    cacheKey: string
  ) => Promise<void>;
  invalidateCache: (prefix?: string) => void;
  setEmails: React.Dispatch<React.SetStateAction<EmailSummary[]>>;
  clearError: () => void;
}

export function useMail(): UseMailReturn {
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeFetcher, setActiveFetcher] = useState<(() => Promise<EmailListResult>) | null>(null);
  const [manualEmails, setManualEmails] = useState<EmailSummary[] | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["gmail", "emails", activeKey],
    queryFn: async () => {
      if (!activeFetcher) throw new Error("No fetcher active");
      const result = await activeFetcher();
      setManualEmails(null);
      return result;
    },
    enabled: activeKey !== null && activeFetcher !== null,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const fetchEmails = useCallback(
    async (fetcher: () => Promise<EmailListResult>, cacheKey: string) => {
      setActiveFetcher(() => fetcher);
      setActiveKey(cacheKey);
    },
    []
  );

  const invalidateCache = useCallback((prefix?: string) => {
    if (prefix) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key[0] === "gmail" &&
            key[1] === "emails" &&
            typeof key[2] === "string" &&
            key[2].startsWith(prefix)
          );
        },
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ["gmail", "emails"] });
    }
  }, [queryClient]);

  const clearError = useCallback(() => {}, []);

  const setEmails = useCallback((updater: any) => {
    setManualEmails((prev) => {
      const currentList = prev ?? data?.emails ?? [];
      const newList = typeof updater === "function" ? updater(currentList) : updater;
      return newList;
    });
  }, [data?.emails]);

  const displayedEmails = manualEmails ?? data?.emails ?? [];
  const nextPageToken = data?.next_page_token ?? null;
  const hasMore = data?.has_more ?? false;

  return {
    emails: displayedEmails,
    isLoading: isLoading && activeKey !== null,
    error: error ? (error.message || "Failed to load emails") : null,
    nextPageToken,
    hasMore,
    fetchEmails,
    invalidateCache,
    setEmails,
    clearError,
  };
}
