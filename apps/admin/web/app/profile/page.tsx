"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DirectConversationsPanel } from "../../components/messaging/DirectConversationsPanel";
import { NotificationPanel } from "../../components/notifications/NotificationPanel";
import { ProfileComplianceWorkspacePanel } from "../../components/profile/ProfileComplianceWorkspace";
import { ProfileTimesheetsPanel } from "../../components/profile/ProfileTimesheetsPanel";
import { ProfileWorkerExecutionPanel } from "../../components/profile/ProfileWorkerExecutionPanel";
import { ProfileWorkerRosterPanel } from "../../components/profile/ProfileWorkerRosterPanel";
import { useAuth } from "../../context/AuthContext";
import { ApiError, apiRequest, apiRequestBlob } from "../../lib/api";
import {
  ProfileComplianceWorkspace,
  CountryOption,
  EligibilityAssessment,
  EngagementModel,
  NotificationItem,
  NotificationListResponse,
  ProfileAvailabilityStatus,
  ProfileDetail,
  ProfileDocument,
  ProfileDocumentType,
  ProfileProposalInbox,
  ProfileType,
  ProjectInvitation,
  ProjectProposal,
  TaxonomyOption,
  UpsertProfilePayload,
} from "../../lib/project-types";

const engagementOptions: EngagementModel[] = ["B2B", "B2C", "MIXED"];
const profileTypes: ProfileType[] = [
  "GENERAL_CONTRACTOR",
  "CONTRACTOR",
  "SUBCONTRACTOR",
  "PROFESSIONAL",
  "SUPERVISOR",
  "SPECIALIST",
  "CLINIC_DOCTOR",
  "TRAINER_EVALUATOR",
];
const availabilityOptions: ProfileAvailabilityStatus[] = ["AVAILABLE", "LIMITED", "UNAVAILABLE"];
const profileDocumentTypes: ProfileDocumentType[] = [
  "CV",
  "CERTIFICATION",
  "PORTFOLIO",
  "IMAGE",
  "VIDEO",
  "LICENSE",
  "OTHER",
];

type ExtractedTextResponse = {
  documentId: string;
  extractionStatus: string;
  extractionError: string | null;
  extractedAt: string | null;
  extractedText: string | null;
};

type LanguageOption = {
  id: string;
  code: string;
  name: string;
};

type FormState = {
  profileType: ProfileType;
  displayName: string;
  companyName: string;
  summary: string;
  description: string;
  countryId: string;
  regionId: string;
  cityId: string;
  supportedEngagementModels: EngagementModel[];
  certificationsText: string;
  availabilityStatus: ProfileAvailabilityStatus;
  rating: string;
  languageIds: string[];
  escoSkillIds: string[];
  naceIds: string[];
  uniclassIds: string[];
  contractorProfile: {
    tradeFocus: string;
    teamSize: string;
    serviceArea: string;
  };
  professionalProfile: {
    headline: string;
    yearsExperience: string;
    portfolioFocus: string;
  };
};

type ProposalDraft = {
  title: string;
  message: string;
  priceCents: string;
  currencyCode: string;
  estimatedStartDate: string;
  estimatedEndDate: string;
  terms: string;
};

const emptyProposalDraft: ProposalDraft = {
  title: "",
  message: "",
  priceCents: "",
  currencyCode: "EUR",
  estimatedStartDate: "",
  estimatedEndDate: "",
  terms: "",
};

const emptyFormState: FormState = {
  profileType: "CONTRACTOR",
  displayName: "",
  companyName: "",
  summary: "",
  description: "",
  countryId: "",
  regionId: "",
  cityId: "",
  supportedEngagementModels: ["B2B"],
  certificationsText: "",
  availabilityStatus: "AVAILABLE",
  rating: "",
  languageIds: [],
  escoSkillIds: [],
  naceIds: [],
  uniclassIds: [],
  contractorProfile: {
    tradeFocus: "",
    teamSize: "",
    serviceArea: "",
  },
  professionalProfile: {
    headline: "",
    yearsExperience: "",
    portfolioFocus: "",
  },
};

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
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

