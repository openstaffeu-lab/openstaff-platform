"use client";

import { useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  ActorCertificationType,
  ActorDocumentType,
  ComplianceDocumentStatus,
  MedicalFitnessCategory,
  ProfileComplianceWorkspace,
  ProfileDetail,
  TaxonomyOption,
  UserTask,
  UserTaskStatus,
} from "../../lib/project-types";

const actorDocumentTypes: ActorDocumentType[] = [
  "COMPANY_DOCUMENT",
  "TAX_DOCUMENT",
  "INSURANCE_DOCUMENT",
  "PROJECT_AUTHORITY_DOCUMENT",
  "IDENTITY_DOCUMENT",
  "NACE_ACTIVITY_DOCUMENT",
  "AUTHORIZATION_DOCUMENT",
  "CERTIFICATE_DOCUMENT",
  "LICENSE_DOCUMENT",
  "TRAINING_DOCUMENT",
  "MEDICAL_DOCUMENT",
  "OTHER",
];

const certificationTypes: ActorCertificationType[] = [
  "CERTIFICATE",
  "PERMIT",
  "LICENSE",
  "TRAINING_RECORD",
  "INSURANCE",
  "OTHER",
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

const complianceStatuses: ComplianceDocumentStatus[] = [
  "PENDING",
  "VALID",
  "EXPIRED",
  "REJECTED",
  "REQUIRES_REVIEW",
];

const taskStatusOptions: UserTaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
  "EXPIRED",
];

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
  if (status === "VALID" || status === "COMPLETED" || status === "READY") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "EXPIRED" || status === "REJECTED" || status === "CRITICAL") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  if (status === "REQUIRES_REVIEW" || status === "WARNING" || status === "AT_RISK") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

