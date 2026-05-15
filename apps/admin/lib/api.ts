const LOCAL_API_URL = "http://localhost:8080";
const PRODUCTION_API_URL = "https://api.openstaff.eu";
const ACCESS_TOKEN_KEY = "openstaff_admin_access_token";
const REFRESH_TOKEN_KEY = "openstaff_admin_refresh_token";

export type ApiFetchResult<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      status: number;
      kind: "unauthorized" | "error";
      message: string;
    };

type StructuredSuccessResponse<T> = {
  status: "ok";
  data: T;
  source?: string;
};

type StructuredErrorResponse = {
  status: "error";
  message: string;
  details?: string;
};

export type AdminAuthUser = {
  id: string;
  email: string;
  role: string;
  approvalStatus: string;
  accountStatus: string;
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

export type AdminAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AdminAuthUser;
};

export type UpgradeRequest = {
  id: string;
  createdAt: string;
  email: string;
  name: string | null;
  companyName: string | null;
  currentPlanCode: string | null;
  requestedPlanCode: "BRONZE" | "GOLD" | "ENTERPRISE";
  status: "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED" | "CLOSED";
  source: "PRICING" | "LIMIT_REACHED" | "CONTACT_SALES";
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

export type ApproveUpgradeRequestInput = {
  note?: string;
  billingStatus?: "PENDING" | "ISSUED" | "PAID";
};

export type SubscriptionSummary = {
  planCode: "BASIC" | "BRONZE" | "GOLD" | "ENTERPRISE";
  planName: string;
  status: "ACTIVE" | "CANCELED" | "EXPIRED";
  startedAt: string;
  expiresAt: string | null;
  contactLimit: number;
  contactsUsed: number;
  features: Record<string, boolean>;
};

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  sourceTypes?: string[];
  workforceSettlementRefs?: Array<{
    billingEventId: string;
    payrollSettlementId: string | null;
    workerUserId: string | null;
    workerEmail: string;
  }>;
  user: {
    id: string;
    email: string;
  };
  lineCount?: number;
  lines?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    billingEvent: {
      id: string;
      type: string;
      status: string;
      amount: number;
      currency: string;
    } | null;
  }>;
  payments?: PaymentRecord[];
};

export type PaymentRecord = {
  id: string;
  provider: "MANUAL" | "BANK_TRANSFER" | "STRIPE_PLACEHOLDER";
  providerPaymentId: string | null;
  status: "PENDING" | "RECONCILED" | "FAILED" | "CANCELLED";
  amount: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
};

export type BillingEventSummary = {
  id: string;
  createdAt: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  metadata: unknown;
  user: {
    id: string;
    email: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceType: string;
    status: string;
    total: number;
    currency: string;
  } | null;
  billingLink: {
    id: string;
    status: string;
    payrollSettlementId: string;
    billingInvoiceId: string | null;
    payrollCycleId: string;
    workforceAssignmentId: string;
    regularHours: number;
    overtimeHours: number;
    invoiceNumber: string | null;
  } | null;
};

export type BillingWebhookEvent = {
  id: string;
  provider: string;
  eventType: string;
  externalId: string | null;
  status: "RECEIVED" | "PROCESSED" | "FAILED";
  payload: unknown;
  error: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type SubscriptionRenewal = {
  id: string;
  status: "SCHEDULED" | "PROCESSED" | "FAILED" | "CANCELLED";
  periodStart: string;
  periodEnd: string;
  scheduledAt: string;
  processedAt: string | null;
  user: {
    id: string;
    email: string;
  };
  subscription: {
    id: string;
    plan: {
      code: string;
      name: string;
    };
  };
  billingInvoice: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
};

export type TaxonomyImportType =
  | "ESCO"
  | "NACE"
  | "UNICLASS"
  | "COUNTRIES"
  | "REGIONS"
  | "CITIES"
  | "VAT"
  | "CURRENCIES"
  | "PROFESSIONS"
  | "CERTIFICATIONS"
  | "INDUSTRIES"
  | "PROJECT_CATEGORIES";

export type TaxonomyImportOption = {
  value: TaxonomyImportType;
  label: string;
  description: string;
};

export type TaxonomyImportBatch = {
  id: string;
  entityType: TaxonomyImportType;
  status: string;
  fileName: string;
  fileMimeType: string;
  storageKey: string;
  rowCount: number;
  preview: Array<Record<string, unknown>>;
  errors: Array<{
    rowNumber: number;
    key: string | null;
    code: string;
    message: string;
  }>;
  duplicateSummary: {
    duplicateKeysInFile: string[];
    createCount: number;
    updateCount: number;
  } | null;
  validationSummary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    createCount: number;
    updateCount: number;
    duplicateKeysInFile: number;
  } | null;
  commitSummary: {
    created: number;
    updated: number;
    totalCommitted: number;
  } | null;
  committedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
  } | null;
};

export type ReluAccessMode =
  | "PUBLIC_LIMITED"
  | "AUTHENTICATED_USER"
  | "ADMIN_SECURED";

export type ReluAgent = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  model: string;
  accessMode: ReluAccessMode;
  systemPrompt?: string;
  policyJson: unknown;
  temperature?: number;
  enabled: boolean;
  publicEnabled: boolean;
  maxContextItems?: number;
  webhookUrl?: string | null;
  updatedAt: string;
};

