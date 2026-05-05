"use client";

import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import {
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  ProfileWorker,
  TaxonomyOption,
  WorkerDocumentType,
  WorkerEmploymentType,
  WorkerStatus,
} from "../../lib/project-types";

const employmentOptions: WorkerEmploymentType[] = [
  "EMPLOYEE",
  "FREELANCER",
  "SUBCONTRACTED",
  "TEMPORARY",
];

const workerStatusOptions: WorkerStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const workerDocumentTypes: WorkerDocumentType[] = [
  "IDENTITY",
  "CERTIFICATE",
  "MEDICAL",
  "PERMIT",
  "TRAINING",
  "INSURANCE",
  "OTHER",
];
const complianceStatuses: ComplianceDocumentStatus[] = [
  "PENDING",
  "VALID",
  "EXPIRED",
  "REJECTED",
  "REQUIRES_REVIEW",
];
const medicalCategories: MedicalFitnessCategory[] = [
  "VISION",
  "CARDIOVASCULAR",
  "WORK_AT_HEIGHT",
  "PSYCHOLOGICAL_FITNESS",
  "TRANSMISSIBLE_DISEASES",
  "GENERAL_PHYSICAL_FITNESS",
  "JOB_SPECIFIC_CLEARANCE",
];

type WorkerDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleTitle: string;
  employmentType: WorkerEmploymentType;
};

type WorkerDocumentDraft = {
  type: WorkerDocumentType;
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  status: ComplianceDocumentStatus;
  medicalCategory: MedicalFitnessCategory | "";
};

type WorkerSkillDraft = {
  escoSkillId: string;
  title: string;
  level: string;
};

const emptyWorkerDraft: WorkerDraft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roleTitle: "",
  employmentType: "EMPLOYEE",
};

const emptyWorkerDocumentDraft: WorkerDocumentDraft = {
  type: "IDENTITY",
  title: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
  status: "PENDING",
  medicalCategory: "",
};

const emptyWorkerSkillDraft: WorkerSkillDraft = {
  escoSkillId: "",
  title: "",
  level: "",
};

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

