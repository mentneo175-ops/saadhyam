import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "Verify — Saadhyam AI" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const onChange = (i: number, v: string) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent a 6-digit code to your email. Enter it below to continue."
    >
      <div className="space-y-6">
        <div className="flex justify-between gap-2">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={c}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              maxLength={1}
              inputMode="numeric"
              className="h-14 w-12 text-center text-xl font-bold rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          ))}
        </div>

        <Button variant="hero" size="lg" className="w-full" asChild>
          <Link to="/dashboard">
            Verify & continue <ArrowRight size={16} />
          </Link>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't get the code?{" "}
          <button className="text-primary font-semibold hover:underline">Resend</button>
        </p>
      </div>
    </AuthShell>
  );
}
