import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useState } from "react";
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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NavContent = () => (
    <nav
      className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide"
      style={
        {
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties
      }
    >
      {items.map((it) => {
        const active = it.exact
          ? pathname === it.to
          : pathname === it.to || pathname.startsWith(it.to + "/");
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to as "/dashboard"}
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              active
                ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-lg shadow-purple-500/20"
                : "text-gray-700 hover:bg-[#F9F7FF] hover:text-purple-700"
            }`}
          >
            <Icon
              size={18}
              className={active ? "text-white" : "text-gray-400 group-hover:text-purple-600"}
            />
            <span className="flex-1">{it.label}</span>
            {active && <ChevronRight size={14} className="text-white" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white border border-purple-200 shadow-lg hover:bg-purple-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X size={24} className="text-purple-600" />
        ) : (
          <Menu size={24} className="text-purple-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-purple-200 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 h-14 flex items-center border-b border-purple-200">
          <Logo size="sm" />
        </div>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-purple-200 bg-white h-screen sticky top-0">
        <div className="px-4 h-14 flex items-center border-b border-purple-200">
          <Logo size="sm" />
        </div>
        <NavContent />
      </aside>
    </>
  );
}
