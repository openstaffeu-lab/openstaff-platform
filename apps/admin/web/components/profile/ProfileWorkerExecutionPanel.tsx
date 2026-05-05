"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  WorkerAttendance,
  WorkerAttendanceStatus,
  WorkerWorkLog,
  WorkerWorkLogStatus,
} from "../../lib/project-types";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Open";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function getAttendanceBadge(status: WorkerAttendanceStatus | string) {
  if (status === "CHECKED_IN") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "CHECKED_OUT") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "INVALID") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-amber-400/20 bg-amber-500/10 text-amber-100";
}

function getWorkLogBadge(status: WorkerWorkLogStatus | string) {
  if (status === "APPROVED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "SUBMITTED") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "REJECTED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

type Props = {
  token: string;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

export function ProfileWorkerExecutionPanel({ token, onError, onSuccess }: Props) {
  const [attendance, setAttendance] = useState<WorkerAttendance[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkerWorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPanel = async () => {
    setIsLoading(true);
    onError(null);

    try {
      const [attendanceResponse, workLogsResponse] = await Promise.all([
        apiRequest<WorkerAttendance[]>("/profile/attendance", { token }),
        apiRequest<WorkerWorkLog[]>("/profile/work-logs", { token }),
      ]);

      setAttendance(attendanceResponse);
      setWorkLogs(workLogsResponse);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load worker execution history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPanel();
  }, [token]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Execution History</div>
          <div className="mt-2 text-sm text-slate-400">
            Review worker attendance and submitted work logs across active project assignments.
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await loadPanel();
            onSuccess("Worker execution history refreshed.");
          }}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Attendance history</div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {attendance.length} records
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {!isLoading && attendance.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No attendance records yet.
              </div>
            ) : null}

            {attendance.slice(0, 16).map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{entry.worker?.fullName || "Worker"}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {entry.worker?.roleTitle || "Role pending"} ·{" "}
                      {entry.jobRequest?.title || "Project-wide assignment"}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getAttendanceBadge(
                      entry.status,
                    )}`}
                  >
                    {entry.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                  <div>Check in: {formatDateTime(entry.checkInAt)}</div>
                  <div>Check out: {formatDateTime(entry.checkOutAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Work logs</div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {workLogs.length} logs
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {!isLoading && workLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No work logs submitted yet.
              </div>
            ) : null}

            {workLogs.slice(0, 16).map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{log.worker?.fullName || "Worker"}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDate(log.date)} · {log.hoursWorked} hours ·{" "}
                      {log.jobRequest?.title || "Project-wide assignment"}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getWorkLogBadge(log.status)}`}
                  >
                    {log.status.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
