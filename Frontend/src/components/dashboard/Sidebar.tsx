import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useState, useEffect } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { getAdminApiBaseUrl } from "@/lib/runtimeUrls";
import {
  LayoutDashboard,
  CheckSquare,
  Wand2,
  Users,
  MessageSquare,
  LineChart,
  Map,
  Eye,
  FileText,
  Workflow,
  Settings,
  Sparkles,
  ChevronRight,
  Instagram,
  Calendar,
  Search,
  Target,
  Bot,
  Brain,
  Zap,
  BookOpen,
  Network,
  Megaphone,
  Phone,
  DollarSign,
  Menu,
  X,
  ChevronLeft,
  ArrowLeft,
  Youtube,
  Share2,
  LifeBuoy,
  Radio,
  Puzzle,
  ShoppingBag,
  Lock,
} from "lucide-react";

type SubNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavItem = {
  to?: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  children?: SubNavItem[];
};

const items: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/problems", label: "Problem Discovery", icon: Zap },
  { to: "/dashboard/business-analysis", label: "Business Analysis", icon: Sparkles },
  { to: "/dashboard/radar", label: "Radar AI", icon: Radio },
  { to: "/dashboard/agents", label: "AI Agents", icon: Bot },
  { to: "/dashboard/competitor-analysis", label: "Competitor Analysis", icon: Users },
  { to: "/dashboard/daily-ask", label: "Daily Suggestions", icon: Calendar },
  { to: "/dashboard/aeo-geo", label: "AEO & GEO", icon: Brain },
  { to: "/dashboard/seo-google-maps", label: "Google Hub", icon: Search },
  { to: "/dashboard/b2b-network", label: "B2B Network", icon: Network },
  { to: "/dashboard/b2b-chat", label: "B2B Chat", icon: MessageSquare },
  { to: "/dashboard/content", label: "Content Creator", icon: Wand2 },
  {
    label: "Social Media",
    icon: Share2,
    children: [
      { to: "/dashboard/instagram", label: "Instagram", icon: Instagram },
      { to: "/dashboard/youtube", label: "YouTube", icon: Youtube },
    ],
  },
  { to: "/dashboard/meta-ads", label: "Meta Ads", icon: Megaphone },
  { to: "/dashboard/whatsapp", label: "WhatsApp Sales", icon: MessageSquare },
  { to: "/dashboard/voice-agent", label: "AI Voice Agent", icon: Phone },
  { to: "/dashboard/website", label: "Website AI", icon: FileText },
  { to: "/dashboard/review-reply", label: "Review Reply", icon: MessageSquare },
  { to: "/dashboard/plugins", label: "Plugins Store", icon: Puzzle },
  { to: "/dashboard/store", label: "Store", icon: ShoppingBag },
  { to: "/dashboard/pricing", label: "Pricing", icon: DollarSign },
  // { to: "/dashboard/automation", label: "Automation", icon: Workflow },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

