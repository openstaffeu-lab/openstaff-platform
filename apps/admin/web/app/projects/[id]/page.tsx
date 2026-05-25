"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConversationThreadPanel } from "../../../components/messaging/ConversationThreadPanel";
import { NotificationPanel } from "../../../components/notifications/NotificationPanel";
import { ProjectComplianceOverviewPanel } from "../../../components/projects/ProjectComplianceOverview";
import { ProjectExecutionPanel } from "../../../components/projects/ProjectExecutionPanel";
import { ProjectTimesheetsPanel } from "../../../components/projects/ProjectTimesheetsPanel";
import { ProjectWorkerAssignmentsPanel } from "../../../components/projects/ProjectWorkerAssignmentsPanel";
import { useAuth } from "../../../context/AuthContext";
import { loginPathForCurrentLocation } from "../../../lib/auth-redirect";
import { ApiError, apiRequest, apiRequestBlob } from "../../../lib/api";
import {
  AIInterpretationPayload,
  AIInterpretationStatus,
  AuditLogItem,
  ApplyAISuggestionsPayload,
  EligibilityAssessment,
  NotificationItem,
  NotificationListResponse,
  ProjectComplianceOverview,
  ProjectContract,
  ProjectContractStatus,
  ProjectDetail,
  ProjectDocument,
  ProjectDisputeSeverity,
  ProjectDisputeStatus,
  ProjectDisputeType,
  ProjectEscrowStatus,
  ProjectInvoiceStatus,
  ProjectInvitation,
  ProjectMatchResult,
  ProjectMilestoneStatus,
  ProjectPaymentStatus,
  ProjectProposal,
  ProjectProposalStatus,
  ProjectShortlistEntry,
  TaxonomyOption,
} from "../../../lib/project-types";

const aiStatusOptions: AIInterpretationStatus[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "OVERRIDDEN",
];

const contractStatusOptions: ProjectContractStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

const escrowStatusOptions: ProjectEscrowStatus[] = [
  "NOT_FUNDED",
  "PARTIALLY_FUNDED",
  "FUNDED",
  "RELEASED",
  "DISPUTED",
  "CANCELLED",
];

const milestoneStatusOptions: ProjectMilestoneStatus[] = [
  "DRAFT",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
  "RELEASED",
  "DISPUTED",
];

const disputeTypeOptions: ProjectDisputeType[] = [
  "MILESTONE",
  "INVOICE",
  "PAYMENT",
  "CONTRACT",
  "SAFETY",
  "QUALITY",
  "OTHER",
];

const disputeSeverityOptions: ProjectDisputeSeverity[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const disputeStatusOptions: ProjectDisputeStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
  "CANCELLED",
];

type ExtractedTextResponse = {
  documentId: string;
  extractionStatus: string;
  extractionError: string | null;
  extractedAt: string | null;
  extractedText: string | null;
};

type ApplySelectionState = {
  applySummary: boolean;
  applyEngagementModel: boolean;
  jobRequestIndexes: number[];
  conditionIndexes: number[];
  taxonomy: {
    escoIds: string[];
    naceIds: string[];
    uniclassIds: string[];
  };
};

type EscrowDraft = {
  status: ProjectEscrowStatus;
  currencyCode: string;
  totalAmountCents: string;
  fundedAmountCents: string;
  releasedAmountCents: string;
};

type MilestoneDraft = {
  title: string;
  description: string;
  amountCents: string;
  dueDate: string;
};

type InvoiceDraft = {
  milestoneId: string;
  amountCents: string;
  currencyCode: string;
  vatCents: string;
  description: string;
  dueDate: string;
};

type DisputeDraft = {
  type: ProjectDisputeType;
  severity: ProjectDisputeSeverity;
  title: string;
  description: string;
  milestoneId: string;
  invoiceId: string;
  paymentId: string;
};

type DisputeEventDraft = {
  type: "COMMENT" | "EVIDENCE_ADDED";
  message: string;
};

function createEmptyApplySelection(): ApplySelectionState {
  return {
    applySummary: false,
    applyEngagementModel: false,
    jobRequestIndexes: [],
    conditionIndexes: [],
    taxonomy: {
      escoIds: [],
      naceIds: [],
      uniclassIds: [],
    },
  };
}

function emptyMilestoneDraft(): MilestoneDraft {
  return {
    title: "",
    description: "",
    amountCents: "",
    dueDate: "",
  };
}

function emptyInvoiceDraft(currencyCode?: string | null): InvoiceDraft {
  return {
    milestoneId: "",
    amountCents: "",
    currencyCode: currencyCode || "EUR",
    vatCents: "",
    description: "",
    dueDate: "",
  };
}

function emptyDisputeDraft(): DisputeDraft {
  return {
    type: "OTHER",
    severity: "MEDIUM",
    title: "",
    description: "",
    milestoneId: "",
    invoiceId: "",
    paymentId: "",
  };
}