type Props = {
  token: string;
  profile: ProfileDetail;
  compliance: ProfileComplianceWorkspace | null;
  escoSkills: TaxonomyOption[];
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

export function ProfileComplianceWorkspacePanel({
  token,
  profile,
  compliance,
  escoSkills,
  onRefresh,
  onError,
  onSuccess,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [workingTaskId, setWorkingTaskId] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState({
    profileDocumentId: "",
    type: "COMPANY_DOCUMENT" as ActorDocumentType,
    title: "",
    issuer: "",
    issuedAt: "",
    expiresAt: "",
    status: "PENDING" as ComplianceDocumentStatus,
    notes: "",
  });
  const [certificationForm, setCertificationForm] = useState({
    actorDocumentId: "",
    type: "CERTIFICATE" as ActorCertificationType,
    title: "",
    issuer: "",
    issuedAt: "",
    expiresAt: "",
    status: "PENDING" as ComplianceDocumentStatus,
    escoSkillId: "",
  });
  const [medicalForm, setMedicalForm] = useState({
    actorDocumentId: "",
    category: "GENERAL_PHYSICAL_FITNESS" as MedicalFitnessCategory,
    title: "",
    issuerName: "",
    issuedAt: "",
    expiresAt: "",
    status: "PENDING" as ComplianceDocumentStatus,
    fitnessDecision: "REQUIRES_REVIEW" as const,
    jobSpecificClearance: "",
  });

  const availableProfileDocuments = useMemo(
    () => profile.documents.filter((document) => document.type !== "VIDEO"),
    [profile.documents],
  );

  const createActorDocument = async () => {
    setIsSaving(true);
    try {
      await apiRequest(`/profiles/${profile.id}/actor-documents`, {
        method: "POST",
        token,
        body: {
          profileDocumentId: documentForm.profileDocumentId || undefined,
          type: documentForm.type,
          title: documentForm.title,
          issuer: documentForm.issuer || undefined,
          issuedAt: documentForm.issuedAt || undefined,
          expiresAt: documentForm.expiresAt || undefined,
          status: documentForm.status,
          notes: documentForm.notes || undefined,
        },
      });
      setDocumentForm({
        profileDocumentId: "",
        type: "COMPANY_DOCUMENT",
        title: "",
        issuer: "",
        issuedAt: "",
        expiresAt: "",
        status: "PENDING",
        notes: "",
      });
      await onRefresh();
      onSuccess("Actor document metadata saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save actor document.");
    } finally {
      setIsSaving(false);
    }
  };

  const createCertification = async () => {
    setIsSaving(true);
    try {
      await apiRequest(`/profiles/${profile.id}/certifications`, {
        method: "POST",
        token,
        body: {
          actorDocumentId: certificationForm.actorDocumentId || undefined,
          type: certificationForm.type,
          title: certificationForm.title,
          issuer: certificationForm.issuer || undefined,
          issuedAt: certificationForm.issuedAt || undefined,
          expiresAt: certificationForm.expiresAt || undefined,
          status: certificationForm.status,
          escoSkillId: certificationForm.escoSkillId || undefined,
        },
      });
      setCertificationForm({
        actorDocumentId: "",
        type: "CERTIFICATE",
        title: "",
        issuer: "",
        issuedAt: "",
        expiresAt: "",
        status: "PENDING",
        escoSkillId: "",
      });
      await onRefresh();
      onSuccess("Certification saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save certification.");
    } finally {
      setIsSaving(false);
    }
  };

  const createMedicalCertificate = async () => {
    setIsSaving(true);
    try {
      await apiRequest(`/profiles/${profile.id}/medical-fitness`, {
        method: "POST",
        token,
        body: {
          actorDocumentId: medicalForm.actorDocumentId || undefined,
          category: medicalForm.category,
          title: medicalForm.title,
          issuerName: medicalForm.issuerName,
          issuedAt: medicalForm.issuedAt || undefined,
          expiresAt: medicalForm.expiresAt || undefined,
          status: medicalForm.status,
          fitnessDecision: medicalForm.fitnessDecision,
          jobSpecificClearance: medicalForm.jobSpecificClearance || undefined,
        },
      });
      setMedicalForm({
        actorDocumentId: "",
        category: "GENERAL_PHYSICAL_FITNESS",
        title: "",
        issuerName: "",
        issuedAt: "",
        expiresAt: "",
        status: "PENDING",
        fitnessDecision: "REQUIRES_REVIEW",
        jobSpecificClearance: "",
      });
      await onRefresh();
      onSuccess("Medical fitness certificate saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save medical fitness certificate.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = async (task: UserTask, status: UserTaskStatus) => {
    setWorkingTaskId(task.id);
    try {
      await apiRequest(`/profile/tasks/${task.id}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await onRefresh();
      onSuccess(`Task moved to ${status.replaceAll("_", " ")}.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update task.");
    } finally {
      setWorkingTaskId(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Compliance Workspace
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Role-based readiness, certifications, medical fitness, and task obligations.
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-[1.25rem] border border-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-100"
        >
          Recompute Compliance
        </button>
      </div>

      {compliance ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Onboarding Readiness</div>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(
                  compliance.onboarding.readiness,
                )}`}
              >
                {compliance.onboarding.readiness.replaceAll("_", " ")}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {compliance.onboarding.requiredItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/8 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(
                        item.satisfied ? "VALID" : item.status,
                      )}`}
                    >
                      {item.satisfied ? "READY" : item.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{item.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
              <div className="text-sm font-semibold text-white">Actor Documents</div>
              <div className="mt-4 space-y-3">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={documentForm.profileDocumentId}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      profileDocumentId: event.target.value,
                    }))
                  }
                >
                  <option value="">Link uploaded profile document (optional)</option>
                  {availableProfileDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title} - {document.fileName}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={documentForm.type}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      type: event.target.value as ActorDocumentType,
                    }))
                  }
                >
                  {actorDocumentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Title"
                  value={documentForm.title}
                  onChange={(event) =>
                    setDocumentForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Issuer"
                  value={documentForm.issuer}
                  onChange={(event) =>
                    setDocumentForm((current) => ({ ...current, issuer: event.target.value }))
                  }
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    value={documentForm.issuedAt}
                    onChange={(event) =>
                      setDocumentForm((current) => ({ ...current, issuedAt: event.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    value={documentForm.expiresAt}
                    onChange={(event) =>
                      setDocumentForm((current) => ({ ...current, expiresAt: event.target.value }))
                    }
                  />
                </div>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={documentForm.status}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      status: event.target.value as ComplianceDocumentStatus,
                    }))
                  }
                >
                  {complianceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Notes"
                  value={documentForm.notes}
                  onChange={(event) =>
                    setDocumentForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={createActorDocument}
                  disabled={isSaving || !documentForm.title.trim()}
                  className="w-full rounded-[1.25rem] bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  Save Actor Document
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {compliance.actorDocuments.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <span className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(item.status)}`}>
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {item.type} · Expires {formatDate(item.expiresAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
              <div className="text-sm font-semibold text-white">Certifications</div>
              <div className="mt-4 space-y-3">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={certificationForm.actorDocumentId}
                  onChange={(event) =>
                    setCertificationForm((current) => ({
                      ...current,
                      actorDocumentId: event.target.value,
                    }))
                  }
                >
                  <option value="">Link actor document (optional)</option>
                  {compliance.actorDocuments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={certificationForm.type}
                  onChange={(event) =>
                    setCertificationForm((current) => ({
                      ...current,
                      type: event.target.value as ActorCertificationType,
                    }))
                  }
                >
                  {certificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Title"
                  value={certificationForm.title}
                  onChange={(event) =>
                    setCertificationForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Issuer"
                  value={certificationForm.issuer}
                  onChange={(event) =>
                    setCertificationForm((current) => ({ ...current, issuer: event.target.value }))
                  }
                />
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={certificationForm.escoSkillId}
                  onChange={(event) =>
                    setCertificationForm((current) => ({
                      ...current,
                      escoSkillId: event.target.value,
                    }))
                  }
                >
                  <option value="">Link ESCO skill (optional)</option>
                  {escoSkills.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.title}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    value={certificationForm.issuedAt}
                    onChange={(event) =>
                      setCertificationForm((current) => ({ ...current, issuedAt: event.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    value={certificationForm.expiresAt}
                    onChange={(event) =>
                      setCertificationForm((current) => ({ ...current, expiresAt: event.target.value }))
                    }
                  />
                </div>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={certificationForm.status}
                  onChange={(event) =>
                    setCertificationForm((current) => ({
                      ...current,
                      status: event.target.value as ComplianceDocumentStatus,
                    }))
                  }
                >
                  {complianceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={createCertification}
                  disabled={isSaving || !certificationForm.title.trim()}
                  className="w-full rounded-[1.25rem] bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  Save Certification
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {compliance.certifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <span className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(item.status)}`}>
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {item.type} · Expires {formatDate(item.expiresAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
              <div className="text-sm font-semibold text-white">Medical Fitness</div>
              <div className="mt-4 space-y-3">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={medicalForm.actorDocumentId}
                  onChange={(event) =>
                    setMedicalForm((current) => ({
                      ...current,
                      actorDocumentId: event.target.value,
                    }))
                  }
                >
                  <option value="">Link actor document (optional)</option>
                  {compliance.actorDocuments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={medicalForm.category}
                  onChange={(event) =>
                    setMedicalForm((current) => ({
                      ...current,
                      category: event.target.value as MedicalFitnessCategory,
                    }))
                  }
                >
                  {medicalCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Title"
                  value={medicalForm.title}
                  onChange={(event) =>
                    setMedicalForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Issuer name"
                  value={medicalForm.issuerName}
                  onChange={(event) =>
                    setMedicalForm((current) => ({ ...current, issuerName: event.target.value }))
                  }
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    value={medicalForm.issuedAt}
                    onChange={(event) =>
                      setMedicalForm((current) => ({ ...current, issuedAt: event.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                    value={medicalForm.expiresAt}
                    onChange={(event) =>
                      setMedicalForm((current) => ({ ...current, expiresAt: event.target.value }))
                    }
                  />
                </div>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  value={medicalForm.status}
                  onChange={(event) =>
                    setMedicalForm((current) => ({
                      ...current,
                      status: event.target.value as ComplianceDocumentStatus,
                    }))
                  }
                >
                  {complianceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Job-specific clearance / fit for role notes"
                  value={medicalForm.jobSpecificClearance}
                  onChange={(event) =>
                    setMedicalForm((current) => ({
                      ...current,
                      jobSpecificClearance: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={createMedicalCertificate}
                  disabled={isSaving || !medicalForm.title.trim() || !medicalForm.issuerName.trim()}
                  className="w-full rounded-[1.25rem] bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  Save Medical Fitness
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {compliance.medicalFitnessCertificates.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <span className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(item.status)}`}>
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {item.category} · {item.fitnessDecision} · Expires {formatDate(item.expiresAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
              <div className="text-sm font-semibold text-white">Compliance Alerts</div>
              <div className="mt-4 space-y-3">
                {compliance.alerts.length ? (
                  compliance.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">{alert.type}</div>
                        <span className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-300">{alert.message}</div>
                      <div className="mt-2 text-xs text-slate-500">Due {formatDate(alert.dueDate)}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                    No compliance alerts right now.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
              <div className="text-sm font-semibold text-white">My Tasks</div>
              <div className="mt-4 space-y-3">
                {compliance.tasks.length ? (
                  compliance.tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{task.title}</div>
                          <div className="mt-2 text-xs text-slate-400">
                            {task.type} · {task.priority} · Due {formatDate(task.dueDate)}
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs ${badgeForStatus(task.status)}`}>
                          {task.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      {task.description ? (
                        <div className="mt-3 text-sm text-slate-300">{task.description}</div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {taskStatusOptions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateTask(task, status)}
                            disabled={workingTaskId === task.id || task.status === status}
                            className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
                          >
                            {workingTaskId === task.id && task.status !== status ? "Saving..." : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                    No platform tasks assigned yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
          Compliance workspace will appear once the profile is saved and recomputed.
        </div>
      )}
    </section>
  );
}
