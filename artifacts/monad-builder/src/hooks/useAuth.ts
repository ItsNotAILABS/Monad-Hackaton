/**
 * useAuth — fetches the current GitHub OAuth user from /api/auth/me.
 * Returns { user, isLoading, isAuthenticated, login, logout }.
 */
import { useState, useEffect, useCallback } from "react";

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  email: string | null;
}

export interface AuthState {
  user: GitHubUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function useAuth(): AuthState & { login: () => void; logout: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setState({ user: data.user, isLoading: false, isAuthenticated: true });
        } else {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      })
      .catch(() => setState({ user: null, isLoading: false, isAuthenticated: false }));
  }, []);

  const login = useCallback(() => {
    window.location.href = `${BASE}/api/auth/github`;
  }, [BASE]);

  const logout = useCallback(async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, [BASE]);

  return { ...state, login, logout };
}
