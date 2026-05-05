"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "../lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (token: string) => void;
  logout: () => Promise<void>;
  authProvider: "firebase";
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
  authProvider: "firebase",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth || !isFirebaseConfigured()) {
      window.localStorage.removeItem("token");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken();
      window.localStorage.setItem("token", idToken);
      setUser(currentUser);
      setToken(idToken);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      token,
      isReady: !loading,
      signIn: async (email: string, password: string) => {
        const auth = getFirebaseAuth();

        if (!auth) {
          throw new Error("Firebase Auth is not configured for the public app.");
        }

        await signInWithEmailAndPassword(auth, email, password);
      },
      signOut: async () => {
        const auth = getFirebaseAuth();
        window.localStorage.removeItem("token");
        setUser(null);
        setToken(null);

        if (auth) {
          await firebaseSignOut(auth);
        }
      },
      login: (newToken: string) => {
        window.localStorage.setItem("token", newToken);
        setToken(newToken);
      },
      logout: async () => {
        const auth = getFirebaseAuth();
        window.localStorage.removeItem("token");
        setUser(null);
        setToken(null);

        if (auth?.currentUser) {
          await firebaseSignOut(auth);
        }
      },
      authProvider: "firebase",
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
