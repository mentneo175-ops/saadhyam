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
import { Lock, Sparkles, ArrowRight, Crown, Zap, Shield, X } from "lucide-react";
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
  const [quotaBlock, setQuotaBlock] = useState<{ title: string; message: string; featureLabel?: string } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchFlags = async () => {
      try {
        const adminUrl = getAdminApiBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${adminUrl}/api/features/public`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
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

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentPlanKey = normalizePackKey(user?.selected_plan_key);

  useEffect(() => {
    let active = true;
    const routeKey = getGlobalFeatureKey(location.pathname);
    if (!routeKey || globalStatus) {
      setQuotaBlock(null);
      return;
    }

    const checkQuotaAndRecord = async () => {
      try {
        const adminUrl = getAdminApiBaseUrl();
        const params = new URLSearchParams();
        if (user?.id !== undefined && user?.id !== null) {
          params.set("user_id", String(user.id));
        }
        params.set("plan_key", currentPlanKey);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const evaluateResponse = await fetch(`${adminUrl}/api/features/${routeKey}/evaluate?${params.toString()}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!evaluateResponse.ok) {
          throw new Error(`Quota evaluation failed with ${evaluateResponse.status}`);
        }

        const evaluation = await evaluateResponse.json();
        if (!active) return;

        if (evaluation.allowed === false) {
          setQuotaBlock({
            title: `${evaluation.feature_name || resolveFeatureFromPath(location.pathname) || "Feature"} limit reached`,
            message: evaluation.message || "This feature has reached the free usage limit.",
            featureLabel: routeKey,
          });
          return;
        }

        setQuotaBlock(null);

        const featureName = resolveFeatureFromPath(location.pathname);
        if (featureName) {
          const planStatus = PACK_FEATURE_MATRIX[currentPlanKey]?.[featureName];
          if (planStatus === "excluded") {
            return;
          }
        }

        const eventController = new AbortController();
        const eventTimeoutId = setTimeout(() => eventController.abort(), 3000);
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
          signal: eventController.signal
        });
        clearTimeout(eventTimeoutId);
      } catch (err) {
        if (active) {
          console.error("Failed to evaluate or record feature usage", err);
          setQuotaBlock(null);
        }
      }
    };

    checkQuotaAndRecord();

    return () => {
      active = false;
    };
  }, [location.pathname, globalStatus, currentPlanKey, user?.id, user?.email]);

  const gateInfo = useMemo(() => {
    if (!isMounted) return null;

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
  }, [location.pathname, currentPlanKey, isMounted]);

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    setIsBannerDismissed(false);
  }, [location.pathname]);

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

  if (quotaBlock) {
    return (
      <FeatureDisabledState
        title={quotaBlock.title}
        message={quotaBlock.message}
        featureLabel={quotaBlock.featureLabel}
        onDismiss={() => navigate({ to: "/dashboard/pricing" })}
      />
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
      {!isBannerDismissed && (
        <div 
          className={`fixed top-20 right-6 z-[100] max-w-md w-[calc(100vw-3rem)] sm:w-[420px] rounded-2xl border p-4 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
            bannerTone === "amber" 
              ? "border-amber-500/20 bg-amber-950/90 text-amber-100 shadow-amber-950/40" 
              : "border-purple-500/20 bg-purple-950/90 text-purple-100 shadow-purple-950/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg ${
              bannerTone === "amber" 
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/20" 
                : "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-purple-500/20"
            }`}>
              <Lock className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-sm font-semibold tracking-wide text-white">
                {gateInfo.status === "partial" ? "Limited access" : "Subscription needed"} - {gateInfo.featureName}
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${
                bannerTone === "amber" ? "text-amber-200/80" : "text-purple-200/80"
              }`}>
                {leadMessage}
              </p>
              
              {gateInfo.upgradePlans.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {gateInfo.upgradePlans.map((plan) => (
                    <button
                      key={plan.key}
                      onClick={() =>
                        navigate({
                          to: "/dashboard/checkout",
                          search: { plan: plan.key, upgrade_from: currentPlanKey },
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-all"
                    >
                      <span>{plan.name}</span>
                      <span className="opacity-60">{plan.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0 items-end">
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="p-1 rounded-lg hover:bg-white/15 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate({ to: "/dashboard/pricing" })}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  bannerTone === "amber" 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20" 
                    : "bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-purple-500/20"
                }`}
              >
                <span>Upgrade</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
