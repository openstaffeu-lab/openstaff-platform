"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import {
  JobRequestStatus,
  ProfileDetail,
  ProfileWorker,
  ProjectDetail,
  ProjectWorkerAssignment,
  ProjectWorkerAssignmentStatus,
} from "../../lib/project-types";

const assignmentStatusOptions: ProjectWorkerAssignmentStatus[] = [
  "PROPOSED",
  "APPROVED",
  "ACTIVE",
  "REMOVED",
  "BLOCKED",
];

type AssignmentDraft = {
  workerId: string;
  jobRequestId: string;
};

const emptyAssignmentDraft: AssignmentDraft = {
  workerId: "",
  jobRequestId: "",
};

function getEligibilityBadge(status: string) {
  if (status === "ELIGIBLE") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "PARTIALLY_ELIGIBLE") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  if (status === "NOT_ELIGIBLE" || status === "BLOCKED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getAssignmentBadge(status: ProjectWorkerAssignmentStatus) {
  if (status === "APPROVED" || status === "ACTIVE") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "PROPOSED") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "BLOCKED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-slate-400/20 bg-slate-500/10 text-slate-200";
}

type Props = {
  token: string;
  project: ProjectDetail;
  currentUserId: string | null;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

export function ProjectWorkerAssignmentsPanel({
  token,
  project,
  currentUserId,
  onError,
  onSuccess,
}: Props) {
  const [currentProfile, setCurrentProfile] = useState<ProfileDetail | null>(null);
  const [workers, setWorkers] = useState<ProfileWorker[]>([]);
  const [assignments, setAssignments] = useState<ProjectWorkerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingAssignmentId, setWorkingAssignmentId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssignmentDraft>(emptyAssignmentDraft);

  const isOwner = currentUserId === project.createdById;
  const availableWorkers = useMemo(
    () => workers.filter((worker) => worker.status === "ACTIVE"),
    [workers],
  );

  const loadPanel = async () => {
    setIsLoading(true);
    try {
      const [assignmentsResponse, currentProfileResponse, workerResponse] = await Promise.all([
        apiRequest<ProjectWorkerAssignment[]>(`/projects/${project.id}/worker-assignments`, { token }),
        apiRequest<ProfileDetail | null>("/profile", { token }).catch((error) => {
          if (error instanceof ApiError && error.status === 404) {
            return null;
          }
          throw error;
        }),
        apiRequest<ProfileWorker[]>("/profile/workers", { token }).catch((error) => {
          if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
            return [];
          }
          throw error;
        }),
      ]);

      setAssignments(assignmentsResponse);
      setCurrentProfile(currentProfileResponse);
      setWorkers(workerResponse);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load worker assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPanel();
  }, [project.id, token]);

  const handleCreateAssignment = async () => {
    setIsSubmitting(true);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/worker-assignments`, {
        method: "POST",
        token,
        body: {
          workerId: draft.workerId,
          jobRequestId: draft.jobRequestId || undefined,
          profileId: currentProfile?.id,
        },
      });
      setDraft(emptyAssignmentDraft);
      await loadPanel();
      onSuccess("Worker assignment submitted.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to create worker assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    assignmentId: string,
    status: ProjectWorkerAssignmentStatus,
  ) => {
    setWorkingAssignmentId(assignmentId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/worker-assignments/${assignmentId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadPanel();
      onSuccess("Worker assignment updated.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update worker assignment.");
    } finally {
      setWorkingAssignmentId(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Worker Assignments</div>
          <div className="mt-2 text-sm text-slate-400">
            Propose job-request workers from contractor rosters, then approve only eligible people.
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {assignments.length} assignments
        </span>
      </div>

      {currentProfile && availableWorkers.length > 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
          <div className="text-sm font-semibold text-white">Propose worker</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={draft.workerId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, workerId: event.target.value }))
              }
            >
              <option value="">Select worker</option>
              {availableWorkers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.fullName} · {worker.roleTitle}
                </option>
              ))}
            </select>
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={draft.jobRequestId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, jobRequestId: event.target.value }))
              }
            >
              <option value="">Project-level assignment</option>
              {project.jobRequests.map((jobRequest) => (
                <option key={jobRequest.id} value={jobRequest.id}>
                  {jobRequest.title} · {jobRequest.status}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreateAssignment}
            disabled={isSubmitting || !draft.workerId}
            className="mt-4 rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Propose worker assignment"}
          </button>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {!isLoading && assignments.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
            No worker assignments yet.
          </div>
        ) : null}

        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">
                  {assignment.worker?.fullName || "Worker"}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {assignment.worker?.roleTitle || "Role pending"} ·{" "}
                  {assignment.jobRequest?.title || "Project-wide assignment"} ·{" "}
                  {assignment.profile?.displayName || "Profile"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${getAssignmentBadge(
                    assignment.status,
                  )}`}
                >
                  {assignment.status.replaceAll("_", " ")}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                    assignment.eligibility.workerEligibility ||
                      assignment.eligibility.jobRequestEligibility ||
                      assignment.eligibility.projectEligibility,
                  )}`}
                >
                  {(
                    assignment.eligibility.workerEligibility ||
                    assignment.eligibility.jobRequestEligibility ||
                    assignment.eligibility.projectEligibility
                  ).replaceAll("_", " ")}
                </span>
              </div>
            </div>

            {assignment.eligibility.blockingReasons.length > 0 ? (
              <div className="mt-4 rounded-[1.25rem] border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-100">
                {assignment.eligibility.blockingReasons.join(" | ")}
              </div>
            ) : null}

            {assignment.eligibility.warnings.length > 0 ? (
              <div className="mt-3 rounded-[1.25rem] border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
                {assignment.eligibility.warnings.join(" | ")}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(isOwner
                ? assignmentStatusOptions.filter((status) =>
                    ["APPROVED", "ACTIVE", "BLOCKED", "REMOVED"].includes(status),
                  )
                : assignmentStatusOptions.filter((status) => ["PROPOSED", "REMOVED"].includes(status))
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleUpdateStatus(assignment.id, status)}
                  disabled={
                    workingAssignmentId === assignment.id ||
                    assignment.status === status ||
                    (status === "APPROVED" && !assignment.canApprove)
                  }
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
                >
                  Set {status}
                </button>
              ))}
            </div>

            {assignment.worker?.documents.length ? (
              <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                <div className="text-sm font-semibold text-white">Worker compliance evidence</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignment.worker.documents.map((document) => (
                    <span
                      key={document.id}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                    >
                      {document.type} · {document.status}
                      {document.medicalCategory ? ` · ${document.medicalCategory}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
