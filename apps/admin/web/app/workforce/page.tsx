"use client";

import Link from "next/link";

export default function WorkforceHomePage() {
  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Workforce Self-Service
          </div>
          <h1 className="mt-3 text-4xl font-semibold">Execution dashboard for active workforce</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Review active assignments, submit timesheets, and manage attendance sessions from
            the same worker-facing workspace.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/workforce/dashboard"
            className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 transition hover:border-cyan-400/30"
          >
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Overview</div>
            <div className="mt-3 text-2xl font-semibold">Dashboard</div>
            <p className="mt-3 text-sm text-slate-300">
              Active assignment status, contracts, and execution health.
            </p>
          </Link>
          <Link
            href="/workforce/timesheets"
            className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 transition hover:border-cyan-400/30"
          >
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Hours</div>
            <div className="mt-3 text-2xl font-semibold">Timesheets</div>
            <p className="mt-3 text-sm text-slate-300">
              Create period logs, add daily entries, and submit for approval.
            </p>
          </Link>
          <Link
            href="/workforce/attendance"
            className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 transition hover:border-cyan-400/30"
          >
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Presence</div>
            <div className="mt-3 text-2xl font-semibold">Attendance</div>
            <p className="mt-3 text-sm text-slate-300">
              Check in, check out, and review personal attendance history.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
