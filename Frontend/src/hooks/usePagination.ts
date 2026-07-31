/**
 * usePagination.ts
 * Manages page token history for bidirectional email list navigation.
 */

import { useState, useCallback } from "react";

export interface PaginationState {
  currentToken: string | null;
  nextToken: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  pageIndex: number;
}

export interface UsePaginationReturn extends PaginationState {
  goNext: (token: string) => void;
  goPrev: () => void;
  reset: () => void;
  setNextToken: (token: string | null) => void;
}

export function usePagination(): UsePaginationReturn {
  // History stack: index 0 = first page (null token), subsequent = page tokens
  const [history, setHistory] = useState<Array<string | null>>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const currentToken = history[pageIndex] ?? null;

  const goNext = useCallback((token: string) => {
    setHistory((prev) => {
      // Truncate forward history if we branched off mid-history
      const truncated = prev.slice(0, pageIndex + 1);
      return [...truncated, token];
    });
    setPageIndex((i) => i + 1);
    setNextToken(null);
  }, [pageIndex]);

  const goPrev = useCallback(() => {
    if (pageIndex > 0) {
      setPageIndex((i) => i - 1);
      setNextToken(null);
    }
  }, [pageIndex]);

  const reset = useCallback(() => {
    setHistory([null]);
    setPageIndex(0);
    setNextToken(null);
  }, []);

  return {
    currentToken,
    nextToken,
    canGoBack: pageIndex > 0,
    canGoForward: nextToken !== null,
    pageIndex,
    goNext,
    goPrev,
    reset,
    setNextToken,
  };
}
