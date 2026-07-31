/**
 * GmailConfigPage.tsx
 * Configuration form for Gmail API credentials.
 * Shows configured/not-configured status, test connection result.
 */

import React, { useState, useCallback, memo } from "react";
import {
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Wifi,
  Loader2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { usePluginConfig } from "@/hooks/usePluginConfig";
import { ConnectionBanner } from "@/components/plugins/mail/MailStates";
import * as gmailApi from "@/lib/gmailApi";
import type { GmailConfigPayload, ConnectionResult } from "@/lib/gmailApi";

// ─── Secret field ─────────────────────────────────────────────────────────────

const SecretInput = memo(function SecretInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-10"
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          tabIndex={0}
        >
          {visible
            ? <EyeOff className="w-4 h-4" aria-hidden />
            : <Eye className="w-4 h-4" aria-hidden />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
        configured
          ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
      }`}
      role="status"
      aria-label={configured ? "Gmail is configured" : "Gmail is not configured"}
    >
      {configured
        ? <CheckCircle2 className="w-4 h-4" aria-hidden />
        : <XCircle className="w-4 h-4" aria-hidden />}
      {configured ? "Configured" : "Not Configured"}
    </div>
  );
}

// ─── GmailConfigPage ──────────────────────────────────────────────────────────

export interface GmailConfigPageProps {
  onConfigured?: () => void;
  onBack?: () => void;
}

export const GmailConfigPage = memo(function GmailConfigPage({
  onConfigured,
  onBack,
}: GmailConfigPageProps) {
  const config = usePluginConfig();

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!clientId.trim()) errs.clientId = "Client ID is required";
    if (!clientSecret.trim()) errs.clientSecret = "Client Secret is required";
    if (!refreshToken.trim()) errs.refreshToken = "Refresh Token is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [clientId, clientSecret, refreshToken]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    const payload: GmailConfigPayload = {
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      refresh_token: refreshToken.trim(),
    };
    const toastId = "gmail-config-save";
    toast.loading("Saving configuration…", { id: toastId });
    const ok = await config.saveConfig(payload);
    if (ok) {
      toast.success("Gmail configuration saved!", { id: toastId });
      setClientId(""); setClientSecret(""); setRefreshToken("");
      onConfigured?.();
    } else {
      toast.error(config.error ?? "Failed to save configuration", { id: toastId });
    }
  }, [validate, clientId, clientSecret, refreshToken, config, onConfigured]);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setConnectionResult(null);
    const toastId = "gmail-test";
    toast.loading("Testing connection…", { id: toastId });
    try {
      const result = await gmailApi.testConnection();
      setConnectionResult(result);
      if (result.success) {
        toast.success(`Connected as ${result.email}`, { id: toastId });
      } else {
        toast.error(result.error ?? "Connection failed", { id: toastId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed", { id: toastId });
    } finally {
      setIsTesting(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    const toastId = "gmail-delete";
    toast.loading("Deleting configuration…", { id: toastId });
    const ok = await config.deleteConfig();
    if (ok) {
      toast.success("Configuration deleted", { id: toastId });
      setConnectionResult(null);
    } else {
      toast.error(config.error ?? "Failed to delete", { id: toastId });
    }
  }, [config]);

  const isConfigured = config.status === "configured";
  const isFormLoading = config.isLoading;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
              <ArrowLeft className="w-4 h-4" aria-hidden />
            </Button>
          )}
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20">
            <Mail className="w-6 h-6 text-red-500" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Gmail Configuration</h1>
            <p className="text-xs text-muted-foreground">Connect your Gmail account via OAuth credentials</p>
          </div>
        </div>
        {config.status !== "loading" && (
          <StatusBadge configured={isConfigured} />
        )}
      </div>

      {/* Connection result banner */}
      {connectionResult?.success && (
        <ConnectionBanner
          email={connectionResult.email}
          totalMessages={connectionResult.total_messages}
        />
      )}

      {/* Form */}
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        aria-label="Gmail credentials form"
        noValidate
      >
        <SecretInput
          id="gmail-client-id"
          label="Client ID"
          value={clientId}
          onChange={setClientId}
          placeholder="Your Google OAuth Client ID"
          required
          error={fieldErrors.clientId}
        />
        <SecretInput
          id="gmail-client-secret"
          label="Client Secret"
          value={clientSecret}
          onChange={setClientSecret}
          placeholder="Your Google OAuth Client Secret"
          required
          error={fieldErrors.clientSecret}
        />
        <SecretInput
          id="gmail-refresh-token"
          label="Refresh Token"
          value={refreshToken}
          onChange={setRefreshToken}
          placeholder="Your OAuth Refresh Token"
          required
          error={fieldErrors.refreshToken}
        />

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            disabled={isFormLoading}
            className="gap-2"
            aria-label={isConfigured ? "Update Gmail configuration" : "Save Gmail configuration"}
          >
            {isFormLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {isConfigured ? "Update" : "Save Configuration"}
          </Button>

          {isConfigured && (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleTest}
              disabled={isTesting}
              aria-label="Test Gmail connection"
            >
              {isTesting
                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                : <Wifi className="w-4 h-4" aria-hidden />}
              Test Connection
            </Button>
          )}

          {isConfigured && (
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete Gmail configuration"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
              Delete
            </Button>
          )}
        </div>
      </form>

      {/* Help text */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-sm">How to get credentials</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Go to Google Cloud Console → APIs &amp; Services → Credentials</li>
          <li>Create an OAuth 2.0 Client ID (Desktop app)</li>
          <li>Enable the Gmail API in your project</li>
          <li>Use the OAuth Playground to generate a refresh token</li>
        </ol>
      </div>

      {/* Delete confirmation */}
      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Gmail configuration?"
        description="This will remove your stored credentials. You will need to re-enter them to use Gmail again."
        confirmLabel="Delete Configuration"
        isLoading={isFormLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
});
