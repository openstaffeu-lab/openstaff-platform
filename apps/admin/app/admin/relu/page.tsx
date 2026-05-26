"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ReluResult,
  type ReluRun,
  adminApi,
} from "@/lib/api";

type LoadState = "loading" | "ready" | "error";
type Highlight = {
  label: string;
  value: string;
};

export default function AdminReluPage() {
  const [runs, setRuns] = useState<ReluRun[]>([]);
  const [results, setResults] = useState<ReluResult[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextRuns, nextResults] = await Promise.all([
          adminApi.getAdminReluRuns(),
          adminApi.getAdminReluResults(),
        ]);

        if (!active) {
          return;
        }

        setRuns(nextRuns);
        setResults(nextResults);
        setState("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(error instanceof Error ? error.message : "Failed to load RELU moderation.");
        setState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return results;
    }

    return results.filter((item) => {
      const haystack = [
        item.kind,
        item.sourceType,
        item.status,
        item.domain,
        item.explanation ?? "",
        ...extractHighlights(item.outputData).map((highlight) => highlight.value),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [query, results]);

  async function refresh() {
    const [nextRuns, nextResults] = await Promise.all([
      adminApi.getAdminReluRuns(),
      adminApi.getAdminReluResults(),
    ]);
    setRuns(nextRuns);
    setResults(nextResults);
  }

  async function approveResult(resultId: string) {
    setBusyKey(`approve:${resultId}`);
    setMessage(null);
    try {
      await adminApi.updateAdminReluResultStatus(resultId, "REVIEWED");
      await refresh();
      setMessage("RELU recommendation approved for operational use.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to approve RELU result.");
    } finally {
      setBusyKey(null);
    }
  }

  async function rejectResult(resultId: string) {
    setBusyKey(`reject:${resultId}`);
    setMessage(null);
    try {
      await adminApi.updateAdminReluResultStatus(resultId, "FAILED");
      await refresh();
      setMessage("RELU recommendation rejected and retained for audit.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to reject RELU result.");
    } finally {
      setBusyKey(null);
    }
  }

  async function adjustCategory(result: ReluResult) {
    setBusyKey(`adjust:${result.id}`);
    setMessage(null);
    try {
      const currentCategory = bestCategoryLabel(result.outputData);
      await adminApi.overrideAdminReluResult(result.id, {
        explanation: `${result.explanation ?? "RELU output"} (moderator adjusted category)`,
        score: typeof result.score === "number" ? result.score : undefined,
        compatibilityPercent:
          result.kind === "match" && typeof result.compatibilityPercent === "number"
            ? result.compatibilityPercent
            : undefined,
        category: currentCategory,
        moderatorAction: "CATEGORY_ADJUSTED",
      });
      await refresh();
      setMessage("Category adjustment saved with correction trail.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to adjust category.");
    } finally {
      setBusyKey(null);
    }
  }

  async function rerun(result: ReluResult) {
    if (result.sourceType !== "PUBLIC_POST") {
      return;
    }

    setBusyKey(`rerun:${result.id}`);
    setMessage(null);
    try {
      if (result.domain === "INGESTION") {
        await adminApi.ingestAdminPublicPostRelu(result.sourceId);
      } else {
        await adminApi.classifyAdminPublicPostRelu(result.sourceId);
      }
      await refresh();
      setMessage("RELU has been rerun for this marketplace item.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to rerun RELU.");
    } finally {
      setBusyKey(null);
    }
  }

  const failedCount = results.filter((item) => item.status === "FAILED").length;
  const overriddenCount = results.filter((item) => item.status === "OVERRIDDEN").length;
  const highConfidenceCount = results.filter((item) => getReluConfidence(item) >= 90).length;

  return (
    <main className="space-y-8 p-6 text-white md:p-8">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
          RELU AI moderation
        </p>
        <h1 className="mt-3 text-3xl font-semibold">AI Interpretation Review</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Review RELU classifications, extractions, recommendations, and matching decisions in
          operational language. Raw payloads stay out of the normal moderation workflow.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Runs" value={runs.length} />
        <MetricCard label="Results" value={results.length} />
        <MetricCard label="Needs attention" value={failedCount} accent="rose" />
        <MetricCard label="Adjusted" value={overriddenCount} accent="amber" />
        <MetricCard label="High confidence" value={highConfidenceCount} accent="emerald" />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">
            Search moderation summaries
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Electrical, profile, reviewed, low confidence..."
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
        </label>
      </section>

      {message ? (
        <section className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100">
          {humanizeError(message)}
        </section>
      ) : null}

      {state === "loading" ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
          Loading RELU moderation queue...
        </section>
      ) : null}

      {state === "error" ? (
        <section className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-6 text-sm text-amber-100">
          {humanizeError(message ?? "RELU moderation could not load.")}
        </section>
      ) : null}

      {state === "ready" ? (
        <section className="space-y-5">
          {filteredResults.map((result) => {
            const confidence = getReluConfidence(result);
            const correctionLog = buildCorrectionLog(result);
            const autoApproveEligible =
              confidence >= 90 && result.status !== "FAILED" && !result.fallbackUsed;

            return (
              <article
                key={result.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge label={formatResultKind(result.kind)} tone="cyan" />
                      <Badge label={formatLabel(result.domain)} tone="slate" />
                      <Badge label={formatLabel(result.status)} tone={toneForStatus(result.status)} />
                      <Badge
                        label={`Confidence ${confidence}%`}
                        tone={confidence >= 80 ? "emerald" : confidence >= 60 ? "amber" : "rose"}
                      />
                      {confidence < 70 ? <Badge label="Moderator approval required" tone="rose" /> : null}
                      {autoApproveEligible ? <Badge label="Auto-approve candidate" tone="emerald" /> : null}
                      {result.fallbackUsed ? <Badge label="Review source quality" tone="amber" /> : null}
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">
                      {entityLabel(result.sourceType)}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                      {result.explanation ??
                        "RELU produced an operational recommendation. Review confidence, source summary, and category fit before approval."}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-300">
                    <div>Created {formatDate(result.createdAt)}</div>
                    <div>Score {typeof result.score === "number" ? `${Math.round(result.score)}%` : "Not scored"}</div>
                    {result.kind === "match" ? (
                      <div>
                        Match{" "}
                        {typeof result.compatibilityPercent === "number"
                          ? `${Math.round(result.compatibilityPercent)}%`
                          : "not scored"}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <SourceSummary snapshot={result.inputSnapshot} />
                  <AiInterpretation result={result} />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                      Correction log
                    </div>
                    {correctionLog.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {correctionLog.map((item) => (
                          <div key={item} className="rounded-xl bg-slate-900 px-3 py-2">
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 leading-6">
                        No moderator correction is recorded yet. Category adjustments create an
                        audit entry with before/after context.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
                      AI audit trail
                    </div>
                    <p className="mt-3 leading-6">
                      This result is persisted with source type, review status, score, fallback
                      state, moderator override data, and timestamped audit events.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <ActionButton
                    label={busyKey === `approve:${result.id}` ? "Approving..." : "Approve"}
                    onClick={() => void approveResult(result.id)}
                    disabled={busyKey === `approve:${result.id}`}
                    tone="success"
                  />
                  <ActionButton
                    label={busyKey === `reject:${result.id}` ? "Rejecting..." : "Reject"}
                    onClick={() => void rejectResult(result.id)}
                    disabled={busyKey === `reject:${result.id}`}
                    tone="danger"
                  />
                  <ActionButton
                    label={busyKey === `adjust:${result.id}` ? "Saving..." : "Adjust Category"}
                    onClick={() => void adjustCategory(result)}
                    disabled={busyKey === `adjust:${result.id}`}
                    tone="warning"
                  />
                  {result.sourceType === "PUBLIC_POST" ? (
                    <ActionButton
                      label={busyKey === `rerun:${result.id}` ? "Running..." : "Rerun RELU"}
                      onClick={() => void rerun(result)}
                      disabled={busyKey === `rerun:${result.id}`}
                      tone="neutral"
                    />
                  ) : null}
                </div>
              </article>
            );
          })}

          {filteredResults.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-sm text-slate-300">
              No RELU moderation items match the current filter.
            </section>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function SourceSummary({ snapshot }: { snapshot: unknown }) {
  const highlights = extractHighlights(snapshot).slice(0, 6);
  const fileCount = countLikelyFiles(snapshot);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        Uploaded source
      </div>
      <h3 className="mt-3 text-xl font-semibold text-white">Submitted material</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">
        {fileCount > 0
          ? `${fileCount} file or document reference(s) were included for AI interpretation.`
          : "RELU used structured marketplace data for this interpretation."}
      </p>
      <div className="mt-5 grid gap-3">
        {highlights.length > 0 ? (
          highlights.map((highlight) => (
            <InfoRow key={`${highlight.label}-${highlight.value}`} label={highlight.label} value={highlight.value} />
          ))
        ) : (
          <InfoRow label="Source summary" value="No business-readable source fields were available." />
        )}
      </div>
    </section>
  );
}

function AiInterpretation({ result }: { result: ReluResult }) {
  const highlights = extractHighlights(result.outputData).slice(0, 8);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        AI interpretation
      </div>
      <h3 className="mt-3 text-xl font-semibold text-white">
        RELU matched this item with: {bestCategoryLabel(result.outputData)}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">
        Moderation decision should confirm that the interpretation fits the public entity and
        does not expose private or technical source details.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {highlights.length > 0 ? (
          highlights.map((highlight) => (
            <span
              key={`${highlight.label}-${highlight.value}`}
              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100"
            >
              {highlight.label}: {highlight.value}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
            Awaiting structured interpretation
          </span>
        )}
      </div>
    </section>
  );
}

function InfoRow({ label, value }: Highlight) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm text-slate-100">{value}</div>
    </div>
  );
}

function MetricCard({
  accent = "cyan",
  label,
  value,
}: {
  accent?: "cyan" | "rose" | "amber" | "emerald";
  label: string;
  value: number;
}) {
  const tone =
    accent === "rose"
      ? "text-rose-300"
      : accent === "amber"
        ? "text-amber-300"
        : accent === "emerald"
          ? "text-emerald-300"
          : "text-cyan-200";

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
    </article>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "cyan" | "rose" | "amber" | "emerald" | "slate";
}) {
  const className =
    tone === "rose"
      ? "bg-rose-500/20 text-rose-200"
      : tone === "amber"
        ? "bg-amber-500/20 text-amber-200"
        : tone === "emerald"
          ? "bg-emerald-500/20 text-emerald-200"
          : tone === "cyan"
            ? "bg-cyan-500/20 text-cyan-200"
            : "bg-slate-800 text-slate-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function ActionButton({
  disabled,
  label,
  onClick,
  tone,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  tone: "success" | "danger" | "warning" | "neutral";
}) {
  const className =
    tone === "success"
      ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200"
      : tone === "danger"
        ? "bg-rose-300 text-slate-950 hover:bg-rose-200"
        : tone === "warning"
          ? "bg-amber-300 text-slate-950 hover:bg-amber-200"
          : "border border-slate-700 text-slate-100 hover:border-cyan-400/40";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}

function toneForStatus(status: string): "emerald" | "rose" | "amber" | "slate" {
  if (status === "COMPLETED" || status === "REVIEWED") {
    return "emerald";
  }

  if (status === "FAILED") {
    return "rose";
  }

  if (status === "OVERRIDDEN") {
    return "amber";
  }

  return "slate";
}

function getReluConfidence(result: ReluResult) {
  if (typeof result.score === "number") {
    return Math.max(0, Math.min(100, Math.round(result.score)));
  }

  if (
    result.kind === "match" &&
    "compatibilityPercent" in result &&
    typeof result.compatibilityPercent === "number"
  ) {
    return Math.max(0, Math.min(100, Math.round(result.compatibilityPercent)));
  }

  return result.status === "COMPLETED" || result.status === "REVIEWED" ? 82 : 48;
}

function buildCorrectionLog(result: ReluResult) {
  if (!result.overrideData || typeof result.overrideData !== "object") {
    return [];
  }

  const override = result.overrideData as Record<string, unknown>;
  return Object.entries(override)
    .filter(([key]) => !isTechnicalKey(key))
    .slice(0, 5)
    .map(([key, value]) => `${formatLabel(key)} changed to ${formatCorrectionValue(value)}`);
}

function extractHighlights(value: unknown, prefix = ""): Highlight[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const output: Highlight[] = [];
  const entries = Object.entries(value as Record<string, unknown>);

  for (const [key, item] of entries) {
    if (output.length >= 12 || isTechnicalKey(key)) {
      continue;
    }

    const label = formatLabel(prefix ? `${prefix} ${key}` : key);

    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      const formatted = formatBusinessValue(item);
      if (formatted) {
        output.push({ label, value: formatted });
      }
      continue;
    }

    if (Array.isArray(item)) {
      const values = item
        .filter((entry) => typeof entry === "string" || typeof entry === "number")
        .map((entry) => formatBusinessValue(entry))
        .filter(Boolean)
        .slice(0, 4);

      if (values.length > 0) {
        output.push({ label, value: values.join(", ") });
      }
      continue;
    }

    output.push(...extractHighlights(item, key));
  }

  return output;
}

function bestCategoryLabel(value: unknown) {
  const highlights = extractHighlights(value);
  const category = highlights.find((item) =>
    /category|classification|industry|occupation|trade|label|name/i.test(item.label),
  );

  return category?.value ?? "moderator-selected category";
}

function countLikelyFiles(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  let count = 0;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (/file|document|media|upload|asset/i.test(key) && Array.isArray(item)) {
      count += item.length;
    } else if (item && typeof item === "object") {
      count += countLikelyFiles(item);
    }
  }

  return count;
}

function isTechnicalKey(key: string) {
  return /(^id$|uuid|sourceid|targetsourceid|runid|taskid|userid|hash|token|storage|bucket|gcs|raw|json)/i.test(
    key,
  );
}

function formatBusinessValue(value: string | number | boolean) {
  const stringValue = String(value).trim();
  if (!stringValue || /gcs:\/\//i.test(stringValue)) {
    return null;
  }

  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(stringValue)) {
    return null;
  }

  if (stringValue.length > 90) {
    return `${stringValue.slice(0, 87)}...`;
  }

  return stringValue;
}

function formatCorrectionValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "empty";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "updated structured value";
}

function formatResultKind(kind: string) {
  if (kind === "classification") {
    return "Classification";
  }

  if (kind === "recommendation") {
    return "Recommendation";
  }

  return "Compatibility match";
}

function entityLabel(sourceType: string) {
  if (sourceType === "PUBLIC_POST") {
    return "Marketplace listing";
  }

  if (sourceType === "PROFILE") {
    return "Public profile";
  }

  if (sourceType === "PROJECT") {
    return "Project workspace";
  }

  if (sourceType === "DOCUMENT") {
    return "Uploaded document";
  }

  return "OpenStaff entity";
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanizeError(message: string) {
  if (/internal server error/i.test(message)) {
    return "RELU moderation is temporarily unavailable. The workspace remains stable while you retry.";
  }

  return message;
}
