"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activateWorkforceContract,
  createAdminWorkforceAssignment,
  getAdminWorkforceAssignment,
  getAdminWorkforceAssignments,
  sendWorkforceContract,
  suspendWorkforceContract,
  terminateWorkforceContract,
  type AdminWorkforceAssignment,
  type AdminWorkforceAssignmentDetail,
  type WorkforceAssignmentStatus,
  type WorkforceContractLifecycleStatus,
} from "@/lib/api";

function formatDate(value?: string | null) {
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

export default function AdminWorkforcePage() {
  const [assignments, setAssignments] = useState<AdminWorkforceAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetail, setAssignmentDetail] =
    useState<AdminWorkforceAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [contractStatus, setContractStatus] = useState("");
  const [assignmentApplicationId, setAssignmentApplicationId] = useState("");
  const [assignmentContractId, setAssignmentContractId] = useState("");
  const [assignmentProjectId, setAssignmentProjectId] = useState("");
  const [actionNote, setActionNote] = useState("");

  async function loadAssignments() {
    setLoading(true);
    setError(null);
    try {
      const next = await getAdminWorkforceAssignments({
        q: query || undefined,
        status: (status as WorkforceAssignmentStatus) || undefined,
        contractStatus: (contractStatus as WorkforceContractLifecycleStatus) || undefined,
      });
      setAssignments(next);
      if (!selectedAssignmentId && next[0]) {
        setSelectedAssignmentId(next[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca workforce-ul.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSelectedAssignment(targetId?: string | null) {
    const id = targetId ?? selectedAssignmentId;
    if (!id) {
      setAssignmentDetail(null);
      return;
    }

    const detail = await getAdminWorkforceAssignment(id);
    setAssignmentDetail(detail);
    setSelectedAssignmentId(detail.id);
  }

  useEffect(() => {
    void loadAssignments();
  }, [query, status, contractStatus]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setAssignmentDetail(null);
      return;
    }

    const assignmentId = selectedAssignmentId;
    let cancelled = false;
    async function loadDetail() {
      try {
        const detail = await getAdminWorkforceAssignment(assignmentId);
        if (!cancelled) {
          setAssignmentDetail(detail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca assignment-ul.");
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedAssignmentId]);

  const kpis = useMemo(() => {
    return {
      total: assignments.length,
      active: assignments.filter((item) => item.status === "ACTIVE").length,
      pending: assignments.filter((item) => item.status === "PENDING").length,
      ended: assignments.filter((item) => item.status === "ENDED").length,
    };
  }, [assignments]);

  async function handleCreateAssignment() {
    if (!assignmentApplicationId.trim() || !assignmentContractId.trim()) {
      setError("Application ID si Contract ID sunt obligatorii.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const created = await createAdminWorkforceAssignment({
        applicationId: assignmentApplicationId.trim(),
        contractId: assignmentContractId.trim(),
        projectId: assignmentProjectId.trim() || undefined,
        note: actionNote.trim() || undefined,
      });
      setAssignmentApplicationId("");
      setAssignmentContractId("");
      setAssignmentProjectId("");
      await loadAssignments();
      await refreshSelectedAssignment(created.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut crea assignment-ul.");
    } finally {
      setActionLoading(false);
    }
  }

  async function runContractAction(
    action: "send" | "activate" | "suspend" | "terminate",
  ) {
    if (!assignmentDetail) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      if (action === "send") {
        await sendWorkforceContract(assignmentDetail.contract.id);
      } else if (action === "activate") {
        await activateWorkforceContract(assignmentDetail.contract.id, {
          note: actionNote.trim() || undefined,
        });
      } else if (action === "suspend") {
        await suspendWorkforceContract(assignmentDetail.contract.id, {
          reason: actionNote.trim() || undefined,
        });
      } else {
        await terminateWorkforceContract(assignmentDetail.contract.id, {
          reason: actionNote.trim() || undefined,
        });
      }

      await loadAssignments();
      await refreshSelectedAssignment(assignmentDetail.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Contract action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Workforce Lifecycle
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Assign hired candidates into operational workforce
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Assignment and contract lifecycle now sit in a dedicated operational layer on top of
          hiring, with immutable timeline tracking and worker visibility.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Assignments" value={kpis.total} />
        <StatCard label="Active" value={kpis.active} />
        <StatCard label="Pending" value={kpis.pending} />
        <StatCard label="Ended" value={kpis.ended} />
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 xl:grid-cols-[minmax(0,1fr)_180px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by user or job"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All assignment states</option>
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ENDED">ENDED</option>
        </select>
        <select
          value={contractStatus}
          onChange={(event) => setContractStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All contract lifecycle states</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PENDING_SIGNATURE">PENDING_SIGNATURE</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="TERMINATED">TERMINATED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input
          value={assignmentApplicationId}
          onChange={(event) => setAssignmentApplicationId(event.target.value)}
          placeholder="Application ID"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <input
          value={assignmentContractId}
          onChange={(event) => setAssignmentContractId(event.target.value)}
          placeholder="Contract ID"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <input
          value={assignmentProjectId}
          onChange={(event) => setAssignmentProjectId(event.target.value)}
          placeholder="Project ID (optional)"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={() => void handleCreateAssignment()}
          disabled={actionLoading}
          className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create assignment
        </button>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold text-white">
            Workforce assignments
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
              <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">Worker</th>
                  <th className="px-4 py-4">Job</th>
                  <th className="px-4 py-4">Assignment</th>
                  <th className="px-4 py-4">Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td className="px-4 py-5 text-slate-400" colSpan={4}>
                      Loading workforce assignments...
                    </td>
                  </tr>
                ) : assignments.length ? (
                  assignments.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition hover:bg-slate-900/70 ${
                        selectedAssignmentId === item.id ? "bg-slate-900/80" : ""
                      }`}
                      onClick={() => setSelectedAssignmentId(item.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {item.user.identityProfile?.displayName ?? item.user.email}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{item.user.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{item.job.title}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.job.status}</div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill value={item.status} tone="cyan" />
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill value={item.contract.lifecycleStatus} tone="amber" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-5 text-slate-400" colSpan={4}>
                      No workforce assignments found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-sm font-semibold text-white">Assignment detail</div>
            {assignmentDetail ? (
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <KeyValue label="Worker" value={assignmentDetail.user.identityProfile?.displayName ?? assignmentDetail.user.email} />
                <KeyValue label="Verification" value={assignmentDetail.user.identityProfile?.verificationStatus ?? "UNVERIFIED"} />
                <KeyValue label="Job" value={assignmentDetail.job.title} />
                <KeyValue label="Application stage" value={assignmentDetail.application.currentStage} />
                <KeyValue label="Assignment status" value={assignmentDetail.status} />
                <KeyValue label="Contract lifecycle" value={assignmentDetail.contract.lifecycleStatus} />
                <KeyValue label="Assigned at" value={formatDate(assignmentDetail.assignedAt)} />
                <KeyValue label="Started at" value={formatDate(assignmentDetail.startedAt)} />
                <KeyValue label="Ended at" value={formatDate(assignmentDetail.endedAt)} />
                {assignmentDetail.project ? (
                  <KeyValue
                    label="Project"
                    value={`${assignmentDetail.project.name} (${assignmentDetail.project.slug})`}
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-400">
                Select an assignment to inspect lifecycle controls and timeline.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-sm font-semibold text-white">Lifecycle controls</div>
            <textarea
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              rows={4}
              placeholder="Optional note / suspension reason / termination reason"
              className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
            />
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={() => void runContractAction("send")}
                disabled={!assignmentDetail || actionLoading}
                className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => void runContractAction("activate")}
                disabled={!assignmentDetail || actionLoading}
                className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Activate
              </button>
              <button
                type="button"
                onClick={() => void runContractAction("suspend")}
                disabled={!assignmentDetail || actionLoading}
                className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Suspend
              </button>
              <button
                type="button"
                onClick={() => void runContractAction("terminate")}
                disabled={!assignmentDetail || actionLoading}
                className="rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Terminate
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
            <div className="text-sm font-semibold text-white">Contract timeline</div>
            <div className="mt-4 space-y-3">
              {assignmentDetail?.timeline.length ? (
                assignmentDetail.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-white">{item.eventType}</div>
                      <div className="text-xs text-slate-400">{formatDate(item.createdAt)}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Actor: {item.actorUser?.email ?? "system"}
                    </div>
                    <OperationalMetadata metadata={item.metadata} />
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No lifecycle events recorded yet.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
      <div className="text-slate-400">{label}</div>
      <div className="text-right text-white">{value}</div>
    </div>
  );
}

function StatusPill({
  value,
  tone,
}: {
  value: string;
  tone: "cyan" | "amber";
}) {
  const classes =
    tone === "cyan"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {value}
    </span>
  );
}

function OperationalMetadata({ metadata }: { metadata: unknown }) {
  const summary = summarizeMetadata(metadata);

  if (summary.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {summary.map((item) => (
        <span
          key={`${item.label}-${item.value}`}
          className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300"
        >
          <span className="font-semibold text-slate-100">{item.label}:</span> {item.value}
        </span>
      ))}
    </div>
  );
}

function summarizeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const hiddenKeyPattern = /(id|uuid|token|secret|key|url|path|storage|bucket|raw|json)/i;

  return Object.entries(metadata as Record<string, unknown>)
    .filter(([key, value]) => !hiddenKeyPattern.test(key) && value !== null && value !== undefined)
    .slice(0, 4)
    .map(([key, value]) => ({
      label: humanizeMetadataKey(key),
      value: summarizeMetadataValue(value),
    }))
    .filter((item) => item.value.length > 0 && item.value.length <= 80);
}

function summarizeMetadataValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (typeof value === "object" && value !== null) {
    return "Operational context captured";
  }

  return "";
}

function humanizeMetadataKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}
