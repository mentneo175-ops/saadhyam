import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Sparkles,
  BarChart3,
  PenTool,
  MessageCircle,
  Check,
  Star,
  Zap,
  Search,
  Brain,
  TrendingUp,
  Globe,
  Bot,
  Target,
  PieChart,
  Rocket,
  Shield,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import LogoImage from "@/Icon/Saadhyam_Icon-removebg-preview.png";

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || "http://127.0.0.1:8082";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saadhyam AI — Get Discovered by Google, ChatGPT & AI Search" },
      {
        name: "description",
        content:
          "AI-powered visibility platform that optimizes your business for Google, ChatGPT, AI search engines, and voice assistants. Built for the future of search.",
      },
      { property: "og:title", content: "Saadhyam AI — AI Search Visibility Platform" },
      {
        property: "og:description",
        content:
          "Optimize your business for AI search engines, voice assistants, and generative AI platforms. The future of business discovery starts here.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Search,
    title: "AEO Optimization",
    desc: "Optimize your business for answer engines like ChatGPT, Perplexity, and voice assistants.",
    color: "from-purple-500 to-fuchsia-500",
    badge: "AI Search",
  },
  {
    icon: Brain,
    title: "GEO Optimization",
    desc: "Increase visibility across generative AI platforms and AI-powered search engines.",
    color: "from-pink-500 to-rose-500",
    badge: "Next-Gen",
  },
  {
    icon: MessageCircle,
    title: "Voice Search Ready",
    desc: "Improve discoverability in conversational and voice-based search queries.",
    color: "from-orange-500 to-amber-500",
    badge: "Voice AI",
  },
  {
    icon: TrendingUp,
    title: "AI Search Monitoring",
    desc: "Track how your business appears across AI search results and generative platforms.",
    color: "from-violet-500 to-purple-500",
    badge: "Analytics",
  },
  {
    icon: PenTool,
    title: "AI-First Content",
    desc: "Generate content optimized for both traditional SEO and AI search engines.",
    color: "from-emerald-500 to-teal-500",
    badge: "Content AI",
  },
  {
    icon: BarChart3,
    title: "Smart Insights",
    desc: "Deep analytics on SEO, AEO, and GEO performance with actionable recommendations.",
    color: "from-blue-500 to-indigo-500",
    badge: "Intelligence",
  },
];

const steps = [
  {
    num: "01",
    title: "Upload your business data",
    desc: "Share your business details, website, or documents. Our AI analyzes everything in minutes.",
  },
  {
    num: "02",
    title: "AI analyzes SEO + AEO + GEO",
    desc: "We scan Google rankings, AI search visibility, voice search readiness, and generative AI discoverability.",
  },
  {
    num: "03",
    title: "Get AI visibility strategy",
    desc: "Receive optimized content, AI search recommendations, and a complete visibility roadmap.",
  },
];

const testimonials = [
  {
    quote:
      "We're now showing up in ChatGPT responses and voice search results. Saadhyam made AI search optimization actually work for us.",
    name: "Priya Sharma",
    role: "Founder, Bloom Studio",
  },
  {
    quote: "Our AI visibility score went from 32% to 89% in 6 weeks. We're getting discovered by customers we never reached before.",
    name: "Rahul Mehta",
    role: "CEO, Crisp Foods",
  },
  {
    quote:
      "Finally, a platform that understands the future of search. We're ranking on Google AND appearing in AI-generated answers.",
    name: "Anjali Verma",
    role: "Marketing Lead, Lumen",
  },
];