function getFeatureKeyFromPath(pathname: string): string | null {
  const path = pathname.toLowerCase();
  if (path.includes("/dashboard/website")) return "website_ai";
  if (path.includes("/dashboard/content")) return "content_scheduler";
  if (path.includes("/dashboard/voice-agent")) return "voice_agent";
  if (path.includes("/dashboard/aeo-geo") || path.includes("/dashboard/seo") || path.includes("/dashboard/seo-google-maps")) return "aeo_geo";
  if (path.includes("/dashboard/instagram")) return "instagram_manager";
  if (path.includes("/dashboard/whatsapp")) return "whatsapp_campaigns";
  if (path.includes("/dashboard/b2b-network") || path.includes("/dashboard/b2b-chat")) return "b2b_network";
  if (path.includes("/dashboard/meta-ads")) return "meta_ads";
  if (path.includes("/dashboard/business-analysis")) return "business_analysis";
  if (path.includes("/dashboard/competitor-analysis")) return "competitor_analysis";
  if (path.includes("/dashboard/daily-ask")) return "daily_suggestions";
  if (path.includes("/dashboard/radar")) return "radar_ai";
  if (path.includes("/dashboard/agents")) return "ai_agents";
  if (path.includes("/dashboard/youtube")) return "youtube_manager";
  if (path.includes("/dashboard/review-reply")) return "review_reply";
  if (path.includes("/dashboard/plugins")) return "plugins_store";
  if (path.includes("/dashboard/store")) return "store";
  if (path.includes("/dashboard/reports") || path.includes("/dashboard/insights") || path.includes("/dashboard/growth")) return "reports_insights";
  if (path.includes("/dashboard/assistant")) return "assistant";
  return null;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { isMinimized, toggleMinimized, isMobileMenuOpen, setIsMobileMenuOpen, toggleMobileMenu } = useSidebar();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Social Media": true });
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchFlags = async () => {
      try {
        const adminUrl = getAdminApiBaseUrl();
        const res = await fetch(`${adminUrl}/api/features/public`);
        if (res.ok && active) {
          const flags = await res.json();
          setFeatures(flags);
        }
      } catch (err) {
        console.error("Failed to fetch public feature flags in Sidebar", err);
      }
    };
    fetchFlags();
    const interval = setInterval(fetchFlags, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const NavItemComponent = ({ item, isMinimized = false }: { item: NavItem; isMinimized?: boolean }) => {
    const Icon = item.icon;

    if (item.children) {
      const isOpen = openMenus[item.label];
      const isAnyChildActive = item.children.some((child) =>
        pathname === child.to || pathname.startsWith(child.to + "/")
      );

      return (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleMenu(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
              isAnyChildActive
                ? "text-purple-700 bg-purple-500/5 font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-[#F9F7FF] dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400"
            } ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? item.label : undefined}
          >
            <Icon
              size={18}
              className={isAnyChildActive ? "text-purple-600" : "text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"}
            />
            {!isMinimized && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight
                  size={14}
                  className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-purple-600' : ''}`}
                />
              </>
            )}
          </button>

          {isOpen && !isMinimized && (
            <div className="pl-6 space-y-1 transition-all duration-200 animate-slide-down">
              {item.children.map((child) => {
                const childActive = pathname === child.to || pathname.startsWith(child.to + "/");
                const ChildIcon = child.icon;

                // CHECK FEATURE GATING
                const routeKey = child.to ? getFeatureKeyFromPath(child.to) : null;
                const featureFlag = routeKey ? features.find(f => f.key === routeKey) : null;
                const isBlocked = featureFlag && featureFlag.status !== "enabled";

                const handleChildClick = (e: React.MouseEvent) => {
                  if (isBlocked) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("feature-blocked", {
                      detail: {
                        feature_key: routeKey,
                        mode: featureFlag.status,
                        detail: featureFlag.reason || `This feature is currently ${featureFlag.status}.`
                      }
                    }));
                  } else {
                    closeMobileMenu();
                  }
                };

                return (
                  <Link
                    key={child.to}
                    to={child.to as "/dashboard"}
                    onClick={handleChildClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all relative group/item ${
                      childActive
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-purple-500/10 font-semibold"
                        : isBlocked
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed hover:bg-amber-500/5 hover:text-amber-600"
                        : "text-gray-600 dark:text-gray-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400"
                    }`}
                  >
                    <ChildIcon size={14} className={childActive ? "text-white" : isBlocked ? "text-gray-400 dark:text-gray-600" : "text-gray-400"} />
                    <span className="flex-1 truncate">{child.label}</span>
                    {isBlocked && (
                      <span className="shrink-0 flex items-center justify-center p-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover/item:bg-amber-500/15 group-hover/item:text-amber-600 group-hover/item:border-amber-500/35 transition-colors">
                        <Lock size={10} />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const active = item.exact
      ? pathname === item.to
      : pathname === item.to || (item.to && pathname.startsWith(item.to + "/"));

    // CHECK FEATURE GATING
    const routeKey = item.to ? getFeatureKeyFromPath(item.to) : null;
    const featureFlag = routeKey ? features.find(f => f.key === routeKey) : null;
    const isBlocked = featureFlag && featureFlag.status !== "enabled";

    const handleClick = (e: React.MouseEvent) => {
      if (isBlocked) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("feature-blocked", {
          detail: {
            feature_key: routeKey,
            mode: featureFlag.status,
            detail: featureFlag.reason || `This feature is currently ${featureFlag.status}.`
          }
        }));
      } else {
        closeMobileMenu();
      }
    };

    return (
      <Link
        key={item.to}
        to={item.to as "/dashboard"}
        onClick={handleClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          active
            ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-lg shadow-purple-500/20"
            : isBlocked
            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed hover:bg-amber-500/5 hover:text-amber-600"
            : "text-gray-700 dark:text-gray-300 hover:bg-[#F9F7FF] dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400"
        } ${isMinimized ? 'justify-center' : ''}`}
        title={isMinimized ? item.label : undefined}
      >
        <Icon
          size={18}
          className={active ? "text-white" : isBlocked ? "text-gray-400 dark:text-gray-600" : "text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"}
        />
        {!isMinimized && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {isBlocked ? (
              <span className="shrink-0 flex items-center justify-center p-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25 group-hover:bg-amber-500/15 group-hover:text-amber-600 group-hover:border-amber-500/35 transition-colors">
                <Lock size={12} />
              </span>
            ) : active ? (
              <ChevronRight size={14} className="text-white" />
            ) : null}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`app-sidebar hidden lg:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar h-screen fixed top-0 left-0 z-30 sidebar-transition ${
        isMinimized ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className={`h-14 flex items-center border-b border-sidebar-border transition-all duration-300 ${
          isMinimized ? 'px-2 justify-center' : 'px-4 justify-between'
        }`}>
          {!isMinimized && <Logo size="sm" />}
          <button
            onClick={toggleMinimized}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
          >
            <ChevronLeft
              size={16}
              className={`text-sidebar-foreground transition-transform duration-300 ${
                isMinimized ? 'rotate-180' : ''
              }`}
              />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-invisible">
          {items.map((item) => (
            <NavItemComponent key={item.label} item={item} isMinimized={isMinimized} />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar (z-index increased to z-[60] to overlay fixed header) */}
      <div className={`lg:hidden fixed inset-0 z-[60] transition-all duration-300 ${
        isMobileMenuOpen ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        />

        {/* Mobile Sidebar Panel (Slides from left-0 instead of right-0) */}
        <aside className={`app-sidebar absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border sidebar-transition ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header */}
          <div className="px-4 h-14 flex items-center justify-between border-b border-sidebar-border">
            <Logo size="sm" />
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              aria-label="Close menu"
            >
              <X size={18} className="text-sidebar-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-invisible">
            {items.map((item) => (
              <NavItemComponent key={item.label} item={item} />
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