export type ReluTask = {
  id: string;
  capability: string;
  accessMode: ReluAccessMode;
  status: string;
  requestedByUserId: string | null;
  contextEntityType: string | null;
  contextEntityId: string | null;
  title: string;
  inputSummaryJson: unknown;
  resultSummaryJson: unknown;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  requestedBy?: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type ReluQueueSnapshot = {
  summary: {
    pending: number;
    running: number;
    completedLast24Hours: number;
    failedLast24Hours: number;
    engineStatus: string;
  };
  tasks: ReluTask[];
};

export type ReluSourceType = "PUBLIC_POST" | "PROFILE" | "PROJECT" | "DOCUMENT";
export type ReluProcessingDomain =
  | "INGESTION"
  | "TAXONOMY"
  | "MATCH"
  | "MODERATION"
  | "RECOMMENDATION";
export type ReluResultStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "REVIEWED"
  | "OVERRIDDEN";

export type ReluRun = {
  id: string;
  taskId: string | null;
  sourceType: ReluSourceType;
  sourceId: string;
  userId: string | null;
  triggeredByUserId: string | null;
  domain: ReluProcessingDomain;
  status: ReluResultStatus;
  inputSnapshot: unknown;
  outputData: unknown;
  score: number | null;
  explanation: string | null;
  fallbackUsed: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  task: ReluTask | null;
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
  triggeredBy?: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type ReluClassificationResult = {
  kind: "classification";
  id: string;
  runId: string | null;
  sourceType: ReluSourceType;
  sourceId: string;
  userId: string | null;
  domain: ReluProcessingDomain;
  status: ReluResultStatus;
  inputSnapshot: unknown;
  outputData: unknown;
  score: number | null;
  explanation: string | null;
  overrideData: unknown;
  fallbackUsed: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy?: {
    id: string;
    email: string;
    role: string;
  } | null;
  run: ReluRun | null;
};

export type ReluMatchResult = {
  kind: "match";
  id: string;
  runId: string | null;
  sourceType: ReluSourceType;
  sourceId: string;
  targetSourceType: ReluSourceType | null;
  targetSourceId: string | null;
  userId: string | null;
  domain: ReluProcessingDomain;
  status: ReluResultStatus;
  inputSnapshot: unknown;
  outputData: unknown;
  score: number | null;
  compatibilityPercent: number | null;
  explanation: string | null;
  overrideData: unknown;
  fallbackUsed: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy?: {
    id: string;
    email: string;
    role: string;
  } | null;
  run: ReluRun | null;
};

export type ReluRecommendationResult = {
  kind: "recommendation";
  id: string;
  runId: string | null;
  sourceType: ReluSourceType;
  sourceId: string;
  targetSourceType: ReluSourceType | null;
  targetSourceId: string | null;
  userId: string | null;
  domain: ReluProcessingDomain;
  status: ReluResultStatus;
  inputSnapshot: unknown;
  outputData: unknown;
  score: number | null;
  explanation: string | null;
  recommendedAction: string | null;
  overrideData: unknown;
  fallbackUsed: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy?: {
    id: string;
    email: string;
    role: string;
  } | null;
  run: ReluRun | null;
};

export type ReluResult =
  | ReluClassificationResult
  | ReluMatchResult
  | ReluRecommendationResult;

export type AiAuditLog = {
  id: string;
  actorUserId: string | null;
  projectId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson: unknown;
  afterJson: unknown;
  metadataJson: unknown;
  createdAt: string;
  actorUser: {
    id: string;
    email: string;
    role: string;
  } | null;
};

function isStructuredSuccessResponse<T>(
  value: unknown,
): value is StructuredSuccessResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as { status?: unknown }).status === "ok" &&
    "data" in value
  );
}

function isStructuredErrorResponse(
  value: unknown,
): value is StructuredErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as { status?: unknown }).status === "error" &&
    "message" in value
  );
}

export function getApiUrl() {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_API_URL;
  }

  return PRODUCTION_API_URL;
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function setRefreshToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function fetchApiJson<T>(
  path: string,
  init?: RequestInit,
  options: { retryOnUnauthorized?: boolean } = {},
): Promise<ApiFetchResult<T>> {
  const headers = new Headers(init?.headers);
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      credentials: "include",
      ...init,
      headers,
      cache: "no-store",
    });

    if (response.status === 401 && options.retryOnUnauthorized !== false) {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        const refreshed = await refreshAdminToken(refreshToken).catch(() => null);

        if (refreshed) {
          setAccessToken(refreshed.accessToken);
          setRefreshToken(refreshed.refreshToken);

          return fetchApiJson<T>(
            path,
            {
              ...init,
              headers: init?.headers,
            },
            { retryOnUnauthorized: false },
          );
        }
      }

      clearAccessToken();
      redirectToLogin();

      return {
        ok: false,
        status: response.status,
        kind: "unauthorized",
        message: "Authentication required. Redirecting to login.",
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : null;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        kind: "error",
        message:
          payload && typeof payload === "object" && "message" in payload
            ? String(payload.message)
            : `API responded with status ${response.status}`,
      };
    }

    if (isStructuredErrorResponse(payload)) {
      return {
        ok: false,
        status: response.status,
        kind: "error",
        message: payload.details
          ? `${payload.message} (${payload.details})`
          : payload.message,
      };
    }

    if (isStructuredSuccessResponse<T>(payload)) {
      return { ok: true, status: response.status, data: payload.data };
    }

    return { ok: true, status: response.status, data: payload as T };
  } catch {
    return {
      ok: false,
      status: 0,
      kind: "error",
      message: "The API is unavailable or blocked by CORS/network restrictions.",
    };
  }
}

export async function loginAdmin(payload: { email: string; password: string }) {
  const response = await fetch(buildApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : "Login failed.",
    );
  }

  return data as AdminAuthResponse;
}

