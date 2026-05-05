"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { WorkerTimesheet } from "../../lib/project-types";

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

function getTimesheetBadge(status: string) {
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

type Props = {
  token: string;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

export function ProfileTimesheetsPanel({ token, onError, onSuccess }: Props) {
  const [timesheets, setTimesheets] = useState<WorkerTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPanel = async () => {
    setIsLoading(true);
    onError(null);

    try {
      const response = await apiRequest<WorkerTimesheet[]>("/profile/timesheets", { token });
      setTimesheets(response);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load profile timesheets.");
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
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Timesheets & Payroll</div>
          <div className="mt-2 text-sm text-slate-400">
            Review worker time periods, approval state, and payroll summaries tied to approved work.
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await loadPanel();
            onSuccess("Profile timesheets refreshed.");
          }}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {!isLoading && timesheets.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
            No timesheets generated yet.
          </div>
        ) : null}

        {timesheets.map((timesheet) => (
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

            {timesheet.payrollCalculation ? (
              <div className="mt-4 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/5 p-4">
                <div className="text-sm font-semibold text-white">Payroll summary</div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
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
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
