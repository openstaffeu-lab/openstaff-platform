import type {
  NotificationItem,
  NotificationListResponse,
  NotificationPreference,
} from "./project-types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.openstaff.eu"
    : "http://localhost:8080");

const AUTH_TOKEN_KEY = "openstaff_web_access_token";
const REFRESH_TOKEN_KEY = "openstaff_web_refresh_token";
const TWO_FACTOR_CHALLENGE_KEY = "openstaff_web_2fa_challenge";

type StructuredSuccessResponse<T> = {
  status: "ok";
  data: T;
  source?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  accountStatus: "LIVE" | "OFFLINE" | "SUSPENDED";
  displayName: string;
  actorType: string;
  onboardingStep: number;
  onboardingDone: boolean;
  profile: {
    id: string;
    slug: string;
    displayName: string;
    companyName: string | null;
    profileType: string;
    visibility: string;
    moderationStatus: string;
    status: string;
  } | null;
  subscription?: {
    planCode: "BASIC" | "BRONZE" | "GOLD" | "ENTERPRISE";
    planName: string;
    status: "ACTIVE" | "CANCELED" | "EXPIRED";
    startedAt: string;
    expiresAt: string | null;
    contactLimit: number;
    contactsUsed: number;
    features: Record<string, boolean>;
  } | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type AuthChallengeResponse = {
  challengeRequired: true;
  challengeId: string;
  purpose: "LOGIN";
  deliveryChannel: "EMAIL";
  maskedDestination: string;
  expiresInSeconds: number;
};

export type AuthFlowResponse = AuthResponse | AuthChallengeResponse;

export type TwoFactorStatus = {
  enabled: boolean;
  emailOtpEnabled: boolean;
  adminEnforced: boolean;
  lockedUntil: string | null;
  lastChallengeVerifiedAt: string | null;
  lastRecoveryCodesRegeneratedAt: string | null;
  recoveryCodesRemaining: number;
  failedAttemptCount: number;
};

export type SubscriptionPlan = {
  code: "BASIC" | "BRONZE" | "GOLD" | "ENTERPRISE";
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  contactLimit: number;
  features: Record<string, boolean>;
};

export type UpgradeRequest = {
  id: string;
  createdAt?: string;
  email: string;
  name: string | null;
  companyName: string | null;
  currentPlanCode: string | null;
  requestedPlanCode: "BRONZE" | "GOLD" | "ENTERPRISE";
  status: "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED" | "CLOSED";
  source: "PRICING" | "LIMIT_REACHED" | "CONTACT_SALES";
  message?: string;
};

export type CreateUpgradeRequestInput = {
  requestedPlanCode: "BRONZE" | "GOLD" | "ENTERPRISE";
  name?: string;
  email?: string;
  companyName?: string;
  phone?: string;
  message?: string;
  source?: "PRICING" | "LIMIT_REACHED" | "CONTACT_SALES";
};

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type OnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";

export type VerificationCaseSubjectType =
  | "IDENTITY_PROFILE"
  | "COMPANY_PROFILE";

export type VerificationCaseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_INFO";

export type VerificationDecisionType =
  | "SUBMIT"
  | "REQUEST_INFO"
  | "APPROVE"
  | "REJECT"
  | "REOPEN";

export type IdentityProfile = {
  id: string;
  publicSlug: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  language: string | null;
  timezone: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  verificationStatus: VerificationStatus;
  onboardingCompletedAt: string | null;
  profileCompletionPercent: number;
};

export type IdentityCompanyProfile = {
  id: string;
  companyName: string;
  legalName: string | null;
  registrationNumber: string | null;
  vatId: string | null;
  country: string | null;
  city: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  website: string | null;
  logoUrl: string | null;
  verificationStatus: VerificationStatus;
  onboardingCompletedAt: string | null;
};

export type OnboardingSession = {
  id: string;
  currentStep: string;
  completedSteps: string[];
  completionPercent: number;
  status: OnboardingStatus;
  startedAt: string;
  completedAt: string | null;
};

export type OnboardingMe = {
  identityProfile: IdentityProfile;
  companyProfile: IdentityCompanyProfile | null;
  onboardingSession: OnboardingSession;
  completionPercent: number;
  verificationStates: {
    identityProfile: VerificationStatus;
    companyProfile: VerificationStatus;
  };
  verificationSummary: {
    identityCase: VerificationCaseSummary | null;
    companyCase: VerificationCaseSummary | null;
    overallStatus: VerificationStatus;
  };
  legacyProfile: {
    id: string;
    slug: string;
    profileType: string;
  } | null;
};

export type VerificationCaseSummary = {
  id: string;
  subjectType: VerificationCaseSubjectType;
  status: VerificationCaseStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  latestNote: string | null;
  decisionCount: number;
  reviewedBy: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type VerificationMe = {
  identityProfile: {
    id: string;
    publicSlug: string;
    displayName: string;
    verificationStatus: VerificationStatus;
    profileCompletionPercent: number;
    onboardingCompletedAt: string | null;
  } | null;
  companyProfile: {
    id: string;
    companyName: string;
    legalName: string | null;
    country: string | null;
    city: string | null;
    verificationStatus: VerificationStatus;
    onboardingCompletedAt: string | null;
  } | null;
  identityCase: VerificationCaseSummary | null;
  companyCase: VerificationCaseSummary | null;
  availableEvidence: {
    profileDocuments: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: string;
    }>;
    actorDocuments: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      verifiedAt: string | null;
      expiresAt: string | null;
    }>;
    actorCertifications: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      verifiedAt: string | null;
      expiresAt: string | null;
    }>;
    medicalFitnessCertificates: Array<{
      id: string;
      title: string;
      category: string;
      status: string;
      fitnessDecision: string;
      verifiedAt: string | null;
      expiresAt: string | null;
    }>;
  };
};

export type RegistrationDefaults = {
  inferredFrom: string[];
  country: string;
  countryCode: string;
  language: string;
  currency: string;
  vatMode: "domestic" | "eu" | "international";
  timezone: string;
  city: string | null;
  phonePrefix: string;
  explanation: string;
};

