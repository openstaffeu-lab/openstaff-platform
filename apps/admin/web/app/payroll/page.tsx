"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyPayrollOverview, PayrollOverview } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PayrollPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [overview, setOverview] = useState<PayrollOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        setError(null);
        setOverview(await getMyPayrollOverview(token));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load payroll.");
      }
    };

    void load();
  }, [loading, router, token]);

  const stats = useMemo(() => {
    const settlements = overview?.settlements ?? [];
    return {
      total: settlements.length,
      ready: settlements.filter((item) => item.status === "READY_FOR_PAYMENT").length,
      paid: settlements.filter((item) => item.status === "PAID").length,
      gross: settlements.reduce((sum, item) => sum + item.grossAmount, 0),
    };
  }, [overview]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Payroll</div>
            <h1 className="mt-3 text-3xl font-semibold">Compensation visibility</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Review prepared settlements, compensation terms, and payroll-cycle visibility
              without triggering real payouts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/payroll/settlements"
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Open settlements
            </Link>
            <Link
              href="/payroll/history"
              className="rounded-2xl border border-cyan-400/40 px-4 py-3 text-sm font-semibold text-cyan-200"
            >
              View history
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Settlements" value={String(stats.total)} />
          <StatCard label="Ready for payment" value={String(stats.ready)} />
          <StatCard label="Paid" value={String(stats.paid)} />
          <StatCard label="Gross prepared" value={formatMoney(stats.gross, "RON")} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="text-sm font-semibold text-white">Latest settlements</div>
            <div className="mt-4 space-y-3">
              {overview?.settlements.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{item.status}</div>
                      <div className="text-sm text-slate-400">
                        {item.assignment.job.title} · {item.regularHours.toFixed(2)}h regular
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-300">
                      {formatMoney(item.netAmount, item.currency)}
                    </div>
                  </div>
                </div>
              )) ?? <div className="text-sm text-slate-400">No settlements yet.</div>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="text-sm font-semibold text-white">Compensation agreements</div>
            <div className="mt-4 space-y-3">
              {overview?.compensationAgreements.length ? (
                overview.compensationAgreements.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4"
                  >
                    <div className="text-sm font-medium text-white">
                      {item.compensationType} · {formatMoney(item.baseRate, item.currency)}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {item.assignment?.job.title ?? "Assignment"} · effective from{" "}
                      {new Date(item.effectiveFrom).toLocaleDateString("ro-RO")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No compensation agreements visible yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
