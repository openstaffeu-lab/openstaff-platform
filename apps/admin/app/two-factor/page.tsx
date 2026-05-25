"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  resendAdminTwoFactorChallenge,
  setAccessToken,
  setRefreshToken,
  verifyAdminTwoFactorChallenge,
} from "@/lib/api";

type PendingChallenge = {
  challengeId: string;
  maskedDestination: string;
  expiresInSeconds: number;
  email?: string;
};

const STORAGE_KEY = "openstaff_admin_2fa_challenge";

export default function AdminTwoFactorPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingChallenge | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      setPending(JSON.parse(raw) as PendingChallenge);
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) {
      setError("No active backoffice 2FA challenge.");
      return;
    }
    setBusy("verify");
    setError(null);
    setMessage(null);
    try {
      const auth = await verifyAdminTwoFactorChallenge(pending.challengeId, code);
      setAccessToken(auth.accessToken);
      setRefreshToken(auth.refreshToken);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Two-factor verification failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleResend() {
    if (!pending) {
      return;
    }
    setBusy("resend");
    setError(null);
    setMessage(null);
    try {
      const response = await resendAdminTwoFactorChallenge(pending.challengeId);
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
      setMessage("A fresh code was sent to your operational mailbox.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Resend failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">OpenStaff</div>
        <h1 className="mt-3 text-3xl font-semibold">Backoffice 2FA</h1>
        <p className="mt-3 text-sm text-slate-400">
          Enter the short-lived email code sent to {pending?.maskedDestination ?? "your admin mailbox"}.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-center text-2xl tracking-[0.35em] text-white outline-none transition focus:border-cyan-500"
            autoComplete="one-time-code"
            placeholder="123456"
          />

          {message ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy === "verify" || !pending}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {busy === "verify" ? "Verifying..." : "Verify code"}
          </button>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={busy === "resend" || !pending}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-semibold text-cyan-200 disabled:opacity-60"
          >
            {busy === "resend" ? "Resending..." : "Resend code"}
          </button>

          <div className="text-sm text-slate-400">
            <Link href="/login" className="font-semibold text-cyan-300">
              Return to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
