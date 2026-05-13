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
