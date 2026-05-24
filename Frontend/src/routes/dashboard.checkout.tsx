import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgePercent, CheckCircle2, CreditCard, Loader2, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || "http://127.0.0.1:8082";

type Plan = {
  key: string;
  name: string;
  price: string;
  tag: string;
  description: string;
  highlight: string;
  cta: string;
};

type Coupon = {
  code: string;
  name: string;
  discount_percentage: number;
  discount_amount: number;
  allowed_plan_keys?: string[];
  is_active: boolean;
};

const defaultPlans: Plan[] = [
  { key: "starter", name: "Starter Pack", price: "₹499", tag: "For solo founders", description: "Lightweight essentials for getting started with Saadhyam AI.", highlight: "Best for testing the platform", cta: "Start Starter" },
  { key: "growth", name: "Growth Pack", price: "₹2,999", tag: "Most popular", description: "Balanced automation for teams that want stronger growth features.", highlight: "Best value for growing businesses", cta: "Choose Growth" },
  { key: "premium", name: "Premium Pack", price: "₹4,999", tag: "All features", description: "Full access for businesses that want the complete platform.", highlight: "Everything unlocked", cta: "Go Premium" },
];

const defaultPlanMap = Object.fromEntries(defaultPlans.map((plan) => [plan.key, plan]));

export const Route = createFileRoute("/dashboard/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search.plan === "string" && search.plan ? search.plan : "starter",
  }),
  head: () => ({ meta: [{ title: "Checkout — Saadhyam AI" }] }),
  component: CheckoutPage,
});

function parsePrice(price: string) {
  const value = Number(String(price).replace(/[^\d]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatRupees(value: number) {
  return `₹${Math.max(0, Math.round(value)).toLocaleString("en-IN")}`;
}

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
    });
  });

  return defaultPlans.map((plan) => byKey.get(plan.key) || plan);
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { plan: planKey } = Route.useSearch();
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [paymentStep, setPaymentStep] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${ADMIN_API_URL}/api/public/billing-plans`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch billing plans");
        }
        const data = await response.json();
        if (!cancelled) {
          setPlans(normalizePlans(data));
        }
      } catch {
        if (!cancelled) {
          setPlans(defaultPlans);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlan = useMemo(() => {
    return plans.find((item) => item.key === planKey) || defaultPlanMap[planKey] || defaultPlans[0];
  }, [plans, planKey]);

  const subtotal = useMemo(() => parsePrice(selectedPlan.price), [selectedPlan.price]);
  const percentageDiscount = useMemo(() => {
    if (!coupon) return 0;
    return Math.floor((subtotal * Number(coupon.discount_percentage || 0)) / 100);
  }, [coupon, subtotal]);
  const flatDiscount = coupon ? Number(coupon.discount_amount || 0) : 0;
  const discountAmount = useMemo(() => Math.min(subtotal, percentageDiscount + flatDiscount), [subtotal, percentageDiscount, flatDiscount]);
  const couponPlanMatch = useMemo(() => {
    if (!coupon?.allowed_plan_keys?.length) return true;
    return coupon.allowed_plan_keys.includes(planKey);
  }, [coupon, planKey]);
  const amountDue = Math.max(0, subtotal - discountAmount);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/public/coupons/${encodeURIComponent(code)}?plan=${encodeURIComponent(planKey)}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "Coupon not found or inactive");
      }

      const data = await response.json();
      setCoupon(data);
    } catch (error: any) {
      setCoupon(null);
      setCouponError(error?.message || "Unable to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title="Checkout" subtitle="Preparing your selected plan..." />
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-sm flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <PageHeader
        title="Checkout"
        subtitle="Apply a verified coupon, review the discounted amount, and continue to the payment step."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard/pricing" })}>
            <ArrowLeft size={14} /> Back to pricing
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                  <Ticket size={12} /> Selected package
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">{selectedPlan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-foreground">{selectedPlan.price}</p>
                <p className="text-xs text-muted-foreground">Before coupon discount</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm font-medium text-foreground">
              {selectedPlan.highlight}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <BadgePercent size={16} className="text-purple-600" />
              <h3 className="text-lg font-semibold">Apply coupon</h3>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <Button variant="hero" onClick={applyCoupon} disabled={couponLoading}>
                {couponLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Apply coupon
              </Button>
            </div>

            {couponError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {couponError}
              </div>
            ) : null}

            {coupon ? (
              <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div>
                  Applied <span className="font-semibold">{coupon.code}</span> to {selectedPlan.name}.
                </div>
                {couponPlanMatch ? null : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                    This coupon is not configured for the selected pack.
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <span>Percentage discount</span>
                  <span className="font-semibold">- {formatRupees(percentageDiscount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Flat discount</span>
                  <span className="font-semibold">- {formatRupees(flatDiscount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-emerald-200 pt-2 text-emerald-900">
                  <span>Total coupon reduction</span>
                  <span className="font-bold">- {formatRupees(discountAmount)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-purple-600" />
              <h3 className="text-lg font-semibold">Payment step</h3>
            </div>

            {!paymentStep ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  After applying a coupon, continue to payment with the remaining amount. This keeps the flow predictable and lets the user review the final payable value.
                </p>
                <Button
                  variant="hero"
                  onClick={() => setPaymentStep(true)}
                >
                  Continue to payment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4 text-sm text-foreground">
                  <p className="font-semibold">Billing summary</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between"><span>Selected plan</span><span>{selectedPlan.name}</span></div>
                    <div className="flex items-center justify-between"><span>Coupon reduction</span><span className="font-semibold">- {formatRupees(discountAmount)}</span></div>
                    <div className="flex items-center justify-between"><span>Amount due</span><span className="font-semibold">{formatRupees(amountDue)}</span></div>
                  </div>
                </div>
                {amountDue === 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Your coupon covers the full plan price. No payment is required for this order.
                  </div>
                ) : null}
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Payment gateway integration can be attached here. The current flow is ready for a live gateway or a payment link.
                </div>
                <Button variant="outline" onClick={() => setPaymentStep(false)}>
                  Go back to coupon step
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h3 className="text-lg font-semibold">Order summary</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Plan price</span><span>{selectedPlan.price}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Coupon discount</span><span>- {formatRupees(discountAmount)}</span></div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold"><span>Total payable</span><span>{formatRupees(amountDue)}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Plan highlights</h4>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li>• {selectedPlan.highlight}</li>
              <li>• {selectedPlan.tag}</li>
              <li>• Secure coupon-controlled pricing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}