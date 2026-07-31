/**
 * PaginationControls.tsx
 * Previous / Next navigation with page index display.
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationControlsProps {
  pageIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const PaginationControls = React.memo(function PaginationControls({
  pageIndex,
  canGoBack,
  canGoForward,
  isLoading = false,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <nav
      className="flex items-center justify-between px-4 py-3 border-t border-border"
      aria-label="Email list pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={!canGoBack || isLoading}
        className="gap-1"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {pageIndex + 1}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!canGoForward || isLoading}
        className="gap-1"
        aria-label="Next page"
      >
        Next
        <ChevronRight className="w-4 h-4" aria-hidden />
      </Button>
    </nav>
  );
});
