const LOCAL_API_URL = "http://localhost:8080";
const PRODUCTION_API_URL = "https://api.openstaff.eu";
const ACCESS_TOKEN_KEY = "openstaff_admin_access_token";

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

export function setAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
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
): Promise<ApiFetchResult<T>> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return {
      ok: false,
      status: 0,
      kind: "error",
      message:
        "NEXT_PUBLIC_API_URL nu este configurat pentru build-ul de producție al frontendului.",
    };
  }

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
    });

    if (response.status === 401) {
      clearAccessToken();
      redirectToLogin();

      return {
        ok: false,
        status: response.status,
        kind: "unauthorized",
        message: "Autentificare necesară. Te redirecționăm către login.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        kind: "error",
        message: `API-ul a răspuns cu status ${response.status}.`,
      };
    }

    const payload = (await response.json()) as
      | T
      | StructuredSuccessResponse<T>
      | StructuredErrorResponse;

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
      message:
        "API-ul nu răspunde sau requestul este blocat de CORS. Verifică backendul, CORS și NEXT_PUBLIC_API_URL.",
    };
  }
}

function getAuthHeader() {
  if (process.env.NODE_ENV === "development") {
    return { Authorization: "Bearer dev-token" } as Record<string, string>;
  }

  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  const token = window.localStorage.getItem("firebase-token") || getAccessToken() || "";
  return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      ...getAuthHeader(),
      ...(init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {}),
    },
    cache: "no-store",
  });

  const payload = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || `API request failed with status ${response.status}`);
  }

  return payload as T;
}

export const adminApi = {
  getJobStats: () => adminFetch(`${"/jobs/stats"}`),
  getActorStats: () => adminFetch(`${"/actors/stats"}`),
  getReluQueue: () => adminFetch(`${"/relu/queue"}`),

  getActors: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {});
    return adminFetch(`${q.toString() ? `/actors?${q.toString()}` : "/actors"}`);
  },
  getActor: (id: string) => adminFetch(`/actors/${id}`),
  verifyActor: (id: string) =>
    adminFetch(`/actors/${id}/verify`, { method: "POST" }),
  rejectActor: (id: string, reason: string) =>
    adminFetch(`/actors/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),

  getJobs: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params || {});
    return adminFetch(`${q.toString() ? `/jobs?${q.toString()}` : "/jobs"}`);
  },
  updateJobStatus: (id: string, status: string) =>
    adminFetch(`/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),

  getAgents: () => adminFetch(`/gemini/agents`),
  updateAgent: (id: string, data: any) =>
    adminFetch(`/gemini/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};
