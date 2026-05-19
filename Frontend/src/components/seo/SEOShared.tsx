import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Globe,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fadeSlide = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

export function SEOPageHeader({
  title,
  subtitle,
  lastUpdated,
  actions,
}: {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <motion.div {...fadeSlide}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          AI-Powered Growth
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        {lastUpdated && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </motion.div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="flex shrink-0 gap-2"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}

export type SEOTabId = "seo" | "maps";

export function SEOTabSwitcher({
  activeTab,
  onTabChange,
}: {
  activeTab: SEOTabId;
  onTabChange: (tab: SEOTabId) => void;
}) {
  const tabs: { id: SEOTabId; label: string; icon: typeof Search }[] = [
    { id: "seo", label: "SEO", icon: Search },
    { id: "maps", label: "Google Maps", icon: Map },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="inline-flex rounded-2xl border border-border/70 bg-muted/40 p-1 shadow-soft"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="seo-tab-pill"
                className="absolute inset-0 rounded-xl bg-card shadow-soft border border-border/50"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {tab.label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Search;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32 }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated md:p-6",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.32 }}
        className="mb-5 flex items-start gap-3"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow"
        >
          <Icon className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.32 }}
        >
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </motion.div>
      </motion.div>
      {children}
    </motion.div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: typeof TrendingUp;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="group rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-shadow hover:shadow-elevated md:p-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <Icon className="h-4 w-4" />
        </motion.div>
        {delta && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {delta}
          </span>
        )}
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="mt-3 text-xs font-medium text-muted-foreground"
      >
        {label}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="mt-1 text-2xl font-bold tracking-tight text-foreground"
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

export function QuickActionsGrid({ delay = 0.3 }: { delay?: number }) {
  const items = [
    {
      icon: MapPin,
      title: "Google Business Profile",
      desc: "Claim and optimize your profile",
      link: "https://business.google.com",
    },
    {
      icon: Search,
      title: "Search Console",
      desc: "Monitor search performance",
      link: "https://search.google.com/search-console",
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      desc: "Track your website traffic",
      link: "https://analytics.google.com",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="grid gap-4 md:grid-cols-3"
    >
      {items.map((item, idx) => (
        <motion.a
          key={item.title}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + idx * 0.06 }}
          whileHover={{ y: -4 }}
          className="group rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all hover:border-primary/25 hover:shadow-elevated"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-105">
            <item.icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <h4 className="font-semibold text-foreground">{item.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </motion.a>
      ))}
    </motion.div>
  );
}

export function ProTipsBanner({ delay = 0.4 }: { delay?: number }) {
  const tips = [
    "Encourage customers to leave Google reviews regularly",
    "Keep business hours and contact info up to date",
    "Post regular updates and photos to your profile",
    "Respond to all reviews within 24 hours",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-soft p-5 md:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <motion.div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">Pro Tips for Local SEO Success</h3>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            {tips.map((tip, idx) => (
              <motion.div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{tip}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function EmptyInsightsState({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Search className="h-7 w-7 text-primary" />
      </div>
      <p className="font-medium text-foreground">No insights yet</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? "Run a business analysis to unlock personalized SEO recommendations."}
      </p>
    </motion.div>
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
      <p className="font-medium text-foreground">{message ?? "Loading insights…"}</p>
    </div>
  );
}

export function AnalyzingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow"
      >
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </motion.div>
      <p className="font-medium text-foreground">{message ?? "Analyzing SEO opportunities…"}</p>
      <p className="mt-1 text-sm text-muted-foreground">This may take 2–3 minutes</p>
      <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3 w-3" />
        AI-Powered Analysis
      </span>
    </div>
  );
}

export function NotStartedState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-16 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
        <Search className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground">No analysis found</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Run a business analysis first to get personalized SEO and local visibility recommendations.
      </p>
      <Button variant="hero" size="lg" className="mt-6 gap-2" onClick={onNavigate}>
        <Sparkles className="h-4 w-4" />
        Go to Business Analysis
      </Button>
    </motion.div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"
    >
      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
      <p className="text-lg font-semibold text-foreground">Analysis failed</p>
      <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      <Button variant="default" className="mt-6 gap-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </motion.div>
  );
}

export function AnalyzeBusinessForm({
  businessType,
  location,
  loading,
  onBusinessTypeChange,
  onLocationChange,
  onSubmit,
}: {
  businessType: string;
  location: string;
  loading: boolean;
  onBusinessTypeChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <SectionCard
      title="Analyze your business"
      subtitle="Get AI-powered SEO insights tailored for your location"
      icon={Search}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-1.5 text-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Business type
          </Label>
          <Input
            value={businessType}
            onChange={(e) => onBusinessTypeChange(e.target.value)}
            placeholder="E.g., Dental Clinic, Salon, Restaurant"
            className="h-11 rounded-xl border-border bg-background"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-1.5 text-foreground">
            <Globe className="h-3.5 w-3.5 text-primary" />
            Location
          </Label>
          <Input
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="E.g., Hyderabad, Banjara Hills"
            className="h-11 rounded-xl border-border bg-background"
          />
        </motion.div>
      </div>
      <Button
        variant="hero"
        size="lg"
        className="mt-6 w-full gap-2"
        disabled={loading}
        onClick={onSubmit}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate SEO insights
          </>
        )}
      </Button>
    </SectionCard>
  );
}

export function TabContentWrapper({
  tabKey,
  children,
}: {
  tabKey: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={tabKey} {...fadeSlide}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
