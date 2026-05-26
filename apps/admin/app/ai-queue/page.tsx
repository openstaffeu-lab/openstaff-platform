"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import {
  AiAuditLog,
  ReluQueueSnapshot,
  adminApi,
} from "@/lib/api";

type LoadState = "loading" | "ready" | "error";

export default function AiQueuePage() {
  return (
    <TechnicalModeGate>
      <AiQueueWorkspace />
    </TechnicalModeGate>
  );
}

function AiQueueWorkspace() {
  const [queue, setQueue] = useState<ReluQueueSnapshot | null>(null);
  const [logs, setLogs] = useState<AiAuditLog[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [queueSnapshot, auditLogs] = await Promise.all([
          adminApi.getReluQueue(),
          adminApi.getAiAuditLogs(),
        ]);

        if (!active) {
          return;
        }

        setQueue(queueSnapshot);
        setLogs(auditLogs);
        setState("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(error instanceof Error ? error.message : "Failed to load Relu queue.");
        setState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="space-y-8 p-8 text-white">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Relu AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Operational Queue</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            This queue tracks public, authenticated, and admin-secured Relu tasks.
            Every task is auditable, and admin views expose only the operational
            summary, request context, and persisted outcomes needed for support and governance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/ai-config"
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-white"
          >
            Agent config
          </Link>
          <Link
            href="/ai-control"
            className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Prompts and policies
          </Link>
        </div>
      </section>

      {state === "loading" ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
          Loading Relu AI queue and audit logs...
        </div>
      ) : null}

      {state === "error" ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          {message ?? "Failed to load Relu AI operations."}
        </div>
      ) : null}

      {state === "ready" && queue ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Pending" value={queue.summary.pending} />
            <MetricCard label="Running" value={queue.summary.running} />
            <MetricCard
              label="Completed / 24h"
              value={queue.summary.completedLast24Hours}
            />
            <MetricCard
              label="Failed / 24h"
              value={queue.summary.failedLast24Hours}
              accent="rose"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Relu tasks</h2>
                  <p className="text-sm text-slate-400">
                    Engine status: {queue.summary.engineStatus}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {queue.tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{task.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {task.capability} • {task.accessMode} • {task.status}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Requested by
                        </p>
                        <p className="mt-1">
                          {task.requestedBy?.email ?? "Anonymous public visitor"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Context
                        </p>
                        <p className="mt-1">
                          {task.contextEntityType ?? "GENERIC"} / {task.contextEntityId ?? "n/a"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-2">
                      <pre className="overflow-auto rounded-2xl bg-slate-900 p-3">
                        {JSON.stringify(task.inputSummaryJson, null, 2)}
                      </pre>
                      <pre className="overflow-auto rounded-2xl bg-slate-900 p-3">
                        {JSON.stringify(task.resultSummaryJson, null, 2)}
                      </pre>
                    </div>

                    {task.errorMessage ? (
                      <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        {task.errorMessage}
                      </div>
                    ) : null}
                  </article>
                ))}

                {queue.tasks.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
                    No Relu tasks have been queued yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-xl font-semibold text-white">AI audit log</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Operational AI actions are persisted as audit entries so backoffice
                reviewers can trace who changed agent policies, who triggered secured
                tasks, and what high-level result was stored.
              </p>

              <div className="mt-5 space-y-4">
                {logs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <p className="text-sm font-semibold text-white">{log.action}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {log.entityType} • {new Date(log.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      Actor: {log.actorUser?.email ?? "Anonymous"}
                    </p>
                    <pre className="mt-3 overflow-auto rounded-2xl bg-slate-900 p-3 text-xs text-slate-400">
                      {JSON.stringify(log.metadataJson, null, 2)}
                    </pre>
                  </article>
                ))}

                {logs.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
                    No AI audit logs recorded yet.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: number;
  accent?: "cyan" | "rose";
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p
        className={`mt-3 text-3xl font-semibold ${
          accent === "rose" ? "text-rose-300" : "text-cyan-200"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function statusClassName(status: string) {
  if (status === "COMPLETED") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (status === "FAILED") {
    return "bg-rose-500/20 text-rose-200";
  }

  if (status === "RUNNING") {
    return "bg-cyan-500/20 text-cyan-200";
  }

  return "bg-amber-500/20 text-amber-200";
}
