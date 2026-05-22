"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not start password recovery.",
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
            Account Recovery
          </div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">Reset your password</h1>
          <p className="mt-4 text-slate-600">
            Enter the email address you use for OpenStaff. If an account matches it, OpenStaff
            will try to deliver a secure reset link shortly. Please also check Spam or Junk.
          </p>
          <div className="mt-8 rounded-[1.7rem] border border-slate-200 bg-white/80 p-5 text-sm leading-7 text-slate-700">
            For security, this page does not confirm whether a specific account exists.
          </div>
          <div className="mt-8 text-sm text-slate-500">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-brand-navy">
              Back to login
            </Link>
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                type="email"
                placeholder="team@company.eu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              disabled={submitting || !email.trim()}
              className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Sending recovery request..." : "Send recovery request"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