type LandingPlan = {
  key: string;
  name: string;
  price: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const defaultTiers: LandingPlan[] = [
  {
    key: "starter",
    name: "Free",
    price: "$0",
    desc: "Test AI search optimization with no commitment.",
    features: [
      "5 AI generations / day",
      "Basic SEO + AEO analysis",
      "AI visibility score",
      "Community support",
    ],
    cta: "Start free",
    variant: "outline" as const,
  },
  {
    key: "growth",
    name: "Pro",
    price: "$29",
    desc: "Full AI search visibility for growing businesses.",
    features: [
      "Unlimited AI generations",
      "Advanced AEO + GEO optimization",
      "Voice search optimization",
      "AI search monitoring",
      "ChatGPT visibility tracking",
      "Priority support",
    ],
    cta: "Optimize My AI Visibility",
    variant: "hero" as const,
    highlighted: true,
  },
  {
    key: "premium",
    name: "Business",
    price: "$99",
    desc: "Enterprise AI discoverability with dedicated support.",
    features: [
      "Everything in Pro",
      "Multi-platform AI tracking",
      "Custom AI search strategy",
      "Dedicated AI specialist",
      "White-label reports",
      "API access",
    ],
    cta: "Get AI Search Ready",
    variant: "outline" as const,
  },
];

const defaultTierMap = Object.fromEntries(defaultTiers.map((tier) => [tier.key, tier]));

function normalizeLandingPlans(payload: unknown): LandingPlan[] {
  const list = Array.isArray(payload) ? payload : (payload as { plans?: unknown[] })?.plans || [];
  const byKey = new Map<string, LandingPlan>();

  list.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const plan = item as Record<string, any>;
    const key = String(plan.key || plan.id || plan.name || "").toLowerCase();
    if (!key) return;

    const fallback = defaultTierMap[key];
    byKey.set(key, {
      key,
      name: String(plan.name || fallback?.name || "Plan"),
      price: String(plan.price || fallback?.price || "$0"),
      desc: String(plan.description || plan.desc || fallback?.desc || ""),
      features: Array.isArray(plan.features)
        ? plan.features.map((feature: any) => String(feature)).filter(Boolean)
        : fallback?.features || [],
      cta: String(plan.cta || fallback?.cta || "Get started"),
      highlighted: Boolean(plan.highlighted || plan.featured || fallback?.highlighted),
    });
  });

  return defaultTiers.map((tier) => byKey.get(tier.key) || tier);
}

