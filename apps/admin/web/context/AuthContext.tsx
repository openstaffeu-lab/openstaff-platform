"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  loginAccount,
  setStoredToken,
} from "../lib/api";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  authProvider: "jwt";
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  token: null,
  isReady: false,
  signIn: async () => {},
  signOut: async () => {},
  login: () => {},
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
      signIn: async (email: string, password: string) => {
        const response = await loginAccount({ email, password });
        setStoredToken(response.access_token);
        setToken(response.access_token);
        setUser(response.user);
      },
      signOut: async () => {
        clearStoredToken();
        setUser(null);
        setToken(null);
      },
      login: (nextToken: string, nextUser: AuthUser) => {
        setStoredToken(nextToken);
        setToken(nextToken);
        setUser(nextUser);
      },
      logout: async () => {
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
