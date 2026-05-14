"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  checkInOperationalAttendance,
  checkOutOperationalAttendance,
  getMyOperationalAttendance,
  getMyWorkforceAssignments,
  type MyWorkforceAssignment,
  type OperationalAttendanceRecord,
} from "@/lib/api";

function formatDateTime(value?: string | null) {
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

export default function WorkforceAttendancePage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const [assignments, setAssignments] = useState<MyWorkforceAssignment[]>([]);
  const [attendance, setAttendance] = useState<OperationalAttendanceRecord[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    if (!token) {
      return;
    }

    const [assignmentData, attendanceData] = await Promise.all([
      getMyWorkforceAssignments(token),
      getMyOperationalAttendance(token),
    ]);
    setAssignments(assignmentData);
    setAttendance(attendanceData);
    if (!selectedAssignmentId && assignmentData[0]) {
      setSelectedAssignmentId(assignmentData[0].id);
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

        setError(requestError instanceof Error ? requestError.message : "Failed to load attendance.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isReady, logout, router, token]);

  const openSession = useMemo(
    () =>
      attendance.find(
        (item) =>
          item.assignment.id === selectedAssignmentId && item.status === "CHECKED_IN",
      ) ?? null,
    [attendance, selectedAssignmentId],
  );

  async function handleCheckIn() {
    if (!token || !selectedAssignmentId) {
      return;
    }

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      await checkInOperationalAttendance(
        {
          workforceAssignmentId: selectedAssignmentId,
          source: "MANUAL",
        },
        token,
      );
      await loadData();
      setSuccess("Checked in successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Check-in failed.");
    } finally {
      setWorking(false);
    }
  }

  async function handleCheckOut() {
    if (!token || !selectedAssignmentId) {
      return;
    }

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      await checkOutOperationalAttendance(
        {
          workforceAssignmentId: selectedAssignmentId,
        },
        token,
      );
      await loadData();
      setSuccess("Checked out successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Check-out failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Attendance</div>
          <h1 className="mt-3 text-4xl font-semibold">Operational check-in and check-out flow</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Manage your active attendance sessions against current workforce assignments and
            contract state.
          </p>
        </section>

        {loading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 text-slate-300">
            Loading attendance...
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Attendance controls</div>
                <div className="mt-4 grid gap-4">
                  <select
                    value={selectedAssignmentId}
                    onChange={(event) => setSelectedAssignmentId(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">Select assignment</option>
                    {assignments.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.job.title} / {item.contract.lifecycleStatus}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleCheckIn()}
                      disabled={!selectedAssignmentId || Boolean(openSession) || working}
                      className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Check in
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCheckOut()}
                      disabled={!selectedAssignmentId || !openSession || working}
                      className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Check out
                    </button>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Current session: {openSession ? `OPEN since ${formatDateTime(openSession.checkInAt)}` : "No open session"}
                  </div>
                </div>
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

            <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80">
              <div className="border-b border-white/10 px-5 py-4 text-sm font-semibold text-white">
                Attendance history
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
                  <thead className="bg-slate-950/80 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Job</th>
                      <th className="px-4 py-4">Check-in</th>
                      <th className="px-4 py-4">Check-out</th>
                      <th className="px-4 py-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {attendance.length ? (
                      attendance.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-white">{item.job.title}</div>
                            <div className="mt-1 text-xs text-slate-400">{item.contract.lifecycleStatus}</div>
                          </td>
                          <td className="px-4 py-4">{formatDateTime(item.checkInAt)}</td>
                          <td className="px-4 py-4">{formatDateTime(item.checkOutAt)}</td>
                          <td className="px-4 py-4">
                            {item.durationHours !== null ? `${item.durationHours.toFixed(2)} h` : "Open"}
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
          </section>
        )}
      </div>
    </main>
  );
}
