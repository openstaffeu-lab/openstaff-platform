"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAdminVerificationCase,
  getAdminVerificationCases,
  reviewVerificationCase,
  type AdminVerificationCase,
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

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<AdminVerificationCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminVerificationCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [subjectType, setSubjectType] = useState("");

  async function loadList() {
    setLoading(true);
    setError(null);
    try {
      const nextItems = await getAdminVerificationCases({
        q: query || undefined,
        status:
          (status as
            | "DRAFT"
            | "SUBMITTED"
            | "IN_REVIEW"
            | "APPROVED"
            | "REJECTED"
            | "NEEDS_INFO") || undefined,
        subjectType:
          (subjectType as "IDENTITY_PROFILE" | "COMPANY_PROFILE") || undefined,
      });
      setItems(nextItems);
      if (!selectedId && nextItems[0]) {
        setSelectedId(nextItems[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca verificarile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadList();
  }, [query, status, subjectType]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    const caseId = selectedId;

    let cancelled = false;

    async function loadDetail() {
      try {
        const detail = await getAdminVerificationCase(caseId);
        if (!cancelled) {
          setSelected(detail);
          setNote(detail.latestNote ?? "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca cazul.");
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => ["SUBMITTED", "IN_REVIEW", "NEEDS_INFO"].includes(item.status))
        .length,
      approved: items.filter((item) => item.status === "APPROVED").length,
      rejected: items.filter((item) => item.status === "REJECTED").length,
    };
  }, [items]);

  async function handleReview(decision: "REQUEST_INFO" | "APPROVE" | "REJECT" | "REOPEN") {
    if (!selected) {
      return;
    }

    setReviewing(true);
    setError(null);
    try {
      const updated = await reviewVerificationCase(selected.id, {
        decision,
        note: note || undefined,
      });
      setSelected(updated);
      await loadList();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review action failed.");
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Verification Workflow
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">KYC and identity review</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Revieweaza cazurile de verificare pentru identitate si companie, fara sa expui
          date de auth sau billing.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={summary.total} />
        <StatCard label="Needs review" value={summary.pending} />
        <StatCard label="Approved" value={summary.approved} />
        <StatCard label="Rejected" value={summary.rejected} />
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email, display name or company"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="IN_REVIEW">IN_REVIEW</option>
          <option value="NEEDS_INFO">NEEDS_INFO</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <select
          value={subjectType}
          onChange={(event) => setSubjectType(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All subjects</option>
          <option value="IDENTITY_PROFILE">IDENTITY_PROFILE</option>
          <option value="COMPANY_PROFILE">COMPANY_PROFILE</option>
        </select>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
              <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Subject</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={4}>
                      Loading verification cases...
                    </td>
                  </tr>
                ) : items.length ? (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer align-top ${selectedId === item.id ? "bg-slate-900/70" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{item.user.email}</div>
                        <div className="text-xs text-slate-400">{item.user.role}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>{item.subjectType}</div>
                        <div className="text-xs text-slate-400">
                          {item.identityProfile?.displayName ??
                            item.companyProfile?.companyName ??
                            "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4">{item.status}</td>
                      <td className="px-4 py-4">{formatDate(item.submittedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={4}>
                      No verification cases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
          {selected ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-400">
                  Case detail
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {selected.subjectType}
                </h2>
                <div className="mt-2 text-sm text-slate-300">
                  {selected.user.email} · {selected.status}
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                <div><strong>Identity:</strong> {selected.identityProfile?.displayName ?? "-"}</div>
                <div><strong>Company:</strong> {selected.companyProfile?.companyName ?? "-"}</div>
                <div><strong>Completion:</strong> {selected.identityProfile?.profileCompletionPercent ?? 0}%</div>
                <div><strong>Reviewed:</strong> {formatDate(selected.reviewedAt)}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Evidence</div>
                <div className="space-y-2 text-sm text-slate-300">
                  {selected.documents.length ? (
                    selected.documents.map((document) => (
                      <div key={document.id} className="rounded-xl border border-slate-800 px-3 py-2">
                        <div className="font-medium text-white">{document.label ?? document.assetType}</div>
                        <div className="text-xs text-slate-400">{document.assetType}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">No linked evidence on this case.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Review note</div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Optional reviewer note"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <ActionButton onClick={() => handleReview("REQUEST_INFO")} disabled={reviewing}>
                    Request Info
                  </ActionButton>
                  <ActionButton onClick={() => handleReview("APPROVE")} disabled={reviewing} tone="success">
                    Approve
                  </ActionButton>
                  <ActionButton onClick={() => handleReview("REJECT")} disabled={reviewing} tone="danger">
                    Reject
                  </ActionButton>
                  <ActionButton onClick={() => handleReview("REOPEN")} disabled={reviewing}>
                    Reopen
                  </ActionButton>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Decision timeline</div>
                <div className="space-y-3 text-sm text-slate-300">
                  {selected.decisions.length ? (
                    selected.decisions.map((decision) => (
                      <div key={decision.id} className="rounded-xl border border-slate-800 px-3 py-2">
                        <div className="font-medium text-white">
                          {decision.decision} → {decision.toStatus}
                        </div>
                        <div className="text-xs text-slate-400">
                          {decision.actorUser?.email ?? "system"} · {formatDate(decision.createdAt)}
                        </div>
                        {decision.note ? <div className="mt-1">{decision.note}</div> : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">No decisions recorded yet.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Select a verification case to review it.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "success" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500 text-slate-950"
      : tone === "danger"
        ? "bg-rose-500 text-white"
        : "bg-cyan-400 text-slate-950";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${toneClasses}`}
    >
      {children}
    </button>
  );
}
