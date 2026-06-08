/**
 * ProtectedRoute - Route guard component
 * Redirects unauthenticated users to login page
 * Works in both development and production
 * 
 * Security: Shows loading spinner during auth verification to prevent
 * unauthorized access to protected content
 */

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Wait for client mounting and auth to finish loading
    if (!isClient || isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      console.log("🔒 User not authenticated, redirecting to login");
      // Use setTimeout to avoid redirect during render
      setTimeout(() => {
        navigate({ to: "/login", replace: true });
      }, 0);
    }
  }, [isAuthenticated, isLoading, user, navigate, isClient]);

  // Show loading skeleton shell while auth is being verified,
  // or until the component is mounted on the client to avoid SSR mismatch.
  if (!isClient || (isLoading && (!isAuthenticated || !user))) {
    return (
      <div className="min-h-screen flex bg-background w-full">
        {/* Sidebar Skeleton */}
        <aside className="w-64 border-r border-border bg-card p-4 space-y-4 hidden lg:flex flex-col animate-pulse shrink-0">
          <div className="h-10 w-32 bg-muted rounded-xl" />
          <div className="space-y-3 pt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-9 w-full bg-muted rounded-xl" />
            ))}
          </div>
        </aside>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Skeleton */}
          <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between animate-pulse">
            <div className="h-5 w-48 bg-muted rounded-lg" />
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="h-8 w-8 bg-muted rounded-full" />
            </div>
          </header>
          
          {/* Page Body Skeleton */}
          <main className="flex-1 p-6 md:p-8 space-y-6 animate-pulse overflow-hidden">
            <div className="h-8 w-64 bg-muted rounded-lg" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 h-80 bg-muted rounded-2xl" />
              <div className="lg:col-span-2 h-80 bg-muted rounded-2xl" />
            </div>
          </main>
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
