import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { getAdminApiBaseUrl } from "@/lib/runtimeUrls";
import { FEATURE_ROWS, PACK_CATALOG, PACK_ORDER, getNextPackKey, normalizePackKey, getPackRank, type FeatureStatus, type PackKey } from "@/config/subscriptions";

const ADMIN_API_URL = getAdminApiBaseUrl();

export const Route = createFileRoute("/dashboard/pricing")({
  head: () => ({ meta: [{ title: "Pricing Plans — Saadhyam AI" }] }),
  component: PricingPlansPage,
});

type Plan = {
  key: PackKey;
  name: string;
  price: string;
  tag: string;
  description: string;
  highlight: string;
  cta: string;
  features: Record<string, FeatureStatus>;
};

const defaultPlans: Plan[] = PACK_CATALOG;

const defaultPlanMap = Object.fromEntries(defaultPlans.map((plan) => [plan.key, plan])) as Record<string, Plan>;

const FEATURE_STATUS_LABELS = {
  included: "Included",
  partial: "Partial / limited",
  excluded: "Excluded",
};

function parsePrice(price: string) {
  const n = Number(String(price).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatRupees(v: number) {
  return `₹${Math.max(0, Math.round(v)).toLocaleString("en-IN")}`;
}

function CurrentPlanSummary({ plans }: { plans: Plan[] }) {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!user || !user.selected_plan_key) return null;

  const currentKey = normalizePackKey(user.selected_plan_key);
  const currentPaid = Number(user.selected_plan_amount_paid || 0) || parsePrice(user.selected_plan_price || defaultPlanMap[currentKey]?.price || "0");
  const currentPlan = plans.find((p) => p.key === currentKey) || defaultPlanMap[currentKey];
  const nextPlanKey = getNextPackKey(currentKey);
  const nextPlan = nextPlanKey ? (plans.find((p) => p.key === nextPlanKey) || defaultPlanMap[nextPlanKey] || null) : null;
  const purchasedAt = user.selected_plan_purchased_at ? new Date(user.selected_plan_purchased_at) : null;
  const daysActive = purchasedAt ? Math.max(1, Math.floor((Date.now() - purchasedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1) : null;
  const estimatedValidityDays = 30;
  const daysLeft = daysActive === null ? null : Math.max(0, estimatedValidityDays - daysActive);

  return (
    <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 p-6 text-white shadow-2xl shadow-purple-200/60">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
            Chosen pack
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight">{currentPlan?.name}</div>
          <div className="mt-2 max-w-2xl text-sm text-white/80">{currentPlan?.description}</div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">{currentPlan?.tag}</span>
            {user.selected_plan_status ? <span className="rounded-full bg-emerald-400/20 px-3 py-1 font-semibold text-emerald-50">{user.selected_plan_status}</span> : null}
            {purchasedAt ? <span className="rounded-full bg-white/15 px-3 py-1">Purchased {purchasedAt.toLocaleDateString()}</span> : null}
            {daysActive !== null ? <span className="rounded-full bg-white/15 px-3 py-1">Active for {daysActive} days</span> : null}
            {daysLeft !== null ? <span className="rounded-full bg-white/15 px-3 py-1">Approx. {daysLeft} days left</span> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-sm md:min-w-[220px] md:text-right">
          <div className="text-xs uppercase tracking-wide text-white/70">Amount paid</div>
          <div className="mt-1 text-3xl font-black">{formatRupees(currentPaid)}</div>
          <div className="mt-1 text-xs text-white/70">{currentPlan?.highlight || "Your selected subscription"}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/80">
          {nextPlan ? (
            <>
              Recommended next upgrade: <span className="font-semibold text-white">{nextPlan.name}</span>
            </>
          ) : (
            <>
              You are on the top pack and have access to the full platform.
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {nextPlan ? (
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white text-purple-700 hover:bg-white/90 dark:bg-slate-900"
              onClick={() => navigate({ to: "/dashboard/checkout", search: { plan: nextPlan.key, upgrade_from: currentKey } })}
            >
              Upgrade to {nextPlan.name}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate({ to: "/dashboard/pricing" })}
          >
            Compare all packs
          </Button>
        </div>
      </div>
    </div>
  );
}

function normalizePlans(payload: unknown): Plan[] {
  const list = Array.isArray(payload) ? payload : (payload as { plans?: unknown[] })?.plans || [];
  const byKey = new Map<string, Plan>();

  list.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const plan = item as Record<string, any>;
    const key = normalizePackKey(String(plan.key || plan.id || plan.name || ""));
    if (!key) return;
    byKey.set(key, {
      key,
      name: String(plan.name || defaultPlanMap[key]?.name || "Plan"),
      price: String(plan.price || defaultPlanMap[key]?.price || "₹0"),
      tag: String(plan.tag || defaultPlanMap[key]?.tag || ""),
      description: String(plan.description || defaultPlanMap[key]?.description || ""),
      highlight: String(plan.highlight || defaultPlanMap[key]?.highlight || ""),
      cta: String(plan.cta || defaultPlanMap[key]?.cta || "Learn more"),
      features: {
        ...(defaultPlanMap[key]?.features || {}),
        ...(plan.features || {}),
      },
    });
  });

  return defaultPlans.map((plan) => byKey.get(plan.key) || plan);
}

function FeatureIcon({ status }: { status: FeatureStatus }) {
  if (status === "included") {
    return <Check size={14} className="text-emerald-600" />;
  }

  if (status === "partial") {
    return <Sparkles size={14} className="text-amber-600" />;
  }

  return <X size={14} className="text-muted-foreground" />;
}

function PricingPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [sourceState, setSourceState] = useState<"loading" | "live" | "fallback">("loading");
  const { user } = useAuthContext();
  const currentKey = normalizePackKey(user?.selected_plan_key);

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      try {
        const response = await fetch(`${ADMIN_API_URL}/api/public/billing-plans`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch pricing plans");
        }

        const data = await response.json();
        if (!cancelled) {
          setPlans(normalizePlans(data));
          setSourceState("live");
        }
      } catch (error) {
        if (!cancelled) {
          setPlans(defaultPlans);
          setSourceState("fallback");
        }
      }
    };

    loadPlans();
    const handleVisibilityRefresh = () => {
      if (!document.hidden) {
        loadPlans();
      }
    };

    window.addEventListener("focus", loadPlans);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    const refreshTimer = window.setInterval(loadPlans, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadPlans);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
      window.clearInterval(refreshTimer);
    };
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Pricing"
        subtitle="Choose the package that fits your business stage. Starter and Growth fit small businesses, Education is for colleges and institutes, and Business is for medium-level teams."
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant={sourceState === "live" ? "default" : sourceState === "fallback" ? "outline" : "secondary"}>
              {sourceState === "live" ? "Live pricing from Super Admin" : sourceState === "fallback" ? "Default pricing fallback" : "Loading pricing"}
            </Badge>
            <Button variant="hero" size="sm">
              <Star size={14} /> Compare Plans
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Current user plan summary and quick upgrade action */}
        <CurrentPlanSummary plans={plans} />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5">
          {plans.map((plan) => {
            const hasActivePlan = !!user?.selected_plan_key;
            const isCurrentPlan = hasActivePlan && currentKey === plan.key;
            const isDowngrade = hasActivePlan && getPackRank(plan.key) < getPackRank(user?.selected_plan_key);

            return (
              <div
                key={plan.name}
                className={`rounded-3xl border p-5 shadow-sm transition-all ${
                  isCurrentPlan
                    ? "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 ring-2 ring-purple-200 shadow-lg"
                    : plan.key === "education" || plan.key === "business" || plan.key === "enterprise"
                      ? "border-purple-200 bg-white ring-1 ring-purple-100"
                      : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={plan.key === "education" || plan.key === "business" || isCurrentPlan ? "default" : "outline"}>{plan.tag}</Badge>
                      {isCurrentPlan ? <Badge variant="secondary">Chosen pack</Badge> : null}
                    </div>
                    <h2 className="mt-3 text-xl font-bold tracking-tight">{plan.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-foreground">{plan.price}</p>
                    <p className="text-xs text-muted-foreground">One-time / plan pricing</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm font-medium text-foreground">
                  {plan.highlight}
                </div>

                <div className="mt-5 space-y-2">
                  {FEATURE_ROWS.slice(0, 6).map((feature) => (
                    <div key={feature} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{feature}</span>
                      <FeatureIcon status={plan.features[feature]} />
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-5 w-full"
                  variant={isCurrentPlan ? "hero" : isDowngrade ? "outline" : plan.key === "education" || plan.key === "business" ? "hero" : "outline"}
                  disabled={isCurrentPlan || isDowngrade}
                  onClick={() => navigate({ to: "/dashboard/checkout", search: { plan: plan.key, upgrade_from: currentKey || undefined } })}
                >
                  {isCurrentPlan ? "Your chosen pack" : isDowngrade ? "Downgrade unavailable" : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline">Feature comparison</Badge>
              <h3 className="mt-3 text-lg font-bold">What each pack includes</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Starter and Growth are built for small businesses, Education is recommended for colleges, and Business fits medium businesses with all features unlocked.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">✓</span> {FEATURE_STATUS_LABELS.included} &nbsp; <span className="font-medium text-amber-600">✦</span> {FEATURE_STATUS_LABELS.partial} &nbsp; <span className="font-medium text-muted-foreground">✕</span> {FEATURE_STATUS_LABELS.excluded}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div
                className="grid items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground"
                style={{ gridTemplateColumns: `minmax(220px,1.4fr) repeat(${plans.length}, minmax(120px,1fr))` }}
              >
                <div>Feature</div>
                {plans.map((plan) => (
                  <div key={plan.key} className="text-center">
                    {plan.name}
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {FEATURE_ROWS.map((feature) => (
                  <div
                    key={feature}
                    className="grid items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm"
                    style={{ gridTemplateColumns: `minmax(220px,1.4fr) repeat(${plans.length}, minmax(120px,1fr))` }}
                  >
                    <span className="font-medium text-foreground">{feature}</span>
                    {plans.map((plan) => (
                      <div key={`${plan.key}-${feature}`} className="flex justify-center">
                        <FeatureIcon status={plan.features[feature]} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 p-4 text-sm text-gray-700 dark:text-slate-300">
            <p className="font-semibold text-gray-900 dark:text-slate-100">Recommended mapping</p>
            <p className="mt-1">
              <span className="font-medium">₹2,999</span> for starter access, <span className="font-medium">₹9,999</span> for small businesses,
              <span className="font-medium">₹14,999</span> for colleges and education, and <span className="font-medium">₹24,999</span> for medium businesses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
