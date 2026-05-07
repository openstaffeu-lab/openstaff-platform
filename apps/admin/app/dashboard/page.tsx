"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReluQueueSnapshot, adminApi } from "@/lib/api";

type DashboardStats = {
  totalActors?: number;
  pendingActors?: number;
  liveJobs?: number;
  pendingJobs?: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [reluQueue, setReluQueue] = useState<ReluQueueSnapshot | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      adminApi.getJobStats().catch(() => ({} as DashboardStats)),
      adminApi.getActorStats().catch(() => ({} as DashboardStats)),
      adminApi.getReluQueue().catch(() => null),
    ]).then(([jobStats, actorStats, relu]) => {
      if (!active) {
        return;
      }

      setStats({ ...actorStats, ...jobStats });
      setReluQueue(relu);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="space-y-8 p-8 text-white">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          OpenStaff Operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Platform operations now include Relu AI as a governed service alongside
          marketplace moderation, user approvals, and compliance activity. The
          cards below combine the legacy platform signals still present in the repo
          with the new secured Relu task queue.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Total actors" value={stats.totalActors ?? 0} />
        <KpiCard label="Pending actors" value={stats.pendingActors ?? 0} accent="amber" />
        <KpiCard label="Live jobs" value={stats.liveJobs ?? 0} accent="emerald" />
        <KpiCard label="Pending jobs" value={stats.pendingJobs ?? 0} accent="amber" />
        <KpiCard
          label="Relu completed / 24h"
          value={reluQueue?.summary.completedLast24Hours ?? 0}
          accent="cyan"
        />
        <KpiCard
          label="Relu queue"
          value={(reluQueue?.summary.pending ?? 0) + (reluQueue?.summary.running ?? 0)}
          accent="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white">Operational shortcuts</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <QuickLink href="/ai-config" label="Relu AI config" />
            <QuickLink href="/ai-control" label="Prompts and policies" />
            <QuickLink href="/ai-queue" label="Relu queue" />
            <QuickLink href="/admin/users" label="Users and approvals" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white">Relu engine status</h2>
          <p className="mt-3 text-sm text-slate-300">
            {reluQueue?.summary.engineStatus ?? "unknown"}
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-400">
            <p>Pending tasks: {reluQueue?.summary.pending ?? 0}</p>
            <p>Running tasks: {reluQueue?.summary.running ?? 0}</p>
            <p>Failed in last 24h: {reluQueue?.summary.failedLast24Hours ?? 0}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "amber" | "emerald" | "cyan" | "rose";
}) {
  const accentClassName =
    accent === "amber"
      ? "text-amber-200"
      : accent === "emerald"
        ? "text-emerald-200"
        : accent === "cyan"
          ? "text-cyan-200"
          : accent === "rose"
            ? "text-rose-200"
            : "text-white";

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accentClassName}`}>{value}</p>
    </article>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-white"
    >
      {label}
    </Link>
  );
}
