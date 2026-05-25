import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || "http://127.0.0.1:8082";

export const Route = createFileRoute("/dashboard/pricing")({
  head: () => ({ meta: [{ title: "Pricing Plans — Saadhyam AI" }] }),
  component: PricingPlansPage,
});

type FeatureStatus = "included" | "partial" | "excluded";

type Plan = {
  key: string;
  name: string;
  price: string;
  tag: string;
  description: string;
  highlight: string;
  cta: string;
  features: Record<string, FeatureStatus>;
};

const featureRows = [
  "Business analysis",
  "Competitor analysis",
  "Content creator",
  "Instagram tools",
  "Website AI",
  "SEO & Google Maps",
  "Meta ads",
  "AI Voice Agent",
  "WhatsApp Sales",
  "B2B Network",
  "Daily suggestions",
  "Reports & insights",
];

const defaultPlans: Plan[] = [
  {
    key: "starter",
    name: "Starter Pack",
    price: "₹499",
    tag: "For solo founders",
    description: "Lightweight essentials for getting started with Saadhyam AI.",
    highlight: "Best for testing the platform",
    cta: "Start Starter",
    features: {
      "Business analysis": "included",
      "Competitor analysis": "included",
      "Content creator": "partial",
      "Instagram tools": "partial",
      "Website AI": "excluded",
      "SEO & Google Maps": "excluded",
      "Meta ads": "excluded",
      "AI Voice Agent": "excluded",
      "WhatsApp Sales": "excluded",
      "B2B Network": "excluded",
      "Daily suggestions": "included",
      "Reports & insights": "partial",
    },
  },
  {
    key: "growth",
    name: "Growth Pack",
    price: "₹2,999",
    tag: "Most popular",
    description: "Balanced automation for teams that want stronger growth features.",
    highlight: "Best value for growing businesses",
    cta: "Choose Growth",
    features: {
      "Business analysis": "included",
      "Competitor analysis": "included",
      "Content creator": "included",
      "Instagram tools": "included",
      "Website AI": "partial",
      "SEO & Google Maps": "partial",
      "Meta ads": "partial",
      "AI Voice Agent": "excluded",
      "WhatsApp Sales": "partial",
      "B2B Network": "partial",
      "Daily suggestions": "included",
      "Reports & insights": "included",
    },
  },
  {
    key: "premium",
    name: "Premium Pack",
    price: "₹4,999",
    tag: "All features",
    description: "Full access for businesses that want the complete platform.",
    highlight: "Everything unlocked",
    cta: "Go Premium",
    features: Object.fromEntries(featureRows.map((feature) => [feature, "included"])) as Record<string, FeatureStatus>,
  },
];

const defaultPlanMap = Object.fromEntries(defaultPlans.map((plan) => [plan.key, plan]));

const FEATURE_STATUS_LABELS = {
  included: "Included",
  partial: "Partial",
  excluded: "Excluded",
};

function normalizePlans(payload: unknown): Plan[] {
  const list = Array.isArray(payload) ? payload : (payload as { plans?: unknown[] })?.plans || [];
  const byKey = new Map<string, Plan>();

  list.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const plan = item as Record<string, any>;
    const key = String(plan.key || plan.id || plan.name || "").toLowerCase();
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

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      try {
        const response = await fetch(`/admin-api/api/public/billing-plans`, { cache: "no-store" });
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
        subtitle="Choose the package that fits your business stage. Starter for basics, Growth for a balanced stack, Premium for the full platform."
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
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border bg-card p-5 shadow-sm ${
                plan.name === "Growth Pack"
                  ? "border-purple-300 ring-2 ring-purple-100"
                  : "border-border/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant={plan.name === "Growth Pack" ? "default" : "outline"}>{plan.tag}</Badge>
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
                {featureRows.slice(0, 6).map((feature) => (
                  <div key={feature} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{feature}</span>
                    <FeatureIcon status={plan.features[feature]} />
                  </div>
                ))}
              </div>

              <Button
                className="mt-5 w-full"
                variant={plan.name === "Growth Pack" ? "hero" : "outline"}
                onClick={() => navigate({ to: "/dashboard/checkout", search: { plan: plan.key } })}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline">Feature comparison</Badge>
              <h3 className="mt-3 text-lg font-bold">What each pack includes</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Starter keeps the essentials small, Growth unlocks the core tools, and Premium gives full access.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">✓</span> {FEATURE_STATUS_LABELS.included} &nbsp; <span className="font-medium text-amber-600">✦</span> {FEATURE_STATUS_LABELS.partial} &nbsp; <span className="font-medium text-muted-foreground">✕</span> {FEATURE_STATUS_LABELS.excluded}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(120px,1fr))] items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                <div>Feature</div>
                <div className="text-center">Starter</div>
                <div className="text-center">Growth</div>
                <div className="text-center">Premium</div>
              </div>

              <div className="mt-3 space-y-2">
                {featureRows.map((feature) => (
                  <div
                    key={feature}
                    className="grid grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(120px,1fr))] items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">{feature}</span>
                    <div className="flex justify-center"><FeatureIcon status={plans[0].features[feature]} /></div>
                    <div className="flex justify-center"><FeatureIcon status={plans[1].features[feature]} /></div>
                    <div className="flex justify-center"><FeatureIcon status={plans[2].features[feature]} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Recommended mapping</p>
            <p className="mt-1">
              <span className="font-medium">₹499</span> for basic planning tools, <span className="font-medium">₹2,999</span> for a balanced growth stack,
              and <span className="font-medium">₹4,999</span> for the full premium suite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