function Landing() {
  const [tiers, setTiers] = useState<LandingPlan[]>(defaultTiers);
  const [pricingState, setPricingState] = useState<"loading" | "live" | "fallback">("loading");

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      try {
        const response = await fetch(`/admin-api/api/public/billing-plans`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch live pricing");
        }

        const data = await response.json();
        if (!cancelled) {
          setTiers(normalizeLandingPlans(data));
          setPricingState("live");
        }
      } catch {
        if (!cancelled) {
          setTiers(defaultTiers);
          setPricingState("fallback");
        }
      }
    };

    loadPricing();
    const handleVisibilityRefresh = () => {
      if (!document.hidden) {
        loadPricing();
      }
    };

    window.addEventListener("focus", loadPricing);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    const refreshTimer = window.setInterval(loadPricing, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadPricing);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
      window.clearInterval(refreshTimer);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F8F7FC 0%, #F3F1F9 50%, #EDE9F6 100%)' }}>
      <Navbar />

      {/* Hero Section - Premium Design */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        
        {/* Large Flowing Logo Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Big flowing gradient shape with logo */}
          <div className="absolute top-0 right-0 w-[900px] h-[700px] opacity-40"
               style={{
                 background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.25) 50%, rgba(139, 92, 246, 0.1) 100%)',
                 borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                 transform: 'rotate(-15deg) translate(20%, -10%)',
                 filter: 'blur(60px)',
               }}>
          </div>
          
          {/* Large logo that merges with background */}
          <div className="absolute top-1/4 right-1/4 transform translate-x-1/4 -translate-y-1/4">
            <div className="relative">
              {/* Glow layers behind logo */}
              <div className="absolute inset-0 w-[450px] h-[450px] bg-gradient-to-br from-[#8B5CF6]/20 to-[#A855F7]/30 rounded-full blur-3xl"></div>
              <div className="absolute inset-0 w-[450px] h-[450px] bg-gradient-to-tl from-[#A855F7]/15 to-transparent rounded-full blur-2xl"></div>
              
              {/* Large logo with original colors */}
              <img 
                src={LogoImage} 
                alt="" 
                className="relative w-[450px] h-[450px] object-contain animate-float3d"
                style={{
                  filter: 'drop-shadow(0 30px 60px rgba(139, 92, 246, 0.4))',
                  opacity: 1,
                }}
              />
            </div>
          </div>

          {/* Flowing curved shape */}
          <svg className="absolute top-0 right-0 w-full h-full opacity-30" viewBox="0 0 800 800" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#A855F7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path 
              d="M 400,0 Q 600,200 800,300 L 800,0 Z" 
              fill="url(#flowGradient)"
              style={{
                animation: 'flowMove 20s ease-in-out infinite',
              }}
            />
          </svg>

          {/* Additional soft orbs */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#8B5CF6]/8 rounded-full blur-3xl animate-ambient-move"></div>
          <div className="absolute bottom-32 right-32 w-48 h-48 bg-[#A855F7]/10 rounded-full blur-2xl animate-ambient-move" style={{ animationDelay: '2s' }}></div>
          
          {/* Subtle particles - Fixed positions to avoid hydration mismatch */}
          {[...Array(20)].map((_, i) => {
            // Use deterministic values based on index instead of Math.random()
            const left = ((i * 37) % 100);
            const top = ((i * 53) % 100);
            const delay = ((i * 0.7) % 5);
            const duration = 8 + ((i * 0.5) % 8);
            
            return (
              <div
                key={i}
                className="absolute w-1 h-1 bg-[#8B5CF6]/40 rounded-full animate-particle-float"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
              />
            );
          })}
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Logo + Brand */}
              {/* <div className="flex items-center gap-3 mb-8">
                <img 
                  src={LogoImage} 
                  alt="Saadhyam AI" 
                  className="w-14 h-14 object-contain"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Saadhyam <span className="text-[#8B5CF6]">AI</span>
                  </h2>
                </div>
              </div> */}

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3EEFF] border border-[#E9D5FF]">
                <Sparkles size={16} className="text-[#8B5CF6]" />
                <span className="text-sm text-[#8B5CF6] font-semibold">Built for the AI Search Era</span>
              </div>

              {/* Hero Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-gray-900">
                Get discovered by <span className="text-[#8B5CF6]">Google, ChatGPT</span> & AI search
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                The AI visibility platform that optimizes your business for traditional search, AI engines, voice assistants, and generative AI platforms.
              </p>

              {/* AI Visibility Metrics Preview */}
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="glass-card rounded-2xl p-5 shadow-3d-soft">
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">89%</div>
                  <div className="text-sm text-gray-600 mt-1">AI Visibility Score</div>
                </div>
                <div className="glass-card rounded-2xl p-5 shadow-3d-soft">
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">12.4K</div>
                  <div className="text-sm text-gray-600 mt-1">AI Mentions/Month</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all"
                  asChild
                >
                  <Link to="/signup">
                    Optimize My AI Visibility <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base font-semibold border-2 border-[#8B5CF6]/30 hover:border-[#8B5CF6] hover:bg-[#F9F7FF] rounded-xl transition-all"
                  asChild
                >
                  <Link to="/dashboard">
                    <Play size={16} /> View demo
                  </Link>
                </Button>
              </div>

              {/* AI Search Platforms Row */}
              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-3 font-medium">Optimized for AI-powered discovery:</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { icon: Globe, name: "Google", color: "text-blue-600" },
                    { icon: Bot, name: "ChatGPT", color: "text-emerald-600" },
                    { icon: Sparkles, name: "Gemini", color: "text-purple-600" },
                    { icon: Brain, name: "Perplexity", color: "text-orange-600" },
                    { icon: Search, name: "Claude", color: "text-cyan-600" },
                  ].map((platform) => (
                    <div key={platform.name} className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-[#E9D5FF]/50">
                      <platform.icon size={14} className={platform.color} />
                      <span className="text-xs font-medium text-gray-700">{platform.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]"
                      style={{ filter: `hue-rotate(${i * 20}deg)` }}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-[#8B5CF6] text-[#8B5CF6]" />
                    ))}
                    <span className="ml-1 font-bold text-gray-900">4.9</span>
                  </div>
                  <p className="text-sm text-gray-600">from 2,400+ businesses</p>
                </div>
              </div>
            </div>

            {/* Right Side - 3D Floating Dashboard Cards */}
            <div className="relative h-[600px] perspective-container hidden lg:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-lg h-full">
                  
                  {/* Business Overview Card - Center */}
                  <div 
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 glass-premium rounded-3xl p-6 shadow-3d-float animate-float3d card-3d"
                    style={{ transform: 'translate(-50%, -50%) rotateX(2deg) rotateY(-2deg)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">Business Overview</h3>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center shadow-lg">
                        <PieChart className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Revenue</p>
                        <p className="text-xl font-bold text-gray-900">₹24.8K</p>
                        <p className="text-xs text-green-600 font-semibold">↑ 18.5%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Leads</p>
                        <p className="text-xl font-bold text-gray-900">612</p>
                        <p className="text-xs text-green-600 font-semibold">↑ 12.3%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Conversions</p>
                        <p className="text-xl font-bold text-gray-900">98</p>
                        <p className="text-xs text-green-600 font-semibold">↑ 8.7%</p>
                      </div>
                    </div>

                    {/* Mini chart */}
                    <svg className="w-full h-16" viewBox="0 0 300 60">
                      <path 
                        d="M0,50 Q75,25 150,30 T300,15" 
                        fill="none" 
                        stroke="url(#chartGradient)" 
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* AI Score Card - Top Right */}
                  <div 
                    className="absolute top-0 right-0 w-52 glass-premium rounded-2xl p-5 shadow-3d-soft animate-float3d-delayed card-3d"
                    style={{ transform: 'rotateX(-3deg) rotateY(3deg)', animationDelay: '0.5s' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-600">AI Score</p>
                      <Zap className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-4xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">85</span>
                      <span className="text-sm text-gray-400">/100</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full animate-glow-pulse"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Your business is growing 18.6% this month</p>
                  </div>

                  {/* Monthly Goal Card - Bottom Left */}
                  <div 
                    className="absolute bottom-0 left-0 w-48 glass-premium rounded-2xl p-5 shadow-3d-soft animate-float3d-slow card-3d"
                    style={{ transform: 'rotateX(3deg) rotateY(-3deg)', animationDelay: '1s' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-[#8B5CF6]" />
                      <p className="text-xs font-semibold text-gray-600">Monthly Goal</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-3">87%</p>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[87%] bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full"></div>
                    </div>
                  </div>

                  {/* Growth Trend Card - Top Left */}
                  <div 
                    className="absolute top-12 left-0 w-44 glass-premium rounded-2xl p-4 shadow-3d-soft animate-float3d card-3d"
                    style={{ transform: 'rotateX(-2deg) rotateY(-2deg)', animationDelay: '1.5s' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
                      <p className="text-xs font-semibold text-gray-600">Growth Trend</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mb-1">+24.5%</p>
                    <p className="text-xs text-gray-500">vs last month</p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3EEFF] border border-[#E9D5FF] mb-4">
            <Sparkles size={14} className="text-[#8B5CF6]" />
            <span className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
              AI Search Capabilities
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Rank beyond Google — Dominate AI search
          </h2>
          <p className="text-lg text-gray-600">
            Six AI-powered capabilities designed to maximize your visibility across traditional search, AI engines, and voice assistants.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className="group glass-card rounded-2xl p-7 border border-[#E9D5FF]/50 shadow-3d-soft hover:shadow-3d-float transition-all duration-300 relative overflow-hidden"
              style={{
                animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
              }}
            >
              {/* Badge */}
              <div className="absolute top-5 right-5">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-[#F3EEFF] to-[#EDE9FE] text-[#8B5CF6] border border-[#E9D5FF]">
                  {f.badge}
                </span>
              </div>
              
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 to-[#A855F7]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              
              <div className="relative">
                <div
                  className={`h-14 w-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform`}
                >
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why AEO + GEO Section */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="rounded-3xl glass-premium border border-[#E9D5FF] p-10 md:p-16 relative overflow-hidden shadow-3d-deep">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#A855F7]/10 to-[#8B5CF6]/10 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-[#E9D5FF] mb-6">
                <TrendingUp size={16} className="text-[#8B5CF6]" />
                <span className="text-sm font-semibold text-[#8B5CF6]">The Future of Search</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Why businesses need AEO + GEO now
              </h2>
              <p className="text-lg text-gray-600">
                Search behavior is changing. AI-powered platforms are replacing traditional search engines. Your business needs to adapt or risk becoming invisible.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Stat Card 1 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative glass-premium rounded-2xl p-7 border border-[#E9D5FF] shadow-3d-soft">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent mb-3">
                    40%+
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-2">Users now prefer AI search</p>
                  <p className="text-sm text-gray-600">ChatGPT, Perplexity, and AI assistants are replacing Google for many queries</p>
                </div>
              </div>
              
              {/* Stat Card 2 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative glass-premium rounded-2xl p-7 border border-[#E9D5FF] shadow-3d-soft">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent mb-3">
                    58%
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-2">Voice search growth</p>
                  <p className="text-sm text-gray-600">Conversational and voice-based queries continue to dominate mobile search</p>
                </div>
              </div>
              
              {/* Stat Card 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative glass-premium rounded-2xl p-7 border border-[#E9D5FF] shadow-3d-soft">
                  <div className="text-5xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent mb-3">
                    73%
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-2">Trust AI-generated answers</p>
                  <p className="text-sm text-gray-600">Consumers trust and act on information from AI platforms when making decisions</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-7 border border-[#E9D5FF]/50">
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex-shrink-0 shadow-lg">
                    <Search size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Traditional SEO isn't enough</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ranking on Google is just the beginning. Your customers are asking ChatGPT, using voice search, and trusting AI-generated recommendations.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="glass-card rounded-2xl p-7 border border-[#E9D5FF]/50">
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex-shrink-0 shadow-lg">
                    <Brain size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Future-proof your visibility</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Businesses optimized for AI search engines and generative platforms will dominate the next decade of digital discovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="rounded-3xl glass-premium border border-[#E9D5FF] p-10 md:p-16 shadow-3d-deep">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3EEFF] border border-[#E9D5FF] mb-4">
              <Rocket size={14} className="text-[#8B5CF6]" />
              <span className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
                How it works
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              From setup to AI visibility in 3 steps
            </h2>
            <p className="text-lg text-gray-600">
              Get discovered across Google, ChatGPT, voice search, and AI platforms in minutes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="glass-card rounded-2xl p-8 border border-[#E9D5FF]/50 shadow-3d-soft hover:shadow-3d-float transition-all h-full group">
                  <div className="text-6xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">{s.num}</div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight
                    size={28}
                    className="hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 text-[#8B5CF6]/40"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3EEFF] border border-[#E9D5FF] mb-4">
            <Users size={14} className="text-[#8B5CF6]" />
            <span className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
              Loved by founders
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Trusted by 2,400+ businesses
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={t.name}
              className="glass-card rounded-2xl p-7 border border-[#E9D5FF]/50 shadow-3d-soft hover:shadow-3d-float transition-all"
              style={{
                animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
              }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-[#8B5CF6] text-[#8B5CF6]" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 text-gray-700">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3EEFF] border border-[#E9D5FF] mb-4">
            <Zap size={14} className="text-[#8B5CF6]" />
            <span className="text-sm font-semibold text-[#8B5CF6] uppercase tracking-wider">
              {pricingState === "live" ? "Live Pricing" : "Pricing"}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Simple plans that grow with you
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-8 border shadow-3d-soft hover:shadow-3d-float transition-all ${
                t.highlighted
                  ? "glass-premium border-[#8B5CF6] shadow-3d-deep scale-[1.05] bg-gradient-to-br from-white to-[#F9F7FF]"
                  : "glass-card border-[#E9D5FF]/50"
              }`}
            >
              {t.highlighted && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white text-xs font-bold shadow-lg">
                  MOST POPULAR
                </span>
              )}
              <h3 className="font-bold text-xl text-gray-900">{t.name}</h3>
              <div className="mt-4 mb-2">
                <span className="text-5xl font-bold text-gray-900">{t.price}</span>
                <span className="text-base text-gray-600">/mo</span>
              </div>
              <p className="text-sm mb-7 text-gray-600">{t.desc}</p>
              <Button 
                className={`w-full mb-7 h-12 text-base font-semibold rounded-xl transition-all ${
                  t.highlighted 
                    ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white shadow-lg shadow-[#8B5CF6]/25" 
                    : "border-2 border-[#8B5CF6]/30 hover:border-[#8B5CF6] hover:bg-[#F9F7FF]"
                }`}
                variant={t.highlighted ? "default" : "outline"}
                asChild
              >
                <Link to="/signup">{t.cta}</Link>
              </Button>
              <ul className="space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-[#8B5CF6]"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center shadow-3d-deep" style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #8B5CF6 100%)',
        }}>
          <div className="absolute inset-0 opacity-20">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8">
              <Sparkles size={16} className="text-white" />
              <span className="text-sm font-semibold text-white">Built for the AI search era</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 text-white">
              Ready to dominate AI search?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
              Join 2,400+ businesses optimizing for Google, ChatGPT, voice search, and the future of AI-powered discovery.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-white text-[#8B5CF6] hover:bg-gray-50 rounded-xl shadow-xl transition-all"
                asChild
              >
                <Link to="/signup">
                  Boost My AI Discoverability <ArrowRight size={18} />
                </Link>
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-white/10 border-2 border-white/30 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all"
                asChild
              >
                <Link to="/dashboard">
                  <Play size={16} /> See how it works
                </Link>
              </Button>
            </div>
            
            {/* Trust badges */}
            <div className="mt-12 pt-10 border-t border-white/20">
              <p className="text-sm text-white/75 mb-5">Future-proof your business visibility</p>
              <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Check size={16} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
