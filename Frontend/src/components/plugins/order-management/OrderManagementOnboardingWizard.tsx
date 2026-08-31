import { useState } from "react";
import {
  Package,
  Store,
  Mail,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Server,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface OrderManagementOnboardingWizardProps {
  initialConfig?: any;
  onComplete: (savedConfig: any) => void;
}

const PROVIDER_PRESETS: Record<string, { host: string; port: number }> = {
  gmail: { host: "smtp.gmail.com", port: 587 },
  outlook: { host: "smtp.office365.com", port: 587 },
  zoho: { host: "smtp.zoho.com", port: 587 },
  custom: { host: "", port: 587 },
};

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham (AED)" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar (CAD)" },
  { code: "AUD", symbol: "$", name: "Australian Dollar (AUD)" },
];

const TRANSACTIONAL_EVENTS = [
  { id: "confirmation", title: "Order Confirmed", desc: "Sent instantly when payment succeeds or order is confirmed." },
  { id: "processing", title: "Order Processing", desc: "Sent when warehouse begins preparing items." },
  { id: "shipment", title: "Order Shipped", desc: "Includes carrier tracking number and delivery estimate." },
  { id: "delivery", title: "Order Delivered", desc: "Sent upon final package handover." },
  { id: "completed", title: "Order Completed", desc: "Final customer receipt & completion notice." },
  { id: "cancellation", title: "Order Cancelled", desc: "Sent when order is cancelled and inventory is restocked." },
  { id: "payment_failure", title: "Payment Failed", desc: "Alerts customer if checkout transaction fails." },
];