export async function refreshAdminToken(refreshToken?: string | null) {
  const response = await fetch(buildApiUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: refreshToken ?? getRefreshToken(),
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : "Refresh failed.",
    );
  }

  return data as AdminAuthResponse;
}

export async function logoutAdmin(accessToken?: string | null) {
  await fetch(buildApiUrl("/auth/logout"), {
    method: "POST",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
    cache: "no-store",
  });
}

export async function fetchCurrentAdmin(accessToken?: string | null) {
  const result = await fetchApiJson<AdminAuthUser>(
    "/auth/me",
    {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    },
    { retryOnUnauthorized: true },
  );

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

function getAuthHeader() {
  const token = getAccessToken();
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      ...getAuthHeader(),
      ...(init?.headers
        ? Object.fromEntries(new Headers(init.headers).entries())
        : {}),
    },
    cache: "no-store",
  });

  const payload = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || `API request failed with status ${response.status}`);
  }

  if (isStructuredErrorResponse(payload)) {
    throw new Error(
      payload.details ? `${payload.message} (${payload.details})` : payload.message,
    );
  }

  if (isStructuredSuccessResponse<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

async function adminUpload<T>(path: string, formData: FormData): Promise<T> {
  return adminFetch<T>(path, {
    method: "POST",
    body: formData,
  });
}

export const adminApi = {
  getBillingEvents: () => adminFetch<BillingEventSummary[]>("/admin/billing/events"),
  getAdminUpgradeRequests: () =>
    adminFetch<UpgradeRequest[]>("/admin/subscription-upgrade-requests"),
  approveUpgradeRequest: (id: string, input: ApproveUpgradeRequestInput) =>
    adminFetch<{
      request: UpgradeRequest;
      subscription: SubscriptionSummary | null;
      billingEvent: {
        id: string;
        type: string;
        amount: number;
        currency: string;
        status: string;
      };
    }>(`/admin/subscription-upgrade-requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateUpgradeRequestStatus: (
    id: string,
    status: "CONTACTED" | "APPROVED" | "REJECTED" | "CLOSED",
  ) =>
    adminFetch<UpgradeRequest>(`/admin/subscription-upgrade-requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  changeUserSubscription: (
    userId: string,
    input: {
      planCode: "BASIC" | "BRONZE" | "GOLD" | "ENTERPRISE";
      status?: "ACTIVE";
      note?: string;
    },
  ) =>
    adminFetch<SubscriptionSummary>(`/admin/users/${userId}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getBillingInvoices: () => adminFetch<BillingInvoice[]>("/admin/billing/invoices"),
  getBillingInvoice: (id: string) =>
    adminFetch<BillingInvoice>(`/admin/billing/invoices/${id}`),
  generateInvoice: (input: {
    userId: string;
    billingEventIds: string[];
    dueDays?: number;
  }) =>
    adminFetch<BillingInvoice>("/admin/billing/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  markInvoicePaid: (
    id: string,
    input: {
      provider: "MANUAL" | "BANK_TRANSFER";
      providerPaymentId?: string;
      note?: string;
    },
  ) =>
    adminFetch<{ invoice: BillingInvoice; payment: PaymentRecord }>(
      `/admin/billing/invoices/${id}/mark-paid`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    ),
  getBillingPayments: () => adminFetch<PaymentRecord[]>("/admin/billing/payments"),
  getBillingWebhooks: () =>
    adminFetch<BillingWebhookEvent[]>("/admin/billing/webhooks"),
  processBillingWebhook: (
    id: string,
    input?: {
      status?: "PROCESSED" | "FAILED";
      note?: string;
    },
  ) =>
    adminFetch<BillingWebhookEvent>(`/admin/billing/webhooks/${id}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    }),
  getBillingRenewals: () =>
    adminFetch<SubscriptionRenewal[]>("/admin/billing/renewals"),
  generateRenewals: (input: { periodStart: string; periodEnd: string }) =>
    adminFetch<{
      createdCount: number;
      renewals: Array<{ id: string; subscriptionId: string; billingEventId: string }>;
    }>("/admin/billing/renewals/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  processRenewal: (id: string) =>
    adminFetch<{
      renewal: SubscriptionRenewal;
      invoice: BillingInvoice | null;
    }>(`/admin/billing/renewals/${id}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
  getUsers: () => adminFetch("/admin/users"),
  updateUserRole: (userId: string, role: string) =>
    adminFetch(`/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }),
  updateUserApproval: (userId: string, approvalStatus: string) =>
    adminFetch(`/admin/users/${userId}/approval`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus }),
    }),
  updateAccountStatus: (userId: string, accountStatus: string) =>
    adminFetch(`/admin/users/${userId}/account-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus }),
    }),
  updateProfileModeration: (
    userId: string,
    moderationStatus: string,
    status: string,
  ) =>
    adminFetch(`/admin/users/${userId}/profile-moderation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderationStatus, status }),
    }),
  getJobStats: () => adminFetch<Record<string, unknown>>("/jobs/stats"),
  getActorStats: () => adminFetch<Record<string, unknown>>("/actors/stats"),
  getReluConfig: () => adminFetch<ReluAgent[]>("/relu/config"),
  updateReluConfig: (
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      model: string;
      accessMode: ReluAccessMode;
      temperature: number;
      enabled: boolean;
      publicEnabled: boolean;
      maxContextItems: number;
      webhookUrl: string | null;
    }>,
  ) =>
    adminFetch<ReluAgent>(`/relu/config/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getReluPromptsPolicies: () => adminFetch<ReluAgent[]>("/relu/prompts-policies"),
  updateReluPromptPolicy: (
    id: string,
    data: Partial<{
      description: string | null;
      systemPrompt: string;
      policyJson: Record<string, unknown> | null;
    }>,
  ) =>
    adminFetch<ReluAgent>(`/relu/prompts-policies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getReluQueue: () => adminFetch<ReluQueueSnapshot>("/relu/queue"),
  getAdminReluRuns: () => adminFetch<ReluRun[]>("/admin/relu/runs"),
  getAdminReluResults: () => adminFetch<ReluResult[]>("/admin/relu/results"),
  updateAdminReluResultStatus: (id: string, status: ReluResultStatus) =>
    adminFetch<ReluResult>(`/admin/relu/results/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  overrideAdminReluResult: (id: string, data: Record<string, unknown>) =>
    adminFetch<ReluResult>(`/admin/relu/results/${id}/override`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  ingestAdminPublicPostRelu: (id: string) =>
    adminFetch<ReluClassificationResult>(`/relu/public-posts/${id}/ingest`, {
      method: "POST",
    }),
  classifyAdminPublicPostRelu: (id: string) =>
    adminFetch<ReluClassificationResult>(`/relu/public-posts/${id}/classify`, {
      method: "POST",
    }),
  getAiAuditLogs: () => adminFetch<AiAuditLog[]>("/audit/ai-actions"),
  getAgents: () => adminFetch<ReluAgent[]>("/gemini/agents"),
  updateAgent: (id: string, data: unknown) =>
    adminFetch<ReluAgent>(`/gemini/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getTaxonomyImportOptions: () =>
    adminFetch<{
      supportedTypes: TaxonomyImportOption[];
      acceptedFileTypes: string[];
    }>("/taxonomy/admin/import-options"),
  uploadTaxonomyImport: (entityType: TaxonomyImportType, file: File) => {
    const formData = new FormData();
    formData.append("entityType", entityType);
    formData.append("file", file);
    return adminUpload<TaxonomyImportBatch>("/taxonomy/admin/imports/upload", formData);
  },
  parseTaxonomyImport: (batchId: string) =>
    adminFetch<TaxonomyImportBatch & { preview: Array<Record<string, unknown>> }>(
      `/taxonomy/admin/imports/${batchId}/parse`,
      { method: "POST" },
    ),
  validateTaxonomyImport: (batchId: string) =>
    adminFetch<
      TaxonomyImportBatch & {
        preview: Array<Record<string, unknown>>;
        errors: TaxonomyImportBatch["errors"];
        duplicateSummary: TaxonomyImportBatch["duplicateSummary"];
        validationSummary: TaxonomyImportBatch["validationSummary"];
      }
    >(`/taxonomy/admin/imports/${batchId}/validate`, {
      method: "POST",
    }),
  commitTaxonomyImport: (batchId: string) =>
    adminFetch<TaxonomyImportBatch & { commitSummary: TaxonomyImportBatch["commitSummary"] }>(
      `/taxonomy/admin/imports/${batchId}/commit`,
      { method: "POST" },
    ),
  listTaxonomyImports: () =>
    adminFetch<TaxonomyImportBatch[]>("/taxonomy/admin/imports"),
  getTaxonomyImport: (batchId: string) =>
    adminFetch<TaxonomyImportBatch>(`/taxonomy/admin/imports/${batchId}`),
  browseTaxonomy: (entityType: TaxonomyImportType, query = "") =>
    adminFetch<{ entityType: TaxonomyImportType; items: Array<Record<string, unknown>> }>(
      `/taxonomy/admin/browser?entityType=${encodeURIComponent(entityType)}&q=${encodeURIComponent(query)}`,
    ),
  updateTaxonomyEntry: (
    entityType: TaxonomyImportType,
    id: string,
    payload: Record<string, unknown>,
  ) =>
    adminFetch<Record<string, unknown>>(
      `/taxonomy/admin/browser/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    ),
  getAdminMessageConversations: (filters?: { type?: string; moderationStatus?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (filters?.type) search.set("type", filters.type);
    if (filters?.moderationStatus) search.set("moderationStatus", filters.moderationStatus);
    if (filters?.q) search.set("q", filters.q);
    return adminFetch<AdminMessageConversation[]>(
      `/admin/messages/conversations${search.toString() ? `?${search.toString()}` : ""}`,
    );
  },
  getAdminMessageModeration: (filters?: { status?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (filters?.status) search.set("status", filters.status);
    if (filters?.q) search.set("q", filters.q);
    return adminFetch<AdminMessageItem[]>(
      `/admin/messages/moderation${search.toString() ? `?${search.toString()}` : ""}`,
    );
  },
  moderateAdminMessage: (
    messageId: string,
    input: {
      moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
      moderationNotes?: string;
      isFlagged?: boolean;
      applyToAttachments?: boolean;
    },
  ) =>
    adminFetch<AdminMessageItem>(`/admin/messages/${messageId}/moderate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
};

export async function createUpgradeRequest(
  input: CreateUpgradeRequestInput,
  token?: string | null,
) {
  return adminFetch<UpgradeRequest>("/subscriptions/upgrade-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
}

export async function getAdminUpgradeRequests() {
  return adminApi.getAdminUpgradeRequests();
}

export async function approveUpgradeRequest(
  id: string,
  input: ApproveUpgradeRequestInput,
) {
  return adminApi.approveUpgradeRequest(id, input);
}

export async function updateUpgradeRequestStatus(
  id: string,
  status: "CONTACTED" | "APPROVED" | "REJECTED" | "CLOSED",
) {
  return adminApi.updateUpgradeRequestStatus(id, status);
}

export async function changeUserSubscription(
  userId: string,
  input: {
    planCode: "BASIC" | "BRONZE" | "GOLD" | "ENTERPRISE";
    status?: "ACTIVE";
    note?: string;
  },
) {
  return adminApi.changeUserSubscription(userId, input);
}

export async function getBillingInvoices() {
  return adminApi.getBillingInvoices();
}

export async function getBillingEvents() {
  return adminApi.getBillingEvents();
}

export async function generateInvoice(input: {
  userId: string;
  billingEventIds: string[];
  dueDays?: number;
}) {
  return adminApi.generateInvoice(input);
}

export async function markInvoicePaid(
  id: string,
  input: {
    provider: "MANUAL" | "BANK_TRANSFER";
    providerPaymentId?: string;
    note?: string;
  },
) {
  return adminApi.markInvoicePaid(id, input);
}

export async function getBillingPayments() {
  return adminApi.getBillingPayments();
}

export async function getBillingWebhooks() {
  return adminApi.getBillingWebhooks();
}

export async function processBillingWebhook(
  id: string,
  input?: {
    status?: "PROCESSED" | "FAILED";
    note?: string;
  },
) {
  return adminApi.processBillingWebhook(id, input);
}

export async function getBillingRenewals() {
  return adminApi.getBillingRenewals();
}

export async function generateRenewals(input: {
  periodStart: string;
  periodEnd: string;
}) {
  return adminApi.generateRenewals(input);
}

export async function processRenewal(id: string) {
  return adminApi.processRenewal(id);
}

export type AdminOnboardingSession = {
  id: string;
  userId: string;
  email: string;
  currentStep: string;
  completedSteps: string[];
  completionPercent: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  identityProfile: {
    displayName: string;
    publicSlug: string;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  } | null;
  companyProfile: {
    companyName: string;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  } | null;
};

export type AdminVerificationCase = {
  id: string;
  subjectType: "IDENTITY_PROFILE" | "COMPANY_PROFILE";
  status: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  submittedAt: string | null;
  reviewedAt: string | null;
  latestNote: string | null;
  decisionCount: number;
  reviewedBy: {
    id: string;
    email: string;
    role: string;
  } | null;
  user: {
    id: string;
    email: string;
    role: string;
  };
  identityProfile: {
    id: string;
    publicSlug: string;
    displayName: string;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    profileCompletionPercent: number;
    onboardingCompletedAt: string | null;
  } | null;
  companyProfile: {
    id: string;
    companyName: string;
    legalName: string | null;
    country: string | null;
    city: string | null;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    onboardingCompletedAt: string | null;
  } | null;
  documents: Array<{
    id: string;
    assetType: string;
    label: string | null;
    profileDocument: {
      id: string;
      title: string;
      type: string;
      mimeType: string;
    } | null;
    actorDocument: {
      id: string;
      title: string;
      type: string;
      status: string;
      verifiedAt: string | null;
    } | null;
    actorCertification: {
      id: string;
      title: string;
      type: string;
      status: string;
      verifiedAt: string | null;
    } | null;
    medicalFitnessCertificate: {
      id: string;
      title: string;
      category: string;
      status: string;
      fitnessDecision: string;
      verifiedAt: string | null;
    } | null;
  }>;
  decisions: Array<{
    id: string;
    decision: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    actorUser: {
      id: string;
      email: string;
      role: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type HiringStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "SHORTLISTED"
  | "OFFER_SENT"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export type AdminHiringPipelineListItem = {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  totalApplicants: number;
  totalShortlisted: number;
  totalHired: number;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    actor: {
      id: string;
      displayName: string;
      email: string;
    };
  };
  groupedCounts: Array<{
    stage: HiringStage;
    count: number;
  }>;
};

export type AdminHiringPipelineApplicant = {
  id: string;
  createdAt: string;
  currentStage: HiringStage;
  status: string;
  reluScore: number | null;
  message: string | null;
  stageChangedAt: string | null;
  actor: {
    id: string;
    displayName: string;
    email: string;
    actorType: string;
  };
  identityProfile: {
    publicSlug: string;
    displayName: string;
    verificationStatus: string;
    profileCompletionPercent: number;
  } | null;
};

export type AdminHiringPipelineDetail = {
  pipeline: {
    id: string;
    status: "ACTIVE" | "PAUSED" | "CLOSED";
    totalApplicants: number;
    totalShortlisted: number;
    totalHired: number;
    createdAt: string;
    updatedAt: string;
    job: {
      id: string;
      title: string;
      status: string;
      actor: {
        id: string;
        displayName: string;
        email: string;
      };
    };
  };
  counters: {
    totalApplicants: number;
    totalShortlisted: number;
    totalHired: number;
  };
  shortlistStats: {
    current: number;
  };
  hiredStats: {
    current: number;
  };
  applicantsByStage: Array<{
    stage: HiringStage;
    applicants: AdminHiringPipelineApplicant[];
  }>;
};

export type AdminHiringApplicationDetail = {
  application: {
    id: string;
    createdAt: string;
    currentStage: HiringStage;
    status: string;
    reluScore: number | null;
    message: string | null;
    stageChangedAt: string | null;
    withdrawnAt: string | null;
    job: {
      id: string;
      title: string;
      status: string;
    };
  };
  candidateIdentitySummary: {
    actor: {
      id: string;
      displayName: string;
      email: string;
      actorType: string;
      isVerified: boolean;
    };
    identityProfile: {
      id: string;
      publicSlug: string;
      displayName: string;
      verificationStatus: string;
      profileCompletionPercent: number;
    } | null;
    user: {
      id: string;
      email: string;
      role: string;
    } | null;
  };
  stageHistory: Array<{
    id: string;
    fromStage: HiringStage | null;
    toStage: HiringStage;
    note: string | null;
    createdAt: string;
    changedByUser: {
      id: string;
      email: string;
      role: string;
    } | null;
  }>;
  decisions: Array<{
    id: string;
    decision: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
    reason: string | null;
    createdAt: string;
    decidedByUser: {
      id: string;
      email: string;
      role: string;
    } | null;
  }>;
};

export async function getAdminOnboardingSessions(filters?: {
  q?: string;
  onboardingStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
}) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  if (filters?.onboardingStatus) {
    query.set("onboardingStatus", filters.onboardingStatus);
  }

  if (filters?.verificationStatus) {
    query.set("verificationStatus", filters.verificationStatus);
  }

  return adminFetch<AdminOnboardingSession[]>(
    `/admin/onboarding/sessions${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminVerificationCases(filters?: {
  q?: string;
  status?: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  subjectType?: "IDENTITY_PROFILE" | "COMPANY_PROFILE";
}) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  if (filters?.subjectType) {
    query.set("subjectType", filters.subjectType);
  }

  return adminFetch<AdminVerificationCase[]>(
    `/admin/verifications/cases${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminVerificationCase(id: string) {
  return adminFetch<AdminVerificationCase>(`/admin/verifications/cases/${id}`);
}

export async function reviewVerificationCase(
  id: string,
  input: {
    decision: "REQUEST_INFO" | "APPROVE" | "REJECT" | "REOPEN";
    note?: string;
  },
) {
  return adminFetch<AdminVerificationCase>(`/admin/verifications/cases/${id}/review`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getAdminHiringPipelines(filters?: {
  q?: string;
  status?: "ACTIVE" | "PAUSED" | "CLOSED";
}) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  return adminFetch<AdminHiringPipelineListItem[]>(
    `/hiring/pipelines${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminHiringPipeline(jobId: string) {
  return adminFetch<AdminHiringPipelineDetail>(`/hiring/jobs/${jobId}/pipeline`);
}

export async function getAdminHiringApplication(id: string) {
  return adminFetch<AdminHiringApplicationDetail>(`/hiring/applications/${id}`);
}

export async function moveHiringApplicationStage(
  id: string,
  input: {
    targetStage: "SCREENING" | "INTERVIEW" | "OFFER_SENT";
    note?: string;
  },
) {
  return adminFetch(`/hiring/applications/${id}/stage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function shortlistHiringApplication(
  id: string,
  input?: {
    note?: string;
  },
) {
  return adminFetch(`/hiring/applications/${id}/shortlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input ?? {}),
  });
}

export async function approveHiringApplication(
  id: string,
  input?: {
    reason?: string;
  },
) {
  return adminFetch(`/hiring/applications/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input ?? {}),
  });
}

export async function rejectHiringApplication(
  id: string,
  input: {
    reason: string;
  },
) {
  return adminFetch(`/hiring/applications/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export type WorkforceAssignmentStatus = "PENDING" | "ACTIVE" | "ENDED";
export type WorkforceContractLifecycleStatus =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "COMPLETED";

export type AdminWorkforceAssignment = {
  id: string;
  status: WorkforceAssignmentStatus;
  assignedAt: string;
  startedAt: string | null;
  endedAt: string | null;
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
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
  job: {
    id: string;
    title: string;
    status: string;
  };
  application: {
    id: string;
    currentStage: HiringStage;
    status: string;
    actor: {
      id: string;
      displayName: string;
      email: string;
    };
  };
  contract: {
    id: string;
    status: string;
    lifecycleStatus: WorkforceContractLifecycleStatus;
    value: string | number;
    currency: string;
    startDate: string | null;
    endDate: string | null;
  };
};

export type AdminWorkforceAssignmentDetail = AdminWorkforceAssignment & {
  timeline: Array<{
    id: string;
    eventType: string;
    metadata: unknown;
    createdAt: string;
    actorUser: {
      id: string;
      email: string;
      role: string;
    } | null;
  }>;
};

export type AdminWorkforceContractActionResult = {
  contract: {
    id: string;
    status: string;
    lifecycleStatus: WorkforceContractLifecycleStatus;
    signedAt: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  assignments: Array<{
    id: string;
    status: WorkforceAssignmentStatus;
    assignedAt: string;
    startedAt: string | null;
    endedAt: string | null;
    userId: string;
  }>;
  latestEvent: {
    id: string;
    eventType: string;
    metadata: unknown;
    createdAt: string;
    actorUser: {
      id: string;
      email: string;
      role: string;
    } | null;
  } | null;
};

export async function getAdminWorkforceAssignments(filters?: {
  q?: string;
  status?: WorkforceAssignmentStatus;
  contractStatus?: WorkforceContractLifecycleStatus;
}) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  if (filters?.contractStatus) {
    query.set("contractStatus", filters.contractStatus);
  }

  return adminFetch<AdminWorkforceAssignment[]>(
    `/workforce/assignments${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminWorkforceAssignment(id: string) {
  return adminFetch<AdminWorkforceAssignmentDetail>(`/workforce/assignments/${id}`);
}

export async function createAdminWorkforceAssignment(input: {
  applicationId: string;
  contractId: string;
  projectId?: string;
  note?: string;
}) {
  return adminFetch<AdminWorkforceAssignment>(`/workforce/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function sendWorkforceContract(id: string) {
  return adminFetch<AdminWorkforceContractActionResult>(`/workforce/contracts/${id}/send`, {
    method: "POST",
  });
}

export async function activateWorkforceContract(
  id: string,
  input?: {
    startDate?: string;
    note?: string;
  },
) {
  return adminFetch<AdminWorkforceContractActionResult>(
    `/workforce/contracts/${id}/activate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function suspendWorkforceContract(
  id: string,
  input?: {
    reason?: string;
  },
) {
  return adminFetch<AdminWorkforceContractActionResult>(
    `/workforce/contracts/${id}/suspend`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function terminateWorkforceContract(
  id: string,
  input?: {
    reason?: string;
  },
) {
  return adminFetch<AdminWorkforceContractActionResult>(
    `/workforce/contracts/${id}/terminate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input ?? {}),
    },
  );
}

export async function getWorkforceContractTimeline(id: string) {
  return adminFetch<
    Array<{
      id: string;
      eventType: string;
      metadata: unknown;
      createdAt: string;
      actorUser: {
        id: string;
        email: string;
        role: string;
      } | null;
    }>
  >(`/workforce/contracts/${id}/timeline`);
}

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

export type AdminOperationalTimesheet = {
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

export type AdminOperationalAttendanceRecord = {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: OperationalAttendanceStatus;
  source: OperationalWorkSessionSource;
  locationMetadata: unknown;
  createdAt: string;
  updatedAt: string;
  durationHours: number | null;
  user: {
    id: string;
    email: string;
  };
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

export async function getAdminOperationalTimesheets(filters?: {
  q?: string;
  status?: OperationalTimesheetStatus;
}) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  return adminFetch<AdminOperationalTimesheet[]>(
    `/admin/timesheets${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminOperationalTimesheet(id: string) {
  return adminFetch<AdminOperationalTimesheet>(`/admin/timesheets/${id}`);
}

export async function approveAdminOperationalTimesheet(
  id: string,
  input?: { note?: string },
) {
  return adminFetch<AdminOperationalTimesheet>(`/admin/timesheets/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input ?? {}),
  });
}

export async function rejectAdminOperationalTimesheet(
  id: string,
  input: { reason: string },
) {
  return adminFetch<AdminOperationalTimesheet>(`/admin/timesheets/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getAdminOperationalAttendance(filters?: { q?: string }) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  return adminFetch<AdminOperationalAttendanceRecord[]>(
    `/admin/attendance${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export type CompensationType =
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "FIXED_PROJECT";

export type PayrollCycleStatus =
  | "OPEN"
  | "PROCESSING"
  | "LOCKED"
  | "EXPORTED";

export type PayrollSettlementStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "READY_FOR_PAYMENT"
  | "PAID";

export type SettlementBillingStatus =
  | "NOT_BILLED"
  | "BILLING_EVENT_CREATED"
  | "INVOICED"
  | "PAID"
  | "CANCELLED";

export type WorkforceBillingLinkSummary = {
  id: string;
  status: SettlementBillingStatus;
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
  settlement: {
    id: string;
    status: PayrollSettlementStatus;
    netAmount: number;
    grossAmount: number;
    currency: string;
    payrollCycleId: string;
    user: {
      id: string;
      email: string;
    };
  } | null;
};

export type AdminCompensationAgreement = {
  id: string;
  compensationType: CompensationType;
  currency: string;
  baseRate: number;
  overtimeRate: number | null;
  overtimeThresholdHours: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
  assignment: AdminWorkforceAssignment | null;
};

export type AdminPayrollSettlement = {
  id: string;
  approvedTimesheetIds: string[];
  regularHours: number;
  overtimeHours: number;
  grossAmount: number;
  deductionsAmount: number;
  netAmount: number;
  currency: string;
  status: PayrollSettlementStatus;
  approvedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  payrollCycle: {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: PayrollCycleStatus;
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
  assignment: AdminWorkforceAssignment;
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
  billingLink: WorkforceBillingLinkSummary | null;
};

export type AdminPayrollCycle = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollCycleStatus;
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
  settlements: AdminPayrollSettlement[];
};

export type AdminMessageParticipant = {
  id: string;
  userId: string;
  role: string;
  unreadCount: number;
  lastReadAt: string | null;
  lastSeenAt: string | null;
  isMuted: boolean;
  isArchived: boolean;
  typingStartedAt: string | null;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export type AdminMessageAttachment = {
  id: string;
  conversationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  canPreview: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  moderatedAt: string | null;
  moderationNotes: string | null;
  createdAt: string;
};

export type AdminMessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "SYSTEM" | "FILE";
  status: "SENT" | "DELIVERED" | "READ" | "ARCHIVED" | "DELETED";
  content: string;
  metadataJson: Record<string, unknown> | string | null;
  editedAt: string | null;
  deletedAt: string | null;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  moderatedAt: string | null;
  moderationNotes: string | null;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    email: string;
    role: string;
  } | null;
  reads: Array<{
    id: string;
    messageId: string;
    userId: string;
    readAt: string;
  }>;
  attachments: AdminMessageAttachment[];
};

export type AdminMessageConversation = {
  id: string;
  projectId: string | null;
  publicPostId: string | null;
  contractId: string | null;
  disputeId: string | null;
  workforceAssignmentId: string | null;
  payrollCycleId: string | null;
  payrollSettlementId: string | null;
  reluRecommendationId: string | null;
  type: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  project: { id: string; slug: string; name: string; status: string } | null;
  publicPost: { id: string; slug: string; title: string; moderationStatus: string } | null;
  contract: { id: string; title: string; status: string } | null;
  dispute: { id: string; title: string; status: string; severity: string } | null;
  participants: AdminMessageParticipant[];
  latestMessage: AdminMessageItem | null;
  unreadCount: number;
};

export type AdminNotificationCategory =
  | "ACCOUNT"
  | "BILLING"
  | "VERIFICATION"
  | "PROJECTS"
  | "MESSAGING"
  | "WORKFORCE"
  | "PAYROLL"
  | "RELU"
  | "ADMIN";

export type AdminNotificationStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "READ"
  | "DISMISSED";

export type AdminNotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "SMS"
  | "SMS_PLACEHOLDER"
  | "PUSH"
  | "SYSTEM";

export type AdminNotificationEvent = {
  id: string;
  key: string | null;
  eventType: string;
  sourceType: string;
  sourceId: string;
  userId: string | null;
  channel: AdminNotificationChannel;
  category: AdminNotificationCategory | null;
  status: AdminNotificationStatus;
  retryCount: number;
  metadata: unknown;
  readAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  notificationCount: number;
  deliveryCount: number;
};

export type AdminNotificationDelivery = {
  id: string;
  notificationId: string | null;
  eventId: string | null;
  userId: string | null;
  channel: AdminNotificationChannel;
  status: AdminNotificationStatus;
  retryCount: number;
  metadata: unknown;
  readAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  event: {
    id: string;
    eventType: string;
    sourceType: string;
    sourceId: string;
    status: AdminNotificationStatus;
  } | null;
  notification: {
    id: string;
    title: string;
    status: AdminNotificationStatus;
  } | null;
};

export type WorkflowAutomationRun = {
  id: string;
  ruleId: string | null;
  eventId: string | null;
  triggeredByUserId: string | null;
  reviewedByUserId: string | null;
  status: string;
  inputSnapshot: unknown;
  outputData: unknown;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  event: {
    id: string;
    eventType: string;
    sourceType: string;
    sourceId: string;
    status: AdminNotificationStatus;
  } | null;
  rule: {
    id: string;
    name: string;
    eventType: string;
    channel: AdminNotificationChannel;
    isActive: boolean;
  } | null;
  triggeredBy: {
    id: string;
    email: string;
    role: string;
  } | null;
  reviewedBy: {
    id: string;
    email: string;
    role: string;
  } | null;
};

export async function createCompensationAgreement(input: {
  workforceAssignmentId: string;
  compensationType: CompensationType;
  currency: string;
  baseRate: number;
  overtimeRate?: number;
  overtimeThresholdHours?: number;
  effectiveFrom: string;
  effectiveTo?: string;
}) {
  return adminFetch<AdminCompensationAgreement>(`/admin/payroll/compensation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function createPayrollCycle(input: {
  periodStart: string;
  periodEnd: string;
}) {
  return adminFetch<AdminPayrollCycle>(`/admin/payroll/cycles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getAdminPayrollCycles(filters?: {
  status?: PayrollCycleStatus;
}) {
  const query = new URLSearchParams();

  if (filters?.status) {
    query.set("status", filters.status);
  }

  return adminFetch<AdminPayrollCycle[]>(
    `/admin/payroll/cycles${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminPayrollCycle(id: string) {
  return adminFetch<AdminPayrollCycle>(`/admin/payroll/cycles/${id}`);
}

export async function processAdminPayrollCycle(
  id: string,
  input?: { note?: string },
) {
  return adminFetch<AdminPayrollCycle>(`/admin/payroll/cycles/${id}/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input ?? {}),
  });
}

export async function getAdminPayrollSettlements(filters?: {
  q?: string;
  status?: PayrollSettlementStatus;
  cycleId?: string;
}) {
  const query = new URLSearchParams();

  if (filters?.q) {
    query.set("q", filters.q);
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  if (filters?.cycleId) {
    query.set("cycleId", filters.cycleId);
  }

  return adminFetch<AdminPayrollSettlement[]>(
    `/admin/payroll/settlements${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminPayrollSettlement(id: string) {
  return adminFetch<AdminPayrollSettlement>(`/admin/payroll/settlements/${id}`);
}

export async function approveAdminPayrollSettlement(
  id: string,
  input?: { note?: string },
) {
  return adminFetch<AdminPayrollSettlement>(`/admin/payroll/settlements/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input ?? {}),
  });
}

export async function rejectAdminPayrollSettlement(
  id: string,
  input: { reason: string },
) {
  return adminFetch<AdminPayrollSettlement>(`/admin/payroll/settlements/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function createPayrollSettlementBillingEvent(id: string) {
  return adminFetch<AdminPayrollSettlement>(
    `/admin/payroll/settlements/${id}/create-billing-event`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
}

export async function createPayrollCycleBillingEvents(id: string) {
  return adminFetch<{
    payrollCycleId: string;
    createdCount: number;
    links: WorkforceBillingLinkSummary[];
  }>(`/admin/payroll/cycles/${id}/create-billing-events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

export async function getPayrollBillingLinks(filters?: {
  cycleId?: string;
  status?: SettlementBillingStatus;
}) {
  const query = new URLSearchParams();

  if (filters?.cycleId) {
    query.set("cycleId", filters.cycleId);
  }

  if (filters?.status) {
    query.set("status", filters.status);
  }

  return adminFetch<WorkforceBillingLinkSummary[]>(
    `/admin/payroll/billing-links${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function getAdminNotificationEvents() {
  return adminFetch<AdminNotificationEvent[]>("/admin/notifications/events");
}

export async function getAdminNotificationDeliveries() {
  return adminFetch<AdminNotificationDelivery[]>("/admin/notifications/deliveries");
}

export async function retryAdminNotificationDelivery(id: string) {
  return adminFetch<AdminNotificationDelivery>(`/admin/notifications/deliveries/${id}/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

export async function getWorkflowAutomationRuns() {
  return adminFetch<WorkflowAutomationRun[]>("/admin/workflow-automation/runs");
}
