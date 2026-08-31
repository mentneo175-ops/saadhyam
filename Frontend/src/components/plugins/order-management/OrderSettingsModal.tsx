import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Server,
  Building,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Send,
  Sliders,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface OrderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDER_PRESETS: Record<string, { host: string; port: number }> = {
  gmail: { host: "smtp.gmail.com", port: 587 },
  outlook: { host: "smtp.office365.com", port: 587 },
  zoho: { host: "smtp.zoho.com", port: 587 },
  custom: { host: "", port: 587 },
};

const TEMPLATE_KEYS = [
  { key: "confirmation", label: "1. Order Confirmed", defaultSubject: "Your Order {{order_number}} Has Been Confirmed" },
  { key: "processing", label: "2. Order Processing", defaultSubject: "Your Order {{order_number}} Is Being Prepared" },
  { key: "shipment", label: "3. Order Shipped", defaultSubject: "Your Order {{order_number}} Has Been Shipped" },
  { key: "delivery", label: "4. Order Delivered", defaultSubject: "Your Order {{order_number}} Has Been Delivered" },
  { key: "completed", label: "5. Order Completed", defaultSubject: "Your Order {{order_number}} Is Complete" },
  { key: "cancellation", label: "6. Order Cancelled", defaultSubject: "Your Order {{order_number}} Has Been Cancelled" },
  { key: "payment_failure", label: "7. Payment Failed", defaultSubject: "Payment Failed for Order {{order_number}}" },
];

