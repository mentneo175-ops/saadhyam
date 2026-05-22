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
  Menu,
  X,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
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
  { to: "/dashboard/instagram", label: "Instagram", icon: Instagram },
  { to: "/dashboard/meta-ads", label: "Meta Ads", icon: Megaphone },
  { to: "/dashboard/whatsapp", label: "WhatsApp Sales", icon: MessageSquare },
  { to: "/dashboard/voice-agent", label: "AI Voice Agent", icon: Phone },
  { to: "/dashboard/website", label: "Website AI", icon: FileText },
  { to: "/dashboard/review-reply", label: "Review Reply", icon: MessageSquare },
  // { to: "/dashboard/automation", label: "Automation", icon: Workflow },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMinimized, toggleMinimized } = useSidebar();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NavItem = ({ item, isMinimized = false }: { item: NavItem; isMinimized?: boolean }) => {
    const active = item.exact
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(item.to + "/");
    const Icon = item.icon;
    
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
            <span className="flex-1">{item.label}</span>
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
            <NavItem key={item.to} item={item} isMinimized={isMinimized} />
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 right-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        <div className="relative w-5 h-5">
          {isMobileMenuOpen ? (
            <ArrowLeft size={20} className="text-gray-600 absolute inset-0 transition-all duration-200" />
          ) : (
            <Menu size={20} className="text-gray-600 absolute inset-0 transition-all duration-200" />
          )}
        </div>
      </button>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
        isMobileMenuOpen ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        />
        
        {/* Mobile Sidebar Panel */}
        <aside className={`app-sidebar absolute right-0 top-0 h-full w-64 bg-sidebar border-l border-sidebar-border sidebar-transition ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Header */}
          <div className="px-4 h-14 flex items-center justify-between border-b border-sidebar-border">
            <Logo size="sm" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-invisible">
            {items.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
