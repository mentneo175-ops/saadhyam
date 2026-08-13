import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as PluginAPI from "@/lib/pluginsApi";

type ProviderType = "gmail" | "outlook" | "yahoo" | "custom";
type WizardStep = 1 | 2 | 3 | 4 | 5;

export const Route = createFileRoute("/dashboard/plugins/email-marketing/")({
  head: () => ({
    meta: [{ title: "Email Marketing & AI Assistant — Saadhyam AI" }],
  }),
  component: EmailMarketingPage,
});

function EmailMarketingPage() {
  const [details, setDetails] = useState<PluginAPI.EmailMarketingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [provider, setProvider] = useState<ProviderType>("gmail");
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Form states - SMTP Configuration
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [passwordOrApiKey, setPasswordOrApiKey] = useState("");

  // Form states - Email Composer
  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // AI Assistance States
  const [showSubjectAiPrompt, setShowSubjectAiPrompt] = useState(false);
  const [subjectAiPrompt, setSubjectAiPrompt] = useState("");
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);

  const [showBodyAiPrompt, setShowBodyAiPrompt] = useState(false);
  const [bodyAiPrompt, setBodyAiPrompt] = useState("");
  const [isGeneratingBody, setIsGeneratingBody] = useState(false);

  const [showFullAiPrompt, setShowFullAiPrompt] = useState(false);
  const [fullAiPrompt, setFullAiPrompt] = useState("");
  const [isGeneratingFullEmail, setIsGeneratingFullEmail] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadDetails();
  }, []);

  const loadDetails = async (options?: { preserveWizard?: boolean }) => {
    setIsLoading(true);
    try {
      const data = await PluginAPI.getEmailMarketingDetails();
      setDetails(data);

      const installedPlugins = await PluginAPI.getInstalledPluginsDetailed();
      const match = installedPlugins.find((up) => up.plugin_key === "sales_email_marketing");
      const hasExistingConfig = Boolean(
        match?.user_config &&
          Object.values(match.user_config as Record<string, unknown>).some(
            (value) => value !== null && value !== "" && value !== undefined
          )
      );
      const configured = Boolean(data.configured || hasExistingConfig);

      if (match && match.user_config) {
        const config = match.user_config as Record<string, any>;
        setSmtpHost(config.smtp_host || "");
        setSmtpPort(config.smtp_port !== undefined ? String(config.smtp_port) : "");
        setSenderEmail(config.sender_email || "");
        setSenderName(config.sender_name || "");
        setPasswordOrApiKey(config.password_or_api_key || "");
      } else {
        setSmtpHost("");
        setSmtpPort("");
        setSenderEmail("");
        setSenderName("");
        setPasswordOrApiKey("");
      }

      if (!configured && !options?.preserveWizard) {
        setProvider("gmail");
        setSmtpHost("smtp.gmail.com");
        setSmtpPort("587");
        setSenderEmail("");
        setSenderName("");
        setPasswordOrApiKey("");
        setWizardStep(1);
        setConnectionSuccess(false);
      }

      setShowWizard(!configured && !options?.preserveWizard);
      setShowSettings(!configured);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load plugin details");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!smtpHost.trim()) newErrors.smtpHost = "SMTP Host is required";

    const portNum = Number(smtpPort.toString().trim());
    if (!smtpPort.toString().trim()) {
      newErrors.smtpPort = "SMTP Port is required";
    } else if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      newErrors.smtpPort = "SMTP Port must be a valid number between 1 and 65535";
    }

    if (!senderEmail.trim()) {
      newErrors.senderEmail = "Sender Email is required";
    } else if (!/\S+@\S+\.\S+/.test(senderEmail)) {
      newErrors.senderEmail = "Sender Email must be a valid email format";
    }
    if (!passwordOrApiKey) newErrors.passwordOrApiKey = "Password or API Key is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWizardForm = () => {
    const newErrors: Record<string, string> = {};

    if (!smtpHost.trim()) {
      newErrors.smtpHost = "SMTP Host is required";
    }

    const portNum = Number(smtpPort.toString().trim());
    if (!smtpPort.toString().trim()) {
      newErrors.smtpPort = "SMTP Port is required";
    } else if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      newErrors.smtpPort = "SMTP Port must be a valid number between 1 and 65535";
    }

    if (!senderEmail.trim()) {
      newErrors.senderEmail = "Sender Email is required";
    } else if (!/\S+@\S+\.\S+/.test(senderEmail)) {
      newErrors.senderEmail = "Sender Email must be a valid email format";
    }
    if (!passwordOrApiKey) newErrors.passwordOrApiKey = "Password or API Key is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyProviderDefaults = (nextProvider: ProviderType) => {
    setProvider(nextProvider);

    if (nextProvider === "gmail") {
      setSmtpHost("smtp.gmail.com");
      setSmtpPort("587");
    } else if (nextProvider === "outlook") {
      setSmtpHost("smtp.office365.com");
      setSmtpPort("587");
    } else if (nextProvider === "yahoo") {
      setSmtpHost("smtp.mail.yahoo.com");
      setSmtpPort("587");
    } else {
      setSmtpHost("");
      setSmtpPort("");
    }
  };

  const getPayload = () => ({
    smtp_host: smtpHost.trim(),
    smtp_port: parseInt(smtpPort.toString().trim(), 10),
    sender_email: senderEmail.trim(),
    sender_name: senderName.trim() || null,
    password_or_api_key: passwordOrApiKey,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await PluginAPI.saveEmailMarketingConfig(getPayload());
      if (res.success) {
        toast.success("SMTP Configuration saved successfully!");
        await loadDetails();
        setShowSettings(false);
      } else {
        toast.error(res.message || "Failed to save configuration");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error("Please fill in and save all required fields to test connection.");
      return;
    }

    setIsTesting(true);
    try {
      toast.info("Testing SMTP connection... (this may take a few seconds)");
      const res = await PluginAPI.testEmailMarketingConnection();
      if (res.success) {
        toast.success(res.message || "Connection successful!");
      } else {
        toast.error(res.message || "SMTP connection failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "SMTP test connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleWizardContinue = () => {
    if (!validateWizardForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setWizardStep(4);
  };

  const handleWizardTestConnection = async () => {
    if (!validateWizardForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsTesting(true);
    try {
      toast.info("Testing SMTP connection... (this may take a few seconds)");
      const res = await PluginAPI.saveEmailMarketingConfig(getPayload());
      if (res.success) {
        await loadDetails({ preserveWizard: true });
        setConnectionSuccess(true);
        toast.success(res.message || "Connection successful!");
      } else {
        toast.error(res.message || "Failed to save configuration");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "SMTP test connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleWizardComplete = async () => {
    if (!connectionSuccess) {
      toast.info("Please test your connection first.");
      return;
    }

    setShowWizard(false);
    setShowSettings(false);
    await loadDetails();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AI Generation Handlers (Reusing backend execute & AI assistant services)
  // ─────────────────────────────────────────────────────────────────────────

  const handleGenerateSubjectAi = async () => {
    if (!subjectAiPrompt.trim()) {
      toast.error("Please enter a short description for the subject line.");
      return;
    }
    setAiError(null);
    setIsGeneratingSubject(true);
    try {
      const res = await PluginAPI.generateEmailMarketingAI({
        mode: "subject",
        prompt: subjectAiPrompt.trim(),
        recipient: toEmail.trim() || "Recipient",
      });

      if (res.success && res.subject) {
        setSubject(res.subject);
        setShowSubjectAiPrompt(false);
        setSubjectAiPrompt("");
        toast.success("Subject line generated by AI!");
      } else {
        setAiError(res.message || "Failed to generate subject line.");
        toast.error("AI Subject generation failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate subject line";
      setAiError(`Subject Generation Error: ${msg}`);
      toast.error("AI Subject generation failed.");
    } finally {
      setIsGeneratingSubject(false);
    }
  };

  const handleGenerateBodyAi = async () => {
    if (!bodyAiPrompt.trim()) {
      toast.error("Please enter a short description of what the email should say.");
      return;
    }
    setAiError(null);
    setIsGeneratingBody(true);
    try {
      const res = await PluginAPI.generateEmailMarketingAI({
        mode: "body",
        prompt: bodyAiPrompt.trim(),
        recipient: toEmail.trim() || "Valued Client",
        existing_subject: subject.trim(),
      });

      if (res.success && res.body) {
        setBody(res.body);
        setShowBodyAiPrompt(false);
        setBodyAiPrompt("");
        toast.success("Email body generated by AI!");
      } else {
        setAiError(res.message || "Failed to generate email body.");
        toast.error("AI Body generation failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate email body";
      setAiError(`Body Generation Error: ${msg}`);
      toast.error("AI Body generation failed.");
    } finally {
      setIsGeneratingBody(false);
    }
  };

  const handleGenerateFullEmailAi = async () => {
    if (!fullAiPrompt.trim()) {
      toast.error("Please describe your email context or objective.");
      return;
    }
    setAiError(null);
    setIsGeneratingFullEmail(true);
    try {
      const res = await PluginAPI.generateEmailMarketingAI({
        mode: "full",
        prompt: fullAiPrompt.trim(),
        recipient: toEmail.trim() || "Recipient",
      });

      if (res.success) {
        if (res.subject) setSubject(res.subject);
        if (res.body) setBody(res.body);
        setShowFullAiPrompt(false);
        setFullAiPrompt("");
        toast.success("Entire email generated by AI!");
      } else {
        setAiError(res.message || "Failed to generate full email.");
        toast.error("AI Email generation failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate full email";
      setAiError(`Full Generation Error: ${msg}`);
      toast.error("AI Email generation failed.");
    } finally {
      setIsGeneratingFullEmail(false);
    }
  };


  // ─────────────────────────────────────────────────────────────────────────
  // Handle Sending Email (Calls existing backend POST /api/plugins/execute)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    if (!toEmail.trim()) {
      setSendErrorMessage("Recipient email (To) is required.");
      toast.error("Recipient email is required.");
      return;
    }
    if (!subject.trim()) {
      setSendErrorMessage("Subject line is required.");
      toast.error("Subject line is required.");
      return;
    }
    if (!body.trim()) {
      setSendErrorMessage("Message body is required.");
      toast.error("Message body is required.");
      return;
    }

    const recipientList = toEmail
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    setIsSendingEmail(true);
    try {
      const res = await PluginAPI.executePluginAction<{ success: boolean; emails_sent?: number; failed?: number }>(
        "sales_email_marketing",
        "send_campaign",
        {
          subject: subject.trim(),
          body: body.trim(),
          recipients: recipientList,
          is_html: true,
        }
      );

      if (res.success && res.result?.success) {
        const msg = `Email sent successfully to ${recipientList.join(", ")}!`;
        setSendSuccessMessage(msg);
        toast.success(msg);
        setToEmail("");
        setCcEmail("");
        setSubject("");
        setBody("");
      } else {
        const errorMsg =
          res.error ||
          (res.result as any)?.error ||
          "Failed to send email. Please verify your SMTP settings.";
        setSendErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send email";
      setSendErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">
          Loading Email Marketing configuration...
        </p>
      </div>
    );
  }

  const isConfigured = Boolean(details?.configured || (smtpHost && senderEmail));

  return (
    <div className="container max-w-6xl space-y-8 py-8 px-4 md:px-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/plugins"
            className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {details?.name || "Email Marketing"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Send custom emails manually or with AI generation assistance via your SMTP account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
              <ShieldCheck className="h-4 w-4" /> Configured ✅
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-500">
              <ShieldAlert className="h-4 w-4" /> Not Configured
            </span>
          )}

          {/* Toggle Configure/Settings View */}
          {isConfigured && (
            <Button
              variant={showSettings ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              {showSettings ? (
                <>
                  <Mail className="h-4 w-4" /> Email Composer
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" /> Configure Settings
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Introduction & Welcome Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-purple-500/5 via-primary/5 to-pink-500/5 dark:from-purple-950/20 dark:via-primary/10 dark:to-pink-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Welcome to Email Marketing
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                  Compose custom emails manually or let AI draft your subject lines and email bodies. Review and edit any AI content before clicking Send.
                </p>
              </div>
            </div>

            {!isConfigured && !showWizard && (
              <Button onClick={() => setShowWizard(true)} className="gap-2 shrink-0">
                <Settings className="h-4 w-4" /> Start Setup Wizard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-6">
          {/* STEP WIZARD (First Time Setup) */}
          {showWizard ? (
            <Card className="overflow-hidden border-border/70 shadow-lg shadow-primary/5">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-background">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {wizardStep === 1
                        ? "Welcome to Email Marketing"
                        : wizardStep === 2
                          ? "Choose your email provider"
                          : wizardStep === 3
                            ? "Add your SMTP details"
                            : wizardStep === 4
                              ? "Test your connection"
                              : "Setup complete"}
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-2xl">
                      {wizardStep === 1
                        ? "Let’s connect your email account so I can send emails for you."
                        : wizardStep === 2
                          ? "Pick the provider that matches your mail setup."
                          : wizardStep === 3
                            ? "We’ll prefill common settings for major providers to speed up setup."
                            : wizardStep === 4
                              ? "Run a quick connection test before you start sending campaigns."
                              : "Your email marketing setup is ready to use."}
                    </CardDescription>
                  </div>
                  <div className="rounded-full border border-primary/20 bg-background px-3 py-1 text-sm font-semibold text-primary">
                    Step {wizardStep} / 5
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6 md:p-8">
                {wizardStep === 1 && (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold">Welcome to Email Marketing</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                      Connect your mailbox in a few steps and start sending custom emails directly from your dashboard.
                    </p>
                    <Button className="mt-6 gap-2" onClick={() => setWizardStep(2)}>
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          value: "gmail",
                          label: "Gmail",
                          description: "Fast setup with Gmail app passwords",
                        },
                        {
                          value: "outlook",
                          label: "Outlook",
                          description: "Microsoft 365 and Outlook mail",
                        },
                        { value: "yahoo", label: "Yahoo", description: "Yahoo Mail SMTP support" },
                        {
                          value: "custom",
                          label: "Custom SMTP",
                          description: "Use your own mail server",
                        },
                      ].map((option) => {
                        const isActive = provider === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => applyProviderDefaults(option.value as ProviderType)}
                            className={`rounded-xl border p-4 text-left transition-all ${
                              isActive
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{option.label}</span>
                              {isActive && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end">
                      <Button className="gap-2" onClick={() => setWizardStep(3)}>
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleWizardContinue();
                    }}
                    className="space-y-5"
                  >
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                      {provider === "gmail" &&
                        "Gmail settings are prefilled for you. You only need to add your sender details and app password."}
                      {provider === "outlook" &&
                        "Outlook settings are prefilled for you. Add your sender details and password to continue."}
                      {provider === "yahoo" &&
                        "Yahoo settings are prefilled for you. Add your sender details and app password to continue."}
                      {provider === "custom" &&
                        "Enter your SMTP host and port manually, then finish the remaining account details."}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                      <div className="space-y-1.5">
                        <Label htmlFor="wizardSmtpHost" className="text-sm font-semibold">
                          {provider === "custom" ? "SMTP Host *" : "SMTP Host"}
                        </Label>
                        <Input
                          id="wizardSmtpHost"
                          placeholder="e.g. smtp.gmail.com"
                          value={smtpHost}
                          onChange={(e) => {
                            setSmtpHost(e.target.value);
                            if (errors.smtpHost) setErrors((prev) => ({ ...prev, smtpHost: "" }));
                          }}
                          className={
                            errors.smtpHost ? "border-destructive focus-visible:ring-destructive" : ""
                          }
                        />
                        {errors.smtpHost && (
                          <p className="text-xs font-medium text-destructive">{errors.smtpHost}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="wizardSmtpPort" className="text-sm font-semibold">
                          {provider === "custom" ? "Port *" : "Port"}
                        </Label>
                        <Input
                          id="wizardSmtpPort"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={65535}
                          placeholder="587"
                          value={smtpPort}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setSmtpPort(raw);
                            if (errors.smtpPort) setErrors((prev) => ({ ...prev, smtpPort: "" }));
                          }}
                          className={
                            errors.smtpPort ? "border-destructive focus-visible:ring-destructive" : ""
                          }
                        />
                        {errors.smtpPort && (
                          <p className="text-xs font-medium text-destructive">{errors.smtpPort}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wizardSenderEmail" className="text-sm font-semibold">
                        Sender Email *
                      </Label>
                      <Input
                        id="wizardSenderEmail"
                        type="email"
                        placeholder="your-name@domain.com"
                        value={senderEmail}
                        onChange={(e) => {
                          setSenderEmail(e.target.value);
                          if (errors.senderEmail)
                            setErrors((prev) => ({ ...prev, senderEmail: "" }));
                        }}
                        className={
                          errors.senderEmail ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                      />
                      {errors.senderEmail && (
                        <p className="text-xs font-medium text-destructive">{errors.senderEmail}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wizardPassword" className="text-sm font-semibold">
                        {provider === "gmail" ? "Gmail App Password *" : "Password or API Key *"}
                      </Label>
                      <Input
                        id="wizardPassword"
                        type="password"
                        placeholder="••••••••••••••••"
                        value={passwordOrApiKey}
                        onChange={(e) => {
                          setPasswordOrApiKey(e.target.value);
                          if (errors.passwordOrApiKey)
                            setErrors((prev) => ({ ...prev, passwordOrApiKey: "" }));
                        }}
                        className={
                          errors.passwordOrApiKey
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                      />
                      {errors.passwordOrApiKey && (
                        <p className="text-xs font-medium text-destructive">
                          {errors.passwordOrApiKey}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wizardSenderName" className="text-sm font-semibold">
                        Sender Name (Optional)
                      </Label>
                      <Input
                        id="wizardSenderName"
                        placeholder="e.g. Sales Team"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="gap-2">
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                      <p className="text-sm font-medium text-primary">
                        We’ll use the SMTP details you just entered for the connection check.
                      </p>
                    </div>

                    <Button
                      onClick={handleWizardTestConnection}
                      disabled={isTesting}
                      className="gap-2"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Testing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Test Connection
                        </>
                      )}
                    </Button>

                    {connectionSuccess && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" /> Connection Successful
                      </div>
                    )}

                    {connectionSuccess && (
                      <div className="flex justify-end">
                        <Button onClick={() => setWizardStep(5)} className="gap-2">
                          Continue <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 5 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold">Setup Complete</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                      Your email account is ready. You can now compose and send custom emails directly.
                    </p>
                    <Button className="mt-6 gap-2" onClick={handleWizardComplete}>
                      Start Composing Emails <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : showSettings || !isConfigured ? (
            /* CONFIGURATION SETTINGS VIEW */
            <Card className="shadow-md border-primary/20">
              <CardHeader className="bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      SMTP Account Settings
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Configure delivery credentials for your email server.
                    </CardDescription>
                  </div>
                  {isConfigured && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(false)}
                      className="text-xs"
                    >
                      Cancel & Return
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label htmlFor="smtpHost" className="text-sm font-semibold">
                        SMTP Host *
                      </Label>
                      <Input
                        id="smtpHost"
                        placeholder="e.g. smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className={
                          errors.smtpHost ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                      />
                      {errors.smtpHost && (
                        <p className="text-xs font-medium text-destructive">{errors.smtpHost}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="smtpPort" className="text-sm font-semibold">
                        Port *
                      </Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={65535}
                        placeholder="587"
                        value={smtpPort}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setSmtpPort(raw);
                          if (errors.smtpPort) setErrors((prev) => ({ ...prev, smtpPort: "" }));
                        }}
                        className={
                          errors.smtpPort ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                      />
                      {errors.smtpPort && (
                        <p className="text-xs font-medium text-destructive">{errors.smtpPort}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senderEmail" className="text-sm font-semibold">
                      Sender Email *
                    </Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      placeholder="your-name@domain.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className={
                        errors.senderEmail ? "border-destructive focus-visible:ring-destructive" : ""
                      }
                    />
                    {errors.senderEmail && (
                      <p className="text-xs font-medium text-destructive">{errors.senderEmail}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="passwordOrApiKey" className="text-sm font-semibold">
                      Password or API Key *
                    </Label>
                    <Input
                      id="passwordOrApiKey"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={passwordOrApiKey}
                      onChange={(e) => setPasswordOrApiKey(e.target.value)}
                      className={
                        errors.passwordOrApiKey
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {errors.passwordOrApiKey && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.passwordOrApiKey}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senderName" className="text-sm font-semibold">
                      Sender Name (Optional)
                    </Label>
                    <Input
                      id="senderName"
                      placeholder="e.g. Sales Team"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The display name recipients will see.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                    <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save Configuration
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="flex-1 gap-2"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Testing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* NORMAL EMAIL COMPOSER VIEW (WITH AI ASSISTANCE) */
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-purple-500/5 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Compose Email
                    </CardTitle>
                    <CardDescription>
                      Send custom emails via {senderEmail || "SMTP"}. Use AI assistance to draft subject or body.
                    </CardDescription>
                  </div>

                  {/* Generate Entire Email with AI Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullAiPrompt(!showFullAiPrompt)}
                    className="gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 font-semibold"
                  >
                    <Wand2 className="h-4 w-4 text-purple-500" />
                    ✨ Generate Entire Email
                  </Button>
                </div>

                {/* Generate Entire Email Panel */}
                {showFullAiPrompt && (
                  <div className="mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Describe your email objective:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowFullAiPrompt(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      placeholder="e.g. Quarterly review meeting request with customer for next Monday"
                      value={fullAiPrompt}
                      onChange={(e) => setFullAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void handleGenerateFullEmailAi()}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFullAiPrompt(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleGenerateFullEmailAi}
                        disabled={isGeneratingFullEmail}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                      >
                        {isGeneratingFullEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Generating Email...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" /> Generate Both
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Feedback Alerts */}
                {sendSuccessMessage && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div className="flex-1">{sendSuccessMessage}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSendSuccessMessage(null)}
                      className="h-6 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {sendErrorMessage && (
                  <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="flex-1">{sendErrorMessage}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSendErrorMessage(null)}
                      className="h-6 text-xs text-destructive hover:bg-destructive/20"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {aiError && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="flex-1">{aiError}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiError(null)}
                      className="h-6 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSendEmail} className="space-y-5">
                  {/* Recipient Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="toEmail" className="text-sm font-semibold flex items-center gap-1">
                      To (Recipient Email) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="toEmail"
                      type="text"
                      placeholder="e.g. client@example.com, john@company.com"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      disabled={isSendingEmail}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple recipient email addresses with commas.
                    </p>
                  </div>

                  {/* CC / BCC Field (Optional) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ccEmail" className="text-sm font-semibold">
                      CC / BCC (Optional)
                    </Label>
                    <Input
                      id="ccEmail"
                      type="text"
                      placeholder="e.g. manager@example.com"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      disabled={isSendingEmail}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Subject Line Field + AI Action */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-1">
                        Subject <span className="text-destructive">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSubjectAiPrompt(!showSubjectAiPrompt)}
                        className="h-7 text-xs gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        ✨ Generate with AI
                      </Button>
                    </div>

                    {showSubjectAiPrompt && (
                      <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-300">
                          <span>Subject prompt / idea:</span>
                          <button
                            type="button"
                            onClick={() => setShowSubjectAiPrompt(false)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Input
                          placeholder="e.g. Q3 performance update / 20% discount offer"
                          value={subjectAiPrompt}
                          onChange={(e) => setSubjectAiPrompt(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.key === "Enter" && void handleGenerateSubjectAi()}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleGenerateSubjectAi}
                            disabled={isGeneratingSubject}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                          >
                            {isGeneratingSubject ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" /> Generate Subject
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Input
                      id="subject"
                      type="text"
                      placeholder="e.g. Project Update & Deliverables / Welcome to Saadhyam"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={isSendingEmail || isGeneratingSubject}
                    />
                  </div>

                  {/* Body Textarea Field + AI Action */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="body" className="text-sm font-semibold flex items-center gap-1">
                        Message Body <span className="text-destructive">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBodyAiPrompt(!showBodyAiPrompt)}
                        className="h-7 text-xs gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        ✨ Generate with AI
                      </Button>
                    </div>

                    {showBodyAiPrompt && (
                      <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-300">
                          <span>Describe message body contents / key points:</span>
                          <button
                            type="button"
                            onClick={() => setShowBodyAiPrompt(false)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Input
                          placeholder="e.g. Follow up on yesterday's call regarding project timeline and confirm next meeting date"
                          value={bodyAiPrompt}
                          onChange={(e) => setBodyAiPrompt(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.key === "Enter" && void handleGenerateBodyAi()}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleGenerateBodyAi}
                            disabled={isGeneratingBody}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                          >
                            {isGeneratingBody ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" /> Generate Body
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <textarea
                      id="body"
                      rows={8}
                      placeholder="Write your email content here (supports plain text or HTML content)..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      disabled={isSendingEmail || isGeneratingBody}
                      className="w-full rounded-xl border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setToEmail("");
                        setCcEmail("");
                        setSubject("");
                        setBody("");
                        setSendSuccessMessage(null);
                        setSendErrorMessage(null);
                        setAiError(null);
                      }}
                      disabled={isSendingEmail}
                      className="text-xs text-muted-foreground"
                    >
                      Clear Fields
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSendingEmail}
                      className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-semibold px-6 shadow-md gap-2"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending Email...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Send Email
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Plugin Overview Sidebar */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/[0.02]">
              <CardTitle className="text-lg">Plugin Overview</CardTitle>
              <CardDescription>Details & configuration status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Active Sender
                </span>
                <p className="text-sm font-semibold text-primary">
                  {senderEmail ? `${senderName ? `${senderName} (${senderEmail})` : senderEmail}` : "Not Configured"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  SMTP Host & Port
                </span>
                <p className="text-sm font-medium">
                  {smtpHost ? `${smtpHost}:${smtpPort}` : "Not Configured"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Developer
                </span>
                <p className="text-sm font-medium">{details?.developer || "Saadhyam AI"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </span>
                <p className="text-sm font-medium">{details?.category || "Sales & CRM"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Features
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Send Any Email",
                    "AI Subject Generator",
                    "AI Body Generator",
                    "SMTP Delivery",
                    "HTML & Plain Text",
                    "AI Assistant Support",
                    "Connection Diagnostic",
                  ].map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/10"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
