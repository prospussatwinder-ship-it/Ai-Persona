"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError } from "@/lib/api-error";
import { apiFetch, clearToken, getToken } from "@/lib/auth";
import { AUTH_TOKEN_CHANGED_EVENT } from "@/lib/auth-events";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  ageVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
  permissions?: string[];
};

type AuthState = {
  user: AuthUser | null;
  /** True while resolving session (token present or first paint). */
  loading: boolean;
  /** Re-fetch /v1/auth/me. Returns false if no token or /me failed (e.g. 401, network). */
  refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return false;
    }
    setLoading(true);
    try {
      // Pin JWT for this request so a late 401 for an old token cannot wipe a token just set by login.
      const u = await apiFetch<AuthUser>("/v1/auth/me", { authToken: token });
      setUser(u);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        if (getToken() === token) {
          clearToken();
          setUser(null);
        }
        // Stale 401: storage already has a newer token — ignore; another refresh will set user.
      } else {
        setUser(null);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onToken = () => {
      void refresh();
    };
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onToken);
    window.addEventListener("storage", onToken);
    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onToken);
      window.removeEventListener("storage", onToken);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
    }),
    [user, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
