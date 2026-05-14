"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyPayrollSettlements, PayrollSettlementSummary } from "@/lib/api";
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

export default function PayrollSettlementsPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [settlements, setSettlements] = useState<PayrollSettlementSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
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
        const data = await getMyPayrollSettlements(token);
        setSettlements(data);
        if (!selectedId && data[0]) {
          setSelectedId(data[0].id);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load settlements.",
        );
      }
    };

    void load();
  }, [loading, router, selectedId, token]);

  const selectedSettlement = useMemo(
    () => settlements.find((item) => item.id === selectedId) ?? null,
    [selectedId, settlements],
  );

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Payroll Settlements</div>
          <h1 className="mt-3 text-3xl font-semibold">Prepared settlement snapshots</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Review your approved hours, overtime, gross/net preview, and payout-readiness state.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="text-sm font-semibold text-white">Settlement list</div>
            <div className="mt-4 space-y-3">
              {settlements.length ? (
                settlements.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left ${
                      selectedId === item.id
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-950/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{item.status}</div>
                        <div className="text-sm text-slate-400">
                          {item.assignment.job.title} · {formatDate(item.payrollCycle.periodStart)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-300">
                        {formatMoney(item.netAmount, item.currency)}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-400">No settlements available yet.</div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            {selectedSettlement ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <KeyValue label="Status" value={selectedSettlement.status} />
                  <KeyValue
                    label="Cycle"
                    value={`${formatDate(selectedSettlement.payrollCycle.periodStart)} - ${formatDate(selectedSettlement.payrollCycle.periodEnd)}`}
                  />
                  <KeyValue
                    label="Gross"
                    value={formatMoney(selectedSettlement.grossAmount, selectedSettlement.currency)}
                  />
                  <KeyValue
                    label="Net"
                    value={formatMoney(selectedSettlement.netAmount, selectedSettlement.currency)}
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-white">Settlement lines</div>
                  <div className="mt-3 space-y-3">
                    {selectedSettlement.lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 px-4 py-3 text-sm"
                      >
                        <div>
                          <div className="font-medium text-white">{line.description}</div>
                          <div className="text-slate-400">
                            {line.quantity.toFixed(2)} × {formatMoney(line.unitRate, selectedSettlement.currency)}
                          </div>
                        </div>
                        <div className="font-semibold text-emerald-300">
                          {formatMoney(line.amount, selectedSettlement.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Select a settlement to inspect it.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
