import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  TrendingUp,
  Zap,
  PieChart,
  Target,
  Shield,
  Rocket,
  Headphones,
} from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { apiClient } from "@/lib/api";
import { useNotificationHelpers } from "@/components/notifications";
import LogoImage from "@/Icon/Saadhyam_Icon-removebg-preview.png";

export const Route = createFileRoute("/login-reference")({
  head: () => ({ meta: [{ title: "Sign In — Saadhyam AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, isLoading, error, clearError } = useAuthContext();
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: string; top: string; duration: string; delay: string }>>([]);

  // Generate particles only on client side
  useEffect(() => {
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 8}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading || isGoogleLoading || isEmailLoading) return;
    setIsGoogleLoading(true);
    clearError();

    try {
      await loginWithGoogle();
      notifySuccess("Welcome back!", "Successfully signed in with Google");
      
      try {
        const setupStatus = await apiClient.getBusinessSetupStatus();
        if (setupStatus.setup_completed) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/onboarding" });
        }
      } catch (statusError) {
        console.error("Failed to check setup status:", statusError);
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      notifyError("Sign in failed", "Unable to sign in with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading || isEmailLoading) return;
    setIsEmailLoading(true);
    clearError();

    try {
      await loginWithEmail(email, password);
      notifySuccess("Welcome back!", "Successfully signed in");
      
      try {
        const setupStatus = await apiClient.getBusinessSetupStatus();
        if (setupStatus.setup_completed) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/onboarding" });
        }
      } catch (statusError) {
        console.error("Failed to check setup status:", statusError);
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      console.error("Email login error:", err);
      notifyError("Sign in failed", "Invalid email or password");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const loading = isLoading || isGoogleLoading || isEmailLoading;

  return (
    <div
      data-auth-page
      className="h-screen flex overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F8F7FC 0%, #F3F1F9 50%, #EDE9F6 100%)',
      }}
    >
      {/* LEFT PANEL - Exact Reference Layout */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden h-full">
        
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          {/* Soft gradient orbs */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#A855F7]/8 rounded-full blur-3xl"></div>
          
          {/* Subtle particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-[#8B5CF6]/40 rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
                animation: `float ${particle.duration} ease-in-out infinite`,
                animationDelay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Main Content - Exact Layout */}
        <div className="relative z-10 w-full p-12 flex flex-col">
          
          {/* Top Section - Logo + Tagline */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <img 
                src={LogoImage} 
                alt="Saadhyam AI" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Saadhyam <span className="text-[#8B5CF6]">AI</span>
                </h1>
              </div>
            </div>
            
            <div className="inline-block px-4 py-2 rounded-full bg-[#F3EEFF] border border-[#E9D5FF] mb-6">
              <p className="text-sm text-[#8B5CF6] font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-[#8B5CF6] rounded-full"></span>
                AI-Powered Growth Platform
              </p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
              AI that powers<br />
              your <span className="text-[#8B5CF6]">business growth</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              Smarter insights, automation and strategies<br />
              to scale your business faster.
            </p>
          </div>

          {/* Feature List with Icons */}
          <div className="space-y-4 mb-12">
            {[
              { icon: TrendingUp, title: "AI Insights", desc: "Get data-driven recommendations" },
              { icon: Zap, title: "Smart Automation", desc: "Automate tasks and save hours" },
              { icon: PieChart, title: "Growth Analytics", desc: "Track performance in real-time" },
              { icon: Target, title: "Competitor Intelligence", desc: "Stay ahead with smart insights" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 group"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Dashboard Cards Section */}
          <div className="flex-1 relative perspective-container">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-lg h-96">
                
                {/* Business Overview Card - Center */}
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 glass-card rounded-3xl p-6 shadow-3d-float animate-float3d card-3d"
                  style={{ transform: 'translate(-50%, -50%) rotateX(2deg) rotateY(-2deg)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Business Overview</h3>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-white" />
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
                  className="absolute top-0 right-0 w-48 glass-card rounded-2xl p-4 shadow-3d-soft animate-float3d-delayed card-3d"
                  style={{ transform: 'rotateX(-3deg) rotateY(3deg)', animationDelay: '0.5s' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-600">AI Score</p>
                    <Zap className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">85</span>
                    <span className="text-sm text-gray-400">/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Your business is<br />growing 18.6% this month</p>
                </div>

                {/* Monthly Goal Card - Bottom Left */}
                <div 
                  className="absolute bottom-0 left-0 w-44 glass-card rounded-2xl p-4 shadow-3d-soft animate-float3d-slow card-3d"
                  style={{ transform: 'rotateX(3deg) rotateY(-3deg)', animationDelay: '1s' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#8B5CF6]" />
                    <p className="text-xs font-semibold text-gray-600">Monthly Goal</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">87%</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full"></div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom - Social Proof */}
          <div className="mt-auto">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] border-2 border-white"></div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Join 4,000+ businesses</p>
                <p className="text-xs text-gray-600">growing with Saadhyam AI</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL - Auth Form (Exact Reference) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 h-full overflow-y-auto bg-white">
        <div className="w-full max-w-md">
          
          {/* Logo at Top (Mobile + Desktop) */}
          <div className="text-center mb-12">
            <img 
              src={LogoImage} 
              alt="Saadhyam AI" 
              className="w-16 h-16 object-contain mx-auto mb-4"
            />
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h2>
            <p className="text-gray-600">Sign in to continue to Saadhyam AI</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-5">
            
            {/* Google Sign In */}
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-medium border-2 border-gray-200 hover:border-[#8B5CF6] hover:bg-[#F9F7FF] transition-all rounded-xl"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin text-[#8B5CF6]" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500">or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 pl-10 border-2 border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 rounded-xl"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <a href="/forgot-password" className="text-sm text-[#8B5CF6] hover:text-[#7C3AED] font-medium">
                    Forget password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 pl-10 pr-10 border-2 border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 rounded-xl"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#8B5CF6] border-gray-300 rounded focus:ring-[#8B5CF6]"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all"
                disabled={loading || !email || !password}
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600 pt-4">
              New to Saadhyam AI?{" "}
              <button
                onClick={() => navigate({ to: "/signup" })}
                className="text-[#8B5CF6] font-semibold hover:text-[#7C3AED] hover:underline"
                disabled={loading}
              >
                Create an account
              </button>
            </p>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <Shield className="w-6 h-6 text-[#8B5CF6] mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-900">Secure & Private</p>
                <p className="text-xs text-gray-500">Your data is 100% safe</p>
              </div>
              <div className="text-center">
                <Rocket className="w-6 h-6 text-[#8B5CF6] mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-900">14-Day Free Trial</p>
                <p className="text-xs text-gray-500">No credit card required</p>
              </div>
              <div className="text-center">
                <Headphones className="w-6 h-6 text-[#8B5CF6] mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-900">24/7 Support</p>
                <p className="text-xs text-gray-500">We're here to help</p>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center pt-4">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-[#8B5CF6] hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="text-[#8B5CF6] hover:underline">Privacy Policy</a>.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
