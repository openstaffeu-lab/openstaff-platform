"use client";

import { useEffect, useMemo, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import {
  type AdminNotificationDelivery,
  type AdminNotificationEvent,
  type WorkflowAutomationRun,
  getAdminNotificationDeliveries,
  getAdminNotificationEvents,
  getWorkflowAutomationRuns,
  retryAdminNotificationDelivery,
} from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "FAILED") return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (status === "READ" || status === "SENT")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  if (status === "DISMISSED") return "border-slate-600 bg-slate-800 text-slate-300";
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
}

export default function AdminNotificationsPage() {
  return (
    <TechnicalModeGate>
      <AdminNotificationsWorkspace />
    </TechnicalModeGate>
  );
}

function AdminNotificationsWorkspace() {
  const [events, setEvents] = useState<AdminNotificationEvent[]>([]);
  const [deliveries, setDeliveries] = useState<AdminNotificationDelivery[]>([]);
  const [runs, setRuns] = useState<WorkflowAutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventData, deliveryData, runData] = await Promise.all([
        getAdminNotificationEvents(),
        getAdminNotificationDeliveries(),
        getWorkflowAutomationRuns(),
      ]);
      setEvents(eventData);
      setDeliveries(deliveryData);
      setRuns(runData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nu am putut incarca evenimentele de notificare.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(
    () => ({
      eventCount: events.length,
      failedDeliveries: deliveries.filter((item) => item.status === "FAILED").length,
      readEvents: events.filter((item) => item.status === "READ").length,
      workflowRuns: runs.length,
    }),
    [deliveries, events, runs],
  );

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    setError(null);
    try {
      await retryAdminNotificationDelivery(deliveryId);
      await load();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry-ul a esuat.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Notifications control
          </div>
          <h1 className="mt-3 text-4xl font-semibold">Event bus and delivery oversight</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Audit trail for workflow notifications, delivery outcomes and automation runs.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Events" value={stats.eventCount} />
          <StatCard label="Failed deliveries" value={stats.failedDeliveries} />
          <StatCard label="Read events" value={stats.readEvents} />
          <StatCard label="Workflow runs" value={stats.workflowRuns} />
        </section>

        {error ? (
          <section className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <Panel title="Event log" loading={loading}>
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{event.eventType}</span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass(
                            event.status,
                          )}`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {event.sourceType} / {event.sourceId}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {event.category ?? "GENERAL"} • {formatDate(event.createdAt)}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>{event.user?.email ?? "No user"}</div>
                      <div>{event.deliveryCount} deliveries</div>
                    </div>
                  </div>
                </article>
              ))}
            </Panel>

            <Panel title="Workflow automation runs" loading={loading}>
              {runs.map((run) => (
                <article
                  key={run.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {run.rule?.name ?? "Direct event bus"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {run.event?.eventType ?? "Unknown event"} • {formatDate(run.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass(
                        run.status,
                      )}`}
                    >
                      {run.status}
                    </span>
                  </div>
                </article>
              ))}
            </Panel>
          </div>

          <Panel title="Deliveries" loading={loading}>
            {deliveries.map((delivery) => (
              <article
                key={delivery.id}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{delivery.channel}</span>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass(
                          delivery.status,
                        )}`}
                      >
                        {delivery.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      {delivery.event?.eventType ?? "No event"} • {delivery.user?.email ?? "No user"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Retries {delivery.retryCount} • {formatDate(delivery.createdAt)}
                    </div>
                  </div>

                  {delivery.status === "FAILED" ? (
                    <button
                      type="button"
                      onClick={() => void handleRetry(delivery.id)}
                      disabled={retryingId === delivery.id}
                      className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {retryingId === delivery.id ? "Retrying..." : "Retry"}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-4 space-y-4">
        {loading ? <div className="text-sm text-slate-400">Loading...</div> : children}
      </div>
    </section>
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
