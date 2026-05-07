"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AdminAuthUser,
  clearAccessToken,
  fetchCurrentAdmin,
  getAccessToken,
  loginAdmin,
  setAccessToken,
} from "@/lib/api";

type AuthContextType = {
  user: AdminAuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      setLoading(false);
      return;
    }

    setToken(accessToken);

    fetchCurrentAdmin(accessToken)
      .then((currentUser) => {
        setUser(currentUser);
        setIsAdmin(currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN");
      })
      .catch(() => {
        clearAccessToken();
        setUser(null);
        setToken(null);
        setIsAdmin(false);
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
      isAdmin,
      token,
      signIn: async (email: string, password: string) => {
        const response = await loginAdmin({ email, password });

        if (response.user.role !== "ADMIN" && response.user.role !== "SUPERADMIN") {
          throw new Error("This account does not have backoffice access.");
        }

        setAccessToken(response.access_token);
        setToken(response.access_token);
        setUser(response.user);
        setIsAdmin(true);
      },
      signOut: async () => {
        clearAccessToken();
        setUser(null);
        setToken(null);
        setIsAdmin(false);
      },
    }),
    [isAdmin, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
