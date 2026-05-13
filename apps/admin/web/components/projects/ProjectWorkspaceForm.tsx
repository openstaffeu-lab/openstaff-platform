"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, apiRequest, apiRequestBlob } from "../../lib/api";
import {
  AIInterpretationStatus,
  ConditionType,
  CreateProjectPayload,
  EngagementModel,
  JobRequestStatus,
  ProjectDetail,
  ProjectDocument,
  ProjectDocumentType,
  ProjectStatus,
  TaxonomyOption,
} from "../../lib/project-types";

const engagementOptions: EngagementModel[] = ["B2B", "B2C", "MIXED"];
const projectStatusOptions: ProjectStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];
const jobRequestStatusOptions: JobRequestStatus[] = [
  "DRAFT",
  "OPEN",
  "IN_REVIEW",
  "FILLED",
  "CLOSED",
  "CANCELLED",
];
const conditionTypeOptions: ConditionType[] = [
  "PAYMENT",
  "COMMERCIAL",
  "LEGAL",
  "TECHNICAL",
  "SAFETY",
  "COMPLIANCE",
  "SCHEDULE",
  "CUSTOM",
];
const aiStatusOptions: AIInterpretationStatus[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "OVERRIDDEN",
];
const documentTypeOptions: ProjectDocumentType[] = [
  "SPECIFICATION",
  "DRAWING",
  "CONTRACT",
  "IMAGE",
  "SCOPE",
  "BOQ",
  "PERMIT",
  "OTHER",
];

type LookupState = {
  esco: TaxonomyOption[];
  nace: TaxonomyOption[];
  uniclass: TaxonomyOption[];
};

type JobRequestDraft = {
  localId: string;
  id?: string;
  title: string;
  status: JobRequestStatus;
  workerCount: string;
  notes: string;
};

type ConditionDraft = {
  localId: string;
  id?: string;
  type: ConditionType;
  title: string;
  content: string;
  isMandatory: boolean;
};

type QueuedDocumentDraft = {
  localId: string;
  file: File;
  type: ProjectDocumentType;
  title: string;
  description: string;
  usedForAI: boolean;
};

type UploadedDocumentState = ProjectDocument;

type ProjectWorkspaceFormProps = {
  mode: "create" | "edit";
  projectId?: string;
};

function createJobRequestDraft(): JobRequestDraft {
  return {
    localId: crypto.randomUUID(),
    title: "",
    status: "OPEN",
    workerCount: "1",
    notes: "",
  };
}

function createConditionDraft(): ConditionDraft {
  return {
    localId: crypto.randomUUID(),
    type: "PAYMENT",
    title: "",
    content: "",
    isMandatory: true,
  };
}

function inferDocumentType(file: File): ProjectDocumentType {
  const fileName = file.name.toLowerCase();

  if (file.type.startsWith("image/")) {
    return "IMAGE";
  }

  if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
    return "SPECIFICATION";
  }

  if (fileName.endsWith(".dwg") || fileName.endsWith(".dxf")) {
    return "DRAWING";
  }

  if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
    return "CONTRACT";
  }

  return "OTHER";
}

function createQueuedDocument(file: File): QueuedDocumentDraft {
  return {
    localId: crypto.randomUUID(),
    file,
    type: inferDocumentType(file),
    title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
    description: "",
    usedForAI: false,
  };
}

