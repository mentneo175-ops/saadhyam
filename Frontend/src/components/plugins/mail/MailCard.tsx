/**
 * MailCard.tsx
 * Single email row with checkbox, star, sender, subject, snippet, date, and action buttons.
 * Supports optimistic UI for star/read/unread state.
 */

import React, { useState, useCallback, memo } from "react";
import {
  Star,
  Archive,
  Trash2,
  MailOpen,
  Mail,
  Eye,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { EmailSummary } from "@/lib/gmailApi";

export interface MailCardProps {
  email: EmailSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onStar: (id: string, starred: boolean) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export const MailCard = memo(function MailCard({
  email,
  isSelected,
  onSelect,
  onRead,
  onArchive,
  onDelete,
  onStar,
  onMarkRead,
  onMarkUnread,
}: MailCardProps) {
  // Optimistic local state
  const [optimisticStarred, setOptimisticStarred] = useState(
    email.is_starred ?? false
  );
  const [optimisticRead, setOptimisticRead] = useState(
    !(email.is_unread ?? true)
  );

  const handleStar = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = !optimisticStarred;
      setOptimisticStarred(next);
      onStar(email.id, next);
    },
    [email.id, optimisticStarred, onStar]
  );

  const handleMarkRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setOptimisticRead(true);
      onMarkRead(email.id);
    },
    [email.id, onMarkRead]
  );

  const handleMarkUnread = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setOptimisticRead(false);
      onMarkUnread(email.id);
    },
    [email.id, onMarkUnread]
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onArchive(email.id);
    },
    [email.id, onArchive]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(email.id);
    },
    [email.id, onDelete]
  );

  const handleRowClick = useCallback(() => {
    onRead(email.id);
  }, [email.id, onRead]);

  const handleCheckboxChange = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(email.id);
    },
    [email.id, onSelect]
  );

  const isUnread = !optimisticRead;

  return (
    <article
      className={cn(
        "mail-card group flex items-center gap-3 px-4 py-3 border-b border-border",
        "cursor-pointer hover:bg-muted/50 transition-colors duration-150",
        isSelected && "bg-primary/5 hover:bg-primary/10",
        isUnread && "font-medium"
      )}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleRowClick()}
      aria-label={`Email from ${email.from}: ${email.subject}`}
    >
      {/* Checkbox */}
      <div onClick={handleCheckboxChange} className="flex-shrink-0">
        <Checkbox
          checked={isSelected}
          aria-label={`Select email from ${email.from}`}
          tabIndex={-1}
          className="cursor-pointer"
        />
      </div>

      {/* Star */}
      <button
        onClick={handleStar}
        className={cn(
          "flex-shrink-0 p-1 rounded hover:scale-110 transition-transform",
          optimisticStarred
            ? "text-amber-500"
            : "text-muted-foreground/40 hover:text-amber-400"
        )}
        aria-label={optimisticStarred ? "Unstar email" : "Star email"}
        aria-pressed={optimisticStarred}
        tabIndex={0}
      >
        <Star
          className="w-4 h-4"
          fill={optimisticStarred ? "currentColor" : "none"}
          aria-hidden
        />
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {email.from || "Unknown sender"}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
            {formatDate(email.date)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-sm truncate",
              isUnread ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {email.subject || "(No subject)"}
          </span>
          {email.has_attachments && (
            <Paperclip
              className="w-3 h-3 flex-shrink-0 text-muted-foreground"
              aria-label="Has attachments"
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {email.snippet}
        </p>
      </div>

      {/* Action buttons (shown on hover) */}
      <div
        className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onRead(email.id)}
          aria-label="Read email"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden />
        </Button>

        {isUnread ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleMarkRead}
            aria-label="Mark as read"
          >
            <MailOpen className="w-3.5 h-3.5" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleMarkUnread}
            aria-label="Mark as unread"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleArchive}
          aria-label="Archive email"
        >
          <Archive className="w-3.5 h-3.5" aria-hidden />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          aria-label="Delete email"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
});
