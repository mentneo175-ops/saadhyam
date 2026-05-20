/**
 * ProtectedRoute - Route guard component
 * Redirects unauthenticated users to login page
 * Works in both development and production
 * 
 * Now shows dashboard while auth is being verified instead of blocking with a spinner
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
      // Use setTimeout to avoid redirect during render
      setTimeout(() => {
        navigate({ to: "/login", replace: true });
      }, 0);
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // If not authenticated and not loading, show nothing (will redirect)
  if (!isLoading && (!isAuthenticated || !user)) {
    return null;
  }

  // User is authenticated OR still loading - render children
  // This allows the dashboard to show while auth is being verified on refresh
  // The auth redirect will happen if needed when isLoading becomes false
  return <>{children}</>;
}
