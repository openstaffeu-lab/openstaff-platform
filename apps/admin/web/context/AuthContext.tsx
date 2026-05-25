"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthFlowResponse,
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

type SubscriptionFeatureKey =
  | "aiProfileSetup"
  | "projectIngestion"
  | "timesheets"
  | "invoices"
  | "complianceAdvanced";

type AuthContextType = {
  user: AuthUser | null;
  subscription: AuthUser["subscription"] | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  isReady: boolean;
  hasFeature: (feature: SubscriptionFeatureKey) => boolean;
  canCreateProjects: boolean;
  canStartPrivateChat: boolean;
  remainingPrivateContacts: number | null;
  login: (email: string, password: string) => Promise<AuthFlowResponse>;
  completeSession: (response: Exclude<AuthFlowResponse, { challengeRequired: true }>) => void;
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
  subscription: null,
  loading: true,
  isAuthenticated: false,
  token: null,
  isReady: false,
  hasFeature: () => false,
  canCreateProjects: false,
  canStartPrivateChat: false,
  remainingPrivateContacts: null,
  login: async () => {
    throw new Error("Auth context not initialized.");
  },
  completeSession: () => {},
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
    const storedRefreshToken = getRefreshToken();

    if (!storedToken && !storedRefreshToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrapSession() {
      try {
        if (storedToken) {
          setToken(storedToken);

          const currentUser = await fetchCurrentUser(storedToken);
          if (!cancelled) {
            setUser(currentUser);
          }
          return;
        }

        if (!storedRefreshToken) {
          throw new Error("No stored refresh token available.");
        }

        const refreshed = await refreshAuthToken(storedRefreshToken);
        if (cancelled) {
          return;
        }

        setStoredToken(refreshed.accessToken);
        setStoredRefreshToken(refreshed.refreshToken);
        setToken(refreshed.accessToken);
        setUser(refreshed.user);
      } catch {
        if (!cancelled) {
          clearStoredToken();
          setToken(null);
          setUser(null);
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
        token,
        isReady: !loading,
        hasFeature,
        canCreateProjects: hasFeature("projectIngestion"),
        canStartPrivateChat:
          Boolean(subscription) &&
          (contactLimit === 0 || remainingPrivateContacts === null || remainingPrivateContacts > 0),
        remainingPrivateContacts,
        login: async (email: string, password: string) => {
          const response = await loginAccount({ email, password });
          if ("challengeRequired" in response) {
            clearStoredToken();
            setToken(null);
            setUser(null);
            return response;
          }
          setStoredToken(response.accessToken);
          setStoredRefreshToken(response.refreshToken);
          setToken(response.accessToken);
          setUser(response.user);
          return response;
        },
        completeSession: (response) => {
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
      };
    },
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
