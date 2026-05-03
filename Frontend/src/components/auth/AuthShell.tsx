import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-mesh" />
      <header className="container mx-auto px-4 lg:px-8 py-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl shadow-floating p-8 md:p-10">
            <div className="text-center mb-7">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
          {footer && <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>}
        </div>
      </main>
      <footer className="container mx-auto px-4 lg:px-8 py-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
