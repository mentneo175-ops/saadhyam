/**
 * ProtectedRoute - Route guard component
 * Redirects unauthenticated users to login page
 * Works in both development and production
 * 
 * Security: Shows loading spinner during auth verification to prevent
 * unauthorized access to protected content
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

  // Show loading spinner while auth is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, show nothing (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // User is authenticated - render children
  return <>{children}</>;
}
