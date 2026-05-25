"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AdminAuthUser,
  AdminAuthFlowResponse,
  clearAccessToken,
  fetchCurrentAdmin,
  getAccessToken,
  getRefreshToken,
  loginAdmin,
  logoutAdmin,
  refreshAdminToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/api";

type SubscriptionFeatureKey =
  | "aiProfileSetup"
  | "projectIngestion"
  | "timesheets"
  | "invoices"
  | "complianceAdvanced";

type AuthContextType = {
  user: AdminAuthUser | null;
  subscription: AdminAuthUser["subscription"] | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  hasFeature: (feature: SubscriptionFeatureKey) => boolean;
  remainingPrivateContacts: number | null;
  login: (email: string, password: string) => Promise<AdminAuthFlowResponse>;
  completeSession: (response: Exclude<AdminAuthFlowResponse, { challengeRequired: true }>) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  subscription: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  hasFeature: () => false,
  remainingPrivateContacts: null,
  login: async () => {
    throw new Error("Auth context not initialized.");
  },
  completeSession: () => {},
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrapSession() {
      try {
        if (accessToken) {
          setToken(accessToken);

          const currentUser = await fetchCurrentAdmin(accessToken);
          if (!cancelled) {
            setUser(currentUser);
            setIsAdmin(currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN");
          }
          return;
        }

        if (!refreshToken) {
          throw new Error("No stored refresh token available.");
        }

        const refreshed = await refreshAdminToken(refreshToken);
        if (cancelled) {
          return;
        }

        if (refreshed.user.role !== "ADMIN" && refreshed.user.role !== "SUPERADMIN") {
          throw new Error("This account does not have backoffice access.");
        }

        setAccessToken(refreshed.accessToken);
        setRefreshToken(refreshed.refreshToken);
        setToken(refreshed.accessToken);
        setUser(refreshed.user);
        setIsAdmin(true);
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
          setToken(null);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => {
      const subscription = user?.subscription ?? null;
      const features = subscription?.features ?? {};
      const contactLimit = subscription?.contactLimit ?? 0;
      const contactsUsed = subscription?.contactsUsed ?? 0;
      const remainingPrivateContacts =
        contactLimit > 0 ? Math.max(contactLimit - contactsUsed, 0) : null;
      const hasFeature = (feature: SubscriptionFeatureKey) =>
        Boolean(features[feature]);

      return {
        user,
        subscription,
        loading,
        isAuthenticated: Boolean(user && token),
        isAdmin,
        token,
        hasFeature,
        remainingPrivateContacts,
        login: async (email: string, password: string) => {
          const response = await loginAdmin({ email, password });

          if ("challengeRequired" in response) {
            clearAccessToken();
            setToken(null);
            setUser(null);
            setIsAdmin(false);
            return response;
          }

          if (response.user.role !== "ADMIN" && response.user.role !== "SUPERADMIN") {
            throw new Error("This account does not have backoffice access.");
          }

          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);
          setToken(response.accessToken);
          setUser(response.user);
          setIsAdmin(true);
          return response;
        },
        completeSession: (response) => {
          if (response.user.role !== "ADMIN" && response.user.role !== "SUPERADMIN") {
            throw new Error("This account does not have backoffice access.");
          }

          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);
          setToken(response.accessToken);
          setUser(response.user);
          setIsAdmin(true);
        },
        refresh: async () => {
          const refreshToken = getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available.");
          }

          const response = await refreshAdminToken(refreshToken);

          if (response.user.role !== "ADMIN" && response.user.role !== "SUPERADMIN") {
            throw new Error("This account does not have backoffice access.");
          }

          setAccessToken(response.accessToken);
          setRefreshToken(response.refreshToken);
          setToken(response.accessToken);
          setUser(response.user);
          setIsAdmin(true);
        },
        logout: async () => {
          try {
            await logoutAdmin(token);
          } catch {
            // Local session still needs to be cleared.
          }
          clearAccessToken();
          setUser(null);
          setToken(null);
          setIsAdmin(false);
        },
      };
    },
    [isAdmin, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
