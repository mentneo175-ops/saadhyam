import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/lib/AuthContext";
import {
  normalizePackKey,
  resolveFeatureFromPath,
  getUpgradePlansForFeature,
  PACK_FEATURE_MATRIX,
  PACK_LABELS,
  type PackKey,
  type FeatureStatus,
} from "@/config/subscriptions";
import { Lock, Sparkles, ArrowRight, Crown, Zap, Shield } from "lucide-react";
import { type ReactNode, useMemo, useState, useEffect } from "react";
import { getAdminApiBaseUrl } from "@/lib/runtimeUrls";
import { FeatureDisabledState } from "@/components/feature/FeatureDisabledState";

interface FeatureUpgradeGuardProps {
  children: ReactNode;
}

const PLAN_ICONS: Record<string, typeof Crown> = {
  growth: Zap,
  education: Sparkles,
  business: Crown,
  enterprise: Shield,
};

const PLAN_GRADIENTS: Record<string, string> = {
  growth: "from-blue-500 to-cyan-500",
  education: "from-violet-500 to-purple-500",
  business: "from-amber-500 to-orange-500",
  enterprise: "from-emerald-500 to-teal-500",
};

function getGlobalFeatureKey(pathname: string): string | null {
  const path = pathname.toLowerCase();
  if (path.includes("/dashboard/website")) return "website_ai";
  if (path.includes("/dashboard/content")) return "content_scheduler";
  if (path.includes("/dashboard/voice-agent")) return "voice_agent";
  if (path.includes("/dashboard/aeo-geo") || path.includes("/dashboard/seo")) return "aeo_geo";
  if (path.includes("/dashboard/instagram")) return "instagram_manager";
  if (path.includes("/dashboard/whatsapp")) return "whatsapp_campaigns";
  if (path.includes("/dashboard/b2b-network") || path.includes("/dashboard/b2b-chat")) return "b2b_network";
  if (path.includes("/dashboard/meta-ads")) return "meta_ads";
  return null;
}

export function FeatureUpgradeGuard({ children }: FeatureUpgradeGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [globalStatus, setGlobalStatus] = useState<{ status: string; reason?: string } | null>(null);
  const [isGlobalNoticeOpen, setIsGlobalNoticeOpen] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchFlags = async () => {
      try {
        const adminUrl = getAdminApiBaseUrl();
        const res = await fetch(`${adminUrl}/api/features/public`);
        if (res.ok && active) {
          const flags = await res.json();
          const routeKey = getGlobalFeatureKey(location.pathname);
          if (routeKey) {
            const flag = flags.find((f: any) => f.key === routeKey);
            if (flag && flag.status !== "enabled") {
              setGlobalStatus({ status: flag.status, reason: flag.reason });
              setIsGlobalNoticeOpen(true);
            } else {
              setGlobalStatus(null);
              setIsGlobalNoticeOpen(true);
            }
          } else {
            setGlobalStatus(null);
            setIsGlobalNoticeOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch global feature flags", err);
      }
    };

    fetchFlags();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const currentPlanKey = normalizePackKey(user?.selected_plan_key);

  useEffect(() => {
    const routeKey = getGlobalFeatureKey(location.pathname);
    if (!routeKey || globalStatus) return;

    // Check if the user plan excludes the feature
    const featureName = resolveFeatureFromPath(location.pathname);
    if (featureName) {
      const planStatus = PACK_FEATURE_MATRIX[currentPlanKey]?.[featureName];
      if (planStatus === "excluded") {
        return; // Excluded - don't record usage
      }
    }

    const recordUsage = async () => {
      try {
        const adminUrl = getAdminApiBaseUrl();
        await fetch(`${adminUrl}/api/admin/analytics/feature-usage/event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feature_key: routeKey,
            path: location.pathname,
            user_id: user?.id,
            metadata: {
              plan: currentPlanKey,
              email: user?.email,
            },
          }),
        });
      } catch (err) {
        console.error("Failed to record feature usage event", err);
      }
    };

    recordUsage();
  }, [location.pathname, globalStatus, currentPlanKey, user?.id, user?.email]);

  const gateInfo = useMemo(() => {
    const featureName = resolveFeatureFromPath(location.pathname);
    if (!featureName) return null;

    const status: FeatureStatus | undefined = PACK_FEATURE_MATRIX[currentPlanKey]?.[featureName];
    if (!status || status === "included") return null;

    const upgradePlans = getUpgradePlansForFeature(featureName, currentPlanKey);

    return {
      featureName,
      status,
      upgradePlans,
      currentPlanName: PACK_LABELS[currentPlanKey],
    };
  }, [location.pathname, currentPlanKey]);

  if (globalStatus) {
    const isMaintenance = globalStatus.status === "maintenance";
    const title = isMaintenance ? "Feature Under Maintenance" : "Feature Disabled";
    const message = isMaintenance
      ? globalStatus.reason || "This feature is currently under maintenance. We will have it back for you soon."
      : globalStatus.reason || "This feature is disabled and will be available soon.";
    return (
      <>
        {children}
        {isGlobalNoticeOpen && (
          <FeatureDisabledState
            title={title}
            message={message}
            featureLabel={getGlobalFeatureKey(location.pathname) || undefined}
            onDismiss={() => setIsGlobalNoticeOpen(false)}
          />
        )}
      </>
    );
  }

  if (!gateInfo) {
    return <>{children}</>;
  }

  const bannerTone = gateInfo.status === "partial" ? "amber" : "purple";
  const leadMessage =
    gateInfo.status === "partial"
      ? `Your ${gateInfo.currentPlanName} includes limited usage of this feature.`
      : `${gateInfo.featureName} is locked on ${gateInfo.currentPlanName}. Open the page, but upgrade to use the action.`;

  return (
    <>
      <div className={`mx-4 mt-2 mb-0 rounded-2xl border px-5 py-3 shadow-sm ${bannerTone === "amber" ? "border-amber-200/60 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50" : "border-purple-200/60 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50"}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg ${bannerTone === "amber" ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200/50" : "bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-purple-200/50"}`}>
            <Lock className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${bannerTone === "amber" ? "text-amber-900" : "text-purple-900"}`}>
              {gateInfo.status === "partial" ? "Limited access" : "Subscription needed"} - {gateInfo.featureName}
            </p>
            <p className={`text-xs mt-0.5 ${bannerTone === "amber" ? "text-amber-700/80" : "text-purple-700/80"}`}>
              {leadMessage}
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/dashboard/pricing" })}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${bannerTone === "amber" ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-300/30 hover:shadow-amber-300/50" : "bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-purple-300/30 hover:shadow-purple-300/50"}`}
          >
            Upgrade
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {gateInfo.upgradePlans.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {gateInfo.upgradePlans.map((plan) => (
              <button
                key={plan.key}
                onClick={() =>
                  navigate({
                    to: "/dashboard/checkout",
                    search: { plan: plan.key, upgrade_from: currentPlanKey },
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-purple-300 hover:text-purple-700"
              >
                <span>{plan.name}</span>
                <span className="text-gray-400">{plan.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {children}
    </>
  );
}
