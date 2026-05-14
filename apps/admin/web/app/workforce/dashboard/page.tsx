"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  getMyOperationalAttendance,
  getMyOperationalTimesheets,
  getMyWorkforceAssignments,
  type MyWorkforceAssignment,
  type OperationalAttendanceRecord,
  type OperationalTimesheet,
} from "@/lib/api";

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

export default function WorkforceDashboardPage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const [assignments, setAssignments] = useState<MyWorkforceAssignment[]>([]);
  const [timesheets, setTimesheets] = useState<OperationalTimesheet[]>([]);
  const [attendance, setAttendance] = useState<OperationalAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [assignmentData, timesheetData, attendanceData] = await Promise.all([
          getMyWorkforceAssignments(token),
          getMyOperationalTimesheets(token),
          getMyOperationalAttendance(token),
        ]);
        setAssignments(assignmentData);
        setTimesheets(timesheetData);
        setAttendance(attendanceData);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load workforce dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isReady, logout, router, token]);

  const stats = useMemo(
    () => ({
      activeAssignments: assignments.filter((item) => item.status === "ACTIVE").length,
      submittedTimesheets: timesheets.filter((item) => item.status === "SUBMITTED").length,
      approvedHours: timesheets
        .filter((item) => item.status === "APPROVED")
        .reduce((sum, item) => sum + item.totalHours, 0),
      openAttendance: attendance.filter((item) => item.status === "CHECKED_IN").length,
    }),
    [assignments, timesheets, attendance],
  );

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Workforce dashboard
              </div>
              <h1 className="mt-3 text-4xl font-semibold">Operational execution overview</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Visibility over active workforce assignments, contract lifecycle status, and
                the current execution cadence.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/workforce/timesheets"
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Open timesheets
              </Link>
              <Link
                href="/workforce/attendance"
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
              >
                Open attendance
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active Assignments" value={stats.activeAssignments} />
          <StatCard label="Submitted Timesheets" value={stats.submittedTimesheets} />
          <StatCard label="Approved Hours" value={Number(stats.approvedHours.toFixed(2))} />
          <StatCard label="Open Attendance" value={stats.openAttendance} />
        </section>

        {loading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 text-slate-300">
            Loading workforce dashboard...
          </section>
        ) : error ? (
          <section className="rounded-[1.75rem] border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
            {error}
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="text-sm font-semibold text-white">Assignments</div>
              <div className="mt-4 space-y-4">
                {assignments.length ? (
                  assignments.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{item.job.title}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            Contract {item.contract.lifecycleStatus}
                          </div>
                        </div>
                        <StatusPill value={item.status} />
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <InfoLine label="Assigned" value={formatDate(item.assignedAt)} />
                        <InfoLine label="Started" value={formatDate(item.startedAt)} />
                        <InfoLine
                          label="Project"
                          value={item.activeProjects[0]?.name ?? "No linked project"}
                        />
                        <InfoLine label="Ends" value={formatDate(item.contract.endDate)} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">
                    No workforce assignments are visible yet.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Latest timesheets</div>
                <div className="mt-4 space-y-3">
                  {timesheets.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-white">
                          {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                        </div>
                        <StatusPill value={item.status} />
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {item.totalHours.toFixed(2)} h total / OT {item.overtimeHours.toFixed(2)} h
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Recent attendance</div>
                <div className="mt-4 space-y-3">
                  {attendance.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-white">{formatDate(item.checkInAt)}</div>
                        <StatusPill value={item.status} />
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        Duration: {item.durationHours !== null ? `${item.durationHours.toFixed(2)} h` : "Open session"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const classes =
    value === "ACTIVE" || value === "APPROVED" || value === "CHECKED_OUT"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : value === "SUBMITTED" || value === "CHECKED_IN"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
        : value === "REJECTED" || value === "TERMINATED" || value === "ENDED"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
          : "border-slate-600 bg-slate-800 text-slate-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {value}
    </span>
  );
}
