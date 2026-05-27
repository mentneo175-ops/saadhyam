import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useState } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
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
  { to: "/dashboard/business-analysis", label: "Business Analysis", icon: Sparkles },
  { to: "/dashboard/agents", label: "AI Agents", icon: Bot },
  { to: "/dashboard/competitor-analysis", label: "Competitor Analysis", icon: Users },
  { to: "/dashboard/daily-ask", label: "Daily Suggestions", icon: Calendar },
  { to: "/dashboard/aeo-geo", label: "AEO & GEO", icon: Brain },
  { to: "/dashboard/seo-google-maps", label: "SEO & Google Maps", icon: Search },
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
  { to: "/dashboard/pricing", label: "Pricing", icon: DollarSign },
  // { to: "/dashboard/automation", label: "Automation", icon: Workflow },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { isMinimized, toggleMinimized, isMobileMenuOpen, setIsMobileMenuOpen, toggleMobileMenu } = useSidebar();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ "Social Media": true });

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
                : "text-gray-700 hover:bg-[#F9F7FF] hover:text-purple-700"
            } ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? item.label : undefined}
          >
            <Icon
              size={18}
              className={isAnyChildActive ? "text-purple-600" : "text-gray-400 group-hover:text-purple-600"}
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
                return (
                  <Link
                    key={child.to}
                    to={child.to as "/dashboard"}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      childActive
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-purple-500/10 font-semibold"
                        : "text-gray-600 hover:bg-purple-50/50 hover:text-purple-700"
                    }`}
                  >
                    <ChildIcon size={14} className={childActive ? "text-white" : "text-gray-400"} />
                    <span>{child.label}</span>
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
    
    return (
      <Link
        key={item.to}
        to={item.to as "/dashboard"}
        onClick={closeMobileMenu}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          active
            ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-lg shadow-purple-500/20"
            : "text-gray-700 hover:bg-[#F9F7FF] hover:text-purple-700"
        } ${isMinimized ? 'justify-center' : ''}`}
        title={isMinimized ? item.label : undefined}
      >
        <Icon
          size={18}
          className={active ? "text-white" : "text-gray-400 group-hover:text-purple-600"}
        />
        {!isMinimized && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {active && <ChevronRight size={14} className="text-white" />}
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
