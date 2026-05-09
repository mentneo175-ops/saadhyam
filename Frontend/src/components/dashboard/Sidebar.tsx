import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
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
  Network,
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
  { to: "/dashboard/competitor-analysis", label: "Competitor Analysis", icon: Users },
  { to: "/dashboard/daily-ask", label: "Daily Suggestions", icon: Calendar },
  { to: "/dashboard/seo-google-maps", label: "SEO & Google Maps", icon: Search },
  { to: "/dashboard/b2b-network", label: "B2B Network", icon: Network },
  { to: "/dashboard/content", label: "Content Creator", icon: Wand2 },
  { to: "/dashboard/instagram", label: "Instagram", icon: Instagram },
  { to: "/dashboard/whatsapp", label: "WhatsApp Sales", icon: MessageSquare },
  { to: "/dashboard/website", label: "Website AI", icon: FileText },
  { to: "/dashboard/review-reply", label: "Review Reply", icon: MessageSquare },
  { to: "/dashboard/automation", label: "Automation", icon: Workflow },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="px-5 h-16 flex items-center border-b border-sidebar-border">
        <Logo />
      </div>
      <nav 
        className="flex-1 overflow-y-auto p-3 space-y-1" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.to
            : pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to as "/dashboard"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon
                size={18}
                className={
                  active ? "" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                }
              />
              <span className="flex-1">{it.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-2xl p-4 bg-gradient-soft border border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-secondary flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <p className="text-sm font-semibold">Upgrade to Pro</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock unlimited AI generations and advanced insights.
          </p>
          <button className="w-full text-xs font-semibold py-2 rounded-lg bg-gradient-primary text-primary-foreground hover:brightness-110 transition">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
