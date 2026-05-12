const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.openstaff.eu"
    : "http://localhost:8080");

const AUTH_TOKEN_KEY = "openstaff_web_access_token";
const REFRESH_TOKEN_KEY = "openstaff_web_refresh_token";

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
  subscription?: unknown;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
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
};

export function getApiUrl() {
  return API_URL;
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
}

export function getAuthToken() {
  return getStoredToken();
}

export function getRefreshToken() {
  return getStoredRefreshToken();
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
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function refreshAuthToken(refreshToken?: string | null) {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: {
      refreshToken: refreshToken ?? getRefreshToken(),
    },
  });
}

export async function logoutAccount(token?: string | null) {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    token: token ?? getAuthToken(),
  });
}

export async function fetchCurrentUser(token?: string | null) {
  try {
    return await apiRequest<AuthUser>("/auth/me", {
      token: token ?? getAuthToken(),
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const authResponse = await refreshAuthToken();
    setStoredToken(authResponse.accessToken);
    setStoredRefreshToken(authResponse.refreshToken);

    return apiRequest<AuthUser>("/auth/me", {
      token: authResponse.accessToken,
    });
  }
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
  try {
    const posts = await getPublicPosts({ type: "PROJECT", status: "LIVE" });
    return { data: posts.slice(0, limit ?? posts.length), source: "api" as const };
  } catch {
    const fallback = await getJobs({ status: "LIVE", limit: limit ?? 12 });
    return {
      data: Array.isArray(fallback.data)
        ? fallback.data.map((job: Record<string, unknown>) => mapLegacyJobToMarketplace(job))
        : [],
      source: "fallback" as const,
    };
  }
}

export async function getMarketplaceProfessionals(limit?: number) {
  try {
    const [professionals, pools] = await Promise.all([
      getPublicPosts({ type: "PROFESSIONAL", status: "LIVE" }),
      getPublicPosts({ type: "SUBCONTRACTOR_POOL", status: "LIVE" }),
    ]);

    return {
      data: [...professionals, ...pools].slice(0, limit ?? professionals.length + pools.length),
      source: "api" as const,
    };
  } catch {
    const fallback = await getActors({ verified: true });
    return {
      data: Array.isArray(fallback.data)
        ? fallback.data.map((actor: Record<string, unknown>) => mapLegacyActorToMarketplace(actor))
        : [],
      source: "fallback" as const,
    };
  }
}

export async function getMarketplaceProject(id: string) {
  try {
    return { data: await getPublicPost(id), source: "api" as const };
  } catch {
    const fallback = await getJob(id);
    return {
      data: fallback ? mapLegacyJobToMarketplace(fallback as Record<string, unknown>) : null,
      source: "fallback" as const,
    };
  }
}

export async function getMarketplaceProfessional(id: string) {
  try {
    return { data: await getPublicPost(id), source: "api" as const };
  } catch {
    const fallback = await getActor(id);
    return {
      data: fallback ? mapLegacyActorToMarketplace(fallback as Record<string, unknown>) : null,
      source: "fallback" as const,
    };
  }
}

export async function getMarketplaceFeed(params?: {
  type?: "PROJECT" | "PROFESSIONAL" | "SUBCONTRACTOR_POOL";
  status?: string;
}) {
  try {
    const posts = await getPublicPosts(params);
    return { data: posts, total: posts.length, source: "api" as const };
  } catch {
    if (params?.type === "PROJECT") {
      const fallback = await getJobs({ status: params.status ?? "LIVE", limit: 999 });
      const data = Array.isArray(fallback.data)
        ? fallback.data.map((job: Record<string, unknown>) => mapLegacyJobToMarketplace(job))
        : [];
      return { data, total: data.length, source: "fallback" as const };
    }

    const fallback = await getActors({ verified: true });
    const data = Array.isArray(fallback.data)
      ? fallback.data.map((actor: Record<string, unknown>) => mapLegacyActorToMarketplace(actor))
      : [];
    return { data, total: data.length, source: "fallback" as const };
  }
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
