/**
 * LoadingSkeleton.tsx
 * Shimmer skeleton rows for email list loading states.
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  rows?: number;
}

export const LoadingSkeleton = React.memo(function LoadingSkeleton({
  rows = 5,
}: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading emails"
      className="space-y-3 p-4"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-border"
        >
          {/* Checkbox placeholder */}
          <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
          {/* Star placeholder */}
          <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-full max-w-xs rounded" />
          </div>
          {/* Action buttons placeholder */}
          <div className="flex gap-1 flex-shrink-0">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="w-7 h-7 rounded-lg" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading email list…</span>
    </div>
  );
});