export function OrderSettingsModal({ isOpen, onClose }: OrderSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("smtp");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState("gmail");
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordConfigured, setIsPasswordConfigured] = useState(false);
  const [fromEmail, setFromEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [contactEmail, setContactEmail] = useState("");

  // Templates
  const [templates, setTemplates] = useState<Record<string, { subject: string; body: string }>>({});

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // apiClient.get returns the JSON object directly (not res.data)
      const data = await apiClient.get<any>("/api/orders/config");
      if (data) {
        setEnabled(data.email_notifications_enabled ?? data.email_enabled ?? true);
        
        const prov = data.provider || "gmail";
        setProvider(prov);

        // Sanitize host: ensure host is never set to an email address accidentally
        let initialHost = data.smtp_host || "";
        if (!initialHost || initialHost.includes("@")) {
          initialHost = PROVIDER_PRESETS[prov]?.host || "smtp.gmail.com";
        }
        setHost(initialHost);
        setPort(data.smtp_port || 587);

        const loadedUser = data.smtp_user || data.smtp_username || "";
        setUser(loadedUser);

        const loadedFrom = data.from_email || data.sender_email || loadedUser || "";
        setFromEmail(loadedFrom);

        setBusinessName(data.business_name || data.store_name || "");
        setCurrency(data.currency || "INR");
        setContactEmail(data.contact_email || "");
        setIsPasswordConfigured(Boolean(data.is_password_configured));
        setPassword(""); // Never populate password field with plain text

        if (data.templates && typeof data.templates === "object") {
          setTemplates(data.templates);
        }
      }
    } catch (err: any) {
      console.error("Failed to load order SMTP settings:", err);
      toast.error("Failed to load SMTP settings", {
        description: err?.message || "Could not retrieve settings from server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const preset = PROVIDER_PRESETS[newProvider];
    if (preset) {
      setHost(preset.host);
      setPort(preset.port);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUser(val);
    // For Gmail / single-user presets, auto-sync fromEmail if empty or matching previous user
    if (!fromEmail || fromEmail === user) {
      setFromEmail(val);
    }
  };

  const handleTestConnection = async () => {
    const effectiveHost = host.trim() || PROVIDER_PRESETS[provider]?.host || "smtp.gmail.com";
    const effectiveUser = user.trim();

    if (!effectiveUser) {
      toast.error("SMTP Username / Email is required to test connection.");
      return;
    }
    if (!password && !isPasswordConfigured) {
      toast.error("Please enter your SMTP Password or App Password to test connection.");
      return;
    }

    setIsTesting(true);
    try {
      const payload: Record<string, any> = {
        provider,
        smtp_host: effectiveHost,
        smtp_port: Number(port) || 587,
        smtp_user: effectiveUser,
        from_email: fromEmail.trim() || effectiveUser,
      };
      if (password.trim()) {
        payload.smtp_password = password.trim();
      }

      // apiClient.post returns the JSON response directly
      const data = await apiClient.post<any>("/api/orders/config/test-smtp", payload);
      if (data?.success) {
        toast.success("✅ SMTP Connection Successful!", {
          description: data.message || "Connected and authenticated successfully.",
        });
      } else {
        toast.error("❌ SMTP Connection Failed", {
          description: data?.message || "Could not authenticate with SMTP server.",
        });
      }
    } catch (err: any) {
      const errMsg = err?.message || "SMTP connection test error";
      toast.error("❌ Connection Test Error", { description: errMsg });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    const effectiveHost = host.trim() || PROVIDER_PRESETS[provider]?.host || "smtp.gmail.com";
    const effectiveUser = user.trim();

    if (!effectiveUser) {
      toast.error("SMTP Username / Email is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        setup_completed: true,
        email_notifications_enabled: enabled,
        email_enabled: enabled,
        provider,
        smtp_host: effectiveHost,
        smtp_port: Number(port) || 587,
        smtp_user: effectiveUser,
        smtp_username: effectiveUser,
        from_email: fromEmail.trim() || effectiveUser,
        sender_email: fromEmail.trim() || effectiveUser,
        business_name: businessName.trim(),
        store_name: businessName.trim(),
        currency,
        contact_email: contactEmail.trim(),
        templates,
      };
      if (password.trim()) {
        payload.smtp_password = password.trim();
      }

      const data = await apiClient.post<any>("/api/orders/config", payload);
      if (data?.success !== false) {
        setIsPasswordConfigured(Boolean(data?.is_password_configured || isPasswordConfigured || password));
        setPassword("");
        toast.success("Settings Saved Successfully", {
          description: "Encrypted SMTP credentials & store profile updated.",
        });
        onClose();
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to save settings";
      toast.error("Error Saving Settings", { description: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Order Management Settings
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manage your store profile, default currency, and per-user encrypted SMTP delivery.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Loading configuration...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="smtp" className="gap-2">
                <Server className="w-4 h-4" />
                Store & SMTP Configuration
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <Sliders className="w-4 h-4" />
                Transactional Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="smtp" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gray-50/50 dark:bg-slate-800/40 rounded-xl border border-gray-200/80 dark:border-slate-700">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Store / Business Name
                  </Label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-9 text-sm"
                      placeholder="My Online Store"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                    Send Customer Order Emails
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically dispatch transactional emails on confirmation, shipment, delivery & cancellation.
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Email Provider
                  </Label>
                  <Select value={provider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail (Recommended)</SelectItem>
                      <SelectItem value="outlook">Outlook / Office 365</SelectItem>
                      <SelectItem value="zoho">Zoho Mail</SelectItem>
                      <SelectItem value="custom">Custom SMTP Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Store Contact Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    placeholder="support@yourstore.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    SMTP Host
                  </Label>
                  <Input
                    placeholder="smtp.gmail.com"
                    value={host}
                    disabled={provider !== "custom"}
                    onChange={(e) => setHost(e.target.value)}
                    className={provider !== "custom" ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Port
                  </Label>
                  <Input
                    type="number"
                    placeholder="587"
                    value={port}
                    disabled={provider !== "custom"}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className={provider !== "custom" ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300" : ""}
                  />
                </div>
              </div>

              {/* Username & Sender Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    SMTP Username / Email
                  </Label>
                  <Input
                    placeholder="you@gmail.com"
                    value={user}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sender Email (From)
                  </Label>
                  <Input
                    placeholder="you@gmail.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password / App Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {provider === "gmail" ? "Google App Password" : "SMTP Password"}
                  </Label>
                  {isPasswordConfigured && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> App Password is configured & encrypted
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isPasswordConfigured
                        ? "•••••••••••••••• (Leave blank to keep existing)"
                        : provider === "gmail"
                        ? "Enter 16-character Google App Password"
                        : "Enter SMTP Password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {provider === "gmail"
                    ? "Generate a 16-character Google App Password in Google Account → Security → 2-Step Verification → App Passwords."
                    : "Your password is encrypted at rest using AES-256 before being stored in the database."}
                </p>
              </div>

              {/* Test Action Bar */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Test Connection
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: TRANSACTIONAL TEMPLATES */}
            <TabsContent value="templates" className="space-y-4 pt-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-xs text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Available Template Placeholders:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    "{{customer_name}}",
                    "{{order_number}}",
                    "{{total_amount}}",
                    "{{payment_status}}",
                    "{{order_status}}",
                    "{{carrier_name}}",
                    "{{tracking_number}}",
                    "{{shipping_address}}",
                    "{{business_name}}",
                    "{{order_date}}",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded font-mono text-[11px] border border-purple-200 dark:border-purple-800"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {TEMPLATE_KEYS.map(({ key, label, defaultSubject }) => {
                  const currentSub = templates[key]?.subject ?? defaultSubject;
                  const currentBody = templates[key]?.body ?? "";

                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {label}
                        </Label>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-gray-500">Subject Line</Label>
                        <Input
                          value={currentSub}
                          onChange={(e) =>
                            setTemplates((prev) => ({
                              ...prev,
                              [key]: { subject: e.target.value, body: prev[key]?.body || "" },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-gray-500">
                          Custom Body Message (Optional override)
                        </Label>
                        <Textarea
                          placeholder="Leave blank to use default styled HTML message..."
                          value={currentBody}
                          onChange={(e) =>
                            setTemplates((prev) => ({
                              ...prev,
                              [key]: { subject: prev[key]?.subject || currentSub, body: e.target.value },
                            }))
                          }
                          className="min-h-[50px] text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white gap-2 font-medium"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
