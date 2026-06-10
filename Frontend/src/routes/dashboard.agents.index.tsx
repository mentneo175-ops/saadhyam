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
  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Hero Section */}
      <div className="space-y-3">
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
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-2xl border border-purple-200 p-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 dark:border-slate-800">
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
    </div>
  );
}
