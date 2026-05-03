/**
 * AuthContext - Global authentication state provider
 * Provides authentication state to all components in the app
 */

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { User, LoginRequest, RegisterRequest } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  // Enable automatic token refresh for authenticated users
  useTokenRefresh();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
