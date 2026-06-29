import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  Handshake,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Zap,
  CheckCircle2,
  Users,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/agents/")({
  head: () => ({ meta: [{ title: "AI Agents — Saadhyam AI" }] }),
  component: AgentsIndexPage,
});

interface Agent {
  id: string;
  title: string;
  description: string;
  icon: typeof Bot;
  iconBg: string;
  iconColor: string;
  features: string[];
  route: string;
  status: "active" | "coming-soon";
}

const agents: Agent[] = [
  {
    id: "partnership",
    title: "Partnership Agent",
    description:
      "Discover influencer collaborations and brand partnerships to amplify your reach",
    icon: Handshake,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    features: [
      "Find perfect influencer matches",
      "Brand collaboration opportunities",
      "Campaign strategy recommendations",
      "ROI-focused partnership plans",
    ],
    route: "/dashboard/agents/partnership",
    status: "active",
  },
  {
    id: "customer-retention",
    title: "Customer Retention Agent",
    description:
      "Analyze customer behavior, reduce churn, and increase repeat business using AI",
    icon: Users,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    features: [
      "Identify inactive customers",
      "Detect churn risk patterns",
      "Find loyal customer segments",
      "Generate retention strategies",
    ],
    route: "/dashboard/agents/customer-retention",
    status: "active",
  },
  {
    id: "content",
    title: "Content Agent",
    description:
      "AI-powered content creation for social media, blogs, and marketing campaigns",
    icon: Sparkles,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    features: [
      "Generate engaging content",
      "Multi-platform optimization",
      "Brand voice consistency",
      "Content calendar planning",
    ],
    route: "/dashboard/content",
    status: "active",
  },
  {
    id: "business-analysis",
    title: "Business Analysis Agent",
    description:
      "Comprehensive business insights with market analysis and growth strategies",
    icon: TrendingUp,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    features: [
      "SWOT analysis",
      "Market opportunity insights",
      "Competitor intelligence",
      "Growth recommendations",
    ],
    route: "/dashboard/business-analysis",
    status: "active",
  },
];

