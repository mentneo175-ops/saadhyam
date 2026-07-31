/**
 * BatchToolbar.tsx
 * Sticky animated toolbar shown when emails are selected.
 * Shows progress bar during batch execution.
 */

import React from "react";
import {
  Archive,
  Trash2,
  MailOpen,
  Mail,
  Star,
  StarOff,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BatchProgress } from "@/hooks/useBatchActions";

export interface BatchToolbarProps {
  selectedCount: number;
  progress: BatchProgress;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onStar: () => void;
  onUnstar: () => void;
  onClearSelection: () => void;
}

export const BatchToolbar = React.memo(function BatchToolbar({
  selectedCount,
  progress,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onDelete,
  onStar,
  onUnstar,
  onClearSelection,
}: BatchToolbarProps) {
  if (selectedCount === 0) return null;

  const isRunning = progress.isRunning;
  const progressPct = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div
      role="toolbar"
      aria-label={`Batch actions for ${selectedCount} selected emails`}
      className="mail-batch-toolbar sticky bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
    >
      {isRunning && (
        <Progress
          value={progressPct}
          className="h-1 rounded-none"
          aria-label={`Batch progress: ${progressPct}%`}
        />
      )}

      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
        {/* Selection count */}
        <span className="text-sm font-semibold text-foreground whitespace-nowrap mr-2">
          {selectedCount} selected
        </span>

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkRead}
          disabled={isRunning}
          className="gap-1 whitespace-nowrap"
          aria-label="Mark selected as read"
        >
          <MailOpen className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Mark Read</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onMarkUnread}
          disabled={isRunning}
          className="gap-1 whitespace-nowrap"
          aria-label="Mark selected as unread"
        >
          <Mail className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Mark Unread</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onArchive}
          disabled={isRunning}
          className="gap-1 whitespace-nowrap"
          aria-label="Archive selected emails"
        >
          <Archive className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Archive</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onStar}
          disabled={isRunning}
          className="gap-1 whitespace-nowrap text-amber-600 hover:text-amber-700"
          aria-label="Star selected emails"
        >
          <Star className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Star</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onUnstar}
          disabled={isRunning}
          className="gap-1 whitespace-nowrap"
          aria-label="Unstar selected emails"
        >
          <StarOff className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Unstar</span>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isRunning}
          className="gap-1 whitespace-nowrap"
          aria-label="Delete selected emails"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="w-4 h-4" aria-hidden />
          )}
          <span className="hidden sm:inline">Delete</span>
        </Button>

        {/* Clear */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isRunning}
          className="ml-auto gap-1 whitespace-nowrap"
          aria-label="Clear email selection"
        >
          <X className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>
    </div>
  );
});
