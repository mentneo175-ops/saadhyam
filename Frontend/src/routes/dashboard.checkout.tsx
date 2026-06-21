import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { ArrowLeft, BadgePercent, CheckCircle2, CreditCard, Loader2, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { apiClient } from "@/lib/api";
import { getAdminApiBaseUrl } from "@/lib/runtimeUrls";
import { PACK_CATALOG, PACK_ORDER, normalizePackKey, getPackRank, type PackKey } from "@/config/subscriptions";

const ADMIN_API_URL = getAdminApiBaseUrl();
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

type Plan = {
  key: PackKey;
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

type RazorpayResponse = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: RazorpayOptions) => { open: () => void };
};

const defaultPlans: Plan[] = PACK_CATALOG;

const defaultPlanMap = Object.fromEntries(defaultPlans.map((plan) => [plan.key, plan])) as Record<string, Plan>;

export const Route = createFileRoute("/dashboard/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: normalizePackKey(typeof search.plan === "string" && search.plan ? search.plan : "starter"),
    upgrade_from: typeof search.upgrade_from === "string" && search.upgrade_from ? search.upgrade_from : undefined,
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
    });
  });

  return defaultPlans.map((plan) => byKey.get(plan.key) || plan);
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

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

  const { plan: planKey, upgrade_from: upgradeFrom } = Route.useSearch();

  const { user, refreshCurrentUser } = useAuthContext();
  const redirectToPricing = () => {
    navigate({ to: "/dashboard/pricing", replace: true });
  };

  useEffect(() => {
    if (user && planKey) {
      const currentRank = getPackRank(user.selected_plan_key);
      const targetRank = getPackRank(planKey);
      if (user.selected_plan_key && targetRank < currentRank) {
        redirectToPricing();
      }
    }
  }, [user, planKey]);

  const selectedPlan = useMemo(() => {
    const normalizedPlanKey = normalizePackKey(planKey);
    return plans.find((item) => item.key === normalizedPlanKey) || defaultPlanMap[normalizedPlanKey] || defaultPlans[0];
  }, [plans, planKey]);

  const subtotal = useMemo(() => parsePrice(selectedPlan.price), [selectedPlan.price]);

  const currentPaid = useMemo(() => {
    if (!upgradeFrom) return 0;
    // Prefer the authoritative stored paid amount on user, fallback to stored plan price
    if (user && user.selected_plan_key === upgradeFrom && Number(user.selected_plan_amount_paid || 0) > 0) {
      return Number(user.selected_plan_amount_paid || 0);
    }
    return parsePrice(defaultPlanMap[upgradeFrom]?.price || "0");
  }, [upgradeFrom, user]);

  // When upgrading, base amount is the remaining difference
  const baseAmount = useMemo(() => {
    if (!upgradeFrom) return subtotal;
    return Math.max(0, subtotal - currentPaid);
  }, [upgradeFrom, subtotal, currentPaid]);

  const percentageDiscount = useMemo(() => {
    if (!coupon) return 0;
    return Math.floor((baseAmount * Number(coupon.discount_percentage || 0)) / 100);
  }, [coupon, baseAmount]);
  const flatDiscount = coupon ? Number(coupon.discount_amount || 0) : 0;
  const discountAmount = useMemo(() => Math.min(baseAmount, percentageDiscount + flatDiscount), [baseAmount, percentageDiscount, flatDiscount]);
  const couponPlanMatch = useMemo(() => {
    if (!coupon?.allowed_plan_keys?.length) return true;
    return coupon.allowed_plan_keys.includes(planKey);
  }, [coupon, planKey]);
  const amountDue = Math.max(0, baseAmount - discountAmount);

  const persistSelectedPlan = async (paymentId: string, paidAmount: number) => {
    await apiClient.confirmSelectedPlan({
      plan_key: selectedPlan.key,
      plan_name: selectedPlan.name,
      plan_price: selectedPlan.price,
      payment_id: paymentId,
      coupon_code: coupon?.code || "",
      amount_paid: paidAmount,
      currency: "INR",
      status: "active",
      upgrade_from: upgradeFrom as string | undefined,
    });
    await refreshCurrentUser();
  };

  const loadRazorpayScript = async () => {
    if ((window as RazorpayWindow).Razorpay) return true;

    return await new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const startPayment = async () => {
    setPaymentError("");
    setPaymentSuccess("");
    setPaymentLoading(true);

    try {
      if (amountDue <= 0) {
        await persistSelectedPlan(`coupon-covered-${Date.now()}`, 0);
        setPaymentSuccess(`Your ${selectedPlan.name} has been saved to your account.`);
        setTimeout(redirectToPricing, 800);
        return;
      }

      if (!RAZORPAY_KEY_ID) {
        setPaymentError("Razorpay key is missing from the frontend env.");
        setPaymentLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setPaymentError("Unable to load Razorpay checkout.");
        setPaymentLoading(false);
        return;
      }

      const RazorpayCtor = (window as RazorpayWindow).Razorpay;
      if (!RazorpayCtor) {
        setPaymentError("Razorpay checkout is not available.");
        setPaymentLoading(false);
        return;
      }

      const razorpay = new RazorpayCtor({
        key: RAZORPAY_KEY_ID,
        amount: amountDue * 100,
        currency: "INR",
        name: "Saadhyam AI",
        description: `${selectedPlan.name} subscription`,
        prefill: {
          name: "Saadhyam Customer",
          email: "customer@example.com",
        },
        notes: {
          plan_key: selectedPlan.key,
          coupon_code: coupon?.code || "",
          original_amount: String(subtotal),
          discount_amount: String(discountAmount),
          upgrade_from: upgradeFrom || "",
          current_paid: String(currentPaid || 0),
        },
        theme: {
          color: "#7c3aed",
        },
        handler: (response) => {
          void (async () => {
            try {
              await persistSelectedPlan(
                response.razorpay_payment_id || response.razorpay_order_id || `razorpay-${Date.now()}`,
                amountDue,
              );
              setPaymentSuccess(
                response.razorpay_payment_id
                  ? `Payment completed successfully. Ref: ${response.razorpay_payment_id}. Pack saved in your account.`
                  : "Payment completed successfully. Pack saved in your account.",
              );
              setTimeout(redirectToPricing, 800);
            } catch (error) {
              setPaymentError(error instanceof Error ? error.message : "Payment succeeded but saving the pack failed.");
            } finally {
              setPaymentLoading(false);
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      });

      razorpay.open();
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to start payment.");
      setPaymentLoading(false);
    }
  };

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
                {paymentError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                ) : null}
                {paymentSuccess ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {paymentSuccess}
                  </div>
                ) : null}
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
                {paymentError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                ) : null}
                {paymentSuccess ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {paymentSuccess}
                  </div>
                ) : null}
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Razorpay test checkout is wired for this step using the frontend env key only. After a successful payment, you will be taken back to Pricing and the chosen pack will be refreshed.
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="hero" onClick={startPayment} disabled={paymentLoading}>
                    {paymentLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    {amountDue === 0 ? "Mark as paid" : "Pay with Razorpay"}
                  </Button>
                  <Button variant="outline" onClick={() => setPaymentStep(false)}>
                    Go back to coupon step
                  </Button>
                </div>
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