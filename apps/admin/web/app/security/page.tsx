"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateRecoveryCodes,
  setupTwoFactor,
  verifyTwoFactorSetup,
  type TwoFactorStatus,
} from "@/lib/api";

export default function SecurityPage() {
  const { token, isReady } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedDestination, setMaskedDestination] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !token) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const next = await getTwoFactorStatus(token);
        if (!cancelled) {
          setStatus(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Security settings failed to load.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, token]);

  async function refreshStatus() {
    if (!token) {
      return;
    }
    const next = await getTwoFactorStatus(token);
    setStatus(next);
  }

  async function handleStartSetup() {
    if (!token) {
      return;
    }
    setBusy("setup");
    setMessage(null);
    setError(null);
    try {
      const response = await setupTwoFactor(token);
      setChallengeId(response.challengeId);
      setMaskedDestination(response.maskedDestination);
      setMessage("A setup code was sent from no-reply@openstaff.eu.");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Two-factor setup failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleVerifySetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !challengeId) {
      return;
    }
    setBusy("verify");
    setMessage(null);
    setError(null);
    try {
      const response = await verifyTwoFactorSetup(challengeId, code, token);
      setRecoveryCodes(response.recoveryCodes);
      setChallengeId(null);
      setCode("");
      await refreshStatus();
      setMessage(response.message);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDisable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }
    setBusy("disable");
    setMessage(null);
    setError(null);
    try {
      const response = await disableTwoFactor(password, token);
      setPassword("");
      setRecoveryCodes([]);
      await refreshStatus();
      setMessage(response.message);
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : "Disable failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRegenerateCodes() {
    if (!token) {
      return;
    }
    setBusy("regenerate");
    setMessage(null);
    setError(null);
    try {
      const response = await regenerateRecoveryCodes(token);
      setRecoveryCodes(response.recoveryCodes);
      await refreshStatus();
      setMessage(response.message);
    } catch (regenerateError) {
      setError(regenerateError instanceof Error ? regenerateError.message : "Recovery code regeneration failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
                Trust & Security
              </div>
              <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">Two-factor authentication</h1>
              <p className="mt-4 max-w-3xl text-slate-600">
                Romanian + English operational controls for email OTP, recovery codes, and account trust hardening.
              </p>
            </div>
            <Link
              href="/profile"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-navy"
            >
              Back to profile
            </Link>
          </div>

          {status ? (
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatusCard label="2FA status" value={status.enabled ? "ENABLED" : "DISABLED"} />
              <StatusCard label="Admin enforced" value={status.adminEnforced ? "YES" : "NO"} />
              <StatusCard label="Recovery codes left" value={String(status.recoveryCodesRemaining)} />
              <StatusCard label="Failed attempts" value={String(status.failedAttemptCount)} />
            </div>
          ) : null}

          {message ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <article className="openstaff-card rounded-[2rem] p-8">
            <h2 className="text-2xl font-semibold text-brand-charcoal">Enable email OTP</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Romanian: trimitem codul pe email si il confirmi o singura data pentru activare.
              English: we send a short-lived code by email and you confirm it once to enable 2FA.
            </p>

            <button
              type="button"
              onClick={() => void handleStartSetup()}
              disabled={busy === "setup"}
              className="mt-6 rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {busy === "setup" ? "Sending..." : "Send setup code"}
            </button>

            {challengeId ? (
              <form className="mt-6 space-y-4" onSubmit={handleVerifySetup}>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-slate-700">
                  Code sent to {maskedDestination ?? "your email"}.
                </div>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl tracking-[0.35em] text-slate-700 outline-none"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                />
                <button
                  type="submit"
                  disabled={busy === "verify"}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-brand-navy disabled:opacity-60"
                >
                  {busy === "verify" ? "Verifying..." : "Verify & enable"}
                </button>
              </form>
            ) : null}
          </article>

          <article className="openstaff-card rounded-[2rem] p-8">
            <h2 className="text-2xl font-semibold text-brand-charcoal">Recovery & disable</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Recovery codes work once each. Disabling 2FA requires your current password unless an admin still enforces it.
            </p>

            <button
              type="button"
              onClick={() => void handleRegenerateCodes()}
              disabled={busy === "regenerate" || !status?.enabled}
              className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-brand-navy disabled:opacity-60"
            >
              {busy === "regenerate" ? "Regenerating..." : "Regenerate recovery codes"}
            </button>

            {recoveryCodes.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-900">Recovery codes</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {recoveryCodes.map((item) => (
                    <div key={item} className="rounded-xl bg-white px-3 py-2 font-mono text-sm text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleDisable}>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Current password / Parola curenta"
              />
              <button
                type="submit"
                disabled={busy === "disable" || status?.adminEnforced}
                className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 disabled:opacity-60"
              >
                {busy === "disable" ? "Disabling..." : "Disable 2FA"}
              </button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-navy/60">{label}</div>
      <div className="mt-2 text-lg font-semibold text-brand-charcoal">{value}</div>
    </div>
  );
}
