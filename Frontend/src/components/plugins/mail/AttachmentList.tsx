/**
 * AttachmentList.tsx
 * Displays email attachments with mime icon, size, and download button.
 * Supports download progress and image/PDF preview hints.
 */

import React, { useState, useCallback, memo } from "react";
import {
  Paperclip,
  Download,
  FileImage,
  FileText,
  File,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as gmailApi from "@/lib/gmailApi";
import type { AttachmentMeta } from "@/lib/gmailApi";

interface AttachmentListProps {
  emailId: string;
  attachments: AttachmentMeta[];
}

function mimeIcon(mime: string): React.ReactNode {
  if (mime.startsWith("image/")) return <FileImage className="w-4 h-4" aria-hidden />;
  if (mime === "application/pdf" || mime.startsWith("text/"))
    return <FileText className="w-4 h-4" aria-hidden />;
  return <File className="w-4 h-4" aria-hidden />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function base64ToBlob(b64: string, mime: string): Blob {
  const byteStr = atob(b64);
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface AttachmentRowProps {
  emailId: string;
  attachment: AttachmentMeta;
}

const AttachmentRow = memo(function AttachmentRow({
  emailId,
  attachment,
}: AttachmentRowProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    const toastId = `dl-${attachment.attachment_id}`;
    toast.loading(`Downloading ${attachment.filename}…`, { id: toastId });
    try {
      const result = await gmailApi.downloadAttachment(emailId, attachment.attachment_id);
      const blob = base64ToBlob(result.base64_content, result.mime_type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${result.filename}`, { id: toastId });
    } catch (err) {
      toast.error(
        `Download failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        { id: toastId }
      );
    } finally {
      setIsDownloading(false);
    }
  }, [emailId, attachment]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors">
      <div className="text-muted-foreground flex-shrink-0">
        {mimeIcon(attachment.mime_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(attachment.size)} · {attachment.mime_type}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-shrink-0 gap-1"
        aria-label={`Download ${attachment.filename}`}
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="w-3.5 h-3.5" aria-hidden />
        )}
        <span className="hidden sm:inline">Download</span>
      </Button>
    </div>
  );
});

export const AttachmentList = memo(function AttachmentList({
  emailId,
  attachments,
}: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <section aria-label="Email attachments" className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="w-4 h-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">
          {attachments.length} Attachment{attachments.length !== 1 ? "s" : ""}
        </h3>
      </div>
      <div className="space-y-2">
        {attachments.map((att) => (
          <AttachmentRow key={att.attachment_id} emailId={emailId} attachment={att} />
        ))}
      </div>
    </section>
  );
});
