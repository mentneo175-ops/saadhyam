import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent/40"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border/50 px-4 py-4 space-y-3 bg-background/95">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="hero" size="sm" className="flex-1" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
