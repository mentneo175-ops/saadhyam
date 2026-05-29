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
import { type ReactNode, useMemo } from "react";

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

export function FeatureUpgradeGuard({ children }: FeatureUpgradeGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const currentPlanKey = normalizePackKey(user?.selected_plan_key);

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
