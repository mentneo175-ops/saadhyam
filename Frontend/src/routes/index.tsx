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
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saadhyam AI — Grow your business with AI" },
      {
        name: "description",
        content:
          "AI that analyzes your business, creates content, and boosts sales automatically. Built for ambitious teams.",
      },
      { property: "og:title", content: "Saadhyam AI — Grow your business with AI" },
      {
        property: "og:description",
        content:
          "AI co-pilot for content, insights and automation — built for ambitious businesses.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: BarChart3,
    title: "Business Analysis AI",
    desc: "Deep insights into your performance, customers and growth opportunities.",
    color: "from-purple-500 to-fuchsia-500",
  },
  {
    icon: PenTool,
    title: "Content Creator AI",
    desc: "Generate posts, captions and emails in your brand voice — in seconds.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Megaphone,
    title: "Ad Copy Generator",
    desc: "High-converting ad copy tested against millions of campaigns.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Eye,
    title: "Competitor Insights",
    desc: "Track competitors, spot trends and stay one step ahead automatically.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Automation",
    desc: "Reach customers where they are with smart, automated conversations.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Smart Recommendations",
    desc: "Daily AI-powered actions ranked by impact on your bottom line.",
    color: "from-blue-500 to-indigo-500",
  },
];

const steps = [
  {
    num: "01",
    title: "Paste your business details",
    desc: "Tell Saadhyam about your business in 2 minutes. No setup, no code.",
  },
  {
    num: "02",
    title: "AI analyzes everything",
    desc: "We scan your market, customers and competitors to build your blueprint.",
  },
  {
    num: "03",
    title: "Get growth plan + content",
    desc: "Receive a 30-day plan, ready-to-publish content and daily actions.",
  },
];

const testimonials = [
  {
    quote:
      "Saadhyam doubled our Instagram engagement in 3 weeks. It feels like having a marketing team in my pocket.",
    name: "Priya Sharma",
    role: "Founder, Bloom Studio",
  },
  {
    quote: "The growth plan was scarily accurate. We hit our quarterly target two months early.",
    name: "Rahul Mehta",
    role: "CEO, Crisp Foods",
  },
  {
    quote:
      "Honestly the best $29 I spend each month. Content, insights and automation in one place.",
    name: "Anjali Verma",
    role: "Marketing Lead, Lumen",
  },
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    desc: "Try the magic with no commitment.",
    features: [
      "5 AI generations / day",
      "Basic analytics",
      "1 connected channel",
      "Community support",
    ],
    cta: "Start free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    desc: "For growing businesses ready to scale.",
    features: [
      "Unlimited AI generations",
      "Advanced insights",
      "5 connected channels",
      "Competitor tracking",
      "Priority support",
    ],
    cta: "Start Pro trial",
    variant: "hero" as const,
    highlighted: true,
  },
  {
    name: "Business",
    price: "$99",
    desc: "Power, automation and a dedicated specialist.",
    features: [
      "Everything in Pro",
      "Workflow automation",
      "Unlimited channels",
      "Dedicated AI specialist",
      "Custom integrations",
    ],
    cta: "Talk to sales",
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
                <span>AI-powered business growth</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                Grow your business with <span className="text-gradient">AI</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                AI that analyzes, creates content, and boosts sales — automatically. Your full
                marketing team in one beautiful app.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/signup">
                    Get started <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/dashboard">
                    <Play size={16} /> View demo
                  </Link>
                </Button>
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
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything you need to grow, in one place
          </h2>
          <p className="mt-4 text-muted-foreground">
            Six AI capabilities working together so you can stop juggling tools and focus on what
            matters.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-card border border-border/60 shadow-soft hover-lift"
            >
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

      {/* How it works */}
      <section id="how" className="container mx-auto px-4 lg:px-8 py-20">
        <div className="rounded-3xl bg-gradient-soft border border-border/60 p-8 md:p-14">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From idea to growth in 3 steps
            </h2>
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to grow with AI?
            </h2>
            <p className="text-lg opacity-90 max-w-xl mx-auto mb-7">
              Join 2,400+ businesses using Saadhyam AI to win more customers and grow faster.
            </p>
            <Button variant="glass" size="xl" asChild>
              <Link to="/signup">
                Start free <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