function emptyDisputeEventDraft(): DisputeEventDraft {
  return {
    type: "COMMENT",
    message: "",
  };
}

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

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMoney(priceCents: number | null, currencyCode: string | null) {
  if (priceCents === null || priceCents === undefined) {
    return "Not priced";
  }

  return `${currencyCode || "EUR"} ${(priceCents / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function decodeJwtSub(token: string | null) {
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function canPreviewDocument(mimeType: string) {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

function canExtractDocument(document: ProjectDocument) {
  const fileName = document.fileName.toLowerCase();

  return (
    document.mimeType === "application/pdf" ||
    document.mimeType === "text/plain" ||
    document.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".docx")
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

  if (mimeType === "text/plain") {
    return "TXT";
  }

  return "FILE";
}

function getExtractionBadge(status: string) {
  if (status === "COMPLETED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "FAILED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  }

  if (status === "UNSUPPORTED") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }

  if (status === "PENDING") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getInvitationBadge(status: string) {
  if (status === "SENT") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "ACCEPTED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "DECLINED" || status === "EXPIRED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  if (status === "VIEWED") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getProposalBadge(status: ProjectProposalStatus) {
  if (status === "ACCEPTED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "REJECTED" || status === "WITHDRAWN") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  if (status === "UNDER_REVIEW") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getContractBadge(status: ProjectContractStatus) {
  if (status === "ACTIVE" || status === "COMPLETED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "SENT" || status === "ACCEPTED") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "CANCELLED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getEscrowBadge(status: ProjectEscrowStatus) {
  if (status === "FUNDED" || status === "RELEASED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "PARTIALLY_FUNDED") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "DISPUTED" || status === "CANCELLED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getMilestoneBadge(status: ProjectMilestoneStatus) {
  if (status === "COMPLETED" || status === "RELEASED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "APPROVED" || status === "IN_PROGRESS") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "DISPUTED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getInvoiceBadge(status: ProjectInvoiceStatus) {
  if (status === "PAID") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "ISSUED") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "CANCELLED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getPaymentBadge(status: ProjectPaymentStatus) {
  if (status === "RELEASED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "APPROVED") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "FAILED") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
}

function getDisputeBadge(status: ProjectDisputeStatus) {
  if (status === "RESOLVED") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "UNDER_REVIEW") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    return "border-slate-400/20 bg-slate-500/10 text-slate-200";
  }

  return "border-rose-400/20 bg-rose-500/10 text-rose-100";
}

function getDisputeSeverityBadge(severity: ProjectDisputeSeverity) {
  if (severity === "CRITICAL") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  if (severity === "HIGH") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  if (severity === "MEDIUM") {
    return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
  }

  return "border-white/10 bg-slate-900/70 text-slate-300";
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

function isIneligible(eligibility: EligibilityAssessment | null | undefined) {
  return (
    eligibility?.projectEligibility === "NOT_ELIGIBLE" ||
    eligibility?.projectEligibility === "BLOCKED" ||
    eligibility?.jobRequestEligibility === "NOT_ELIGIBLE" ||
    eligibility?.jobRequestEligibility === "BLOCKED"
  );
}

function parseAIInterpretationPayload(value: unknown) {
  if (!value || typeof value === "string") {
    return null;
  }

  return value as AIInterpretationPayload;
}

function formatExtractedJson(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

async function safeRequest<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return fallback;
    }

    throw error;
  }
}

function TaxonomyGroup({
  title,
  prefix,
  items,
}: {
  title: string;
  prefix: string;
  items: TaxonomyOption[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
            >
              {prefix} {item.code} - {item.title}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">No items selected yet.</span>
        )}
      </div>
    </div>
  );
}

function ApplyCheckbox({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4" />
      <div>
        <div className="text-sm font-semibold text-slate-100">{label}</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
      </div>
    </label>
  );
}

function SuggestionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-3 py-1 text-xs text-cyan-100"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">No signals detected yet.</span>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [matches, setMatches] = useState<ProjectMatchResult[]>([]);
  const [shortlist, setShortlist] = useState<ProjectShortlistEntry[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [projectCompliance, setProjectCompliance] = useState<ProjectComplianceOverview | null>(
    null,
  );
  const [currentEligibility, setCurrentEligibility] = useState<EligibilityAssessment | null>(null);
  const [notifications, setNotifications] = useState<NotificationListResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [hasLoadedMatches, setHasLoadedMatches] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplyingSuggestions, setIsApplyingSuggestions] = useState(false);
  const [isRunningMatches, setIsRunningMatches] = useState(false);
  const [activeDocumentActionId, setActiveDocumentActionId] = useState<string | null>(null);
  const [extractingDocumentId, setExtractingDocumentId] = useState<string | null>(null);
  const [openedExtractedTextIds, setOpenedExtractedTextIds] = useState<string[]>([]);
  const [extractedTextByDocumentId, setExtractedTextByDocumentId] = useState<
    Record<string, ExtractedTextResponse>
  >({});
  const [invitationDrafts, setInvitationDrafts] = useState<Record<string, string>>({});
  const [escrowDrafts, setEscrowDrafts] = useState<Record<string, EscrowDraft>>({});
  const [milestoneDrafts, setMilestoneDrafts] = useState<Record<string, MilestoneDraft>>({});
  const [invoiceDrafts, setInvoiceDrafts] = useState<Record<string, InvoiceDraft>>({});
  const [disputeDrafts, setDisputeDrafts] = useState<Record<string, DisputeDraft>>({});
  const [disputeEventDrafts, setDisputeEventDrafts] = useState<Record<string, DisputeEventDraft>>({});
  const [workingProfileId, setWorkingProfileId] = useState<string | null>(null);
  const [workingProposalId, setWorkingProposalId] = useState<string | null>(null);
  const [workingContractId, setWorkingContractId] = useState<string | null>(null);
  const [workingInvoiceId, setWorkingInvoiceId] = useState<string | null>(null);
  const [workingPaymentId, setWorkingPaymentId] = useState<string | null>(null);
  const [workingDisputeId, setWorkingDisputeId] = useState<string | null>(null);
  const [workingNotificationId, setWorkingNotificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sourceTextDraft, setSourceTextDraft] = useState("");
  const [aiStatusDraft, setAiStatusDraft] = useState<AIInterpretationStatus>("PENDING");
  const [selectedAiDocumentIds, setSelectedAiDocumentIds] = useState<string[]>([]);
  const [applySelection, setApplySelection] = useState<ApplySelectionState>(
    createEmptyApplySelection(),
  );

  const taxonomyTotal = useMemo(() => {
    if (!project) {
      return 0;
    }

    return project.escoSkills.length + project.naceCodes.length + project.uniclassCodes.length;
  }, [project]);

  const aiPayload = useMemo(
    () => parseAIInterpretationPayload(project?.aiInterpretation?.extractedJson ?? null),
    [project],
  );

  const shortlistByProfileId = useMemo(
    () => new Map(shortlist.map((item) => [item.profileId, item])),
    [shortlist],
  );

  const invitationByProfileId = useMemo(
    () => new Map(invitations.map((item) => [item.profileId, item])),
    [invitations],
  );

  const contractByProposalId = useMemo(
    () => new Map(contracts.map((item) => [item.proposalId, item])),
    [contracts],
  );

  const currentUserId = useMemo(() => decodeJwtSub(token), [token]);

  const hasSelectedApplyChanges = useMemo(() => {
    return Boolean(
      applySelection.applySummary ||
        applySelection.applyEngagementModel ||
        applySelection.jobRequestIndexes.length ||
        applySelection.conditionIndexes.length ||
        applySelection.taxonomy.escoIds.length ||
        applySelection.taxonomy.naceIds.length ||
        applySelection.taxonomy.uniclassIds.length,
    );
  }, [applySelection]);

  const loadBusinessData = async (authToken: string) => {
    const [
      shortlistData,
      invitationData,
      proposalData,
      contractData,
      complianceData,
      eligibilityData,
      notificationsData,
      auditLogsData,
    ] =
      await Promise.all([
      safeRequest(
        apiRequest<ProjectShortlistEntry[]>(`/projects/${projectId}/shortlist`, {
          token: authToken,
        }),
        [],
      ),
      safeRequest(
        apiRequest<ProjectInvitation[]>(`/projects/${projectId}/invitations`, {
          token: authToken,
        }),
        [],
      ),
      safeRequest(
        apiRequest<ProjectProposal[]>(`/projects/${projectId}/proposals`, {
          token: authToken,
        }),
        [],
      ),
      safeRequest(
        apiRequest<ProjectContract[]>(`/projects/${projectId}/contracts`, {
          token: authToken,
        }),
        [],
      ),
      safeRequest(
        apiRequest<ProjectComplianceOverview>(`/projects/${projectId}/compliance`, {
          token: authToken,
        }),
        null,
      ),
      safeRequest(
        apiRequest<EligibilityAssessment>(`/projects/${projectId}/eligibility`, {
          token: authToken,
        }),
        null,
      ),
      apiRequest<NotificationListResponse>(`/notifications`, {
        token: authToken,
      }),
      safeRequest(
        apiRequest<AuditLogItem[]>(`/projects/${projectId}/audit-logs`, {
          token: authToken,
        }),
        [],
      ),
    ]);

    setShortlist(shortlistData);
    setInvitations(invitationData);
    setProposals(proposalData);
    setContracts(contractData);
    setProjectCompliance(complianceData);
    setCurrentEligibility(eligibilityData);
    setNotifications(notificationsData);
    setAuditLogs(auditLogsData);
    setEscrowDrafts(
      Object.fromEntries(
        contractData.map((contract) => [
          contract.id,
          {
            status: contract.escrow?.status ?? "NOT_FUNDED",
            currencyCode: contract.escrow?.currencyCode ?? "EUR",
            totalAmountCents: `${contract.escrow?.totalAmountCents ?? 0}`,
            fundedAmountCents: `${contract.escrow?.fundedAmountCents ?? 0}`,
            releasedAmountCents: `${contract.escrow?.releasedAmountCents ?? 0}`,
          },
        ]),
      ),
    );
    setInvoiceDrafts((current) => {
      const next = { ...current };
      for (const contract of contractData) {
        next[contract.id] =
          current[contract.id] ??
          emptyInvoiceDraft(
            contract.financialSnapshot?.currencyCode ??
              contract.escrow?.currencyCode ??
              contract.proposal.currencyCode ??
              "EUR",
          );
      }
      return next;
    });
    setDisputeDrafts((current) => {
      const next = { ...current };
      for (const contract of contractData) {
        next[contract.id] = current[contract.id] ?? emptyDisputeDraft();
      }
      return next;
    });
  };

  const loadWorkspace = async (authToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const projectResponse = await apiRequest<ProjectDetail>(`/projects/${projectId}`, {
        token: authToken,
      });

      setProject(projectResponse);
      setSourceTextDraft(projectResponse.aiInterpretation?.sourceText ?? "");
      setAiStatusDraft(projectResponse.aiInterpretation?.status ?? "PENDING");
      setSelectedAiDocumentIds(projectResponse.aiInterpretation?.documentIds ?? []);
      await loadBusinessData(authToken);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        logout();
        router.push(loginPathForCurrentLocation());
        return;
      }

      setError(
        requestError instanceof Error ? requestError.message : "Failed to load project detail.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push(loginPathForCurrentLocation());
      return;
    }

    loadWorkspace(token);
  }, [isReady, projectId, router, token]);

  useEffect(() => {
    setApplySelection(createEmptyApplySelection());
  }, [project?.aiInterpretation?.updatedAt]);

  const handleDocumentOpen = async (document: ProjectDocument, mode: "preview" | "download") => {
    if (!token) {
      return;
    }

    setActiveDocumentActionId(document.id);
    setError(null);

    try {
      const blob = await apiRequestBlob(`/projects/${document.projectId}/documents/${document.id}`, {
        token,
      });
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
      setError(downloadError instanceof Error ? downloadError.message : "Failed to access document.");
    } finally {
      setActiveDocumentActionId(null);
    }
  };

  const handleExtractText = async (document: ProjectDocument) => {
    if (!token) {
      return;
    }

    setExtractingDocumentId(document.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${document.projectId}/documents/${document.id}/extract`, {
        method: "POST",
        token,
      });
      const extracted = await apiRequest<ExtractedTextResponse>(
        `/projects/${document.projectId}/documents/${document.id}/extracted-text`,
        { token },
      );

      setExtractedTextByDocumentId((current) => ({
        ...current,
        [document.id]: extracted,
      }));
      setOpenedExtractedTextIds((current) =>
        current.includes(document.id) ? current : [...current, document.id],
      );
      setSuccessMessage(`Extraction completed for ${document.fileName}.`);
      await loadWorkspace(token);
    } catch (extractionError) {
      setError(
        extractionError instanceof Error ? extractionError.message : "Failed to extract document text.",
      );
      await loadWorkspace(token);
    } finally {
      setExtractingDocumentId(null);
    }
  };

  const handleToggleExtractedText = async (document: ProjectDocument) => {
    if (!token) {
      return;
    }

    if (openedExtractedTextIds.includes(document.id)) {
      setOpenedExtractedTextIds((current) => current.filter((id) => id !== document.id));
      return;
    }

    try {
      const extracted = await apiRequest<ExtractedTextResponse>(
        `/projects/${document.projectId}/documents/${document.id}/extracted-text`,
        { token },
      );
      setExtractedTextByDocumentId((current) => ({
        ...current,
        [document.id]: extracted,
      }));
      setOpenedExtractedTextIds((current) => [...current, document.id]);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : "Failed to load extracted text.");
    }
  };

  const handleAnalyzeProject = async () => {
    if (!token || !project) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/ai-interpretation`, {
        method: "PUT",
        token,
        body: {
          status: aiStatusDraft,
          sourceText: sourceTextDraft.trim() || undefined,
          documentIds: selectedAiDocumentIds,
          reviewNotes:
            selectedAiDocumentIds.length > 0
              ? "Prepared from selected project documents."
              : undefined,
        },
      });

      setSuccessMessage("AI interpretation v1 completed and stored.");
      await loadWorkspace(token);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Failed to analyze project.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarkNotificationRead = async (notification: NotificationItem) => {
    if (!token) {
      return;
    }

    setWorkingNotificationId(notification.id);
    setError(null);

    try {
      const updated = await apiRequest<NotificationItem>(`/notifications/${notification.id}/read`, {
        method: "PATCH",
        token,
      });
      setNotifications((current) =>
        current
          ? {
              unreadCount: Math.max(
                0,
                current.items.filter((item) => item.status !== "READ").length -
                  (notification.status === "READ" ? 0 : 1),
              ),
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current,
      );
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Failed to mark notification as read.",
      );
    } finally {
      setWorkingNotificationId(null);
    }
  };

  const handleRecomputeNotifications = async () => {
    if (!token) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest("/notifications/recompute-compliance-reminders", {
        method: "POST",
        token,
      });
      const refreshed = await apiRequest<NotificationListResponse>("/notifications", { token });
      setNotifications(refreshed);
      setSuccessMessage("Compliance reminders were recomputed.");
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : "Failed to recompute notifications.",
      );
    }
  };

  const handleApplySuggestions = async () => {
    if (!token || !project) {
      return;
    }

    setIsApplyingSuggestions(true);
    setError(null);
    setSuccessMessage(null);

    const payload: ApplyAISuggestionsPayload = {
      applySummary: applySelection.applySummary,
      applyEngagementModel: applySelection.applyEngagementModel,
      jobRequestIndexes: applySelection.jobRequestIndexes,
      conditionIndexes: applySelection.conditionIndexes,
      taxonomy: {
        escoIds: applySelection.taxonomy.escoIds,
        naceIds: applySelection.taxonomy.naceIds,
        uniclassIds: applySelection.taxonomy.uniclassIds,
      },
    };

    try {
      const updatedProject = await apiRequest<ProjectDetail>(
        `/projects/${project.id}/ai-interpretation/apply`,
        { method: "POST", token, body: payload },
      );

      setProject(updatedProject);
      await loadBusinessData(token);
      setSuccessMessage("Selected AI suggestions were applied to the project.");
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Failed to apply AI suggestions.");
    } finally {
      setIsApplyingSuggestions(false);
    }
  };

  const handleRunMatches = async () => {
    if (!token || !project) {
      return;
    }

    setIsRunningMatches(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const results = await apiRequest<ProjectMatchResult[]>(`/projects/${project.id}/matches`, {
        token,
      });
      setMatches(results);
      setHasLoadedMatches(true);
      setSuccessMessage("Match engine v1 completed.");
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "Failed to run match engine.");
    } finally {
      setIsRunningMatches(false);
    }
  };

  const handleShortlist = async (match: ProjectMatchResult) => {
    if (!token || !project) {
      return;
    }

    setWorkingProfileId(match.profileId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/shortlist`, {
        method: "POST",
        token,
        body: {
          profileId: match.profileId,
          matchScore: Math.round(match.score),
          notes: match.reasons.slice(0, 3).join(" | "),
        },
      });
      await loadBusinessData(token);
      setSuccessMessage(`${match.name} was added to the shortlist.`);
    } catch (shortlistError) {
      setError(shortlistError instanceof Error ? shortlistError.message : "Failed to shortlist profile.");
    } finally {
      setWorkingProfileId(null);
    }
  };

  const handleInvite = async (match: ProjectMatchResult) => {
    if (!token || !project) {
      return;
    }

    setWorkingProfileId(match.profileId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/invitations`, {
        method: "POST",
        token,
        body: {
          profileId: match.profileId,
          status: "SENT",
          message:
            invitationDrafts[match.profileId]?.trim() ||
            `Invitation to review and bid for ${project.name}.`,
        },
      });
      await loadBusinessData(token);
      setSuccessMessage(`${match.name} was invited to propose.`);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to invite profile.");
    } finally {
      setWorkingProfileId(null);
    }
  };

  const handleProposalStatusUpdate = async (
    proposalId: string,
    status: ProjectProposalStatus,
  ) => {
    if (!token || !project) {
      return;
    }

    setWorkingProposalId(proposalId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/proposals/${proposalId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadBusinessData(token);
      setSuccessMessage(`Proposal moved to ${status.replaceAll("_", " ")}.`);
    } catch (proposalError) {
      setError(proposalError instanceof Error ? proposalError.message : "Failed to update proposal.");
    } finally {
      setWorkingProposalId(null);
    }
  };

  const handleCreateContract = async (proposal: ProjectProposal) => {
    if (!token || !project) {
      return;
    }

    setWorkingProposalId(proposal.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/from-proposal/${proposal.id}`, {
        method: "POST",
        token,
        body: {},
      });
      await loadBusinessData(token);
      setSuccessMessage("Contract created from accepted proposal.");
    } catch (contractError) {
      setError(contractError instanceof Error ? contractError.message : "Failed to create contract.");
    } finally {
      setWorkingProposalId(null);
    }
  };

  const handleContractStatusUpdate = async (
    contractId: string,
    status: ProjectContractStatus,
  ) => {
    if (!token || !project) {
      return;
    }

    setWorkingContractId(contractId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadBusinessData(token);
      setSuccessMessage(`Contract moved to ${status.replaceAll("_", " ")}.`);
    } catch (contractError) {
      setError(contractError instanceof Error ? contractError.message : "Failed to update contract.");
    } finally {
      setWorkingContractId(null);
    }
  };

  const handleEscrowUpdate = async (contractId: string) => {
    if (!token || !project) {
      return;
    }

    const draft = escrowDrafts[contractId];
    if (!draft) {
      return;
    }

    setWorkingContractId(contractId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/escrow`, {
        method: "PATCH",
        token,
        body: {
          status: draft.status,
          currencyCode: draft.currencyCode,
          totalAmountCents: Number(draft.totalAmountCents || 0),
          fundedAmountCents: Number(draft.fundedAmountCents || 0),
          releasedAmountCents: Number(draft.releasedAmountCents || 0),
        },
      });
      await loadBusinessData(token);
      setSuccessMessage("Escrow tracking updated.");
    } catch (escrowError) {
      setError(escrowError instanceof Error ? escrowError.message : "Failed to update escrow.");
    } finally {
      setWorkingContractId(null);
    }
  };

  const handleGenerateFinancialSnapshot = async (contractId: string) => {
    if (!token || !project) {
      return;
    }

    setWorkingContractId(contractId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/financial-snapshot`, {
        method: "POST",
        token,
      });
      await loadBusinessData(token);
      setSuccessMessage("Financial snapshot generated.");
    } catch (snapshotError) {
      setError(
        snapshotError instanceof Error
          ? snapshotError.message
          : "Failed to generate financial snapshot.",
      );
    } finally {
      setWorkingContractId(null);
    }
  };

  const handleCreateInvoice = async (contract: ProjectContract) => {
    if (!token || !project) {
      return;
    }

    const draft = invoiceDrafts[contract.id] ?? emptyInvoiceDraft(contract.escrow?.currencyCode);
    if (!draft.amountCents) {
      setError("Invoice amount is required.");
      return;
    }

    setWorkingContractId(contract.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contract.id}/invoices`, {
        method: "POST",
        token,
        body: {
          milestoneId: draft.milestoneId || undefined,
          amountCents: Number(draft.amountCents || 0),
          currencyCode: draft.currencyCode || undefined,
          vatCents: draft.vatCents ? Number(draft.vatCents) : undefined,
          description: draft.description || undefined,
          dueDate: draft.dueDate || undefined,
        },
      });
      setInvoiceDrafts((current) => ({
        ...current,
        [contract.id]: emptyInvoiceDraft(
          contract.financialSnapshot?.currencyCode ??
            contract.escrow?.currencyCode ??
            contract.proposal.currencyCode ??
            "EUR",
        ),
      }));
      await loadBusinessData(token);
      setSuccessMessage("Invoice created.");
    } catch (invoiceError) {
      setError(invoiceError instanceof Error ? invoiceError.message : "Failed to create invoice.");
    } finally {
      setWorkingContractId(null);
    }
  };

  const handleInvoiceStatusUpdate = async (
    contractId: string,
    invoiceId: string,
    status: ProjectInvoiceStatus,
  ) => {
    if (!token || !project) {
      return;
    }

    setWorkingInvoiceId(invoiceId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/invoices/${invoiceId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadBusinessData(token);
      setSuccessMessage(`Invoice moved to ${status.replaceAll("_", " ")}.`);
    } catch (invoiceError) {
      setError(invoiceError instanceof Error ? invoiceError.message : "Failed to update invoice.");
    } finally {
      setWorkingInvoiceId(null);
    }
  };

  const handleRequestPayment = async (contractId: string, invoiceId: string) => {
    if (!token || !project) {
      return;
    }

    setWorkingInvoiceId(invoiceId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/payments/request`, {
        method: "POST",
        token,
        body: { invoiceId },
      });
      await loadBusinessData(token);
      setSuccessMessage("Payment request submitted.");
    } catch (paymentError) {
      setError(
        paymentError instanceof Error ? paymentError.message : "Failed to request payment.",
      );
    } finally {
      setWorkingInvoiceId(null);
    }
  };

  const handlePaymentStatusUpdate = async (
    paymentId: string,
    status: ProjectPaymentStatus,
  ) => {
    if (!token) {
      return;
    }

    setWorkingPaymentId(paymentId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/payments/${paymentId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadBusinessData(token);
      setSuccessMessage(`Payment moved to ${status.replaceAll("_", " ")}.`);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error ? paymentError.message : "Failed to update payment.",
      );
    } finally {
      setWorkingPaymentId(null);
    }
  };

  const handleCreateDispute = async (contractId: string) => {
    if (!token || !project) {
      return;
    }

    const draft = disputeDrafts[contractId] ?? emptyDisputeDraft();
    if (!draft.title.trim() || !draft.description.trim()) {
      setError("Dispute title and description are required.");
      return;
    }

    setWorkingContractId(contractId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/disputes`, {
        method: "POST",
        token,
        body: {
          type: draft.type,
          severity: draft.severity,
          title: draft.title,
          description: draft.description,
          milestoneId: draft.milestoneId || undefined,
          invoiceId: draft.invoiceId || undefined,
          paymentId: draft.paymentId || undefined,
        },
      });
      setDisputeDrafts((current) => ({
        ...current,
        [contractId]: emptyDisputeDraft(),
      }));
      await loadBusinessData(token);
      setSuccessMessage("Dispute opened.");
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Failed to open dispute.");
    } finally {
      setWorkingContractId(null);
    }
  };

  const handleDisputeStatusUpdate = async (
    contractId: string,
    disputeId: string,
    status: ProjectDisputeStatus,
  ) => {
    if (!token || !project) {
      return;
    }

    setWorkingDisputeId(disputeId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/disputes/${disputeId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadBusinessData(token);
      setSuccessMessage(`Dispute moved to ${status.replaceAll("_", " ")}.`);
    } catch (disputeError) {
      setError(disputeError instanceof Error ? disputeError.message : "Failed to update dispute.");
    } finally {
      setWorkingDisputeId(null);
    }
  };

  const handleAddDisputeEvent = async (contractId: string, disputeId: string) => {
    if (!token || !project) {
      return;
    }

    const draft = disputeEventDrafts[disputeId] ?? emptyDisputeEventDraft();
    if (!draft.message.trim()) {
      setError("Dispute event message is required.");
      return;
    }

    setWorkingDisputeId(disputeId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/disputes/${disputeId}/events`, {
        method: "POST",
        token,
        body: {
          type: draft.type,
          message: draft.message,
        },
      });
      setDisputeEventDrafts((current) => ({
        ...current,
        [disputeId]: emptyDisputeEventDraft(),
      }));
      await loadBusinessData(token);
      setSuccessMessage("Dispute event added.");
    } catch (eventError) {
      setError(eventError instanceof Error ? eventError.message : "Failed to add dispute event.");
    } finally {
      setWorkingDisputeId(null);
    }
  };

  const handleCreateMilestone = async (contractId: string) => {
    if (!token || !project) {
      return;
    }

    const draft = milestoneDrafts[contractId] ?? emptyMilestoneDraft();
    if (!draft.title.trim()) {
      setError("Milestone title is required.");
      return;
    }

    setWorkingContractId(contractId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${project.id}/contracts/${contractId}/milestones`, {
        method: "POST",
        token,
        body: {
          title: draft.title,
          description: draft.description || undefined,
          amountCents: Number(draft.amountCents || 0),
          dueDate: draft.dueDate || undefined,
        },
      });
      setMilestoneDrafts((current) => ({
        ...current,
        [contractId]: emptyMilestoneDraft(),
      }));
      await loadBusinessData(token);
      setSuccessMessage("Milestone created.");
    } catch (milestoneError) {
      setError(milestoneError instanceof Error ? milestoneError.message : "Failed to create milestone.");
    } finally {
      setWorkingContractId(null);
    }
  };

  const handleMilestoneStatusUpdate = async (
    contractId: string,
    milestoneId: string,
    status: ProjectMilestoneStatus,
  ) => {
    if (!token || !project) {
      return;
    }

    setWorkingContractId(contractId);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(
        `/projects/${project.id}/contracts/${contractId}/milestones/${milestoneId}/status`,
        {
          method: "PATCH",
          token,
          body: { status },
        },
      );
      await loadBusinessData(token);
      setSuccessMessage(`Milestone moved to ${status.replaceAll("_", " ")}.`);
    } catch (milestoneError) {
      setError(milestoneError instanceof Error ? milestoneError.message : "Failed to update milestone.");
    } finally {
      setWorkingContractId(null);
    }
  };

  const toggleNumberSelection = (key: "jobRequestIndexes" | "conditionIndexes", index: number) => {
    setApplySelection((current) => ({
      ...current,
      [key]: current[key].includes(index)
        ? current[key].filter((value) => value !== index)
        : [...current[key], index].sort((left, right) => left - right),
    }));
  };

  const toggleTaxonomySelection = (key: "escoIds" | "naceIds" | "uniclassIds", id: string) => {
    setApplySelection((current) => ({
      ...current,
      taxonomy: {
        ...current.taxonomy,
        [key]: current.taxonomy[key].includes(id)
          ? current.taxonomy[key].filter((value) => value !== id)
          : [...current.taxonomy[key], id],
      },
    }));
  };

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/projects"
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
          >
            Back to projects
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
            >
              My profile
            </Link>
            <Link
              href={`/projects/${projectId}/edit`}
              className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
            >
              Edit project
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-slate-300">
            Loading project detail...
          </div>
        ) : error || !project ? (
          <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-200">
            {error || "Project not found."}
          </div>
        ) : (
          <div className="space-y-6">
            {error ? (
              <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-200">
                      {project.engagementModel}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-slate-300">
                      {project.status.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                      {project.location || "Location pending"}
                    </span>
                  </div>

                  <h1 className="mt-5 text-4xl font-semibold">{project.name}</h1>
                  <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">
                    {project.summary ||
                      "No summary yet. Use AI interpretation or manual editing to refine this workspace."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Job Requests</div>
                    <div className="mt-2 text-3xl font-semibold">{project.counts.jobRequests}</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Clauses</div>
                    <div className="mt-2 text-3xl font-semibold">{project.counts.conditions}</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Documents</div>
                    <div className="mt-2 text-3xl font-semibold">{project.counts.documents}</div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Contracts</div>
                    <div className="mt-2 text-3xl font-semibold">{contracts.length}</div>
                  </div>
                </div>
              </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
              <div className="space-y-6">
                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Project Overview</div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                      <div className="text-sm font-semibold text-white">Owner</div>
                      <div className="mt-2 text-sm text-slate-300">{project.owner.email}</div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                      <div className="text-sm font-semibold text-white">Response Deadline</div>
                      <div className="mt-2 text-sm text-slate-300">{formatDate(project.responseDeadline)}</div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                      <div className="text-sm font-semibold text-white">Budget Range</div>
                      <div className="mt-2 text-sm text-slate-300">
                        {formatMoney(project.budgetMinCents, project.currencyCode)} to{" "}
                        {formatMoney(project.budgetMaxCents, project.currencyCode)}
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                      <div className="text-sm font-semibold text-white">Created</div>
                      <div className="mt-2 text-sm text-slate-300">{formatDate(project.createdAt)}</div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Job Requests</div>
                  <div className="mt-5 space-y-4">
                    {project.jobRequests.length > 0 ? (
                      project.jobRequests.map((jobRequest) => (
                        <div key={jobRequest.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-white">{jobRequest.title}</div>
                              <div className="mt-2 text-sm text-slate-400">
                                {jobRequest.status.replaceAll("_", " ")} · {jobRequest.workerCount ?? "?"} workers
                              </div>
                            </div>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                              {jobRequest.counts.conditions} clauses
                            </span>
                          </div>
                          {jobRequest.notes ? (
                            <p className="mt-4 text-sm leading-6 text-slate-300">{jobRequest.notes}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No job requests yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Conditions / Clauses</div>
                  <div className="mt-5 space-y-4">
                    {project.conditions.length > 0 ? (
                      project.conditions.map((condition) => (
                        <div key={condition.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                              {condition.type}
                            </span>
                            {condition.isMandatory ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
                                Mandatory
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-4 text-lg font-semibold text-white">{condition.title}</div>
                          <p className="mt-3 text-sm leading-6 text-slate-300">{condition.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No project clauses yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Documents</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Tender packs, drawings, specifications, and extracted text evidence.
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {project.documents.length} files
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {project.documents.length > 0 ? (
                      project.documents.map((document) => {
                        const extracted = extractedTextByDocumentId[document.id];
                        const isTextOpen = openedExtractedTextIds.includes(document.id);

                        return (
                          <div key={document.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                    {getDocumentBadge(document.type, document.mimeType)}
                                  </span>
                                  <span className={`rounded-full border px-3 py-1 text-xs ${getExtractionBadge(document.extractionStatus)}`}>
                                    {document.extractionStatus.replaceAll("_", " ")}
                                  </span>
                                </div>
                                <div className="mt-4 text-lg font-semibold text-white">{document.title}</div>
                                <div className="mt-2 text-sm text-slate-400">
                                  {document.fileName} · {formatBytes(document.sizeBytes)}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {canPreviewDocument(document.mimeType) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDocumentOpen(document, "preview")}
                                    disabled={activeDocumentActionId === document.id}
                                    className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                                  >
                                    Preview
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => handleDocumentOpen(document, "download")}
                                  disabled={activeDocumentActionId === document.id}
                                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                                >
                                  Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtractText(document)}
                                  disabled={extractingDocumentId === document.id || !canExtractDocument(document)}
                                  className="rounded-2xl border border-cyan-400/20 px-3 py-2 text-xs text-cyan-200 disabled:opacity-60"
                                >
                                  {extractingDocumentId === document.id ? "Extracting..." : "Extract Text"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleExtractedText(document)}
                                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
                                >
                                  {isTextOpen ? "Hide Text" : "View Text"}
                                </button>
                              </div>
                            </div>

                            {isTextOpen ? (
                              <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-slate-900/70 p-4">
                                {extracted?.extractedText ? (
                                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">
                                    {extracted.extractedText}
                                  </pre>
                                ) : (
                                  <div className="text-sm text-slate-400">
                                    No extracted text stored yet for this document.
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No documents uploaded yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Matches</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Run deterministic matching, then shortlist and invite promising profiles.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunMatches}
                      disabled={isRunningMatches}
                      className="rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {isRunningMatches ? "Running match engine..." : "Run Match Engine"}
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {hasLoadedMatches ? (
                      matches.length > 0 ? (
                        matches.map((match) => {
                          const shortlisted = shortlistByProfileId.get(match.profileId);
                          const invitation = invitationByProfileId.get(match.profileId);

                          return (
                            <div key={match.profileId} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-cyan-100">
                                      {match.profileType}
                                    </span>
                                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                      {match.documentCount} documents
                                    </span>
                                    <span
                                      className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                                        match.eligibility.projectEligibility,
                                      )}`}
                                    >
                                      {match.eligibility.projectEligibility.replaceAll("_", " ")}
                                    </span>
                                    {shortlisted ? (
                                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                                        Shortlisted
                                      </span>
                                    ) : null}
                                    {invitation ? (
                                      <span className={`rounded-full border px-3 py-1 text-xs ${getInvitationBadge(invitation.status)}`}>
                                        Invited: {invitation.status.replaceAll("_", " ")}
                                      </span>
                                    ) : null}
                                  </div>
                                  <h3 className="mt-4 text-xl font-semibold">{match.name}</h3>
                                </div>
                                <div className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center">
                                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Score</div>
                                  <div className="mt-2 text-3xl font-semibold text-emerald-100">{match.score}</div>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                                  <div className="text-sm font-semibold text-white">Reasons</div>
                                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                                    {match.reasons.length > 0 ? (
                                      match.reasons.map((reason) => <li key={reason}>- {reason}</li>)
                                    ) : (
                                      <li>No strong positive signals detected yet.</li>
                                    )}
                                  </ul>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                                  <div className="text-sm font-semibold text-white">Missing requirements</div>
                                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                                    {match.missingRequirements.length > 0 ? (
                                      match.missingRequirements.map((item) => <li key={item}>- {item}</li>)
                                    ) : (
                                      <li>No obvious gaps detected.</li>
                                    )}
                                  </ul>
                                </div>
                              </div>

                              {match.eligibility.blockingReasons.length > 0 || match.eligibility.missingItems.length > 0 ? (
                                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-100">
                                  {match.eligibility.blockingReasons.concat(match.eligibility.missingItems).map((item) => (
                                    <div key={item}>- {item}</div>
                                  ))}
                                </div>
                              ) : null}

                              <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <TaxonomyGroup title="ESCO overlap" prefix="ESCO" items={match.taxonomyOverlap.esco} />
                                <TaxonomyGroup title="NACE overlap" prefix="NACE" items={match.taxonomyOverlap.nace} />
                                <TaxonomyGroup title="UNICLASS overlap" prefix="UNICLASS" items={match.taxonomyOverlap.uniclass} />
                              </div>

                              <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_0.2fr]">
                                <textarea
                                  className="min-h-24 w-full rounded-[1.25rem] border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none"
                                  placeholder={`Invitation message for ${match.name}`}
                                  value={invitationDrafts[match.profileId] ?? ""}
                                  onChange={(event) =>
                                    setInvitationDrafts((current) => ({
                                      ...current,
                                      [match.profileId]: event.target.value,
                                    }))
                                  }
                                />
                                <div className="flex flex-col gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleShortlist(match)}
                                    disabled={workingProfileId === match.profileId}
                                    className="rounded-[1.25rem] border border-emerald-400/20 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-60"
                                  >
                                    {workingProfileId === match.profileId && !shortlisted
                                      ? "Saving..."
                                      : shortlisted
                                        ? "Shortlisted"
                                        : "Shortlist"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInvite(match)}
                                    disabled={
                                      workingProfileId === match.profileId || isIneligible(match.eligibility)
                                    }
                                    className="rounded-[1.25rem] bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                                  >
                                    {workingProfileId === match.profileId && !invitation
                                      ? "Sending..."
                                      : invitation
                                        ? "Update Invite"
                                        : "Invite"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                          No profiles matched yet.
                        </div>
                      )
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        Run Match Engine to evaluate available profiles against this project.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  {currentEligibility ? (
                    <div className="mb-6 rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                            Current Actor Eligibility
                          </div>
                          <div className="mt-2 text-sm text-slate-400">
                            Your own actor profile against this project and its enforcement rules.
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                            currentEligibility.projectEligibility,
                          )}`}
                        >
                          {currentEligibility.projectEligibility.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                          {currentEligibility.blockingReasons.length > 0 ? (
                            currentEligibility.blockingReasons.map((item) => <div key={item}>- {item}</div>)
                          ) : (
                            <div className="text-slate-400">No blocking reasons for the current actor.</div>
                          )}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                          {currentEligibility.missingItems.length > 0 ? (
                            currentEligibility.missingItems.map((item) => <div key={item}>- {item}</div>)
                          ) : (
                            <div className="text-slate-400">No missing compliance items for the current actor.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Shortlist</div>
                  <div className="mt-5 space-y-4">
                    {shortlist.length > 0 ? (
                      shortlist.map((entry) => (
                        <div key={entry.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-white">{entry.profile.displayName}</div>
                              <div className="mt-2 text-sm text-slate-400">
                                {entry.profile.profileType} · {entry.profile.counts.documents} documents
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                              Match score {entry.matchScore ?? "n/a"}
                            </span>
                          </div>
                          {entry.notes ? (
                            <p className="mt-3 text-sm leading-6 text-slate-300">{entry.notes}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No shortlisted profiles yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Invitations</div>
                  <div className="mt-5 space-y-4">
                    {invitations.length > 0 ? (
                      invitations.map((invitation) => (
                        <div key={invitation.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-white">{invitation.profile.displayName}</div>
                              <div className="mt-2 text-sm text-slate-400">
                                Sent {formatDate(invitation.sentAt)} · Responded {formatDate(invitation.respondedAt)}
                              </div>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs ${getInvitationBadge(invitation.status)}`}>
                              {invitation.status.replaceAll("_", " ")}
                            </span>
                          </div>
                          {invitation.message ? (
                            <p className="mt-3 text-sm leading-6 text-slate-300">{invitation.message}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No invitations sent yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Proposals</div>
                  <div className="mt-5 space-y-4">
                    {proposals.length > 0 ? (
                      proposals.map((proposal) => {
                        const contract = contractByProposalId.get(proposal.id);
                        return (
                          <div key={proposal.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="text-lg font-semibold text-white">{proposal.title}</div>
                                <div className="mt-2 text-sm text-slate-400">
                                  {proposal.profile.displayName} · {formatMoney(proposal.priceCents, proposal.currencyCode)}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`rounded-full border px-3 py-1 text-xs ${getProposalBadge(proposal.status)}`}>
                                  {proposal.status.replaceAll("_", " ")}
                                </span>
                                {contract ? (
                                  <span className={`rounded-full border px-3 py-1 text-xs ${getContractBadge(contract.status)}`}>
                                    Contract: {contract.status.replaceAll("_", " ")}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {proposal.message ? (
                              <p className="mt-4 text-sm leading-6 text-slate-300">{proposal.message}</p>
                            ) : null}

                            {proposal.terms ? (
                              <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300">
                                {proposal.terms}
                              </div>
                            ) : null}

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                                Start: {formatDate(proposal.estimatedStartDate)}
                              </div>
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                                End: {formatDate(proposal.estimatedEndDate)}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              {proposal.eligibility ? (
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                                    proposal.eligibility.projectEligibility,
                                  )}`}
                                >
                                  {proposal.eligibility.projectEligibility.replaceAll("_", " ")}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleProposalStatusUpdate(proposal.id, "UNDER_REVIEW")}
                                disabled={workingProposalId === proposal.id}
                                className="rounded-2xl border border-cyan-400/20 px-4 py-2 text-sm text-cyan-100 disabled:opacity-60"
                              >
                                Under Review
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProposalStatusUpdate(proposal.id, "ACCEPTED")}
                                disabled={
                                  workingProposalId === proposal.id || isIneligible(proposal.eligibility)
                                }
                                className="rounded-2xl border border-emerald-400/20 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProposalStatusUpdate(proposal.id, "REJECTED")}
                                disabled={workingProposalId === proposal.id}
                                className="rounded-2xl border border-rose-400/20 px-4 py-2 text-sm text-rose-100 disabled:opacity-60"
                              >
                                Reject
                              </button>
                              {proposal.status === "ACCEPTED" && !contract ? (
                                <button
                                  type="button"
                                  onClick={() => handleCreateContract(proposal)}
                                  disabled={
                                    workingProposalId === proposal.id || isIneligible(proposal.eligibility)
                                  }
                                  className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                                >
                                  {workingProposalId === proposal.id ? "Creating..." : "Create Contract"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No proposals submitted yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Contracts</div>
                  <div className="mt-5 space-y-5">
                    {contracts.length > 0 ? (
                      contracts.map((contract) => {
                        const escrowDraft = escrowDrafts[contract.id] ?? {
                          status: contract.escrow?.status ?? "NOT_FUNDED",
                          currencyCode: contract.escrow?.currencyCode ?? "EUR",
                          totalAmountCents: `${contract.escrow?.totalAmountCents ?? 0}`,
                          fundedAmountCents: `${contract.escrow?.fundedAmountCents ?? 0}`,
                          releasedAmountCents: `${contract.escrow?.releasedAmountCents ?? 0}`,
                        };
                        const milestoneDraft = milestoneDrafts[contract.id] ?? emptyMilestoneDraft();
                        const invoiceDraft =
                          invoiceDrafts[contract.id] ??
                          emptyInvoiceDraft(
                            contract.financialSnapshot?.currencyCode ??
                              contract.escrow?.currencyCode ??
                              contract.proposal.currencyCode,
                          );
                        const disputeDraft = disputeDrafts[contract.id] ?? emptyDisputeDraft();
                        const isContractProfileOwner = currentUserId === contract.profile.userId;

                        return (
                          <div key={contract.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="text-lg font-semibold text-white">{contract.title}</div>
                                <div className="mt-2 text-sm text-slate-400">
                                  {contract.profile.displayName} · {contract.contractType} · {formatMoney(contract.proposal.priceCents, contract.proposal.currencyCode)}
                                </div>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs ${getContractBadge(contract.status)}`}>
                                {contract.status.replaceAll("_", " ")}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                                <div className="text-sm font-semibold text-white">Scope Summary</div>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                  {contract.scopeSummary || "No scope summary recorded yet."}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4">
                                <div className="text-sm font-semibold text-white">Commercial Terms</div>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                  {contract.commercialTerms || "No commercial terms recorded yet."}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                                Start: {formatDate(contract.startDate)}
                              </div>
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                                End: {formatDate(contract.endDate)}
                              </div>
                              <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                                Milestones: {contract.milestones.length}
                              </div>
                            </div>

                            {token ? (
                              <div className="mt-5">
                                <ConversationThreadPanel
                                  token={token}
                                  title="Contract Chat"
                                  subtitle="Commercial, milestone, invoice, and execution coordination for this agreement."
                                  ensurePayload={{
                                    type: "CONTRACT",
                                    contractId: contract.id,
                                  }}
                                  emptyLabel="No contract messages yet."
                                  onError={setError}
                                  onSuccess={setSuccessMessage}
                                />
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <select
                                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none"
                                value={contract.status}
                                onChange={(event) =>
                                  handleContractStatusUpdate(contract.id, event.target.value as ProjectContractStatus)
                                }
                              >
                                {contractStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleGenerateFinancialSnapshot(contract.id)}
                                disabled={workingContractId === contract.id}
                                className="rounded-[1.25rem] border border-amber-300/20 px-5 py-3 text-sm font-semibold text-amber-100 disabled:opacity-60"
                              >
                                {workingContractId === contract.id
                                  ? "Working..."
                                  : "Generate Financial Snapshot"}
                              </button>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-white">Financial Snapshot</div>
                                <div className="text-xs text-slate-400">
                                  {contract.financialSnapshot
                                    ? `Generated ${formatDate(contract.financialSnapshot.createdAt)}`
                                    : "No calculation yet"}
                                </div>
                              </div>

                              {contract.financialSnapshot ? (
                                <div className="mt-4 space-y-4">
                                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                      Gross:{" "}
                                      {formatMoney(
                                        contract.financialSnapshot.grossAmountCents,
                                        contract.financialSnapshot.currencyCode,
                                      )}
                                    </div>
                                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                      VAT:{" "}
                                      {formatMoney(
                                        contract.financialSnapshot.vatAmountCents,
                                        contract.financialSnapshot.currencyCode,
                                      )}
                                    </div>
                                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                      Net:{" "}
                                      {formatMoney(
                                        contract.financialSnapshot.netAmountCents,
                                        contract.financialSnapshot.currencyCode,
                                      )}
                                    </div>
                                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                      Platform fee:{" "}
                                      {formatMoney(
                                        contract.financialSnapshot.platformFeeCents,
                                        contract.financialSnapshot.currencyCode,
                                      )}
                                    </div>
                                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                      Escrow required:{" "}
                                      {formatMoney(
                                        contract.financialSnapshot.escrowRequiredAmountCents,
                                        contract.financialSnapshot.currencyCode,
                                      )}
                                    </div>
                                  </div>

                                  {(contract.financialSnapshot.workerGrossPayCents !== null ||
                                    contract.financialSnapshot.workerNetPayCents !== null ||
                                    contract.financialSnapshot.employerCostCents !== null) && (
                                    <div className="grid gap-4 md:grid-cols-3">
                                      <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                        Worker gross:{" "}
                                        {formatMoney(
                                          contract.financialSnapshot.workerGrossPayCents,
                                          contract.financialSnapshot.currencyCode,
                                        )}
                                      </div>
                                      <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                        Worker net:{" "}
                                        {formatMoney(
                                          contract.financialSnapshot.workerNetPayCents,
                                          contract.financialSnapshot.currencyCode,
                                        )}
                                      </div>
                                      <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-sm text-slate-300">
                                        Employer cost:{" "}
                                        {formatMoney(
                                          contract.financialSnapshot.employerCostCents,
                                          contract.financialSnapshot.currencyCode,
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                      Calculation Assumptions
                                    </div>
                                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-cyan-100">
                                      {formatExtractedJson(
                                        contract.financialSnapshot.calculationJson,
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                                  Generate a deterministic financial snapshot for this contract to review VAT, platform fee, escrow target, and B2C worker cost assumptions.
                                </div>
                              )}
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-white">Escrow Tracking</div>
                                <span className={`rounded-full border px-3 py-1 text-xs ${getEscrowBadge(escrowDraft.status)}`}>
                                  {escrowDraft.status.replaceAll("_", " ")}
                                </span>
                              </div>
                              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Status</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={escrowDraft.status}
                                    onChange={(event) =>
                                      setEscrowDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...escrowDraft,
                                          status: event.target.value as ProjectEscrowStatus,
                                        },
                                      }))
                                    }
                                  >
                                    {escrowStatusOptions.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Currency</span>
                                  <input
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={escrowDraft.currencyCode}
                                    onChange={(event) =>
                                      setEscrowDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...escrowDraft,
                                          currencyCode: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Total cents</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={escrowDraft.totalAmountCents}
                                    onChange={(event) =>
                                      setEscrowDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...escrowDraft,
                                          totalAmountCents: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Funded cents</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={escrowDraft.fundedAmountCents}
                                    onChange={(event) =>
                                      setEscrowDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...escrowDraft,
                                          fundedAmountCents: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Released cents</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={escrowDraft.releasedAmountCents}
                                    onChange={(event) =>
                                      setEscrowDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...escrowDraft,
                                          releasedAmountCents: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEscrowUpdate(contract.id)}
                                disabled={workingContractId === contract.id}
                                className="mt-4 rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
                              >
                                {workingContractId === contract.id ? "Saving..." : "Save Escrow"}
                              </button>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">Invoices</div>
                                  <div className="mt-2 text-xs text-slate-400">
                                    Contractor billing records linked to milestones, VAT, and escrow release.
                                  </div>
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  {contract.invoices.length} invoices
                                </span>
                              </div>

                              <div className="mt-4 space-y-3">
                                {contract.invoices.length > 0 ? (
                                  contract.invoices.map((invoice) => {
                                    const hasPaymentRequest = contract.payments.some(
                                      (payment) => payment.invoiceId === invoice.id,
                                    );

                                    return (
                                      <div
                                        key={invoice.id}
                                        className="rounded-2xl border border-white/8 bg-slate-950/70 p-4"
                                      >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div>
                                            <div className="text-sm font-semibold text-white">
                                              {invoice.invoiceNumber}
                                            </div>
                                            <div className="mt-2 text-xs text-slate-400">
                                              {formatMoney(invoice.totalCents, invoice.currencyCode)} · Due{" "}
                                              {formatDate(invoice.dueDate)} · Issued {formatDate(invoice.issuedAt)}
                                            </div>
                                          </div>
                                          <span
                                            className={`rounded-full border px-3 py-1 text-xs ${getInvoiceBadge(
                                              invoice.status,
                                            )}`}
                                          >
                                            {invoice.status.replaceAll("_", " ")}
                                          </span>
                                        </div>
                                        <div className="mt-3 grid gap-3 md:grid-cols-4">
                                          <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                            Base: {formatMoney(invoice.amountCents, invoice.currencyCode)}
                                          </div>
                                          <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                            VAT: {formatMoney(invoice.vatCents, invoice.currencyCode)}
                                          </div>
                                          <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                            Total: {formatMoney(invoice.totalCents, invoice.currencyCode)}
                                          </div>
                                          <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                            Milestone: {invoice.milestone?.title || "General billing"}
                                          </div>
                                        </div>
                                        {invoice.description ? (
                                          <div className="mt-3 text-sm text-slate-300">{invoice.description}</div>
                                        ) : null}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {invoice.status === "DRAFT" ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleInvoiceStatusUpdate(contract.id, invoice.id, "ISSUED")
                                              }
                                              disabled={workingInvoiceId === invoice.id}
                                              className="rounded-2xl border border-cyan-400/20 px-3 py-2 text-xs text-cyan-100 disabled:opacity-60"
                                            >
                                              {workingInvoiceId === invoice.id ? "Working..." : "Issue invoice"}
                                            </button>
                                          ) : null}
                                          {invoice.status === "ISSUED" && !hasPaymentRequest ? (
                                            <button
                                              type="button"
                                              onClick={() => handleRequestPayment(contract.id, invoice.id)}
                                              disabled={workingInvoiceId === invoice.id}
                                              className="rounded-2xl border border-emerald-400/20 px-3 py-2 text-xs text-emerald-100 disabled:opacity-60"
                                            >
                                              {workingInvoiceId === invoice.id ? "Working..." : "Request payment"}
                                            </button>
                                          ) : null}
                                          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleInvoiceStatusUpdate(contract.id, invoice.id, "CANCELLED")
                                              }
                                              disabled={workingInvoiceId === invoice.id}
                                              className="rounded-2xl border border-rose-400/20 px-3 py-2 text-xs text-rose-100 disabled:opacity-60"
                                            >
                                              Cancel
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                                    No invoices created yet.
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Linked milestone</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={invoiceDraft.milestoneId}
                                    onChange={(event) =>
                                      setInvoiceDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...invoiceDraft,
                                          milestoneId: event.target.value,
                                        },
                                      }))
                                    }
                                  >
                                    <option value="">General contract invoice</option>
                                    {contract.milestones.map((milestone) => (
                                      <option key={milestone.id} value={milestone.id}>
                                        {milestone.title} · {formatMoney(milestone.amountCents, contract.escrow?.currencyCode ?? null)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Currency</span>
                                  <input
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={invoiceDraft.currencyCode}
                                    onChange={(event) =>
                                      setInvoiceDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...invoiceDraft,
                                          currencyCode: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Amount cents</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={invoiceDraft.amountCents}
                                    onChange={(event) =>
                                      setInvoiceDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...invoiceDraft,
                                          amountCents: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">VAT cents</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={invoiceDraft.vatCents}
                                    onChange={(event) =>
                                      setInvoiceDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...invoiceDraft,
                                          vatCents: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Description</span>
                                  <textarea
                                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={invoiceDraft.description}
                                    onChange={(event) =>
                                      setInvoiceDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...invoiceDraft,
                                          description: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Due date</span>
                                  <input
                                    type="date"
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={invoiceDraft.dueDate}
                                    onChange={(event) =>
                                      setInvoiceDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...invoiceDraft,
                                          dueDate: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCreateInvoice(contract)}
                                disabled={workingContractId === contract.id || !isContractProfileOwner}
                                className="mt-4 rounded-[1.25rem] border border-emerald-400/20 px-5 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-60"
                              >
                                {workingContractId === contract.id
                                  ? "Saving..."
                                  : isContractProfileOwner
                                    ? "Create Invoice"
                                    : "Invoice creation requires contract profile owner access"}
                              </button>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">Payments</div>
                                  <div className="mt-2 text-xs text-slate-400">
                                    Project owner approvals and escrow releases for issued invoices.
                                  </div>
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  {contract.payments.length} payments
                                </span>
                              </div>
                              <div className="mt-4 space-y-3">
                                {contract.payments.length > 0 ? (
                                  contract.payments.map((payment) => {
                                    const blockingDispute = contract.disputes.find(
                                      (dispute) =>
                                        (dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW") &&
                                        (dispute.paymentId === payment.id ||
                                          dispute.invoiceId === payment.invoiceId ||
                                          (!dispute.paymentId &&
                                            !dispute.invoiceId &&
                                            !dispute.milestoneId)),
                                    );

                                    return (
                                    <div key={payment.id} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                          <div className="text-sm font-semibold text-white">
                                            {payment.invoice?.invoiceNumber || "Payment"}
                                          </div>
                                          <div className="mt-2 text-xs text-slate-400">
                                            Requested {formatDate(payment.requestedAt)} · Amount{" "}
                                            {formatMoney(payment.amountCents, payment.currencyCode)}
                                          </div>
                                        </div>
                                        <span className={`rounded-full border px-3 py-1 text-xs ${getPaymentBadge(payment.status)}`}>
                                          {payment.status.replaceAll("_", " ")}
                                        </span>
                                      </div>
                                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                          Approved: {formatDate(payment.approvedAt)}
                                        </div>
                                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                          Released: {formatDate(payment.releasedAt)}
                                        </div>
                                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                                          Linked milestone: {payment.invoice?.milestoneId ? "Yes" : "No"}
                                        </div>
                                      </div>
                                      {blockingDispute ? (
                                        <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                                          Payment blocked by dispute: {blockingDispute.title} ({blockingDispute.status.replaceAll("_", " ")})
                                        </div>
                                      ) : null}
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {payment.status === "REQUESTED" ? (
                                          <button
                                            type="button"
                                            onClick={() => handlePaymentStatusUpdate(payment.id, "APPROVED")}
                                            disabled={workingPaymentId === payment.id}
                                            className="rounded-2xl border border-cyan-400/20 px-3 py-2 text-xs text-cyan-100 disabled:opacity-60"
                                          >
                                            {workingPaymentId === payment.id ? "Working..." : "Approve payment"}
                                          </button>
                                        ) : null}
                                        {payment.status === "APPROVED" ? (
                                          <button
                                            type="button"
                                            onClick={() => handlePaymentStatusUpdate(payment.id, "RELEASED")}
                                            disabled={workingPaymentId === payment.id}
                                            className="rounded-2xl border border-emerald-400/20 px-3 py-2 text-xs text-emerald-100 disabled:opacity-60"
                                          >
                                            {workingPaymentId === payment.id ? "Working..." : "Release payment"}
                                          </button>
                                        ) : null}
                                        {(payment.status === "REQUESTED" || payment.status === "APPROVED") ? (
                                          <button
                                            type="button"
                                            onClick={() => handlePaymentStatusUpdate(payment.id, "FAILED")}
                                            disabled={workingPaymentId === payment.id}
                                            className="rounded-2xl border border-rose-400/20 px-3 py-2 text-xs text-rose-100 disabled:opacity-60"
                                          >
                                            Mark failed
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>
                                  )})
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                                    No payment requests yet.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">Disputes</div>
                                  <div className="mt-2 text-xs text-slate-400">
                                    Quality, invoice, milestone, payment, and contract disputes linked to this agreement.
                                  </div>
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  {contract.disputes.length} disputes
                                </span>
                              </div>

                              <div className="mt-4 space-y-4">
                                {contract.disputes.length > 0 ? (
                                  contract.disputes.map((dispute) => {
                                    const eventDraft =
                                      disputeEventDrafts[dispute.id] ?? emptyDisputeEventDraft();

                                    return (
                                      <div
                                        key={dispute.id}
                                        className="rounded-2xl border border-white/8 bg-slate-950/70 p-4"
                                      >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div>
                                            <div className="text-sm font-semibold text-white">
                                              {dispute.title}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              <span className={`rounded-full border px-3 py-1 text-xs ${getDisputeBadge(dispute.status)}`}>
                                                {dispute.status.replaceAll("_", " ")}
                                              </span>
                                              <span className={`rounded-full border px-3 py-1 text-xs ${getDisputeSeverityBadge(dispute.severity)}`}>
                                                {dispute.severity}
                                              </span>
                                              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                                {dispute.type}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-slate-400">
                                            Opened {formatDate(dispute.createdAt)}
                                          </div>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-300">
                                          {dispute.description}
                                        </p>
                                        {dispute.resolutionNotes ? (
                                          <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                                            Resolution: {dispute.resolutionNotes}
                                          </div>
                                        ) : null}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {disputeStatusOptions.map((status) => (
                                            <button
                                              key={status}
                                              type="button"
                                              onClick={() =>
                                                handleDisputeStatusUpdate(contract.id, dispute.id, status)
                                              }
                                              disabled={workingDisputeId === dispute.id}
                                              className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                                            >
                                              {status}
                                            </button>
                                          ))}
                                        </div>
                                        <div className="mt-4 space-y-2">
                                          {dispute.events.map((event) => (
                                            <div
                                              key={event.id}
                                              className="rounded-2xl border border-white/8 bg-slate-900/60 p-3"
                                            >
                                              <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-white">
                                                  {event.type.replaceAll("_", " ")}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                  {event.actorUser?.email || "Actor"} · {formatDate(event.createdAt)}
                                                </span>
                                              </div>
                                              <div className="mt-2 text-sm text-slate-300">{event.message}</div>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr_auto]">
                                          <select
                                            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                            value={eventDraft.type}
                                            onChange={(event) =>
                                              setDisputeEventDrafts((current) => ({
                                                ...current,
                                                [dispute.id]: {
                                                  ...eventDraft,
                                                  type: event.target.value as "COMMENT" | "EVIDENCE_ADDED",
                                                },
                                              }))
                                            }
                                          >
                                            <option value="COMMENT">COMMENT</option>
                                            <option value="EVIDENCE_ADDED">EVIDENCE_ADDED</option>
                                          </select>
                                          <input
                                            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                            value={eventDraft.message}
                                            onChange={(event) =>
                                              setDisputeEventDrafts((current) => ({
                                                ...current,
                                                [dispute.id]: {
                                                  ...eventDraft,
                                                  message: event.target.value,
                                                },
                                              }))
                                            }
                                            placeholder="Add dispute comment or evidence note"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAddDisputeEvent(contract.id, dispute.id)}
                                            disabled={workingDisputeId === dispute.id}
                                            className="rounded-[1.25rem] border border-cyan-400/20 px-5 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-60"
                                          >
                                            {workingDisputeId === dispute.id ? "Saving..." : "Add Event"}
                                          </button>
                                        </div>
                                        {token ? (
                                          <div className="mt-5">
                                            <ConversationThreadPanel
                                              token={token}
                                              title="Dispute Chat"
                                              subtitle="Use this structured thread for dispute comments, clarifications, and resolution notes."
                                              ensurePayload={{
                                                type: "DISPUTE",
                                                disputeId: dispute.id,
                                              }}
                                              emptyLabel="No dispute messages yet."
                                              onError={setError}
                                              onSuccess={setSuccessMessage}
                                            />
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                                    No disputes opened yet.
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Type</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.type}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          type: event.target.value as ProjectDisputeType,
                                        },
                                      }))
                                    }
                                  >
                                    {disputeTypeOptions.map((type) => (
                                      <option key={type} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Severity</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.severity}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          severity: event.target.value as ProjectDisputeSeverity,
                                        },
                                      }))
                                    }
                                  >
                                    {disputeSeverityOptions.map((severity) => (
                                      <option key={severity} value={severity}>
                                        {severity}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Milestone link</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.milestoneId}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          milestoneId: event.target.value,
                                        },
                                      }))
                                    }
                                  >
                                    <option value="">No milestone link</option>
                                    {contract.milestones.map((milestone) => (
                                      <option key={milestone.id} value={milestone.id}>
                                        {milestone.title}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Invoice link</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.invoiceId}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          invoiceId: event.target.value,
                                        },
                                      }))
                                    }
                                  >
                                    <option value="">No invoice link</option>
                                    {contract.invoices.map((invoice) => (
                                      <option key={invoice.id} value={invoice.id}>
                                        {invoice.invoiceNumber}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Payment link</span>
                                  <select
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.paymentId}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          paymentId: event.target.value,
                                        },
                                      }))
                                    }
                                  >
                                    <option value="">No payment link</option>
                                    {contract.payments.map((payment) => (
                                      <option key={payment.id} value={payment.id}>
                                        {payment.invoice?.invoiceNumber || payment.id}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Title</span>
                                  <input
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.title}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          title: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Description</span>
                                  <textarea
                                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={disputeDraft.description}
                                    onChange={(event) =>
                                      setDisputeDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...disputeDraft,
                                          description: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCreateDispute(contract.id)}
                                disabled={workingContractId === contract.id}
                                className="mt-4 rounded-[1.25rem] border border-rose-400/20 px-5 py-3 text-sm font-semibold text-rose-100 disabled:opacity-60"
                              >
                                {workingContractId === contract.id ? "Saving..." : "Open Dispute"}
                              </button>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-5">
                              <div className="text-sm font-semibold text-white">Milestones</div>
                              <div className="mt-4 space-y-3">
                                {contract.milestones.length > 0 ? (
                                  contract.milestones.map((milestone) => {
                                    const blockingDispute = contract.disputes.find(
                                      (dispute) =>
                                        (dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW") &&
                                        (dispute.milestoneId === milestone.id ||
                                          (!dispute.paymentId &&
                                            !dispute.invoiceId &&
                                            !dispute.milestoneId)),
                                    );

                                    return (
                                    <div key={milestone.id} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <div className="text-sm font-semibold text-white">{milestone.title}</div>
                                          <div className="mt-2 text-xs text-slate-400">
                                            {formatMoney(milestone.amountCents, contract.escrow?.currencyCode ?? null)} · Due {formatDate(milestone.dueDate)}
                                          </div>
                                        </div>
                                        <span className={`rounded-full border px-3 py-1 text-xs ${getMilestoneBadge(milestone.status)}`}>
                                          {milestone.status.replaceAll("_", " ")}
                                        </span>
                                      </div>
                                      {milestone.description ? (
                                        <p className="mt-3 text-sm leading-6 text-slate-300">{milestone.description}</p>
                                      ) : null}
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {contract.invoices
                                          .filter((invoice) => invoice.milestoneId === milestone.id)
                                          .map((invoice) => (
                                            <span
                                              key={invoice.id}
                                              className={`rounded-full border px-3 py-1 text-xs ${getInvoiceBadge(
                                                invoice.status,
                                              )}`}
                                            >
                                              {invoice.invoiceNumber} · {invoice.status.replaceAll("_", " ")}
                                            </span>
                                          ))}
                                      </div>
                                      {blockingDispute ? (
                                        <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                                          Milestone blocked by dispute: {blockingDispute.title} ({blockingDispute.status.replaceAll("_", " ")})
                                        </div>
                                      ) : null}
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {milestoneStatusOptions.map((status) => (
                                          <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                              handleMilestoneStatusUpdate(contract.id, milestone.id, status)
                                            }
                                            disabled={workingContractId === contract.id}
                                            className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                                          >
                                            {status}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )})
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                                    No milestones yet.
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Milestone title</span>
                                  <input
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={milestoneDraft.title}
                                    onChange={(event) =>
                                      setMilestoneDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...milestoneDraft,
                                          title: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Amount cents</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={milestoneDraft.amountCents}
                                    onChange={(event) =>
                                      setMilestoneDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...milestoneDraft,
                                          amountCents: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs text-slate-400">Due date</span>
                                  <input
                                    type="date"
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={milestoneDraft.dueDate}
                                    onChange={(event) =>
                                      setMilestoneDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...milestoneDraft,
                                          dueDate: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <label className="block md:col-span-2">
                                  <span className="mb-2 block text-xs text-slate-400">Description</span>
                                  <textarea
                                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                                    value={milestoneDraft.description}
                                    onChange={(event) =>
                                      setMilestoneDrafts((current) => ({
                                        ...current,
                                        [contract.id]: {
                                          ...milestoneDraft,
                                          description: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCreateMilestone(contract.id)}
                                disabled={workingContractId === contract.id}
                                className="mt-4 rounded-[1.25rem] border border-emerald-400/20 px-5 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-60"
                              >
                                {workingContractId === contract.id ? "Saving..." : "Add Milestone"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No contracts yet. Accept a proposal, then create a contract.
                      </div>
                    )}
                  </div>
                </section>

                {token && project ? (
                  <ProjectWorkerAssignmentsPanel
                    token={token}
                    project={project}
                    currentUserId={currentUserId}
                    onError={setError}
                    onSuccess={setSuccessMessage}
                  />
                ) : null}

                {token && project ? (
                  <ProjectExecutionPanel
                    token={token}
                    project={project}
                    currentUserId={currentUserId}
                    onError={setError}
                    onSuccess={setSuccessMessage}
                  />
                ) : null}

                {token && project ? (
                  <ProjectTimesheetsPanel
                    token={token}
                    project={project}
                    currentUserId={currentUserId}
                    onError={setError}
                    onSuccess={setSuccessMessage}
                  />
                ) : null}

                {projectCompliance ? (
                  <ProjectComplianceOverviewPanel
                    overview={projectCompliance}
                    onRefresh={() => loadBusinessData(token ?? "")}
                  />
                ) : null}

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                        Audit Timeline
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        Contractual, compliance, and enforcement events recorded by the platform.
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {auditLogs.length} events
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {auditLogs.length > 0 ? (
                      auditLogs.slice(0, 12).map((log) => (
                        <div
                          key={log.id}
                          className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {log.action.replaceAll("_", " ")}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {log.entityType} · {log.actorUser.email} · {formatDate(log.createdAt)}
                              </div>
                            </div>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                              {log.entityType}
                            </span>
                          </div>
                          {log.metadataJson ? (
                            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-900/60 p-4 text-xs leading-6 text-slate-300">
                              {formatExtractedJson(log.metadataJson)}
                            </pre>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                        No audit events recorded for this project yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {token ? (
                  <ConversationThreadPanel
                    token={token}
                    title="Project Chat"
                    subtitle="Shared coordination thread for the owner, invited actors, contracted parties, and linked workers."
                    ensurePayload={{
                      type: "PROJECT",
                      projectId,
                    }}
                    emptyLabel="No project-wide messages yet."
                    onError={setError}
                    onSuccess={setSuccessMessage}
                  />
                ) : null}

                <NotificationPanel
                  title="Project Notifications"
                  notifications={notifications}
                  onMarkRead={handleMarkNotificationRead}
                  onRecompute={handleRecomputeNotifications}
                  workingId={workingNotificationId}
                />

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                        AI Interpretation v1
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        Local rules-based analysis for contractor-ready structure.
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${getExtractionBadge(project.aiInterpretation?.status ?? "PENDING")}`}>
                      {project.aiInterpretation?.status?.replaceAll("_", " ") ?? "PENDING"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">AI status</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={aiStatusDraft}
                        onChange={(event) => setAiStatusDraft(event.target.value as AIInterpretationStatus)}
                      >
                        {aiStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">AI source text</span>
                      <textarea
                        className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={sourceTextDraft}
                        onChange={(event) => setSourceTextDraft(event.target.value)}
                      />
                    </label>

                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                      <div className="text-sm font-semibold text-white">Use documents for AI analysis</div>
                      <div className="mt-4 space-y-3">
                        {project.documents.length > 0 ? (
                          project.documents.map((document) => (
                            <label key={document.id} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-900/60 p-3 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={selectedAiDocumentIds.includes(document.id)}
                                onChange={() =>
                                  setSelectedAiDocumentIds((current) =>
                                    current.includes(document.id)
                                      ? current.filter((id) => id !== document.id)
                                      : [...current, document.id],
                                  )
                                }
                              />
                              <span>
                                {document.title} · {document.fileName} · {document.extractionStatus.replaceAll("_", " ")}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No project documents available yet.</div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAnalyzeProject}
                      disabled={isAnalyzing}
                      className="w-full rounded-[1.25rem] bg-cyan-400 px-5 py-4 font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Project"}
                    </button>

                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="text-sm font-semibold text-white">Suggested summary</div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {aiPayload?.summary || "No summary suggestion yet."}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="text-sm font-semibold text-white">Detected engagement model</div>
                      <div className="mt-3 text-sm text-slate-300">
                        {aiPayload?.detectedEngagementModel || "UNKNOWN"}
                      </div>
                    </div>

                    {aiPayload ? (
                      <div className="space-y-4 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/5 p-5">
                        <div className="text-sm font-semibold text-emerald-100">
                          Apply selected suggestions into the real project
                        </div>

                        <div className="grid gap-3">
                          <ApplyCheckbox
                            checked={applySelection.applySummary}
                            label="Apply suggested summary"
                            description="Write the AI summary into the real project summary field."
                            onChange={() =>
                              setApplySelection((current) => ({
                                ...current,
                                applySummary: !current.applySummary,
                              }))
                            }
                          />
                          <ApplyCheckbox
                            checked={applySelection.applyEngagementModel}
                            label="Apply detected engagement model"
                            description="Update the project engagement badge to the AI-detected B2B / B2C / MIXED signal."
                            onChange={() =>
                              setApplySelection((current) => ({
                                ...current,
                                applyEngagementModel: !current.applyEngagementModel,
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                            <div className="text-sm font-semibold text-white">Suggested job requests</div>
                            <div className="mt-4 space-y-3">
                              {aiPayload.suggestedJobRequests?.length ? (
                                aiPayload.suggestedJobRequests.map((item, index) => (
                                  <ApplyCheckbox
                                    key={`${item.title}-${index}`}
                                    checked={applySelection.jobRequestIndexes.includes(index)}
                                    label={item.title}
                                    description={item.reason}
                                    onChange={() => toggleNumberSelection("jobRequestIndexes", index)}
                                  />
                                ))
                              ) : (
                                <div className="text-sm text-slate-400">No job request suggestions.</div>
                              )}
                            </div>
                          </div>

                          <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                            <div className="text-sm font-semibold text-white">Suggested conditions</div>
                            <div className="mt-4 space-y-3">
                              {aiPayload.suggestedConditions?.length ? (
                                aiPayload.suggestedConditions.map((item, index) => (
                                  <ApplyCheckbox
                                    key={`${item.title}-${index}`}
                                    checked={applySelection.conditionIndexes.includes(index)}
                                    label={`${item.type} · ${item.title}`}
                                    description={`${item.reason} ${item.content}`}
                                    onChange={() => toggleNumberSelection("conditionIndexes", index)}
                                  />
                                ))
                              ) : (
                                <div className="text-sm text-slate-400">No condition suggestions.</div>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4">
                            <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                              <div className="text-sm font-semibold text-white">ESCO suggestions</div>
                              <div className="mt-4 space-y-3">
                                {aiPayload.taxonomySuggestions?.esco?.length ? (
                                  aiPayload.taxonomySuggestions.esco.map((item) => (
                                    <ApplyCheckbox
                                      key={item.id}
                                      checked={applySelection.taxonomy.escoIds.includes(item.id)}
                                      label={`${item.code} - ${item.title}`}
                                      description={item.reason}
                                      onChange={() => toggleTaxonomySelection("escoIds", item.id)}
                                    />
                                  ))
                                ) : (
                                  <div className="text-sm text-slate-400">No ESCO suggestions.</div>
                                )}
                              </div>
                            </div>

                            <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                              <div className="text-sm font-semibold text-white">NACE suggestions</div>
                              <div className="mt-4 space-y-3">
                                {aiPayload.taxonomySuggestions?.nace?.length ? (
                                  aiPayload.taxonomySuggestions.nace.map((item) => (
                                    <ApplyCheckbox
                                      key={item.id}
                                      checked={applySelection.taxonomy.naceIds.includes(item.id)}
                                      label={`${item.code} - ${item.title}`}
                                      description={item.reason}
                                      onChange={() => toggleTaxonomySelection("naceIds", item.id)}
                                    />
                                  ))
                                ) : (
                                  <div className="text-sm text-slate-400">No NACE suggestions.</div>
                                )}
                              </div>
                            </div>

                            <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                              <div className="text-sm font-semibold text-white">UNICLASS suggestions</div>
                              <div className="mt-4 space-y-3">
                                {aiPayload.taxonomySuggestions?.uniclass?.length ? (
                                  aiPayload.taxonomySuggestions.uniclass.map((item) => (
                                    <ApplyCheckbox
                                      key={item.id}
                                      checked={applySelection.taxonomy.uniclassIds.includes(item.id)}
                                      label={`${item.code} - ${item.title}`}
                                      description={item.reason}
                                      onChange={() => toggleTaxonomySelection("uniclassIds", item.id)}
                                    />
                                  ))
                                ) : (
                                  <div className="text-sm text-slate-400">No UNICLASS suggestions.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplySuggestions}
                          disabled={isApplyingSuggestions || !hasSelectedApplyChanges}
                          className="w-full rounded-[1.25rem] bg-emerald-400 px-5 py-4 font-semibold text-slate-950 disabled:opacity-60"
                        >
                          {isApplyingSuggestions ? "Applying selected suggestions..." : "Apply selected AI suggestions"}
                        </button>
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-3">
                      <SuggestionList title="Risk Flags" items={aiPayload?.riskFlags ?? []} />
                      <SuggestionList title="Finance Flags" items={aiPayload?.financeFlags ?? []} />
                      <SuggestionList title="Compliance Flags" items={aiPayload?.complianceFlags ?? []} />
                    </div>

                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="text-sm font-semibold text-white">Source stats</div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                          Total characters: {aiPayload?.sourceStats?.totalCharacters ?? 0}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                          Source text chars: {aiPayload?.sourceStats?.sourceTextCharacters ?? 0}
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-4 text-sm text-slate-300">
                          Extracted doc chars: {aiPayload?.sourceStats?.extractedDocumentCharacters ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="text-sm text-slate-400">Structured JSON payload</div>
                      {formatExtractedJson(project.aiInterpretation?.extractedJson) ? (
                        <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-xs leading-6 text-cyan-100">
                          {formatExtractedJson(project.aiInterpretation?.extractedJson)}
                        </pre>
                      ) : (
                        <p className="mt-2 text-sm text-slate-300">No extracted JSON stored yet.</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Taxonomy Summary</div>
                  <div className="mt-5 space-y-4">
                    <TaxonomyGroup title="ESCO Skills" prefix="ESCO" items={project.escoSkills} />
                    <TaxonomyGroup title="NACE Codes" prefix="NACE" items={project.naceCodes} />
                    <TaxonomyGroup title="UNICLASS" prefix="UNICLASS" items={project.uniclassCodes} />
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
