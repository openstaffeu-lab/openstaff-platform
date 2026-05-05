"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import {
  ProfileDetail,
  ProjectDetail,
  ProjectWorkerAssignment,
  WorkerAttendance,
  WorkerAttendanceStatus,
  WorkerWorkLog,
  WorkerWorkLogStatus,
} from "../../lib/project-types";

type CheckInDraft = {
  assignmentId: string;
  workerId: string;
  locationLat: string;
  locationLng: string;
};

type WorkLogDraft = {
  assignmentId: string;
  workerId: string;
  jobRequestId: string;
  date: string;
  hoursWorked: string;
  description: string;
};

const reviewStatuses: WorkerWorkLogStatus[] = ["APPROVED", "REJECTED"];

const emptyCheckInDraft: CheckInDraft = {
  assignmentId: "",
  workerId: "",
  locationLat: "",
  locationLng: "",
};

const todayIso = new Date().toISOString().slice(0, 10);

const emptyWorkLogDraft: WorkLogDraft = {
  assignmentId: "",
  workerId: "",
  jobRequestId: "",
  date: todayIso,
  hoursWorked: "",
  description: "",
};

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
  project: ProjectDetail;
  currentUserId: string | null;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

export function ProjectExecutionPanel({
  token,
  project,
  currentUserId,
  onError,
  onSuccess,
}: Props) {
  const [currentProfile, setCurrentProfile] = useState<ProfileDetail | null>(null);
  const [assignments, setAssignments] = useState<ProjectWorkerAssignment[]>([]);
  const [attendance, setAttendance] = useState<WorkerAttendance[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkerWorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [workingLogId, setWorkingLogId] = useState<string | null>(null);
  const [checkInDraft, setCheckInDraft] = useState<CheckInDraft>(emptyCheckInDraft);
  const [workLogDraft, setWorkLogDraft] = useState<WorkLogDraft>(emptyWorkLogDraft);

  const isOwner = currentUserId === project.createdById;
  const isSupervisor = currentProfile?.profileType === "SUPERVISOR";
  const isReviewer = isOwner || isSupervisor;

  const contractorAssignments = useMemo(() => {
    if (!currentProfile) {
      return [];
    }

    return assignments.filter((assignment) => assignment.profile?.id === currentProfile.id);
  }, [assignments, currentProfile]);

  const activeAssignments = useMemo(
    () => contractorAssignments.filter((assignment) => assignment.status === "ACTIVE"),
    [contractorAssignments],
  );

  const loggableAssignments = useMemo(
    () =>
      contractorAssignments.filter((assignment) =>
        ["APPROVED", "ACTIVE"].includes(assignment.status),
      ),
    [contractorAssignments],
  );

  const onSiteAttendance = useMemo(
    () => attendance.filter((entry) => entry.status === "CHECKED_IN" && !entry.checkOutAt),
    [attendance],
  );

  const loadPanel = async () => {
    setIsLoading(true);
    onError(null);

    try {
      const [attendanceResponse, workLogsResponse, assignmentsResponse, currentProfileResponse] =
        await Promise.all([
          apiRequest<WorkerAttendance[]>(`/projects/${project.id}/attendance`, { token }),
          apiRequest<WorkerWorkLog[]>(`/projects/${project.id}/work-logs`, { token }),
          apiRequest<ProjectWorkerAssignment[]>(`/projects/${project.id}/worker-assignments`, {
            token,
          }),
          apiRequest<ProfileDetail | null>("/profile", { token }).catch((error) => {
            if (error instanceof ApiError && error.status === 404) {
              return null;
            }

            throw error;
          }),
        ]);

      setAttendance(attendanceResponse);
      setWorkLogs(workLogsResponse);
      setAssignments(assignmentsResponse);
      setCurrentProfile(currentProfileResponse);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load project execution data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPanel();
  }, [project.id, token]);

  useEffect(() => {
    if (!checkInDraft.assignmentId && activeAssignments.length > 0) {
      const assignment = activeAssignments[0];
      setCheckInDraft((current) => ({
        ...current,
        assignmentId: assignment.id,
        workerId: assignment.workerId,
      }));
    }
  }, [activeAssignments, checkInDraft.assignmentId]);

  useEffect(() => {
    if (!workLogDraft.assignmentId && loggableAssignments.length > 0) {
      const assignment = loggableAssignments[0];
      setWorkLogDraft((current) => ({
        ...current,
        assignmentId: assignment.id,
        workerId: assignment.workerId,
        jobRequestId: assignment.jobRequestId || "",
      }));
    }
  }, [loggableAssignments, workLogDraft.assignmentId]);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/attendance/check-in`, {
        method: "POST",
        token,
        body: {
          assignmentId: checkInDraft.assignmentId,
          workerId: checkInDraft.workerId,
          locationLat: checkInDraft.locationLat ? Number(checkInDraft.locationLat) : undefined,
          locationLng: checkInDraft.locationLng ? Number(checkInDraft.locationLng) : undefined,
        },
      });
      await loadPanel();
      onSuccess("Worker checked in.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to check worker in.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async (entry: WorkerAttendance) => {
    setIsCheckingOut(true);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/attendance/check-out`, {
        method: "POST",
        token,
        body: {
          assignmentId: entry.assignmentId,
          workerId: entry.workerId,
        },
      });
      await loadPanel();
      onSuccess("Worker checked out.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to check worker out.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSubmitWorkLog = async () => {
    setIsSubmittingLog(true);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/work-logs`, {
        method: "POST",
        token,
        body: {
          assignmentId: workLogDraft.assignmentId,
          workerId: workLogDraft.workerId,
          jobRequestId: workLogDraft.jobRequestId || undefined,
          date: workLogDraft.date,
          hoursWorked: Number(workLogDraft.hoursWorked),
          description: workLogDraft.description,
          status: "SUBMITTED",
        },
      });
      setWorkLogDraft((current) => ({
        ...emptyWorkLogDraft,
        assignmentId: current.assignmentId,
        workerId: current.workerId,
        jobRequestId: current.jobRequestId,
      }));
      await loadPanel();
      onSuccess("Work log submitted.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to submit work log.");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleReviewWorkLog = async (logId: string, status: WorkerWorkLogStatus) => {
    setWorkingLogId(logId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/work-logs/${logId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadPanel();
      onSuccess(`Work log ${status.toLowerCase()}.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to review work log.");
    } finally {
      setWorkingLogId(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Execution Tracking</div>
          <div className="mt-2 text-sm text-slate-400">
            Track who is on site, capture check-in and check-out, and review submitted worker work logs.
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await loadPanel();
            onSuccess("Execution data refreshed.");
          }}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
        >
          Refresh
        </button>
      </div>

      {!isOwner && currentProfile && activeAssignments.length > 0 ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
            <div className="text-sm font-semibold text-white">Attendance actions</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none md:col-span-2"
                value={checkInDraft.assignmentId}
                onChange={(event) => {
                  const assignment =
                    activeAssignments.find((item) => item.id === event.target.value) || null;
                  setCheckInDraft({
                    assignmentId: event.target.value,
                    workerId: assignment?.workerId || "",
                    locationLat: "",
                    locationLng: "",
                  });
                }}
              >
                <option value="">Select active worker assignment</option>
                {activeAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.worker?.fullName || "Worker"} ·{" "}
                    {assignment.jobRequest?.title || "Project-wide assignment"}
                  </option>
                ))}
              </select>
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                placeholder="Latitude (optional)"
                value={checkInDraft.locationLat}
                onChange={(event) =>
                  setCheckInDraft((current) => ({ ...current, locationLat: event.target.value }))
                }
              />
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                placeholder="Longitude (optional)"
                value={checkInDraft.locationLng}
                onChange={(event) =>
                  setCheckInDraft((current) => ({ ...current, locationLng: event.target.value }))
                }
              />
            </div>

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={isCheckingIn || !checkInDraft.assignmentId || !checkInDraft.workerId}
              className="mt-4 rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {isCheckingIn ? "Checking in..." : "Check In Worker"}
            </button>
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
            <div className="text-sm font-semibold text-white">Submit work log</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none md:col-span-2"
                value={workLogDraft.assignmentId}
                onChange={(event) => {
                  const assignment =
                    loggableAssignments.find((item) => item.id === event.target.value) || null;
                  setWorkLogDraft((current) => ({
                    ...current,
                    assignmentId: event.target.value,
                    workerId: assignment?.workerId || "",
                    jobRequestId: assignment?.jobRequestId || "",
                  }));
                }}
              >
                <option value="">Select assignment</option>
                {loggableAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.worker?.fullName || "Worker"} ·{" "}
                    {assignment.jobRequest?.title || "Project-wide assignment"}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                value={workLogDraft.date}
                onChange={(event) =>
                  setWorkLogDraft((current) => ({ ...current, date: event.target.value }))
                }
              />
              <input
                type="number"
                min={0}
                step={0.5}
                className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                placeholder="Hours worked"
                value={workLogDraft.hoursWorked}
                onChange={(event) =>
                  setWorkLogDraft((current) => ({ ...current, hoursWorked: event.target.value }))
                }
              />
              <textarea
                className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none md:col-span-2"
                placeholder="Describe the work completed"
                value={workLogDraft.description}
                onChange={(event) =>
                  setWorkLogDraft((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitWorkLog}
              disabled={
                isSubmittingLog ||
                !workLogDraft.assignmentId ||
                !workLogDraft.workerId ||
                !workLogDraft.date ||
                !workLogDraft.hoursWorked ||
                !workLogDraft.description.trim()
              }
              className="mt-4 rounded-[1.25rem] border border-cyan-400/20 px-5 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-60"
            >
              {isSubmittingLog ? "Submitting..." : "Submit Work Log"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Attendance panel</div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {onSiteAttendance.length} on site
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {!isLoading && attendance.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No attendance records yet.
              </div>
            ) : null}

            {attendance.slice(0, 16).map((entry) => {
              const canCheckOut =
                !isOwner &&
                currentProfile?.id === entry.worker?.profileId &&
                entry.status === "CHECKED_IN" &&
                !entry.checkOutAt;

              return (
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

                  {canCheckOut ? (
                    <button
                      type="button"
                      onClick={() => handleCheckOut(entry)}
                      disabled={isCheckingOut}
                      className="mt-4 rounded-2xl border border-emerald-400/20 px-4 py-2 text-xs text-emerald-100 disabled:opacity-60"
                    >
                      {isCheckingOut ? "Checking out..." : "Check Out"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Work logs panel</div>
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

                {isReviewer && log.status === "SUBMITTED" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {reviewStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleReviewWorkLog(log.id, status)}
                        disabled={workingLogId === log.id}
                        className="rounded-2xl border border-white/10 px-4 py-2 text-xs text-slate-200 disabled:opacity-50"
                      >
                        {workingLogId === log.id ? "Updating..." : status}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
