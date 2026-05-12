"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  clearStoredToken,
  fetchCurrentUser,
  getRefreshToken,
  getStoredToken,
  loginAccount,
  logoutAccount,
  refreshAuthToken,
  registerAccount,
  setStoredRefreshToken,
  setStoredToken,
} from "../lib/api";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    actorType: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  authProvider: "jwt";
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  token: null,
  isReady: false,
  login: async () => {},
  register: async () => {},
  refresh: async () => {},
  logout: async () => {},
  authProvider: "jwt",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    fetchCurrentUser(storedToken)
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        clearStoredToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && token),
      token,
      isReady: !loading,
      login: async (email: string, password: string) => {
        const response = await loginAccount({ email, password });
        setStoredToken(response.accessToken);
        setStoredRefreshToken(response.refreshToken);
        setToken(response.accessToken);
        setUser(response.user);
      },
      register: async (payload) => {
        const response = await registerAccount(payload);
        setStoredToken(response.accessToken);
        setStoredRefreshToken(response.refreshToken);
        setToken(response.accessToken);
        setUser(response.user);
      },
      refresh: async () => {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available.");
        }

        const response = await refreshAuthToken(refreshToken);
        setStoredToken(response.accessToken);
        setStoredRefreshToken(response.refreshToken);
        setToken(response.accessToken);
        setUser(response.user);
      },
      logout: async () => {
        try {
          await logoutAccount(token);
        } catch {
          // The local session should still be cleared if the API logout fails.
        }
        clearStoredToken();
        setUser(null);
        setToken(null);
      },
      authProvider: "jwt",
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
