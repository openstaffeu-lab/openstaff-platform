"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveAdminOperationalTimesheet,
  getAdminOperationalAttendance,
  getAdminOperationalTimesheet,
  getAdminOperationalTimesheets,
  rejectAdminOperationalTimesheet,
  type AdminOperationalAttendanceRecord,
  type AdminOperationalTimesheet,
  type OperationalTimesheetStatus,
} from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<AdminOperationalTimesheet[]>([]);
  const [attendance, setAttendance] = useState<AdminOperationalAttendanceRecord[]>([]);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(null);
  const [timesheetDetail, setTimesheetDetail] = useState<AdminOperationalTimesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [timesheetsResponse, attendanceResponse] = await Promise.all([
        getAdminOperationalTimesheets({
          q: query || undefined,
          status: (status as OperationalTimesheetStatus) || undefined,
        }),
        getAdminOperationalAttendance({ q: query || undefined }),
      ]);

      setTimesheets(timesheetsResponse);
      setAttendance(attendanceResponse);

      if (!selectedTimesheetId && timesheetsResponse[0]) {
        setSelectedTimesheetId(timesheetsResponse[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca timesheets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [query, status]);

  useEffect(() => {
    if (!selectedTimesheetId) {
      setTimesheetDetail(null);
      return;
    }

    const timesheetId = selectedTimesheetId;
    let cancelled = false;

    async function loadDetail() {
      try {
        const detail = await getAdminOperationalTimesheet(timesheetId);
        if (!cancelled) {
          setTimesheetDetail(detail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca detaliul timesheet-ului.");
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedTimesheetId]);

  const stats = useMemo(
    () => ({
      total: timesheets.length,
      pending: timesheets.filter((item) => item.status === "SUBMITTED").length,
      approvedHours: timesheets
        .filter((item) => item.status === "APPROVED")
        .reduce((sum, item) => sum + item.totalHours, 0),
      overtime: timesheets.reduce((sum, item) => sum + item.overtimeHours, 0),
    }),
    [timesheets],
  );

  async function handleApprove() {
    if (!timesheetDetail) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await approveAdminOperationalTimesheet(timesheetDetail.id, {
        note: reviewNote || undefined,
      });
      await loadData();
      setTimesheetDetail(updated);
      setSelectedTimesheetId(updated.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Approve failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!timesheetDetail) {
      return;
    }

    if (!rejectReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await rejectAdminOperationalTimesheet(timesheetDetail.id, {
        reason: rejectReason.trim(),
      });
      await loadData();
      setTimesheetDetail(updated);
      setSelectedTimesheetId(updated.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Reject failed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Workforce Execution
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Timesheets, attendance, and approval command board
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Operational execution tracking now bridges active assignments, contracts, and future
          payroll inputs without touching the payroll engine itself.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Timesheets" value={stats.total} />
        <StatCard label="Pending approvals" value={stats.pending} />
        <StatCard label="Approved hours" value={Number(stats.approvedHours.toFixed(2))} />
        <StatCard label="Overtime hours" value={Number(stats.overtime.toFixed(2))} />
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by worker, project, or job"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
            <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold text-white">
              Pending and historical timesheets
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Worker</th>
                    <th className="px-4 py-4">Project</th>
                    <th className="px-4 py-4">Hours</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-5 text-slate-400" colSpan={4}>
                        Loading timesheets...
                      </td>
                    </tr>
                  ) : timesheets.length ? (
                    timesheets.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedTimesheetId(item.id)}
                        className={`cursor-pointer transition hover:bg-slate-900/70 ${
                          selectedTimesheetId === item.id ? "bg-slate-900/80" : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">
                            {item.user.identityProfile?.displayName ?? item.user.email}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">{item.job.title}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{item.project.name}</div>
                          <div className="mt-1 text-xs text-slate-400">{item.project.slug}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{item.totalHours.toFixed(2)} h</div>
                          <div className="mt-1 text-xs text-slate-400">
                            OT {item.overtimeHours.toFixed(2)} h
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill value={item.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-5 text-slate-400" colSpan={4}>
                        No timesheets found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
            <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold text-white">
              Attendance stream
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Worker</th>
                    <th className="px-4 py-4">Check-in</th>
                    <th className="px-4 py-4">Check-out</th>
                    <th className="px-4 py-4">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {attendance.length ? (
                    attendance.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{item.user.email}</div>
                          <div className="mt-1 text-xs text-slate-400">{item.job.title}</div>
                        </td>
                        <td className="px-4 py-4">{formatDate(item.checkInAt)}</td>
                        <td className="px-4 py-4">{formatDate(item.checkOutAt)}</td>
                        <td className="px-4 py-4">
                          {item.durationHours !== null ? `${item.durationHours.toFixed(2)} h` : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-5 text-slate-400" colSpan={4}>
                        No attendance records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-sm font-semibold text-white">Timesheet detail</div>
            {timesheetDetail ? (
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <KeyValue label="Worker" value={timesheetDetail.user.identityProfile?.displayName ?? timesheetDetail.user.email} />
                <KeyValue label="Period" value={`${formatDate(timesheetDetail.periodStart)} - ${formatDate(timesheetDetail.periodEnd)}`} />
                <KeyValue label="Status" value={timesheetDetail.status} />
                <KeyValue label="Hours" value={`${timesheetDetail.totalHours.toFixed(2)} h`} />
                <KeyValue label="Overtime" value={`${timesheetDetail.overtimeHours.toFixed(2)} h`} />
                <KeyValue label="Contract" value={timesheetDetail.contract.lifecycleStatus} />
                {timesheetDetail.rejectionReason ? (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Rejection reason: {timesheetDetail.rejectionReason}
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Entries</div>
                  <div className="mt-3 space-y-3">
                    {timesheetDetail.entries.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-white">{formatDate(entry.workDate)}</div>
                          <div className="text-xs text-slate-400">
                            {entry.hoursWorked.toFixed(2)} h / OT {entry.overtimeHours.toFixed(2)} h
                          </div>
                        </div>
                        {entry.notes ? <div className="mt-2 text-xs text-slate-400">{entry.notes}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-400">
                Select a timesheet to review its entries and approve or reject it.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-sm font-semibold text-white">Review actions</div>
            <textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              rows={3}
              placeholder="Optional approval note"
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={!timesheetDetail || actionLoading}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Approve timesheet
            </button>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={3}
              placeholder="Required rejection reason"
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={!timesheetDetail || actionLoading}
              className="mt-4 w-full rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reject timesheet
            </button>
          </section>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
      <div className="text-slate-400">{label}</div>
      <div className="text-right text-white">{value}</div>
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
