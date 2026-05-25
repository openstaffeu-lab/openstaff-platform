"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { completeAccountRecovery, confirmPasswordReset } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="px-6 py-10 md:py-14">
          <div className="mx-auto max-w-3xl rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm text-slate-500">Preparing secure password reset...</div>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const mode = useMemo(() => searchParams.get("mode") ?? "reset", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("This password reset link is missing its token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The new password confirmation does not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response =
        mode === "recovery"
          ? await completeAccountRecovery(token, password)
          : await confirmPasswordReset(token, password);
      setMessage(response.message);
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not reset your password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
            {mode === "recovery" ? "Account Recovery" : "Secure Reset"}
          </div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
            {mode === "recovery" ? "Recover your account" : "Choose a new password"}
          </h1>
          <p className="mt-4 text-slate-600">
            {mode === "recovery"
              ? "Use a strong password to recover access. This flow revokes active sessions and helps contain suspicious access."
              : "Use a strong password that you do not reuse elsewhere. This reset invalidates the old password and active signed-in sessions."}
          </p>
          <div className="mt-8 text-sm text-slate-500">
            Need a new link?{" "}
            <Link href="/forgot-password" className="font-semibold text-brand-navy">
              Request another reset
            </Link>
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">New password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Confirm new password
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                type="password"
                placeholder="Repeat the new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
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
              disabled={submitting || password.length < 8 || confirmPassword.length < 8}
              className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Updating password..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
