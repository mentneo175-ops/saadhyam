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
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
    meta: [{ title: "Email Marketing Configuration — Saadhyam AI" }],
  }),
  component: EmailMarketingPage,
});

function EmailMarketingPage() {
  const [details, setDetails] = useState<PluginAPI.EmailMarketingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [provider, setProvider] = useState<ProviderType>("gmail");
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Form states
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [passwordOrApiKey, setPasswordOrApiKey] = useState("");

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
          (value) => value !== null && value !== "" && value !== undefined,
        ),
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
    await loadDetails();
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

  return (
    <div className="container max-w-6xl space-y-8 py-8 px-4 md:px-8">
      <div className="flex items-center justify-between gap-4 border-b pb-5">
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
              Configure SMTP settings to activate campaign delivery.
            </p>
          </div>
        </div>

        <div>
          {details?.configured || !showWizard ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
              <ShieldCheck className="h-4 w-4" /> Configured ✅
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-500">
              <ShieldAlert className="h-4 w-4" /> Not Configured
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-6">
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
                      Connect your mailbox in a few steps and start sending polished campaigns from
                      your dashboard.
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
                            errors.smtpHost
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
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
                            errors.smtpPort
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
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
                          errors.senderEmail
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
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
                      Your email account is ready. You can now start using email marketing from your
                      dashboard.
                    </p>
                    <Button className="mt-6 gap-2" onClick={handleWizardComplete}>
                      Start Using Email Marketing <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>SMTP Settings</CardTitle>
                <CardDescription>
                  Provide credentials for your mail delivery server.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                        errors.senderEmail
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
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
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/[0.02]">
              <CardTitle className="text-lg">Plugin Overview</CardTitle>
              <CardDescription>Details and setup guidance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Developer
                </span>
                <p className="text-sm font-medium">{details?.developer}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </span>
                <p className="text-sm font-medium">{details?.category}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Version
                </span>
                <p className="text-sm font-medium">v{details?.version}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Required Permissions
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {details?.permissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="inline-flex rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Features
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {details?.features.map((feat, idx) => (
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
