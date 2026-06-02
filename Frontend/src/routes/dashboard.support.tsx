import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mail, Loader2, LifeBuoy, ArrowRight } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { toast } from "sonner";
import { getAdminApiBaseUrl } from "@/lib/runtimeUrls";
import { buildSupportGmailUrl, SUPPORT_EMAIL } from "@/config/support";

export const Route = createFileRoute("/dashboard/support")({
  head: () => ({ meta: [{ title: "Support — Saadhyam AI" }] }),
  component: SupportPage,
});

function SupportPage() {
  const { user } = useAuthContext();
  const [supportReason, setSupportReason] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const gmailUrl = buildSupportGmailUrl(
    "Saadhyam Support Request",
    ["Hi team,", "", "I need help with Saadhyam AI.", "", "Please describe the issue here."].join("\n"),
  );

  const handleSubmitSupport = async (event: FormEvent) => {
    event.preventDefault();
    if (!supportReason.trim() || isSubmittingSupport) return;

    setIsSubmittingSupport(true);
    try {
      const adminUrl = getAdminApiBaseUrl();
      const response = await fetch(`${adminUrl}/api/public/support-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          user_name: user?.name,
          reason: supportReason.trim(),
          source: "user_dashboard",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail || "Failed to submit request");
      }

      toast.success("Support request submitted successfully. Admins have been notified.");
      setSupportReason("");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to submit support request");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return (
    <div className="flex flex-1 bg-background">
      <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                <LifeBuoy className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                Support
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Contact the team directly or send a support request from here.
              </p>
            </div>

            <a
              href={gmailUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-700 hover:to-fuchsia-700"
            >
              <Mail className="h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-100/50 dark:border-gray-700/60 dark:bg-gray-900 dark:shadow-black/20">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-2 dark:bg-purple-900/30">
                  <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Submit a support request</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This sends a request to the admin team and creates an inbox notification.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitSupport} className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Email Address</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Request Reason / Message</Label>
                <textarea
                  value={supportReason}
                  onChange={(event) => setSupportReason(event.target.value)}
                  placeholder="Describe what you need help with, or what happened..."
                  rows={8}
                  required
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-purple-950/20"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmittingSupport || !supportReason.trim()}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:from-purple-700 hover:to-fuchsia-700 hover:shadow-xl hover:shadow-purple-500/30"
              >
                {isSubmittingSupport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-purple-200/70 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-6 shadow-lg shadow-purple-100/50 dark:border-purple-900/50 dark:from-purple-950/40 dark:via-gray-900 dark:to-fuchsia-950/30 dark:shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-700 dark:text-purple-300">Quick contact</p>
              <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">Open your mail app instantly</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                If you want to send a direct message, use the button above. It opens Gmail with a prefilled draft to {SUPPORT_EMAIL}.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-lg shadow-gray-100/50 dark:border-gray-700/60 dark:bg-gray-900 dark:shadow-black/20">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">What this page does</h3>
              <ul className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li>• Sends a support request to the admin team.</li>
                <li>• Opens a mail draft for direct email support.</li>
                <li>• Keeps the settings page focused on settings only.</li>
              </ul>
              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                Support email: {SUPPORT_EMAIL}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}