"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const firebaseConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isAuthenticated, loading, router]);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setState("error");
      setMessage("Introdu o adresă de email validă și parola asociată.");
      return;
    }

    setState("submitting");
    setMessage(null);

    try {
      await signIn(email.trim(), password);
      router.push("/dashboard");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Login failed.");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void handleSubmit();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">
          OpenStaff
        </div>
        <h1 className="mt-3 text-3xl font-semibold">Admin Login</h1>
        <p className="mt-3 text-sm text-slate-400">
          Secure access for the OpenStaff backoffice through Firebase Auth.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Login-ul se face cu email Firebase, nu cu username simplu de tip <code>openstaff_admin</code>.
        </p>

        {!firebaseConfigured ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Build-ul curent nu are configurate variabilele <code>NEXT_PUBLIC_FIREBASE_*</code>. Formularul nu poate autentifica până la redeploy cu Firebase configurat.
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              autoComplete="email"
              placeholder="admin@openstaff.local"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              autoComplete="current-password"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={state === "submitting" || loading || !firebaseConfigured}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "submitting" ? "Signing in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
