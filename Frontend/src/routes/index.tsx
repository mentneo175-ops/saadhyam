import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Sparkles,
  BarChart3,
  PenTool,
  Megaphone,
  Eye,
  MessageCircle,
  Check,
  Star,
  Zap,
  Search,
  Brain,
  TrendingUp,
  Globe,
  Bot,
} from "lucide-react";

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

const tiers = [
  {
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

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-mesh" />
        
        <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="space-y-7 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium">
                <Sparkles size={14} className="text-secondary" />
                <span>Built for the AI Search Era</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                Get discovered by <span className="text-gradient">Google, ChatGPT</span> & AI search
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                The AI visibility platform that optimizes your business for traditional search, AI engines, voice assistants, and generative AI platforms.
              </p>
              
              {/* AI Visibility Metrics Preview */}
              <div className="grid grid-cols-2 gap-3 py-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">89%</div>
                  <div className="text-xs text-muted-foreground mt-1">AI Visibility Score</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">12.4K</div>
                  <div className="text-xs text-muted-foreground mt-1">AI Mentions/Month</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/signup">
                    Optimize My AI Visibility <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/dashboard">
                    <Play size={16} /> View demo
                  </Link>
                </Button>
              </div>
              
              {/* AI Search Platforms Row */}
              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Optimized for AI-powered discovery:</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                    <Globe size={14} className="text-blue-600" />
                    <span className="text-xs font-medium">Google</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                    <Bot size={14} className="text-emerald-600" />
                    <span className="text-xs font-medium">ChatGPT</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                    <Sparkles size={14} className="text-purple-600" />
                    <span className="text-xs font-medium">Gemini</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                    <Brain size={14} className="text-orange-600" />
                    <span className="text-xs font-medium">Perplexity</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                    <Search size={14} className="text-cyan-600" />
                    <span className="text-xs font-medium">Claude</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-background bg-gradient-brand"
                      style={{ filter: `hue-rotate(${i * 35}deg)` }}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-accent text-accent" />
                    ))}
                    <span className="ml-1 font-semibold">4.9</span>
                  </div>
                  <p className="text-xs text-muted-foreground">from 2,400+ businesses</p>
                </div>
              </div>
            </div>
            <div className="relative pt-10 lg:pt-0">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            AI Search Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Rank beyond Google — Dominate AI search
          </h2>
          <p className="mt-4 text-muted-foreground">
            Six AI-powered capabilities designed to maximize your visibility across traditional search, AI engines, and voice assistants.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-card border border-border/60 shadow-soft hover-lift relative overflow-hidden"
            >
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                  {f.badge}
                </span>
              </div>
              
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-soft mb-4`}
              >
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why AEO + GEO Section */}
      <section className="container mx-auto px-4 lg:px-8 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20 border border-border/60 p-8 md:p-14 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 mb-4">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">The Future of Search</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Why businesses need AEO + GEO now
              </h2>
              <p className="text-muted-foreground text-lg">
                Search behavior is changing. AI-powered platforms are replacing traditional search engines. Your business needs to adapt or risk becoming invisible.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Stat Card 1 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 shadow-lg">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    40%+
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Users now prefer AI search</p>
                  <p className="text-xs text-muted-foreground">ChatGPT, Perplexity, and AI assistants are replacing Google for many queries</p>
                </div>
              </div>
              
              {/* Stat Card 2 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 shadow-lg">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                    58%
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Voice search growth</p>
                  <p className="text-xs text-muted-foreground">Conversational and voice-based queries continue to dominate mobile search</p>
                </div>
              </div>
              
              {/* Stat Card 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative p-6 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-white/50 dark:border-gray-800/50 shadow-lg">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    73%
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Trust AI-generated answers</p>
                  <p className="text-xs text-muted-foreground">Consumers trust and act on information from AI platforms when making decisions</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-white/50 dark:border-gray-800/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex-shrink-0">
                    <Search size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Traditional SEO isn't enough</h3>
                    <p className="text-sm text-muted-foreground">
                      Ranking on Google is just the beginning. Your customers are asking ChatGPT, using voice search, and trusting AI-generated recommendations.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-white/50 dark:border-gray-800/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex-shrink-0">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Future-proof your visibility</h3>
                    <p className="text-sm text-muted-foreground">
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
        <div className="rounded-3xl bg-gradient-soft border border-border/60 p-8 md:p-14">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From setup to AI visibility in 3 steps
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get discovered across Google, ChatGPT, voice search, and AI platforms in minutes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-soft hover-lift h-full">
                  <div className="text-5xl font-bold text-gradient mb-3">{s.num}</div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight
                    size={24}
                    className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 text-primary/40"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Loved by founders
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Trusted by 2,400+ businesses
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl bg-card border border-border/60 shadow-soft hover-lift"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-brand" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Simple plans that grow with you
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-7 border shadow-soft hover-lift ${
                t.highlighted
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow scale-[1.02]"
                  : "bg-card border-border/60"
              }`}
            >
              {t.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                  MOST POPULAR
                </span>
              )}
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold">{t.price}</span>
                <span
                  className={`text-sm ${t.highlighted ? "opacity-80" : "text-muted-foreground"}`}
                >
                  /mo
                </span>
              </div>
              <p
                className={`text-sm mb-6 ${t.highlighted ? "opacity-90" : "text-muted-foreground"}`}
              >
                {t.desc}
              </p>
              <Button variant={t.highlighted ? "glass" : t.variant} className="w-full mb-6" asChild>
                <Link to="/signup">{t.cta}</Link>
              </Button>
              <ul className="space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${t.highlighted ? "" : "text-success"}`}
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 md:p-16 text-center text-primary-foreground shadow-floating">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <Sparkles size={16} />
              <span className="text-sm font-semibold">Built for the AI search era</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to dominate AI search?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-7">
              Join 2,400+ businesses optimizing for Google, ChatGPT, voice search, and the future of AI-powered discovery.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="glass" size="xl" asChild>
                <Link to="/signup">
                  Boost My AI Discoverability <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="bg-white/10 border-white/30 hover:bg-white/20" asChild>
                <Link to="/dashboard">
                  <Play size={16} /> See how it works
                </Link>
              </Button>
            </div>
            
            {/* Trust badges */}
            <div className="mt-10 pt-8 border-t border-white/20">
              <p className="text-sm opacity-75 mb-4">Future-proof your business visibility</p>
              <div className="flex items-center justify-center gap-6 flex-wrap text-xs opacity-90">
                <div className="flex items-center gap-2">
                  <Check size={14} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} />
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
