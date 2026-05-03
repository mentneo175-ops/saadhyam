import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Create account — Saadhyam AI" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthContext();
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    clearError();
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register({ email: formData.email, password: formData.password });
      // Navigate to onboarding on successful registration
      navigate({ to: "/onboarding" });
    } catch (err) {
      // Error is already set by useAuthContext
      console.error("Registration error:", err);
    }
  };

  const displayError = localError || error;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your free 14-day Pro trial — no card required"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {displayError && (
          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <AlertCircle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{displayError}</p>
          </div>
        )}

        {/* Google Sign Up */}
        <Button variant="outline" className="w-full" size="lg" type="button" disabled={isLoading}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Sign up with Google
        </Button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="email"
              type="email"
              placeholder="you@business.com"
              className="pl-9 h-11 rounded-xl"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              className="pl-9 h-11 rounded-xl"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              className="pl-9 h-11 rounded-xl"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Sign Up Button */}
        <Button variant="hero" size="lg" className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"} <ArrowRight size={16} />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By creating an account you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
