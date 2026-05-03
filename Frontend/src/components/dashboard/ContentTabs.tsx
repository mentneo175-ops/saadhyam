import { useState } from "react";
import { Copy, Edit3, Share2, Check } from "lucide-react";

const tabs = [
  { key: "instagram", label: "Instagram Post" },
  { key: "whatsapp", label: "WhatsApp Message" },
  { key: "ad", label: "Ad Copy" },
  { key: "email", label: "Email Template" },
];

const content: Record<string, { title: string; body: string; meta: string }> = {
  instagram: {
    title: "Diwali Glow-Up ✨",
    body: "Light up your festive look with our handpicked collection. 30% off all sets — only this weekend! Tap to shop the look 🛍️ #Diwali2025 #FestiveVibes #SaadhyamStyle",
    meta: "Optimized for engagement · Best to post Thu 7pm",
  },
  whatsapp: {
    title: "Re-engage VIP customers",
    body: "Hi {name}! 🪔 We've reserved a special 30% discount just for you this Diwali. Use code DIWALI30 at checkout — valid for 48 hrs. Reply YES to claim.",
    meta: "Personalized · 84% predicted open rate",
  },
  ad: {
    title: "Meta ad — conversion campaign",
    body: "Tired of plain festive wear? Discover handcrafted, limited-edition Diwali collections under ₹1,999. Free shipping today only. ✨ Shop now",
    meta: "A/B variant A · Predicted CTR 3.2%",
  },
  email: {
    title: "Festive subject line",
    body: "Hi {name}, your festive favourites are back in stock 🎉 We've put together a collection we think you'll love — plus an exclusive 30% off, just for our regulars.",
    meta: "Suggested send: Tue 10am",
  },
};

export function ContentTabs() {
  const [active, setActive] = useState("instagram");
  const [copied, setCopied] = useState(false);
  const c = content[active];

  const copy = () => {
    navigator.clipboard?.writeText(c.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Ready-to-use content</h3>
        <button className="text-xs font-semibold text-primary hover:underline">Generate new</button>
      </div>
      <div 
        className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              active === t.key
                ? "bg-gradient-primary text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-muted/50 border border-border/40 p-4">
        <p className="text-sm font-semibold mb-1">{c.title}</p>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{c.body}</p>
        <p className="text-[11px] text-muted-foreground mt-3">{c.meta}</p>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={copy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-border hover:bg-accent/40 transition"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border border-border hover:bg-accent/40 transition">
          <Edit3 size={13} /> Edit
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold bg-gradient-primary text-primary-foreground hover:brightness-110 transition">
          <Share2 size={13} /> Share
        </button>
      </div>
    </div>
  );
}
