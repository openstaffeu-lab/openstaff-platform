"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type AdminAuditLog,
  type AdminComplianceRequest,
  type AdminSecurityEvent,
  type AdminUserSession,
  getAdminComplianceRequests,
  getAdminSecurityAuditLogs,
  getAdminSecurityEvents,
  getAdminSecuritySessions,
  updateAdminSecurityEventStatus,
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

function badgeClass(tone: "slate" | "rose" | "amber" | "emerald" | "cyan") {
  switch (tone) {
    case "rose":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    case "amber":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "emerald":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "cyan":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
    default:
      return "border-slate-700 bg-slate-800 text-slate-200";
  }
}

function eventTone(event: AdminSecurityEvent) {
  if (event.severity === "CRITICAL") return "rose";
  if (event.type === "RATE_LIMIT_TRIGGERED") return "amber";
  if (event.status === "RESOLVED") return "emerald";
  return "cyan";
}

export default function AdminSecurityPage() {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<AdminSecurityEvent[]>([]);
  const [sessions, setSessions] = useState<AdminUserSession[]>([]);
  const [requests, setRequests] = useState<AdminComplianceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditData, eventData, sessionData, complianceData] = await Promise.all([
        getAdminSecurityAuditLogs(),
        getAdminSecurityEvents(),
        getAdminSecuritySessions(),
        getAdminComplianceRequests(),
      ]);
      setAuditLogs(auditData);
      setSecurityEvents(eventData);
      setSessions(sessionData);
      setRequests(complianceData);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Security data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(
    () => ({
      openEvents: securityEvents.filter((item) => item.status === "PENDING").length,
      failedLogins: securityEvents.filter((item) => item.type === "LOGIN_FAILED").length,
      rateLimits: securityEvents.filter((item) => item.type === "RATE_LIMIT_TRIGGERED").length,
      activeSessions: sessions.filter((item) => !item.revokedAt).length,
      complianceQueue: requests.filter((item) => item.status === "PENDING").length,
    }),
    [requests, securityEvents, sessions],
  );

  const handleResolve = async (eventId: string, status: "RESOLVED" | "DISMISSED") => {
    setUpdatingId(eventId);
    setError(null);
    try {
      await updateAdminSecurityEventStatus(eventId, status);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not update event.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Security & compliance</div>
          <h1 className="mt-3 text-4xl font-semibold">Operational security control room</h1>
          <p className="mt-3 max-w-4xl text-slate-300">
            Persistent audit logs, security events, session visibility and compliance request
            placeholders for production-grade review and incident handling.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Open events" value={summary.openEvents} />
          <StatCard label="Failed logins" value={summary.failedLogins} />
          <StatCard label="Rate limits" value={summary.rateLimits} />
          <StatCard label="Active sessions" value={summary.activeSessions} />
          <StatCard label="Compliance queue" value={summary.complianceQueue} />
        </section>

        {error ? (
          <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Security events" loading={loading}>
            {securityEvents.map((event) => (
              <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">{event.type}</span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeClass(eventTone(event))}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{event.message}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {event.user?.email ?? "No user"} • {event.sourceType ?? "Unknown"} / {event.sourceId ?? "n/a"} • {formatDate(event.createdAt)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Request ID: {event.requestId ?? "n/a"} • IP: {event.ipAddress ?? "n/a"}
                    </div>
                  </div>
                  {event.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleResolve(event.id, "RESOLVED")}
                        disabled={updatingId === event.id}
                        className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResolve(event.id, "DISMISSED")}
                        disabled={updatingId === event.id}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </Panel>

          <div className="space-y-6">
            <Panel title="Active sessions" loading={loading}>
              {sessions.map((session) => (
                <article key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-white">{session.user?.email ?? session.userId}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    {session.browser ?? "Unknown browser"} • {session.os ?? "Unknown OS"} • {session.deviceLabel ?? "Unnamed device"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Last activity {formatDate(session.lastActivityAt)} • {session.revokedAt ? "Revoked" : "Active"}
                  </div>
                </article>
              ))}
            </Panel>

            <Panel title="Compliance requests" loading={loading}>
              {requests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{request.type}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {request.user.email} • {formatDate(request.requestedAt)}
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeClass(request.status === "PENDING" ? "amber" : "slate")}`}>
                      {request.status}
                    </span>
                  </div>
                </article>
              ))}
            </Panel>
          </div>
        </section>

        <Panel title="Audit log" loading={loading}>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <article key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {log.action} • {log.entityType}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Actor: {log.actorUser?.email ?? log.actorUserId ?? "n/a"} • Target: {log.targetUser?.email ?? log.targetUserId ?? "n/a"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Request ID: {log.requestId ?? "n/a"} • {formatDate(log.createdAt)}
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeClass(log.category ? "cyan" : "slate")}`}>
                    {log.category ?? "GENERAL"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
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
        {loading ? <div className="text-sm text-slate-400">Loading…</div> : children}
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