function formatMoney(priceCents: number | null, currencyCode: string | null) {
  if (priceCents === null || priceCents === undefined) {
    return "Not priced";
  }

  return `${currencyCode || "EUR"} ${(priceCents / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function canPreviewDocument(mimeType: string) {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

function canExtractDocument(document: ProfileDocument) {
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

function getProposalBadge(status: string) {
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

function isActionBlocked(eligibility: EligibilityAssessment | null | undefined) {
  return (
    eligibility?.projectEligibility === "NOT_ELIGIBLE" ||
    eligibility?.projectEligibility === "BLOCKED" ||
    eligibility?.jobRequestEligibility === "NOT_ELIGIBLE" ||
    eligibility?.jobRequestEligibility === "BLOCKED"
  );
}

function syncFormFromProfile(profile: ProfileDetail): FormState {
  return {
    profileType: profile.profileType,
    displayName: profile.displayName,
    companyName: profile.companyName ?? "",
    summary: profile.summary ?? "",
    description: profile.description ?? "",
    countryId: profile.geography.country?.id ?? "",
    regionId: profile.geography.region?.id ?? "",
    cityId: profile.geography.city?.id ?? "",
    supportedEngagementModels: profile.supportedEngagementModels,
    certificationsText: profile.certificationsText ?? "",
    availabilityStatus: profile.availabilityStatus,
    rating: profile.rating?.toString() ?? "",
    languageIds: profile.languages.map((item) => item.id),
    escoSkillIds: profile.escoSkills.map((item) => item.id),
    naceIds: profile.naceCodes.map((item) => item.id),
    uniclassIds: profile.uniclassCodes.map((item) => item.id),
    contractorProfile: {
      tradeFocus: profile.contractorProfile?.tradeFocus ?? "",
      teamSize: profile.contractorProfile?.teamSize?.toString() ?? "",
      serviceArea: profile.contractorProfile?.serviceArea ?? "",
    },
    professionalProfile: {
      headline: profile.professionalProfile?.headline ?? "",
      yearsExperience: profile.professionalProfile?.yearsExperience?.toString() ?? "",
      portfolioFocus: profile.professionalProfile?.portfolioFocus ?? "",
    },
  };
}

function usesProfessionalProfileType(profileType: ProfileType) {
  return [
    "PROFESSIONAL",
    "SUPERVISOR",
    "SPECIALIST",
    "CLINIC_DOCTOR",
    "TRAINER_EVALUATOR",
  ].includes(profileType);
}

export default function ProfilePage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [compliance, setCompliance] = useState<ProfileComplianceWorkspace | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityAssessment | null>(null);
  const [inbox, setInbox] = useState<ProfileProposalInbox | null>(null);
  const [notifications, setNotifications] = useState<NotificationListResponse | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [escoSkills, setEscoSkills] = useState<TaxonomyOption[]>([]);
  const [naceCodes, setNaceCodes] = useState<TaxonomyOption[]>([]);
  const [uniclassCodes, setUniclassCodes] = useState<TaxonomyOption[]>([]);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [workingInvitationId, setWorkingInvitationId] = useState<string | null>(null);
  const [workingProposalId, setWorkingProposalId] = useState<string | null>(null);
  const [workingNotificationId, setWorkingNotificationId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadType, setUploadType] = useState<ProfileDocumentType>("CV");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractingDocumentId, setExtractingDocumentId] = useState<string | null>(null);
  const [activeDocumentActionId, setActiveDocumentActionId] = useState<string | null>(null);
  const [openedExtractedTextIds, setOpenedExtractedTextIds] = useState<string[]>([]);
  const [extractedTextByDocumentId, setExtractedTextByDocumentId] = useState<
    Record<string, ExtractedTextResponse>
  >({});
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, ProposalDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.id === form.countryId) ?? null,
    [countries, form.countryId],
  );
  const selectedRegion = useMemo(
    () => selectedCountry?.regions.find((region) => region.id === form.regionId) ?? null,
    [form.regionId, selectedCountry],
  );

  const loadWorkspace = async (authToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        profileResponse,
        countriesResponse,
        languagesResponse,
        escoResponse,
        naceResponse,
        uniclassResponse,
        inboxResponse,
        notificationsResponse,
      ] = await Promise.all([
        apiRequest<ProfileDetail | null>("/profile", { token: authToken }),
        apiRequest<CountryOption[]>("/countries", { token: authToken }),
        apiRequest<LanguageOption[]>("/languages", { token: authToken }),
        apiRequest<TaxonomyOption[]>("/esco", { token: authToken }),
        apiRequest<TaxonomyOption[]>("/nace", { token: authToken }),
        apiRequest<TaxonomyOption[]>("/uniclass", { token: authToken }),
        apiRequest<ProfileProposalInbox>("/profile/proposals", { token: authToken }),
        apiRequest<NotificationListResponse>("/notifications", { token: authToken }),
      ]);

      const [complianceResponse, eligibilityResponse] = profileResponse
        ? await Promise.all([
            apiRequest<ProfileComplianceWorkspace>("/profile/compliance", {
              token: authToken,
            }),
            apiRequest<EligibilityAssessment>("/profile/eligibility", {
              token: authToken,
            }),
          ])
        : [null, null];

      setProfile(profileResponse);
      setCompliance(complianceResponse);
      setEligibility(eligibilityResponse);
      setInbox(inboxResponse);
      setNotifications(notificationsResponse);
      setCountries(countriesResponse);
      setLanguages(languagesResponse);
      setEscoSkills(escoResponse);
      setNaceCodes(naceResponse);
      setUniclassCodes(uniclassResponse);

      if (profileResponse) {
        setForm(syncFormFromProfile(profileResponse));
      }
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        logout();
        router.push("/login");
        return;
      }

      setError(
        requestError instanceof Error ? requestError.message : "Failed to load profile workspace.",
      );
    } finally {
      setIsLoading(false);
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
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Failed to mark notification as read.");
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

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    loadWorkspace(token);
  }, [isReady, router, token]);

  const toggleMultiSelect = (
    key:
      | "supportedEngagementModels"
      | "languageIds"
      | "escoSkillIds"
      | "naceIds"
      | "uniclassIds",
    value: string,
  ) => {
    setForm((current) => {
      const existing = current[key] as string[];
      return {
        ...current,
        [key]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
  };

  const handleSaveProfile = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload: UpsertProfilePayload = {
      profileType: form.profileType,
      displayName: form.displayName,
      companyName: form.companyName || null,
      summary: form.summary || null,
      description: form.description || null,
      countryId: form.countryId || null,
      regionId: form.regionId || null,
      cityId: form.cityId || null,
      supportedEngagementModels: form.supportedEngagementModels,
      certificationsText: form.certificationsText || null,
      availabilityStatus: form.availabilityStatus,
      rating: form.rating ? Number(form.rating) : null,
      languageIds: form.languageIds,
      escoSkillIds: form.escoSkillIds,
      naceIds: form.naceIds,
      uniclassIds: form.uniclassIds,
      contractorProfile:
        !usesProfessionalProfileType(form.profileType)
          ? {
              tradeFocus: form.contractorProfile.tradeFocus || undefined,
              teamSize: form.contractorProfile.teamSize
                ? Number(form.contractorProfile.teamSize)
                : undefined,
              serviceArea: form.contractorProfile.serviceArea || undefined,
            }
          : undefined,
      professionalProfile:
        usesProfessionalProfileType(form.profileType)
          ? {
              headline: form.professionalProfile.headline || undefined,
              yearsExperience: form.professionalProfile.yearsExperience
                ? Number(form.professionalProfile.yearsExperience)
                : undefined,
              portfolioFocus: form.professionalProfile.portfolioFocus || undefined,
            }
          : undefined,
    };

    try {
      const savedProfile = await apiRequest<ProfileDetail>("/profile", {
        method: "PUT",
        token,
        body: payload,
      });
      setProfile(savedProfile);
      setForm(syncFormFromProfile(savedProfile));
      setSuccessMessage("Profile workspace saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!token || !profile || !selectedFile) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadTitle || selectedFile.name);
    formData.append("description", uploadDescription);
    formData.append("type", uploadType);

    try {
      await apiRequest(`/profiles/${profile.id}/documents/upload`, {
        method: "POST",
        token,
        formData,
      });
      await loadWorkspace(token);
      setSelectedFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setUploadType("CV");
      setSuccessMessage("Profile document uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload profile document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentOpen = async (document: ProfileDocument, mode: "preview" | "download") => {
    if (!token) {
      return;
    }

    setActiveDocumentActionId(document.id);

    try {
      const blob = await apiRequestBlob(`/profiles/${document.profileId}/documents/${document.id}`, {
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
      setError(downloadError instanceof Error ? downloadError.message : "Failed to access profile document.");
    } finally {
      setActiveDocumentActionId(null);
    }
  };

  const handleExtractDocument = async (document: ProfileDocument) => {
    if (!token) {
      return;
    }

    setExtractingDocumentId(document.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/profiles/${document.profileId}/documents/${document.id}/extract`, {
        method: "POST",
        token,
      });

      const extracted = await apiRequest<ExtractedTextResponse>(
        `/profiles/${document.profileId}/documents/${document.id}/extracted-text`,
        { token },
      );

      setExtractedTextByDocumentId((current) => ({
        ...current,
        [document.id]: extracted,
      }));
      setOpenedExtractedTextIds((current) =>
        current.includes(document.id) ? current : [...current, document.id],
      );
      await loadWorkspace(token);
      setSuccessMessage(`Extraction completed for ${document.fileName}.`);
    } catch (extractError) {
      setError(extractError instanceof Error ? extractError.message : "Failed to extract profile document text.");
    } finally {
      setExtractingDocumentId(null);
    }
  };

  const handleToggleExtractedText = async (document: ProfileDocument) => {
    if (!token) {
      return;
    }

    const isOpen = openedExtractedTextIds.includes(document.id);

    if (isOpen) {
      setOpenedExtractedTextIds((current) => current.filter((item) => item !== document.id));
      return;
    }

    try {
      const extracted = await apiRequest<ExtractedTextResponse>(
        `/profiles/${document.profileId}/documents/${document.id}/extracted-text`,
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

  const handleDeleteDocument = async (document: ProfileDocument) => {
    if (!token) {
      return;
    }

    try {
      await apiRequest(`/profiles/${document.profileId}/documents/${document.id}`, {
        method: "DELETE",
        token,
      });
      await loadWorkspace(token);
      setSuccessMessage("Profile document removed.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove profile document.");
    }
  };

  const handleInvitationStatus = async (invitation: ProjectInvitation, status: "ACCEPTED" | "DECLINED") => {
    if (!token) {
      return;
    }

    setWorkingInvitationId(invitation.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${invitation.projectId}/invitations/${invitation.id}/status`, {
        method: "PATCH",
        token,
        body: {
          status,
        },
      });
      await loadWorkspace(token);
      setSuccessMessage(`Invitation marked as ${status.toLowerCase()}.`);
    } catch (invitationError) {
      setError(invitationError instanceof Error ? invitationError.message : "Failed to update invitation.");
    } finally {
      setWorkingInvitationId(null);
    }
  };

  const handleSubmitProposal = async (invitation: ProjectInvitation) => {
    if (!token) {
      return;
    }

    const draft = proposalDrafts[invitation.id] ?? emptyProposalDraft;

    if (!draft.title.trim()) {
      setError("Proposal title is required.");
      return;
    }

    setWorkingInvitationId(invitation.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${invitation.projectId}/proposals`, {
        method: "POST",
        token,
        body: {
          invitationId: invitation.id,
          title: draft.title,
          message: draft.message || undefined,
          priceCents: draft.priceCents ? Number(draft.priceCents) : undefined,
          currencyCode: draft.currencyCode || undefined,
          estimatedStartDate: draft.estimatedStartDate || undefined,
          estimatedEndDate: draft.estimatedEndDate || undefined,
          terms: draft.terms || undefined,
        },
      });
      await loadWorkspace(token);
      setProposalDrafts((current) => ({
        ...current,
        [invitation.id]: emptyProposalDraft,
      }));
      setSuccessMessage("Proposal submitted.");
    } catch (proposalError) {
      setError(proposalError instanceof Error ? proposalError.message : "Failed to submit proposal.");
    } finally {
      setWorkingInvitationId(null);
    }
  };

  const handleWithdrawProposal = async (proposal: ProjectProposal) => {
    if (!token) {
      return;
    }

    setWorkingProposalId(proposal.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiRequest(`/projects/${proposal.projectId}/proposals/${proposal.id}/status`, {
        method: "PATCH",
        token,
        body: {
          status: "WITHDRAWN",
        },
      });
      await loadWorkspace(token);
      setSuccessMessage("Proposal withdrawn.");
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : "Failed to withdraw proposal.");
    } finally {
      setWorkingProposalId(null);
    }
  };

  const findProposalForInvitation = (invitationId: string) =>
    inbox?.proposals.find((proposal) => proposal.invitationId === invitationId) ?? null;

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Profile Workspace</div>
              <h1 className="mt-3 text-4xl font-semibold">Contractor / professional readiness workspace</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Build a structured profile, attach proof documents, and respond to project invitations with clear proposals.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
              >
                Back to projects
              </Link>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-slate-300">
            Loading profile workspace...
          </div>
        ) : (
          <div className="mt-6 space-y-6">
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

            {eligibility ? (
              <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                      Eligibility
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      Compliance enforcement now controls whether this actor can accept invitations and submit proposals.
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                      eligibility.profileEligibility,
                    )}`}
                  >
                    {eligibility.profileEligibility.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                    <div className="text-sm font-semibold text-white">Blocking reasons</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      {eligibility.blockingReasons.length > 0 ? (
                        eligibility.blockingReasons.map((item) => <div key={item}>- {item}</div>)
                      ) : (
                        <div className="text-slate-400">No hard blockers right now.</div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                    <div className="text-sm font-semibold text-white">Warnings</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      {eligibility.warnings.length > 0 ? (
                        eligibility.warnings.map((item) => <div key={item}>- {item}</div>)
                      ) : (
                        <div className="text-slate-400">No active warnings.</div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                    <div className="text-sm font-semibold text-white">Fix required items</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      {eligibility.missingItems.length > 0 ? (
                        eligibility.missingItems.map((item) => <div key={item}>- {item}</div>)
                      ) : (
                        <div className="text-slate-400">This profile is currently complete enough to operate.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <NotificationPanel
              title="My Notifications"
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
              onRecompute={handleRecomputeNotifications}
              workingId={workingNotificationId}
            />

            {token ? (
              <DirectConversationsPanel
                token={token}
                onError={setError}
                onSuccess={setSuccessMessage}
              />
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Identity</div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Profile type</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.profileType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            profileType: event.target.value as ProfileType,
                          }))
                        }
                      >
                        {profileTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Availability</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.availabilityStatus}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            availabilityStatus: event.target.value as ProfileAvailabilityStatus,
                          }))
                        }
                      >
                        {availabilityOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Display name</span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.displayName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, displayName: event.target.value }))
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Company name</span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.companyName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, companyName: event.target.value }))
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm text-slate-300">Summary</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.summary}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, summary: event.target.value }))
                        }
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm text-slate-300">Description</span>
                      <textarea
                        className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, description: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Coverage</div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Country</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.countryId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            countryId: event.target.value,
                            regionId: "",
                            cityId: "",
                          }))
                        }
                      >
                        <option value="">Select country</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Region</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.regionId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            regionId: event.target.value,
                            cityId: "",
                          }))
                        }
                      >
                        <option value="">Select region</option>
                        {selectedCountry?.regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">City</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.cityId}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, cityId: event.target.value }))
                        }
                      >
                        <option value="">Select city</option>
                        {selectedRegion?.cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-slate-300">Rating placeholder</span>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                        value={form.rating}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, rating: event.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-semibold text-white">Supported engagement models</div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {engagementOptions.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={form.supportedEngagementModels.includes(option)}
                            onChange={() => toggleMultiSelect("supportedEngagementModels", option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="mt-5 block">
                    <span className="mb-2 block text-sm text-slate-300">Certifications / credentials</span>
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                      value={form.certificationsText}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, certificationsText: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                    Specialist Focus
                  </div>

                  {usesProfessionalProfileType(form.profileType) ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm text-slate-300">Headline</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={form.professionalProfile.headline}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              professionalProfile: {
                                ...current.professionalProfile,
                                headline: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Years experience</span>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={form.professionalProfile.yearsExperience}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              professionalProfile: {
                                ...current.professionalProfile,
                                yearsExperience: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Portfolio focus</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={form.professionalProfile.portfolioFocus}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              professionalProfile: {
                                ...current.professionalProfile,
                                portfolioFocus: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm text-slate-300">Trade focus</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={form.contractorProfile.tradeFocus}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              contractorProfile: {
                                ...current.contractorProfile,
                                tradeFocus: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Team size</span>
                        <input
                          type="number"
                          min={1}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={form.contractorProfile.teamSize}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              contractorProfile: {
                                ...current.contractorProfile,
                                teamSize: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Service area</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={form.contractorProfile.serviceArea}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              contractorProfile: {
                                ...current.contractorProfile,
                                serviceArea: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Languages</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {languages.map((language) => (
                      <label
                        key={language.id}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={form.languageIds.includes(language.id)}
                          onChange={() => toggleMultiSelect("languageIds", language.id)}
                        />
                        {language.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Taxonomy</div>
                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="text-sm font-semibold text-white">ESCO</div>
                      <div className="mt-3 max-h-44 space-y-2 overflow-auto">
                        {escoSkills.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/60 p-3 text-sm text-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={form.escoSkillIds.includes(item.id)}
                              onChange={() => toggleMultiSelect("escoSkillIds", item.id)}
                            />
                            <span>
                              {item.code} - {item.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-white">NACE</div>
                      <div className="mt-3 max-h-44 space-y-2 overflow-auto">
                        {naceCodes.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/60 p-3 text-sm text-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={form.naceIds.includes(item.id)}
                              onChange={() => toggleMultiSelect("naceIds", item.id)}
                            />
                            <span>
                              {item.code} - {item.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-white">UNICLASS</div>
                      <div className="mt-3 max-h-44 space-y-2 overflow-auto">
                        {uniclassCodes.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/60 p-3 text-sm text-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={form.uniclassIds.includes(item.id)}
                              onChange={() => toggleMultiSelect("uniclassIds", item.id)}
                            />
                            <span>
                              {item.code} - {item.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Profile Documents</div>
                      <div className="mt-2 text-sm text-slate-400">
                        Upload CVs, certifications, portfolios, media, and licenses for deterministic matching.
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {profile?.counts.documents ?? 0} docs
                    </span>
                  </div>

                  {profile ? (
                    <div className="mt-5 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm text-slate-300">Document title</span>
                          <input
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                            value={uploadTitle}
                            onChange={(event) => setUploadTitle(event.target.value)}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm text-slate-300">Document type</span>
                          <select
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                            value={uploadType}
                            onChange={(event) => setUploadType(event.target.value as ProfileDocumentType)}
                          >
                            {profileDocumentTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Description</span>
                        <textarea
                          className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          value={uploadDescription}
                          onChange={(event) => setUploadDescription(event.target.value)}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-300">Choose file</span>
                        <input
                          type="file"
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading || !selectedFile}
                        className="w-full rounded-[1.25rem] bg-cyan-400 px-5 py-4 font-semibold text-slate-950 disabled:opacity-60"
                      >
                        {isUploading ? "Uploading..." : "Upload profile document"}
                      </button>

                      <div className="space-y-3">
                        {profile.documents.length > 0 ? (
                          profile.documents.map((document) => {
                            const extracted = extractedTextByDocumentId[document.id];
                            const isTextOpen = openedExtractedTextIds.includes(document.id);

                            return (
                              <div key={document.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-white">{document.title}</div>
                                    <div className="mt-2 text-xs text-slate-400">
                                      {document.fileName} · {document.type} · {formatBytes(document.sizeBytes)}
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
                                      onClick={() => handleExtractDocument(document)}
                                      disabled={extractingDocumentId === document.id || !canExtractDocument(document)}
                                      className="rounded-2xl border border-cyan-400/20 px-3 py-2 text-xs text-cyan-200 disabled:opacity-60"
                                    >
                                      {extractingDocumentId === document.id ? "Extracting..." : "Extract Text"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument(document)}
                                      className="rounded-2xl border border-rose-400/20 px-3 py-2 text-xs text-rose-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                  <span
                                    className={`rounded-full border px-3 py-1 text-xs ${getExtractionBadge(
                                      document.extractionStatus,
                                    )}`}
                                  >
                                    {document.extractionStatus.replaceAll("_", " ")}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleExtractedText(document)}
                                    className="text-xs font-semibold text-cyan-200"
                                  >
                                    {isTextOpen ? "Hide Extracted Text" : "View Extracted Text"}
                                  </button>
                                </div>

                                {isTextOpen ? (
                                  <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-slate-900/70 p-4">
                                    {extracted?.extractedText ? (
                                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">
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
                            No profile documents yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                      Save your profile first, then upload evidence documents for matching.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {profile ? (
              <ProfileComplianceWorkspacePanel
                token={token ?? ""}
                profile={profile}
                compliance={compliance}
                escoSkills={escoSkills}
                onRefresh={() => loadWorkspace(token ?? "")}
                onError={setError}
                onSuccess={setSuccessMessage}
              />
            ) : null}

            {token ? (
              <ProfileWorkerRosterPanel
                token={token}
                escoSkills={escoSkills}
                onError={setError}
                onSuccess={setSuccessMessage}
              />
            ) : null}

            {token ? (
              <ProfileWorkerExecutionPanel
                token={token}
                onError={setError}
                onSuccess={setSuccessMessage}
              />
            ) : null}

            {token ? (
              <ProfileTimesheetsPanel
                token={token}
                onError={setError}
                onSuccess={setSuccessMessage}
              />
            ) : null}

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">My Invitations</div>
              <div className="mt-5 space-y-5">
                {inbox?.invitations.length ? (
                  inbox.invitations.map((invitation) => {
                    const linkedProposal = findProposalForInvitation(invitation.id);
                    const draft = proposalDrafts[invitation.id] ?? emptyProposalDraft;

                    return (
                      <div key={invitation.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="text-lg font-semibold text-white">{invitation.project.name}</div>
                            <div className="mt-2 text-sm text-slate-400">
                              {invitation.project.engagementModel} · {invitation.project.location || "Location pending"} · Sent {formatDate(invitation.sentAt)}
                            </div>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs ${getInvitationBadge(invitation.status)}`}>
                            {invitation.status.replaceAll("_", " ")}
                          </span>
                        </div>

                        {invitation.message ? (
                          <p className="mt-3 text-sm leading-6 text-slate-300">{invitation.message}</p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-3">
                          {invitation.eligibility ? (
                            <span
                              className={`rounded-full border px-3 py-1 text-xs ${getEligibilityBadge(
                                invitation.eligibility.projectEligibility,
                              )}`}
                            >
                              {invitation.eligibility.projectEligibility.replaceAll("_", " ")}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleInvitationStatus(invitation, "ACCEPTED")}
                            disabled={
                              workingInvitationId === invitation.id || isActionBlocked(invitation.eligibility)
                            }
                            className="rounded-2xl border border-emerald-400/20 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60"
                          >
                            Accept Invitation
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInvitationStatus(invitation, "DECLINED")}
                            disabled={workingInvitationId === invitation.id}
                            className="rounded-2xl border border-rose-400/20 px-4 py-2 text-sm text-rose-100 disabled:opacity-60"
                          >
                            Decline
                          </button>
                          <Link
                            href={`/projects/${invitation.projectId}`}
                            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
                          >
                            Project detail
                          </Link>
                        </div>

                        {linkedProposal ? (
                          <div className="mt-5 rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/5 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-white">
                                  Submitted proposal: {linkedProposal.title}
                                </div>
                                <div className="mt-2 text-sm text-slate-300">
                                  {formatMoney(linkedProposal.priceCents, linkedProposal.currencyCode)}
                                </div>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs ${getProposalBadge(linkedProposal.status)}`}>
                                {linkedProposal.status.replaceAll("_", " ")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-slate-900/60 p-4">
                            <div className="text-sm font-semibold text-white">Submit proposal / bid</div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <label className="block md:col-span-2">
                                <span className="mb-2 block text-sm text-slate-300">Proposal title</span>
                                <input
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.title}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        title: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Price cents</span>
                                <input
                                  type="number"
                                  min={0}
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.priceCents}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        priceCents: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Currency</span>
                                <input
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.currencyCode}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        currencyCode: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Estimated start</span>
                                <input
                                  type="date"
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.estimatedStartDate}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        estimatedStartDate: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                              <label className="block">
                                <span className="mb-2 block text-sm text-slate-300">Estimated end</span>
                                <input
                                  type="date"
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.estimatedEndDate}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        estimatedEndDate: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                              <label className="block md:col-span-2">
                                <span className="mb-2 block text-sm text-slate-300">Message</span>
                                <textarea
                                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.message}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        message: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                              <label className="block md:col-span-2">
                                <span className="mb-2 block text-sm text-slate-300">Terms</span>
                                <textarea
                                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
                                  value={draft.terms}
                                  onChange={(event) =>
                                    setProposalDrafts((current) => ({
                                      ...current,
                                      [invitation.id]: {
                                        ...draft,
                                        terms: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSubmitProposal(invitation)}
                              disabled={
                                workingInvitationId === invitation.id || isActionBlocked(invitation.eligibility)
                              }
                              className="mt-4 rounded-[1.25rem] bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
                            >
                              {workingInvitationId === invitation.id ? "Submitting..." : "Submit Proposal"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                    No invitations yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">My Proposals</div>
              <div className="mt-5 space-y-4">
                {inbox?.proposals.length ? (
                  inbox.proposals.map((proposal) => (
                    <div key={proposal.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold text-white">{proposal.title}</div>
                          <div className="mt-2 text-sm text-slate-400">
                            {proposal.project.name} · {formatMoney(proposal.priceCents, proposal.currencyCode)}
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs ${getProposalBadge(proposal.status)}`}>
                          {proposal.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      {proposal.message ? (
                        <p className="mt-4 text-sm leading-6 text-slate-300">{proposal.message}</p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/projects/${proposal.projectId}`}
                          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
                        >
                          Project detail
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleWithdrawProposal(proposal)}
                          disabled={workingProposalId === proposal.id || proposal.status === "WITHDRAWN"}
                          className="rounded-2xl border border-rose-400/20 px-4 py-2 text-sm text-rose-100 disabled:opacity-60"
                        >
                          {workingProposalId === proposal.id ? "Updating..." : "Withdraw"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                    No proposals submitted yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
