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

  // For "partial" features: show a subtle top banner but allow access
  if (gateInfo.status === "partial") {
    return (
      <>
        <div className="mx-4 mt-2 mb-0 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Limited access — {gateInfo.featureName}
              </p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                Your <span className="font-semibold">{gateInfo.currentPlanName}</span> includes limited usage of this feature.
                Upgrade for full access.
              </p>
            </div>
            {gateInfo.upgradePlans.length > 0 && (
              <button
                onClick={() =>
                  navigate({
                    to: "/dashboard/checkout",
                    search: {
                      plan: gateInfo.upgradePlans.find((p) => p.status === "included")?.key || gateInfo.upgradePlans[0].key,
                      upgrade_from: currentPlanKey,
                    },
                  })
                }
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-300/30 transition-all hover:shadow-amber-300/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Upgrade
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {children}
      </>
    );
  }

  // For "excluded" features: show full glassmorphic overlay
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Blurred background content */}
      <div className="pointer-events-none select-none blur-[6px] opacity-40 saturate-50">
        {children}
      </div>

      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 z-30 flex items-start justify-center pt-8 md:pt-16 px-4">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative w-full max-w-lg">
          {/* Main card */}
          <div className="rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-purple-200/30 backdrop-blur-xl">
            {/* Lock icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 shadow-xl shadow-purple-300/40">
              <Lock className="h-9 w-9 text-white" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h2 className="text-center text-2xl font-black tracking-tight text-gray-900">
              Upgrade to unlock
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              <span className="font-semibold text-purple-700">{gateInfo.featureName}</span> is not
              available on your <span className="font-semibold">{gateInfo.currentPlanName}</span>.
              Upgrade to one of these plans to use this feature.
            </p>

            {/* Upgrade plan cards */}
            {gateInfo.upgradePlans.length > 0 && (
              <div className="mt-7 space-y-3">
                {gateInfo.upgradePlans.map((plan) => {
                  const IconComponent = PLAN_ICONS[plan.key] || Crown;
                  const gradient = PLAN_GRADIENTS[plan.key] || "from-purple-500 to-pink-500";
                  const isFullAccess = plan.status === "included";

                  return (
                    <button
                      key={plan.key}
                      onClick={() =>
                        navigate({
                          to: "/dashboard/checkout",
                          search: { plan: plan.key, upgrade_from: currentPlanKey },
                        })
                      }
                      className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200/60 bg-white/80 p-4 text-left shadow-sm transition-all hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {plan.name}
                          </span>
                          {isFullAccess && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Full access
                            </span>
                          )}
                          {!isFullAccess && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Limited
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isFullAccess
                            ? `Includes full ${gateInfo.featureName} access`
                            : `Includes limited ${gateInfo.featureName} access`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-gray-900">{plan.price}</p>
                        <p className="text-[10px] text-gray-500">one-time</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Back to pricing link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate({ to: "/dashboard/pricing" })}
                className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
              >
                Compare all plans →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