export function OrderManagementOnboardingWizard({
  initialConfig,
  onComplete,
}: OrderManagementOnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Store Setup
  const [storeName, setStoreName] = useState(initialConfig?.business_name || initialConfig?.store_name || "");
  const [currency, setCurrency] = useState(initialConfig?.currency || "INR");
  const [contactEmail, setContactEmail] = useState(initialConfig?.contact_email || "");

  // Step 2: Email Setup
  const [emailEnabled, setEmailEnabled] = useState(initialConfig?.email_notifications_enabled ?? true);
  const [provider, setProvider] = useState(initialConfig?.provider || "gmail");
  const [smtpHost, setSmtpHost] = useState(initialConfig?.smtp_host || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(initialConfig?.smtp_port || 587);
  const [smtpUser, setSmtpUser] = useState(initialConfig?.smtp_user || initialConfig?.smtp_username || "");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromEmail, setFromEmail] = useState(initialConfig?.from_email || initialConfig?.sender_email || "");
  const [skipSmtpForDev, setSkipSmtpForDev] = useState(false);

  // Handle Provider Change
  const handleProviderChange = (newProv: string) => {
    setProvider(newProv);
    const preset = PROVIDER_PRESETS[newProv];
    if (preset) {
      setSmtpHost(preset.host);
      setSmtpPort(preset.port);
    }
    setTestResult(null);
  };

  // Auto sync username to fromEmail
  const handleUsernameChange = (val: string) => {
    setSmtpUser(val);
    if (!fromEmail || fromEmail === smtpUser) {
      setFromEmail(val);
    }
  };

  // Test SMTP Connection
  const handleTestSmtp = async () => {
    if (!smtpUser.trim()) {
      toast.error("Please enter your SMTP Username / Email.");
      return;
    }
    if (!smtpPassword.trim() && !initialConfig?.is_password_configured) {
      toast.error("Please enter your SMTP / App Password.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const resp = await apiClient.post<any>("/api/orders/config/test-smtp", {
        provider,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser.trim(),
        smtp_password: smtpPassword.trim() || undefined,
        from_email: fromEmail.trim() || smtpUser.trim(),
      });

      if (resp?.success) {
        setTestResult({ success: true, message: resp.message || "SMTP connection & authentication successful!" });
        toast.success("SMTP Connection Verified!");
      } else {
        setTestResult({ success: false, message: resp?.message || "Authentication Failed. Please verify your credentials." });
        toast.error("SMTP Test Failed", { description: resp?.message });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "Failed to reach SMTP server." });
      toast.error("SMTP Test Error", { description: err?.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    if (!storeName.trim()) {
      toast.error("Store Display Name is required.");
      return;
    }
    setStep(2);
  };

  // Step 2 Next
  const handleNextFromStep2 = () => {
    if (skipSmtpForDev) {
      setStep(3);
      return;
    }

    if (emailEnabled && (!smtpUser.trim() || (!smtpPassword.trim() && !initialConfig?.is_password_configured))) {
      toast.error("Please provide SMTP credentials or click 'Continue in Test Mode' below.");
      return;
    }

    setStep(3);
  };

  // Final Complete & Save
  const handleFinalizeSetup = async () => {
    setIsSaving(true);
    try {
      const payload = {
        setup_completed: true,
        business_name: storeName.trim(),
        store_name: storeName.trim(),
        currency,
        contact_email: contactEmail.trim() || undefined,
        email_notifications_enabled: emailEnabled && !skipSmtpForDev,
        provider,
        smtp_host: smtpHost.trim(),
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser.trim() || undefined,
        smtp_password: smtpPassword.trim() || undefined,
        from_email: (fromEmail.trim() || smtpUser.trim()) || undefined,
      };

      const result = await apiClient.post<any>("/api/orders/config", payload);
      toast.success("Order Management setup completed!");
      onComplete(result);
    } catch (err: any) {
      console.error("Failed to save Order Management setup:", err);
      toast.error("Failed to complete setup", { description: err?.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-3 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Plugin Quick Setup
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Set up your Order Management
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          Configure your store profile and automated transactional notifications in less than 2 minutes.
        </p>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
          {[
            { num: 1, label: "Store Setup", icon: Store },
            { num: 2, label: "Email & SMTP", icon: Mail },
            { num: 3, label: "Templates", icon: FileCheck },
            { num: 4, label: "Ready", icon: CheckCircle2 },
          ].map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : isDone
                      ? "bg-muted text-foreground border-border"
                      : "text-muted-foreground border-border/40 opacity-60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < 3 && <div className="w-4 h-[1px] bg-border hidden sm:block" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Card */}
      <Card className="border-border/60 shadow-lg bg-card/90 backdrop-blur-sm">
        {/* STEP 1: STORE SETUP */}
        {step === 1 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Step 1 — Store & Business Profile</CardTitle>
                  <CardDescription>
                    Enter your store's display identity for order receipts and customer communications.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="store-name" className="text-sm font-semibold">
                  Store / Business Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-name"
                  placeholder="e.g. Acme Apparel, Saadhyam Boutique"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  This name will appear on order invoices, email subjects, and receipts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-currency" className="text-sm font-semibold">
                    Default Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="store-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used for product pricing and order calculations.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-sm font-semibold">
                    Store Contact Email (Optional)
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="support@yourstore.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">For customer inquiries & replies.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  No global business plans or PDF analyses required. Order Management operates completely standalone.
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border/40 pt-4">
              <Button onClick={handleNextFromStep1} className="gap-2">
                Continue to Email Setup
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* STEP 2: EMAIL CONFIGURATION */}
        {step === 2 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Step 2 — Real SMTP Customer Notifications</CardTitle>
                  <CardDescription>
                    Configure real email delivery for order confirmations, shipments, and cancellations.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Email Service Provider</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "gmail", name: "Gmail (Recommended)", desc: "smtp.gmail.com" },
                    { id: "outlook", name: "Outlook / 365", desc: "office365.com" },
                    { id: "zoho", name: "Zoho Mail", desc: "smtp.zoho.com" },
                    { id: "custom", name: "Custom SMTP", desc: "Custom host" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        provider === p.id
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary shadow-sm"
                          : "border-border hover:border-border/80 bg-background text-muted-foreground"
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground">{p.name}</div>
                      <div className="text-[11px] opacity-75">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Host and Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="smtp-host" className="text-xs font-medium">
                    SMTP Host
                  </Label>
                  <Input
                    id="smtp-host"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    disabled={provider !== "custom"}
                    className={provider !== "custom" ? "bg-muted cursor-not-allowed font-mono text-xs" : "font-mono text-xs"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-port" className="text-xs font-medium">
                    Port
                  </Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    disabled={provider !== "custom"}
                    className={provider !== "custom" ? "bg-muted cursor-not-allowed font-mono text-xs" : "font-mono text-xs"}
                  />
                </div>
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-user" className="text-xs font-medium">
                    SMTP Username / Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="smtp-user"
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={smtpUser}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="smtp-pass" className="text-xs font-medium">
                    {provider === "gmail" ? "16-Digit App Password" : "SMTP Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="smtp-pass"
                      type={showPassword ? "text" : "password"}
                      placeholder={initialConfig?.is_password_configured ? "•••••••••••••••• (Configured)" : "Enter app password"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sender Email */}
              <div className="space-y-1.5">
                <Label htmlFor="from-email" className="text-xs font-medium">
                  Sender "From" Email
                </Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="your-email@gmail.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>

              {/* Gmail Guide Help */}
              {provider === "gmail" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    How to generate a Gmail App Password:
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[11px] opacity-90">
                    <li>Go to Google Account → Security → 2-Step Verification.</li>
                    <li>Scroll down to <strong>App Passwords</strong>.</li>
                    <li>Generate an App Password for <em>"Order Management"</em>.</li>
                    <li>Paste the 16-character code into the field above.</li>
                  </ol>
                </div>
              )}

              {/* Test Connection Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestSmtp}
                  disabled={isTesting}
                  className="gap-2"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Test Connection
                </Button>

                {testResult && (
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                      testResult.success
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Skip in Dev Mode Option */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Don't have SMTP credentials right now?
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSkipSmtpForDev(true);
                    setStep(3);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Continue in Test / Dev Mode →
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/40 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleNextFromStep2} className="gap-2">
                Next: Email Templates
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* STEP 3: EMAIL TEMPLATES OVERVIEW */}
        {step === 3 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Step 3 — Automated Transactional Templates</CardTitle>
                  <CardDescription>
                    Order Management automatically sends transactional emails when order events occur.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRANSACTIONAL_EVENTS.map((ev, idx) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{ev.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  No manual email drafting needed. HTML receipts with order line items, tracking numbers, and delivery estimates are generated dynamically. Custom overrides can be modified anytime in <strong>Order Settings</strong>.
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/40 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="gap-2">
                Next: Complete Setup
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* STEP 4: COMPLETE & READINESS SUMMARY */}
        {step === 4 && (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Step 4 — Setup Complete</CardTitle>
                  <CardDescription>Review your setup summary before launching the dashboard.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">Store Profile</span>
                  <span className="text-xs font-bold text-foreground">
                    {storeName} ({currency})
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">Email Notifications</span>
                  <span className="text-xs font-bold text-foreground">
                    {skipSmtpForDev || !smtpUser
                      ? "Test / Developer Mode (Unconfigured)"
                      : `Active (${provider.toUpperCase()}: ${smtpUser})`}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">SMTP Handshake</span>
                  <span className="text-xs font-bold text-foreground">
                    {testResult?.success ? "✓ Verified TLS Handshake" : skipSmtpForDev ? "Skipped (Test Mode)" : "Configured"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Transactional Triggers</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ All 7 Events Enabled
                  </span>
                </div>
              </div>

              <div className="text-center py-2">
                <h3 className="text-lg font-bold text-foreground">You're ready to manage orders.</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  You can create orders, track shipments, update inventory, and manage payments instantly.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/40 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleFinalizeSetup}
                disabled={isSaving}
                className="gap-2 px-6 bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                Go to Order Management
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
