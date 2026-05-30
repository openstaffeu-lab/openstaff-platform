"use client";

import { ApiError, apiRequest, getAuthToken } from "./api";

export type ReluBuilderType =
  | "summary"
  | "taxonomy"
  | "esco"
  | "nace"
  | "geography"
  | "uniclass"
  | "intent";

export type ReluBuilderStatus =
  | "idle"
  | "processing"
  | "completed"
  | "review_required"
  | "failed"
  | "unavailable";

export type ReluBuilderSuggestion = {
  key: string;
  label: string;
  description?: string;
  confidence?: number;
  source: "RELU AI suggestion";
  category?: string;
};

export type ReluBuilderResult = {
  type: ReluBuilderType;
  status: "completed" | "review_required";
  summary: string;
  suggestions: ReluBuilderSuggestion[];
  advisoryMessage: string;
};

export type ReluBuilderErrorCode =
  | "authentication_required"
  | "permission_denied"
  | "provider_unavailable"
  | "service_unavailable"
  | "request_failed";

export type ReluBuilderError = {
  code: ReluBuilderErrorCode;
  message: string;
};

type BuilderEndpoint = Exclude<ReluBuilderType, "uniclass" | "intent">;

type ReluBuilderPayload =
  | { text: string }
  | { query: string; limit?: number };

type RawReluBuilderResponse = {
  domain?: unknown;
  status?: unknown;
  outputData?: {
    response?: unknown;
    error?: unknown;
  };
};

const endpointByType: Record<BuilderEndpoint, string> = {
  summary: "/relu-ai-builder/summary",
  taxonomy: "/relu-ai-builder/taxonomy",
  esco: "/relu-ai-builder/esco",
  nace: "/relu-ai-builder/nace",
  geography: "/relu-ai-builder/geography",
};

const advisoryMessage =
  "RELU AI suggestions are advisory. Review, edit, and apply only what fits your profile or post.";

export async function runReluSummary(text: string, token?: string | null) {
  return runReluBuilder("summary", { text }, token);
}

export async function suggestReluTaxonomy(
  query: string,
  token?: string | null,
  limit = 5,
) {
  return runReluBuilder("taxonomy", { query, limit }, token);
}

export async function suggestReluEsco(query: string, token?: string | null, limit = 5) {
  return runReluBuilder("esco", { query, limit }, token);
}

export async function suggestReluNace(query: string, token?: string | null, limit = 5) {
  return runReluBuilder("nace", { query, limit }, token);
}

export async function suggestReluGeography(
  query: string,
  token?: string | null,
  limit = 5,
) {
  return runReluBuilder("geography", { query, limit }, token);
}

async function runReluBuilder(
  type: BuilderEndpoint,
  payload: ReluBuilderPayload,
  token?: string | null,
): Promise<ReluBuilderResult> {
  try {
    const raw = await apiRequest<RawReluBuilderResponse>(endpointByType[type], {
      method: "POST",
      token: token ?? getAuthToken(),
      body: payload,
    });

    return normalizeReluBuilderResponse(type, raw);
  } catch (error) {
    throw normalizeReluBuilderError(error);
  }
}

function normalizeReluBuilderResponse(
  type: BuilderEndpoint,
  raw: RawReluBuilderResponse,
): ReluBuilderResult {
  const response = sanitizeText(raw.outputData?.response);
  const status = raw.status === "COMPLETED" ? "completed" : "review_required";
  const summary = response || "RELU AI returned a suggestion that needs review.";
  const suggestions = extractSuggestions(type, summary);

  return {
    type,
    status,
    summary,
    suggestions,
    advisoryMessage,
  };
}

export function normalizeReluBuilderError(error: unknown): ReluBuilderError {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        code: "authentication_required",
        message: "Please sign in before asking RELU AI for suggestions.",
      };
    }

    if (error.status === 403) {
      return {
        code: "permission_denied",
        message: "This RELU AI tool is available only to authorized technical operators.",
      };
    }

    if (error.status === 429) {
      return {
        code: "provider_unavailable",
        message: "Provider temporarily unavailable. You can continue manually and try again later.",
      };
    }

    if (error.status >= 500) {
      return {
        code: "service_unavailable",
        message: "RELU AI is temporarily unavailable. Manual editing still works.",
      };
    }
  }

  return {
    code: "request_failed",
    message: "RELU AI could not prepare suggestions right now. Manual editing still works.",
  };
}

function extractSuggestions(
  type: BuilderEndpoint,
  text: string,
): ReluBuilderSuggestion[] {
  const parsed = parseJsonLike(text);
  const parsedSuggestions = suggestionsFromJson(type, parsed);

  if (parsedSuggestions.length > 0) {
    return parsedSuggestions.slice(0, 6);
  }

  return suggestionsFromText(type, text).slice(0, 6);
}

function parseJsonLike(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;

  if (!candidate.startsWith("{") && !candidate.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
}

function suggestionsFromJson(
  type: BuilderEndpoint,
  value: unknown,
): ReluBuilderSuggestion[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const records = Array.isArray(value)
    ? value
    : [
        ...asArray((value as Record<string, unknown>).suggestions),
        ...asArray((value as Record<string, unknown>).candidates),
        ...asArray((value as Record<string, unknown>).items),
        ...asArray((value as Record<string, unknown>)[`${type}Suggestions`]),
      ];

  return records
    .map((item, index) => normalizeSuggestion(type, item, index))
    .filter((item): item is ReluBuilderSuggestion => Boolean(item));
}

function normalizeSuggestion(
  type: BuilderEndpoint,
  item: unknown,
  index: number,
): ReluBuilderSuggestion | null {
  if (typeof item === "string") {
    const label = sanitizeText(item);
    return label
      ? {
          key: `${type}-${index}-${label}`,
          label,
          source: "RELU AI suggestion",
          category: labelForType(type),
        }
      : null;
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const code = sanitizeText(record.code);
  const title = sanitizeText(record.title ?? record.label ?? record.name);
  const description = sanitizeText(
    record.description ?? record.reason ?? record.explanation ?? record.summary,
  );
  const label = [code, title].filter(Boolean).join(" - ") || description;

  if (!label) {
    return null;
  }

  return {
    key: `${type}-${index}-${label}`,
    label,
    description: description && description !== label ? description : undefined,
    confidence: normalizeConfidence(record.confidence ?? record.score),
    source: "RELU AI suggestion",
    category: labelForType(type),
  };
}

function suggestionsFromText(type: BuilderEndpoint, text: string) {
  const lines = text
    .split(/\r?\n|;/)
    .map((line) => sanitizeText(line.replace(/^[-*\d.)\s]+/, "")))
    .filter((line) => line.length > 0 && line.length < 220);

  if (lines.length === 0 && text.trim()) {
    lines.push(sanitizeText(text).slice(0, 220));
  }

  return lines.map((line, index) => ({
    key: `${type}-${index}-${line}`,
    label: line,
    source: "RELU AI suggestion" as const,
    category: labelForType(type),
  }));
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  if (value > 1) {
    return Math.min(Math.max(value, 0), 100);
  }

  return Math.round(value * 100);
}

function labelForType(type: BuilderEndpoint) {
  const labels: Record<BuilderEndpoint, string> = {
    summary: "Profile summary",
    taxonomy: "Taxonomy",
    esco: "ESCO",
    nace: "NACE",
    geography: "Geography",
  };

  return labels[type];
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]")
    .replace(/(?:runId|entityId|actorId|agentName)\s*[:=]\s*["']?[\w-]+["']?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
