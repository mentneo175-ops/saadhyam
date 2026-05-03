/**
 * useAuth Hook - Manages authentication state and operations
 * Provides login, register, logout, and user state
 */

import { useState, useCallback, useEffect } from "react";
import { apiClient, User, LoginRequest, RegisterRequest, ApiError } from "@/lib/api";

interface UseAuthReturn {
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

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Sync auth state on mount
  useEffect(() => {
    const storedUser = apiClient.getStoredUser();
    const storedToken = apiClient.getToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: newUser, token: newToken } = await apiClient.login(credentials);
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

  const register = useCallback(async (credentials: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: newUser, token: newToken } = await apiClient.register(credentials);
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
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
}