function toggleSelection(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function parseOptionalInt(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  if (sizeBytes < 1024 * 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function extractAiDocumentIds(project: ProjectDetail | null) {
  if (!project?.aiInterpretation) {
    return [];
  }

  if (project.aiInterpretation.documentIds.length > 0) {
    return project.aiInterpretation.documentIds;
  }

  const extractedJson = project.aiInterpretation.extractedJson;

  if (!extractedJson || typeof extractedJson !== "object" || Array.isArray(extractedJson)) {
    return [];
  }

  const value = (extractedJson as { documentIds?: unknown }).documentIds;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

function getDocumentBadge(type: string, mimeType: string) {
  if (type === "IMAGE" || mimeType.startsWith("image/")) {
    return "IMG";
  }

  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (mimeType.includes("word")) {
    return "DOC";
  }

  if (mimeType.startsWith("video/")) {
    return "VID";
  }

  if (type === "DRAWING") {
    return "DWG";
  }

  return "FILE";
}

function canPreviewDocument(mimeType: string) {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

export default function ProjectWorkspaceForm({
  mode,
  projectId,
}: ProjectWorkspaceFormProps) {
  const router = useRouter();
  const { token, isReady, logout, canCreateProjects, subscription } = useAuth();

  const isEditMode = mode === "edit";

  const [isBootstrapping, setIsBootstrapping] = useState(isEditMode);
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState<string | null>(null);
  const [activeDocumentActionId, setActiveDocumentActionId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [lookupState, setLookupState] = useState<LookupState>({
    esco: [],
    nace: [],
    uniclass: [],
  });

  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");
  const [engagementModel, setEngagementModel] = useState<EngagementModel>("MIXED");
  const [status, setStatus] = useState<ProjectStatus>("DRAFT");
  const [selectedEscoIds, setSelectedEscoIds] = useState<string[]>([]);
  const [selectedNaceIds, setSelectedNaceIds] = useState<string[]>([]);
  const [selectedUniclassIds, setSelectedUniclassIds] = useState<string[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequestDraft[]>([
    createJobRequestDraft(),
  ]);
  const [conditions, setConditions] = useState<ConditionDraft[]>([
    createConditionDraft(),
  ]);
  const [removedJobRequestIds, setRemovedJobRequestIds] = useState<string[]>([]);
  const [removedConditionIds, setRemovedConditionIds] = useState<string[]>([]);
  const [queuedDocuments, setQueuedDocuments] = useState<QueuedDocumentDraft[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocumentState[]>([]);
  const [aiStatus, setAiStatus] = useState<AIInterpretationStatus>("PENDING");
  const [sourceText, setSourceText] = useState("");
  const [selectedAiDocumentIds, setSelectedAiDocumentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isReady && !token) {
      router.push("/login");
    }
  }, [isReady, router, token]);

  useEffect(() => {
    const fetchLookups = async () => {
      setIsLoadingLookups(true);

      try {
        const [esco, nace, uniclass] = await Promise.all([
          apiRequest<TaxonomyOption[]>("/esco"),
          apiRequest<TaxonomyOption[]>("/nace"),
          apiRequest<TaxonomyOption[]>("/uniclass"),
        ]);

        setLookupState({ esco, nace, uniclass });
      } catch (lookupError) {
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "Failed to load taxonomy lookups.",
        );
      } finally {
        setIsLoadingLookups(false);
      }
    };

    fetchLookups();
  }, []);

  useEffect(() => {
    if (!isEditMode || !projectId || !isReady || !token) {
      return;
    }

    const fetchProject = async () => {
      setIsBootstrapping(true);
      setError(null);

      try {
        const project = await apiRequest<ProjectDetail>(`/projects/${projectId}`, {
          token,
        });

        setName(project.name);
        setSummary(project.summary ?? "");
        setLocation(project.location ?? "");
        setEngagementModel(project.engagementModel);
        setStatus(project.status);
        setSelectedEscoIds(project.escoSkills.map((item) => item.id));
        setSelectedNaceIds(project.naceCodes.map((item) => item.id));
        setSelectedUniclassIds(project.uniclassCodes.map((item) => item.id));
        setJobRequests(
          project.jobRequests.length > 0
            ? project.jobRequests.map((jobRequest) => ({
                localId: crypto.randomUUID(),
                id: jobRequest.id,
                title: jobRequest.title,
                status: jobRequest.status,
                workerCount:
                  jobRequest.workerCount !== null ? String(jobRequest.workerCount) : "",
                notes: jobRequest.notes ?? "",
              }))
            : [createJobRequestDraft()],
        );
        setConditions(
          project.conditions.length > 0
            ? project.conditions.map((condition) => ({
                localId: crypto.randomUUID(),
                id: condition.id,
                type: condition.type,
                title: condition.title,
                content: condition.content,
                isMandatory: condition.isMandatory,
              }))
            : [createConditionDraft()],
        );
        setUploadedDocuments(project.documents);
        setAiStatus(project.aiInterpretation?.status ?? "PENDING");
        setSourceText(project.aiInterpretation?.sourceText ?? "");
        setSelectedAiDocumentIds(extractAiDocumentIds(project));
        setRemovedJobRequestIds([]);
        setRemovedConditionIds([]);
        setQueuedDocuments([]);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load project workspace.",
        );
      } finally {
        setIsBootstrapping(false);
      }
    };

    fetchProject();
  }, [isEditMode, isReady, logout, projectId, router, token]);

  const snapshot = useMemo(
    () => ({
      jobRequests: jobRequests.filter((item) => item.title.trim()).length,
      conditions: conditions.filter(
        (item) => item.title.trim() && item.content.trim(),
      ).length,
      documents: queuedDocuments.length + uploadedDocuments.length,
      aiDocuments:
        queuedDocuments.filter((item) => item.usedForAI).length +
        selectedAiDocumentIds.length,
      taxonomy:
        selectedEscoIds.length + selectedNaceIds.length + selectedUniclassIds.length,
    }),
    [
      conditions,
      jobRequests,
      queuedDocuments,
      selectedAiDocumentIds.length,
      selectedEscoIds.length,
      selectedNaceIds.length,
      selectedUniclassIds.length,
      uploadedDocuments.length,
    ],
  );

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setQueuedDocuments((current) => [
      ...current,
      ...files.map((file) => createQueuedDocument(file)),
    ]);
    event.target.value = "";
  };

  const uploadQueuedDocuments = async (targetProjectId: string) => {
    if (!token || queuedDocuments.length === 0) {
      return [] as ProjectDocument[];
    }

    const uploaded: ProjectDocument[] = [];

    for (const document of queuedDocuments) {
      const formData = new FormData();
      formData.append("file", document.file);
      formData.append("type", document.type);
      formData.append("title", document.title.trim());

      if (document.description.trim()) {
        formData.append("description", document.description.trim());
      }

      const createdDocument = await apiRequest<ProjectDocument>(
        `/projects/${targetProjectId}/documents/upload`,
        {
          method: "POST",
          token,
          formData,
        },
      );

      uploaded.push(createdDocument);
    }

    return uploaded;
  };

  const upsertAIInterpretation = async (
    targetProjectId: string,
    persistedDocuments: ProjectDocument[],
    selectedQueuedLocalIds: string[],
  ) => {
    if (!token) {
      return;
    }

    const queuedDocumentMap = new Map(
      queuedDocuments.map((document) => [document.localId, document]),
    );

    const selectedUploadedIds = selectedAiDocumentIds.filter((documentId) =>
      persistedDocuments.some((document) => document.id === documentId),
    );

    const selectedNewDocumentIds = persistedDocuments
      .filter((document, index) => {
        const queuedDocument = queuedDocuments[index];
        return queuedDocument ? selectedQueuedLocalIds.includes(queuedDocument.localId) : false;
      })
      .map((document) => document.id);

    const allDocumentIds = [...new Set([...selectedUploadedIds, ...selectedNewDocumentIds])];

    await apiRequest(`/projects/${targetProjectId}/ai-interpretation`, {
      method: "PUT",
      token,
      body: {
        status: aiStatus,
        sourceText: sourceText.trim() || undefined,
        documentIds: allDocumentIds,
        extractedJson:
          allDocumentIds.length > 0
            ? {
                ingestionMode: "manual_workspace_prepare",
                queuedDocumentNames: selectedQueuedLocalIds
                  .map((localId) => queuedDocumentMap.get(localId)?.file.name)
                  .filter((value): value is string => Boolean(value)),
              }
            : undefined,
        reviewNotes:
          allDocumentIds.length > 0
            ? "Prepared from uploaded workspace documents."
            : undefined,
      },
    });
  };

  const handleDocumentOpen = async (
    document: ProjectDocument,
    mode: "preview" | "download",
  ) => {
    if (!token) {
      return;
    }

    setActiveDocumentActionId(document.id);
    setError(null);

    try {
      const blob = await apiRequestBlob(
        `/projects/${document.projectId}/documents/${document.id}`,
        { token },
      );
      const objectUrl = URL.createObjectURL(blob);

      if (mode === "preview") {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } else {
        const anchor = window.document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = document.fileName;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      }
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to access document.",
      );
    } finally {
      setActiveDocumentActionId(null);
    }
  };

  const handleDeleteUploadedDocument = async (documentId: string) => {
    if (!token || !projectId) {
      return;
    }

    setIsDeletingDocument(documentId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${projectId}/documents/${documentId}`, {
        method: "DELETE",
        token,
      });

      setUploadedDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
      setSelectedAiDocumentIds((current) =>
        current.filter((id) => id !== documentId),
      );
      setSuccessMessage("Document removed from the workspace.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to remove document.",
      );
    } finally {
      setIsDeletingDocument(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (mode === "create" && !canCreateProjects) {
      setError(
        `Your current plan (${subscription?.planName ?? "No active plan"}) does not include project ingestion.`,
      );
      return;
    }

    const filteredJobRequests = jobRequests.filter((item) => item.title.trim());
    const filteredConditions = conditions.filter(
      (item) => item.title.trim() && item.content.trim(),
    );

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (filteredJobRequests.length === 0) {
      setError("Add at least one job request.");
      return;
    }

    if (filteredConditions.length === 0) {
      setError("Add at least one condition / clause.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === "create") {
        const payload: CreateProjectPayload = {
          name: name.trim(),
          summary: summary.trim() || undefined,
          location: location.trim() || undefined,
          engagementModel,
          status,
          escoSkillIds: selectedEscoIds,
          naceIds: selectedNaceIds,
          uniclassIds: selectedUniclassIds,
          jobRequests: filteredJobRequests.map((item) => ({
            title: item.title.trim(),
            status: item.status,
            workerCount: parseOptionalInt(item.workerCount),
            notes: item.notes.trim() || undefined,
          })),
          conditions: filteredConditions.map((item) => ({
            type: item.type,
            title: item.title.trim(),
            content: item.content.trim(),
            isMandatory: item.isMandatory,
          })),
          aiInterpretation: {
            status: aiStatus,
            sourceText: sourceText.trim(),
          },
        };

        const createdProject = await apiRequest<ProjectDetail>("/projects", {
          method: "POST",
          token,
          body: payload,
        });

        const selectedQueuedLocalIds = queuedDocuments
          .filter((document) => document.usedForAI)
          .map((document) => document.localId);
        const newDocuments = await uploadQueuedDocuments(createdProject.id);

        if (newDocuments.length > 0 || sourceText.trim()) {
          await upsertAIInterpretation(
            createdProject.id,
            newDocuments,
            selectedQueuedLocalIds,
          );
        }

        router.push(`/projects/${createdProject.id}`);
        return;
      }

      if (!projectId) {
        throw new Error("Project id is missing.");
      }

      await apiRequest<ProjectDetail>(`/projects/${projectId}`, {
        method: "PATCH",
        token,
        body: {
          name: name.trim(),
          summary: summary.trim() || null,
          location: location.trim() || null,
          engagementModel,
          status,
          escoSkillIds: selectedEscoIds,
          naceIds: selectedNaceIds,
          uniclassIds: selectedUniclassIds,
        },
      });

      for (const jobRequestId of removedJobRequestIds) {
        await apiRequest(`/projects/${projectId}/job-requests/${jobRequestId}`, {
          method: "DELETE",
          token,
        });
      }

      for (const conditionId of removedConditionIds) {
        await apiRequest(`/projects/${projectId}/conditions/${conditionId}`, {
          method: "DELETE",
          token,
        });
      }

      for (const jobRequest of filteredJobRequests) {
        const payload = {
          title: jobRequest.title.trim(),
          status: jobRequest.status,
          workerCount: parseOptionalInt(jobRequest.workerCount),
          notes: jobRequest.notes.trim() || null,
        };

        if (jobRequest.id) {
          await apiRequest(`/projects/${projectId}/job-requests/${jobRequest.id}`, {
            method: "PATCH",
            token,
            body: payload,
          });
        } else {
          await apiRequest(`/projects/${projectId}/job-requests`, {
            method: "POST",
            token,
            body: payload,
          });
        }
      }

      for (const condition of filteredConditions) {
        const payload = {
          type: condition.type,
          title: condition.title.trim(),
          content: condition.content.trim(),
          isMandatory: condition.isMandatory,
        };

        if (condition.id) {
          await apiRequest(`/projects/${projectId}/conditions/${condition.id}`, {
            method: "PATCH",
            token,
            body: payload,
          });
        } else {
          await apiRequest(`/projects/${projectId}/conditions`, {
            method: "POST",
            token,
            body: payload,
          });
        }
      }

      const selectedQueuedLocalIds = queuedDocuments
        .filter((document) => document.usedForAI)
        .map((document) => document.localId);
      const newlyUploadedDocuments = await uploadQueuedDocuments(projectId);
      const allDocuments = [...uploadedDocuments, ...newlyUploadedDocuments];

      await upsertAIInterpretation(projectId, allDocuments, selectedQueuedLocalIds);

      router.push(`/projects/${projectId}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to save project workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isBootstrapping) {
    return (
      <main className="min-h-screen px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-slate-300">
          Loading editable workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-cyan-300">
                General Contractor Workspace
              </div>
              <h1 className="mt-3 text-4xl font-semibold">
                {isEditMode
                  ? "Refine the project workspace"
                  : "Prepare a structured project request"}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Structure the tender record, workforce demand, clauses, real
                attachments, and AI intake notes in one contractor-oriented flow.
              </p>
            </div>

            <Link
              href={isEditMode && projectId ? `/projects/${projectId}` : "/projects"}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
            >
              {isEditMode ? "Back to project" : "Back to projects"}
            </Link>
          </div>
        </header>

        <form
          className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Project Identity
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm text-slate-300">Name</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Mixed-use retrofit, fit-out package, energy upgrade..."
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm text-slate-300">Summary</span>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="Short contractor-facing summary for the tender workspace."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Location</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Bucharest, Berlin, on-site address..."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Engagement model
                  </span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={engagementModel}
                    onChange={(event) =>
                      setEngagementModel(event.target.value as EngagementModel)
                    }
                  >
                    {engagementOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Status</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ProjectStatus)
                    }
                  >
                    {projectStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                  Job Requests
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setJobRequests((current) => [...current, createJobRequestDraft()])
                  }
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200"
                >
                  Add job request
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {jobRequests.map((jobRequest, index) => (
                  <div
                    key={jobRequest.localId}
                    className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-white">
                        Job Request {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (jobRequest.id) {
                            setRemovedJobRequestIds((current) => [
                              ...current,
                              jobRequest.id!,
                            ]);
                          }

                          setJobRequests((current) =>
                            current.filter((item) => item.localId !== jobRequest.localId),
                          );
                        }}
                        className="text-sm text-rose-300"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block md:col-span-3">
                        <span className="mb-2 block text-sm text-slate-300">Title</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={jobRequest.title}
                          onChange={(event) =>
                            setJobRequests((current) =>
                              current.map((item) =>
                                item.localId === jobRequest.localId
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="HVAC crew, finish carpentry team, civil repair squad..."
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Status</span>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={jobRequest.status}
                          onChange={(event) =>
                            setJobRequests((current) =>
                              current.map((item) =>
                                item.localId === jobRequest.localId
                                  ? {
                                      ...item,
                                      status: event.target.value as JobRequestStatus,
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {jobRequestStatusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">
                          Worker count
                        </span>
                        <input
                          type="number"
                          min={1}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={jobRequest.workerCount}
                          onChange={(event) =>
                            setJobRequests((current) =>
                              current.map((item) =>
                                item.localId === jobRequest.localId
                                  ? { ...item, workerCount: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>

                      <div className="rounded-2xl border border-white/8 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
                        Per-job taxonomy stays prepared for the next phase.
                      </div>

                      <label className="block md:col-span-3">
                        <span className="mb-2 block text-sm text-slate-300">Notes</span>
                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={jobRequest.notes}
                          onChange={(event) =>
                            setJobRequests((current) =>
                              current.map((item) =>
                                item.localId === jobRequest.localId
                                  ? { ...item, notes: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Crew notes, shift requirements, safety constraints..."
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                  Conditions / Clauses
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConditions((current) => [...current, createConditionDraft()])
                  }
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200"
                >
                  Add clause
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {conditions.map((condition, index) => (
                  <div
                    key={condition.localId}
                    className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-white">
                        Clause {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (condition.id) {
                            setRemovedConditionIds((current) => [
                              ...current,
                              condition.id!,
                            ]);
                          }

                          setConditions((current) =>
                            current.filter((item) => item.localId !== condition.localId),
                          );
                        }}
                        className="text-sm text-rose-300"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Type</span>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={condition.type}
                          onChange={(event) =>
                            setConditions((current) =>
                              current.map((item) =>
                                item.localId === condition.localId
                                  ? {
                                      ...item,
                                      type: event.target.value as ConditionType,
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {conditionTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Title</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={condition.title}
                          onChange={(event) =>
                            setConditions((current) =>
                              current.map((item) =>
                                item.localId === condition.localId
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Payment terms, access rule, permit dependency..."
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm text-slate-300">Content</span>
                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none"
                          value={condition.content}
                          onChange={(event) =>
                            setConditions((current) =>
                              current.map((item) =>
                                item.localId === condition.localId
                                  ? { ...item, content: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Clause text that should travel with the tender workspace."
                        />
                      </label>

                      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-900/60 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={condition.isMandatory}
                          onChange={(event) =>
                            setConditions((current) =>
                              current.map((item) =>
                                item.localId === condition.localId
                                  ? { ...item, isMandatory: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        <span className="text-sm text-slate-300">
                          Mandatory clause
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Project Taxonomy
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The workspace carries real ESCO, NACE, and UNICLASS structure at
                project level while job-request selectors stay prepared for the
                next phase.
              </p>

              {isLoadingLookups ? (
                <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
                  Loading taxonomy lookups...
                </div>
              ) : (
                <div className="mt-5 grid gap-5 xl:grid-cols-3">
                  {[
                    {
                      title: "ESCO",
                      options: lookupState.esco,
                      selected: selectedEscoIds,
                      setSelected: setSelectedEscoIds,
                    },
                    {
                      title: "NACE",
                      options: lookupState.nace,
                      selected: selectedNaceIds,
                      setSelected: setSelectedNaceIds,
                    },
                    {
                      title: "UNICLASS",
                      options: lookupState.uniclass,
                      selected: selectedUniclassIds,
                      setSelected: setSelectedUniclassIds,
                    },
                  ].map((group) => (
                    <div
                      key={group.title}
                      className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4"
                    >
                      <div className="text-sm font-semibold text-white">
                        {group.title}
                      </div>
                      <div className="mt-4 space-y-3">
                        {group.options.map((option) => (
                          <label
                            key={option.id}
                            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/6 bg-slate-900/70 px-3 py-3"
                          >
                            <input
                              type="checkbox"
                              checked={group.selected.includes(option.id)}
                              onChange={() =>
                                group.setSelected((current) =>
                                  toggleSelection(current, option.id),
                                )
                              }
                            />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {option.title}
                              </div>
                              <div className="text-xs text-slate-400">
                                {option.code}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                    Documents
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Upload real files to the local ingestion pipeline and mark the
                    documents that AI should process later.
                  </p>
                </div>
                <label className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                  <span>Select files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.mp4,.mov,.avi"
                    onChange={handleFileSelection}
                  />
                </label>
              </div>

              <div className="mt-5 space-y-4">
                {queuedDocuments.map((document) => (
                  <div
                    key={document.localId}
                    className="rounded-[1.5rem] border border-amber-400/15 bg-amber-500/8 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                          {getDocumentBadge(document.type, document.file.type)}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {document.file.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-300">
                            Queued for upload · {formatBytes(document.file.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQueuedDocuments((current) =>
                            current.filter((item) => item.localId !== document.localId),
                          )
                        }
                        className="text-sm text-rose-300"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Type</span>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={document.type}
                          onChange={(event) =>
                            setQueuedDocuments((current) =>
                              current.map((item) =>
                                item.localId === document.localId
                                  ? {
                                      ...item,
                                      type: event.target.value as ProjectDocumentType,
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {documentTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Title</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={document.title}
                          onChange={(event) =>
                            setQueuedDocuments((current) =>
                              current.map((item) =>
                                item.localId === document.localId
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm text-slate-300">
                          Description
                        </span>
                        <textarea
                          className="min-h-20 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={document.description}
                          onChange={(event) =>
                            setQueuedDocuments((current) =>
                              current.map((item) =>
                                item.localId === document.localId
                                  ? { ...item, description: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Optional note about what this file covers."
                        />
                      </label>

                      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={document.usedForAI}
                          onChange={(event) =>
                            setQueuedDocuments((current) =>
                              current.map((item) =>
                                item.localId === document.localId
                                  ? { ...item, usedForAI: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        <span className="text-sm text-slate-300">
                          Use for AI analysis
                        </span>
                      </label>
                    </div>
                  </div>
                ))}

                {uploadedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                          {getDocumentBadge(document.type, document.mimeType)}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {document.title}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {document.fileName} · {document.type} ·{" "}
                            {formatBytes(document.sizeBytes)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {document.storage.key}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {canPreviewDocument(document.mimeType) ? (
                          <button
                            type="button"
                            onClick={() => handleDocumentOpen(document, "preview")}
                            disabled={activeDocumentActionId === document.id}
                            className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-60"
                          >
                            Preview
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDocumentOpen(document, "download")}
                          disabled={activeDocumentActionId === document.id}
                          className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-60"
                        >
                          Download
                        </button>
                        {isEditMode ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUploadedDocument(document.id)}
                            disabled={isDeletingDocument === document.id}
                            className="rounded-2xl border border-rose-400/20 px-3 py-2 text-xs font-semibold text-rose-300 disabled:opacity-60"
                          >
                            {isDeletingDocument === document.id ? "Removing..." : "Remove"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-900/60 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedAiDocumentIds.includes(document.id)}
                          onChange={() =>
                            setSelectedAiDocumentIds((current) =>
                              toggleSelection(current, document.id),
                            )
                          }
                        />
                        <span className="text-sm text-slate-300">
                          Use for AI analysis
                        </span>
                      </label>
                    </div>
                  </div>
                ))}

                {queuedDocuments.length === 0 && uploadedDocuments.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                    No documents in the workspace yet. Add PDFs, images, drawings,
                    Word files, or reference media to prepare the tender record.
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                AI Analysis Source
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Status</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={aiStatus}
                    onChange={(event) =>
                      setAiStatus(event.target.value as AIInterpretationStatus)
                    }
                  >
                    {aiStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-4 text-sm text-slate-300">
                  This phase stores real document references for later parsing. No
                  OCR, PDF extraction, or AI processing runs yet.
                </div>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm text-slate-300">Source text</span>
                  <textarea
                    className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                    value={sourceText}
                    onChange={(event) => setSourceText(event.target.value)}
                    placeholder="Paste the client brief, tender summary, or AI intake note."
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Workspace Snapshot
              </div>
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/8 bg-slate-900/80 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Engagement Model
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {engagementModel}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/80 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Job Requests
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {snapshot.jobRequests}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/80 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Clauses
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {snapshot.conditions}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/80 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Documents
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {snapshot.documents}
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">
                    AI Source Docs
                  </div>
                  <div className="mt-2 text-lg font-semibold text-cyan-100">
                    {snapshot.aiDocuments}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/80 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Taxonomy Tags
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {snapshot.taxonomy}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-400/20 bg-amber-500/8 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-amber-200">
                Upload pipeline
              </div>
              <div className="mt-5 rounded-2xl border border-amber-200/10 bg-slate-950/40 px-4 py-4 text-sm text-amber-100">
                Files now go through the real local ingestion endpoint and are
                stored under the backend uploads folder.
              </div>
            </section>

            {error ? (
              <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-[1.5rem] bg-cyan-400 px-5 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving workspace..."
                  : "Creating project..."
                : isEditMode
                  ? "Save workspace"
                  : "Create project workspace"}
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}
