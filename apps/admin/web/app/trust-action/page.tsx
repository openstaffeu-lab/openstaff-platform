"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { confirmEmailOwnership, confirmSuspiciousLogin } from "@/lib/api";

export default function TrustActionPage() {
  return (
    <Suspense
      fallback={
        <main className="px-6 py-10 md:py-14">
          <div className="mx-auto max-w-3xl rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm text-slate-500">Preparing secure trust confirmation...</div>
          </div>
        </main>
      }
    >
      <TrustActionBody />
    </Suspense>
  );
}

function TrustActionBody() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const flow = useMemo(() => searchParams.get("flow") ?? "email-ownership", [searchParams]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      if (!token) {
        setError("This trust confirmation link is missing its token.");
        return;
      }

      try {
        const response =
          flow === "suspicious-login"
            ? await confirmSuspiciousLogin(token)
            : await confirmEmailOwnership(token);

        if (active) {
          setMessage(response.message);
        }
      } catch (actionError) {
        if (active) {
          setError(
            actionError instanceof Error
              ? actionError.message
              : "We could not complete this trust confirmation.",
          );
        }
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [flow, token]);

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto max-w-3xl rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
          Trust Workflow
        </div>
        <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
          {flow === "suspicious-login" ? "Suspicious login confirmation" : "Email ownership confirmation"}
        </h1>
        <p className="mt-4 text-slate-600">
          OpenStaff uses secure trust links from no-reply@openstaff.eu for recovery, approval, and account protection workflows.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          <Link href="/login" className="font-semibold text-brand-navy">
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}
