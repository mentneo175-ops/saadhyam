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
import { Loader } from "@/components/ui/loader";

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <motion.div {...fadeSlide} className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
          <Sparkles className="h-3 w-3" />
          AI-Powered Growth
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        {lastUpdated && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
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
          className="mt-1 flex shrink-0 justify-end gap-2"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}

export type SEOTabId = "seo" | "maps" | "integrations" | "analytics" | "search-console" | "business-insights";

export function SEOTabSwitcher({
  activeTab,
  onTabChange,
  isGoogleConnected = false,
}: {
  activeTab: SEOTabId;
  onTabChange: (tab: SEOTabId) => void;
  isGoogleConnected?: boolean;
}) {
  const tabs: { id: SEOTabId; label: string; icon: typeof Search }[] = [
    { id: "seo", label: "SEO Recommendations", icon: Search },
    { id: "maps", label: "Maps Optimization", icon: Map },
    { id: "integrations", label: "Google API Suite", icon: Globe },
    ...(isGoogleConnected ? [
      { id: "search-console" as SEOTabId, label: "Search Console", icon: Search },
      { id: "analytics" as SEOTabId, label: "Google Analytics", icon: TrendingUp },
      { id: "business-insights" as SEOTabId, label: "Business Insights", icon: MapPin },
    ] : [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-1 shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-md dark:border-slate-700"
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
              "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
              isActive ? "text-white" : "text-slate-400 hover:text-slate-200",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="seo-tab-pill"
                className="absolute inset-0 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 dark:border-slate-700"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", isActive && "text-purple-400")} />
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
  headerActions,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Search;
  children: ReactNode;
  className?: string;
  delay?: number;
  headerActions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32 }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 md:p-6",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.32 }}
          className="flex items-start gap-3"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_4px_20px_rgba(168,85,247,0.25)]"
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.32 }}
          >
            <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
          </motion.div>
        </motion.div>
        {headerActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.32 }}
          >
            {headerActions}
          </motion.div>
        )}
      </div>
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
      className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-slate-700 md:p-5 dark:border-slate-700"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
        >
          <Icon className="h-4 w-4" />
        </motion.div>
        {delta && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            {delta}
          </span>
        )}
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="mt-3 text-xs font-medium text-slate-400"
      >
        {label}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        className="mt-1 text-2xl font-bold tracking-tight text-white"
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

export function QuickActionsGrid({ 
  delay = 0.3,
  onAction
}: { 
  delay?: number;
  onAction?: (title: string) => void;
}) {
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
      {items.map((item, idx) => {
        const handleClick = (e: React.MouseEvent) => {
          if (onAction) {
            e.preventDefault();
            onAction(item.title);
          }
        };

        return (
          <motion.a
            key={item.title}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + idx * 0.06 }}
            whileHover={{ y: -4 }}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgba(168,85,247,0.04)] dark:border-slate-700"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_4px_20px_rgba(168,85,247,0.25)] transition-transform group-hover:scale-105">
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-semibold text-white">{item.title}</h4>
            <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-400">
              Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.a>
        );
      })}
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
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 dark:border-slate-700"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <motion.div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_4px_20px_rgba(168,85,247,0.25)]">
          <Sparkles className="h-5 w-5 text-white" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">Pro Tips for Local SEO Success</h3>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            {tips.map((tip, idx) => (
              <motion.div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                <span className="text-sm text-slate-400">{tip}</span>
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
      className="flex flex-col items-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 px-6 py-14 text-center dark:border-slate-700"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10">
        <Search className="h-7 w-7 text-purple-400" />
      </div>
      <p className="font-medium text-white">No insights yet</p>
      <p className="mt-1 max-w-sm text-sm text-slate-400">
        {message ?? "Run a business analysis to unlock personalized SEO recommendations."}
      </p>
    </motion.div>
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader text={message ?? "Loading insights"} />
    </div>
  );
}

export function AnalyzingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader text={message ?? "Analyzing SEO opportunities"} />
      <p className="mt-1 text-xs text-slate-400">This may take 2–3 minutes</p>
      <span className="mt-4 inline-flex items-center gap-1 text-[10px] rounded-full border border-purple-500/20 bg-purple-500/5 px-2.5 py-0.5 font-medium text-purple-400">
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
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_4px_20px_rgba(168,85,247,0.25)]">
        <Search className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-white">No analysis found</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">
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
      <p className="text-lg font-semibold text-white">Analysis failed</p>
      <p className="mt-2 text-sm text-slate-400">{error}</p>
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
          <Label className="flex items-center gap-1.5 text-slate-350">
            <MapPin className="h-3.5 w-3.5 text-purple-400" />
            Business type
          </Label>
          <Input
            value={businessType}
            onChange={(e) => onBusinessTypeChange(e.target.value)}
            placeholder="E.g., Dental Clinic, Salon, Restaurant"
            className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-900"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-1.5 text-slate-350">
            <Globe className="h-3.5 w-3.5 text-purple-400" />
            Location
          </Label>
          <Input
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="E.g., Hyderabad, Banjara Hills"
            className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:ring-1 focus:ring-purple-500 focus:border-transparent dark:border-slate-700 dark:bg-slate-900"
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
