"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveHiringApplication,
  getAdminHiringApplication,
  getAdminHiringPipeline,
  getAdminHiringPipelines,
  moveHiringApplicationStage,
  rejectHiringApplication,
  shortlistHiringApplication,
  type AdminHiringApplicationDetail,
  type AdminHiringPipelineApplicant,
  type AdminHiringPipelineDetail,
  type AdminHiringPipelineListItem,
  type HiringStage,
} from "@/lib/api";

const MOVABLE_STAGES: Array<{
  value: "SCREENING" | "INTERVIEW" | "OFFER_SENT";
  label: string;
}> = [
  { value: "SCREENING", label: "Move to Screening" },
  { value: "INTERVIEW", label: "Move to Interview" },
  { value: "OFFER_SENT", label: "Move to Offer Sent" },
];

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

export default function AdminHiringPage() {
  const [pipelines, setPipelines] = useState<AdminHiringPipelineListItem[]>([]);
  const [pipelineDetail, setPipelineDetail] = useState<AdminHiringPipelineDetail | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [applicationDetail, setApplicationDetail] =
    useState<AdminHiringApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  async function loadPipelines() {
    setLoading(true);
    setError(null);
    try {
      const next = await getAdminHiringPipelines({
        q: query || undefined,
        status: (status as "ACTIVE" | "PAUSED" | "CLOSED") || undefined,
      });
      setPipelines(next);
      if (!selectedJobId && next[0]) {
        setSelectedJobId(next[0].job.id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca pipeline-urile.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshPipeline(jobId: string, preserveApplicationId?: string | null) {
    const detail = await getAdminHiringPipeline(jobId);
    setPipelineDetail(detail);

    const nextSelectedApplicationId =
      preserveApplicationId && detail.applicantsByStage.some((group) =>
        group.applicants.some((item) => item.id === preserveApplicationId),
      )
        ? preserveApplicationId
        : detail.applicantsByStage.flatMap((group) => group.applicants)[0]?.id ?? null;

    setSelectedApplicationId(nextSelectedApplicationId);
  }

  useEffect(() => {
    void loadPipelines();
  }, [query, status]);

  useEffect(() => {
    if (!selectedJobId) {
      setPipelineDetail(null);
      return;
    }

    const jobId = selectedJobId;
    let cancelled = false;

    async function loadDetail() {
      try {
        const detail = await getAdminHiringPipeline(jobId);
        if (!cancelled) {
          setPipelineDetail(detail);
          if (!selectedApplicationId) {
            setSelectedApplicationId(
              detail.applicantsByStage.flatMap((group) => group.applicants)[0]?.id ?? null,
            );
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca pipeline-ul.");
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  useEffect(() => {
    if (!selectedApplicationId) {
      setApplicationDetail(null);
      setNote("");
      setRejectReason("");
      return;
    }

    const applicationId = selectedApplicationId;
    let cancelled = false;

    async function loadApplicationDetail() {
      try {
        const detail = await getAdminHiringApplication(applicationId);
        if (!cancelled) {
          setApplicationDetail(detail);
          setNote(detail.stageHistory[detail.stageHistory.length - 1]?.note ?? "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca aplicatia.");
        }
      }
    }

    void loadApplicationDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedApplicationId]);

  const stageSummary = useMemo(() => {
    if (!pipelineDetail) {
      return [];
    }

    return pipelineDetail.applicantsByStage.map((group) => ({
      stage: group.stage,
      count: group.applicants.length,
    }));
  }, [pipelineDetail]);

  async function handleMoveStage(targetStage: "SCREENING" | "INTERVIEW" | "OFFER_SENT") {
    if (!selectedApplicationId || !selectedJobId) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await moveHiringApplicationStage(selectedApplicationId, {
        targetStage,
        note: note || undefined,
      });
      await refreshPipeline(selectedJobId, selectedApplicationId);
      const detail = await getAdminHiringApplication(selectedApplicationId);
      setApplicationDetail(detail);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Stage move failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShortlist() {
    if (!selectedApplicationId || !selectedJobId) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await shortlistHiringApplication(selectedApplicationId, {
        note: note || undefined,
      });
      await refreshPipeline(selectedJobId, selectedApplicationId);
      setApplicationDetail(await getAdminHiringApplication(selectedApplicationId));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Shortlist failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!selectedApplicationId || !selectedJobId) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await approveHiringApplication(selectedApplicationId, {
        reason: note || undefined,
      });
      await refreshPipeline(selectedJobId, selectedApplicationId);
      setApplicationDetail(await getAdminHiringApplication(selectedApplicationId));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Approve failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selectedApplicationId || !selectedJobId) {
      return;
    }

    if (!rejectReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await rejectHiringApplication(selectedApplicationId, {
        reason: rejectReason.trim(),
      });
      await refreshPipeline(selectedJobId, selectedApplicationId);
      setApplicationDetail(await getAdminHiringApplication(selectedApplicationId));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Reject failed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 px-6 py-8 md:px-8">
      <section className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Hiring Pipeline
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Recruiter workflow and candidate stages
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Operatiunile de triere, shortlist, oferta si decizie sunt izolate in layer-ul de
          hiring fara sa atinga browsing-ul public sau contractele existente de auth, billing
          si onboarding.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pipelines" value={pipelines.length} />
        <StatCard label="Applicants" value={pipelineDetail?.counters.totalApplicants ?? 0} />
        <StatCard label="Shortlisted" value={pipelineDetail?.counters.totalShortlisted ?? 0} />
        <StatCard label="Hired" value={pipelineDetail?.counters.totalHired ?? 0} />
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by job title or recruiter"
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All pipeline states</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAUSED">PAUSED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/70">
          <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold text-white">
            Pipelines overview
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
              <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">Job</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Applicants</th>
                  <th className="px-4 py-4">Hired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={4}>
                      Loading pipelines...
                    </td>
                  </tr>
                ) : pipelines.length ? (
                  pipelines.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer align-top ${selectedJobId === item.job.id ? "bg-slate-900/70" : ""}`}
                      onClick={() => setSelectedJobId(item.job.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{item.job.title}</div>
                        <div className="text-xs text-slate-400">{item.job.actor.displayName}</div>
                      </td>
                      <td className="px-4 py-4">{item.status}</td>
                      <td className="px-4 py-4">{item.totalApplicants}</td>
                      <td className="px-4 py-4">{item.totalHired}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={4}>
                      No pipelines found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-400">Pipeline detail</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {pipelineDetail?.pipeline.job.title ?? "Select a pipeline"}
            </h2>
            <div className="mt-2 text-sm text-slate-300">
              {pipelineDetail?.pipeline.job.actor.displayName ?? "Recruiter view"}{" "}
              {pipelineDetail ? `· ${pipelineDetail.pipeline.status}` : ""}
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
            {stageSummary.length ? (
              stageSummary.map((item) => (
                <div key={item.stage} className="flex items-center justify-between gap-3">
                  <span>{item.stage}</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400">Select a pipeline to inspect grouped applicants.</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-3 text-sm font-semibold text-white">Applicants by stage</div>
            <div className="space-y-4">
              {pipelineDetail?.applicantsByStage.length ? (
                pipelineDetail.applicantsByStage.map((group) => (
                  <div key={group.stage}>
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                      <span>{group.stage}</span>
                      <span>{group.applicants.length}</span>
                    </div>
                    <div className="space-y-2">
                      {group.applicants.length ? (
                        group.applicants.map((applicant) => (
                          <ApplicantCard
                            key={applicant.id}
                            applicant={applicant}
                            selected={selectedApplicationId === applicant.id}
                            onSelect={() => setSelectedApplicationId(applicant.id)}
                          />
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 px-3 py-2 text-sm text-slate-500">
                          No applicants in this stage.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No applicants loaded yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5">
          {applicationDetail ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-400">
                  Candidate detail
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {applicationDetail.candidateIdentitySummary.identityProfile?.displayName ??
                    applicationDetail.candidateIdentitySummary.actor.displayName}
                </h2>
                <div className="mt-2 text-sm text-slate-300">
                  {applicationDetail.candidateIdentitySummary.actor.email} ·{" "}
                  {applicationDetail.application.currentStage}
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                <div><strong>Job:</strong> {applicationDetail.application.job.title}</div>
                <div><strong>Actor type:</strong> {applicationDetail.candidateIdentitySummary.actor.actorType}</div>
                <div><strong>Verified:</strong> {applicationDetail.candidateIdentitySummary.actor.isVerified ? "Yes" : "No"}</div>
                <div><strong>Profile completion:</strong> {applicationDetail.candidateIdentitySummary.identityProfile?.profileCompletionPercent ?? 0}%</div>
                <div><strong>Updated:</strong> {formatDate(applicationDetail.application.stageChangedAt)}</div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Recruiter note</div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Context for the next stage or hiring decision"
                />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Stage actions</div>
                <div className="flex flex-wrap gap-3">
                  {MOVABLE_STAGES.map((stage) => (
                    <ActionButton
                      key={stage.value}
                      onClick={() => handleMoveStage(stage.value)}
                      disabled={actionLoading}
                    >
                      {stage.label}
                    </ActionButton>
                  ))}
                  <ActionButton onClick={handleShortlist} disabled={actionLoading} tone="accent">
                    Shortlist
                  </ActionButton>
                  <ActionButton onClick={handleApprove} disabled={actionLoading} tone="success">
                    Approve / Hire
                  </ActionButton>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Reject application</div>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Required rejection reason"
                />
                <div className="mt-4">
                  <ActionButton onClick={handleReject} disabled={actionLoading} tone="danger">
                    Reject
                  </ActionButton>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Stage timeline</div>
                <div className="space-y-3 text-sm text-slate-300">
                  {applicationDetail.stageHistory.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-800 px-3 py-2">
                      <div className="font-medium text-white">
                        {(entry.fromStage ?? "START")} → {entry.toStage}
                      </div>
                      <div className="text-xs text-slate-400">
                        {entry.changedByUser?.email ?? "system"} · {formatDate(entry.createdAt)}
                      </div>
                      {entry.note ? <div className="mt-1">{entry.note}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="mb-3 text-sm font-semibold text-white">Hiring decisions</div>
                <div className="space-y-3 text-sm text-slate-300">
                  {applicationDetail.decisions.length ? (
                    applicationDetail.decisions.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-800 px-3 py-2">
                        <div className="font-medium text-white">{entry.decision}</div>
                        <div className="text-xs text-slate-400">
                          {entry.decidedByUser?.email ?? "system"} · {formatDate(entry.createdAt)}
                        </div>
                        {entry.reason ? <div className="mt-1">{entry.reason}</div> : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">No decisions recorded yet.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">
              Select an applicant to inspect stage history and take hiring actions.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ApplicantCard({
  applicant,
  selected,
  onSelect,
}: {
  applicant: AdminHiringPipelineApplicant;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
        selected
          ? "border-cyan-400/60 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
      }`}
    >
      <div className="font-medium text-white">
        {applicant.identityProfile?.displayName ?? applicant.actor.displayName}
      </div>
      <div className="mt-1 text-xs text-slate-400">{applicant.actor.email}</div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-300">
        <span>{applicant.currentStage}</span>
        <span>{formatDate(applicant.stageChangedAt)}</span>
      </div>
    </button>
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
  tone?: "default" | "accent" | "success" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500 text-slate-950"
      : tone === "danger"
        ? "bg-rose-500 text-white"
        : tone === "accent"
          ? "bg-amber-400 text-slate-950"
          : "bg-cyan-400 text-slate-950";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${toneClasses}`}
    >
      {children}
    </button>
  );
}
