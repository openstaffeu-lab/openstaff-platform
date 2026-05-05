"use client";

import { ProjectComplianceOverview } from "../../lib/project-types";

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

function badgeForStatus(status: string) {
  if (status === "READY" || status === "COMPLETED" || status === "VALID") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "AT_RISK" || status === "CRITICAL" || status === "EXPIRED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-amber-400/20 bg-amber-500/10 text-amber-100";
}

type Props = {
  overview: ProjectComplianceOverview | null;
  onRefresh: () => Promise<void>;
};

export function ProjectComplianceOverviewPanel({ overview, onRefresh }: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Compliance Overview
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Active contract readiness, expiring documents, and platform task distribution.
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-[1.25rem] border border-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-100"
        >
          Refresh Overview
        </button>
      </div>

      {overview ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
              Active contracts
              <div className="mt-2 text-3xl font-semibold text-white">
                {overview.summary.activeContracts}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
              Missing requirements
              <div className="mt-2 text-3xl font-semibold text-white">
                {overview.summary.missingRequirementsCount}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
              Expiring soon
              <div className="mt-2 text-3xl font-semibold text-white">
                {overview.summary.expiringCount}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
              Expired
              <div className="mt-2 text-3xl font-semibold text-white">
                {overview.summary.expiredCount}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
              Alerts
              <div className="mt-2 text-3xl font-semibold text-white">
                {overview.summary.openAlerts}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
              Tasks
              <div className="mt-2 text-3xl font-semibold text-white">
                {overview.summary.openTasks}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {overview.actors.length ? (
              overview.actors.map((actor) => (
                <div key={actor.contractId} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{actor.displayName}</div>
                      <div className="mt-2 text-sm text-slate-400">
                        {actor.profileType} · Contract {actor.contractStatus}
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(
                        actor.onboarding.readiness,
                      )}`}
                    >
                      {actor.onboarding.readiness.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                      <div className="text-sm font-semibold text-white">Missing Certificates / Docs</div>
                      <div className="mt-3 space-y-2">
                        {actor.onboarding.requiredItems.filter((item) => !item.satisfied).length ? (
                          actor.onboarding.requiredItems
                            .filter((item) => !item.satisfied)
                            .map((item) => (
                              <div key={item.key} className="text-sm text-slate-300">
                                {item.label}
                              </div>
                            ))
                        ) : (
                          <div className="text-sm text-slate-400">No missing onboarding items.</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                      <div className="text-sm font-semibold text-white">Alerts</div>
                      <div className="mt-3 space-y-2">
                        {actor.alerts.length ? (
                          actor.alerts.map((alert) => (
                            <div key={alert.id} className="text-sm text-slate-300">
                              {alert.message}
                              <div className="mt-1 text-xs text-slate-500">
                                Due {formatDate(alert.dueDate)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No actor alerts.</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                      <div className="text-sm font-semibold text-white">Tasks</div>
                      <div className="mt-3 space-y-2">
                        {actor.tasks.length ? (
                          actor.tasks.map((task) => (
                            <div key={task.id} className="text-sm text-slate-300">
                              {task.title}
                              <div className="mt-1 text-xs text-slate-500">
                                {task.status} · Due {formatDate(task.dueDate)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No actor tasks.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No contract-linked actors yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
          Compliance overview appears when the project has contract-linked actors.
        </div>
      )}
    </section>
  );
}
