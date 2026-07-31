/**
 * gmailApi.ts
 * Gmail-specific API service.
 * All calls route through POST /api/plugins/execute via executePluginAction,
 * except config endpoints which use dedicated REST routes.
 */

import { env } from "@/config/env";

const API_BASE = env.apiBaseUrl;

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("saadhyam_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function execute<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/plugins/execute`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ plugin_key: "gmail", action, params }),
  });

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    throw new GmailApiError(429, data?.error ?? "Rate limit exceeded. Please wait a moment.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new GmailApiError(
      res.status,
      data?.detail ?? data?.error ?? `Request failed (${res.status})`
    );
  }

  const json = await res.json();
  if (!json.success) {
    throw new GmailApiError(400, json.error ?? "Plugin action failed");
  }
  return json.result as T;
}

// ─────────────────────────────────────────────
// Error class
// ─────────────────────────────────────────────

export class GmailApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "GmailApiError";
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface GmailConfig {
  configured: boolean;
  platform?: string;
}

export interface GmailConfigPayload {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export interface ConnectionResult {
  success: boolean;
  email?: string;
  total_messages?: number;
  error?: string;
}

export interface EmailSummary {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  is_unread?: boolean;
  is_starred?: boolean;
  has_attachments?: boolean;
  labels?: string[];
}

export interface EmailListResult {
  success: boolean;
  emails: EmailSummary[];
  next_page_token: string | null;
  has_more: boolean;
  retries?: number;
}

export interface EmailDetail {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  body_html?: string;
  snippet: string;
  attachments: AttachmentMeta[];
  labels?: string[];
}

export interface AttachmentMeta {
  attachment_id: string;
  filename: string;
  mime_type: string;
  size: number;
}

export interface AttachmentDownload {
  filename: string;
  mime_type: string;
  size: number;
  base64_content: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachments?: AttachmentInput[];
}

export interface AttachmentInput {
  filename: string;
  content_type: string;
  content_base64: string;
}

export interface SendResult {
  success: boolean;
  message_id: string;
  thread_id: string;
}

export interface BatchResult {
  success: boolean;
  success_count: number;
  failed_count: number;
  failures: Array<{ email_id: string; error: string }>;
  batch_size: number;
  retries: number;
}

export interface Draft {
  id: string;
  subject?: string;
  snippet?: string;
  to?: string;
}

export interface DraftListResult {
  drafts: Draft[];
  next_page_token: string | null;
  has_more?: boolean;
}

export interface Label {
  id: string;
  name: string;
  type?: string;
}

export interface LabelListResult {
  labels: Label[];
}

// ─────────────────────────────────────────────
// Configuration (direct REST, not execute)
// ─────────────────────────────────────────────

export async function getConfig(): Promise<GmailConfig> {
  const res = await fetch(`${API_BASE}/api/plugins/gmail/config`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return { configured: false };
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new GmailApiError(res.status, data?.detail ?? "Failed to load Gmail configuration");
  }
  const data = await res.json();
  return { configured: true, platform: data.platform ?? "gmail" };
}

export async function saveConfig(payload: GmailConfigPayload): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/plugins/gmail/config`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new GmailApiError(res.status, data?.detail ?? "Failed to save Gmail configuration");
  }
  return res.json();
}

export async function deleteConfig(): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/plugins/gmail/config`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new GmailApiError(res.status, data?.detail ?? "Failed to delete Gmail configuration");
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Connection
// ─────────────────────────────────────────────

export async function testConnection(): Promise<ConnectionResult> {
  return execute<ConnectionResult>("test_connection");
}

// ─────────────────────────────────────────────
// Mailbox
// ─────────────────────────────────────────────

export interface ListEmailsParams {
  max_results?: number;
  page_token?: string;
  label_ids?: string[];
}

export async function listEmails(params: ListEmailsParams = {}): Promise<EmailListResult> {
  return execute<EmailListResult>("list_emails", params as Record<string, unknown>);
}

export async function searchEmails(
  query: string,
  params: { max_results?: number; page_token?: string } = {}
): Promise<EmailListResult> {
  return execute<EmailListResult>("search_emails", { query, ...params });
}

export async function getEmail(emailId: string): Promise<EmailDetail> {
  return execute<EmailDetail>("get_email", { email_id: emailId });
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendResult> {
  return execute<SendResult>("send_email", payload as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────
// Single email actions
// ─────────────────────────────────────────────

export async function markAsRead(emailId: string) {
  return execute("mark_as_read", { email_id: emailId });
}

export async function markAsUnread(emailId: string) {
  return execute("mark_as_unread", { email_id: emailId });
}

export async function archiveEmail(emailId: string) {
  return execute("archive_email", { email_id: emailId });
}

export async function deleteEmail(emailId: string) {
  return execute("delete_email", { email_id: emailId });
}

export async function starEmail(emailId: string) {
  return execute("star_email", { email_id: emailId });
}

export async function unstarEmail(emailId: string) {
  return execute("unstar_email", { email_id: emailId });
}

// ─────────────────────────────────────────────
// Batch actions
// ─────────────────────────────────────────────

export async function batchMarkAsRead(emailIds: string[]): Promise<BatchResult> {
  return execute<BatchResult>("batch_mark_as_read", { email_ids: emailIds });
}

export async function batchMarkAsUnread(emailIds: string[]): Promise<BatchResult> {
  return execute<BatchResult>("batch_mark_as_unread", { email_ids: emailIds });
}

export async function batchArchive(emailIds: string[]): Promise<BatchResult> {
  return execute<BatchResult>("batch_archive", { email_ids: emailIds });
}

export async function batchDelete(emailIds: string[]): Promise<BatchResult> {
  return execute<BatchResult>("batch_delete", { email_ids: emailIds });
}

export async function batchStar(emailIds: string[]): Promise<BatchResult> {
  return execute<BatchResult>("batch_star", { email_ids: emailIds });
}

export async function batchUnstar(emailIds: string[]): Promise<BatchResult> {
  return execute<BatchResult>("batch_unstar", { email_ids: emailIds });
}

// ─────────────────────────────────────────────
// Drafts
// ─────────────────────────────────────────────

export async function listDrafts(params: { max_results?: number; page_token?: string } = {}): Promise<DraftListResult> {
  return execute<DraftListResult>("list_drafts", params);
}

export async function createDraft(payload: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}): Promise<{ draft_id: string; success: boolean }> {
  return execute("create_draft", payload);
}

export async function sendDraft(draftId: string): Promise<{ success: boolean; message_id: string }> {
  return execute("send_draft", { draft_id: draftId });
}

export async function deleteDraft(draftId: string): Promise<{ success: boolean }> {
  return execute("delete_draft", { draft_id: draftId });
}

// ─────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────

export async function listLabels(): Promise<LabelListResult> {
  return execute<LabelListResult>("list_labels");
}

export async function createLabel(name: string): Promise<{ label: Label; success: boolean }> {
  return execute("create_label", { name });
}

export async function deleteLabel(labelId: string): Promise<{ success: boolean }> {
  return execute("delete_label", { label_id: labelId });
}

export async function applyLabel(emailId: string, labelId: string): Promise<{ success: boolean }> {
  return execute("apply_label", { email_id: emailId, label_id: labelId });
}

export async function removeLabel(emailId: string, labelId: string): Promise<{ success: boolean }> {
  return execute("remove_label", { email_id: emailId, label_id: labelId });
}

// ─────────────────────────────────────────────
// Attachments
// ─────────────────────────────────────────────

export async function downloadAttachment(
  emailId: string,
  attachmentId: string
): Promise<AttachmentDownload> {
  return execute<AttachmentDownload>("download_attachment", {
    email_id: emailId,
    attachment_id: attachmentId,
  });
}
