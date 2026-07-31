/**
 * MailViewer.tsx
 * Full email reader with subject, sender, body (plain/HTML), and attachments.
 * Supports reply shortcut, copy sender, copy subject.
 */

import React, { memo, useCallback } from "react";
import {
  ArrowLeft,
  Copy,
  Reply,
  ExternalLink,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AttachmentList } from "./AttachmentList";
import { LoadingSkeleton } from "./LoadingSkeleton";
import type { EmailDetail } from "@/lib/gmailApi";

export interface MailViewerProps {
  email: EmailDetail | null;
  isLoading?: boolean;
  onClose: () => void;
  onReply?: (email: EmailDetail) => void;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied to clipboard`),
    () => toast.error("Failed to copy")
  );
}

export const MailViewer = memo(function MailViewer({
  email,
  isLoading = false,
  onClose,
  onReply,
}: MailViewerProps) {
  const handleCopySender = useCallback(() => {
    if (email?.from) copyToClipboard(email.from, "Sender");
  }, [email?.from]);

  const handleCopySubject = useCallback(() => {
    if (email?.subject) copyToClipboard(email.subject, "Subject");
  }, [email?.subject]);

  const handleReply = useCallback(() => {
    if (email && onReply) onReply(email);
  }, [email, onReply]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Back to inbox">
            <ArrowLeft className="w-4 h-4" aria-hidden />
          </Button>
          <span className="text-sm text-muted-foreground">Loading email…</span>
        </div>
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Mail className="w-12 h-12 text-muted-foreground/40 mb-3" aria-hidden />
        <p className="text-muted-foreground">No email selected</p>
        <Button variant="ghost" size="sm" onClick={onClose} className="mt-4" aria-label="Back">
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden />
          Back
        </Button>
      </div>
    );
  }

  return (
    <article
      className="flex flex-col h-full"
      aria-label={`Email: ${email.subject}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Back to email list"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </Button>
        <div className="flex-1" />
        {onReply && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReply}
            className="gap-1"
            aria-label="Reply to email"
          >
            <Reply className="w-4 h-4" aria-hidden />
            Reply
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-4">
          {/* Subject */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {email.subject || "(No subject)"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopySubject}
              className="flex-shrink-0 h-7 w-7"
              aria-label="Copy subject"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden />
            </Button>
          </div>

          {/* Meta */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-10 flex-shrink-0">From</span>
              <span className="font-medium text-foreground truncate">{email.from}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleCopySender}
                aria-label="Copy sender email"
              >
                <Copy className="w-3 h-3" aria-hidden />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-10 flex-shrink-0">To</span>
              <span className="text-foreground truncate">{email.to}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-10 flex-shrink-0">Date</span>
              <span className="text-muted-foreground">
                {email.date
                  ? new Date(email.date).toLocaleString()
                  : "Unknown date"}
              </span>
            </div>
          </div>

          <Separator />

          {/* Body */}
          <div className="mail-body">
            {email.body_html ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
                aria-label="Email body"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                {email.body || "(Empty email body)"}
              </pre>
            )}
          </div>

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <>
              <Separator />
              <AttachmentList emailId={email.id} attachments={email.attachments} />
            </>
          )}
        </div>
      </ScrollArea>
    </article>
  );
});
