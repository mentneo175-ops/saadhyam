import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — Saadhyam AI" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, registerWithEmail, isLoading, error, clearError } = useAuthContext();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    if (isLoading || isGoogleLoading || isEmailLoading) return;
    
    setIsGoogleLoading(true);
    clearError();
    
    try {
      await loginWithGoogle();
      
      // Check business setup status after successful Google authentication
      try {
        const setupStatus = await apiClient.getBusinessSetupStatus();
        
        if (setupStatus.setup_completed) {
          // User has completed business setup → Dashboard
          navigate({ to: "/dashboard" });
        } else {
          // User hasn't completed business setup → Onboarding
          navigate({ to: "/onboarding" });
        }
      } catch (statusError) {
        console.error("Failed to check setup status:", statusError);
        // If we can't check status, assume new user → Onboarding
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      console.error("Google sign-up error:", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading || isEmailLoading) return;
    
    setIsEmailLoading(true);
    clearError();
    
    try {
      await registerWithEmail(email, password, name);
      
      // Check business setup status after successful email registration
      try {
        const setupStatus = await apiClient.getBusinessSetupStatus();
        
        if (setupStatus.setup_completed) {
          // User has completed business setup → Dashboard
          navigate({ to: "/dashboard" });
        } else {
          // User hasn't completed business setup → Onboarding
          navigate({ to: "/onboarding" });
        }
      } catch (statusError) {
        console.error("Failed to check setup status:", statusError);
        // If we can't check status, assume new user → Onboarding
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      console.error("Email sign-up error:", err);
      // Error is already handled by useAuth hook and displayed in UI
    } finally {
      setIsEmailLoading(false);
    }
  };

  const loading = isLoading || isGoogleLoading || isEmailLoading;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your free 14-day Pro trial — no card required"
      footer={
        <>
          Already have an account?{" "}
          <button
            onClick={() => navigate({ to: "/login" })}
            className="text-primary font-semibold hover:underline focus:outline-none focus:underline"
            disabled={loading}
          >
            Sign in
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">{error}</p>
              {error.includes('Email already registered') && (
                <div className="text-xs text-muted-foreground">
                  <p>This email is already associated with an account.</p>
                  <p className="mt-1">
                    <button
                      onClick={() => navigate({ to: "/login" })}
                      className="text-primary underline hover:no-underline"
                    >
                      Sign in instead
                    </button>
                  </p>
                </div>
              )}
              {error.includes('Firebase not configured') && (
                <div className="text-xs text-muted-foreground">
                  <p>Google authentication is temporarily unavailable. Please use email signup or:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Set up Firebase project (see QUICK_FIREBASE_SETUP.md)</li>
                    <li>Update Frontend/.env with your Firebase config</li>
                    <li>Restart the dev server</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google Sign Up */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          {isGoogleLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email Sign Up Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            disabled={loading || !email || !password || password.length < 6}
          >
            {isEmailLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">14</div>
              <div className="text-xs text-muted-foreground">Day Free Trial</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-xs text-muted-foreground">AI Content</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-xs text-muted-foreground">Support</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </AuthShell>
  );
}