export type CompanyLookupResult = {
  rawFiscalCode: string;
  normalizedFiscalCode: string;
  countryCode: string;
  provider: string;
  providerLabel: string;
  lookupTimestamp: string;
  verifiedSource: boolean;
  lookupStatus: "matched" | "manual_required" | "invalid" | "provider_unavailable";
  verificationStatus: "unverified" | "provider_matched";
  explanation: string;
  lookupMetadata?: Record<string, unknown> | null;
  company: {
    companyName: string | null;
    legalName: string | null;
    registrationNumber: string | null;
    vatId: string | null;
    country: string | null;
    city: string | null;
    addressLine1: string | null;
    postalCode: string | null;
    vatPayer: boolean | null;
    vatMode: string | null;
    legalStatus?: string | null;
  };
};

export type ReluProfileResults = {
  sourceType: string;
  sourceId: string;
  runs: Array<Record<string, unknown>>;
  classifications: Array<{
    id: string;
    explanation: string | null;
    score: number | null;
    outputData: {
      escoCandidates?: Array<{ code: string; label: string; confidence?: number }>;
      naceCandidates?: Array<{ code: string; label: string; confidence?: number }>;
      uniclassCandidates?: Array<{ code: string; label: string; confidence?: number }>;
      missingInformation?: string[];
      extractedRequirements?: string[];
    } & Record<string, unknown>;
  }>;
  matches: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
};

export type SubmitVerificationCaseInput = {
  note?: string;
  profileDocumentIds?: string[];
  actorDocumentIds?: string[];
  actorCertificationIds?: string[];
  medicalFitnessCertificateIds?: string[];
};

export type WorkforceAssignmentStatus = "PENDING" | "ACTIVE" | "ENDED";
export type WorkforceContractLifecycleStatus =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "COMPLETED";

export type OperationalTimesheetStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type OperationalAttendanceStatus =
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "MISSED";

export type OperationalWorkSessionSource = "MANUAL" | "SYSTEM" | "MOBILE";

export type MyWorkforceAssignment = {
  id: string;
  status: WorkforceAssignmentStatus;
  assignedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  contractStatus: WorkforceContractLifecycleStatus;
  lifecycleState: WorkforceContractLifecycleStatus;
  activeProjects: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  job: {
    id: string;
    title: string;
    status: string;
  };
  contract: {
    id: string;
    lifecycleStatus: WorkforceContractLifecycleStatus;
    status: string;
    startDate: string | null;
    endDate: string | null;
  };
};

