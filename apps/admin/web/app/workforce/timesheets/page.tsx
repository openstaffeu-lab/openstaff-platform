"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addOperationalTimesheetEntry,
  ApiError,
  createOperationalTimesheet,
  getMyOperationalTimesheets,
  getMyWorkforceAssignments,
  submitOperationalTimesheet,
  type MyWorkforceAssignment,
  type OperationalTimesheet,
} from "@/lib/api";

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function WorkforceTimesheetsPage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const [assignments, setAssignments] = useState<MyWorkforceAssignment[]>([]);
  const [timesheets, setTimesheets] = useState<OperationalTimesheet[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedTimesheetId, setSelectedTimesheetId] = useState("");
  const [periodStart, setPeriodStart] = useState(toDateInput(new Date()));
  const [periodEnd, setPeriodEnd] = useState(toDateInput(new Date()));
  const [workDate, setWorkDate] = useState(toDateInput(new Date()));
  const [hoursWorked, setHoursWorked] = useState("8");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    if (!token) {
      return;
    }

    const [assignmentData, timesheetData] = await Promise.all([
      getMyWorkforceAssignments(token),
      getMyOperationalTimesheets(token),
    ]);
    setAssignments(assignmentData);
    setTimesheets(timesheetData);
    if (!selectedAssignmentId && assignmentData[0]) {
      setSelectedAssignmentId(assignmentData[0].id);
    }
    if (!selectedTimesheetId && timesheetData[0]) {
      setSelectedTimesheetId(timesheetData[0].id);
    }
  }

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadData();
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load timesheets.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isReady, logout, router, token]);

  const selectedTimesheet = useMemo(
    () => timesheets.find((item) => item.id === selectedTimesheetId) ?? null,
    [selectedTimesheetId, timesheets],
  );

  async function handleCreateTimesheet() {
    if (!token || !selectedAssignmentId) {
      return;
    }

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createOperationalTimesheet(
        {
          workforceAssignmentId: selectedAssignmentId,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
        },
        token,
      );
      await loadData();
      setSelectedTimesheetId(created.id);
      setSuccess("Timesheet created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Create failed.");
    } finally {
      setWorking(false);
    }
  }

  async function handleAddEntry() {
    if (!token || !selectedTimesheetId) {
      return;
    }

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await addOperationalTimesheetEntry(
        selectedTimesheetId,
        {
          workDate: new Date(workDate).toISOString(),
          hoursWorked: Number(hoursWorked),
          overtimeHours: Number(overtimeHours),
          notes: notes || undefined,
        },
        token,
      );
      await loadData();
      setSelectedTimesheetId(updated.id);
      setNotes("");
      setSuccess("Entry added.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Add entry failed.");
    } finally {
      setWorking(false);
    }
  }

  async function handleSubmitTimesheet() {
    if (!token || !selectedTimesheetId) {
      return;
    }

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await submitOperationalTimesheet(selectedTimesheetId, {}, token);
      await loadData();
      setSelectedTimesheetId(updated.id);
      setSuccess("Timesheet submitted.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Submit failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Timesheets</div>
          <h1 className="mt-3 text-4xl font-semibold">Create and submit operational work logs</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Build period logs on top of active workforce assignments, then submit them into the
            admin approval flow.
          </p>
        </section>

        {loading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 text-slate-300">
            Loading timesheets...
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Create timesheet</div>
                <div className="mt-4 grid gap-4">
                  <select
                    value={selectedAssignmentId}
                    onChange={(event) => setSelectedAssignmentId(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">Select active assignment</option>
                    {assignments.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.job.title} / {item.contract.lifecycleStatus}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(event) => setPeriodStart(event.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    />
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(event) => setPeriodEnd(event.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCreateTimesheet()}
                    disabled={!selectedAssignmentId || working}
                    className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Create timesheet
                  </button>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Existing timesheets</div>
                <div className="mt-4 space-y-3">
                  {timesheets.length ? (
                    timesheets.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setSelectedTimesheetId(item.id)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          selectedTimesheetId === item.id
                            ? "border-cyan-400/40 bg-cyan-400/10"
                            : "border-white/10 bg-slate-950/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-white">
                            {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                          </div>
                          <StatusPill value={item.status} />
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          {item.totalHours.toFixed(2)} h total / OT {item.overtimeHours.toFixed(2)} h
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No timesheets yet.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Selected timesheet</div>
                {selectedTimesheet ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoCard label="Status" value={selectedTimesheet.status} />
                      <InfoCard label="Hours" value={`${selectedTimesheet.totalHours.toFixed(2)} h`} />
                      <InfoCard label="Overtime" value={`${selectedTimesheet.overtimeHours.toFixed(2)} h`} />
                      <InfoCard label="Contract" value={selectedTimesheet.contract.lifecycleStatus} />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="text-sm font-semibold text-white">Add entry</div>
                      <div className="mt-4 grid gap-4">
                        <input
                          type="date"
                          value={workDate}
                          onChange={(event) => setWorkDate(event.target.value)}
                          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={hoursWorked}
                            onChange={(event) => setHoursWorked(event.target.value)}
                            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                            placeholder="Hours worked"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={overtimeHours}
                            onChange={(event) => setOvertimeHours(event.target.value)}
                            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                            placeholder="Overtime hours"
                          />
                        </div>
                        <textarea
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          rows={3}
                          placeholder="Optional notes"
                          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => void handleAddEntry()}
                            disabled={working}
                            className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Add entry
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSubmitTimesheet()}
                            disabled={working}
                            className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Submit timesheet
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="text-sm font-semibold text-white">Entries</div>
                      <div className="mt-4 space-y-3">
                        {selectedTimesheet.entries.length ? (
                          selectedTimesheet.entries.map((entry) => (
                            <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-medium text-white">{formatDate(entry.workDate)}</div>
                                <div className="text-xs text-slate-400">
                                  {entry.hoursWorked.toFixed(2)} h / OT {entry.overtimeHours.toFixed(2)} h
                                </div>
                              </div>
                              {entry.notes ? (
                                <div className="mt-2 text-sm text-slate-300">{entry.notes}</div>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No entries yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-400">
                    Select a timesheet to add entries and submit it.
                  </div>
                )}
              </section>

              {error ? (
                <section className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
                  {error}
                </section>
              ) : null}

              {success ? (
                <section className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
                  {success}
                </section>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const classes =
    value === "APPROVED"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : value === "REJECTED"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
        : value === "SUBMITTED"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : "border-slate-600 bg-slate-800 text-slate-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {value}
    </span>
  );
}
