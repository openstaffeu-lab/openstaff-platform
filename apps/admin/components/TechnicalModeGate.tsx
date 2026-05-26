"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function TechnicalModeGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role === "SUPERADMIN") {
    return <>{children}</>;
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Operational workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Technical tools are isolated</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          This area contains infrastructure diagnostics or AI configuration controls. Normal
          admin workflows use moderation, media, companies, contracts, workforce, finance, RELU
          review, and trust surfaces instead.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            prefetch={false}
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 no-underline transition hover:bg-cyan-200"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/admin/relu"
            prefetch={false}
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/10"
          >
            RELU Moderation
          </Link>
        </div>
      </section>
    </main>
  );
}
