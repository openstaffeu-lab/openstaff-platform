const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.openstaff.eu"
    : "http://localhost:8080");

type StructuredSuccessResponse<T> = {
  status: "ok";
  data: T;
  source?: string;
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

  return window.localStorage.getItem("token");
}

export function getAuthToken() {
  return getStoredToken();
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