type Props = {
  token: string;
  escoSkills: TaxonomyOption[];
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

export function ProfileWorkerRosterPanel({ token, escoSkills, onError, onSuccess }: Props) {
  const [workers, setWorkers] = useState<ProfileWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWorker, setIsSavingWorker] = useState(false);
  const [workingWorkerId, setWorkingWorkerId] = useState<string | null>(null);
  const [workerDraft, setWorkerDraft] = useState<WorkerDraft>(emptyWorkerDraft);
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, WorkerDocumentDraft>>({});
  const [skillDrafts, setSkillDrafts] = useState<Record<string, WorkerSkillDraft>>({});

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<ProfileWorker[]>("/profile/workers", { token });
      setWorkers(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setWorkers([]);
      } else {
        onError(error instanceof Error ? error.message : "Failed to load worker roster.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [token]);

  const handleCreateWorker = async () => {
    setIsSavingWorker(true);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest("/profile/workers", {
        method: "POST",
        token,
        body: workerDraft,
      });
      setWorkerDraft(emptyWorkerDraft);
      await loadWorkers();
      onSuccess("Worker added to the roster.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to create worker.");
    } finally {
      setIsSavingWorker(false);
    }
  };

  const handleUpdateWorkerStatus = async (workerId: string, status: WorkerStatus) => {
    setWorkingWorkerId(workerId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/profile/workers/${workerId}`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadWorkers();
      onSuccess("Worker status updated.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update worker.");
    } finally {
      setWorkingWorkerId(null);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    setWorkingWorkerId(workerId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/profile/workers/${workerId}`, {
        method: "DELETE",
        token,
      });
      await loadWorkers();
      onSuccess("Worker removed from the roster.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to remove worker.");
    } finally {
      setWorkingWorkerId(null);
    }
  };

  const handleCreateDocument = async (workerId: string) => {
    const draft = documentDrafts[workerId] ?? emptyWorkerDocumentDraft;
    setWorkingWorkerId(workerId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/profile/workers/${workerId}/documents`, {
        method: "POST",
        token,
        body: {
          ...draft,
          issuer: draft.issuer || undefined,
          issuedAt: draft.issuedAt || undefined,
          expiresAt: draft.expiresAt || undefined,
          medicalCategory:
            draft.type === "MEDICAL" && draft.medicalCategory ? draft.medicalCategory : undefined,
        },
      });
      setDocumentDrafts((current) => ({
        ...current,
        [workerId]: emptyWorkerDocumentDraft,
      }));
      await loadWorkers();
      onSuccess("Worker document added.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to add worker document.");
    } finally {
      setWorkingWorkerId(null);
    }
  };

  const handleCreateSkill = async (workerId: string) => {
    const draft = skillDrafts[workerId] ?? emptyWorkerSkillDraft;
    setWorkingWorkerId(workerId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/profile/workers/${workerId}/skills`, {
        method: "POST",
        token,
        body: {
          escoSkillId: draft.escoSkillId || undefined,
          title: draft.title,
          level: draft.level || undefined,
        },
      });
      setSkillDrafts((current) => ({
        ...current,
        [workerId]: emptyWorkerSkillDraft,
      }));
      await loadWorkers();
      onSuccess("Worker skill added.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to add worker skill.");
    } finally {
      setWorkingWorkerId(null);
    }
  };

  const handleDeleteSkill = async (workerId: string, skillId: string) => {
    setWorkingWorkerId(workerId);
    onError(null);
    onSuccess(null);

    try {
      await apiRequest(`/profile/workers/${workerId}/skills/${skillId}`, {
        method: "DELETE",
        token,
      });
      await loadWorkers();
      onSuccess("Worker skill removed.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to remove worker skill.");
    } finally {
      setWorkingWorkerId(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Worker Roster</div>
          <div className="mt-2 text-sm text-slate-400">
            Manage employee and subcontracted workers, then keep their assignment eligibility visible.
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {workers.length} workers
        </span>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
        <div className="text-sm font-semibold text-white">Add worker</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            placeholder="First name"
            value={workerDraft.firstName}
            onChange={(event) =>
              setWorkerDraft((current) => ({ ...current, firstName: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            placeholder="Last name"
            value={workerDraft.lastName}
            onChange={(event) =>
              setWorkerDraft((current) => ({ ...current, lastName: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            placeholder="Email"
            value={workerDraft.email}
            onChange={(event) =>
              setWorkerDraft((current) => ({ ...current, email: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            placeholder="Phone"
            value={workerDraft.phone}
            onChange={(event) =>
              setWorkerDraft((current) => ({ ...current, phone: event.target.value }))
            }
          />
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none md:col-span-2"
            placeholder="Role title"
            value={workerDraft.roleTitle}
            onChange={(event) =>
              setWorkerDraft((current) => ({ ...current, roleTitle: event.target.value }))
            }
          />
          <select
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
            value={workerDraft.employmentType}
            onChange={(event) =>
              setWorkerDraft((current) => ({
                ...current,
                employmentType: event.target.value as WorkerEmploymentType,
              }))
            }
          >
            {employmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCreateWorker}
          disabled={isSavingWorker}
          className="mt-4 rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
        >
          {isSavingWorker ? "Adding..." : "Add worker"}
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {!isLoading && workers.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
            No workers in the roster yet.
          </div>
        ) : null}

        {workers.map((worker) => {
          const documentDraft = documentDrafts[worker.id] ?? emptyWorkerDocumentDraft;
          const skillDraft = skillDrafts[worker.id] ?? emptyWorkerSkillDraft;

          return (
            <div
              key={worker.id}
              className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{worker.fullName}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {worker.roleTitle} · {worker.employmentType} · {worker.email || "No email"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                      worker.eligibility.workerEligibility || worker.eligibility.projectEligibility,
                    )}`}
                  >
                    {(worker.eligibility.workerEligibility || worker.eligibility.projectEligibility).replaceAll(
                      "_",
                      " ",
                    )}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {worker.status}
                  </span>
                </div>
              </div>

              {worker.eligibility.blockingReasons.length > 0 ? (
                <div className="mt-4 rounded-[1.25rem] border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-100">
                  {worker.eligibility.blockingReasons.join(" | ")}
                </div>
              ) : null}

              {worker.eligibility.missingItems.length > 0 ? (
                <div className="mt-3 rounded-[1.25rem] border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
                  Missing: {worker.eligibility.missingItems.join(" | ")}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                {workerStatusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleUpdateWorkerStatus(worker.id, status)}
                    disabled={workingWorkerId === worker.id || worker.status === status}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-xs text-slate-200 disabled:opacity-50"
                  >
                    Set {status}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleDeleteWorker(worker.id)}
                  disabled={workingWorkerId === worker.id}
                  className="rounded-2xl border border-rose-400/20 px-4 py-2 text-xs text-rose-100 disabled:opacity-50"
                >
                  Remove worker
                </button>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                  <div className="text-sm font-semibold text-white">Worker documents</div>
                  <div className="mt-4 space-y-3">
                    {worker.documents.map((document) => (
                      <div
                        key={document.id}
                        className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300"
                      >
                        <div className="font-semibold text-white">{document.title}</div>
                        <div className="mt-2 text-xs text-slate-400">
                          {document.type} · {document.status} · Expires {formatDate(document.expiresAt)}
                          {document.medicalCategory ? ` · ${document.medicalCategory}` : ""}
                        </div>
                      </div>
                    ))}
                    {worker.documents.length === 0 ? (
                      <div className="text-sm text-slate-400">No worker documents yet.</div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      value={documentDraft.type}
                      onChange={(event) =>
                        setDocumentDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...documentDraft,
                            type: event.target.value as WorkerDocumentType,
                            medicalCategory:
                              event.target.value === "MEDICAL" ? documentDraft.medicalCategory : "",
                          },
                        }))
                      }
                    >
                      {workerDocumentTypes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      value={documentDraft.status}
                      onChange={(event) =>
                        setDocumentDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...documentDraft,
                            status: event.target.value as ComplianceDocumentStatus,
                          },
                        }))
                      }
                    >
                      {complianceStatuses.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none md:col-span-2"
                      placeholder="Document title"
                      value={documentDraft.title}
                      onChange={(event) =>
                        setDocumentDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...documentDraft,
                            title: event.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      placeholder="Issuer"
                      value={documentDraft.issuer}
                      onChange={(event) =>
                        setDocumentDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...documentDraft,
                            issuer: event.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      type="date"
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      value={documentDraft.expiresAt}
                      onChange={(event) =>
                        setDocumentDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...documentDraft,
                            expiresAt: event.target.value,
                          },
                        }))
                      }
                    />
                    {documentDraft.type === "MEDICAL" ? (
                      <select
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none md:col-span-2"
                        value={documentDraft.medicalCategory}
                        onChange={(event) =>
                          setDocumentDrafts((current) => ({
                            ...current,
                            [worker.id]: {
                              ...documentDraft,
                              medicalCategory: event.target.value as MedicalFitnessCategory | "",
                            },
                          }))
                        }
                      >
                        <option value="">Medical category</option>
                        {medicalCategories.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCreateDocument(worker.id)}
                    disabled={workingWorkerId === worker.id}
                    className="mt-4 rounded-[1.25rem] border border-cyan-400/20 px-4 py-2 text-sm text-cyan-100 disabled:opacity-50"
                  >
                    Add worker document
                  </button>
                </div>

                <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                  <div className="text-sm font-semibold text-white">Worker skills</div>
                  <div className="mt-4 space-y-3">
                    {worker.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300"
                      >
                        <div>
                          <div className="font-semibold text-white">{skill.title}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {skill.level || "Level pending"}
                            {skill.escoSkill ? ` · ${skill.escoSkill.code}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(worker.id, skill.id)}
                          disabled={workingWorkerId === worker.id}
                          className="rounded-2xl border border-rose-400/20 px-3 py-2 text-xs text-rose-100 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {worker.skills.length === 0 ? (
                      <div className="text-sm text-slate-400">No worker skills yet.</div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      placeholder="Skill title"
                      value={skillDraft.title}
                      onChange={(event) =>
                        setSkillDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...skillDraft,
                            title: event.target.value,
                          },
                        }))
                      }
                    />
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      value={skillDraft.escoSkillId}
                      onChange={(event) =>
                        setSkillDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...skillDraft,
                            escoSkillId: event.target.value,
                          },
                        }))
                      }
                    >
                      <option value="">Link ESCO skill (optional)</option>
                      {escoSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.code} - {skill.title}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      placeholder="Level"
                      value={skillDraft.level}
                      onChange={(event) =>
                        setSkillDrafts((current) => ({
                          ...current,
                          [worker.id]: {
                            ...skillDraft,
                            level: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCreateSkill(worker.id)}
                    disabled={workingWorkerId === worker.id}
                    className="mt-4 rounded-[1.25rem] border border-cyan-400/20 px-4 py-2 text-sm text-cyan-100 disabled:opacity-50"
                  >
                    Add worker skill
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
