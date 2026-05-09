/**
 * useAuth Hook - Manages both Firebase Google OAuth and email/password authentication
 * Provides Google sign-in, email login/register, logout, and user state
 */

import { useState, useCallback, useEffect } from "react";
import { apiClient, User, ApiError } from "@/lib/api";
import { signInWithGoogle, signOutFromFirebase, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Sync auth state on mount and fetch user data
  useEffect(() => {
    const storedUser = apiClient.getStoredUser();
    const storedToken = apiClient.getToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      
      // Fetch fresh user data from backend
      apiClient.getCurrentUser()
        .then((freshUser) => {
          setUser(freshUser);
        })
        .catch((error) => {
          console.error("Failed to fetch user data:", error);
          // If token is invalid, clear auth
          if (error instanceof ApiError && error.status === 401) {
            // Clear auth data manually
            apiClient.setToken(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("saadhyam_token");
              localStorage.removeItem("saadhyam_user");
              localStorage.removeItem("businessInfo");
              localStorage.removeItem("businessAnalysis");
              localStorage.removeItem("businessProfile");
            }
            setUser(null);
            setToken(null);
          }
        });
    }

    // Listen to Firebase auth state changes
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          // Firebase user signed out, check if we need to clear local state
          const currentUser = apiClient.getStoredUser();
          if (currentUser && currentUser.auth_provider === 'google') {
            // Only clear if user was authenticated via Google
            setUser(null);
            setToken(null);
            // Clear auth data manually
            apiClient.setToken(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("saadhyam_token");
              localStorage.removeItem("saadhyam_user");
              localStorage.removeItem("businessInfo");
              localStorage.removeItem("businessAnalysis");
              localStorage.removeItem("businessProfile");
            }
          }
        }
      });

      return () => unsubscribe();
    }
  }, []); // Empty dependency array - only run once on mount

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check if Firebase is configured
      if (!auth) {
        throw new Error('Firebase not configured. Please set up your Firebase environment variables in Frontend/.env');
      }

      // Sign in with Google via Firebase
      const { idToken } = await signInWithGoogle();
      
      // Send Firebase token to backend
      const { user: newUser, token: newToken } = await apiClient.googleAuth(idToken);
      
      setUser(newUser);
      setToken(newToken);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.data?.detail || "Google sign-in failed"
          : err instanceof Error
            ? err.message
            : "Google sign-in failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Login with email/password via backend
      const { user: newUser, token: newToken } = await apiClient.login(email, password);
      
      setUser(newUser);
      setToken(newToken);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.data?.detail || "Login failed"
          : err instanceof Error
            ? err.message
            : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Register with email/password via backend
      const { user: newUser, token: newToken } = await apiClient.register(email, password, name);
      
      setUser(newUser);
      setToken(newToken);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.data?.detail || "Registration failed"
          : err instanceof Error
            ? err.message
            : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Sign out from Firebase if configured and user used Google auth
      if (auth && user?.auth_provider === 'google') {
        await signOutFromFirebase();
      }
      
      // Clear backend session
      await apiClient.logout();
      
      setUser(null);
      setToken(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    clearError,
  };
}
