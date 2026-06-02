/**
 * FeatureDisabledBanner
 *
 * Listens to the global `feature-blocked` CustomEvent dispatched by api.ts
 * whenever the backend returns a 503 for a feature action.
 *
 * Renders a centered modal card so blocked features are immediately visible
 * on entry and can be dismissed with OK.
 */

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Shield, WrenchIcon } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { getUpgradePlansForFeature, normalizePackKey } from "@/config/subscriptions";

interface FeatureBlockedDetail {
  detail?: string;
  feature_key?: string;
  mode?: "disabled" | "maintenance" | string;
  source?: string;
  endpoint?: string;
}

export function FeatureDisabledBanner() {
  const [blocked, setBlocked] = useState<FeatureBlockedDetail | null>(null);
  const { user } = useAuthContext();

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
  const currentPlanKey = normalizePackKey(user?.selected_plan_key);
  const featureName = blocked.feature_key
    ? blocked.feature_key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "This feature";

  const featureRowName = {
    website_ai: "Website AI",
    content_scheduler: "Content creator",
    voice_agent: "AI Voice Agent",
    aeo_geo: "SEO & Google Maps",
  }[String(blocked.feature_key || "").toLowerCase()] || featureName;

  const upgradePlans = isMaintenance ? [] : getUpgradePlansForFeature(featureRowName, currentPlanKey);

  const message =
    blocked.detail ||
    (isMaintenance
      ? `${featureName} is currently under maintenance. We'll have it back for you soon.`
      : `Subscription needed for ${featureName}. You can open the page, but this action is locked until you upgrade or your usage limit resets.`);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isMaintenance ? "bg-amber-100" : "bg-purple-100"}`}>
            {isMaintenance ? (
              <WrenchIcon className="h-6 w-6 text-amber-600" />
            ) : (
              <Shield className="h-6 w-6 text-purple-600" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Feature alert
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {isMaintenance ? "Feature under maintenance" : "Feature disabled"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {message}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              {blocked.feature_key && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">{featureName}</span>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {isMaintenance
                  ? "This feature is temporarily unavailable while maintenance is in progress."
                  : "This feature is currently disabled by the super admin."}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={dismiss}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                OK
              </button>
            </div>

            {!isMaintenance && upgradePlans.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {upgradePlans.map((plan) => (
                  <a
                    key={plan.key}
                    href="/dashboard/pricing"
                    onClick={(event) => {
                      event.preventDefault();
                      dismiss();
                      window.location.href = `/dashboard/checkout?plan=${encodeURIComponent(plan.key)}&upgrade_from=${encodeURIComponent(currentPlanKey)}`;
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                  >
                    {plan.name}
                    <span className="text-purple-500">{plan.price}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
