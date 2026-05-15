"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ReluResult,
  type ReluRun,
  adminApi,
} from "@/lib/api";

type LoadState = "loading" | "ready" | "error";

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

        setMessage(error instanceof Error ? error.message : "Failed to load Relu data.");
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
      const targetSourceType = "targetSourceType" in item ? item.targetSourceType ?? "" : "";
      const targetSourceId = "targetSourceId" in item ? item.targetSourceId ?? "" : "";
      const haystack = [
        item.kind,
        item.sourceType,
        item.sourceId,
        targetSourceType,
        targetSourceId,
        item.status,
        item.domain,
        item.explanation ?? "",
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

  async function markReviewed(resultId: string) {
    setBusyKey(`review:${resultId}`);
    setMessage(null);
    try {
      await adminApi.updateAdminReluResultStatus(resultId, "REVIEWED");
      await refresh();
      setMessage("Relu result marked as reviewed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update status.");
    } finally {
      setBusyKey(null);
    }
  }

  async function overrideResult(result: ReluResult) {
    setBusyKey(`override:${result.id}`);
    setMessage(null);
    try {
      await adminApi.overrideAdminReluResult(result.id, {
        explanation: `${result.explanation ?? "Relu output"} (admin override applied)`,
        score: typeof result.score === "number" ? result.score : undefined,
        compatibilityPercent:
          result.kind === "match" && typeof result.compatibilityPercent === "number"
            ? result.compatibilityPercent
            : undefined,
      });
      await refresh();
      setMessage("Relu result overridden successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to override result.");
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
      setMessage("Relu run triggered again for the selected public post.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to rerun Relu.");
    } finally {
      setBusyKey(null);
    }
  }

  const failedCount = results.filter((item) => item.status === "FAILED").length;
  const overriddenCount = results.filter((item) => item.status === "OVERRIDDEN").length;

  return (
    <main className="space-y-8 p-8 text-white">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Relu AI
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Taxonomy, ingestion and matching review</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Persistent Relu runs and reviewable outcomes for public posts and profiles. This
          surface shows fallback executions, structured classification output, matching
          explanations, and manual admin overrides.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Runs" value={runs.length} />
        <MetricCard label="Results" value={results.length} />
        <MetricCard label="Failed" value={failedCount} accent="rose" />
        <MetricCard label="Overridden" value={overriddenCount} accent="amber" />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">
            Search by source, result kind, status, explanation
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="PUBLIC_POST, PROFILE, FAILED, match..."
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
          />
        </label>
      </section>

      {message ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm text-slate-200">
          {message}
        </section>
      ) : null}

      {state === "loading" ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading Relu runs and results...
        </section>
      ) : null}

      {state === "error" ? (
        <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          {message ?? "Failed to load Relu review data."}
        </section>
      ) : null}

      {state === "ready" ? (
        <section className="space-y-5">
          {filteredResults.map((result) => (
            <article
              key={result.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge label={result.kind.toUpperCase()} tone="cyan" />
                    <Badge label={result.domain} tone="slate" />
                    <Badge label={result.status} tone={toneForStatus(result.status)} />
                    <Badge label={result.sourceType} tone="slate" />
                    {result.fallbackUsed ? <Badge label="FALLBACK" tone="rose" /> : null}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">
                    {result.sourceId}
                    {"targetSourceId" in result && result.targetSourceId
                      ? ` -> ${result.targetSourceId}`
                      : ""}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {result.explanation ?? "No explanation persisted yet."}
                  </p>
                </div>

                <div className="grid gap-2 text-right text-sm text-slate-300">
                  <div>Created {new Date(result.createdAt).toLocaleString()}</div>
                  <div>Score {typeof result.score === "number" ? result.score : "-"}</div>
                  {"compatibilityPercent" in result ? (
                    <div>
                      Compatibility{" "}
                      {typeof result.compatibilityPercent === "number"
                        ? `${result.compatibilityPercent}%`
                        : "-"}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">
                  {JSON.stringify(result.outputData, null, 2)}
                </pre>
                <div className="space-y-3">
                  <pre className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-400">
                    {JSON.stringify(result.inputSnapshot, null, 2)}
                  </pre>
                  {result.overrideData ? (
                    <pre className="overflow-auto rounded-2xl bg-amber-500/10 p-4 text-xs text-amber-100">
                      {JSON.stringify(result.overrideData, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => void markReviewed(result.id)}
                  disabled={busyKey === `review:${result.id}`}
                  className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-500/40 hover:text-white disabled:opacity-60"
                >
                  {busyKey === `review:${result.id}` ? "Saving..." : "Mark reviewed"}
                </button>
                <button
                  onClick={() => void overrideResult(result)}
                  disabled={busyKey === `override:${result.id}`}
                  className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
                >
                  {busyKey === `override:${result.id}` ? "Overriding..." : "Override"}
                </button>
                {result.sourceType === "PUBLIC_POST" ? (
                  <button
                    onClick={() => void rerun(result)}
                    disabled={busyKey === `rerun:${result.id}`}
                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                  >
                    {busyKey === `rerun:${result.id}` ? "Running..." : "Rerun"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}

          {filteredResults.length === 0 ? (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
              No Relu results match the current filter.
            </section>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: number;
  accent?: "cyan" | "rose" | "amber";
}) {
  const tone =
    accent === "rose"
      ? "text-rose-300"
      : accent === "amber"
        ? "text-amber-300"
        : "text-cyan-200";

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
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
