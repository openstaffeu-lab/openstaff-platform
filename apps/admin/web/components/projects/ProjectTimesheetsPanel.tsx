"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import {
  ProfileDetail,
  ProjectDetail,
  ProjectWorkerAssignment,
  WorkerTimesheet,
  WorkerTimesheetStatus,
} from "../../lib/project-types";

type GenerateDraft = {
  workerId: string;
  contractId: string;
  periodStart: string;
  periodEnd: string;
};

const reviewStatuses: WorkerTimesheetStatus[] = ["APPROVED", "REJECTED"];

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: number | null | undefined, currencyCode: string | null | undefined) {
  if (value === null || value === undefined) {
    return "Not calculated";
  }

  return `${currencyCode || "EUR"} ${(value / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getTimesheetBadge(status: WorkerTimesheetStatus | string) {
  if (status === "APPROVED" || status === "LOCKED") {
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

function getDefaultPeriodEnd(periodStart: string) {
  if (!periodStart) {
    return "";
  }

  const start = new Date(periodStart);
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
}

type Props = {
  token: string;
  project: ProjectDetail;
  currentUserId: string | null;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

export function ProjectTimesheetsPanel({
  token,
  project,
  currentUserId,
  onError,
  onSuccess,
}: Props) {
  const [currentProfile, setCurrentProfile] = useState<ProfileDetail | null>(null);
  const [assignments, setAssignments] = useState<ProjectWorkerAssignment[]>([]);
  const [timesheets, setTimesheets] = useState<WorkerTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [workingTimesheetId, setWorkingTimesheetId] = useState<string | null>(null);
  const [generateDraft, setGenerateDraft] = useState<GenerateDraft>({
    workerId: "",
    contractId: "",
    periodStart: "",
    periodEnd: "",
  });

  const isOwner = currentUserId === project.createdById;

  const visibleAssignments = useMemo(() => {
    if (isOwner || !currentProfile) {
      return assignments.filter((assignment) =>
        ["APPROVED", "ACTIVE"].includes(assignment.status),
      );
    }

    return assignments.filter(
      (assignment) =>
        assignment.profile?.id === currentProfile.id &&
        ["APPROVED", "ACTIVE"].includes(assignment.status),
    );
  }, [assignments, currentProfile, isOwner]);

  const loadPanel = async () => {
    setIsLoading(true);
    onError(null);

    try {
      const [timesheetsResponse, assignmentsResponse, currentProfileResponse] = await Promise.all([
        apiRequest<WorkerTimesheet[]>(`/projects/${project.id}/timesheets`, { token }),
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

      setTimesheets(timesheetsResponse);
      setAssignments(assignmentsResponse);
      setCurrentProfile(currentProfileResponse);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load project timesheets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPanel();
  }, [project.id, token]);

  useEffect(() => {
    if (!generateDraft.workerId && visibleAssignments.length > 0) {
      const assignment = visibleAssignments[0];
      setGenerateDraft({
        workerId: assignment.workerId,
        contractId: assignment.contractId || "",
        periodStart: "",
        periodEnd: "",
      });
    }
  }, [generateDraft.workerId, visibleAssignments]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/timesheets/generate`, {
        method: "POST",
        token,
        body: {
          workerId: generateDraft.workerId,
          contractId: generateDraft.contractId || undefined,
          periodStart: generateDraft.periodStart,
          periodEnd: generateDraft.periodEnd,
        },
      });
      await loadPanel();
      onSuccess("Worker timesheet generated.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to generate worker timesheet.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusUpdate = async (timesheetId: string, status: WorkerTimesheetStatus) => {
    setWorkingTimesheetId(timesheetId);
    onError(null);
    onSuccess(null);

    try {
      const response = await apiRequest<WorkerTimesheet>(`/projects/${project.id}/timesheets/${timesheetId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadPanel();
      if (response.complianceWarnings?.length) {
        onSuccess(`Timesheet updated with warnings: ${response.complianceWarnings.join(" | ")}`);
      } else {
        onSuccess("Timesheet updated.");
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update timesheet.");
    } finally {
      setWorkingTimesheetId(null);
    }
  };

  const handleCalculatePayroll = async (timesheetId: string) => {
    setWorkingTimesheetId(timesheetId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/projects/${project.id}/timesheets/${timesheetId}/payroll-calculate`, {
        method: "POST",
        token,
      });
      await loadPanel();
      onSuccess("Payroll calculated for the timesheet.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to calculate payroll.");
    } finally {
      setWorkingTimesheetId(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Timesheets & Payroll</div>
          <div className="mt-2 text-sm text-slate-400">
            Generate worker timesheets from approved logs, review them, and calculate payroll assumptions.
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await loadPanel();
            onSuccess("Project timesheets refreshed.");
          }}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
        >
          Refresh
        </button>
      </div>

      {visibleAssignments.length > 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
          <div className="text-sm font-semibold text-white">Generate timesheet</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={generateDraft.workerId}
              onChange={(event) => {
                const assignment =
                  visibleAssignments.find((item) => item.workerId === event.target.value) || null;
                setGenerateDraft((current) => ({
                  ...current,
                  workerId: event.target.value,
                  contractId: assignment?.contractId || "",
                }));
              }}
            >
              <option value="">Select worker</option>
              {visibleAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.workerId}>
                  {assignment.worker?.fullName || "Worker"} ·{" "}
                  {assignment.jobRequest?.title || "Project-wide assignment"}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={generateDraft.periodStart}
              onChange={(event) =>
                setGenerateDraft((current) => ({
                  ...current,
                  periodStart: event.target.value,
                  periodEnd: current.periodEnd || getDefaultPeriodEnd(event.target.value),
                }))
              }
            />
            <input
              type="date"
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={generateDraft.periodEnd}
              onChange={(event) =>
                setGenerateDraft((current) => ({ ...current, periodEnd: event.target.value }))
              }
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                !generateDraft.workerId ||
                !generateDraft.periodStart ||
                !generateDraft.periodEnd
              }
              className="rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate Timesheet"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {!isLoading && timesheets.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
            No timesheets generated yet.
          </div>
        ) : null}

        {timesheets.map((timesheet) => {
          const isProfileOwner = currentProfile?.id === timesheet.profileId;
          const canSubmit =
            isProfileOwner &&
            (timesheet.status === "DRAFT" || timesheet.status === "REJECTED");
          const canReview = isOwner && timesheet.status === "SUBMITTED";
          const canLock = isOwner && timesheet.status === "APPROVED";
          const canCalculatePayroll =
            (isOwner || isProfileOwner) &&
            (timesheet.status === "APPROVED" || timesheet.status === "LOCKED");

          return (
            <div
              key={timesheet.id}
              className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {timesheet.worker?.fullName || "Worker"}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {formatDate(timesheet.periodStart)} - {formatDate(timesheet.periodEnd)} ·{" "}
                    {timesheet.contract?.title || "Project time period"}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${getTimesheetBadge(
                    timesheet.status,
                  )}`}
                >
                  {timesheet.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                  Total: {timesheet.totalHours.toFixed(1)}h
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                  Regular: {timesheet.regularHours.toFixed(1)}h
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                  Overtime: {timesheet.overtimeHours.toFixed(1)}h
                </div>
              </div>

              {timesheet.complianceWarnings?.length ? (
                <div className="mt-4 rounded-[1.25rem] border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
                  {timesheet.complianceWarnings.join(" | ")}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                {canSubmit ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(timesheet.id, "SUBMITTED")}
                    disabled={workingTimesheetId === timesheet.id}
                    className="rounded-2xl border border-cyan-400/20 px-4 py-2 text-sm text-cyan-100 disabled:opacity-60"
                  >
                    Submit Timesheet
                  </button>
                ) : null}

                {canReview
                  ? reviewStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusUpdate(timesheet.id, status)}
                        disabled={workingTimesheetId === timesheet.id}
                        className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
                      >
                        {status}
                      </button>
                    ))
                  : null}

                {canLock ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(timesheet.id, "LOCKED")}
                    disabled={workingTimesheetId === timesheet.id}
                    className="rounded-2xl border border-amber-400/20 px-4 py-2 text-sm text-amber-100 disabled:opacity-60"
                  >
                    Lock Timesheet
                  </button>
                ) : null}

                {canCalculatePayroll ? (
                  <button
                    type="button"
                    onClick={() => handleCalculatePayroll(timesheet.id)}
                    disabled={workingTimesheetId === timesheet.id}
                    className="rounded-2xl border border-emerald-400/20 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60"
                  >
                    Calculate Payroll
                  </button>
                ) : null}
              </div>

              {timesheet.payrollCalculation ? (
                <div className="mt-5 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <div className="text-sm font-semibold text-white">Payroll breakdown</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Rate:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.hourlyRateCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                      /h
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Gross:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.grossPayCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Net:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.netPayCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Employer cost:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.employerCostCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Regular pay:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.regularPayCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Overtime pay:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.overtimePayCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                      Tax + social:{" "}
                      {formatMoney(
                        timesheet.payrollCalculation.estimatedTaxCents +
                          timesheet.payrollCalculation.estimatedSocialContributionCents,
                        timesheet.payrollCalculation.currencyCode,
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
