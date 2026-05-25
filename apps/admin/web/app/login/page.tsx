"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "../../context/AuthContext";
import { resolveAuthenticatedRoute } from "@/lib/auth-redirect";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading, user } = useAuth();
  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(user ? resolveAuthenticatedRoute(user, nextPath) : "/profile");
    }
  }, [isAuthenticated, loading, nextPath, router, user]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login(email, password);
      if ("challengeRequired" in response) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "openstaff_web_2fa_challenge",
            JSON.stringify({
              challengeId: response.challengeId,
              maskedDestination: response.maskedDestination,
              expiresInSeconds: response.expiresInSeconds,
              expiresAt: Date.now() + response.expiresInSeconds * 1000,
              redirectTo: nextPath,
              email,
            }),
          );
        }
        router.push("/two-factor");
        return;
      }
      router.push(resolveAuthenticatedRoute(response.user, nextPath));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.94fr_1.06fr]">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
            OpenStaff
          </div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">Login</h1>
          <p className="mt-4 text-slate-600">
            Continue into your account workspace to manage approval status, profile visibility, public presentation, and uploads.
          </p>
          <div className="mt-8 rounded-[1.7rem] border border-indigo-100 bg-indigo-50 p-5 text-sm leading-7 text-slate-700">
            Accounts can sign in even while pending approval, but public visibility and moderated discovery remain controlled by backoffice approval.
          </div>
          {user ? (
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              Signed in as {user.email}
            </div>
          ) : null}
          <div className="mt-8 text-sm text-slate-500">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-brand-navy">
              Register here
            </Link>
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <form className="space-y-5" onSubmit={handleLogin}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="contractor@openstaff.eu"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <PasswordField
              label="Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-semibold text-brand-navy">
                Forgot password?
              </Link>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
