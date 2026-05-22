/**
 * FeatureDisabledBanner
 *
 * Listens to the global `feature-blocked` CustomEvent dispatched by api.ts
 * whenever the backend returns a 503 (feature disabled / under maintenance).
 *
 * Renders a full-page block **replacing** the current section content when
 * the event fires, matching the user-selected behavior.
 *
 * Usage: Mount this once inside the dashboard layout (dashboard.tsx).
 * It overlays the <Outlet /> with a full-size div whenever a feature is blocked.
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
      : `${featureName} has been temporarily disabled. It will be available again shortly.`);

  return (
    /* Full-page overlay that replaces the section content */
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(248,247,252,0.97) 0%, rgba(243,241,249,0.97) 100%)",
        backdropFilter: "blur(6px)",
        /* Push below top header (56px) */
        top: "56px",
      }}
    >
      <div className="max-w-lg w-full mx-4">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Coloured header strip */}
          <div
            className={`px-8 pt-10 pb-8 text-center ${
              isMaintenance
                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                : "bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]"
            }`}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              {isMaintenance ? (
                <WrenchIcon className="w-10 h-10 text-white" />
              ) : (
                <Shield className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isMaintenance ? "Under Maintenance" : "Feature Unavailable"}
            </h1>
            <p className="text-white/80 text-sm font-medium">
              {isMaintenance ? "We're improving things for you" : "Temporarily disabled by admin"}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            {/* Feature badge */}
            {blocked.feature_key && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold mb-4">
                <span
                  className={`w-2 h-2 rounded-full ${isMaintenance ? "bg-amber-500" : "bg-red-500"}`}
                />
                {featureName}
              </div>
            )}

            {/* Message */}
            <p className="text-gray-700 text-sm leading-relaxed mb-6">{message}</p>

            {/* "Will be back soon" note */}
            <div
              className={`flex items-start gap-3 p-4 rounded-xl mb-6 ${
                isMaintenance
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-purple-50 border border-purple-200"
              }`}
            >
              <Clock
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isMaintenance ? "text-amber-600" : "text-purple-600"}`}
              />
              <p className={`text-xs leading-relaxed ${isMaintenance ? "text-amber-800" : "text-purple-800"}`}>
                {isMaintenance
                  ? "This feature is undergoing scheduled maintenance. Please check back later — it will return soon."
                  : "This feature has been temporarily disabled and will be available again soon. No action is needed from your side."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/dashboard"
                onClick={dismiss}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white text-sm font-semibold hover:from-[#7C3AED] hover:to-[#9333EA] transition-all shadow-lg shadow-purple-200 flex-1"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  dismiss();
                  window.location.reload();
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all flex-1"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </div>

        {/* Sub-note */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Contact your administrator if you need urgent access to this feature.
        </p>
      </div>
    </div>
  );
}
