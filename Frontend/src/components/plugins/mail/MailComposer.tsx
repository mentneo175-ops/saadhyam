/**
 * MailComposer.tsx
 * Compose/Send email form with validation, CC/BCC, multi-attachment (base64), and loading state.
 */

import React, { useState, useCallback, useRef, memo } from "react";
import { Send, Paperclip, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { SendEmailPayload, AttachmentInput } from "@/lib/gmailApi";

// ─── Validation ──────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Recipient email is required";
  const addrs = email.split(",").map((e) => e.trim());
  for (const addr of addrs) {
    if (!EMAIL_REGEX.test(addr)) return `Invalid email address: ${addr}`;
  }
  return null;
}

// Max attachment size: 10 MB
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;

// ─── FileChip ────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

interface FileChipProps {
  name: string;
  size: number;
  onRemove: () => void;
}

const FileChip = memo(function FileChip({ name, size, onRemove }: FileChipProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-xs border border-border">
      <Paperclip className="w-3 h-3 text-muted-foreground" aria-hidden />
      <span className="max-w-[120px] truncate">{name}</span>
      <span className="text-muted-foreground">({formatSize(size)})</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
        aria-label={`Remove attachment ${name}`}
      >
        <X className="w-3 h-3" aria-hidden />
      </button>
    </div>
  );
});

// ─── MailComposer ────────────────────────────────────────────────────────────

export interface MailComposerProps {
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSend: (payload: SendEmailPayload) => Promise<void>;
  onCancel?: () => void;
}

export const MailComposer = memo(function MailComposer({
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onSend,
  onCancel,
}: MailComposerProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [attachmentSizes, setAttachmentSizes] = useState<number[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > MAX_ATTACH_BYTES) {
        toast.error(`${file.name} exceeds the 10 MB attachment limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1] ?? "";
        setAttachments((prev) => [
          ...prev,
          { filename: file.name, content_type: file.type, content_base64: base64 },
        ]);
        setAttachmentSizes((prev) => [...prev, file.size]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    setAttachmentSizes((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const toErr = validateEmail(to);
    if (toErr) errs.to = toErr;
    if (!body.trim()) errs.body = "Email body cannot be empty";
    if (!subject.trim()) {
      // soft warning — don't block send
      toast.warning("Sending without a subject. Continue?");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [to, body, subject]);

  const handleSend = useCallback(async () => {
    if (!validate()) return;
    setIsSending(true);
    try {
      await onSend({
        to,
        subject,
        body,
        cc: cc || undefined,
        bcc: bcc || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      // Reset form on success
      setTo(initialTo);
      setCc("");
      setBcc("");
      setSubject(initialSubject);
      setBody(initialBody);
      setAttachments([]);
      setAttachmentSizes([]);
      setErrors({});
    } finally {
      setIsSending(false);
    }
  }, [validate, onSend, to, subject, body, cc, bcc, attachments, initialTo, initialSubject, initialBody]);

  return (
    <form
      className="flex flex-col gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSend();
      }}
      aria-label="Compose email"
      noValidate
    >
      {/* To */}
      <div className="space-y-1">
        <Label htmlFor="compose-to">To *</Label>
        <div className="flex gap-2">
          <Input
            id="compose-to"
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={!!errors.to}
            aria-describedby={errors.to ? "compose-to-error" : undefined}
            required
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCcBcc((v) => !v)}
            aria-expanded={showCcBcc}
            className="text-xs text-muted-foreground"
          >
            CC / BCC
          </Button>
        </div>
        {errors.to && (
          <p id="compose-to-error" className="text-xs text-destructive" role="alert">
            {errors.to}
          </p>
        )}
      </div>

      {/* CC / BCC (collapsible) */}
      {showCcBcc && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <Label htmlFor="compose-cc">CC</Label>
            <Input
              id="compose-cc"
              type="email"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="compose-bcc">BCC</Label>
            <Input
              id="compose-bcc"
              type="email"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="space-y-1">
        <Label htmlFor="compose-subject">Subject</Label>
        <Input
          id="compose-subject"
          placeholder="Email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="space-y-1">
        <Label htmlFor="compose-body">Message *</Label>
        <Textarea
          id="compose-body"
          placeholder="Write your message here…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="resize-none"
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? "compose-body-error" : undefined}
          required
        />
        {errors.body && (
          <p id="compose-body-error" className="text-xs text-destructive" role="alert">
            {errors.body}
          </p>
        )}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <FileChip
              key={i}
              name={att.filename}
              size={attachmentSizes[i] ?? 0}
              onRemove={() => removeAttachment(i)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button
          type="submit"
          disabled={isSending}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Send className="w-4 h-4" aria-hidden />
          )}
          {isSending ? "Sending…" : "Send Email"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach files"
        >
          <Plus className="w-4 h-4" aria-hidden />
          Attach
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          aria-hidden="true"
          onChange={(e) => addFiles(e.target.files)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
        />

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Cancel compose"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
});
