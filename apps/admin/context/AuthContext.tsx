"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAccessToken, setAccessToken } from "@/lib/api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { IdTokenResult, UserCredential } from "firebase/auth";

type AuthContextType = {
  user: User | null;
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

function hasAdminAccess(tokenResult: IdTokenResult) {
  const roleClaim = String(tokenResult.claims.role ?? "").toUpperCase();

  return (
    Boolean(tokenResult.claims.admin) ||
    roleClaim === "ADMIN" ||
    roleClaim === "SUPERADMIN"
  );
}

async function hydrateAuthState(
  currentUser: User,
  handlers: {
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setIsAdmin: (value: boolean) => void;
    setLoading: (value: boolean) => void;
  },
) {
  const idToken = await currentUser.getIdToken(true);
  const tokenResult = await currentUser.getIdTokenResult(true);

  setAccessToken(idToken);
  handlers.setUser(currentUser);
  handlers.setToken(idToken);
  handlers.setIsAdmin(hasAdminAccess(tokenResult));
  handlers.setLoading(false);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth || !isFirebaseConfigured()) {
      clearAccessToken();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        clearAccessToken();
        setUser(null);
        setToken(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      await hydrateAuthState(currentUser, {
        setUser,
        setToken,
        setIsAdmin,
        setLoading,
      });
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin,
      token,
      signIn: async (email: string, password: string) => {
        if (!isFirebaseConfigured()) {
          throw new Error(
            "Firebase Auth nu este configurat pentru acest build de producție. Lipsesc variabilele NEXT_PUBLIC_FIREBASE_*.",
          );
        }

        const auth = getFirebaseAuth();

        if (!auth) {
          throw new Error(
            "Firebase Auth nu este disponibil pentru aplicația de backoffice. Verifică configurarea Firebase și redeploy-ul.",
          );
        }

        const credential: UserCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        await hydrateAuthState(credential.user, {
          setUser,
          setToken,
          setIsAdmin,
          setLoading,
        });
      },
      signOut: async () => {
        const auth = getFirebaseAuth();
        clearAccessToken();
        setUser(null);
        setToken(null);
        setIsAdmin(false);

        if (auth) {
          await firebaseSignOut(auth);
        }
      },
    }),
    [isAdmin, loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
