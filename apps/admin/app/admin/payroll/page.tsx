"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminPayrollCycle,
  AdminPayrollSettlement,
  PayrollCycleStatus,
  PayrollSettlementStatus,
  approveAdminPayrollSettlement,
  createPayrollCycle,
  getAdminPayrollCycles,
  getAdminPayrollSettlement,
  getAdminPayrollSettlements,
  processAdminPayrollCycle,
  rejectAdminPayrollSettlement,
} from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PayrollAdminPage() {
  const [cycles, setCycles] = useState<AdminPayrollCycle[]>([]);
  const [settlements, setSettlements] = useState<AdminPayrollSettlement[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [selectedSettlementId, setSelectedSettlementId] = useState<string>("");
  const [selectedSettlement, setSelectedSettlement] = useState<AdminPayrollSettlement | null>(
    null,
  );
  const [cycleStatusFilter, setCycleStatusFilter] = useState<PayrollCycleStatus | "">("");
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<
    PayrollSettlementStatus | ""
  >("");
  const [search, setSearch] = useState("");
  const [cycleStart, setCycleStart] = useState("");
  const [cycleEnd, setCycleEnd] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [cycleData, settlementData] = await Promise.all([
        getAdminPayrollCycles({
          status: cycleStatusFilter || undefined,
        }),
        getAdminPayrollSettlements({
          q: search || undefined,
          status: settlementStatusFilter || undefined,
          cycleId: selectedCycleId || undefined,
        }),
      ]);

      setCycles(cycleData);
      setSettlements(settlementData);

      if (!selectedCycleId && cycleData[0]) {
        setSelectedCycleId(cycleData[0].id);
      }

      if (!selectedSettlementId && settlementData[0]) {
        setSelectedSettlementId(settlementData[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca payroll-ul.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [cycleStatusFilter, settlementStatusFilter, search, selectedCycleId]);

  useEffect(() => {
    if (!selectedSettlementId) {
      setSelectedSettlement(null);
      return;
    }

    let active = true;

    const loadDetail = async () => {
      try {
        const detail = await getAdminPayrollSettlement(selectedSettlementId);
        if (active) {
          setSelectedSettlement(detail);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nu am putut incarca settlement-ul selectat.",
          );
        }
      }
    };

    void loadDetail();

    return () => {
      active = false;
    };
  }, [selectedSettlementId]);

  const stats = useMemo(() => {
    const totalGross = settlements.reduce((sum, item) => sum + item.grossAmount, 0);
    return {
      cycleCount: cycles.length,
      pendingSettlements: settlements.filter((item) => item.status === "PENDING").length,
      readyForPayment: settlements.filter((item) => item.status === "READY_FOR_PAYMENT").length,
      totalGross,
    };
  }, [cycles, settlements]);

  const handleCreateCycle = async () => {
    if (!cycleStart || !cycleEnd) {
      setError("Completeaza perioada payroll cycle.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const created = await createPayrollCycle({
        periodStart: new Date(cycleStart).toISOString(),
        periodEnd: new Date(cycleEnd).toISOString(),
      });
      setSelectedCycleId(created.id);
      setCycleStart("");
      setCycleEnd("");
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut crea cycle-ul.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessCycle = async () => {
    if (!selectedCycleId) {
      setError("Selecteaza un payroll cycle.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await processAdminPayrollCycle(selectedCycleId);
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Nu am putut procesa cycle-ul.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSettlement) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await approveAdminPayrollSettlement(selectedSettlement.id, {
        note: approveNote || undefined,
      });
      setApproveNote("");
      setSelectedSettlement(updated);
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nu am putut aproba settlement-ul.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSettlement || !rejectReason.trim()) {
      setError("Introdu un motiv de reject.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await rejectAdminPayrollSettlement(selectedSettlement.id, {
        reason: rejectReason.trim(),
      });
      setRejectReason("");
      setSelectedSettlement(updated);
      await loadData();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nu am putut respinge settlement-ul.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Payroll</div>
            <h1 className="mt-3 text-3xl font-semibold">Compensation and settlement control</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Review payroll cycles, process approved operational timesheets, and prepare
              settlements without executing real payouts.
            </p>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2">
            <input
              type="date"
              value={cycleStart}
              onChange={(event) => setCycleStart(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            />
            <input
              type="date"
              value={cycleEnd}
              onChange={(event) => setCycleEnd(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            />
            <button
              onClick={handleCreateCycle}
              disabled={actionLoading}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Create cycle
            </button>
            <button
              onClick={handleProcessCycle}
              disabled={actionLoading || !selectedCycleId}
              className="rounded-2xl border border-cyan-400/40 px-4 py-3 text-sm font-semibold text-cyan-200"
            >
              Process selected cycle
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Cycles" value={String(stats.cycleCount)} />
          <StatCard label="Pending settlements" value={String(stats.pendingSettlements)} />
          <StatCard label="Ready for payment" value={String(stats.readyForPayment)} />
          <StatCard label="Gross prepared" value={formatMoney(stats.totalGross, "RON")} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Payroll cycles</div>
                <div className="text-sm text-slate-400">Operational processing windows</div>
              </div>

              <select
                value={cycleStatusFilter}
                onChange={(event) =>
                  setCycleStatusFilter(event.target.value as PayrollCycleStatus | "")
                }
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
              >
                <option value="">All statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="LOCKED">LOCKED</option>
                <option value="EXPORTED">EXPORTED</option>
              </select>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-slate-400">Loading cycles...</div>
              ) : cycles.length ? (
                cycles.map((cycle) => (
                  <button
                    key={cycle.id}
                    onClick={() => setSelectedCycleId(cycle.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedCycleId === cycle.id
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {formatDate(cycle.periodStart)} - {formatDate(cycle.periodEnd)}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">
                          {cycle.status}
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-300">
                        <div>{cycle.totalWorkers} workers</div>
                        <div>{formatMoney(cycle.totalGrossAmount, "RON")}</div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-400">No payroll cycles yet.</div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Settlement queue</div>
                <div className="text-sm text-slate-400">
                  Pending approvals, rejected items, and export-ready snapshots
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search worker, project, job"
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                />
                <select
                  value={settlementStatusFilter}
                  onChange={(event) =>
                    setSettlementStatusFilter(
                      event.target.value as PayrollSettlementStatus | "",
                    )
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                >
                  <option value="">All settlement statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="READY_FOR_PAYMENT">READY_FOR_PAYMENT</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-slate-400">Loading settlements...</div>
              ) : settlements.length ? (
                settlements.map((settlement) => (
                  <button
                    key={settlement.id}
                    onClick={() => setSelectedSettlementId(settlement.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedSettlementId === settlement.id
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {settlement.user.identityProfile?.displayName ?? settlement.user.email}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-400">
                          {settlement.status}
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-300">
                        <div>{formatMoney(settlement.netAmount, settlement.currency)}</div>
                        <div>{settlement.regularHours.toFixed(2)}h regular</div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-400">No settlements found for the current filters.</div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">Settlement detail</div>
            <div className="text-sm text-slate-400">
              Worker compensation snapshot, settlement lines, and approval actions
            </div>
          </div>

          {selectedSettlement ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <KeyValue
                    label="Worker"
                    value={
                      selectedSettlement.user.identityProfile?.displayName ??
                      selectedSettlement.user.email
                    }
                  />
                  <KeyValue label="Status" value={selectedSettlement.status} />
                  <KeyValue
                    label="Gross"
                    value={formatMoney(selectedSettlement.grossAmount, selectedSettlement.currency)}
                  />
                  <KeyValue
                    label="Net"
                    value={formatMoney(selectedSettlement.netAmount, selectedSettlement.currency)}
                  />
                  <KeyValue
                    label="Regular"
                    value={`${selectedSettlement.regularHours.toFixed(2)} h`}
                  />
                  <KeyValue
                    label="Overtime"
                    value={`${selectedSettlement.overtimeHours.toFixed(2)} h`}
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-white">Compensation lines</div>
                  <div className="mt-3 space-y-3">
                    {selectedSettlement.lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm"
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

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">Operational context</div>
                  <div className="mt-3 space-y-2">
                    <div>Cycle: {selectedSettlement.payrollCycle.status}</div>
                    <div>Project: {selectedSettlement.assignment.project?.name ?? "—"}</div>
                    <div>Job: {selectedSettlement.assignment.job.title}</div>
                    <div>Contract: {selectedSettlement.assignment.contract.lifecycleStatus}</div>
                    <div>
                      Attendance: {selectedSettlement.attendanceSummary.recordCount} records /{" "}
                      {selectedSettlement.attendanceSummary.totalTrackedHours.toFixed(2)} h
                    </div>
                  </div>
                </div>

                <textarea
                  value={approveNote}
                  onChange={(event) => setApproveNote(event.target.value)}
                  rows={3}
                  placeholder="Approve note"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                />
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || selectedSettlement.status !== "PENDING"}
                  className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  Approve settlement
                </button>

                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  placeholder="Reject reason"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                />
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="w-full rounded-2xl border border-rose-400/40 px-4 py-3 text-sm font-semibold text-rose-200 disabled:opacity-50"
                >
                  Reject settlement
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              Select a settlement to inspect its compensation snapshot.
            </div>
          )}
        </section>
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

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
