import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

type FeatureDisabledStateProps = {
  title: string;
  message?: string;
  featureLabel?: string;
  onDismiss?: () => void;
};

export function FeatureDisabledState({
  title,
  message,
  featureLabel,
  onDismiss,
}: FeatureDisabledStateProps) {
  const standardMessage = "This feature is disabled and will be available soon.";

  // Keep initial render deterministic between server and client to avoid hydration mismatch.
  const [displayMessage, setDisplayMessage] = useState(message || standardMessage);

  useEffect(() => {
    let nextMessage = message || standardMessage;

    if (!message && featureLabel) {
      try {
        const stored = localStorage.getItem("saadhyam_feature_blocks");
        if (stored) {
          const entries = JSON.parse(stored);
          const match = entries.find((e: any) => e.feature_key === featureLabel);
          if (match && match.mode === "maintenance") {
            nextMessage = "This feature is currently under maintenance. We will have it back for you soon.";
          }
        }
      } catch {
        // ignore malformed local cache
      }
    }

    if (
      nextMessage.includes("disabled by your admin") ||
      nextMessage.includes("currently disabled by your admin")
    ) {
      nextMessage = standardMessage;
    }

    setDisplayMessage(nextMessage);
  }, [message, featureLabel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Feature alert
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{displayMessage}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={onDismiss}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
