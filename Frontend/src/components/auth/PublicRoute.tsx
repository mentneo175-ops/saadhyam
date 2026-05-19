/**
 * PublicRoute - Route guard for login/signup pages
 * Redirects authenticated users to dashboard
 * Prevents logged-in users from accessing login/signup
 */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/lib/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // If authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      console.log("✅ User already authenticated, redirecting to dashboard");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Show loading or render children
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show nothing (will redirect)
  if (isAuthenticated && user) {
    return null;
  }

  // User is not authenticated, render children (login/signup page)
  return <>{children}</>;
}
