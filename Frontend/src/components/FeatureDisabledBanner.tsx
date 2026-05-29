/**
 * FeatureDisabledBanner
 *
 * Listens to the global `feature-blocked` CustomEvent dispatched by api.ts
 * whenever the backend returns a 503 for a feature action.
 *
 * Renders a non-blocking subscription/maintenance banner so the feature page
 * stays accessible while the blocked action is explained to the user.
 */

import { useEffect, useState, useCallback } from "react";
import { Shield, WrenchIcon, ArrowLeft, RefreshCw, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface FeatureBlockedDetail {
  detail?: string;
  feature_key?: string;
  mode?: "disabled" | "maintenance" | string;
  source?: string;
  endpoint?: string;
}

export function FeatureDisabledBanner() {
  const [blocked, setBlocked] = useState<FeatureBlockedDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FeatureBlockedDetail>).detail;
      setBlocked(detail ?? {});
    };
    window.addEventListener("feature-blocked", handler);
    return () => window.removeEventListener("feature-blocked", handler);
  }, []);

  const dismiss = useCallback(() => setBlocked(null), []);

  if (!blocked) return null;

  const isMaintenance = blocked.mode === "maintenance";
  const requiresSubscription = !isMaintenance;
  const featureName = blocked.feature_key
    ? blocked.feature_key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "This feature";

  const message =
    blocked.detail ||
    (isMaintenance
      ? `${featureName} is currently under maintenance. We'll have it back for you soon.`
      : `Subscription needed for ${featureName}. You can open the page, but this action is locked until you upgrade or your usage limit resets.`);

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-purple-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isMaintenance ? "bg-amber-100" : "bg-purple-100"}`}>
            {isMaintenance ? (
              <WrenchIcon className="h-5 w-5 text-amber-600" />
            ) : (
              <Shield className="h-5 w-5 text-purple-600" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900">
                {isMaintenance ? "Under Maintenance" : "Subscription needed"}
              </h1>
              {blocked.feature_key && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  {featureName}
                </span>
              )}
              {requiresSubscription && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                  Action locked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-700">{message}</p>
            <p className="mt-1 text-xs text-gray-500">
              {isMaintenance
                ? "You can keep browsing this page while we fix it."
                : "The page stays open, but generate/download/publish actions remain locked until you upgrade or the limit resets."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard/pricing"
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#7C3AED] hover:to-[#9333EA]"
          >
            Upgrade
          </Link>
          <button
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
