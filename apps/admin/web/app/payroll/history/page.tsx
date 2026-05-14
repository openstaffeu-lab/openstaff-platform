"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyPayrollOverview } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PayrollHistoryPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [cycles, setCycles] = useState<Awaited<ReturnType<typeof getMyPayrollOverview>>["cycles"]>(
    [],
  );
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
        const overview = await getMyPayrollOverview(token);
        setCycles(overview.cycles);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load payroll history.");
      }
    };

    void load();
  }, [loading, router, token]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Payroll History</div>
          <h1 className="mt-3 text-3xl font-semibold">Cycle-by-cycle history</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Understand when your approved timesheets entered a cycle and how settlements moved
            toward payment readiness.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {cycles.length ? (
            cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {formatDate(cycle.periodStart)} - {formatDate(cycle.periodEnd)}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">
                      {cycle.status}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <div>{cycle.settlementCount} settlements</div>
                    <div>{formatMoney(cycle.totalGrossAmount, "RON")}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {cycle.settlements.map((settlement) => (
                    <div
                      key={settlement.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 text-sm"
                    >
                      <div className="font-medium text-white">{settlement.assignment.job.title}</div>
                      <div className="mt-1 text-slate-400">
                        {settlement.status} · {settlement.regularHours.toFixed(2)}h regular ·{" "}
                        {settlement.overtimeHours.toFixed(2)}h OT
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">
              No payroll history yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
