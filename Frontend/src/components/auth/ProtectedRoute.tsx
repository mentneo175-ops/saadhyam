/**
 * ProtectedRoute - Route guard component
 * Redirects unauthenticated users to login page
 * Works in both development and production
 */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log("🔒 User not authenticated, redirecting to login");
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#8B5CF6] mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