function AgentsIndexPage() {
  // Onboarding Tour states
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [activeTourSteps, setActiveTourSteps] = useState<any[]>([]);

  const tourStepsConfig = [
    {
      id: "tour-agents-info",
      title: "Team Overview",
      heading: "1. Specialized AI Team",
      desc: "Each agent in the command center is trained for specific business objectives, executing scripts 24/7.",
      indicator: 1
    },
    {
      id: "tour-agents-grid",
      title: "Active AI Agents",
      heading: "2. Launch Agents",
      desc: "Launch the Partnership Agent, Customer Retention Agent, or Business SWOT analysis tools directly.",
      indicator: 2
    },
    {
      id: "tour-agents-coming-soon",
      title: "Expanding Lineup",
      heading: "3. Future Agents Roadmap",
      desc: "We regularly update the platform with new specialized agents to automate additional business modules.",
      indicator: 3
    }
  ];

  // Auto-trigger tour for new users once loaded
  useEffect(() => {
    const isCompleted = localStorage.getItem("saadhyam_tour_agents_completed");
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
        setTourStep(1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Filter active steps based on DOM presence
  useEffect(() => {
    if (isTourActive) {
      const active = tourStepsConfig.filter(step => !!document.getElementById(step.id));
      setActiveTourSteps(active);
      if (tourStep > active.length && active.length > 0) {
        setTourStep(1);
      }
    }
  }, [isTourActive]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (currentStepConfig) {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }
    }
  }, [tourStep, isTourActive, activeTourSteps]);

  // Position tracking logic supporting scrolling and window resizing
  useEffect(() => {
    if (!isTourActive || activeTourSteps.length === 0) return;

    const currentStepConfig = activeTourSteps[tourStep - 1];
    if (!currentStepConfig) return;

    const updatePosition = () => {
      const element = document.getElementById(currentStepConfig.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        setHighlightStyle({
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          position: "fixed",
          borderRadius: "16px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 4px rgba(139, 92, 246, 0.4)",
          border: "2px solid #8B5CF6",
          zIndex: 9999,
          pointerEvents: "none",
          transition: "all 0.15s ease-out",
        });

        const spaceBelow = window.innerHeight - rect.bottom;
        const placeBelow = spaceBelow > 260 || rect.top < 260;

        setTooltipStyle({
          top: placeBelow ? rect.bottom + 12 : rect.top - 280,
          left: Math.max(16, Math.min(window.innerWidth - 340, rect.left + rect.width / 2 - 160)),
          position: "fixed",
          zIndex: 10000,
          width: "320px",
          transition: "all 0.15s ease-out",
        });
      }
    };

    updatePosition();
    const timer1 = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 400);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [tourStep, isTourActive, activeTourSteps]);
  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Hero Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              Your AI-Powered Business Team
            </h1>
            <p className="text-gray-600 mt-1">
              Intelligent agents working 24/7 to grow your business
            </p>
          </div>
        </div>
        <button
          id="tour-btn-agents-help"
          type="button"
          className="p-2 rounded-xl bg-slate-900 border border-slate-805/40 text-slate-400 hover:bg-slate-800 hover:text-purple-400 shadow-xs transition-all cursor-pointer dark:border-slate-800 shrink-0"
          onClick={() => {
            setIsTourActive(true);
            setTourStep(1);
          }}
          title="Start Guided Tour"
        >
          <HelpCircle size={16} />
        </button>
      </div>

      {/* Info Banner */}
      <div id="tour-agents-info" className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-2xl border border-purple-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
            <Zap size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1 dark:text-slate-100">
              Specialized AI Agents for Every Business Need
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed dark:text-slate-300">
              Each agent is trained on specific business tasks - from finding partnership
              opportunities to creating content and analyzing your market. Choose an agent
              below to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div id="tour-agents-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = agent.status === "active";

          return (
            <Link
              key={agent.id}
              to={agent.route as any}
              disabled={!isActive}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-6 transition-all ${
                isActive
                  ? "hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              {/* Status Badge */}
              {!isActive && (
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={`h-14 w-14 rounded-2xl ${agent.iconBg} flex items-center justify-center mb-4 ${
                  isActive ? "group-hover:scale-110" : ""
                } transition-transform`}
              >
                <Icon size={28} className={agent.iconColor} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-slate-100">{agent.title}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {agent.description}
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-5">
                {agent.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                    <CheckCircle2
                      size={16}
                      className={`${agent.iconColor} shrink-0 mt-0.5`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              {isActive && (
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:gap-3 transition-all">
                  <span>Launch Agent</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div id="tour-agents-coming-soon" className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1 dark:text-slate-100">
              More AI Agents Coming Soon
            </h3>
            <p className="text-sm text-gray-600">
              We're building more specialized agents to automate every aspect of your business
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>{agents.filter((a) => a.status === "active").length} Active</span>
          </div>
        </div>
      </div>
      {/* Interactive Guided Tour Overlay */}
      {isTourActive && (
        <div className="fixed inset-0 z-[9998] pointer-events-none text-slate-100">
          {/* Highlight element mask */}
          {highlightStyle.top !== undefined && (
            <div
              style={highlightStyle}
              className="fixed transition-all duration-200 ease-out pointer-events-none"
            />
          )}

          {/* Full-screen click interceptor mask for everything EXCEPT the highlighted area */}
          <div className="fixed inset-0 bg-transparent pointer-events-auto z-[998]" onClick={() => setIsTourActive(false)} />

          {/* Interactive Tooltip popup */}
          {tooltipStyle.top !== undefined && activeTourSteps[tourStep - 1] && (
            <div
              style={tooltipStyle}
              className="bg-slate-900 border border-purple-500/30 p-5 z-[10000] w-[320px] shadow-2xl rounded-2xl animate-fade-in pointer-events-auto flex flex-col gap-4 text-white"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {activeTourSteps[tourStep - 1].title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {tourStep} / {activeTourSteps.length}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <h3 className="font-extrabold text-white text-sm">
                  {activeTourSteps[tourStep - 1].heading}
                </h3>
                <p className="text-slate-300 leading-normal text-[11px]">
                  {activeTourSteps[tourStep - 1].desc}
                </p>
              </div>

              {/* Animated visual indicators */}
              <div className="h-16 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden relative">
                {activeTourSteps[tourStep - 1].indicator === 1 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Zap size={14} className="animate-bounce text-purple-400" />
                    <span>Specialized workflows loaded</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 2 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400">
                    <Bot size={14} className="animate-spin text-purple-400" />
                    <span>Launch active agents</span>
                  </div>
                )}
                {activeTourSteps[tourStep - 1].indicator === 3 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Future integrations queue</span>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white transition-all border border-transparent hover:bg-white/5 rounded cursor-pointer"
                  onClick={() => setIsTourActive(false)}
                >
                  Skip
                </button>
                <div className="flex items-center gap-1.5">
                  {tourStep > 1 && (
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] text-slate-300 hover:text-white border border-white/10 rounded cursor-pointer"
                      onClick={() => setTourStep(tourStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-3 py-1 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold cursor-pointer"
                    onClick={() => {
                      if (tourStep < activeTourSteps.length) {
                        setTourStep(tourStep + 1);
                      } else {
                        setIsTourActive(false);
                        localStorage.setItem("saadhyam_tour_agents_completed", "true");
                      }
                    }}
                  >
                    {tourStep === activeTourSteps.length ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