export type OperationalTimesheet = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  overtimeHours: number;
  status: OperationalTimesheetStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  assignment: {
    id: string;
    status: WorkforceAssignmentStatus;
    assignedAt: string;
    startedAt: string | null;
    endedAt: string | null;
  };
  contract: {
    id: string;
    lifecycleStatus: WorkforceContractLifecycleStatus;
    status: string;
  };
  job: {
    id: string;
    title: string;
    status: string;
  };
  entries: Array<{
    id: string;
    workDate: string;
    hoursWorked: number;
    overtimeHours: number;
    notes: string | null;
    createdAt: string;
  }>;
  approvedByUser: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type OperationalAttendanceRecord = {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: OperationalAttendanceStatus;
  source: OperationalWorkSessionSource;
  locationMetadata: unknown;
  createdAt: string;
  updatedAt: string;
  durationHours: number | null;
  assignment: {
    id: string;
    status: WorkforceAssignmentStatus;
  };
  contract: {
    id: string;
    lifecycleStatus: WorkforceContractLifecycleStatus;
  };
  job: {
    id: string;
    title: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type UpsertIdentityProfileInput = {
  publicSlug?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  country?: string;
  city?: string;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
};

export type UpsertCompanyProfileInput = {
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  vatId?: string;
  country?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  website?: string;
  logoUrl?: string;
};

export type UpdateOnboardingStepInput = {
  currentStep?: string;
  completedStep?: string;
  completedSteps?: string[];
  status?: OnboardingStatus;
  completionPercent?: number;
};

export type PublicIdentityProfile = {
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  language: string | null;
  timezone: string | null;
  country: string | null;
  city: string | null;
  links: {
    website: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
  };
  companySummary: {
    companyName: string;
    legalName: string | null;
    website: string | null;
    country: string | null;
    city: string | null;
    verificationStatus: VerificationStatus;
  } | null;
  publicIndicators: {
    verificationStatus: VerificationStatus;
    onboardingCompleted: boolean;
    profileCompletionPercent: number;
    verificationCaseStatus: VerificationCaseStatus | null;
  };
};

export type PublicProfile = {
  id: string;
  slug: string;
  profileType: string;
  displayName: string;
  companyName: string | null;
  publicHeadline: string | null;
  summary: string | null;
  description: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  visibility: string;
  moderationStatus: string;
  status: string;
  availabilityStatus: string;
  geography: {
    country: { id: string; code?: string | null; name: string } | null;
    region: { id: string; name: string } | null;
    city: { id: string; name: string } | null;
  };
  languages: Array<{ id: string; code: string; name: string }>;
  escoSkills: Array<{ id: string; code: string; title: string; description?: string | null }>;
  naceCodes: Array<{ id: string; code: string; title: string; description?: string | null }>;
  uniclassCodes: Array<{ id: string; code: string; title: string; description?: string | null }>;
  contractorProfile: {
    tradeFocus: string | null;
    teamSize: number | null;
    serviceArea: string | null;
  } | null;
  professionalProfile: {
    headline: string | null;
    yearsExperience: number | null;
    portfolioFocus: string | null;
  } | null;
  assets: {
    logoUrl: string | null;
    photoUrl: string | null;
    bannerUrl: string | null;
    portfolioUrls: string[];
  };
  trust?: {
    status: "PENDING_REVIEW" | "VERIFIED" | "APPROVED" | "SUSPENDED" | "REJECTED";
    verificationStatus: VerificationStatus;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type PublicCompanyProfile = PublicProfile & {
  companyPage: {
    seo: {
      title: string;
      description: string;
    };
    bannerUrl: string | null;
    logoUrl: string | null;
    gallery: string[];
    projects: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      description: string;
      domain: string;
      location: string;
      value: string;
      status: string;
      bannerUrl: string | null;
      taxonomy: {
        escoCodes: string[];
        naceCodes: string[];
        uniclassCodes: string[];
      };
      media: Array<{
        id: string;
        url: string;
        type: string;
        role: string;
        alt: string | null;
      }>;
      documents: Array<{
        id: string;
        title: string;
        fileName: string;
        mimeType: string;
        downloadUrl: string;
      }>;
    }>;
    certifications: string[];
    taxonomy: {
      esco: PublicProfile["escoSkills"];
      nace: PublicProfile["naceCodes"];
      uniclass: PublicProfile["uniclassCodes"];
    };
    aiSummary: {
      text: string;
      sourceResultId: string | null;
      status: string | null;
      score: number | null;
      fallbackUsed: boolean;
    };
    contactCta: {
      email: string | null;
      phone: string | null;
      website: string | null;
    };
    moderation: {
      visibility: string;
      moderationStatus: string;
      lifecycleStatus: string;
      rule: string;
    };
  };
};

export type MarketplacePostType =
  | "PROJECT"
  | "PROFESSIONAL"
  | "SUBCONTRACTOR_POOL";

export type MarketplacePost = {
  id: string;
  slug?: string;
  type: MarketplacePostType;
  title: string;
  description: string;
  summary?: string | null;
  domain: string;
  location: string;
  status: string;
  moderationStatus?: string;
  visibility?: string;
  value: string;
  currencyCode?: string | null;
  vatRate?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  ownerName: string;
  ownerType: string;
  bannerUrl?: string | null;
  experienceLabel?: string | null;
  certifications?: string;
  certificationsOffered?: string | null;
  escoCodes?: string[];
  naceCodes?: string[];
  uniclassCodes?: string[];
  languageCodes?: string[];
  classificationJson?: Record<string, unknown>;
  fiscalMetadataJson?: Record<string, unknown>;
  country?: { id: string; name: string; code?: string | null } | null;
  region?: { id: string; name: string } | null;
  city?: { id: string; name: string } | null;
  media?: Array<{
    id: string;
    url: string;
    type: string;
    role?: string;
    alt?: string | null;
    status?: string;
  }>;
  mediaAssets?: Array<{
    id: string;
    url: string;
    type: string;
    role?: string;
    alt?: string | null;
    status?: string;
    assetUrl: string;
  }>;
  documents?: Array<{
    id: string;
    title: string;
    description?: string | null;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    status?: string;
    downloadUrl: string;
  }>;
  externalLinks?: Array<{
    id: string;
    url: string;
    normalizedUrl?: string;
    securityStatus?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  formData?: FormData;
  token?: string | null;
  headers?: Record<string, string>;
};

type FunnelEventType =
  | "LANDING_PAGE_VISIT"
  | "REGISTER_STARTED"
  | "PUBLISH_STARTED";

type OperationalFeedbackType =
  | "ONBOARDING_FRICTION"
  | "MODERATION_CONFUSION"
  | "BILLING_CONFUSION"
  | "SUPPORT_PAIN_POINT"
  | "FAILED_FLOW"
  | "OPERATOR_ESCALATION"
  | "REPEATED_USER_CONFUSION";

export function getApiUrl() {
  return API_URL;
}

export function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_URL}${path}`;
  }

  return `${API_URL}/${path}`;
}

export function resolveAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  return buildApiUrl(path);
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function setStoredRefreshToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(TWO_FACTOR_CHALLENGE_KEY);
}

export function getAuthToken() {
  return getStoredToken();
}

export function getRefreshToken() {
  return getStoredRefreshToken();
}

function sessionDedupeKey(key: string) {
  return `openstaff_rollout_event:${key}`;
}

export async function trackRolloutFunnelEvent(input: {
  eventType: FunnelEventType;
  surface: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  if (input.dedupeKey) {
    const existing = window.sessionStorage.getItem(sessionDedupeKey(input.dedupeKey));
    if (existing) {
      return;
    }
    window.sessionStorage.setItem(sessionDedupeKey(input.dedupeKey), "1");
  }

  const payload = JSON.stringify(input);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(`${API_URL}/ops/funnel-events`, blob);
      return;
    }

    await fetch(`${API_URL}/ops/funnel-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // Funnel visibility must stay non-blocking for the user flow.
  }
}

export async function submitOperationalFeedback(input: {
  feedbackType: OperationalFeedbackType;
  surface: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await fetch(`${API_URL}/ops/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
      body: JSON.stringify(input),
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // Operational feedback should never block the primary user action.
  }
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  const message =
    typeof payload === "string"
      ? payload
      : payload?.message
        ? Array.isArray(payload.message)
          ? payload.message.join(", ")
          : payload.message
        : "Request failed";

  throw new ApiError(message, response.status);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    ...(options.formData ? { body: options.formData } : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (
    typeof payload === "object" &&
    payload !== null &&
    "status" in payload &&
    (payload as { status?: unknown }).status === "ok" &&
    "data" in payload
  ) {
    return (payload as StructuredSuccessResponse<T>).data;
  }

  return payload as T;
}

async function apiRequestWithRefresh<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const resolvedToken = options.token ?? getAuthToken();
  const storedRefreshToken = getRefreshToken();

  if (!resolvedToken) {
    if (!storedRefreshToken) {
      throw new ApiError("Authentication required", 401);
    }

    const authResponse = await refreshAuthToken(storedRefreshToken);
    setStoredToken(authResponse.accessToken);
    setStoredRefreshToken(authResponse.refreshToken);

    return apiRequest<T>(endpoint, {
      ...options,
      token: authResponse.accessToken,
    });
  }

  try {
    return await apiRequest<T>(endpoint, {
      ...options,
      token: resolvedToken,
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    if (!storedRefreshToken) {
      clearStoredToken();
      throw error;
    }

    const authResponse = await refreshAuthToken(storedRefreshToken);
    setStoredToken(authResponse.accessToken);
    setStoredRefreshToken(authResponse.refreshToken);

    return apiRequest<T>(endpoint, {
      ...options,
      token: authResponse.accessToken,
    });
  }
}

export async function apiRequestBlob(
  endpoint: string,
  options: Omit<RequestOptions, "body"> = {},
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.formData ? { body: options.formData } : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response);
  }

  return response.blob();
}

export async function registerAccount(payload: {
  email: string;
  password: string;
  displayName: string;
  actorType: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginAccount(payload: {
  email: string;
  password: string;
}) {
  return apiRequest<AuthFlowResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getTwoFactorStatus(token?: string | null) {
  return apiRequestWithRefresh<TwoFactorStatus>("/auth/2fa/status", {
    token,
  });
}

export async function setupTwoFactor(token?: string | null) {
  return apiRequestWithRefresh<{
    success: boolean;
    challengeId: string;
    deliveryChannel: "EMAIL";
    maskedDestination: string;
    expiresInSeconds: number;
  }>("/auth/2fa/setup", {
    method: "POST",
    token,
  });
}

export async function verifyTwoFactorSetup(
  challengeId: string,
  code: string,
  token?: string | null,
) {
  return apiRequestWithRefresh<{
    success: boolean;
    message: string;
    recoveryCodes: string[];
  }>("/auth/2fa/verify-setup", {
    method: "POST",
    token,
    body: { challengeId, code },
  });
}

export async function disableTwoFactor(password: string, token?: string | null) {
  return apiRequestWithRefresh<{ success: boolean; message: string }>("/auth/2fa/disable", {
    method: "POST",
    token,
    body: { password },
  });
}

export async function regenerateRecoveryCodes(token?: string | null) {
  return apiRequestWithRefresh<{
    success: boolean;
    message: string;
    recoveryCodes: string[];
  }>("/auth/2fa/recovery-codes/regenerate", {
    method: "POST",
    token,
  });
}

export async function verifyTwoFactorChallenge(challengeId: string, code: string) {
  return apiRequest<AuthResponse>("/auth/2fa/challenge/verify", {
    method: "POST",
    body: { challengeId, code },
  });
}

export async function resendTwoFactorChallenge(challengeId: string) {
  return apiRequest<{
    success: boolean;
    challengeId: string;
    deliveryChannel: "EMAIL";
    maskedDestination: string;
    expiresInSeconds: number;
  }>("/auth/2fa/challenge/resend", {
    method: "POST",
    body: { challengeId },
  });
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ success: boolean; message: string; expiresInMinutes: number }>(
    "/auth/password-reset/request",
    {
      method: "POST",
      body: { email },
    },
  );
}

export async function confirmPasswordReset(token: string, password: string) {
  return apiRequest<{ success: boolean; message: string }>(
    "/auth/password-reset/confirm",
    {
      method: "POST",
      body: { token, password },
    },
  );
}

export async function requestAccountRecovery(input: {
  email: string;
  reason?: "GENERAL" | "LOCKED" | "COMPROMISED";
  note?: string;
}) {
  return apiRequest<{ success: boolean; message: string; expiresInMinutes: number }>(
    "/auth/account-recovery/request",
    {
      method: "POST",
      body: input,
    },
  );
}

export async function completeAccountRecovery(token: string, password: string) {
  return apiRequest<{ success: boolean; message: string }>(
    "/auth/account-recovery/complete",
    {
      method: "POST",
      body: { token, password },
    },
  );
}

export async function requestEmailOwnershipVerification(token?: string | null) {
  return apiRequestWithRefresh<{ success: boolean; message: string; expiresInMinutes: number }>(
    "/trust/email-ownership/request",
    {
      method: "POST",
      token,
    },
  );
}

export async function confirmEmailOwnership(token: string) {
  return apiRequest<{ success: boolean; message: string }>("/trust/email-ownership/confirm", {
    method: "POST",
    body: { token },
  });
}

export async function confirmSuspiciousLogin(token: string) {
  return apiRequest<{ success: boolean; message: string }>("/trust/suspicious-login/confirm", {
    method: "POST",
    body: { token },
  });
}

export async function refreshAuthToken(refreshToken?: string | null) {
  const resolvedRefreshToken = refreshToken ?? getRefreshToken();

  if (!resolvedRefreshToken) {
    throw new ApiError("Authentication required", 401);
  }

  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: {
      refreshToken: resolvedRefreshToken,
    },
  });
}

export async function logoutAccount(token?: string | null) {
  const resolvedToken = token ?? getAuthToken();

  if (!resolvedToken) {
    return;
  }

  return apiRequest<void>("/auth/logout", {
    method: "POST",
    token: resolvedToken,
  });
}

export async function fetchCurrentUser(token?: string | null) {
  const resolvedToken = token ?? getAuthToken();
  const storedRefreshToken = getRefreshToken();

  if (!resolvedToken) {
    if (!storedRefreshToken) {
      throw new ApiError("Authentication required", 401);
    }

    const authResponse = await refreshAuthToken(storedRefreshToken);
    setStoredToken(authResponse.accessToken);
    setStoredRefreshToken(authResponse.refreshToken);

    return apiRequest<AuthUser>("/auth/me", {
      token: authResponse.accessToken,
    });
  }

  try {
    return await apiRequest<AuthUser>("/auth/me", {
      token: resolvedToken,
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    if (!storedRefreshToken) {
      clearStoredToken();
      throw error;
    }

    const authResponse = await refreshAuthToken(storedRefreshToken);
    setStoredToken(authResponse.accessToken);
    setStoredRefreshToken(authResponse.refreshToken);

    return apiRequest<AuthUser>("/auth/me", {
      token: authResponse.accessToken,
    });
  }
}

export async function fetchSubscriptionPlans() {
  return apiRequest<SubscriptionPlan[]>("/plans");
}

export async function createUpgradeRequest(
  input: CreateUpgradeRequestInput,
  token?: string | null,
) {
  return apiRequest<UpgradeRequest>("/subscriptions/upgrade-requests", {
    method: "POST",
    body: input,
    token: token ?? getAuthToken(),
  });
}

export async function getOnboardingMe(token?: string | null) {
  return apiRequestWithRefresh<OnboardingMe>("/onboarding/me", {
    token,
  });
}

export async function getRegistrationDefaults() {
  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "Europe/Bucharest";

  return apiRequest<RegistrationDefaults>("/onboarding/defaults", {
    headers: {
      "x-timezone": timezone,
    } as any,
  });
}

export async function lookupCompanyProfile(input: {
  fiscalCode: string;
  countryCode?: string;
}) {
  return apiRequest<CompanyLookupResult>("/onboarding/company-lookup", {
    method: "PUT",
    body: input,
  });
}

export async function getOnboardingProgress(token?: string | null) {
  return apiRequestWithRefresh<OnboardingSession & { onboardingCompletedAt: string | null }>(
    "/onboarding/progress",
    {
      token,
    },
  );
}

export async function upsertIdentityProfile(
  input: UpsertIdentityProfileInput,
  token?: string | null,
) {
  return apiRequestWithRefresh<OnboardingMe>("/onboarding/identity-profile", {
    method: "PUT",
    body: input,
    token,
  });
}

export async function upsertCompanyProfile(
  input: UpsertCompanyProfileInput,
  token?: string | null,
) {
  return apiRequestWithRefresh<OnboardingMe>("/onboarding/company-profile", {
    method: "PUT",
    body: input,
    token,
  });
}

export async function enrichProfileWithRelu(profileId: string, token?: string | null) {
  return apiRequestWithRefresh(`/relu/profiles/${encodeURIComponent(profileId)}/enrich`, {
    method: "POST",
    token,
  });
}

export async function classifyProfileWithRelu(profileId: string, token?: string | null) {
  return apiRequestWithRefresh(`/relu/profiles/${encodeURIComponent(profileId)}/classify`, {
    method: "POST",
    token,
  });
}

export async function getReluProfileResults(profileId: string, token?: string | null) {
  return apiRequestWithRefresh<ReluProfileResults>(
    `/relu/profiles/${encodeURIComponent(profileId)}/results`,
    { token },
  );
}

export async function updateOnboardingStep(
  input: UpdateOnboardingStepInput,
  token?: string | null,
) {
  return apiRequestWithRefresh<OnboardingMe>("/onboarding/steps", {
    method: "PATCH",
    body: input,
    token,
  });
}

export async function getPublicIdentityProfile(slug: string) {
  return apiRequest<PublicProfile>(`/profiles/public/${encodeURIComponent(slug)}`);
}

export async function getPublicProfile(slug: string) {
  return apiRequest<PublicProfile>(`/profiles/public/${encodeURIComponent(slug)}`);
}

export async function getPublicCompanyProfile(slug: string) {
  return apiRequest<PublicCompanyProfile>(`/companies/public/${encodeURIComponent(slug)}`);
}

export async function getLanguages() {
  return apiRequest<Array<{ id: string; code: string; name: string }>>("/languages");
}

export async function getVerificationMe(token?: string | null) {
  return apiRequestWithRefresh<VerificationMe>("/verification/me", {
    token,
  });
}

export async function submitIdentityVerificationCase(
  input: SubmitVerificationCaseInput,
  token?: string | null,
) {
  return apiRequestWithRefresh<{
    identityProfile: VerificationMe["identityProfile"];
    case: VerificationCaseSummary;
  }>("/verification/identity/submit", {
    method: "POST",
    body: input,
    token,
  });
}

export async function submitCompanyVerificationCase(
  input: SubmitVerificationCaseInput,
  token?: string | null,
) {
  return apiRequestWithRefresh<{
    companyProfile: VerificationMe["companyProfile"];
    case: VerificationCaseSummary;
  }>("/verification/company/submit", {
    method: "POST",
    body: input,
    token,
  });
}

export async function getMyWorkforceAssignments(token?: string | null) {
  return apiRequest<MyWorkforceAssignment[]>("/workforce/me", {
    token: token ?? getAuthToken(),
  });
}

export async function createOperationalTimesheet(
  input: {
    workforceAssignmentId: string;
    periodStart: string;
    periodEnd: string;
  },
  token?: string | null,
) {
  return apiRequest<OperationalTimesheet>("/timesheets", {
    method: "POST",
    body: input,
    token: token ?? getAuthToken(),
  });
}

export async function addOperationalTimesheetEntry(
  id: string,
  input: {
    workDate: string;
    hoursWorked: number;
    overtimeHours?: number;
    notes?: string;
  },
  token?: string | null,
) {
  return apiRequest<OperationalTimesheet>(`/timesheets/${id}/entries`, {
    method: "POST",
    body: input,
    token: token ?? getAuthToken(),
  });
}

export async function submitOperationalTimesheet(
  id: string,
  input?: { note?: string },
  token?: string | null,
) {
  return apiRequest<OperationalTimesheet>(`/timesheets/${id}/submit`, {
    method: "POST",
    body: input ?? {},
    token: token ?? getAuthToken(),
  });
}

export async function getMyOperationalTimesheets(token?: string | null) {
  return apiRequest<OperationalTimesheet[]>("/timesheets/me", {
    token: token ?? getAuthToken(),
  });
}

export async function checkInOperationalAttendance(
  input: {
    workforceAssignmentId: string;
    source?: OperationalWorkSessionSource;
    locationMetadata?: Record<string, unknown>;
  },
  token?: string | null,
) {
  return apiRequest<OperationalAttendanceRecord>("/attendance/check-in", {
    method: "POST",
    body: input,
    token: token ?? getAuthToken(),
  });
}

export async function checkOutOperationalAttendance(
  input: {
    workforceAssignmentId: string;
    locationMetadata?: Record<string, unknown>;
  },
  token?: string | null,
) {
  return apiRequest<OperationalAttendanceRecord>("/attendance/check-out", {
    method: "POST",
    body: input,
    token: token ?? getAuthToken(),
  });
}

export async function getMyOperationalAttendance(token?: string | null) {
  return apiRequest<OperationalAttendanceRecord[]>("/attendance/me", {
    token: token ?? getAuthToken(),
  });
}

export type WorkerPayrollSettlementStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "READY_FOR_PAYMENT"
  | "PAID";

export type WorkerPayrollCycleStatus =
  | "OPEN"
  | "PROCESSING"
  | "LOCKED"
  | "EXPORTED";

export type WorkerCompensationType =
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "FIXED_PROJECT";

export type WorkerSettlementBillingStatus =
  | "NOT_BILLED"
  | "BILLING_EVENT_CREATED"
  | "INVOICED"
  | "PAID"
  | "CANCELLED";

export type PayrollSettlementSummary = {
  id: string;
  approvedTimesheetIds: string[];
  regularHours: number;
  overtimeHours: number;
  grossAmount: number;
  deductionsAmount: number;
  netAmount: number;
  currency: string;
  status: WorkerPayrollSettlementStatus;
  approvedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  payrollCycle: {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: WorkerPayrollCycleStatus;
  };
  user: {
    id: string;
    email: string;
    identityProfile: {
      id: string;
      publicSlug: string;
      displayName: string;
      verificationStatus: string;
    } | null;
  };
  assignment: MyWorkforceAssignment;
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitRate: number;
    amount: number;
    createdAt: string;
  }>;
  approvedByUser: {
    id: string;
    email: string;
    role: string;
  } | null;
  attendanceSummary: {
    recordCount: number;
    totalTrackedHours: number;
  };
  billingLink: {
    id: string;
    status: WorkerSettlementBillingStatus;
    createdAt: string;
    updatedAt: string;
    payrollSettlementId: string;
    billingEvent: {
      id: string;
      type: string;
      status: string;
      amount: number;
      currency: string;
      description: string;
      metadata: unknown;
    } | null;
    billingInvoice: {
      id: string;
      invoiceNumber: string;
      invoiceType: string;
      status: string;
      total: number;
      currency: string;
      paidAt: string | null;
    } | null;
  } | null;
};

export type PayrollOverview = {
  assignments: MyWorkforceAssignment[];
  compensationAgreements: Array<{
    id: string;
    compensationType: WorkerCompensationType;
    currency: string;
    baseRate: number;
    overtimeRate: number | null;
    overtimeThresholdHours: number | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    createdAt: string;
    updatedAt: string;
    assignment: MyWorkforceAssignment | null;
  }>;
  settlements: PayrollSettlementSummary[];
  cycles: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    status: WorkerPayrollCycleStatus;
    totalWorkers: number;
    totalGrossAmount: number;
    processedAt: string | null;
    lockedAt: string | null;
    exportedAt: string | null;
    createdAt: string;
    updatedAt: string;
    settlementCount: number;
    pendingSettlementCount: number;
    readyForPaymentCount: number;
    settlements: PayrollSettlementSummary[];
  }>;
};

export async function getMyPayrollOverview(token?: string | null) {
  return apiRequest<PayrollOverview>("/payroll/me", {
    token: token ?? getAuthToken(),
  });
}

export async function getMyPayrollSettlements(token?: string | null) {
  return apiRequest<PayrollSettlementSummary[]>("/payroll/me/settlements", {
    token: token ?? getAuthToken(),
  });
}

export async function getNotifications(token?: string | null) {
  return apiRequest<NotificationListResponse>("/notifications", {
    token: token ?? getAuthToken(),
  });
}

export async function getNotificationUnreadCount(token?: string | null) {
  return apiRequest<{ unreadCount: number }>("/notifications/unread-count", {
    token: token ?? getAuthToken(),
  });
}

export async function markNotificationRead(id: string, token?: string | null) {
  return apiRequest<NotificationItem>(`/notifications/${id}/read`, {
    method: "PATCH",
    token: token ?? getAuthToken(),
  });
}

export async function markAllNotificationsRead(token?: string | null) {
  return apiRequest<NotificationListResponse>("/notifications/read-all", {
    method: "PATCH",
    token: token ?? getAuthToken(),
  });
}

export async function dismissNotification(id: string, token?: string | null) {
  return apiRequest<NotificationItem>(`/notifications/${id}/dismiss`, {
    method: "PATCH",
    token: token ?? getAuthToken(),
  });
}

export async function getNotificationPreferences(token?: string | null) {
  return apiRequest<NotificationPreference>("/notifications/preferences", {
    token: token ?? getAuthToken(),
  });
}

export async function updateNotificationPreferences(
  input: {
    inAppEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    categories?: Record<string, boolean>;
  },
  token?: string | null,
) {
  return apiRequest<NotificationPreference>("/notifications/preferences", {
    method: "PUT",
    body: input,
    token: token ?? getAuthToken(),
  });
}

const API = API_URL;

type JobQueryParams = {
  category?: string;
  region?: string;
  nace?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type ActorQueryParams = {
  verified?: boolean;
  type?: string;
  nace?: string;
  page?: number;
};

type PublicPostQueryParams = {
  type?: string;
  status?: string;
  visibility?: string;
  q?: string;
};

function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export async function getJobs(params?: JobQueryParams) {
  const query = toQueryString({
    category: params?.category,
    region: params?.region,
    nace: params?.nace,
    status: params?.status ?? (params ? "LIVE" : undefined),
    page: params?.page,
    limit: params?.limit ?? (params ? 12 : undefined),
  });
  const url = query ? `${API}/jobs?${query}` : `${API}/jobs`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return { data: [], total: 0, page: params?.page ?? 1, limit: params?.limit ?? 12 };
  }

  return res.json();
}

export async function getJob(id: string) {
  const res = await fetch(`${API}/jobs/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function getActors(params?: ActorQueryParams) {
  const query = toQueryString({
    verified: params?.verified,
    type: params?.type,
    nace: params?.nace,
    page: params?.page ?? (params ? 1 : undefined),
  });
  const token = getAuthToken();
  const res = await fetch(`${API}/actors${query ? `?${query}` : ""}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    return { data: [], total: 0, page: params?.page ?? 1, limit: 20 };
  }

  const payload = await res.json();
  return {
    ...payload,
    data: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : [],
  };
}

export async function getActor(id: string) {
  const token = getAuthToken();
  const res = await fetch(`${API}/actors/${id}`, {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function getPublicPosts(params?: PublicPostQueryParams) {
  const query = toQueryString({
    type: params?.type,
    status: params?.status,
    visibility: params?.visibility,
    q: params?.q,
  });
  return apiRequest<MarketplacePost[]>(`/public-posts${query ? `?${query}` : ""}`);
}

export async function getPublicPost(id: string) {
  return apiRequest<MarketplacePost>(`/public-posts/${id}`);
}

function normalizeMarketplacePost(item: Record<string, unknown>): MarketplacePost {
  return {
    id: String(item.id ?? ""),
    slug: typeof item.slug === "string" ? item.slug : undefined,
    type: (item.type as MarketplacePostType) ?? "PROJECT",
    title: String(item.title ?? "Untitled marketplace post"),
    description: String(item.description ?? ""),
    summary: typeof item.summary === "string" ? item.summary : null,
    domain: String(item.domain ?? "General"),
    location: String(item.location ?? "Unspecified"),
    status: String(item.status ?? "LIVE"),
    moderationStatus:
      typeof item.moderationStatus === "string" ? item.moderationStatus : undefined,
    visibility: typeof item.visibility === "string" ? item.visibility : undefined,
    value: String(item.value ?? ""),
    currencyCode: typeof item.currencyCode === "string" ? item.currencyCode : null,
    vatRate: typeof item.vatRate === "number" ? item.vatRate : null,
    budgetMin: typeof item.budgetMin === "number" ? item.budgetMin : null,
    budgetMax: typeof item.budgetMax === "number" ? item.budgetMax : null,
    salaryMin: typeof item.salaryMin === "number" ? item.salaryMin : null,
    salaryMax: typeof item.salaryMax === "number" ? item.salaryMax : null,
    ownerName: String(item.ownerName ?? "OpenStaff"),
    ownerType: String(item.ownerType ?? ""),
    bannerUrl: typeof item.bannerUrl === "string" ? item.bannerUrl : null,
    experienceLabel:
      typeof item.experienceLabel === "string" ? item.experienceLabel : null,
    certifications: typeof item.certifications === "string" ? item.certifications : "",
    certificationsOffered:
      typeof item.certificationsOffered === "string"
        ? item.certificationsOffered
        : null,
    escoCodes: Array.isArray(item.escoCodes)
      ? item.escoCodes.filter((entry): entry is string => typeof entry === "string")
      : [],
    naceCodes: Array.isArray(item.naceCodes)
      ? item.naceCodes.filter((entry): entry is string => typeof entry === "string")
      : [],
    uniclassCodes: Array.isArray(item.uniclassCodes)
      ? item.uniclassCodes.filter((entry): entry is string => typeof entry === "string")
      : [],
    languageCodes: Array.isArray(item.languageCodes)
      ? item.languageCodes.filter((entry): entry is string => typeof entry === "string")
      : [],
    classificationJson:
      typeof item.classificationJson === "object" && item.classificationJson !== null
        ? (item.classificationJson as Record<string, unknown>)
        : {},
    fiscalMetadataJson:
      typeof item.fiscalMetadataJson === "object" && item.fiscalMetadataJson !== null
        ? (item.fiscalMetadataJson as Record<string, unknown>)
        : {},
    country:
      typeof item.country === "object" && item.country !== null
        ? (item.country as { id: string; name: string; code?: string | null })
        : null,
    region:
      typeof item.region === "object" && item.region !== null
        ? (item.region as { id: string; name: string })
        : null,
    city:
      typeof item.city === "object" && item.city !== null
        ? (item.city as { id: string; name: string })
        : null,
    media: Array.isArray(item.media)
      ? item.media.map((entry) => ({
          id: String((entry as Record<string, unknown>).id ?? ""),
          url: String((entry as Record<string, unknown>).url ?? ""),
          type: String((entry as Record<string, unknown>).type ?? "IMAGE"),
          role:
            typeof (entry as Record<string, unknown>).role === "string"
              ? String((entry as Record<string, unknown>).role)
              : undefined,
          alt:
            typeof (entry as Record<string, unknown>).alt === "string"
              ? String((entry as Record<string, unknown>).alt)
              : null,
          status:
            typeof (entry as Record<string, unknown>).status === "string"
              ? String((entry as Record<string, unknown>).status)
              : undefined,
        }))
      : [],
    mediaAssets: Array.isArray(item.mediaAssets)
      ? item.mediaAssets.map((entry) => ({
          id: String((entry as Record<string, unknown>).id ?? ""),
          url: String((entry as Record<string, unknown>).url ?? ""),
          type: String((entry as Record<string, unknown>).type ?? "IMAGE"),
          role:
            typeof (entry as Record<string, unknown>).role === "string"
              ? String((entry as Record<string, unknown>).role)
              : undefined,
          alt:
            typeof (entry as Record<string, unknown>).alt === "string"
              ? String((entry as Record<string, unknown>).alt)
              : null,
          status:
            typeof (entry as Record<string, unknown>).status === "string"
              ? String((entry as Record<string, unknown>).status)
              : undefined,
          assetUrl: String((entry as Record<string, unknown>).assetUrl ?? ""),
        }))
      : [],
    documents: Array.isArray(item.documents)
      ? item.documents.map((entry) => ({
          id: String((entry as Record<string, unknown>).id ?? ""),
          title: String((entry as Record<string, unknown>).title ?? ""),
          description:
            typeof (entry as Record<string, unknown>).description === "string"
              ? String((entry as Record<string, unknown>).description)
              : null,
          fileName: String((entry as Record<string, unknown>).fileName ?? ""),
          mimeType: String((entry as Record<string, unknown>).mimeType ?? ""),
          sizeBytes: Number((entry as Record<string, unknown>).sizeBytes ?? 0),
          status:
            typeof (entry as Record<string, unknown>).status === "string"
              ? String((entry as Record<string, unknown>).status)
              : undefined,
          downloadUrl: String((entry as Record<string, unknown>).downloadUrl ?? ""),
        }))
      : [],
    externalLinks: Array.isArray(item.externalLinks)
      ? item.externalLinks.map((entry) => ({
          id: String((entry as Record<string, unknown>).id ?? ""),
          url: String((entry as Record<string, unknown>).url ?? ""),
          normalizedUrl:
            typeof (entry as Record<string, unknown>).normalizedUrl === "string"
              ? String((entry as Record<string, unknown>).normalizedUrl)
              : undefined,
          securityStatus:
            typeof (entry as Record<string, unknown>).securityStatus === "string"
              ? String((entry as Record<string, unknown>).securityStatus)
              : undefined,
        }))
      : [],
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
  };
}

function mapLegacyJobToMarketplace(job: Record<string, unknown>): MarketplacePost {
  const location = [job.location, job.regionCode].filter(Boolean).join(", ");
  return {
    id: String(job.id ?? ""),
    type: "PROJECT",
    title: String(job.title ?? "Project"),
    description: String(job.description ?? ""),
    domain: String(job.category ?? "General"),
    location: location || "Unspecified",
    status: String(job.status ?? "LIVE"),
    value:
      job.budget !== undefined && job.budget !== null
        ? `${Number(job.budget).toLocaleString("ro-RO")} ${String(job.currency ?? "RON")}`
        : "To be confirmed",
    currencyCode: typeof job.currency === "string" ? job.currency : "RON",
    budgetMin: typeof job.budget === "number" ? job.budget : null,
    budgetMax: typeof job.budget === "number" ? job.budget : null,
    ownerName:
      typeof (job.actor as Record<string, unknown> | undefined)?.displayName === "string"
        ? String((job.actor as Record<string, unknown>).displayName)
        : "OpenStaff",
    ownerType: "Contractor",
    certifications: "",
    naceCodes:
      typeof job.naceCode === "string" && job.naceCode
        ? [String(job.naceCode)]
        : [],
    externalLinks: [],
    media: [],
    mediaAssets: [],
    documents: [],
    createdAt: typeof job.createdAt === "string" ? job.createdAt : undefined,
  };
}

function mapLegacyActorToMarketplace(actor: Record<string, unknown>): MarketplacePost {
  return {
    id: String(actor.id ?? ""),
    type: actor.actorType === "COMPANY" ? "SUBCONTRACTOR_POOL" : "PROFESSIONAL",
    title: String(actor.displayName ?? "Professional"),
    description: String(actor.bio ?? "No public description yet."),
    domain: String(actor.naceDescription ?? "Marketplace professional"),
    location: String(actor.regionCode ?? "RO"),
    status: "LIVE",
    value:
      typeof actor.minimumContractValue === "string"
        ? actor.minimumContractValue
        : "Available for engagement",
    ownerName: String(actor.displayName ?? "OpenStaff professional"),
    ownerType: String(actor.actorType ?? "Professional"),
    certifications: "",
    naceCodes:
      typeof actor.naceCode === "string" && actor.naceCode
        ? [String(actor.naceCode)]
        : [],
    experienceLabel:
      typeof actor.experienceYears === "number"
        ? `${actor.experienceYears} years experience`
        : null,
    externalLinks: [],
    media: [],
    mediaAssets: [],
    documents: [],
    createdAt: typeof actor.createdAt === "string" ? actor.createdAt : undefined,
  };
}

export async function getMarketplaceProjects(limit?: number) {
  const posts = await getPublicPosts({ type: "PROJECT", status: "LIVE" });
  return { data: posts.slice(0, limit ?? posts.length), source: "api" as const };
}

export async function getMarketplaceProfessionals(limit?: number) {
  const [professionals, pools] = await Promise.all([
    getPublicPosts({ type: "PROFESSIONAL", status: "LIVE" }),
    getPublicPosts({ type: "SUBCONTRACTOR_POOL", status: "LIVE" }),
  ]);

  const merged = [...professionals, ...pools].sort((left, right) => {
    const leftCreatedAt = typeof left.createdAt === "string" ? Date.parse(left.createdAt) : 0;
    const rightCreatedAt = typeof right.createdAt === "string" ? Date.parse(right.createdAt) : 0;
    return rightCreatedAt - leftCreatedAt;
  });

  return {
    data: merged.slice(0, limit ?? merged.length),
    source: "api" as const,
  };
}

export async function getMarketplaceProject(id: string) {
  return { data: await getPublicPost(id), source: "api" as const };
}

export async function getMarketplaceProfessional(id: string) {
  return { data: await getPublicPost(id), source: "api" as const };
}

export async function getMarketplaceFeed(params?: {
  type?: "PROJECT" | "PROFESSIONAL" | "SUBCONTRACTOR_POOL";
  status?: string;
}) {
  const posts = await getPublicPosts(params);
  return { data: posts, total: posts.length, source: "api" as const };
}

export async function getMyPublicPosts(token?: string | null) {
  return apiRequest<MarketplacePost[]>("/public-posts/me", {
    token: token ?? getAuthToken(),
  });
}

export async function createPublicPost(
  payload: Record<string, unknown>,
  token?: string | null,
) {
  return apiRequest<MarketplacePost>("/public-posts", {
    method: "POST",
    token: token ?? getAuthToken(),
    body: payload,
  });
}

export async function updatePublicPost(
  id: string,
  payload: Record<string, unknown>,
  token?: string | null,
) {
  return apiRequest<MarketplacePost>(`/public-posts/${id}`, {
    method: "PATCH",
    token: token ?? getAuthToken(),
    body: payload,
  });
}

export async function deletePublicPost(id: string, token?: string | null) {
  return apiRequest<{ success: boolean }>(`/public-posts/${id}`, {
    method: "DELETE",
    token: token ?? getAuthToken(),
  });
}

export async function uploadPublicPostMedia(
  id: string,
  input: { file: File; role?: string; alt?: string },
  token?: string | null,
) {
  const formData = new FormData();
  formData.append("file", input.file);
  if (input.role) {
    formData.append("role", input.role);
  }
  if (input.alt) {
    formData.append("alt", input.alt);
  }

  return apiRequest<{ id: string; status: string; url: string; type: string }>(
    `/public-posts/${id}/media`,
    {
      method: "POST",
      token: token ?? getAuthToken(),
      formData,
    },
  );
}

export async function uploadPublicPostDocument(
  id: string,
  input: { file: File; title?: string; description?: string },
  token?: string | null,
) {
  const formData = new FormData();
  formData.append("file", input.file);
  if (input.title) {
    formData.append("title", input.title);
  }
  if (input.description) {
    formData.append("description", input.description);
  }

  return apiRequest<{ id: string; status: string; fileName: string; mimeType: string }>(
    `/public-posts/${id}/documents`,
    {
      method: "POST",
      token: token ?? getAuthToken(),
      formData,
    },
  );
}

export async function createPublicPostExternalLink(
  id: string,
  input: { url: string },
  token?: string | null,
) {
  return apiRequest<{ id: string; securityStatus: string; url: string }>(
    `/public-posts/${id}/external-links`,
    {
      method: "POST",
      token: token ?? getAuthToken(),
      body: input,
    },
  );
}

export async function searchNace(q: string) {
  const res = await fetch(`${API}/taxonomy/nace?q=${encodeURIComponent(q)}&limit=8`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return { results: [] };
  }
  return res.json();
}

export async function searchEsco(q: string) {
  const res = await fetch(`${API}/taxonomy/esco?q=${encodeURIComponent(q)}&limit=8`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return { results: [] };
  }
  return res.json();
}

export async function searchUniclass(q: string) {
  const res = await fetch(`${API}/taxonomy/uniclass?q=${encodeURIComponent(q)}&limit=8`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return { results: [] };
  }
  return res.json();
}

export async function chatWithRelu(
  message: string,
  history: { role: string; parts: string }[] = [],
) {
  const res = await fetch(`${API}/gemini/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    return { response: "Serviciu indisponibil temporar." };
  }
  return res.json();
}

export async function applyToJob(id: string, message: string, token?: string | null) {
  return apiRequest(`/jobs/${id}/apply`, {
    method: "POST",
    token: token ?? getAuthToken(),
    body: { message },
  });
}

export async function uploadActorDocument(
  documentType: string,
  file: File,
  token?: string | null,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  return apiRequest<{
    id: string;
    actorId: string;
    type: string;
    fileUrl: string;
    verified: boolean;
  }>("/documents/upload", {
    method: "POST",
    token: token ?? getAuthToken(),
    formData,
  });
}

export async function createActorProfile(
  payload: Record<string, unknown>,
  token?: string | null,
) {
  return apiRequest("/actors", {
    method: "POST",
    token: token ?? getAuthToken(),
    body: payload,
  });
}
