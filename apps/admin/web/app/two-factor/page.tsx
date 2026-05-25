"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  clearStoredToken,
  resendTwoFactorChallenge,
  setStoredRefreshToken,
  setStoredToken,
  verifyTwoFactorChallenge,
} from "@/lib/api";

type PendingChallenge = {
  challengeId: string;
  maskedDestination: string;
  expiresInSeconds: number;
  email?: string;
};

const STORAGE_KEY = "openstaff_web_2fa_challenge";

export default function TwoFactorPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingChallenge | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setPending(null);
      return;
    }

    try {
      setPending(JSON.parse(raw) as PendingChallenge);
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      setPending(null);
    }
  }, []);

  const helperText = useMemo(() => {
    if (!pending) {
      return "No active two-factor challenge was found. / Nu exista un challenge 2FA activ.";
    }

    return `Enter the short-lived code sent to ${pending.maskedDestination}. / Introdu codul trimis la ${pending.maskedDestination}.`;
  }, [pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) {
      setError("No active challenge. Please return to login.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const auth = await verifyTwoFactorChallenge(pending.challengeId, code);
      setStoredToken(auth.accessToken);
      setStoredRefreshToken(auth.refreshToken);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      router.replace("/profile");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Two-factor verification failed.");
      if (submissionError instanceof ApiError && submissionError.status === 401) {
        clearStoredToken();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!pending) {
      return;
    }

    setIsResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await resendTwoFactorChallenge(pending.challengeId);
      const next = {
        challengeId: response.challengeId,
        maskedDestination: response.maskedDestination,
        expiresInSeconds: response.expiresInSeconds,
        email: pending.email,
      };
      setPending(next);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      setMessage("A fresh code was sent. / Un cod nou a fost trimis.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Resend failed.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
            Trust & Security
          </div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
            Two-factor challenge
          </h1>
          <p className="mt-4 text-slate-600">
            Romanian: finalizati autentificarea cu codul primit pe email.
          </p>
          <p className="mt-2 text-slate-600">
            English: complete sign-in with the code received by email.
          </p>
          <div className="mt-8 rounded-[1.6rem] border border-indigo-100 bg-indigo-50 p-5 text-sm leading-7 text-slate-700">
            {helperText}
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                One-time code / Cod unic
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl tracking-[0.35em] text-slate-700 outline-none"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
              />
            </label>

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !pending}
              className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify code"}
            </button>

            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending || !pending}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? "Resending..." : "Resend code"}
            </button>

            <div className="text-sm text-slate-500">
              <Link href="/login" className="font-semibold text-brand-navy">
                Return to login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
