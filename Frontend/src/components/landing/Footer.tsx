import { Logo } from "@/components/brand/Logo";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const cols = [
    {
      title: "Product",
      items: ["Features", "Pricing", "Integrations", "Changelog"],
    },
    {
      title: "Company",
      items: ["About", "Blog", "Careers", "Contact"],
    },
    {
      title: "Resources",
      items: ["Docs", "Help center", "Community", "Status"],
    },
    {
      title: "Legal",
      items: ["Privacy", "Terms", "Security", "Cookies"],
    },
  ];
  return (
    <footer className="border-t border-border/60 bg-muted/30 mt-24">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The AI co-pilot that helps small businesses grow with content, insights and
              automation.
            </p>
            <div className="flex gap-3 mt-5">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent/40 hover:border-primary/40 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.items.map((it) => {
                  const href = it === "Contact" ? "mailto:info@saadhyam.com" : "#";
                  return (
                    <li key={it}>
                      <a
                        href={href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {it}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Saadhyam AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Crafted with ✨ for ambitious businesses.</p>
        </div>
      </div>
    </footer>
  );
}
